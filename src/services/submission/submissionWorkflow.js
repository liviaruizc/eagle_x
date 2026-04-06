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

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

export async function findOrCreatePersonByEmail(createdByEmail) {
    if (!createdByEmail) {
        throw new Error("Author email is required.");
    }

    const normalizedEmail = normalizeEmail(createdByEmail);
    const existingPersonId = await findPersonByEmail(normalizedEmail);

    if (existingPersonId) {
        return {
            personId: existingPersonId,
            wasCreated: false,
        };
    }

    try {
        const personId = await insertPerson({
            email: normalizedEmail,
            displayName: buildDisplayNameFromEmail(normalizedEmail),
        });

        return {
            personId,
            wasCreated: true,
        };
    } catch (error) {
        // If a concurrent row created the same email first, reuse it.
        if (error?.code === "23505") {
            const conflictPersonId = await findPersonByEmail(normalizedEmail);
            if (conflictPersonId) {
                return {
                    personId: conflictPersonId,
                    wasCreated: false,
                };
            }
        }

        throw error;
    }
}

export async function findOrCreateOptionalPersonIdByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const existingPersonId = await findPersonByEmail(normalizedEmail);
    if (existingPersonId) return existingPersonId;

    try {
        return await insertPerson({
            email: normalizedEmail,
            displayName: buildDisplayNameFromEmail(normalizedEmail),
        });
    } catch (error) {
        if (error?.code === "23505") {
            const conflictPersonId = await findPersonByEmail(normalizedEmail);
            if (conflictPersonId) return conflictPersonId;
        }

        throw error;
    }
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

export async function createSubmissionRelations({ submissionId, authorPersonIds, facetValues }) {
    const uniquePersonIds = [...new Set((authorPersonIds ?? []).filter(Boolean))];

    for (const personId of uniquePersonIds) {
        await insertSubmissionAuthor({ submissionId, personId });
    }

    const payloads = (facetValues ?? []).map((facetValue) =>
        normalizeFacetValuePayload(submissionId, facetValue)
    );

    await insertSubmissionFacetValues(payloads);
}
