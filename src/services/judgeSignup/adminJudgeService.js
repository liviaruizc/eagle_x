// Admin-facing service for creating judges and admins.
//
// Responsibilities:
// - Allow admins to create judges and admins directly from the admin interface.
// - Handle person creation and role assignment.
// - Resolve role IDs with appropriate fallbacks.

import {
    deletePersonEventRoleFacetValues,
    fetchFacetOptionsByFacetIds,
    fetchFacetRowsByIds,
    findPersonEventRoleId,
    findJudgeRoleByCode,
    findJudgeRoleByName,
    findFirstEventRoleId,
    findPersonIdByEmail,
    insertPerson,
    insertPersonEventRole,
    insertPersonEventRoleFacetValues,
} from "./judgeSignupApi.js";
import { supabase } from "../../lib/supabaseClient.js";

const FACET_CODE_GROUPS = {
    college: ["JUDGE_COLLEGE_PREFERENCE", "COLLEGE"],
    class: ["JUDGE_CLASSES_TAUGHT", "PROGRAM", "MAJOR", "DEPARTMENT"],
    session: ["JUDGE_SESSION_PREFERENCE", "SESSION"],
};

function parsePipeCodes(value) {
    return String(value ?? "")
        .split("|")
        .map((token) => token.trim())
        .filter(Boolean);
}

function buildOptionLookup(options) {
    const byValue = new Map();
    const byLabel = new Map();

    for (const option of options ?? []) {
        const normalizedValue = String(option.value || "").trim().toUpperCase();
        const normalizedLabel = String(option.label || "").trim().toUpperCase();

        if (normalizedValue && !byValue.has(normalizedValue)) {
            byValue.set(normalizedValue, option);
        }

        if (normalizedLabel && !byLabel.has(normalizedLabel)) {
            byLabel.set(normalizedLabel, option);
        }
    }

    return { byValue, byLabel };
}

function resolveOptionIds(codes, lookup) {
    const matchedOptionIds = [];
    const unmatchedCodes = [];

    for (const code of codes ?? []) {
        const normalizedCode = String(code || "").trim().toUpperCase();
        if (!normalizedCode) continue;

        const matched = lookup.byValue.get(normalizedCode) || lookup.byLabel.get(normalizedCode);
        if (matched?.facet_option_id) {
            matchedOptionIds.push(matched.facet_option_id);
        } else {
            unmatchedCodes.push(code);
        }
    }

    return {
        matchedOptionIds: [...new Set(matchedOptionIds)],
        unmatchedCodes,
    };
}

async function fetchFacetByCandidateCodes(candidateCodes) {
    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code, name");

    if (error) throw error;

    const rows = data ?? [];
    const byCode = new Map(rows.map((row) => [String(row.code || "").toUpperCase(), row]));

    for (const code of candidateCodes) {
        const matched = byCode.get(code.toUpperCase());
        if (matched) return matched;
    }

    return null;
}

async function replaceFacetValues({ personEventRoleId, facetId, optionIds }) {
    await deletePersonEventRoleFacetValues(personEventRoleId, [facetId]);

    if (!optionIds.length) return;

    const payloads = optionIds.map((optionId) => ({
        person_event_role_id: personEventRoleId,
        facet_id: facetId,
        facet_option_id: optionId,
        value_text: null,
        value_number: null,
        value_date: null,
    }));

    await insertPersonEventRoleFacetValues(payloads);
}

