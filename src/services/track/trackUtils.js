// Pure helper utilities for track service transformations.
//
// Responsibilities:
// - Build option lookup maps and normalize track-facet DTOs.
// - Provide fallback facet mapping when explicit track-facet links are missing.
// - Expose default track-type seed rows.

export const DEFAULT_TRACK_TYPES = [
    {
        code: "RESEARCH",
        name: "Research",
        description: "Research-oriented track",
    },
    {
        code: "LEADERSHIP",
        name: "Leadership",
        description: "Leadership-oriented track",
    },
];

function groupOptionsByFacetId(options) {
    const optionsByFacetId = new Map();

    for (const option of options ?? []) {
        const existing = optionsByFacetId.get(option.facet_id) ?? [];
        existing.push(option);
        optionsByFacetId.set(option.facet_id, existing);
    }

    return optionsByFacetId;
}

export function mapFallbackFacets(facets, options) {
    const optionsByFacetId = groupOptionsByFacetId(options);

    return (facets ?? []).map((facet, index) => ({
        trackFacetId: null,
        facetId: facet.facet_id,
        name: facet.name ?? "",
        code: facet.code ?? "",
        valueKind: facet.value_kind ?? "text",
        isRequired: false,
        displayOrder: index + 1,
        dependsOnFacetId: null,
        dependsOnOptionId: null,
        options: optionsByFacetId.get(facet.facet_id) ?? [],
    }));
}

export function mapTrackFacets(trackFacets, facets, options) {
    const facetById = new Map((facets ?? []).map((facet) => [facet.facet_id, facet]));
    const optionsByFacetId = groupOptionsByFacetId(options);

    return (trackFacets ?? []).map((trackFacet) => {
        const facet = facetById.get(trackFacet.facet_id);

        return {
            trackFacetId: trackFacet.track_facet_id,
            facetId: trackFacet.facet_id,
            name: facet?.name ?? "",
            code: facet?.code ?? "",
            valueKind: facet?.value_kind ?? "text",
            isRequired: Boolean(trackFacet.is_required),
            displayOrder: trackFacet.display_order,
            dependsOnFacetId: trackFacet.depends_on_facet_id,
            dependsOnOptionId: trackFacet.depends_on_option_id,
            options: optionsByFacetId.get(trackFacet.facet_id) ?? [],
        };
    });
}

export function toUniqueFacetIds(rows) {
    return [...new Set((rows ?? []).map((row) => row.facet_id))];
}
