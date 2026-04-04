import { fetchJudgesForEvent } from "../judgeSignup/judgeSignupApi.js";
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

    return {
        submissionId: row.submission_id,
        title: row.title || "Untitled",
        description: row.description || "",
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
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
