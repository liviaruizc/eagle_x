import { fetchJudgesForEvent } from "../judgeSignup/judgeSignupApi.js";
import {
    fetchAdminProjectRowsByEvent,
    fetchAdminProjectRowsByTrack,
} from "../submission/submissionApi.js";

function mapProjectRow(row) {
    const participants = (row.submission_author ?? [])
        .map((authorRow) => authorRow.person)
        .filter(Boolean)
        .map((person) => ({
            personId: person.person_id,
            displayName: person.display_name || "Unknown",
            email: person.email || "",
        }));

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

export async function fetchAdminJudgesByEvent(eventInstanceId) {
    const rows = await fetchJudgesForEvent(eventInstanceId);

    return (rows ?? [])
        .map((row) => ({
            personEventRoleId: row.person_event_role_id,
            personId: row.person?.person_id,
            displayName: row.person?.display_name || "Unknown",
            email: row.person?.email || "",
        }))
        .filter((judge) => Boolean(judge.personId))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
