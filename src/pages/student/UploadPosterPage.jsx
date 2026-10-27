import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { uploadPoster } from "../../services/studentProjects/studentApi";
import Button from "../../components/ui/Button.jsx";

export default function UploadPosterPage() {

    const { submissionId } = useParams();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleUpload() {
        if (!file) {
            alert("Please select a file.");
            return;
        }

        setLoading(true);

        try {
            await uploadPoster(submissionId, file);
            alert("Poster uploaded successfully.");
            navigate(-1); // go back after upload
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    ← Back
                </Button>

                <h1 className="text-3xl font-bold text-[#004785]">
                    Upload Poster
                </h1>
            </div>

            {/* Upload Card */}
            <div className="bg-white border border-[#55616D]/30 rounded-xl p-6 shadow-sm space-y-4">

                <p className="text-sm text-[#55616D]">
                    Upload your poster as a PDF file.
                </p>

                {/* File Input */}
                <label className="block">
                    <div className="border-2 border-dashed border-[#00794C] rounded-lg p-6 text-center cursor-pointer hover:bg-[#f5f5f5] transition">
                        <p className="text-[#00794C] font-medium">
                            Click to select a PDF file
                        </p>
                        <p className="text-xs text-[#55616D] mt-1">
                            Only .pdf files are allowed
                        </p>

                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>
                </label>

                {/* Selected file */}
                {file && (
                    <p className="text-sm text-[#004785]">
                        Selected: {file.name}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={loading}
                        className="flex-1"
                    >
                        {loading ? "Uploading..." : "Upload Poster"}
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>

            </div>

        </div>
    );
}