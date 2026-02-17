// Shared pure helpers for JudgeSignupPage state updates and facet behavior.

export function normalizeSelectedOptionIds(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean).map((item) => String(item));
    }

    if (!value) return [];
    return [String(value)];
}

export function isCollegeFacet(facet) {
    return String(facet?.code || "").toUpperCase() === "COLLEGE";
}

export function isMultiProgramFacet(facet) {
    const code = String(facet?.code || "").toUpperCase();
    const hasParentLinkedOptions = (facet?.options ?? []).some((option) => option.parent_option_id);
    return code === "PROGRAM" || code === "DEPARTMENT" || hasParentLinkedOptions;
}

export function getCollegeFacetId(facets) {
    const collegeFacet = (facets ?? []).find(isCollegeFacet);
    return collegeFacet?.facetId ?? null;
}

export function pruneProgramSelectionsByColleges({ nextSelections, facets, collegeFacetId }) {
    if (!collegeFacetId) {
        return nextSelections;
    }

    const selectedCollegeOptionIds = new Set(normalizeSelectedOptionIds(nextSelections[collegeFacetId]));
    const prunedSelections = { ...nextSelections };

    for (const facet of facets ?? []) {
        if (!isMultiProgramFacet(facet)) continue;

        const hasParentLinkedOptions = (facet.options ?? []).some((option) => option.parent_option_id);
        if (!hasParentLinkedOptions) continue;

        const allowedOptionIds = new Set(
            (facet.options ?? [])
                .filter(
                    (option) =>
                        !option.parent_option_id ||
                        selectedCollegeOptionIds.has(String(option.parent_option_id))
                )
                .map((option) => String(option.facet_option_id))
        );

        const currentSelections = normalizeSelectedOptionIds(prunedSelections[facet.facetId]);
        prunedSelections[facet.facetId] = currentSelections.filter((selectedId) =>
            allowedOptionIds.has(selectedId)
        );
    }

    return prunedSelections;
}

function maybePruneByCollege({ nextSelections, facetId, collegeFacetId, facets }) {
    if (facetId !== collegeFacetId) {
        return nextSelections;
    }

    return pruneProgramSelectionsByColleges({
        nextSelections,
        facets,
        collegeFacetId,
    });
}

export function updateSingleFacetSelection({ previousSelections, facetId, optionId, collegeFacetId, facets }) {
    const nextSelections = {
        ...previousSelections,
        [facetId]: optionId,
    };

    return maybePruneByCollege({
        nextSelections,
        facetId,
        collegeFacetId,
        facets,
    });
}

export function updatePrimarySelection({ previousSelections, facetId, optionId, collegeFacetId, facets }) {
    const current = Array.isArray(previousSelections[facetId]) ? previousSelections[facetId] : [];
    const secondValue = current[1];
    const normalizedPrimary = optionId ? String(optionId) : "";

    const nextSelections = {
        ...previousSelections,
        [facetId]: !normalizedPrimary
            ? secondValue
                ? [secondValue]
                : []
            : secondValue && secondValue !== normalizedPrimary
              ? [normalizedPrimary, secondValue]
              : [normalizedPrimary],
    };

    return maybePruneByCollege({
        nextSelections,
        facetId,
        collegeFacetId,
        facets,
    });
}

export function updateSecondarySelection({ previousSelections, facetId, optionId, collegeFacetId, facets }) {
    const current = Array.isArray(previousSelections[facetId]) ? previousSelections[facetId] : [];
    const primaryValue = current[0] ? String(current[0]) : "";
    const normalizedSecondary = optionId ? String(optionId) : "";

    let nextValue = [];
    if (!primaryValue) {
        nextValue = normalizedSecondary ? [normalizedSecondary] : [];
    } else if (!normalizedSecondary || normalizedSecondary === primaryValue) {
        nextValue = [primaryValue];
    } else {
        nextValue = [primaryValue, normalizedSecondary];
    }

    const nextSelections = {
        ...previousSelections,
        [facetId]: nextValue,
    };

    return maybePruneByCollege({
        nextSelections,
        facetId,
        collegeFacetId,
        facets,
    });
}

export function removeSecondSelectionFromFacet({ previousSelections, facetId, collegeFacetId, facets }) {
    const current = Array.isArray(previousSelections[facetId]) ? previousSelections[facetId] : [];

    const nextSelections = {
        ...previousSelections,
        [facetId]: current.length ? [current[0]] : [],
    };

    return maybePruneByCollege({
        nextSelections,
        facetId,
        collegeFacetId,
        facets,
    });
}

export function getProgramOptionsForFacet({ facet, collegeFacetId, selectedFacetOptionByFacetId }) {
    const options = facet.options ?? [];
    const hasParentLinkedOptions = options.some((option) => option.parent_option_id);

    if (!hasParentLinkedOptions) {
        return options;
    }

    const selectedCollegeOptionIds = normalizeSelectedOptionIds(
        collegeFacetId ? selectedFacetOptionByFacetId[collegeFacetId] : null
    );

    if (!selectedCollegeOptionIds.length) {
        return [];
    }

    return options.filter(
        (option) =>
            !option.parent_option_id ||
            selectedCollegeOptionIds.includes(String(option.parent_option_id))
    );
}

export function hasFacetValue(selectedFacetOptionByFacetId, facetId) {
    const value = selectedFacetOptionByFacetId[facetId];

    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
}
