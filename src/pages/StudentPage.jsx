import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudentEventInstances } from "../services/studentProjects/studentApi.js";
import Button from "../components/ui/Button.jsx";
import EventInstanceCard from "../components/ui/EventInstanceCard.jsx";

export default function StudentDashboard() {
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadEvents() {
            setLoading(true);
            setError("");

            try {
                const personId = sessionStorage.getItem("auth_person_id");

                if (!personId) {
                    setError("Session not found.");
                    return;
                }

                const result = await fetchStudentEventInstances(personId);

                const activeEvents = result.filter(
                    event => event.status === "pre-scoring" || event.status === "event_scoring"
                );

                setEvents(activeEvents);

            } catch (err) {
                console.error(err);
                setError("Could not load your events.");
            } finally {
                setLoading(false);
            }
        }

        loadEvents();
    }, []);

    function handleViewDetails(eventInstanceId) {
        navigate(`/students/${eventInstanceId}/projects`);
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#004785]">My Events</h1>
                
            </div>

            {loading && <p className="text-[#55616D] text-center py-10">Loading events...</p>}
            {error && <p className="text-[#CCAB00] text-center">{error}</p>}
            {!loading && !events.length && (
                <p className="text-[#55616D] text-center py-10">
                    You are not registered for any active events.
                </p>
            )}

            <ul className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {events.map(event => (
                    <EventInstanceCard
                        key={event.event_instance_id}
                        event={event}
                        onClick={() => handleViewDetails(event.event_instance_id)}
                        action={
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(event.event_instance_id);
                                }}
                            >
                                View Event
                            </Button>
                        }
                    />
                ))}
            </ul>
        </div>
    );
}