import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
        () => rubrics.find((item) => String(item.rubricId) === String(rubricId)) ?? null,
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
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}>
                    ← Back to Rubrics
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#004785]">Edit Rubric</h1>
                <p className="text-[#55616D] mt-1 text-sm">Track: <span className="font-semibold">{trackName}</span></p>
            </div>

            {isLoading && <p className="text-[#55616D] text-center py-10">Loading rubric...</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {!isLoading && !error && !rubric && (
                <p className="text-sm text-red-600">Rubric not found for this track.</p>
            )}

            {!isLoading && !error && rubric && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
                    <TrackRubricForm
                        trackId={trackId}
                        mode="edit"
                        initialRubric={rubric}
                        onSaved={async () => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}
                        onCancel={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics`)}
                    />
                </div>
            )}
        </div>
    );
}
