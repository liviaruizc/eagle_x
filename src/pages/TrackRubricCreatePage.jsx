import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import TrackRubricForm from "../components/ui/TrackRubricForm.jsx";
import { fetchTrackName } from "../services/track/trackService.js";

export default function TrackRubricCreatePage() {
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
            Create Rubric
            <Card>
                <CardTitle>Create Rubric for Track</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}
                        >
                            Back to Rubrics
                        </Button>
                    </div>

                    <p className="mb-4 text-left text-sm text-gray-500">Track: {trackName}</p>

                    <TrackRubricForm
                        trackId={trackId}
                        mode="create"
                        onSaved={async () => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}
                    />
                </CardBody>
            </Card>
        </div>
    );
}
