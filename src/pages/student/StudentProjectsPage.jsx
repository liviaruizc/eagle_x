import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchStudentProjectsForEvent } from "../../services/studentProjects/studentApi.js";
import { ProjectCard } from "../../components/ui/ProjectCard.jsx";

export default function StudentEventProjectsPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            const personId = sessionStorage.getItem("auth_person_id");
            const result = await fetchStudentProjectsForEvent(personId, eventInstanceId);

            setProjects(result);
            setLoading(false);
        }

        loadProjects();
    }, [eventInstanceId]);

    function handleViewProject(submissionId) {
        navigate(`/students/projects/${submissionId}`);
    }

    function handleUploadPoster(submissionId) {
        navigate(`/students/projects/${submissionId}/upload-poster`);
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <p className="text-[#55616D]">Loading projects...</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-4xl font-bold text-[#004785] mb-8">
                My Projects
            </h1>

            {!projects.length ? (
                <p className="text-[#55616D]">No projects for this event.</p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.submission_id}
                            project={project}
                            onView={handleViewProject}
                            onUpload={handleUploadPoster}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
