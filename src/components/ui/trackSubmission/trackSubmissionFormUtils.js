function normalizeCode(value) {
    return String(value || "").toUpperCase();
}

export function getDependentParentFacetId(facet, trackFacets) {
    if (facet.dependsOnFacetId) {
        return facet.dependsOnFacetId;
    }

    const isProgramFacet = normalizeCode(facet.code) === "PROGRAM";
    const hasParentedOptions = (facet.options ?? []).some((option) => option.parent_option_id);
    const collegeFacet = (trackFacets ?? []).find(
        (candidate) => normalizeCode(candidate.code) === "COLLEGE"
    );

    if (isProgramFacet && hasParentedOptions && collegeFacet) {
        return collegeFacet.facetId;
    }

    return null;
}

export function applyFacetValueChange({
    previousValues,
    facetId,
    valueField,
    value,
    trackFacets,
}) {
    const next = {
        ...previousValues,
        [facetId]: {
            ...(previousValues[facetId] ?? {}),
            [valueField]: value,
        },
    };

    if (valueField !== "facet_option_id") {
        return next;
    }

    for (const facet of trackFacets ?? []) {
        const parentFacetId = getDependentParentFacetId(facet, trackFacets);
        if (parentFacetId !== facetId) {
            continue;
        }

        const selectedChildOptionId = next[facet.facetId]?.facet_option_id;
        if (!selectedChildOptionId) {
            continue;
        }

        const stillValid = (facet.options ?? []).some((option) => {
            if (option.facet_option_id !== selectedChildOptionId) {
                return false;
            }

            if (!option.parent_option_id) {
                return true;
            }

            return option.parent_option_id === value;
        });

        if (!stillValid) {
            next[facet.facetId] = {
                ...(next[facet.facetId] ?? {}),
                facet_option_id: "",
            };
        }
    }

    return next;
}