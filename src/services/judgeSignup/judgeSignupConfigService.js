// Judge-signup configuration builder.
//
// Responsibilities:
// - Compose the facet configuration shown in signup UI for a specific role.
// - Apply fallback/required facet rules and include derived child facets when needed.
// - Return normalized, display-ready facet objects with sorted options.
//
// Notes:
// - Uses API module for raw reads and utils module for collection transforms.
import {
    fetchChildFacetRowsByParentOptionIds,
    fetchFacetIdsByCodes,
    fetchFacetOptionRowsByFacetIds,
    fetchFacetOptionsByFacetIds,
    fetchFacetRowsByIds,
    fetchRoleFacets,
} from "./judgeSignupApi.js";
import {
    appendMissingFacetRows,
    groupFacetOptionsByFacetId,
    JUDGE_SIGNUP_FALLBACK_FACET_CODES,
    JUDGE_SIGNUP_REQUIRED_FACET_CODES,
    toFacetDisplayRows,
    toUniqueFacetIds,
} from "./judgeSignupUtils.js";

async function withFallbackFacetRows(eventRoleId) {
    const roleFacetRows = await fetchRoleFacets(eventRoleId);
    if (roleFacetRows.length) return roleFacetRows;

    const fallbackFacets = await fetchFacetIdsByCodes(JUDGE_SIGNUP_FALLBACK_FACET_CODES);

    return fallbackFacets.map((facet, index) => ({
        event_role_facet_id: null,
        facet_id: facet.facet_id,
        is_required: true,
        display_order: index + 1,
    }));
}

async function withRequiredFacetRows(facetRows) {
    const requiredFacets = await fetchFacetIdsByCodes(JUDGE_SIGNUP_REQUIRED_FACET_CODES);
    return appendMissingFacetRows(facetRows, requiredFacets);
}

async function withChildFacetRows(facetRows) {
    const baseFacetIds = toUniqueFacetIds(facetRows);
    const baseOptions = await fetchFacetOptionRowsByFacetIds(baseFacetIds);
    const baseOptionIds = baseOptions.map((option) => option.facet_option_id);
    const childFacetRows = await fetchChildFacetRowsByParentOptionIds(baseOptionIds);

    return appendMissingFacetRows(facetRows, childFacetRows);
}

export async function buildJudgeSignupConfig(eventRoleId) {
    let facetRows = await withFallbackFacetRows(eventRoleId);
    facetRows = await withRequiredFacetRows(facetRows);

    if (!facetRows.length) {
        return {
            eventRoleId,
            facets: [],
        };
    }

    facetRows = await withChildFacetRows(facetRows);

    const facetIds = toUniqueFacetIds(facetRows);
    const [facets, options] = await Promise.all([
        fetchFacetRowsByIds(facetIds),
        fetchFacetOptionsByFacetIds(facetIds),
    ]);

    const facetById = new Map((facets ?? []).map((facet) => [facet.facet_id, facet]));
    const optionsByFacetId = groupFacetOptionsByFacetId(options);

    return {
        eventRoleId,
        facets: toFacetDisplayRows(facetRows, facetById, optionsByFacetId),
    };
}
