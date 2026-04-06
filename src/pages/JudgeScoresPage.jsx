import { useEffect, useState } from "react";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import { fetchScoreSheetsByJudge } from "../services/score/scoreApi.js";
import { getCurrentUser } from "../services/loginAuth/authService.js";

export default function JudgeScoresPage() {
    const [groupedByEvent, setGroupedByEvent] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            setError("");

            try {
                const user = await getCurrentUser();
                if (!user?.person_id) {
                    setError("No active session.");
                    return;
                }

                const sheets = await fetchScoreSheetsByJudge(user.person_id);
                setTotalCount(sheets.length);

                // Group by event instance
                const byEvent = new Map();
                for (const sheet of sheets) {
                    const eventInstanceId = sheet.submission?.track?.event_instance?.event_instance_id ?? "unknown";
                    const eventName = sheet.submission?.track?.event_instance?.name ?? "Unknown Event";
                    const trackName = sheet.submission?.track?.name ?? "Unknown Track";

                    if (!byEvent.has(eventInstanceId)) {
                        byEvent.set(eventInstanceId, { eventName, tracks: new Map() });
                    }

                    const event = byEvent.get(eventInstanceId);
                    if (!event.tracks.has(trackName)) {
                        event.tracks.set(trackName, []);
                    }

                    event.tracks.get(trackName).push({
                        scoreSheetId: sheet.score_sheet_id,
                        submissionId: sheet.submission?.submission_id,
                        title: sheet.submission?.title ?? "Untitled",
                        status: sheet.status,
                        submittedAt: sheet.submitted_at,
                    });
                }

                setGroupedByEvent([...byEvent.values()].map((event) => ({
                    eventName: event.eventName,
                    tracks: [...event.tracks.entries()].map(([trackName, submissions]) => ({
                        trackName,
                        submissions,
                    })),
                })));
            } catch (err) {
                console.error(err);
                setError("Could not load your scoring history.");
            } finally {
                setIsLoading(false);
            }
        }

        load();
    }, []);

    return (
        <div className="mx-auto max-w-3xl p-6">
            <Card>
                <CardTitle>My Scores</CardTitle>
                <CardBody>
                    {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {!isLoading && !error && (
                        <>
                            <p className="mb-4 text-sm text-gray-600">
                                You have submitted{" "}
                                <span className="font-semibold">{totalCount}</span>{" "}
                                {totalCount === 1 ? "score" : "scores"} total.
                            </p>

                            {!groupedByEvent.length && (
                                <p className="text-sm text-gray-500">You have not scored any projects yet.</p>
                            )}

                            <div className="space-y-6">
                                {groupedByEvent.map((event) => (
                                    <section key={event.eventName}>
                                        <h2 className="mb-3 font-semibold text-gray-800">{event.eventName}</h2>

                                        <div className="space-y-4">
                                            {event.tracks.map((track) => (
                                                <div key={track.trackName}>
                                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        {track.trackName} — {track.submissions.length} scored
                                                    </p>
                                                    <ul className="divide-y rounded border">
                                                        {track.submissions.map((s) => (
                                                            <li key={s.scoreSheetId} className="flex items-center justify-between px-3 py-2 text-sm">
                                                                <span className="text-gray-800">{s.title}</span>
                                                                <span className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    s.status === "submitted" || s.status === "locked"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-yellow-100 text-yellow-700"
                                                                }`}>
                                                                    {s.status}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
