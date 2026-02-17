import { useState } from "react";
import Button from "./Button.jsx";

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EventCreationForm({ trackTypes, isSubmitting, onSubmit }) {
    const now = new Date();
    const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const plus90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [formData, setFormData] = useState({
        eventName: "",
        eventDescription: "",
        hostOrg: "",
        isActive: true,
        instanceName: "",
        startAt: formatDateTimeLocal(now),
        endAt: formatDateTimeLocal(plus90),
        preScoringEnabled: "no",
        preScoringStartAt: formatDateTimeLocal(plus30),
        preScoringEndAt: formatDateTimeLocal(plus30),
        location: "",
        status: "closed",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        submissionOpenAt: formatDateTimeLocal(now),
        submissionCloseAt: formatDateTimeLocal(plus30),
        selectedTrackTypeIds: [],
    });
    const [formError, setFormError] = useState("");

    function handleFieldChange(event) {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handleTrackTypeToggle(trackTypeId) {
        setFormData((prev) => {
            const hasTrackType = prev.selectedTrackTypeIds.includes(trackTypeId);

            return {
                ...prev,
                selectedTrackTypeIds: hasTrackType
                    ? prev.selectedTrackTypeIds.filter((id) => id !== trackTypeId)
                    : [...prev.selectedTrackTypeIds, trackTypeId],
            };
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const eventStartAt = new Date(formData.startAt);
        const eventEndAt = new Date(formData.endAt);

        if (!(eventStartAt < eventEndAt)) {
            setFormError("Event end must be after event start.");
            return;
        }

        if (formData.preScoringEnabled === "yes") {
            const preScoringStartAt = new Date(formData.preScoringStartAt);
            const preScoringEndAt = new Date(formData.preScoringEndAt);

            if (!(preScoringStartAt < preScoringEndAt)) {
                setFormError("Pre-scoring end must be after pre-scoring start.");
                return;
            }

            if (!(preScoringEndAt <= eventStartAt)) {
                setFormError("Pre-scoring must end on or before the event start.");
                return;
            }
        }

        if (!formData.selectedTrackTypeIds.length) {
            setFormError("Select at least one track type.");
            return;
        }

        setFormError("");
        const success = await onSubmit(formData);

        if (success) {
            setFormData((prev) => ({
                ...prev,
                selectedTrackTypeIds: [],
            }));
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mb-8 grid gap-3 text-left">
            <p className="text-base font-semibold text-gray-900">Create Event</p>

            <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleFieldChange}
                placeholder="Event name"
                className="rounded border p-2"
                required
            />

            <input
                type="text"
                name="hostOrg"
                value={formData.hostOrg}
                onChange={handleFieldChange}
                placeholder="Host organization"
                className="rounded border p-2"
            />

            <textarea
                name="eventDescription"
                value={formData.eventDescription}
                onChange={handleFieldChange}
                placeholder="Event description"
                className="rounded border p-2"
            />

            <label className="text-sm text-gray-700">
                <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFieldChange}
                    className="mr-2"
                />
                Event active
            </label>

            <input
                type="text"
                name="instanceName"
                value={formData.instanceName}
                onChange={handleFieldChange}
                placeholder="Event instance name"
                className="rounded border p-2"
                required
            />

            <label className="text-sm text-gray-700">Start at</label>
            <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleFieldChange}
                className="rounded border p-2"
                required
            />

            <label className="text-sm text-gray-700">End at</label>
            <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleFieldChange}
                className="rounded border p-2"
                required
            />

            <label className="text-sm text-gray-700">Pre scoring?</label>
            <select
                name="preScoringEnabled"
                value={formData.preScoringEnabled}
                onChange={handleFieldChange}
                className="rounded border p-2"
                required
            >
                <option value="no">No</option>
                <option value="yes">Yes</option>
            </select>

            {formData.preScoringEnabled === "yes" && (
                <>
                    <label className="text-sm text-gray-700">Pre-scoring starts</label>
                    <input
                        type="datetime-local"
                        name="preScoringStartAt"
                        value={formData.preScoringStartAt}
                        onChange={handleFieldChange}
                        className="rounded border p-2"
                        required
                    />

                    <label className="text-sm text-gray-700">Pre-scoring ends</label>
                    <input
                        type="datetime-local"
                        name="preScoringEndAt"
                        value={formData.preScoringEndAt}
                        onChange={handleFieldChange}
                        className="rounded border p-2"
                        required
                    />
                </>
            )}

            <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFieldChange}
                placeholder="Location"
                className="rounded border p-2"
            />

            <input type="hidden" name="status" value={formData.status} />
            <p className="text-sm text-gray-500">Initial event status: closed</p>

            <input
                type="text"
                name="timezone"
                value={formData.timezone}
                onChange={handleFieldChange}
                placeholder="Timezone"
                className="rounded border p-2"
            />

            <label className="text-sm text-gray-700">Submission opens</label>
            <input
                type="datetime-local"
                name="submissionOpenAt"
                value={formData.submissionOpenAt}
                onChange={handleFieldChange}
                className="rounded border p-2"
                required
            />

            <label className="text-sm text-gray-700">Submission closes</label>
            <input
                type="datetime-local"
                name="submissionCloseAt"
                value={formData.submissionCloseAt}
                onChange={handleFieldChange}
                className="rounded border p-2"
                required
            />

            <div className="rounded border p-3">
                <p className="mb-2 text-sm text-gray-700">Track types</p>
                <div className="grid gap-2">
                    {trackTypes.map((trackType) => (
                        <label key={trackType.track_type_id} className="text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={formData.selectedTrackTypeIds.includes(trackType.track_type_id)}
                                onChange={() => handleTrackTypeToggle(trackType.track_type_id)}
                                className="mr-2"
                            />
                            {trackType.name} ({trackType.code})
                        </label>
                    ))}
                </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex justify-start">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
            </div>
        </form>
    );
}
