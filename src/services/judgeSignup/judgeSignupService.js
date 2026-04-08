// Public judge-signup service facade used by UI pages.
//
// Responsibilities:
// - Expose stable, page-facing functions for loading signup config and submitting signup data.
// - Delegate implementation details to focused modules (config builder + registration flow).
//
// Notes:
// - Keep this file thin so page imports stay stable even if internal modules evolve.
// - Business/query logic should live in sibling modules, not here.
import { buildJudgeSignupConfig } from "./judgeSignupConfigService.js";
import { registerJudgeForEvent, resolveJudgeEventRoleId, saveFacetSelections } from "./judgeSignupRegistrationService.js";
import { fetchPersonEventRoleWithFacets } from "./judgeSignupApi.js";
import { toSelectedOptionIdArray } from "./judgeSignupUtils.js";

export async function fetchJudgeSignupConfig() {
    const eventRoleId = await resolveJudgeEventRoleId();

    return buildJudgeSignupConfig(eventRoleId);
}

export async function signUpJudgeForEvent({
    eventInstanceId,
    email,
    displayName,
    selectedFacetOptionByFacetId,
}) {
    return registerJudgeForEvent({
        eventInstanceId,
        email,
        displayName,
        selectedFacetOptionByFacetId,
    });
}

export async function fetchJudgeProfile(personId, eventInstanceId) {
    const [signupConfig, roleRow] = await Promise.all([
        fetchJudgeSignupConfig(),
        fetchPersonEventRoleWithFacets(personId, eventInstanceId),
    ]);

    // Convert flat facet value rows into the same shape the signup form uses
    const selectedFacetOptionByFacetId = {};
    for (const row of roleRow?.person_event_role_facet_value ?? []) {
        const facetId = String(row.facet_id);
        if (!selectedFacetOptionByFacetId[facetId]) {
            selectedFacetOptionByFacetId[facetId] = [];
        }
        selectedFacetOptionByFacetId[facetId].push(row.facet_option_id);
    }

    return {
        personEventRoleId: roleRow?.person_event_role_id ?? null,
        facets: signupConfig.facets,
        selectedFacetOptionByFacetId,
    };
}

export async function updateJudgeProfileFacets(personEventRoleId, selectedFacetOptionByFacetId) {
    await saveFacetSelections(personEventRoleId, selectedFacetOptionByFacetId);
}
