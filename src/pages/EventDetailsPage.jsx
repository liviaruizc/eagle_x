import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate("/admin")}>← Back to Admin</Button>
            </div>

            {isLoading && <p className="text-[#55616D] text-center py-10">Loading event details...</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            {!isLoading && !error && eventDetails && (
                <div className="space-y-6">

                    {/* Event Info Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-[#004785]">{eventDetails.name}</h1>
                                <p className="text-sm text-[#55616D] mt-1">{eventDetails.event.name}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#004785]/10 px-3 py-1 text-xs font-semibold text-[#004785]">
                                {eventDetails.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#55616D]">
                            <p><span className="font-semibold text-[#004785]">Start:</span> {new Date(eventDetails.startAt).toLocaleString()}</p>
                            <p><span className="font-semibold text-[#004785]">End:</span> {new Date(eventDetails.endAt).toLocaleString()}</p>
                            <p><span className="font-semibold text-[#004785]">Pre-scoring:</span> {eventDetails.preScoringStartAt && eventDetails.preScoringEndAt
                                ? `${new Date(eventDetails.preScoringStartAt).toLocaleString()} – ${new Date(eventDetails.preScoringEndAt).toLocaleString()}`
                                : "Not enabled"}</p>
                            <p><span className="font-semibold text-[#004785]">Location:</span> {eventDetails.location || "—"}</p>
                            <p><span className="font-semibold text-[#004785]">Timezone:</span> {eventDetails.timezone}</p>
                            <p><span className="font-semibold text-[#004785]">Host org:</span> {eventDetails.event.hostOrg || "—"}</p>
                            {eventDetails.event.description && (
                                <p className="md:col-span-2"><span className="font-semibold text-[#004785]">Description:</span> {eventDetails.event.description}</p>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" onClick={() => { setEditError(""); setIsEditingInstance((prev) => !prev); }}>
                                {isEditingInstance ? "Cancel" : "Edit Event"}
                            </Button>
                        </div>

                        {isEditingInstance && (
                            <form className="mt-5 grid gap-3 rounded-xl border border-gray-200 bg-[#F3F3F3] p-5" onSubmit={handleSaveEventInstance}>
                                <p className="text-sm font-bold text-[#004785]">Edit Event Instance</p>

                                {[
                                    { label: "Instance name", name: "instanceName", type: "text", required: true },
                                    { label: "Start at", name: "startAt", type: "datetime-local", required: true },
                                    { label: "End at", name: "endAt", type: "datetime-local", required: true },
                                    { label: "Location", name: "location", type: "text" },
                                    { label: "Timezone", name: "timezone", type: "text" },
                                ].map(({ label, name, type, required }) => (
                                    <div key={name}>
                                        <label className="block text-xs font-semibold text-[#55616D] mb-1">{label}</label>
                                        <input
                                            type={type}
                                            name={name}
                                            value={editForm[name]}
                                            onChange={handleEditFieldChange}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                            required={required}
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label className="block text-xs font-semibold text-[#55616D] mb-1">Pre-scoring enabled</label>
                                    <select name="preScoringEnabled" value={editForm.preScoringEnabled} onChange={handleEditFieldChange}
                                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00794C]/50">
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                </div>

                                {editForm.preScoringEnabled === "yes" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#55616D] mb-1">Pre-scoring starts</label>
                                            <input type="datetime-local" name="preScoringStartAt" value={editForm.preScoringStartAt} onChange={handleEditFieldChange}
                                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00794C]/50" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#55616D] mb-1">Pre-scoring ends</label>
                                            <input type="datetime-local" name="preScoringEndAt" value={editForm.preScoringEndAt} onChange={handleEditFieldChange}
                                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00794C]/50" required />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-[#55616D] mb-1">Status</label>
                                    <select name="status" value={editForm.status} onChange={handleEditFieldChange}
                                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00794C]/50">
                                        <option value="closed">Closed</option>
                                        <option value="pre-scoring">Pre-scoring</option>
                                        <option value="event_scoring">Event scoring</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>

                                {editError && <p className="text-sm text-red-600">{editError}</p>}

                                <div className="flex justify-start">
                                    <Button type="submit" variant="primary" disabled={isSavingInstance}>
                                        {isSavingInstance ? "Saving..." : "Save & Sync Statuses"}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Add Judge */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                        <h2 className="text-lg font-bold text-[#004785] mb-4">Add Judge</h2>
                        <CreateJudgeForm eventInstanceId={eventInstanceId} />
                    </div>

                    {/* Event Actions */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                        <h2 className="text-lg font-bold text-[#004785] mb-1">Event Actions</h2>
                        <p className="text-xs text-[#55616D] mb-4">Judges are managed at the event level, not by track.</p>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/judges`)}>
                                View Judges
                            </Button>
                            {!eventDetails.tracks.length && (
                                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/projects`)}>
                                    View Projects
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tracks */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                        <h2 className="text-lg font-bold text-[#004785] mb-4">Tracks</h2>
                        {!eventDetails.tracks.length && (
                            <p className="text-sm text-[#55616D]">No tracks for this event instance.</p>
                        )}
                        <ul className="space-y-3">
                            {eventDetails.tracks.map((track) => (
                                <li
                                    key={track.id}
                                    className="cursor-pointer rounded-xl border border-gray-200 p-4 transition hover:border-[#00794C] hover:shadow-sm"
                                    onClick={() => setOpenTrackId((prev) => (prev === track.id ? null : track.id))}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-[#004785]">{track.displayOrder}. {track.name}</p>
                                            <p className="text-sm text-[#55616D]">{track.typeName}{track.typeCode ? ` (${track.typeCode})` : ""}</p>
                                        </div>
                                        <span className="text-xs text-[#55616D]">{openTrackId === track.id ? "▲ Hide" : "▼ Details"}</span>
                                    </div>

                                    {openTrackId === track.id && (
                                        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4" onClick={(e) => e.stopPropagation()}>
                                            <p className="text-sm text-[#55616D]">
                                                <span className="font-semibold text-[#004785]">Submission:</span>{" "}
                                                {new Date(track.submissionOpenAt).toLocaleString()} – {new Date(track.submissionCloseAt).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-[#55616D]">
                                                <span className="font-semibold text-[#004785]">Scoring:</span>{" "}
                                                {new Date(track.scoringOpenAt).toLocaleString()} – {new Date(track.scoringCloseAt).toLocaleString()}
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${track.id}/submissions`, { state: { trackName: track.name } })}>
                                                    Add Submission
                                                </Button>
                                                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${track.id}/rubrics`, { state: { trackName: track.name } })}>
                                                    View/Edit Rubrics
                                                </Button>
                                                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${track.id}/projects`)}>
                                                    View Projects
                                                </Button>
                                                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${track.id}/results`, { state: { trackName: track.name } })}>
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
        </div>
    );
}
