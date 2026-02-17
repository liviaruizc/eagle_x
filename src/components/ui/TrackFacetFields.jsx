export default function TrackFacetFields({
    isLoadingFacets,
    trackFacets,
    facetValues,
    onFacetValueChange,
}) {
    // We use COLLEGE as the implicit parent facet for PROGRAM when explicit dependency is not configured.
    const collegeFacet = trackFacets.find(
        (facet) => String(facet.code || "").toUpperCase() === "COLLEGE"
    );

    // Returns parent facet id for a facet, preferring DB-configured dependency then fallback rule.
    function getParentFacetId(facet) {
        if (facet.dependsOnFacetId) {
            return facet.dependsOnFacetId;
        }

        const isProgramFacet = String(facet.code || "").toUpperCase() === "PROGRAM";
        const hasParentedOptions = (facet.options ?? []).some((option) => option.parent_option_id);

        if (isProgramFacet && hasParentedOptions && collegeFacet) {
            return collegeFacet.facetId;
        }

        return null;
    }

    if (isLoadingFacets) {
        return <p className="text-xs text-gray-500">Loading facet fields...</p>;
    }

    return (
        <>
            {trackFacets.map((facet) => {
                const current = facetValues[facet.facetId] ?? {};
                const hasOptions = facet.options.length > 0;
                const valueKind = String(facet.valueKind || "text").toLowerCase();
                const parentFacetId = getParentFacetId(facet);
                const selectedParentOptionId = parentFacetId
                    ? facetValues[parentFacetId]?.facet_option_id
                    : "";
                const hasParentedOptions = facet.options.some((option) => option.parent_option_id);

                // If options are hierarchical, only show rows whose parent matches the selected parent option.
                const filteredOptions = hasOptions
                    ? facet.options.filter((option) => {
                        if (!option.parent_option_id) return true;
                        if (!selectedParentOptionId) return false;
                        return option.parent_option_id === selectedParentOptionId;
                    })
                    : [];

                // Child dropdown stays disabled until parent is selected to avoid invalid combinations.
                const shouldDisableOptionSelect =
                    hasParentedOptions && !selectedParentOptionId;

                return (
                    <div key={facet.facetId} className="grid gap-1 rounded border p-2">
                        <label className="text-xs text-gray-600">
                            {facet.name}{facet.isRequired ? " *" : ""}
                        </label>

                        {hasOptions && (
                            <select
                                className="rounded border p-2 text-sm"
                                value={current.facet_option_id || ""}
                                disabled={shouldDisableOptionSelect}
                                onChange={(event) => onFacetValueChange(facet.facetId, "facet_option_id", event.target.value)}
                            >
                                <option value="">
                                    {shouldDisableOptionSelect ? "Select parent option first" : "Select an option"}
                                </option>
                                {filteredOptions.map((option) => (
                                    <option key={option.facet_option_id} value={option.facet_option_id}>
                                        {option.label || option.value}
                                    </option>
                                ))}
                            </select>
                        )}

                        {!hasOptions && valueKind === "number" && (
                            <input
                                type="number"
                                className="rounded border p-2 text-sm"
                                value={current.value_number ?? ""}
                                onChange={(event) => onFacetValueChange(facet.facetId, "value_number", event.target.value)}
                            />
                        )}

                        {!hasOptions && valueKind === "date" && (
                            <input
                                type="date"
                                className="rounded border p-2 text-sm"
                                value={current.value_date || ""}
                                onChange={(event) => onFacetValueChange(facet.facetId, "value_date", event.target.value)}
                            />
                        )}

                        {!hasOptions && valueKind !== "number" && valueKind !== "date" && (
                            <input
                                type="text"
                                className="rounded border p-2 text-sm"
                                value={current.value_text || ""}
                                onChange={(event) => onFacetValueChange(facet.facetId, "value_text", event.target.value)}
                            />
                        )}
                    </div>
                );
            })}
        </>
    );
}
