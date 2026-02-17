import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { fetchTrackName } from "../services/track/trackService.js";
import { fetchTrackRubrics } from "../services/rubric/rubricService.js";

export default function TrackRubricsOverviewPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId } = useParams();

    const [trackName, setTrackName] = useState("Track");
    const [rubrics, setRubrics] = useState([]);
    const [rubricsError, setRubricsError] = useState("");
    const [isLoadingRubrics, setIsLoadingRubrics] = useState(false);

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

        async function loadRubrics() {
            if (!trackId) return;

            setRubricsError("");
            setIsLoadingRubrics(true);

            try {
                const data = await fetchTrackRubrics(trackId);
                setRubrics(data);
            } catch (error) {
                console.error(error);
                setRubricsError("Could not load rubrics for this track.");
            } finally {
                setIsLoadingRubrics(false);
            }
        }

        loadTrackName();
        loadRubrics();
    }, [trackId]);

    return (
        <div className="text-center text-bold text-5xl">
            Rubrics Overview
            <Card>
                <CardTitle>Track Rubrics</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/admin/events/${eventInstanceId}`)}
                        >
                            Back to Event
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() =>
                                navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics/create`)
                            }
                        >
                            Create Rubric
                        </Button>
                    </div>

                    <p className="mb-4 text-left text-sm text-gray-500">Track: {trackName}</p>

                    <div className="text-left">
                        {isLoadingRubrics && <p className="text-sm text-gray-500">Loading rubrics...</p>}
                        {rubricsError && <p className="text-sm text-red-600">{rubricsError}</p>}
                        {!isLoadingRubrics && !rubricsError && !rubrics.length && (
                            <p className="text-sm text-gray-500">No rubrics linked to this track yet.</p>
                        )}

                        <ul className="space-y-3">
                            {rubrics.map((rubric) => (
                                <li key={rubric.rubricId} className="rounded border p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {rubric.name} (v{rubric.version})
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {rubric.isDefault ? "Default" : "Not default"} · Max points: {rubric.maxTotalPoints}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Criteria: {rubric.criteria.length}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics/${rubric.rubricId}/edit`
                                                )
                                            }
                                        >
                                            Edit
                                        </Button>
                                    </div>

                                    <div className="mt-3 rounded border p-3">
                                        <p className="mb-2 text-sm font-medium">Criteria Details</p>
                                        {!rubric.criteria.length && (
                                            <p className="text-sm text-gray-500">No criteria found for this rubric.</p>
                                        )}

                                        {!!rubric.criteria.length && (
                                            <ul className="space-y-2">
                                                {rubric.criteria.map((criterion, index) => (
                                                    <li key={criterion.id ?? `${rubric.rubricId}-${index}`} className="rounded border p-2">
                                                        <p className="text-sm font-medium">
                                                            {index + 1}. {criterion.name}
                                                        </p>
                                                        {criterion.description && (
                                                            <p className="text-xs text-gray-500">{criterion.description}</p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            Category: {criterion.category} · Weight: {criterion.weight}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
