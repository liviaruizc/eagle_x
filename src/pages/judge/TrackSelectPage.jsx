import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { fetchTracksForEvent } from "../../services/track/trackService.js";

export default function TrackSelectPage() {
    const { eventInstanceId } = useParams();
    const navigate = useNavigate();

    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTracks() {
            try {
                const data = await fetchTracksForEvent(eventInstanceId);
                setTracks(data);
            } catch (err) {
                setError("Could not load tracks.");
            } finally {
                setLoading(false);
            }
        }

        loadTracks();
    }, [eventInstanceId]);

    function handleSelectTrack(trackId) {
        navigate(`/queue?trackId=${trackId}`);
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#004785]">Select a Track</h1>
                <p className="text-[#55616D] mt-1">Choose a track to begin judging submissions.</p>
            </div>

            {loading && <p className="text-[#55616D] text-center py-10">Loading tracks...</p>}
            {error && <p className="text-red-600 text-center py-4">{error}</p>}

            {!loading && !error && !tracks.length && (
                <p className="text-[#55616D] text-center py-10">No tracks available for this event.</p>
            )}

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {tracks.map(track => (
                    <div
                        key={track.track_id}
                        className="bg-white border border-[#00794C] rounded-2xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between min-h-[140px]"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-[#004785]">{track.name}</h2>
                            {track.description && (
                                <p className="text-sm text-[#55616D] mt-1 line-clamp-2">{track.description}</p>
                            )}
                        </div>
                        <div className="mt-4">
                            <Button variant="primary" onClick={() => handleSelectTrack(track.track_id)}>
                                Judge This Track
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
