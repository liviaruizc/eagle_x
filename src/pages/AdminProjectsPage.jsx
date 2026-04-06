import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { fetchTracksForEvent } from "../services/track/trackService.js";
import {
    assignTableToSubmission,
    fetchAdminProjectsByEvent,
    fetchAdminProjectsByTrack,
} from "../services/admin/adminEventViewService.js";

export default function AdminProjectsPage() {
    const navigate = useNavigate();
    const { eventInstanceId, trackId } = useParams();

    const [projects, setProjects] = useState([]);
    const [viewMode, setViewMode] = useState("event");
    const [viewLabel, setViewLabel] = useState("Event-level");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // tableInputs: { [submissionId]: { tableNumber: string, session: string } }
    const [tableInputs, setTableInputs] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [saveError, setSaveError] = useState({});

    useEffect(() => {
        async function loadProjects() {
            setIsLoading(true);
            setError("");

            try {
                if (trackId) {
                    const tracks = await fetchTracksForEvent(eventInstanceId);
                    const selectedTrack = (tracks ?? []).find((track) => String(track.track_id) === String(trackId));

                    if (!selectedTrack) {
                        setError("Track not found for this event.");
                        setProjects([]);
                        return;
                    }

                    const trackProjects = await fetchAdminProjectsByTrack(trackId);
                    setProjects(trackProjects);
                    setViewMode("track");
                    setViewLabel(`Track-level: ${selectedTrack.name}`);
                    return;
                }

                const eventProjects = await fetchAdminProjectsByEvent(eventInstanceId);
                setProjects(eventProjects);
                setViewMode("event");
                setViewLabel("Event-level (all projects)");
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load projects.");
                setProjects([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadProjects();
    }, [eventInstanceId, trackId]);

    function getTableInput(submissionId, project) {
        if (tableInputs[submissionId]) return tableInputs[submissionId];
        return {
            tableNumber: project.tableNumber != null ? String(project.tableNumber) : "",
            session: project.tableSession ?? "",
        };
    }

    function setTableInput(submissionId, field, value) {
        setTableInputs((prev) => ({
            ...prev,
            [submissionId]: {
                ...getTableInput(submissionId, projects.find((p) => p.submissionId === submissionId)),
                [field]: value,
            },
        }));
    }

    async function handleSaveTable(project) {
        const input = getTableInput(project.submissionId, project);
        const tableNumber = parseInt(input.tableNumber, 10);

        if (!tableNumber || isNaN(tableNumber)) {
            setSaveError((prev) => ({ ...prev, [project.submissionId]: "Enter a valid table number." }));
            return;
        }

        setSavingId(project.submissionId);
        setSaveError((prev) => ({ ...prev, [project.submissionId]: null }));

        try {
            await assignTableToSubmission({
                submissionId: project.submissionId,
                eventInstanceId,
                trackId: project.track.trackId,
                tableNumber,
                session: input.session || null,
            });

            setProjects((prev) =>
                prev.map((p) =>
                    p.submissionId === project.submissionId
                        ? { ...p, tableNumber, tableSession: input.session || null }
                        : p
                )
            );
            setTableInputs((prev) => {
                const next = { ...prev };
                delete next[project.submissionId];
                return next;
            });
        } catch (err) {
            console.error(err);
            setSaveError((prev) => ({ ...prev, [project.submissionId]: "Could not save table assignment." }));
        } finally {
            setSavingId(null);
        }
    }

    return (
        <div className="text-center text-bold text-5xl">
            Projects
            <Card>
                <CardTitle>Projects List</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start gap-2">
                        <Button variant="outline" onClick={() => navigate(`/admin/events/${eventInstanceId}`)}>
                            Back to Event
                        </Button>
                    </div>

                    <p className="mb-3 text-left text-sm text-gray-600">
                        <span className="font-semibold">View scope:</span> {viewLabel}
                    </p>

                    {isLoading && <p className="text-sm text-gray-500 text-left">Loading projects...</p>}
                    {error && <p className="text-sm text-red-600 text-left">{error}</p>}

                    {!isLoading && !error && !projects.length && (
                        <p className="text-sm text-gray-500 text-left">No projects found for this scope.</p>
                    )}

                    {!isLoading && !error && !!projects.length && (() => {
                        const unscored = projects.filter((p) => p.scoreCount === 0);
                        const byTrack = unscored.reduce((acc, p) => {
                            const key = p.track?.name ?? "Unknown Track";
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(p);
                            return acc;
                        }, {});

                        return (
                            <div className="mb-5 rounded border border-yellow-300 bg-yellow-50 p-3 text-left">
                                <p className="mb-2 font-semibold text-yellow-800">
                                    Unscored Projects ({unscored.length} of {projects.length})
                                </p>
                                {!unscored.length && (
                                    <p className="text-sm text-green-700">All projects have at least one score.</p>
                                )}
                                {!!unscored.length && Object.entries(byTrack).map(([trackName, trackProjects]) => (
                                    <div key={trackName} className="mb-2">
                                        {viewMode === "event" && (
                                            <p className="text-xs font-semibold text-yellow-700">{trackName}</p>
                                        )}
                                        <ul className="ml-2 list-disc pl-3">
                                            {trackProjects.map((p) => (
                                                <li key={p.submissionId} className="text-sm text-yellow-900">{p.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <ul className="space-y-3 text-left">
                        {projects.map((project) => {
                            const input = getTableInput(project.submissionId, project);
                            const isSaving = savingId === project.submissionId;
                            const err = saveError[project.submissionId];

                            return (
                                <li key={project.submissionId} className="rounded border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-gray-900">{project.title}</p>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${project.scoreCount === 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                                            {project.scoreCount} {project.scoreCount === 1 ? "score" : "scores"}
                                        </span>
                                    </div>
                                    {project.description && (
                                        <p className="mt-1 text-sm text-gray-600">{project.description}</p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-600">
                                        <span className="font-semibold">Status:</span> {project.status}
                                    </p>
                                    {viewMode === "event" && project.track?.name && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Track:</span> {project.track.name}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">Participants:</span>{" "}
                                        {project.participants.length
                                            ? project.participants.map((p) => p.displayName).join(", ")
                                            : "No participants linked"}
                                    </p>
                                    {project.supervisor && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Supervisor:</span> {project.supervisor.displayName}
                                            {project.supervisor.email ? ` (${project.supervisor.email})` : ""}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Created: {project.createdAt ? new Date(project.createdAt).toLocaleString() : "-"}
                                    </p>

                                    {/* Table assignment */}
                                    <div className="mt-3 border-t pt-3">
                                        <p className="mb-2 text-sm font-medium text-gray-700">
                                            Table assignment:{" "}
                                            {project.tableNumber != null ? (
                                                <span className="font-semibold text-blue-600">
                                                    Table {project.tableNumber}
                                                    {project.tableSession ? ` · Session ${project.tableSession}` : ""}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Not assigned</span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Table #"
                                                className="w-24 rounded border px-2 py-1 text-sm"
                                                value={input.tableNumber}
                                                onChange={(e) => setTableInput(project.submissionId, "tableNumber", e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Session (optional)"
                                                className="w-36 rounded border px-2 py-1 text-sm"
                                                value={input.session}
                                                onChange={(e) => setTableInput(project.submissionId, "session", e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="primary"
                                                disabled={isSaving}
                                                onClick={() => handleSaveTable(project)}
                                            >
                                                {isSaving ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </CardBody>
            </Card>
        </div>
    );
}
