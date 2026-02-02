import Button from "../ui/Button";

export default function ProjectCard({ project, onSelect }) {
    return (
        <Button variant="primary"
        onClick={() => onSelect?.(project)}>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="text-sm text-gray-600">
                        Scores: {project.scoreCount}
                    </p>
                </div>

                <span className="text-sm text-gray-500">{project.projectId}</span>
            </div>
        </Button>
    );
}