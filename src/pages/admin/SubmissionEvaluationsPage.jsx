import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import CriterionInfoTooltip from "../../components/ui/CriterionInfoTooltip.jsx";
import { fetchSubmissionEvaluations } from "../../services/evaluations/evaluationsService.js";

function formatScore(value) {
    if (value == null) return "-";
    return Number(value).toFixed(2);
}

function formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
}

// Infer scoring phase from which criterion phases are present in an evaluation.
function inferEvalPhase(scores) {
    const phases = new Set(scores.map((s) => s.scoringPhase));
    if (phases.has("pre_scoring")) return "Pre-Scoring";
    if (phases.has("event_scoring")) return "Event Scoring";
    return "Both";
}

export default function SubmissionEvaluationsPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId, submissionId } = useParams();

    const [submissionTitle, setSubmissionTitle] = useState("");
    const [submissionStatus, setSubmissionStatus] = useState("");
    const [evaluations, setEvaluations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            setError("");
            try {
                const result = await fetchSubmissionEvaluations(submissionId);
                setSubmissionTitle(result.submissionTitle);
                setSubmissionStatus(result.submissionStatus);
                setEvaluations(result.evaluations);
            } catch (err) {
                console.error(err);
                setError("Could not load evaluations.");
            } finally {
                setIsLoading(false);
            }
        }

        if (submissionId) load();
    }, [submissionId]);

    // Build a stable ordered list of all unique criteria across all evaluations.
    // Each entry: { criterionId, criterionName, description, scoringPhase, displayOrder, qLabel }
    const criteriaColumns = useMemo(() => {
        const map = new Map();
        for (const ev of evaluations) {
            for (const s of ev.scores) {
                if (!map.has(s.criterionId)) {
                    map.set(s.criterionId, {
                        criterionId: s.criterionId,
                        name: s.criterionName,
                        description: s.description ?? "",
                        scoringPhase: s.scoringPhase,
                        displayOrder: s.displayOrder,
                    });
                }
            }
        }

        return [...map.values()]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((c, i) => ({ ...c, qLabel: `Q_${i + 1}` }));
    }, [evaluations]);

    function downloadCsv() {
        const headers = [
            "Judge",
            "Phase",
            "Submitted At",
            ...criteriaColumns.map((c) => c.qLabel),
            "Total",
            "Overall Comment",
        ];

        const rows = evaluations.map((ev) => {
            const scoreMap = new Map(ev.scores.map((s) => [s.criterionId, s.scoreValue]));
            const total = ev.scores.reduce((sum, s) => sum + Number(s.scoreValue || 0), 0);
            return [
                ev.judgeName,
                inferEvalPhase(ev.scores),
                formatDate(ev.submittedAt),
                ...criteriaColumns.map((c) => scoreMap.has(c.criterionId) ? formatScore(scoreMap.get(c.criterionId)) : "-"),
                formatScore(total),
                ev.overallComment || "",
            ];
        });

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
        a.download = `evaluations-${submissionId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="max-w-full mx-auto p-6">
            <div className="mb-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/results`)}
                >
                    ← Back to Results
                </Button>
            </div>

            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#004785]">{submissionTitle || "Evaluations"}</h1>
                    <p className="text-sm text-[#55616D] mt-1">
                        Status: <span className="font-medium">{submissionStatus}</span>
                        {!isLoading && !error && (
                            <span className="ml-3">{evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""}</span>
                        )}
                    </p>
                </div>
                {!isLoading && !error && !!evaluations.length && (
                    <Button type="button" variant="outline" onClick={downloadCsv}>
                        Export CSV
                    </Button>
                )}
            </div>

            {isLoading && <p className="text-[#55616D] text-center py-10">Loading evaluations...</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {!isLoading && !error && !evaluations.length && (
                <p className="text-[#55616D] text-center py-10">No submitted evaluations yet.</p>
            )}

            {!isLoading && !error && !!evaluations.length && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-[#004785]/5 text-left border-b border-gray-200">
                                <th className="px-4 py-3 font-semibold text-[#004785] whitespace-nowrap">Judge</th>
                                <th className="px-4 py-3 font-semibold text-[#004785] whitespace-nowrap">Phase</th>
                                <th className="px-4 py-3 font-semibold text-[#004785] whitespace-nowrap">Submitted</th>
                                {criteriaColumns.map((c) => (
                                    <th key={c.criterionId} className="px-4 py-3 font-semibold text-[#004785] whitespace-nowrap">
                                        <span className="inline-flex items-center gap-0.5">
                                            {c.qLabel}
                                            <CriterionInfoTooltip
                                                name={c.name}
                                                description={c.description}
                                                scoringPhase={c.scoringPhase}
                                            />
                                        </span>
                                    </th>
                                ))}
                                <th className="px-4 py-3 font-semibold text-[#004785] whitespace-nowrap">Total</th>
                                <th className="px-4 py-3 font-semibold text-[#004785]">Comment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {evaluations.map((ev) => {
                                const scoreMap = new Map(ev.scores.map((s) => [s.criterionId, s.scoreValue]));
                                const total = ev.scores.reduce((sum, s) => sum + Number(s.scoreValue || 0), 0);
                                const phase = inferEvalPhase(ev.scores);

                                return (
                                    <tr key={ev.scoreSheetId} className="hover:bg-[#004785]/5 transition">
                                        <td className="px-4 py-3 font-medium text-[#004785] whitespace-nowrap">{ev.judgeName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                phase === "Pre-Scoring"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : phase === "Event Scoring"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}>
                                                {phase}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#55616D] whitespace-nowrap text-xs">{formatDate(ev.submittedAt)}</td>
                                        {criteriaColumns.map((c) => (
                                            <td key={c.criterionId} className="px-4 py-3 text-center text-[#55616D]">
                                                {scoreMap.has(c.criterionId) ? formatScore(scoreMap.get(c.criterionId)) : "-"}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 font-semibold text-[#004785] whitespace-nowrap">
                                            {formatScore(total)}
                                        </td>
                                        <td className="px-4 py-3 text-[#55616D] max-w-xs truncate" title={ev.overallComment || ""}>
                                            {ev.overallComment || "-"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
