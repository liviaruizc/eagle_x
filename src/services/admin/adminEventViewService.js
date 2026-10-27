import {
    deletePersonById,
    deletePersonEventRolesByPersonId,
    fetchJudgesForEvent,
} from "../judgeSignup/judgeSignupApi.js";
import {
    fetchAdminProjectRowsByEvent,
    fetchAdminProjectRowsByTrack,
    fetchSubmissionIdsByEvent,
} from "../submission/submissionApi.js";
import {
    createEventTable,
    fetchEventTableByNumber,
    upsertSubmissionTableAssignment,
} from "../tables/tablesApi.js";
import { fetchScoreSheetsBySubmissionIds } from "../score/scoreApi.js";

function mapProjectRow(row) {
    const participants = (row.submission_author ?? [])
        .map((authorRow) => authorRow.person)
        .filter(Boolean)
        .map((person) => ({
            personId: person.person_id,
            displayName: person.display_name || "Unknown",
            email: person.email || "",
        }));

    const tableAssignment = Array.isArray(row.table_assignment)
        ? row.table_assignment[0]
        : row.table_assignment;
    const tableInfo = tableAssignment?.event_table ?? null;

    // Build facets array and token lookup for filter compatibility
    const facets = [];
    const facetTokensByFacetId = {};

    for (const fv of row.submission_facet_value ?? []) {
        if (!fv.facet) continue;

        const option = fv.facet_option;
        const label = option?.label || option?.value || fv.value_text
            || (fv.value_number != null ? String(fv.value_number) : null);
        if (!label) continue;

        const token = fv.facet_option_id
            ? String(fv.facet_option_id)
            : fv.value_text
            ? `text:${fv.value_text}`
            : `number:${fv.value_number}`;

        facets.push({
            facetId: fv.facet_id,
            code: fv.facet.code,
            name: fv.facet.name,
            token,
            label,
        });

        const existing = facetTokensByFacetId[fv.facet_id] ?? [];
        if (!existing.includes(token)) existing.push(token);
        facetTokensByFacetId[fv.facet_id] = existing;
    }

    // Synthesize a Session facet from the table assignment session field
    const sessionCode = String(tableInfo?.session ?? "").trim().toUpperCase();
    if (sessionCode) {
        const sessionToken = `session:${sessionCode}`;
        const sessionLabel = `Session ${sessionCode}`;
        facets.push({
            facetId: "__SESSION__",
            code: "SESSION",
            name: "Session",
            token: sessionToken,
            label: sessionLabel,
        });
        facetTokensByFacetId["__SESSION__"] = [sessionToken];
    }

    return {
        submissionId: row.submission_id,
        title: row.title || "Untitled",
        description: row.description || "",
        posterFileUrl: row.submission_file?.file_url ?? null,
        status: row.status || "unknown",
        createdAt: row.created_at,
        track: row.track
            ? {
                  trackId: row.track.track_id,
                  name: row.track.name || "Track",
                  eventInstanceId: row.track.event_instance_id,
              }
            : null,
        participants,
        supervisor: row.supervisor
            ? {
                  personId: row.supervisor.person_id,
                  displayName: row.supervisor.display_name || "Unknown",
                  email: row.supervisor.email || "",
              }
            : null,
        tableNumber: tableInfo?.table_number ?? null,
        tableSession: tableInfo?.session ?? null,
        scoreCount: (row.score_sheet ?? []).length,
        facets,
        facetTokensByFacetId,
    };
}

export async function fetchAdminProjectsByEvent(eventInstanceId) {
    const rows = await fetchAdminProjectRowsByEvent(eventInstanceId);
    return rows.map(mapProjectRow);
}

export async function fetchAdminProjectsByTrack(trackId) {
    const rows = await fetchAdminProjectRowsByTrack(trackId);
    return rows.map(mapProjectRow);
}

export async function assignTableToSubmission({ submissionId, eventInstanceId, trackId, tableNumber, session }) {
    let table = await fetchEventTableByNumber(eventInstanceId, trackId, tableNumber, session);

    if (!table) {
        table = await createEventTable(eventInstanceId, trackId, tableNumber, session);
    }

    await upsertSubmissionTableAssignment(submissionId, table.table_id);
}

export async function fetchAdminJudgesByEvent(eventInstanceId) {
    const [rows, submissionIds] = await Promise.all([
        fetchJudgesForEvent(eventInstanceId),
        fetchSubmissionIdsByEvent(eventInstanceId),
    ]);

    const scoreSheets = await fetchScoreSheetsBySubmissionIds(submissionIds);

    const scoreCountByJudge = new Map();
    for (const sheet of scoreSheets) {
        const id = sheet.judge_person_id;
        scoreCountByJudge.set(id, (scoreCountByJudge.get(id) ?? 0) + 1);
    }

    const seen = new Set();
    return (rows ?? [])
        .map((row) => ({
            personEventRoleId: row.person_event_role_id,
            personId: row.person?.person_id,
            displayName: row.person?.display_name || "Unknown",
            email: row.person?.email || "",
            scoreCount: scoreCountByJudge.get(row.person?.person_id) ?? 0,
        }))
        .filter((judge) => {
            if (!judge.personId || seen.has(judge.personId)) return false;
            seen.add(judge.personId);
            return true;
        })
        .sort((a, b) => {
            if (b.scoreCount !== a.scoreCount) {
                return b.scoreCount - a.scoreCount;
            }

            return a.displayName.localeCompare(b.displayName);
        });
}

export async function deleteAdminJudge(personId) {
    await deletePersonEventRolesByPersonId(personId);
    await deletePersonById(personId);
}
