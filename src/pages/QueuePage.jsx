import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import {
    fetchQueueSubmissionsForJudge,
    filterQueueSubmissions,
} from "../services/queue/queueService.js";

const DEBUG_LOGS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === "true";
const QUEUE_REFRESH_INTERVAL_MS = 1000;

function cloneFiltersMap(filters) {
    if (!filters || typeof filters !== "object") return {};
    return JSON.parse(JSON.stringify(filters));
}


export default function QueuePage() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const trackId = String(searchParams.get("trackId") ?? "");

    if (DEBUG_LOGS) {
        console.log("QueuePage rendered with trackId:", trackId);
    }


    const [allSubmissions, setAllSubmissions] = useState([]);
    const [filterFacets, setFilterFacets] = useState([]);
    const [defaultSelectedFiltersByFacetId, setDefaultSelectedFiltersByFacetId] = useState({});
    const [selectedFiltersByFacetId, setSelectedFiltersByFacetId] = useState({});

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [judgePersonId, setJudgePersonId] = useState("");
    const hasInitializedFiltersRef = useRef(false);

    const availableFilterFacets = useMemo(() => {
        const facetMap = new Map();

        // Build options from all currently loaded submissions, not from selected/default filters.
        for (const submission of allSubmissions) {
            for (const facet of submission.facets ?? []) {
                const facetId = facet.facetId;
                if (!facetId) continue;

                if (!facetMap.has(facetId)) {
                    facetMap.set(facetId, {
                        facetId,
                        code: facet.code || "",
                        name: facet.name || "",
                        optionsMap: new Map(),
                    });
                }

                const facetEntry = facetMap.get(facetId);
                const existing = facetEntry.optionsMap.get(facet.token);
                facetEntry.optionsMap.set(facet.token, {
                    token: facet.token,
                    label: facet.label,
                    count: (existing?.count ?? 0) + 1,
                });
            }
        }

        // Preserve zero-count defaults already sent by service (for reset-to-assigned behavior).
        for (const serviceFacet of filterFacets) {
            if (!facetMap.has(serviceFacet.facetId)) {
                facetMap.set(serviceFacet.facetId, {
                    facetId: serviceFacet.facetId,
                    code: serviceFacet.code || "",
                    name: serviceFacet.name || "",
                    optionsMap: new Map(),
                });
            }

            const facetEntry = facetMap.get(serviceFacet.facetId);
            for (const option of serviceFacet.options ?? []) {
                if (!facetEntry.optionsMap.has(option.token)) {
                    facetEntry.optionsMap.set(option.token, {
                        token: option.token,
                        label: option.label,
                        count: option.count ?? 0,
                    });
                }
            }
        }

        return [...facetMap.values()]
            .map((facet) => ({
                facetId: facet.facetId,
                code: facet.code,
                name: facet.name,
                options: [...facet.optionsMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
            }))
            .sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));
    }, [allSubmissions, filterFacets]);

    const filteredSubmissions = useMemo(() => {
        const byFacetFilters = filterQueueSubmissions(allSubmissions, selectedFiltersByFacetId);

        const visible = !judgePersonId
            ? byFacetFilters
            : byFacetFilters.filter(
            (submission) => submission.supervisorPersonId !== judgePersonId
        );

        return [...visible].sort((a, b) => {
            if (a.isBeingScored !== b.isBeingScored) {
                return a.isBeingScored ? 1 : -1;
            }

            const scoreCountDelta = (a.scoreCount ?? 0) - (b.scoreCount ?? 0);
            if (scoreCountDelta !== 0) return scoreCountDelta;

            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return aTime - bTime;
        });
    }, [allSubmissions, selectedFiltersByFacetId, judgePersonId]);

    useEffect(() => {
        async function loadQueueSubmissions({ showLoading }) {
            if (showLoading) {
                setError("");
                setIsLoading(true);
            }

            if (!trackId) {
                setError("No track selected. Please choose a track to judge.");
                setIsLoading(false);
                return;
            }


            try {
                // const judgeSession = supabase.auth.getSession();
                // alert(`Loaded judge session: ${JSON.stringify(judgeSession)}`);
                const judgePersonId = sessionStorage.getItem("auth_person_id");
                const eventInstanceId = sessionStorage.getItem("judge_event_instance_id");

                if (!judgePersonId || !eventInstanceId) {
                    setError("No active judge profile found. Please sign up first.");
                    return;
                }

                setJudgePersonId(judgePersonId);
                sessionStorage.setItem("judge_track_id", trackId);

                const queueData = await fetchQueueSubmissionsForJudge({
                    judgePersonId,
                    eventInstanceId,
                    trackId,
                });

                const judgeDefaults = cloneFiltersMap(queueData.defaultSelectedTokensByFacetId ?? {});

                setAllSubmissions(queueData.submissions ?? []);
                setFilterFacets(queueData.filterFacets ?? []);
                setDefaultSelectedFiltersByFacetId(judgeDefaults);
                sessionStorage.setItem(`queue_default_filters_${trackId}`, JSON.stringify(judgeDefaults));

                if (!hasInitializedFiltersRef.current) {
                    const storageKey = `queue_filters_${trackId}`;
                    const savedFilters = sessionStorage.getItem(storageKey);
                    setSelectedFiltersByFacetId(
                        savedFilters ? JSON.parse(savedFilters) : judgeDefaults
                    );
                    hasInitializedFiltersRef.current = true;
                }
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load eligible submissions right now.");
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        }

        hasInitializedFiltersRef.current = false;
        loadQueueSubmissions({ showLoading: true });

        const refreshId = window.setInterval(() => {
            loadQueueSubmissions({ showLoading: false });
        }, QUEUE_REFRESH_INTERVAL_MS);

        return () => {
            window.clearInterval(refreshId);
        };
    }, [trackId]);


    function persistFilters(filters) {
        sessionStorage.setItem(`queue_filters_${trackId}`, JSON.stringify(filters));
    }

    function setFacetFilterToken(facetId, token) {
        setSelectedFiltersByFacetId((prev) => {
            const next = { ...prev, [facetId]: token ? [token] : [] };
            persistFilters(next);
            return next;
        });
    }

    function clearFilters() {
        sessionStorage.removeItem(`queue_filters_${trackId}`);
        setSelectedFiltersByFacetId({});
    }

    function resetToAssignedFilters() {
        const storedDefaults = sessionStorage.getItem(`queue_default_filters_${trackId}`);
        const resolvedDefaults = storedDefaults
            ? cloneFiltersMap(JSON.parse(storedDefaults))
            : cloneFiltersMap(defaultSelectedFiltersByFacetId);

        persistFilters(resolvedDefaults);
        setSelectedFiltersByFacetId(resolvedDefaults);
    }

    function hasAnySelectedFilters() {
        return Object.values(selectedFiltersByFacetId).some((tokens) => (tokens ?? []).length > 0);
    }

    async function handlePullNext() {
        setError("");

        try {
            if (!filteredSubmissions.length) {
                alert("No submissions match your current filters.");
                return;
            }

            const targetId = filteredSubmissions[0].submissionId;
            navigate(`/score/${targetId}`);
        } catch (err) {
            console.error(err);
            setError("Could not check submissions right now. Please try again.");
        }
    }

    return (
        <div className="mx-auto max-w-5xl p-6">
            <header className="mb-6 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-[#004785]">Judging Queue</h1>
                    <p className="text-sm text-[#55616D] mt-1">
                        {filteredSubmissions.length} of {allSubmissions.length} eligible submissions shown
                    </p>
                </div>

                <Button variant="primary" onClick={handlePullNext} disabled={isLoading || !filteredSubmissions.length}>
                    Pull Next
                </Button>
            </header>

            <section className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-md p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#004785]">Submission Filters</p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={resetToAssignedFilters}>
                            Reset to My Filters
                        </Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>

                {!availableFilterFacets.length && (
                    <p className="text-sm text-[#55616D]">
                        No filter facets configured for current submissions.
                    </p>
                )}

                {!!availableFilterFacets.length && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {availableFilterFacets.map((facet) => (
                            <div key={facet.facetId} className="rounded-xl border border-gray-200 p-3 bg-[#F3F3F3]">
                                <p className="text-sm font-semibold text-[#004785]">
                                    {facet.name || facet.code}
                                </p>
                                <select
                                    className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                    value={(selectedFiltersByFacetId[facet.facetId] ?? [])[0] ?? ""}
                                    onChange={(event) =>
                                        setFacetFilterToken(facet.facetId, event.target.value)
                                    }
                                >
                                    <option value="">All</option>
                                    {(facet.options ?? []).map((option) => (
                                        <option key={`${facet.facetId}-${option.token}`} value={option.token}>
                                            {option.label} ({option.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {!hasAnySelectedFilters() && (
                    <p className="mt-3 text-xs text-[#55616D]">
                        No filters selected — showing all eligible submissions.
                    </p>
                )}
            </section>

            <section className="space-y-4">
                {isLoading && <p className="text-[#55616D] text-center py-6">Loading queue...</p>}

                {!isLoading && !filteredSubmissions.length && (
                    <p className="text-[#55616D] text-center py-6">No submissions match the current filters.</p>
                )}

                {filteredSubmissions.map((submission) => (
                    <article
                        key={submission.submissionId}
                        className="rounded-2xl border border-gray-200 bg-white shadow-md p-5 hover:shadow-lg transition"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <p className="font-bold text-[#004785] text-lg leading-snug">{submission.title}</p>
                                <p className="text-xs text-[#55616D]">Track: {submission.trackName}</p>
                                <p className="text-xs text-[#55616D]">Scores received: {submission.scoreCount ?? 0}</p>
                                {submission.isBeingScored && (
                                    <p className="text-xs font-semibold text-[#CCAB00]">
                                        Currently being scored
                                    </p>
                                )}
                                {submission.tableNumber != null && (
                                    <p className="text-xs font-semibold text-[#00794C]">
                                        Table {submission.tableNumber}
                                        {submission.tableSession ? ` · Session ${submission.tableSession}` : ""}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => navigate(`/score/${submission.submissionId}`)}
                            >
                                Score
                            </Button>
                        </div>

                        {!!submission.facets?.length && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {submission.facets.map((facet) => (
                                    <span
                                        key={`${submission.submissionId}-${facet.facetId}-${facet.token}`}
                                        className="rounded-full bg-[#004785]/10 px-3 py-1 text-xs font-medium text-[#004785]"
                                    >
                                        {(facet.name || facet.code) ? `${facet.name || facet.code}: ` : ""}
                                        {facet.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </article>
                ))}
            </section>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
    );
}
