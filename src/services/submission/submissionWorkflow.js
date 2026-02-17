// Workflow helpers for person resolution and relational submission writes.
//
// Responsibilities:
// - Resolve/create author and supervisor people from email fields.
// - Ensure STUDENT role assignment exists for newly created authors.
// - Persist author links and facet values for a created submission.

import {
    fetchTrackEventInstanceId,
    findEventRoleIdByCode,
    findEventRoleIdByNameLike,
    findPersonByEmail,
    findPersonEventRoleId,
    insertPerson,
    insertPersonEventRole,
    insertSubmissionAuthor,
    insertSubmissionFacetValues,
} from "./submissionApi.js";
import { normalizeFacetValuePayload } from "./submissionUtils.js";

function buildDisplayNameFromEmail(email) {
    return String(email || "").split("@")[0] || String(email || "");
}

export async function findOrCreatePersonByEmail(createdByEmail) {
    if (!createdByEmail) {
        throw new Error("Author email is required.");
    }

    const normalizedEmail = String(createdByEmail).trim();
    const existingPersonId = await findPersonByEmail(normalizedEmail);

    if (existingPersonId) {
        return {
            personId: existingPersonId,
            wasCreated: false,
        };
    }

    const personId = await insertPerson({
        email: normalizedEmail,
        displayName: buildDisplayNameFromEmail(normalizedEmail),
    });

    return {
        personId,
        wasCreated: true,
    };
}

export async function findOrCreateOptionalPersonIdByEmail(email) {
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) return null;

    const existingPersonId = await findPersonByEmail(normalizedEmail);
    if (existingPersonId) return existingPersonId;

    return insertPerson({
        email: normalizedEmail,
        displayName: buildDisplayNameFromEmail(normalizedEmail),
    });
}

async function resolveStudentEventRoleId() {
    try {
        const roleId = await findEventRoleIdByCode("STUDENT");
        if (roleId) return roleId;
    } catch {
        // Intentionally ignore and continue with fallback query.
    }

    try {
        const roleId = await findEventRoleIdByNameLike("student");
        if (roleId) return roleId;
    } catch {
        // Intentionally ignore and fail with explicit message below.
    }

    throw new Error("No STUDENT role found in event_role. Add a STUDENT role first.");
}

export async function ensureStudentRoleForPersonInEvent({ trackId, personId }) {
    const eventInstanceId = await fetchTrackEventInstanceId(trackId);
    if (!eventInstanceId) return;

    const studentRoleId = await resolveStudentEventRoleId();
    const existingRoleId = await findPersonEventRoleId({
        eventInstanceId,
        personId,
        eventRoleId: studentRoleId,
    });

    if (existingRoleId) return;

    await insertPersonEventRole({
        eventInstanceId,
        personId,
        eventRoleId: studentRoleId,
    });
}

export async function createSubmissionRelations({ submissionId, personId, facetValues }) {
    await insertSubmissionAuthor({ submissionId, personId });

    const payloads = (facetValues ?? []).map((facetValue) =>
        normalizeFacetValuePayload(submissionId, facetValue)
    );

    await insertSubmissionFacetValues(payloads);
}
