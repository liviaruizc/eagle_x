import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import TrackRubricForm from "../components/ui/TrackRubricForm.jsx";
import { fetchTrackName } from "../services/track/trackService.js";
import { fetchTrackRubrics } from "../services/rubric/rubricService.js";

export default function TrackRubricEditPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId, rubricId } = useParams();

    const [trackName, setTrackName] = useState("Track");
    const [rubrics, setRubrics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const rubric = useMemo(
        () => rubrics.find((item) => item.rubricId === rubricId) ?? null,
        [rubrics, rubricId]
    );

    useEffect(() => {
        async function loadData() {
            if (!trackId) return;

            setError("");
            setIsLoading(true);

            try {
                const [name, rubricData] = await Promise.all([
                    fetchTrackName(trackId),
                    fetchTrackRubrics(trackId),
                ]);

                setTrackName(name);
                setRubrics(rubricData);
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load rubric details.");
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [trackId]);

    return (
        <div className="text-center text-bold text-5xl">
            Edit Rubric
            <Card>
                <CardTitle>Update Rubric</CardTitle>
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

                    {isLoading && <p className="text-sm text-gray-500">Loading rubric...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {!isLoading && !error && !rubric && (
                        <p className="text-sm text-red-600">Rubric not found for this track.</p>
                    )}

                    {!isLoading && !error && rubric && (
                        <TrackRubricForm
                            trackId={trackId}
                            mode="edit"
                            initialRubric={rubric}
                            onSaved={async () => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}
                            onCancel={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}
                        />
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
