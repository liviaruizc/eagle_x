import { useEffect, useState } from "react";
import { getStudentProjects } from "../services/studentProjects/studentService";
export default function StudentDashboard() {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            setLoading(true);
            setError("");

            try {
                const personId = sessionStorage.getItem("auth_person_id");

                if (!personId) {
                    setError("Session not found. Please login again.");
                    return;
                }

                const result = await getStudentProjects(personId);
                setProjects(result);

            } catch (err) {
                console.error(err);
                setError("Could not load your projects.");
            } finally {
                setLoading(false);
            }
        }

        loadProjects();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-center mb-6">
                My Projects
            </h1>

            {loading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !projects.length && (
                <p className="text-gray-500">
                    You don't have any active projects.
                </p>
            )}

            <div className="space-y-4">
                {projects.map((project) => (
                    <div key={project.submission_id} className="border rounded p-4">
                        <h2 className="text-xl font-semibold">{project.title}</h2>

                        <p className="text-sm text-gray-600">
                            Event: {project.track?.event_instance?.name}
                        </p>

                        <p className="text-sm text-gray-600">
                            Track: {project.track?.name}
                        </p>

                        <p className="text-sm">Status: {project.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}