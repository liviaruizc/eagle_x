import ProjectCard from "../components/queue/CurrentProjectCard";
import { useNavigate } from "react-router-dom";

const mockProjects = [];

export default function ProjectsPage() {

    const navigate = useNavigate();

    function handleSelect(project) {
        console.log("Selected: ", project);
        //navigate to scoring page
        navigate(`/score/${project.projectId}`);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3x1 p-6">
                <h1 className="text-2x1 font-bold">Projects</h1>
                <p className="mt-1 text-1m text-gray-600">
                    Pick a project to score.
                </p>

                <div className="mt-6 grid gap-4">
                    {mockProjects.map((project) => (
                        <ProjectCard
                            key={project.projectId}
                            project={project}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}