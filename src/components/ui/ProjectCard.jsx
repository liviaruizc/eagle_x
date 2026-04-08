import Button from "./Button";

export function ProjectCard({ project, onView, onUpload }) {
    const canUploadPoster = !["done", "withdrawn"].includes(String(project.status || "").toLowerCase());

    return (
        <div className="bg-white border border-[#00794C] rounded-2xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-[#004785]">
                    {project.title}
                </h2>

                <p className="text-sm text-[#55616D]">
                    {project.track?.name}
                </p>

                <p className="text-sm text-[#55616D]">
                    Table: {project.table_number ?? "Not assigned yet"}
                </p>

                <p className="text-sm text-[#55616D]">
                    Session: {project.session ?? "TBD"}
                </p>

                {project.poster_file_url && (
                    <p className="text-xs text-[#00794C] mt-2 font-medium">
                        Poster uploaded
                    </p>
                )}
            </div>

            <div className="flex gap-3 mt-4">
                <Button
                    onClick={() => onView(project.submission_id)}
                    className="flex-1"
                    variant="primary"
                >
                    View Info
                </Button>

                {canUploadPoster && (
                    <Button
                        onClick={() => onUpload(project.submission_id)}
                        className="flex-1"
                        variant="secondary"
                    >
                        {project.poster_file_url ? "Reupload" : "Upload"}
                    </Button>
                )}
            </div>
        </div>
    );
}