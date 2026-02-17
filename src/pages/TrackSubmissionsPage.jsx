import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
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
        <div className="text-center text-bold text-5xl">
            Track Submissions
            <Card>
                <CardTitle>Add Submission to Track</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/events/${eventInstanceId}`)}
                        >
                            Back to Event
                        </Button>
                    </div>

                    <p className="mb-4 text-left text-sm text-gray-500">Track: {trackName}</p>

                    <TrackSubmissionForm trackId={trackId} />
                </CardBody>
            </Card>
        </div>
    );
}
