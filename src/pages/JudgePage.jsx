import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import EventInstanceCard from "../components/ui/EventInstanceCard.jsx";
import { fetchEventInstances } from "../services/eventAdminService.js";

export default function JudgePage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadJudgeEvents() {
            setError("");
            setIsLoading(true);

            try {
                const data = await fetchEventInstances();
                const judgeEvents = data.filter(
                    (event) => event.status === "pre-scoring" || event.status === "event_scoring"
                );
                setEvents(judgeEvents);
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load events available for judging.");
            } finally {
                setIsLoading(false);
            }
        }

        loadJudgeEvents();
    }, []);

    function handleStartJudging(eventInstanceId) {

        navigate(`/judges/${eventInstanceId}/tracks`);
    }

    function handleSignUp(eventInstanceId) {
        navigate(`/judges/signup/${eventInstanceId}`);
    }

    return (
        <div className="judge-page text-center text-5xl font-bold">
            <header className="text-5xl text-center font-bold">
                Welcome Judge
            </header>

            <div className="mt-4 flex justify-center">
                <Button
                    variant="secondary"
                    onClick={() => {
                        if (!events.length) {
                            window.alert("No events available for judge signup right now.");
                            return;
                        }

                        handleSignUp(events[0].id);
                    }}
                >
                    Sign Up
                </Button>
            </div>

            <div className="mx-auto mt-6 max-w-4xl rounded border p-4 text-left">
                <p className="mb-3 text-lg font-semibold">Available Events to Judge</p>

                {isLoading && <p className="text-sm text-gray-500">Loading events...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!isLoading && !error && !events.length && (
                    <p className="text-sm text-gray-500">No events currently open for judging.</p>
                )}

                <ul className="space-y-4">
                    {events.map((event) => (
                        <EventInstanceCard
                            key={event.id}
                            event={event}
                            action={(
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleSignUp(event.id)}>
                                        Sign Up
                                    </Button>
                                    <Button variant="primary" onClick={() => handleStartJudging(event.id)}>
                                        Start Judging
                                    </Button>
                                </div>
                            )}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}