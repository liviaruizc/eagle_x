import Button from "../Button.jsx";
import TrackFacetFields from "../TrackFacetFields.jsx";

export default function TrackSubmissionManualFields({
    formData,
    isSubmitting,
    isLoadingFacets,
    trackFacets,
    facetValues,
    onSubmit,
    onFieldChange,
    onFacetValueChange,
}) {
    return (
        <form className="grid gap-2" onSubmit={onSubmit}>
            <input
                type="text"
                placeholder="Title *"
                className="rounded border p-2 text-sm"
                value={formData.title}
                onChange={(event) => onFieldChange("title", event.target.value)}
                required
            />
            <textarea
                placeholder="Description"
                className="rounded border p-2 text-sm"
                value={formData.description}
                onChange={(event) => onFieldChange("description", event.target.value)}
            />
            <input
                type="text"
                placeholder="Keywords"
                className="rounded border p-2 text-sm"
                value={formData.keywords}
                onChange={(event) => onFieldChange("keywords", event.target.value)}
            />
            <input
                type="text"
                placeholder="Status"
                className="rounded border p-2 text-sm"
                value={formData.status}
                onChange={(event) => onFieldChange("status", event.target.value)}
            />
            <input
                type="email"
                placeholder="Created by email"
                className="rounded border p-2 text-sm"
                value={formData.created_by_email}
                onChange={(event) => onFieldChange("created_by_email", event.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Supervisor email"
                className="rounded border p-2 text-sm"
                value={formData.supervisor_email}
                onChange={(event) => onFieldChange("supervisor_email", event.target.value)}
            />
            <input
                type="datetime-local"
                className="rounded border p-2 text-sm"
                value={formData.submitted_at}
                onChange={(event) => onFieldChange("submitted_at", event.target.value)}
            />

            <TrackFacetFields
                isLoadingFacets={isLoadingFacets}
                trackFacets={trackFacets}
                facetValues={facetValues}
                onFacetValueChange={onFacetValueChange}
            />

            <div className="flex justify-start">
                <Button type="submit" variant="secondary" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Add Submission"}
                </Button>
            </div>
        </form>
    );
}