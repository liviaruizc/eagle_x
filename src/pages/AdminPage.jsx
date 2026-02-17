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
        <div className="text-center text-bold text-5xl">
            Welcome to the Admin Page!
            <Card>
                <CardTitle>Events List</CardTitle>
                <CardBody>
                    <div className="mb-6 flex justify-start">
                        <Button variant="primary" onClick={() => navigate("/admin/create-event")}>Create Event</Button>
                    </div>

                    <p className="text-lg mb-4">Here are the current events:</p>

                    <ul className="space-y-4">
                        {events.map((evt) => (
                            <EventInstanceCard
                                key={evt.id}
                                event={evt}
                                onClick={() => navigate(`/admin/events/${evt.id}`)}
                                action={(
                                    <Button
                                        variant="secondary"
                                        disabled={deletingEventId === evt.id}
                                        onClick={(event) => handleDeleteEvent(event, evt.id)}
                                    >
                                        {deletingEventId === evt.id ? "Deleting..." : "Delete"}
                                    </Button>
                                )}
                            />
                        ))}
                    </ul>
                    {!events.length && !eventsError && (
                        <p className="text-sm text-gray-500">No event instances yet.</p>
                    )}
                    {eventsError && <p className="text-sm text-red-600">{eventsError}</p>}

                </CardBody>
            </Card>
        </div>
    )
}