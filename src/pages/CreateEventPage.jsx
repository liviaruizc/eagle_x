import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import EventCreationForm from "../components/ui/EventCreationForm.jsx";
import Button from "../components/ui/Button.jsx";
import {
    createEventHierarchyFromForm,
    ensureDefaultTrackTypes,
    fetchTrackTypes,
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
        <div className="text-center text-bold text-5xl">
            Create Event
            <Card>
                <CardTitle>Create Event Form</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start">
                        <Button variant="outline" onClick={() => navigate("/admin")}>Back to Admin</Button>
                    </div>

                    <EventCreationForm
                        trackTypes={trackTypes}
                        isSubmitting={isCreatingEvent}
                        onSubmit={handleCreateEvent}
                    />

                    {createMessage && <p className="text-sm text-gray-700">{createMessage}</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </CardBody>
            </Card>
        </div>
    );
}
