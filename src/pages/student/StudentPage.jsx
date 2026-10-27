import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchStudentEventInstances } from "../../services/studentProjects/studentApi.js";
import Button from "../../components/ui/Button.jsx";
import EventInstanceCard from "../../components/ui/EventInstanceCard.jsx";

export default function StudentDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

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
                setEvents(result);

            } catch (err) {
                console.error(err);
                setError("Could not load your events.");
            } finally {
                setLoading(false);
            }
        }

        loadEvents();
    }, [location.key]);

    function handleViewDetails(eventInstanceId) {
        navigate(`/students/${eventInstanceId}/projects`);
    }

    function handleCompleteDetails(eventInstanceId) {
        navigate(`/students/${eventInstanceId}/complete-data`);
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
                    You have no projects linked to any events.
                </p>
            )}

            <ul className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {events.map(event => (
                    <EventInstanceCard
                        key={event.event_instance_id}
                        event={event}
                        onClick={() => handleViewDetails(event.event_instance_id)}
                        action={
                            <div className="flex gap-2">
                                {event.action_needed && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCompleteDetails(event.event_instance_id);
                                        }}
                                    >
                                        Action Needed
                                    </Button>
                                )}
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
                            </div>
                        }
                    />
                ))}
            </ul>
        </div>
    );
}