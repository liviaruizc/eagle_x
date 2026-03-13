import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchStudentProjectsForEvent } from "../services/studentProjects/studentApi.js";
import Button from "../components/ui/Button.jsx";

export default function StudentEventProjectsPage() {
    const navigate = useNavigate();

    const { eventInstanceId } = useParams();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function loadProjects() {

            const personId = sessionStorage.getItem("auth_person_id");

            const result = await fetchStudentProjectsForEvent(personId, eventInstanceId);

            alert(`Fetched projects: ${JSON.stringify(result)}`);

            setProjects(result);
            setLoading(false);
        }

        loadProjects();

    }, [eventInstanceId]);

    function handleViewProject(submissionId) {
        navigate(`/students/${eventInstanceId}/projects/${submissionId}`);
    }

    function handleUploadPoster(submissionId) {
        navigate(`/students/projects/${submissionId}/upload-poster`);
    }

    if (loading) return <p>Loading...</p>;

    return (
        <div className="max-w-4xl mx-auto p-6">

            <h1 className="text-3xl font-bold mb-6">
                My Projects
            </h1>

            {!projects.length && (
                <p className="text-gray-500">No projects for this event.</p>
            )}

            <div className="space-y-4">

                {projects.map(project => (

                    <div key={project.submission_id} className="border rounded p-4">

                        <h2 className="font-semibold text-lg">
                            {project.title}
                        </h2>

                        <p className="text-sm text-gray-600">
                            Track: {project.track?.name}
                        </p>

                        <p className="text-sm">
                            Status: {project.status}
                        </p>

                        <div className="flex gap-2 mt-3">

                            <Button
                                variant="secondary"
                                onClick={() => handleViewProject(project.submission_id)}
                            >
                                View Info
                            </Button>

                            {project.status === "pre_scoring" && (
                                <Button
                                    variant="primary"
                                    onClick={() => handleUploadPoster(project.submission_id)}
                                >
                                    Upload Poster
                                </Button>
                            )}

                        </div>

                    </div>

                ))}

            </div>

        </div>
    );
}