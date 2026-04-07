import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import EventCreationForm from "../components/ui/EventCreationForm.jsx";
import Button from "../components/ui/Button.jsx";
import {
    createEventHierarchyFromForm,
    ensureDefaultTrackTypes,
    fetchTrackTypes,
    createTrackType,
} from "../services/eventAdminService.js";

export default function CreateEventPage() {
    const navigate = useNavigate();
    const [trackTypes, setTrackTypes] = useState([]);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [createMessage, setCreateMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTrackTypes() {
            setError("");

            try {
                await ensureDefaultTrackTypes();
                const data = await fetchTrackTypes();
                setTrackTypes(data);
            } catch (trackTypeError) {
                console.error(trackTypeError);
                setError("Could not load track types from Supabase.");
            }
        }

        loadTrackTypes();
    }, []);

    async function handleCreateTrackType(code, name, description) {
        const newTrackType = await createTrackType(code, name, description);

        // Reload track types to get the ID of the newly created track type
        const updatedTrackTypes = await fetchTrackTypes();
        setTrackTypes(updatedTrackTypes);

        // Return the newly created track type with its ID
        const createdTrackType = updatedTrackTypes.find((t) => t.code === code);
        return createdTrackType;
    }

    async function handleCreateEvent(formData) {
        setCreateMessage("");
        setError("");
        setIsCreatingEvent(true);

        try {
            const result = await createEventHierarchyFromForm(formData);
            setCreateMessage(
                `Created event instance ${result.eventInstanceId} with ${result.tracksCreated} tracks.`
            );
            return true;
        } catch (createError) {
            console.error(createError);
            setError("Could not create event. Check Supabase permissions and try again.");
            return false;
        } finally {
            setIsCreatingEvent(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate("/admin")}>← Back to Admin</Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#004785]">Create Event</h1>
                <p className="text-[#55616D] mt-1 text-sm">Fill out the form below to create a new event.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                <EventCreationForm
                    trackTypes={trackTypes}
                    isSubmitting={isCreatingEvent}
                    onSubmit={handleCreateEvent}
                    onCreateTrackType={handleCreateTrackType}
                />

                {createMessage && <p className="mt-4 text-sm text-[#00794C] font-medium">{createMessage}</p>}
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
}