async function assignJudgeFacetValues({ personEventRoleId, collegeCodes, classCodes, sessionCodes }) {
    const [collegeFacet, classFacet, sessionFacet] = await Promise.all([
        fetchFacetByCandidateCodes(FACET_CODE_GROUPS.college),
        fetchFacetByCandidateCodes(FACET_CODE_GROUPS.class),
        fetchFacetByCandidateCodes(FACET_CODE_GROUPS.session),
    ]);

    const managedFacets = [collegeFacet, classFacet, sessionFacet].filter(Boolean);
    if (!managedFacets.length) {
        return { unmatched: [] };
    }

    const facetRows = await fetchFacetRowsByIds(managedFacets.map((facet) => facet.facet_id));
    const facetIds = (facetRows ?? []).map((row) => row.facet_id);
    const options = await fetchFacetOptionsByFacetIds(facetIds);

    const optionsByFacetId = new Map();
    for (const option of options ?? []) {
        const key = String(option.facet_id);
        if (!optionsByFacetId.has(key)) {
            optionsByFacetId.set(key, []);
        }
        optionsByFacetId.get(key).push(option);
    }

    const collegeLookup = collegeFacet
        ? buildOptionLookup(optionsByFacetId.get(String(collegeFacet.facet_id)) ?? [])
        : null;
    const classLookup = classFacet
        ? buildOptionLookup(optionsByFacetId.get(String(classFacet.facet_id)) ?? [])
        : null;
    const sessionLookup = sessionFacet
        ? buildOptionLookup(optionsByFacetId.get(String(sessionFacet.facet_id)) ?? [])
        : null;

    const collegeResult = collegeLookup
        ? resolveOptionIds(collegeCodes, collegeLookup)
        : { matchedOptionIds: [], unmatchedCodes: collegeCodes };
    const classResult = classLookup
        ? resolveOptionIds(classCodes, classLookup)
        : { matchedOptionIds: [], unmatchedCodes: classCodes };
    const sessionResult = sessionLookup
        ? resolveOptionIds(sessionCodes, sessionLookup)
        : { matchedOptionIds: [], unmatchedCodes: sessionCodes };

    if (collegeFacet) {
        await replaceFacetValues({
            personEventRoleId,
            facetId: collegeFacet.facet_id,
            optionIds: collegeResult.matchedOptionIds,
        });
    }

    if (classFacet) {
        await replaceFacetValues({
            personEventRoleId,
            facetId: classFacet.facet_id,
            optionIds: classResult.matchedOptionIds,
        });
    }

    if (sessionFacet) {
        await replaceFacetValues({
            personEventRoleId,
            facetId: sessionFacet.facet_id,
            optionIds: sessionResult.matchedOptionIds,
        });
    }

    const unmatched = [
        ...collegeResult.unmatchedCodes.map((code) => ({ column: "college_codes", code })),
        ...classResult.unmatchedCodes.map((code) => ({ column: "class_codes", code })),
        ...sessionResult.unmatchedCodes.map((code) => ({ column: "session_code", code })),
    ];

    return { unmatched };
}

// Resolves a role by code with fallback logic.
async function resolveRoleId(roleCode) {
    try {
        if (roleCode === "judge") {
            const roleId = await findJudgeRoleByCode();
            if (roleId) return roleId;
        }

        if (roleCode === "admin") {
            const { data: adminByCode, error: adminByCodeError } = await supabase
                .from("event_role")
                .select("event_role_id")
                .ilike("code", "admin")
                .maybeSingle();

            if (adminByCodeError) throw adminByCodeError;
            if (adminByCode?.event_role_id) return adminByCode.event_role_id;

            const { data: adminByName, error: adminByNameError } = await supabase
                .from("event_role")
                .select("event_role_id")
                .ilike("name", "%admin%")
                .maybeSingle();

            if (adminByNameError) throw adminByNameError;
            if (adminByName?.event_role_id) return adminByName.event_role_id;
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
    isGlobalAdmin = false,
    collegeCodesInput = "",
    classCodesInput = "",
    sessionCodesInput = "",
}) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    const collegeCodes = parsePipeCodes(collegeCodesInput);
    const classCodes = parsePipeCodes(classCodesInput);
    const sessionCodes = parsePipeCodes(sessionCodesInput);

    // Validate inputs
    if (!normalizedEmail || !normalizedDisplayName) {
        throw new Error("Email and display name are required.");
    }

    if (!["judge", "admin"].includes(role)) {
        throw new Error("Role must be either 'judge' or 'admin'.");
    }

    if (role === "judge" && !eventInstanceId) {
        throw new Error("Event instance ID is required.");
    }

    if (role === "admin" && !isGlobalAdmin && !eventInstanceId) {
        throw new Error("Event instance ID is required for event admins.");
    }

    // Resolve the role ID
    const roleId = await resolveRoleId(role);

    const targetEventInstanceId = role === "admin" && isGlobalAdmin
        ? null
        : eventInstanceId;

    let personId = await findPersonIdByEmail(normalizedEmail);
    let personWasCreated = false;

    if (!personId) {
        try {
            personId = await insertPerson({
                email: normalizedEmail,
                displayName: normalizedDisplayName,
            });
            personWasCreated = true;
        } catch (error) {
            if (error?.code === "23505") {
                personId = await findPersonIdByEmail(normalizedEmail);
            } else {
                throw error;
            }
        }
    }

    if (!personId) {
        throw new Error(`Could not resolve person for ${normalizedEmail}.`);
    }

    let personEventRoleId = await findPersonEventRoleId({
        eventInstanceId: targetEventInstanceId,
        personId,
        eventRoleId: roleId,
    });

    // Judges and event admins are event-linked. Global admins are not.
    if (!personEventRoleId) {
        personEventRoleId = await insertPersonEventRole({
            eventInstanceId: targetEventInstanceId,
            personId,
            eventRoleId: roleId,
        });
    }

    let unmatched = [];
    if (role === "judge") {
        const facetResult = await assignJudgeFacetValues({
            personEventRoleId,
            collegeCodes,
            classCodes,
            sessionCodes,
        });
        unmatched = facetResult.unmatched;
    }

    return {
        personId,
        personEventRoleId,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        role,
        unmatched,
        created: personWasCreated,
    };
}
