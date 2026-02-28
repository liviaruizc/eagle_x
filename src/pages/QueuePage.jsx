import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import {
    fetchQueueSubmissionsForJudge,
    filterQueueSubmissions,
} from "../services/queue/queueService.js";
import { getJudgeSession } from "../services/judgeSession.js";

export default function QueuePage() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const trackId = String(searchParams.get("trackId") ?? "");

    console.log("QueuePage rendered with trackId:", trackId);


    const [allSubmissions, setAllSubmissions] = useState([]);
    const [filterFacets, setFilterFacets] = useState([]);
    const [defaultSelectedFiltersByFacetId, setDefaultSelectedFiltersByFacetId] = useState({});
    const [selectedFiltersByFacetId, setSelectedFiltersByFacetId] = useState({});

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [judgePersonId, setJudgePersonId] = useState("");

    const filteredSubmissions = useMemo(() => {
        const byFacetFilters = filterQueueSubmissions(allSubmissions, selectedFiltersByFacetId);

        if (!judgePersonId) {
            return byFacetFilters;
        }

        return byFacetFilters.filter(
            (submission) => submission.supervisorPersonId !== judgePersonId
        );
    }, [allSubmissions, selectedFiltersByFacetId, judgePersonId]);

    useEffect(() => {
        async function loadQueueSubmissions() {
            setError("");
            setIsLoading(true);

            if (!trackId) {
                setError("No track selected. Please choose a track to judge.");
                setIsLoading(false);
                return;
            }


            try {
                const judgeSession = getJudgeSession();
                alert(`Loaded judge session: ${JSON.stringify(judgeSession)}`);
                const judgePersonId = judgeSession?.personId;
                const eventInstanceId = judgeSession?.eventInstanceId;

                if (!judgePersonId || !eventInstanceId) {
                    setError("No active judge profile found. Please sign up first.");
                    return;
                }

                setJudgePersonId(judgePersonId);

                const queueData = await fetchQueueSubmissionsForJudge({
                    judgePersonId,
                    eventInstanceId,
                    trackId,
                });

                setAllSubmissions(queueData.submissions ?? []);
                setFilterFacets(queueData.filterFacets ?? []);
                setDefaultSelectedFiltersByFacetId(queueData.defaultSelectedTokensByFacetId ?? {});
                setSelectedFiltersByFacetId(queueData.defaultSelectedTokensByFacetId ?? {});
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load eligible submissions right now.");
            } finally {
                setIsLoading(false);
            }
        }

        loadQueueSubmissions();
    }, [trackId]);


    function setFacetFilterToken(facetId, token) {
        setSelectedFiltersByFacetId((prev) => ({
            ...prev,
            [facetId]: token ? [token] : [],
        }));
    }

    function clearFilters() {
        setSelectedFiltersByFacetId({});
    }

    function resetToAssignedFilters() {
        setSelectedFiltersByFacetId(defaultSelectedFiltersByFacetId);
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
            <header className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Queue</h1>
                    <p className="text-sm text-gray-600">
                        {filteredSubmissions.length} of {allSubmissions.length} eligible submissions shown
                    </p>
                </div>

                <Button variant="primary" onClick={handlePullNext} disabled={isLoading || !filteredSubmissions.length}>
                    Pull Next
                </Button>
            </header>

            <section className="mb-4 rounded border bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium">Submission Filters</p>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={resetToAssignedFilters}>
                            Reset to My Filters
                        </Button>
                        <Button type="button" variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>

                {!filterFacets.length && (
                    <p className="text-sm text-gray-500">
                        No filter facets configured for current submissions.
                    </p>
                )}

                {!!filterFacets.length && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filterFacets.map((facet) => (
                            <div key={facet.facetId} className="rounded border p-3">
                                <p className="text-sm font-medium">
                                    {facet.name || facet.code}
                                </p>

                                <select
                                    className="mt-2 w-full rounded border p-2 text-sm"
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
                    <p className="mt-3 text-xs text-gray-500">
                        No filters selected. Showing all eligible submissions.
                    </p>
                )}
            </section>

            <section className="space-y-3">
                {isLoading && <p className="text-sm text-gray-500">Loading queue...</p>}

                {!isLoading && !filteredSubmissions.length && (
                    <p className="text-sm text-gray-500">No submissions match the current filters.</p>
                )}

                {filteredSubmissions.map((submission) => (
                    <article key={submission.submissionId} className="rounded border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold">{submission.title}</p>
                                <p className="text-xs text-gray-500">
                                    Track: {submission.trackName}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
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
                                        className="rounded border px-2 py-1 text-xs text-gray-600"
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

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
