import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";

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
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}`)}>
                    ← Back to Event
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#004785]">Results</h1>
                <p className="text-[#55616D] mt-1 text-sm">Track: <span className="font-semibold">{trackName}</span></p>
            </div>

            {isLoading && <p className="text-[#55616D] text-center py-10">Loading results...</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {!isLoading && !error && (
                <div className="space-y-6">

                    {/* Filters */}
                    <section className="rounded-2xl border border-gray-200 bg-white shadow-md p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="font-bold text-[#004785]">Segmented Filters</p>
                            <Button type="button" variant="outline" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        </div>
                        {!filterFacets.length && (
                            <p className="text-sm text-[#55616D]">No facet filters available for this track.</p>
                        )}
                        {!!filterFacets.length && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {filterFacets.map((facet) => (
                                    <label key={facet.facetId} className="text-sm font-semibold text-[#004785]">
                                        {facet.name || facet.code}
                                        <select
                                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm font-normal text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                            value={selectedFiltersByFacetId[facet.facetId] || ""}
                                            onChange={(event) => setFacetFilter(facet.facetId, event.target.value)}
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

                    {/* Overall Rankings */}
                    <section className="rounded-2xl border border-gray-200 bg-white shadow-md p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="font-bold text-[#004785]">Overall Rankings</p>
                            <Button type="button" variant="outline" disabled={!filteredOverallRankings.length}
                                onClick={() => downloadCsv(`${trackName}-overall-rankings.csv`,
                                    ["Rank", "Submission", "# Evaluations", "Overall Score", "Phase"],
                                    filteredOverallRankings.map((row) => [row.rank ?? "", row.title, row.scoreCount, formatScore(row.totalScore), row.status])
                                )}>
                                Export CSV
                            </Button>
                        </div>
                        {!filteredOverallRankings.length && (
                            <p className="text-sm text-[#55616D]">No ranked submissions for current filters.</p>
                        )}
                        {!!filteredOverallRankings.length && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#004785]/5 text-left">
                                            <th className="px-3 py-2 font-semibold text-[#004785]">Rank</th>
                                            <th className="px-3 py-2 font-semibold text-[#004785]">Submission</th>
                                            <th className="px-3 py-2 font-semibold text-[#004785]"># Evaluations</th>
                                            <th className="px-3 py-2 font-semibold text-[#004785]">Overall Score</th>
                                            <th className="px-3 py-2 font-semibold text-[#004785]">Phase</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredOverallRankings.map((row) => (
                                            <tr key={`overall-${row.submissionId}`}
                                                className="cursor-pointer hover:bg-[#004785]/5 transition"
                                                onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/submissions/${row.submissionId}/evaluations`)}>
                                                <td className="px-3 py-2 font-bold text-[#004785]">{row.rank ?? "-"}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.title}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.scoreCount}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{formatScore(row.totalScore)}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Category Rankings */}
                    <section className="rounded-2xl border border-gray-200 bg-white shadow-md p-5">
                        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                            <p className="font-bold text-[#004785]">Category-Based Report</p>
                            <div className="flex items-center gap-2">
                                <select
                                    className="rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                    value={selectedCategory}
                                    onChange={(event) => setSelectedCategory(event.target.value)}
                                    disabled={!allRankings.categories.length}
                                >
                                    {!allRankings.categories.length && <option value="">No categories</option>}
                                    {allRankings.categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" disabled={!filteredCategoryRankings.length}
                                    onClick={() => downloadCsv(`${trackName}-category-${selectedCategory}-rankings.csv`,
                                        ["Rank", "Submission", "# Evaluations", "Category Total", "Category Avg", "Overall Avg", "Phase"],
                                        filteredCategoryRankings.map((row) => [row.rank ?? "", row.title, row.categoryCount, formatScore(row.categorySum), formatScore(row.categoryScore), formatScore(row.totalScore), row.status])
                                    )}>
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                        {!selectedCategory && <p className="text-sm text-[#55616D]">No rubric categories available.</p>}
                        {!!selectedCategory && !filteredCategoryRankings.length && <p className="text-sm text-[#55616D]">No category scores for current filters.</p>}
                        {!!selectedCategory && !!filteredCategoryRankings.length && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#004785]/5 text-left">
                                            {["Rank", "Submission", "# Evaluations", "Category Total", "Category Avg", "Overall Avg", "Phase"].map((h) => (
                                                <th key={h} className="px-3 py-2 font-semibold text-[#004785]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCategoryRankings.map((row) => (
                                            <tr key={`category-${selectedCategory}-${row.submissionId}`}
                                                className="cursor-pointer hover:bg-[#004785]/5 transition"
                                                onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/submissions/${row.submissionId}/evaluations`)}>
                                                <td className="px-3 py-2 font-bold text-[#004785]">{row.rank ?? "-"}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.title}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.categoryCount}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{formatScore(row.categorySum)}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{formatScore(row.categoryScore)}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{formatScore(row.totalScore)}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Phase Rankings */}
                    <section className="rounded-2xl border border-gray-200 bg-white shadow-md p-5">
                        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                            <p className="font-bold text-[#004785]">Phase Rankings</p>
                            <div className="flex items-center gap-2">
                                <select
                                    className="rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                    value={selectedPhase}
                                    onChange={(event) => setSelectedPhase(event.target.value)}
                                >
                                    {PHASE_OPTIONS.filter((o) => o.value !== "all").map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" disabled={!filteredPhaseRankings.length}
                                    onClick={() => downloadCsv(`${trackName}-phase-${selectedPhase}-rankings.csv`,
                                        ["Rank", "Submission", "# Evaluations", "Overall Avg", "Phase"],
                                        filteredPhaseRankings.map((row) => [row.rank ?? "", row.title, row.scoreCount, formatScore(row.totalScore), row.status])
                                    )}>
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                        {!filteredPhaseRankings.length && <p className="text-sm text-[#55616D]">No ranked submissions for current filters.</p>}
                        {!!filteredPhaseRankings.length && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#004785]/5 text-left">
                                            {["Rank", "Submission", "# Evaluations", "Overall Avg.", "Phase"].map((h) => (
                                                <th key={h} className="px-3 py-2 font-semibold text-[#004785]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredPhaseRankings.map((row) => (
                                            <tr key={`phase-${row.submissionId}`}
                                                className="cursor-pointer hover:bg-[#004785]/5 transition"
                                                onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/submissions/${row.submissionId}/evaluations`)}>
                                                <td className="px-3 py-2 font-bold text-[#004785]">{row.rank ?? "-"}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.title}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.scoreCount}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{formatScore(row.totalScore)}</td>
                                                <td className="px-3 py-2 text-[#55616D]">{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
