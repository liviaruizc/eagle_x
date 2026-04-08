import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import {
    deleteAdminJudge,
    fetchAdminJudgesByEvent,
} from "../services/admin/adminEventViewService.js";

export default function AdminJudgesPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [judges, setJudges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingPersonId, setDeletingPersonId] = useState(null);

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

    async function handleDeleteJudge(judge) {
        const confirmed = window.confirm(
            `Delete ${judge.displayName} and remove their person record? This removes all of their event-role links.`
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setDeletingPersonId(judge.personId);

        try {
            await deleteAdminJudge(judge.personId);
            setJudges((currentJudges) => currentJudges.filter((row) => row.personId !== judge.personId));
        } catch (deleteError) {
            console.error(deleteError);
            setError("Could not delete this judge.");
        } finally {
            setDeletingPersonId(null);
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}`)}>
                    ← Back to Event
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#004785]">Event Judges</h1>
                <p className="text-[#55616D] mt-1 text-sm">Judges assigned to this event</p>
            </div>

            {isLoading && <p className="text-[#55616D] text-center py-10">Loading judges...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!isLoading && !error && !judges.length && (
                <p className="text-[#55616D] text-center py-10">No judges are assigned to this event.</p>
            )}

<<<<<<< HEAD
                    {!isLoading && !error && !judges.length && (
                        <p className="text-sm text-gray-500 text-left">No judges are assigned to this event.</p>
                    )}

                    <ul className="space-y-3 text-left">
                        {judges.map((judge) => (
                            <li key={judge.personEventRoleId} className="rounded border p-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">{judge.displayName}</p>
                                        <p className="text-sm text-gray-600">{judge.email || "No email available"}</p>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        disabled={deletingPersonId === judge.personId}
                                        onClick={() => handleDeleteJudge(judge)}
                                    >
                                        {deletingPersonId === judge.personId ? "Deleting..." : "Delete"}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardBody>
            </Card>
=======
            <ul className="space-y-3">
                {judges.map((judge) => (
                    <li key={judge.personEventRoleId} className="rounded-2xl border border-gray-200 bg-white shadow-md p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-[#004785]">{judge.displayName}</p>
                            <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${judge.scoreCount === 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                {judge.scoreCount} {judge.scoreCount === 1 ? "score" : "scores"}
                            </span>
                        </div>
                        <p className="text-sm text-[#55616D] mt-1">{judge.email || "No email available"}</p>
                    </li>
                ))}
            </ul>
>>>>>>> dev
        </div>
    );
}
