import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import EventInstanceCard from "../components/ui/EventInstanceCard.jsx";
import { fetchJudgeEventInstances } from "../services/judgeSignup/judgeSignupApi.js";
import { getCurrentUser } from "../services/loginAuth/authService.js";

export default function JudgeDashboardPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadJudgeEvents() {
            setError("");
            setIsLoading(true);

            try {
                const user = await getCurrentUser();

                
                if (!user?.person_id) {
                    setError("No logged in user found.");
                    return;
                }

                const judgeEvents = await fetchJudgeEventInstances(user.person_id);

                const openEvents = judgeEvents.filter(
                    event =>
                        event.status === "pre-scoring" ||
                        event.status === "event_scoring"
                );

                setEvents(openEvents);
            } catch (err) {
                console.error(err);
                setError("Could not load your judging events.");
            } finally {
                setIsLoading(false);
            }
        }

        loadJudgeEvents();
    }, []);

    function handleStartJudging(eventInstanceId) {
        navigate(`/judges/${eventInstanceId}/tracks`);
    }

    return (
        <div className="judge-page text-center text-5xl font-bold">
            <header className="text-5xl text-center font-bold">
                My Judging Events
            </header>

            <div className="mx-auto mt-6 max-w-4xl rounded border p-4 text-left">
                <p className="mb-3 text-lg font-semibold">
                    Events Assigned to You
                </p>

                {isLoading && <p className="text-sm text-gray-500">Loading events...</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {!isLoading && !error && !events.length && (
                    <p className="text-sm text-gray-500">
                        You are not assigned to any active judging events.
                    </p>
                )}

                <ul className="space-y-4">
                    {events.map((event) => (
                        <EventInstanceCard
                            key={event.event_instance_id}
                            event={event}
                            action={(
                                <Button
                                    variant="primary"
                                    onClick={() => handleStartJudging(event.event_instance_id)}
                                >
                                    Start Judging
                                </Button>
                            )}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}