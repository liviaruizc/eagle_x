// Judge-signup registration workflow orchestrator.
//
// Responsibilities:
// - Resolve the judge event-role with resilient fallback rules.
// - Find/create person and person-event-role records.
// - Persist selected facet values for the role assignment.
//
// Notes:
// - Keeps business flow in one place while delegating DB calls to API helpers.
import {
    deletePersonEventRoleFacetValues,
    fetchFacetOptionsByIds,
    findFirstEventRoleId,
    findJudgeRoleByCode,
    findJudgeRoleByName,
    findPersonEventRoleId,
    findPersonIdByEmail,
    insertPerson,
    insertPersonEventRole,
    insertPersonEventRoleFacetValues,
} from "./judgeSignupApi.js";
import { buildFacetValuePayload, toSelectedOptionIdArray } from "./judgeSignupUtils.js";

export async function resolveJudgeEventRoleId() {
    try {
        const roleId = await findJudgeRoleByCode();
        if (roleId) return roleId;
    } catch (error) {
        console.warn("Could not resolve judge role by code.", error);
    }

    try {
        const roleId = await findJudgeRoleByName();
        if (roleId) return roleId;
    } catch (error) {
        console.warn("Could not resolve judge role by name.", error);
    }

    try {
        const roleId = await findFirstEventRoleId();
        if (roleId) {
            console.warn("Falling back to first event_role_id for judge signup role resolution.");
            return roleId;
        }
    } catch (error) {
        console.warn("Could not resolve judge role by fallback query.", error);
    }

    throw new Error(
        "No role found in event_role. Run sql/20260212_seed_judge_role_facets.sql (or insert a judge role manually) and try again."
    );
}

async function findOrCreatePerson({ email, displayName }) {
    const normalizedEmail = email.trim();
    const normalizedDisplayName = displayName.trim();

    const existingPersonId = await findPersonIdByEmail(normalizedEmail);
    if (existingPersonId) return existingPersonId;

    return insertPerson({
        email: normalizedEmail,
        displayName: normalizedDisplayName,
    });
}

async function findOrCreatePersonEventRole({ eventInstanceId, personId, eventRoleId }) {
    const personEventRoleId = await findPersonEventRoleId({
        eventInstanceId,
        personId,
        eventRoleId,
    });

    if (personEventRoleId) return personEventRoleId;

    return insertPersonEventRole({
        eventInstanceId,
        personId,
        eventRoleId,
    });
}

async function saveFacetSelections(personEventRoleId, selectedFacetOptionByFacetId) {
    const facetIds = Object.keys(selectedFacetOptionByFacetId ?? {});
    if (!facetIds.length) return;

    const selectedOptionIds = facetIds.flatMap((facetId) =>
        toSelectedOptionIdArray(selectedFacetOptionByFacetId[facetId])
    );

    const selectedOptions = await fetchFacetOptionsByIds(selectedOptionIds);
    const optionById = new Map((selectedOptions ?? []).map((option) => [option.facet_option_id, option]));

    const payloads = facetIds.flatMap((facetId) => {
        const selectedIds = toSelectedOptionIdArray(selectedFacetOptionByFacetId[facetId]);

        return selectedIds.map((selectedOptionId) => {
            const selectedOption = optionById.get(selectedOptionId);
            return buildFacetValuePayload(personEventRoleId, facetId, selectedOption);
        });
    });

    await deletePersonEventRoleFacetValues(personEventRoleId, facetIds);
    await insertPersonEventRoleFacetValues(payloads);
}

export async function registerJudgeForEvent({
    eventInstanceId,
    email,
    displayName,
    selectedFacetOptionByFacetId,
}) {
    const eventRoleId = await resolveJudgeEventRoleId();
    const personId = await findOrCreatePerson({ email, displayName });
    const personEventRoleId = await findOrCreatePersonEventRole({
        eventInstanceId,
        personId,
        eventRoleId,
    });

    await saveFacetSelections(personEventRoleId, selectedFacetOptionByFacetId);

    return { personId, personEventRoleId };
}
