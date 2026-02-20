import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { fetchTracksForEvent } from "../services/track/trackService.js";

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
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Select Track to Judge</h1>

            {loading && <p>Loading tracks...</p>}
            {error && <p className="text-red-600">{error}</p>}

            <div className="space-y-3">
                {tracks.map(track => (
                    <div key={track.track_id} className="border p-4 rounded flex justify-between">
                        <div>
                            <p className="font-semibold">{track.name}</p>
                        </div>

                        <Button onClick={() => handleSelectTrack(track.track_id)}>
                            Judge This Track
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
