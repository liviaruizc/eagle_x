import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { fetchEventInstanceDetails } from "../services/eventAdminService.js";

export default function EventDetailsPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [eventDetails, setEventDetails] = useState(null);
    const [openTrackId, setOpenTrackId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadEventDetails() {
            setError("");
            setIsLoading(true);

            try {
                const details = await fetchEventInstanceDetails(eventInstanceId);
                setEventDetails(details);
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load event details.");
            } finally {
                setIsLoading(false);
            }
        }

        if (eventInstanceId) {
            loadEventDetails();
        }
    }, [eventInstanceId]);

    return (
        <div className="text-center text-bold text-5xl">
            Event Details
            <Card>
                <CardTitle>Event Instance</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start">
                        <Button variant="outline" onClick={() => navigate("/admin")}>Back to Admin</Button>
                    </div>

                    {isLoading && <p className="text-sm text-gray-500">Loading event details...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {!isLoading && !error && eventDetails && (
                        <div className="space-y-4 text-left">
                            <div className="rounded border p-3">
                                <p className="font-semibold">{eventDetails.name}</p>
                                <p className="text-sm text-gray-500">{new Date(eventDetails.startAt).toLocaleString()} - {new Date(eventDetails.endAt).toLocaleString()}</p>
                                <p className="text-sm text-gray-500">
                                    Pre-scoring: {eventDetails.preScoringStartAt && eventDetails.preScoringEndAt
                                    ? `${new Date(eventDetails.preScoringStartAt).toLocaleString()} - ${new Date(eventDetails.preScoringEndAt).toLocaleString()}`
                                    : "not enabled"}
                                </p>
                                <p className="text-sm text-gray-500">{eventDetails.event.name} · {eventDetails.status}</p>
                                <p className="text-sm text-gray-500">Timezone: {eventDetails.timezone}</p>
                                <p className="text-sm text-gray-500">Location: {eventDetails.location || "-"}</p>
                                <p className="text-sm text-gray-500">Host org: {eventDetails.event.hostOrg || "-"}</p>
                                <p className="text-sm text-gray-500">Description: {eventDetails.event.description || "-"}</p>
                            </div>

                            <div className="rounded border p-3">
                                <p className="mb-2 font-semibold">Tracks</p>
                                {!eventDetails.tracks.length && (
                                    <p className="text-sm text-gray-500">No tracks for this event instance.</p>
                                )}
                                <ul className="space-y-3">
                                    {eventDetails.tracks.map((track) => (
                                        <li
                                            key={track.id}
                                            className="cursor-pointer rounded border p-3 transition hover:bg-gray-50"
                                            onClick={() =>
                                                setOpenTrackId((prev) => (prev === track.id ? null : track.id))
                                            }
                                        >
                                            <p className="font-medium">{track.displayOrder}. {track.name}</p>
                                            <p className="text-sm text-gray-500">{track.typeName} {track.typeCode ? `(${track.typeCode})` : ""}</p>
                                            <p className="text-xs text-gray-500">{openTrackId === track.id ? "Click to hide details" : "Click to view details"}</p>
                                            {openTrackId === track.id && (
                                                <div className="mt-3 space-y-3" onClick={(event) => event.stopPropagation()}>
                                                    <p className="text-sm text-gray-500">
                                                        Submission: {new Date(track.submissionOpenAt).toLocaleString()} - {new Date(track.submissionCloseAt).toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Scoring: {new Date(track.scoringOpenAt).toLocaleString()} - {new Date(track.scoringCloseAt).toLocaleString()}
                                                    </p>
                                                    <div className="flex justify-start">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/events/${eventInstanceId}/tracks/${track.id}/submissions`,
                                                                    { state: { trackName: track.name } }
                                                                )
                                                            }
                                                        >
                                                            Add Submission
                                                        </Button>
                                                    </div>
                                                    <div className="flex justify-start">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/events/${eventInstanceId}/tracks/${track.id}/rubrics`,
                                                                    { state: { trackName: track.name } }
                                                                )
                                                            }
                                                        >
                                                            View/Edit Rubrics
                                                        </Button>
                                                    </div>
                                                    <div className="flex justify-start">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/events/${eventInstanceId}/tracks/${track.id}/results`,
                                                                    { state: { trackName: track.name } }
                                                                )
                                                            }
                                                        >
                                                            View Results
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
