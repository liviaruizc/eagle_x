import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import { fetchTrackName } from "../services/track/trackService.js";
import { fetchTrackResultsReport, filterTrackResults } from "../services/results/resultsService.js";

function formatScore(value) {
    if (value == null) return "-";
    return Number(value).toFixed(2);
}

function downloadCsv(filename, headers, rows) {
    const escape = (val) => {
        const str = val == null ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };
    const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const PHASE_OPTIONS = [
    { value: "all", label: "All Questions" },
    { value: "pre_scoring", label: "Pre-Scoring Only" },
    { value: "event_scoring", label: "Event Scoring Only" },
];

export default function TrackResultsPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId } = useParams();

    const [trackName, setTrackName] = useState("Track");
    const [submissions, setSubmissions] = useState([]);
    const [rankingsByPhase, setRankingsByPhase] = useState({});
    const [selectedPhase, setSelectedPhase] = useState("pre_scoring");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [filterFacets, setFilterFacets] = useState([]);
    const [selectedFiltersByFacetId, setSelectedFiltersByFacetId] = useState({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTrackResults() {
            setError("");
            setIsLoading(true);

            try {
                const [name, report] = await Promise.all([
                    fetchTrackName(trackId),
                    fetchTrackResultsReport(trackId),
                ]);

                setTrackName(name || "Track");
                setSubmissions(report.submissions ?? []);
                setRankingsByPhase(report.rankingsByPhase ?? {});
                setSelectedCategory((report.rankingsByPhase?.all?.categories ?? [])[0] ?? "");
                setFilterFacets(report.filterFacets ?? []);
                setSelectedFiltersByFacetId(report.defaultSelectedFiltersByFacetId ?? {});
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load track results.");
            } finally {
                setIsLoading(false);
            }
        }

        if (trackId) {
            loadTrackResults();
        }
    }, [trackId]);

    const allRankings = rankingsByPhase.all ?? { overallRankings: [], categoryRankingsByCategory: {}, categories: [] };
    const phaseRankings = rankingsByPhase[selectedPhase] ?? { overallRankings: [], categoryRankingsByCategory: {}, categories: [] };

    function setFacetFilter(facetId, token) {
        setSelectedFiltersByFacetId((prev) => ({
            ...prev,
            [facetId]: token || "",
        }));
    }

    function clearFilters() {
        setSelectedFiltersByFacetId({});
    }

    const filteredSubmissionIdSet = useMemo(() => {
        const filtered = filterTrackResults(submissions, selectedFiltersByFacetId);
        return new Set(filtered.map((submission) => submission.submissionId));
    }, [submissions, selectedFiltersByFacetId]);

    const filteredOverallRankings = useMemo(
        () => allRankings.overallRankings.filter((row) => filteredSubmissionIdSet.has(row.submissionId)),
        [allRankings, filteredSubmissionIdSet]
    );

    const filteredCategoryRankings = useMemo(() => {
        const selectedRows = allRankings.categoryRankingsByCategory[selectedCategory] ?? [];
        return selectedRows.filter((row) => filteredSubmissionIdSet.has(row.submissionId));
    }, [allRankings, filteredSubmissionIdSet, selectedCategory]);

    const filteredPhaseRankings = useMemo(
        () => phaseRankings.overallRankings.filter((row) => filteredSubmissionIdSet.has(row.submissionId)),
        [phaseRankings, filteredSubmissionIdSet]
    );

    return (
        <div className="text-center text-bold text-5xl">
            Track Results
            <Card>
                <CardTitle>Scoring Reports</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/events/${eventInstanceId}`)}
                        >
                            Back to Event
                        </Button>
                    </div>

                    <p className="mb-4 text-left text-sm text-gray-500">Track: {trackName}</p>

                    {isLoading && <p className="text-sm text-gray-500">Loading results...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {!isLoading && !error && (
                        <div className="space-y-4 text-left">
                            <section className="rounded border p-3">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="font-semibold">Segmented Filters</p>
                                    <Button type="button" variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                </div>

                                {!filterFacets.length && (
                                    <p className="text-sm text-gray-500">
                                        No facet filters available for this track.
                                    </p>
                                )}

                                {!!filterFacets.length && (
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {filterFacets.map((facet) => (
                                            <label key={facet.facetId} className="text-sm text-gray-700">
                                                {facet.name || facet.code}
                                                <select
                                                    className="mt-1 w-full rounded border p-2"
                                                    value={selectedFiltersByFacetId[facet.facetId] || ""}
                                                    onChange={(event) =>
                                                        setFacetFilter(facet.facetId, event.target.value)
                                                    }
                                                >
                                                    <option value="">All</option>
                                                    {(facet.options ?? []).map((option) => (
                                                        <option key={`${facet.facetId}-${option.token}`} value={option.token}>
                                                            {option.label} ({option.count})
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="rounded border p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="font-semibold">Overall Rankings</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!filteredOverallRankings.length}
                                        onClick={() => downloadCsv(
                                            `${trackName}-overall-rankings.csv`,
                                            ["Rank", "Submission", "# Evaluations", "Overall Score", "Phase"],
                                            filteredOverallRankings.map((row) => [row.rank ?? "", row.title, row.scoreCount, formatScore(row.totalScore), row.status])
                                        )}
                                    >
                                        Export CSV
                                    </Button>
                                </div>

                                {!filteredOverallRankings.length && (
                                    <p className="text-sm text-gray-500">No ranked submissions for current filters.</p>
                                )}

                                {!!filteredOverallRankings.length && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="px-2 py-1">Rank</th>
                                                    <th className="px-2 py-1">Submission</th>
                                                    <th className="px-2 py-1"># Evaluations</th>
                                                    <th className="px-2 py-1">Overall Score</th>
                                                    <th className="px-2 py-1">Phase</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredOverallRankings.map((row) => (
                                                    <tr
                                                        key={`overall-${row.submissionId}`}
                                                        className="cursor-pointer border-b hover:bg-gray-50"
                                                        onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/submissions/${row.submissionId}/evaluations`)}
                                                    >
                                                        <td className="px-2 py-1">{row.rank ?? "-"}</td>
                                                        <td className="px-2 py-1">{row.title}</td>
                                                        <td className="px-2 py-1">{row.scoreCount}</td>
                                                        <td className="px-2 py-1">{formatScore(row.totalScore)}</td>
                                                        <td className="px-2 py-1">{row.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <section className="rounded border p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="font-semibold">Category-Based Report</p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!filteredCategoryRankings.length}
                                            onClick={() => downloadCsv(
                                                `${trackName}-category-${selectedCategory}-rankings.csv`,
                                                ["Rank", "Submission", "# Evaluations", "Category Total", "Category Avg", "Overall Avg", "Phase"],
                                                filteredCategoryRankings.map((row) => [row.rank ?? "", row.title, row.categoryCount, formatScore(row.categorySum), formatScore(row.categoryScore), formatScore(row.totalScore), row.status])
                                            )}
                                        >
                                            Export CSV
                                        </Button>
                                        <select
                                            className="rounded border p-2 text-sm"
                                            value={selectedCategory}
                                            onChange={(event) => setSelectedCategory(event.target.value)}
                                            disabled={!allRankings.categories.length}
                                        >
                                            {!allRankings.categories.length && <option value="">No categories</option>}
                                            {allRankings.categories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {!selectedCategory && (
                                    <p className="text-sm text-gray-500">No rubric categories available.</p>
                                )}

                                {!!selectedCategory && !filteredCategoryRankings.length && (
                                    <p className="text-sm text-gray-500">No category scores for current filters.</p>
                                )}

                                {!!selectedCategory && !!filteredCategoryRankings.length && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="px-2 py-1">Rank</th>
                                                    <th className="px-2 py-1">Submission</th>
                                                    <th className="px-2 py-1"># Evaluations</th>
                                                    <th className="px-2 py-1">Category Total</th>
                                                    <th className="px-2 py-1">Category Avg</th>
                                                    <th className="px-2 py-1">Overall Avg</th>
                                                    <th className="px-2 py-1">Phase</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCategoryRankings.map((row) => (
                                                    <tr
                                                        key={`category-${selectedCategory}-${row.submissionId}`}
                                                        className="cursor-pointer border-b hover:bg-gray-50"
                                                        onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/submissions/${row.submissionId}/evaluations`)}
                                                    >
                                                        <td className="px-2 py-1">{row.rank ?? "-"}</td>
                                                        <td className="px-2 py-1">{row.title}</td>
                                                        <td className="px-2 py-1">{row.categoryCount}</td>
                                                        <td className="px-2 py-1">{formatScore(row.categorySum)}</td>
                                                        <td className="px-2 py-1">{formatScore(row.categoryScore)}</td>
                                                        <td className="px-2 py-1">{formatScore(row.totalScore)}</td>
                                                        <td className="px-2 py-1">{row.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            <section className="rounded border p-3">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="font-semibold">Phase Rankings</p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!filteredPhaseRankings.length}
                                            onClick={() => downloadCsv(
                                                `${trackName}-phase-${selectedPhase}-rankings.csv`,
                                                ["Rank", "Submission", "# Evaluations", "Overall Avg", "Phase"],
                                                filteredPhaseRankings.map((row) => [row.rank ?? "", row.title, row.scoreCount, formatScore(row.totalScore), row.status])
                                            )}
                                        >
                                            Export CSV
                                        </Button>
                                        <select
                                            className="rounded border p-2 text-sm"
                                            value={selectedPhase}
                                            onChange={(event) => setSelectedPhase(event.target.value)}
                                        >
                                            {PHASE_OPTIONS.filter((o) => o.value !== "all").map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {!filteredPhaseRankings.length && (
                                    <p className="text-sm text-gray-500">No ranked submissions for current filters.</p>
                                )}

                                {!!filteredPhaseRankings.length && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="px-2 py-1">Rank</th>
                                                    <th className="px-2 py-1">Submission</th>
                                                    <th className="px-2 py-1"># Evaluations</th>
                                                    <th className="px-2 py-1">Overall Avg.</th>
                                                    <th className="px-2 py-1">Phase</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPhaseRankings.map((row) => (
                                                    <tr
                                                        key={`phase-${row.submissionId}`}
                                                        className="cursor-pointer border-b hover:bg-gray-50"
                                                        onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/submissions/${row.submissionId}/evaluations`)}
                                                    >
                                                        <td className="px-2 py-1">{row.rank ?? "-"}</td>
                                                        <td className="px-2 py-1">{row.title}</td>
                                                        <td className="px-2 py-1">{row.scoreCount}</td>
                                                        <td className="px-2 py-1">{formatScore(row.totalScore)}</td>
                                                        <td className="px-2 py-1">{row.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
