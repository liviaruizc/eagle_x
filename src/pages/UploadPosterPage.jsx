import { useState } from "react";
import { useParams } from "react-router-dom";
import { uploadPoster } from "../services/studentProjects/studentApi";

export default function UploadPosterPage() {

    const { submissionId } = useParams();
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

        } catch (err) {

            console.error(err);
            alert("Upload failed.");

        } finally {

            setLoading(false);

        }
    }

    return (
        <div className="max-w-xl mx-auto p-6">

            <h1 className="text-2xl font-bold mb-4">
                Upload Poster
            </h1>

            <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
            />

            <button
                className="mt-4 border px-4 py-2"
                onClick={handleUpload}
                disabled={loading}
            >
                Upload
            </button>

        </div>
    );
}