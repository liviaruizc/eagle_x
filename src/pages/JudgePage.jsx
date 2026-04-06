import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import EventInstanceCard from "../components/ui/EventInstanceCard.jsx";
import { fetchJudgeEventInstances } from "../services/judgeSignup/judgeSignupApi.js";
import { getCurrentUser } from "../services/loginAuth/authService.js";

function isJudgingAllowed(event) {
    const now = new Date();

    // Check if we're in the event day/time range
    const eventStart = event.start_at ? new Date(event.start_at) : null;
    const eventEnd = event.end_at ? new Date(event.end_at) : null;
    const inEventWindow = eventStart && eventEnd && now >= eventStart && now <= eventEnd;

    // Check if we're in the pre-scoring window
    const preScoringStart = event.pre_scoring_start_at ? new Date(event.pre_scoring_start_at) : null;
    const preScoringEnd = event.pre_scoring_end_at ? new Date(event.pre_scoring_end_at) : null;
    const inPreScoringWindow = preScoringStart && preScoringEnd && now >= preScoringStart && now <= preScoringEnd;

    // Judging is allowed if we're in either the pre-scoring window or the event window
    return inEventWindow || inPreScoringWindow;
}

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

                const openEvents = judgeEvents.filter((event) => {
                    const status = String(event.status || "").trim().toLowerCase();
                    return status === "pre-scoring" || status === "pre_scoring" || status === "event_scoring";
                });

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
        sessionStorage.setItem("judge_event_instance_id", eventInstanceId);
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
                                    disabled={!isJudgingAllowed(event)}
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