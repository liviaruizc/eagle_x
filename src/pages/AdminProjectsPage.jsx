import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { fetchTracksForEvent } from "../services/track/trackService.js";
import {
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

                    <ul className="space-y-3 text-left">
                        {projects.map((project) => (
                            <li key={project.submissionId} className="rounded border p-3">
                                <p className="font-semibold text-gray-900">{project.title}</p>
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
                                        ? project.participants.map((participant) => participant.displayName).join(", ")
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
                            </li>
                        ))}
                    </ul>
                </CardBody>
            </Card>
        </div>
    );
}
