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
                    {isLoading && <p className="text-[#55616D] py-4">Loading...</p>}
                    {error && <p className="text-sm text-red-600 py-2">{error}</p>}

                    {!isLoading && !error && (
                        <>
                            <div className="mb-6 rounded-xl bg-[#004785]/8 border border-[#004785]/20 px-4 py-3">
                                <p className="text-sm text-[#55616D]">
                                    Total scores submitted:{" "}
                                    <span className="font-bold text-[#004785] text-base">{totalCount}</span>
                                </p>
                            </div>

                            {!groupedByEvent.length && (
                                <p className="text-sm text-[#55616D] text-center py-6">You have not scored any projects yet.</p>
                            )}

                            <div className="space-y-8">
                                {groupedByEvent.map((event) => (
                                    <section key={event.eventName}>
                                        <h2 className="text-lg font-bold text-[#004785] mb-4">{event.eventName}</h2>

                                        <div className="space-y-4">
                                            {event.tracks.map((track) => (
                                                <div key={track.trackName} className="rounded-xl border border-gray-200 overflow-hidden">
                                                    <div className="bg-[#F3F3F3] px-4 py-2 border-b border-gray-200">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#004785]">
                                                            {track.trackName}
                                                            <span className="ml-2 text-[#55616D] font-normal normal-case tracking-normal">
                                                                — {track.submissions.length} {track.submissions.length === 1 ? "score" : "scores"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <ul className="divide-y divide-gray-100 bg-white">
                                                        {track.submissions.map((s) => (
                                                            <li key={s.scoreSheetId} className="flex items-center justify-between px-4 py-3 text-sm">
                                                                <span className="text-[#55616D] font-medium">{s.title}</span>
                                                                <span className={`ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                    s.status === "submitted" || s.status === "locked"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-[#CCAB00]/20 text-[#8A7400]"
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
