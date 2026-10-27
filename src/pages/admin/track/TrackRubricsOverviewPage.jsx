import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button.jsx";
import { fetchTrackName } from "../../../services/track/trackService.js";
import { fetchTrackRubrics } from "../../../services/rubric/rubricService.js";

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
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}`)}>
                    ← Back to Event
                </Button>
                <Button variant="primary" onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics/create`)}>
                    + Create Rubric
                </Button>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#004785]">Rubrics</h1>
                <p className="text-[#55616D] mt-1 text-sm">Track: <span className="font-semibold">{trackName}</span></p>
            </div>

            {isLoadingRubrics && <p className="text-[#55616D] text-center py-10">Loading rubrics...</p>}
            {rubricsError && <p className="text-sm text-red-600 mb-4">{rubricsError}</p>}
            {!isLoadingRubrics && !rubricsError && !rubrics.length && (
                <p className="text-[#55616D] text-center py-10">No rubrics linked to this track yet.</p>
            )}

            <ul className="space-y-4">
                {rubrics.map((rubric) => (
                    <li key={rubric.rubricId} className="rounded-2xl border border-gray-200 bg-white shadow-md p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <p className="font-bold text-[#004785] text-lg">
                                    {rubric.name} <span className="text-sm font-normal text-[#55616D]">v{rubric.version}</span>
                                </p>
                                <div className="flex gap-3 mt-1 text-sm text-[#55616D]">
                                    <span>{rubric.isDefault ? "✓ Default" : "Not default"}</span>
                                    <span>·</span>
                                    <span>Max: {rubric.maxTotalPoints} pts</span>
                                    <span>·</span>
                                    <span>{rubric.criteria.length} criteria</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/admin/events/${eventInstanceId}/tracks/${trackId}/rubrics/${rubric.rubricId}/edit`)}
                            >
                                Edit
                            </Button>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-[#F3F3F3] p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#004785]">Criteria</p>
                            {!rubric.criteria.length && (
                                <p className="text-sm text-[#55616D]">No criteria found for this rubric.</p>
                            )}
                            <ul className="space-y-2">
                                {rubric.criteria.map((criterion, index) => (
                                    <li key={criterion.id ?? `${rubric.rubricId}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                                        <p className="text-sm font-semibold text-[#004785]">
                                            {index + 1}. {criterion.name}
                                        </p>
                                        {criterion.description && (
                                            <p className="text-xs text-[#55616D] mt-0.5">{criterion.description}</p>
                                        )}
                                        <p className="text-xs text-[#55616D] mt-1">
                                            Category: <span className="font-medium">{criterion.category}</span>
                                            {" · "}Weight: <span className="font-medium">{criterion.weight}</span>
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
