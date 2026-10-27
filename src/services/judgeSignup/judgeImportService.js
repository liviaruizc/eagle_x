import {
    deletePersonEventRoleFacetValues,
    fetchFacetOptionsByFacetIds,
    fetchFacetRowsByIds,
    findJudgeRoleByCode,
    findJudgeRoleByName,
    findPersonEventRoleId,
    findPersonIdByEmail,
    insertPerson,
    insertPersonEventRole,
    insertPersonEventRoleFacetValues,
} from "./judgeSignupApi.js";
import { fetchRoleFacets } from "./judgeSignupApi.js";
import { parseJudgeImportExcelFile } from "./judgeImportExcel.js";
import { supabase } from "../../lib/supabaseClient.js";

const FACET_CODE_GROUPS = {
    college: ["JUDGE_COLLEGE_PREFERENCE", "COLLEGE"],
    class: ["JUDGE_CLASSES_TAUGHT", "PROGRAM", "MAJOR", "DEPARTMENT"],
    session: ["JUDGE_SESSION_PREFERENCE", "SESSION"],
};

async function resolveJudgeRoleId() {
    const byCode = await findJudgeRoleByCode();
    if (byCode) return byCode;

    const byName = await findJudgeRoleByName();
    if (byName) return byName;

    throw new Error("Judge role not found in event_role.");
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

async function ensureRoleFacetLink(eventRoleId, facetId) {
    const rows = await fetchRoleFacets(eventRoleId);
    const alreadyLinked = (rows ?? []).some((row) => String(row.facet_id) === String(facetId));
    if (alreadyLinked) return;

    const { error } = await supabase
        .from("event_role_facet")
        .insert({
            event_role_id: eventRoleId,
            facet_id: facetId,
            is_required: false,
            display_order: 1,
        });

    if (error) throw error;
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
        const normalizedCode = String(code).trim().toUpperCase();
        if (!normalizedCode) continue;

        const byValue = lookup.byValue.get(normalizedCode);
        const byLabel = lookup.byLabel.get(normalizedCode);
        const matched = byValue || byLabel;

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

async function findOrCreatePerson({ email, displayName, firstName, lastName }) {
    const { data: existingPerson, error: existingPersonError } = await supabase
        .from("person")
        .select("person_id, display_name, first_name, last_name")
        .eq("email", email)
        .maybeSingle();

    if (existingPersonError) throw existingPersonError;

    if (existingPerson?.person_id) {
        const nextDisplayName = displayName || existingPerson.display_name;
        const nextFirstName = firstName || existingPerson.first_name;
        const nextLastName = lastName || existingPerson.last_name;

        const needsUpdate =
            existingPerson.display_name !== nextDisplayName ||
            existingPerson.first_name !== nextFirstName ||
            existingPerson.last_name !== nextLastName;

        if (needsUpdate) {
            const { error: updatePersonError } = await supabase
                .from("person")
                .update({
                    display_name: nextDisplayName,
                    first_name: nextFirstName,
                    last_name: nextLastName,
                })
                .eq("person_id", existingPerson.person_id);

            if (updatePersonError) throw updatePersonError;
        }

        return {
            personId: existingPerson.person_id,
            existed: true,
        };
    }

    const existingPersonId = await findPersonIdByEmail(email);
    if (existingPersonId) {
        return {
            personId: existingPersonId,
            existed: true,
        };
    }

    const personId = await insertPerson({
        email,
        displayName: displayName || `${firstName || ""} ${lastName || ""}`.trim() || email,
    });

    return {
        personId,
        existed: false,
    };
}

async function findOrCreateJudgeEventRole({ eventInstanceId, personId, eventRoleId }) {
    const existing = await findPersonEventRoleId({
        eventInstanceId,
        personId,
        eventRoleId,
    });

    if (existing) return existing;

    return insertPersonEventRole({
        eventInstanceId,
        personId,
        eventRoleId,
    });
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

export async function importJudgesFromCleanedExcel({ file, eventInstanceId }) {
    if (!eventInstanceId) {
        throw new Error("Event instance id is required for judge import.");
    }

    const rows = await parseJudgeImportExcelFile(file);
    if (!rows.length) {
        return {
            imported: 0,
            updated: 0,
            unmatched: [],
            rowErrors: [],
        };
    }

    const judgeRoleId = await resolveJudgeRoleId();

    const [collegeFacet, classFacet, sessionFacet] = await Promise.all([
        fetchFacetByCandidateCodes(FACET_CODE_GROUPS.college),
        fetchFacetByCandidateCodes(FACET_CODE_GROUPS.class),
        fetchFacetByCandidateCodes(FACET_CODE_GROUPS.session),
    ]);

    const managedFacets = [collegeFacet, classFacet, sessionFacet].filter(Boolean);

    if (!managedFacets.length) {
        throw new Error("No judge import facets found. Create facets for college/class/session first.");
    }

    await Promise.all(managedFacets.map((facet) => ensureRoleFacetLink(judgeRoleId, facet.facet_id)));

    const facetRows = await fetchFacetRowsByIds(managedFacets.map((facet) => facet.facet_id));
    const facetIdSet = new Set((facetRows ?? []).map((row) => row.facet_id));

    const options = await fetchFacetOptionsByFacetIds([...facetIdSet]);

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

    let imported = 0;
    let updated = 0;
    const unmatched = [];
    const rowErrors = [];

    for (const row of rows) {
        try {
            const personResult = await findOrCreatePerson(row);
            const personId = personResult.personId;
            const personEventRoleId = await findOrCreateJudgeEventRole({
                eventInstanceId,
                personId,
                eventRoleId: judgeRoleId,
            });

            const collegeResult = collegeLookup
                ? resolveOptionIds(row.collegeCodes, collegeLookup)
                : { matchedOptionIds: [], unmatchedCodes: row.collegeCodes };
            const classResult = classLookup
                ? resolveOptionIds(row.classCodes, classLookup)
                : { matchedOptionIds: [], unmatchedCodes: row.classCodes };
            const sessionResult = sessionLookup
                ? resolveOptionIds(row.sessionCodes, sessionLookup)
                : { matchedOptionIds: [], unmatchedCodes: row.sessionCodes };

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

            for (const code of collegeResult.unmatchedCodes) {
                unmatched.push({
                    rowNumber: row.rowNumber,
                    email: row.email,
                    column: "college_codes",
                    code,
                });
            }

            for (const code of classResult.unmatchedCodes) {
                unmatched.push({
                    rowNumber: row.rowNumber,
                    email: row.email,
                    column: "class_codes",
                    code,
                });
            }

            for (const code of sessionResult.unmatchedCodes) {
                unmatched.push({
                    rowNumber: row.rowNumber,
                    email: row.email,
                    column: "session_code",
                    code,
                });
            }

            if (personResult.existed) {
                updated += 1;
            } else {
                imported += 1;
            }
        } catch (error) {
            rowErrors.push({
                rowNumber: row.rowNumber,
                email: row.email,
                message: error.message || "Import failed for row.",
            });
        }
    }

    return {
        imported,
        updated,
        unmatched,
        rowErrors,
    };
}
