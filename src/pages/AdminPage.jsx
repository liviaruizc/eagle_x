import {Card, CardBody, CardTitle} from "../components/ui/Card.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import EventInstanceCard from "../components/ui/EventInstanceCard.jsx";
import {
    deleteEventInstance,
    fetchEventInstances,
} from "../services/eventAdminService.js";


export default function AdminPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [eventsError, setEventsError] = useState("");
    const [deletingEventId, setDeletingEventId] = useState(null);

    async function loadEvents() {
        setEventsError("");

        try {
            const data = await fetchEventInstances();
            setEvents(data);
        } catch (error) {
            console.error(error);
            setEventsError("Could not load events from Supabase.");
        }
    }

    useEffect(() => {
        loadEvents();
    }, []);

    async function handleDeleteEvent(event, eventInstanceId) {
        event.stopPropagation();

        const confirmed = window.confirm("Delete this event instance?");
        if (!confirmed) return;

        setEventsError("");
        setDeletingEventId(eventInstanceId);

        try {
            await deleteEventInstance(eventInstanceId);
            await loadEvents();
        } catch (error) {
            console.error(error);
            setEventsError("Could not delete event instance.");
        } finally {
            setDeletingEventId(null);
        }
    }


    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#004785]">Events</h1>
                <Button variant="primary" onClick={() => navigate("/admin/create-event")}>
                    + Create Event
                </Button>
            </div>

            {eventsError && <p className="text-sm text-red-600 mb-4">{eventsError}</p>}

            {!events.length && !eventsError && (
                <p className="text-[#55616D] text-center py-10">No event instances yet.</p>
            )}

            <ul className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {events.map((evt) => (
                    <EventInstanceCard
                        key={evt.id}
                        event={evt}
                        onClick={() => navigate(`/admin/events/${evt.id}`)}
                        action={
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    onClick={() => navigate(`/admin/events/${evt.id}`)}
                                >
                                    Manage
                                </Button>
                                <Button
                                    variant="secondary"
                                    disabled={deletingEventId === evt.id}
                                    onClick={(event) => handleDeleteEvent(event, evt.id)}
                                >
                                    {deletingEventId === evt.id ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        }
                    />
                ))}
            </ul>
        </div>
    )
}