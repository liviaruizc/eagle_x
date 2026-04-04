import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { fetchAdminJudgesByEvent } from "../services/admin/adminEventViewService.js";

export default function AdminJudgesPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [judges, setJudges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadJudges() {
            setIsLoading(true);
            setError("");

            try {
                const rows = await fetchAdminJudgesByEvent(eventInstanceId);
                setJudges(rows);
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load judges for this event.");
                setJudges([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadJudges();
    }, [eventInstanceId]);

    return (
        <div className="text-center text-bold text-5xl">
            Judges
            <Card>
                <CardTitle>Event Judges</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start gap-2">
                        <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}`)}>
                            Back to Event
                        </Button>
                    </div>

                    <p className="mb-3 text-left text-sm text-gray-600">
                        <span className="font-semibold">View scope:</span> Event-level only
                    </p>

                    {isLoading && <p className="text-sm text-gray-500 text-left">Loading judges...</p>}
                    {error && <p className="text-sm text-red-600 text-left">{error}</p>}

                    {!isLoading && !error && !judges.length && (
                        <p className="text-sm text-gray-500 text-left">No judges are assigned to this event.</p>
                    )}

                    <ul className="space-y-3 text-left">
                        {judges.map((judge) => (
                            <li key={judge.personEventRoleId} className="rounded border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-gray-900">{judge.displayName}</p>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${judge.scoreCount === 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                        {judge.scoreCount} {judge.scoreCount === 1 ? "score" : "scores"}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">{judge.email || "No email available"}</p>
                            </li>
                        ))}
                    </ul>
                </CardBody>
            </Card>
        </div>
    );
}
