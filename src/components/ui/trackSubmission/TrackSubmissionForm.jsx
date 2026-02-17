import { useEffect, useState } from "react";
import {
    createSubmissionForTrack,
    createSubmissionsForTrack,
    fetchTrackFacets,
} from "../../../services/eventAdminService.js";
import { parseSubmissionExcelFile } from "../../../services/submission/submissionExcel.js";
import { buildSubmissionFacetValues } from "../../../services/submission/submissionFacetValues.js";
import TrackSubmissionImportPanel from "./TrackSubmissionImportPanel.jsx";
import TrackSubmissionManualFields from "./TrackSubmissionManualFields.jsx";
import { applyFacetValueChange } from "./trackSubmissionFormUtils.js";

const EMPTY_SUBMISSION_FORM = {
    title: "",
    description: "",
    keywords: "",
    status: "submitted",
    created_by_email: "",
    supervisor_email: "",
    submitted_at: "",
};

export default function TrackSubmissionForm({ trackId }) {
    const [formData, setFormData] = useState(EMPTY_SUBMISSION_FORM);
    const [trackFacets, setTrackFacets] = useState([]);
    const [facetValues, setFacetValues] = useState({});
    const [isLoadingFacets, setIsLoadingFacets] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageTone, setMessageTone] = useState("success");

    useEffect(() => {
        async function loadTrackFacets() {
            setIsLoadingFacets(true);

            try {
                const facets = await fetchTrackFacets(trackId);
                setTrackFacets(facets);
            } catch (facetError) {
                console.error(facetError);
                setStatusMessage("Could not load track facets.", "error");
            } finally {
                setIsLoadingFacets(false);
            }
        }

        if (trackId) {
            loadTrackFacets();
        }
    }, [trackId]);

    function handleFieldChange(fieldName, value) {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    }

    function setStatusMessage(nextMessage, tone = "success") {
        setMessage(nextMessage);
        setMessageTone(tone);
    }

    function handleFacetValueChange(facetId, valueField, value) {
        setFacetValues((prev) =>
            applyFacetValueChange({
                previousValues: prev,
                facetId,
                valueField,
                value,
                trackFacets,
            })
        );
    }

    async function handleManualSubmission(event) {
        event.preventDefault();
        event.stopPropagation();

        if (!formData.title.trim()) {
            setStatusMessage("Title is required.", "error");
            return;
        }

        setIsSubmitting(true);
        setStatusMessage("");

        try {
            const submissionFacetValues = buildSubmissionFacetValues(trackFacets, facetValues);

            await createSubmissionForTrack(trackId, {
                ...formData,
                title: formData.title.trim(),
                submitted_at: formData.submitted_at
                    ? new Date(formData.submitted_at).toISOString()
                    : undefined,
                facet_values: submissionFacetValues,
            });

            setStatusMessage("Submission created successfully.", "success");
            setFormData(EMPTY_SUBMISSION_FORM);
            setFacetValues({});
        } catch (submissionError) {
            console.error(submissionError);
            setStatusMessage(submissionError.message || "Could not create submission.", "error");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleExcelUpload(event) {
        event.stopPropagation();
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setStatusMessage("");

        try {
            const submissions = await parseSubmissionExcelFile(file);

            if (!submissions.length) {
                setStatusMessage("No valid rows found. Add at least a title column.", "error");
                return;
            }

            const result = await createSubmissionsForTrack(trackId, submissions);
            setStatusMessage(`${result.inserted} submissions imported.`, "success");
        } catch (uploadError) {
            console.error(uploadError);
            setStatusMessage(uploadError.message || "Could not import Excel file.", "error");
        } finally {
            event.target.value = "";
            setIsUploading(false);
        }
    }

    return (
        <div className="rounded border p-3" onClick={(event) => event.stopPropagation()}>
            <p className="mb-2 text-sm font-semibold text-gray-800">Add Submissions to This Track</p>

            <TrackSubmissionImportPanel
                isUploading={isUploading}
                onExcelUpload={handleExcelUpload}
            />

            <TrackSubmissionManualFields
                formData={formData}
                isSubmitting={isSubmitting}
                isLoadingFacets={isLoadingFacets}
                trackFacets={trackFacets}
                facetValues={facetValues}
                onSubmit={handleManualSubmission}
                onFieldChange={handleFieldChange}
                onFacetValueChange={handleFacetValueChange}
            />

            {message && (
                <p className={`mt-2 text-xs ${messageTone === "error" ? "text-red-600" : "text-gray-600"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}