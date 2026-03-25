// Admin-facing service for creating judges and admins.
//
// Responsibilities:
// - Allow admins to create judges and admins directly from the admin interface.
// - Handle person creation and role assignment.
// - Resolve role IDs with appropriate fallbacks.

import {
    findJudgeRoleByCode,
    findJudgeRoleByName,
    findFirstEventRoleId,
    findPersonIdByEmail,
    insertPerson,
    insertPersonEventRole,
} from "./judgeSignupApi.js";

// Resolves a role by code with fallback logic.
async function resolveRoleId(roleCode) {
    try {
        if (roleCode === "judge") {
            const roleId = await findJudgeRoleByCode();
            if (roleId) return roleId;
        }

        // Fallback to name-based search
        const roleId = await findJudgeRoleByName();
        if (roleId) return roleId;

        // Last resort: use first available role
        const fallbackRoleId = await findFirstEventRoleId();
        if (fallbackRoleId) {
            console.warn(`Falling back to first event_role_id for ${roleCode} role resolution.`);
            return fallbackRoleId;
        }
    } catch (error) {
        console.warn(`Could not resolve role for ${roleCode}.`, error);
    }

    throw new Error(
        `No role found in event_role table. Please run SQL migrations to ensure roles are seeded.`
    );
}

// Creates a new person and assigns them a role for a specific event.
// Returns { personId, personEventRoleId, email, displayName, role }.
export async function createJudgeOrAdmin({
    email,
    displayName,
    role = "judge", // "judge" or "admin"
    eventInstanceId,
}) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();

    // Validate inputs
    if (!normalizedEmail || !normalizedDisplayName) {
        throw new Error("Email and display name are required.");
    }

    if (!["judge", "admin"].includes(role)) {
        throw new Error("Role must be either 'judge' or 'admin'.");
    }

    if (!eventInstanceId) {
        throw new Error("Event instance ID is required.");
    }

    // Check if person already exists
    const existingPersonId = await findPersonIdByEmail(normalizedEmail);
    if (existingPersonId) {
        throw new Error(`A user with email ${normalizedEmail} already exists.`);
    }

    // Resolve the role ID
    const roleId = await resolveRoleId(role);

    // Create the person
    const personId = await insertPerson({
        email: normalizedEmail,
        displayName: normalizedDisplayName,
    });

    // Assign the role for this event
    const personEventRoleId = await insertPersonEventRole({
        eventInstanceId,
        personId,
        eventRoleId: roleId,
    });

    return {
        personId,
        personEventRoleId,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        role,
    };
}
