import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudentEventInstances } from "../services/studentProjects/studentApi.js";
import Button from "../components/ui/Button.jsx";

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

                alert(`Fetched events: ${JSON.stringify(result)}`);

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
        <div className="max-w-4xl mx-auto p-6">

            <h1 className="text-3xl font-bold text-center mb-6">
                My Events
            </h1>

            {loading && <p className="text-gray-500">Loading events...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !events.length && (
                <p className="text-gray-500">
                    You are not registered for any active events.
                </p>
            )}

            <div className="space-y-4">
                {events.map(event => (

                    <div key={event.event_instance_id} className="border rounded p-4 flex justify-between items-center">

                        <div>
                            <p className="font-semibold">{event.name}</p>
                            <p className="text-sm text-gray-500">Status: {event.status}</p>
                        </div>

                        <Button
                            variant="primary"
                            onClick={() => handleViewDetails(event.event_instance_id)}
                        >
                            View Details
                        </Button>

                    </div>

                ))}
            </div>

        </div>
    );
}