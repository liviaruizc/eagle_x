import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/ui/Button.jsx";
import TrackSubmissionForm from "../components/ui/trackSubmission/TrackSubmissionForm.jsx";
import { fetchTrackName } from "../services/track/trackService.js";

export default function TrackSubmissionsPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId } = useParams();
    const [trackName, setTrackName] = useState("Track");

    useEffect(() => {
        async function loadTrackName() {
            if (!trackId) return;

            try {
                const name = await fetchTrackName(trackId);
                setTrackName(name);
            } catch (error) {
                console.error(error);
                setTrackName("Track");
            }
        }

        loadTrackName();
    }, [trackId]);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}`)}>
                    ← Back to Event
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#004785]">Add Submission</h1>
                <p className="text-[#55616D] mt-1 text-sm">Track: <span className="font-semibold">{trackName}</span></p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                <TrackSubmissionForm trackId={trackId} />
            </div>
        </div>
    );
}
