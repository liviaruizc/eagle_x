import Button from "./Button";

export function ProjectCard({ project, onView, onUpload }) {
    const normalizedStatus = String(project.status || "").toLowerCase();
    const blockedByStatus = ["done", "withdrawn"].includes(normalizedStatus);

    const submissionOpenAt = project.track?.submission_open_at
        ? new Date(project.track.submission_open_at)
        : null;
    const submissionCloseAt = project.track?.submission_close_at
        ? new Date(project.track.submission_close_at)
        : null;

    const hasValidOpenAt = submissionOpenAt && !Number.isNaN(submissionOpenAt.getTime());
    const hasValidCloseAt = submissionCloseAt && !Number.isNaN(submissionCloseAt.getTime());
    const now = new Date();

    const isBeforeWindow = hasValidOpenAt && now < submissionOpenAt;
    const isAfterWindow = hasValidCloseAt && now > submissionCloseAt;
    const blockedByWindow = isBeforeWindow || isAfterWindow;

    const canUploadPoster = !blockedByStatus && !blockedByWindow;

    let uploadWindowMessage = "";
    if (isBeforeWindow) {
        uploadWindowMessage = `Uploading is not allowed yet. Opens ${submissionOpenAt.toLocaleString()}.`;
    } else if (isAfterWindow) {
        uploadWindowMessage = `Uploading is closed. Window ended ${submissionCloseAt.toLocaleString()}.`;
    }

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

                <Button
                    onClick={() => onUpload(project.submission_id)}
                    className="flex-1"
                    variant="secondary"
                    disabled={!canUploadPoster}
                >
                    {project.poster_file_url ? "Reupload" : "Upload"}
                </Button>
            </div>

            {uploadWindowMessage && (
                <p className="mt-3 text-xs text-amber-700">{uploadWindowMessage}</p>
            )}
        </div>
    );
}