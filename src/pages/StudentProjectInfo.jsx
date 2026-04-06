import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStudentProjectInfo } from "../services/studentProjects/studentService.js";
import PosterViewer from "../components/poster/PosterViewer.jsx";
import Button from "../components/ui/Button.jsx";

export default function StudentProjectDetails() {

    const { submissionId } = useParams();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSubmission() {
            setIsLoading(true);
            setError("");

            try {
                const data = await getStudentProjectInfo(submissionId);
                setSubmission(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load project details.");
            } finally {
                setIsLoading(false);
            }
        }

        loadSubmission();
    }, [submissionId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <p className="text-[#55616D]">Loading project...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600">
                {error}
            </div>
        );
    }

    if (!submission) {
        return <p className="text-center text-[#55616D]">No project found.</p>;
    }

    const posterUrl = submission.file_url?.file_url ?? null;
    const groupMembers = Array.isArray(submission.group_members) ? submission.group_members : [];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </Button>

                <h1 className="text-4xl font-bold text-[#004785]">
                    {submission.title}
                </h1>
            </div>

            {/* Description Card */}
            <div className="bg-white border border-[#55616D]/30 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#004785] mb-2">
                    Description
                </h2>
                <p className="text-[#55616D] leading-relaxed">
                    {submission.description || "No description provided."}
                </p>
            </div>

            {/* Info Grid */}
            <div className="bg-white border border-[#55616D]/30 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#004785] mb-4">
                    Project Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4 text-sm text-[#55616D]">

                    <div>
                        <span className="font-semibold text-[#004785]">Track:</span>
                        <p>{submission.track || "N/A"}</p>
                    </div>

                    <div>
                        <span className="font-semibold text-[#004785]">Group Members:</span>
                        {groupMembers.length ? (
                            <ul className="space-y-1">
                                {groupMembers.map((member, index) => (
                                    <li key={`${member.email || member.name}-${index}`}>
                                        <p>{member.name || "Unnamed member"}</p>
                                        {member.email && <p className="text-xs">{member.email}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>N/A</p>
                        )}
                    </div>

                    <div>
                        <span className="font-semibold text-[#004785]">Supervisor:</span>
                        <p>{submission.supervisor?.name || "N/A"}</p>
                        {submission.supervisor?.email && (
                            <p className="text-xs">{submission.supervisor.email}</p>
                        )}
                    </div>

                </div>
            </div>

            {/* Poster Section */}
            <div className="bg-white border border-[#00794C]/30 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#00794C] mb-4">
                    Poster
                </h2>

                <PosterViewer fileUrl={posterUrl} />
            </div>

        </div>
    );
}