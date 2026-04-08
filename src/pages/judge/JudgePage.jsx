import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import EventInstanceCard from "../../components/ui/EventInstanceCard.jsx";
import { fetchJudgeEventInstances } from "../../services/judgeSignup/judgeSignupApi.js";
import { getCurrentUser } from "../../services/loginAuth/authService.js";

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

                const seen = new Set();
                const openEvents = judgeEvents.filter((event) => {
                    if (seen.has(event.event_instance_id)) return false;
                    seen.add(event.event_instance_id);
                    return event.status === "pre-scoring" || event.status === "event_scoring";
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
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#004785]">My Judging Events</h1>
            </div>

            {isLoading && <p className="text-[#55616D] text-center py-10">Loading events...</p>}
            {error && <p className="text-red-600 text-center py-4">{error}</p>}
            {!isLoading && !error && !events.length && (
                <p className="text-[#55616D] text-center py-10">
                    You are not assigned to any active judging events.
                </p>
            )}

            <ul className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                    <EventInstanceCard
                        key={event.event_instance_id}
                        event={event}
                        action={
                            <Button
                                variant="primary"
                                disabled={!isJudgingAllowed(event)}
                                onClick={() => handleStartJudging(event.event_instance_id)}
                            >
                                Start Judging
                            </Button>
                        }
                    />
                ))}
            </ul>
        </div>
    );
}