// Shared constants and pure helper utilities for judge-signup modules.
//
// Responsibilities:
// - Normalize selected option inputs and build facet-value payload shapes.
// - Provide reusable collection transforms for facet rows/options.
// - Centralize signup facet code constants used by config assembly.
//
// Notes:
// - Utilities here should be side-effect free and framework agnostic.
export const JUDGE_SIGNUP_FALLBACK_FACET_CODES = ["COLLEGE", "DEPARTMENT", "PROGRAM"];
export const JUDGE_SIGNUP_REQUIRED_FACET_CODES = ["PROGRAM", "DEPARTMENT"];

export function toSelectedOptionIdArray(selectedValue) {
    if (Array.isArray(selectedValue)) {
        return selectedValue.filter(Boolean).map((value) => String(value));
    }

    if (!selectedValue) return [];
    return [String(selectedValue)];
}

export function buildFacetValuePayload(personEventRoleId, facetId, facetOption) {
    return {
        person_event_role_id: personEventRoleId,
        facet_id: facetId,
        facet_option_id: facetOption?.facet_option_id ?? null,
        value_text: facetOption?.label ?? facetOption?.value ?? null,
        value_number: null,
        value_date: null,
    };
}

export function toUniqueFacetIds(facetRows) {
    return [...new Set((facetRows ?? []).map((item) => item.facet_id))];
}

export function toFacetDisplayRows(facetRows, facetById, optionsByFacetId) {
    return (facetRows ?? []).map((row) => {
        const facet = facetById.get(row.facet_id);

        return {
            facetId: row.facet_id,
            code: facet?.code ?? "",
            name: facet?.name ?? "",
            valueKind: facet?.value_kind ?? "text",
            isRequired: Boolean(row.is_required),
            displayOrder: row.display_order,
            options: optionsByFacetId.get(row.facet_id) ?? [],
        };
    });
}

export function appendMissingFacetRows(existingRows, facetRowsToAppend) {
    const facetRows = [...(existingRows ?? [])];
    const includedFacetIds = new Set(facetRows.map((row) => row.facet_id));
    const maxDisplayOrder = facetRows.reduce(
        (maxValue, row) => Math.max(maxValue, Number(row.display_order) || 0),
        0
    );

    let nextDisplayOrder = maxDisplayOrder + 1;

    for (const facet of facetRowsToAppend ?? []) {
        if (!facet?.facet_id || includedFacetIds.has(facet.facet_id)) continue;

        facetRows.push({
            event_role_facet_id: null,
            facet_id: facet.facet_id,
            is_required: true,
            display_order: nextDisplayOrder,
        });

        includedFacetIds.add(facet.facet_id);
        nextDisplayOrder += 1;
    }

    return facetRows;
}

export function groupFacetOptionsByFacetId(options) {
    const optionsByFacetId = new Map();

    for (const option of options ?? []) {
        const current = optionsByFacetId.get(option.facet_id) ?? [];
        current.push(option);
        optionsByFacetId.set(option.facet_id, current);
    }

    return optionsByFacetId;
}
