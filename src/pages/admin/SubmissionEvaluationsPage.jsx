import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { Card, CardBody, CardTitle } from "../../components/ui/Card.jsx";
import { fetchSubmissionEvaluations } from "../../services/evaluations/evaluationsService.js";

const PHASE_OPTIONS = [
    { value: "all", label: "All Questions" },
    { value: "pre_scoring", label: "Pre-Scoring Only" },
    { value: "event_scoring", label: "Event Scoring Only" },
];

function formatScore(value) {
    if (value == null) return "-";
    return Number(value).toFixed(2);
}

function formatDate(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
}

export default function SubmissionEvaluationsPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId, submissionId } = useParams();

    const [submissionTitle, setSubmissionTitle] = useState("");
    const [submissionStatus, setSubmissionStatus] = useState("");
    const [evaluations, setEvaluations] = useState([]);
    const [selectedPhase, setSelectedPhase] = useState("all");
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

    function filterScores(scores) {
        if (selectedPhase === "all") return scores;
        return scores.filter(
            (s) => s.scoringPhase === selectedPhase || s.scoringPhase === "both"
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto max-w-4xl">
                <div className="mb-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/results`)}
                    >
                        Back to Results
                    </Button>
                </div>

                <Card>
                    <CardTitle>Evaluations</CardTitle>
                    <CardBody>
                        {isLoading && <p className="text-sm text-gray-500">Loading evaluations...</p>}
                        {error && <p className="text-sm text-red-600">{error}</p>}

                        {!isLoading && !error && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">{submissionTitle}</h2>
                                        <p className="text-sm text-gray-500">Status: {submissionStatus}</p>
                                        <p className="text-sm text-gray-500">{evaluations.length} evaluation(s)</p>
                                    </div>
                                    <label className="text-sm text-gray-700">
                                        Show questions
                                        <select
                                            className="ml-2 rounded border p-1 text-sm"
                                            value={selectedPhase}
                                            onChange={(e) => setSelectedPhase(e.target.value)}
                                        >
                                            {PHASE_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                {!evaluations.length && (
                                    <p className="text-sm text-gray-500">No submitted evaluations yet.</p>
                                )}

                                {evaluations.map((ev) => {
                                    const visibleScores = filterScores(ev.scores);
                                    const total = visibleScores.reduce((sum, s) => sum + Number(s.scoreValue || 0), 0);

                                    return (
                                        <div key={ev.scoreSheetId} className="rounded-2xl border bg-white p-5 shadow-sm">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">{ev.judgeName}</p>
                                                    <p className="text-xs text-gray-400">Submitted: {formatDate(ev.submittedAt)}</p>
                                                </div>
                                                <p className="text-sm font-medium">Total: {formatScore(total)}</p>
                                            </div>

                                            {visibleScores.length > 0 && (
                                                <table className="mb-3 min-w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="border-b text-left text-gray-500">
                                                            <th className="py-1 pr-4">Criterion</th>
                                                            <th className="py-1 pr-4">Phase</th>
                                                            <th className="py-1 pr-4">Score</th>
                                                            <th className="py-1">Comment</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visibleScores.map((s) => (
                                                            <tr key={s.criterionId} className="border-b">
                                                                <td className="py-1 pr-4">{s.criterionName}</td>
                                                                <td className="py-1 pr-4 text-xs text-gray-400">{s.scoringPhase}</td>
                                                                <td className="py-1 pr-4">{formatScore(s.scoreValue)}</td>
                                                                <td className="py-1 text-gray-500">{s.comment || "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}

                                            {ev.overallComment && (
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Overall comment: </span>
                                                    {ev.overallComment}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
