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
import { registerJudgeForEvent, resolveJudgeEventRoleId } from "./judgeSignupRegistrationService.js";

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
