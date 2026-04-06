import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import CreateJudgeForm from "../components/ui/CreateJudgeForm.jsx";
import { fetchEventInstanceDetails, updateEventInstanceSchedule } from "../services/eventAdminService.js";

function toDateTimeLocalInput(value) {
    if (!value) return "";
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EventDetailsPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [eventDetails, setEventDetails] = useState(null);
    const [openTrackId, setOpenTrackId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditingInstance, setIsEditingInstance] = useState(false);
    const [isSavingInstance, setIsSavingInstance] = useState(false);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState({
        instanceName: "",
        startAt: "",
        endAt: "",
        preScoringEnabled: "no",
        preScoringStartAt: "",
        preScoringEndAt: "",
        location: "",
        timezone: "UTC",
        status: "closed",
    });

    function populateEditForm(details) {
        setEditForm({
            instanceName: details.name ?? "",
            startAt: toDateTimeLocalInput(details.startAt),
            endAt: toDateTimeLocalInput(details.endAt),
            preScoringEnabled: details.preScoringStartAt && details.preScoringEndAt ? "yes" : "no",
            preScoringStartAt: toDateTimeLocalInput(details.preScoringStartAt),
            preScoringEndAt: toDateTimeLocalInput(details.preScoringEndAt),
            location: details.location ?? "",
            timezone: details.timezone ?? "UTC",
            status: details.status ?? "closed",
        });
    }

    useEffect(() => {
        async function loadEventDetails() {
            setError("");
            setIsLoading(true);

            try {
                const details = await fetchEventInstanceDetails(eventInstanceId);
                setEventDetails(details);
                populateEditForm(details);
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

    function handleEditFieldChange(event) {
        const { name, value } = event.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSaveEventInstance(event) {
        event.preventDefault();
        setEditError("");

        const eventStartAt = new Date(editForm.startAt);
        const eventEndAt = new Date(editForm.endAt);

        if (!(eventStartAt < eventEndAt)) {
            setEditError("Event end must be after event start.");
            return;
        }

        if (editForm.preScoringEnabled === "yes") {
            const preScoringStartAt = new Date(editForm.preScoringStartAt);
            const preScoringEndAt = new Date(editForm.preScoringEndAt);

            if (!(preScoringStartAt < preScoringEndAt)) {
                setEditError("Pre-scoring end must be after pre-scoring start.");
                return;
            }

            if (!(preScoringEndAt <= eventStartAt)) {
                setEditError("Pre-scoring must end on or before event start.");
                return;
            }
        }

        setIsSavingInstance(true);

        try {
            await updateEventInstanceSchedule(eventInstanceId, editForm);
            const refreshed = await fetchEventInstanceDetails(eventInstanceId);
            setEventDetails(refreshed);
            populateEditForm(refreshed);
            setIsEditingInstance(false);
        } catch (saveError) {
            console.error(saveError);
            setEditError("Could not save event schedule.");
        } finally {
            setIsSavingInstance(false);
        }
    }

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
                                <div className="mt-3 flex gap-2">
                                    <Button variant="outline" onClick={() => {
                                        setEditError("");
                                        setIsEditingInstance((prev) => !prev);
                                    }}>
                                        {isEditingInstance ? "Cancel Edit" : "Edit Event"}
                                    </Button>
                                </div>

                                {isEditingInstance && (
                                    <form className="mt-4 grid gap-2 rounded border border-gray-200 bg-gray-50 p-3" onSubmit={handleSaveEventInstance}>
                                        <p className="text-sm font-semibold text-gray-800">Edit Event Instance</p>

                                        <label className="text-xs text-gray-600">Instance name</label>
                                        <input
                                            type="text"
                                            name="instanceName"
                                            value={editForm.instanceName}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                            required
                                        />

                                        <label className="text-xs text-gray-600">Start at</label>
                                        <input
                                            type="datetime-local"
                                            name="startAt"
                                            value={editForm.startAt}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                            required
                                        />

                                        <label className="text-xs text-gray-600">End at</label>
                                        <input
                                            type="datetime-local"
                                            name="endAt"
                                            value={editForm.endAt}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                            required
                                        />

                                        <label className="text-xs text-gray-600">Pre-scoring enabled</label>
                                        <select
                                            name="preScoringEnabled"
                                            value={editForm.preScoringEnabled}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                        >
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                        </select>

                                        {editForm.preScoringEnabled === "yes" && (
                                            <>
                                                <label className="text-xs text-gray-600">Pre-scoring starts</label>
                                                <input
                                                    type="datetime-local"
                                                    name="preScoringStartAt"
                                                    value={editForm.preScoringStartAt}
                                                    onChange={handleEditFieldChange}
                                                    className="rounded border p-2 text-sm"
                                                    required
                                                />

                                                <label className="text-xs text-gray-600">Pre-scoring ends</label>
                                                <input
                                                    type="datetime-local"
                                                    name="preScoringEndAt"
                                                    value={editForm.preScoringEndAt}
                                                    onChange={handleEditFieldChange}
                                                    className="rounded border p-2 text-sm"
                                                    required
                                                />
                                            </>
                                        )}

                                        <label className="text-xs text-gray-600">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={editForm.location}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                        />

                                        <label className="text-xs text-gray-600">Timezone</label>
                                        <input
                                            type="text"
                                            name="timezone"
                                            value={editForm.timezone}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                        />

                                        <label className="text-xs text-gray-600">Status</label>
                                        <select
                                            name="status"
                                            value={editForm.status}
                                            onChange={handleEditFieldChange}
                                            className="rounded border p-2 text-sm"
                                        >
                                            <option value="closed">closed</option>
                                            <option value="pre-scoring">pre-scoring</option>
                                            <option value="event_scoring">event_scoring</option>
                                            <option value="done">done</option>
                                        </select>

                                        {editError && <p className="text-sm text-red-600">{editError}</p>}

                                        <div className="mt-2 flex justify-start">
                                            <Button type="submit" variant="primary" disabled={isSavingInstance}>
                                                {isSavingInstance ? "Saving..." : "Save and Sync Statuses"}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            <CreateJudgeForm eventInstanceId={eventInstanceId} />

                            <div className="rounded border p-3">
                                <p className="mb-2 font-semibold">Event-level Actions</p>
                                <p className="mb-3 text-xs text-gray-500">
                                    Judges are managed at the event level, not by track.
                                </p>
                                <div className="flex justify-start gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/admin/events/${eventInstanceId}/judges`)}
                                    >
                                        View Judges
                                    </Button>
                                    {!eventDetails.tracks.length && (
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/admin/events/${eventInstanceId}/projects`)}
                                        >
                                            View Projects
                                        </Button>
                                    )}
                                </div>
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
                                                                    `/admin/events/${eventInstanceId}/tracks/${track.id}/projects`
                                                                )
                                                            }
                                                        >
                                                            View Projects
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
