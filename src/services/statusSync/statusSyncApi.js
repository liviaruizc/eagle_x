// Low-level Supabase access for schedule-based status synchronization.
//
// Responsibilities:
// - Read event instances, tracks, submissions, and score-sheet judge rows.
// - Apply batch status updates for event instances and submissions.

import { supabase } from "../../lib/supabaseClient.js";

export async function fetchEventInstancesForStatusSync() {
    const { data, error } = await supabase
        .from("event_instance")
        .select("event_instance_id, status, start_at, end_at, pre_scoring_start_at, pre_scoring_end_at");

    if (error) throw error;
    return data ?? [];
}

export async function updateEventInstanceStatusesByIds(status, eventInstanceIds) {
    if (!eventInstanceIds?.length) return;

    const { error } = await supabase
        .from("event_instance")
        .update({ status })
        .in("event_instance_id", eventInstanceIds);

    if (error) throw error;
}

export async function fetchTracksByEventInstanceIds(eventInstanceIds) {
    if (!eventInstanceIds?.length) return [];

    const { data, error } = await supabase
        .from("track")
        .select("track_id, event_instance_id")
        .in("event_instance_id", eventInstanceIds);

    if (error) throw error;
    return data ?? [];
}

export async function updateSubmissionStatusByTrackIds({ trackIds, fromStatuses, toStatus }) {
    if (!trackIds?.length) return;

    const { error } = await supabase
        .from("submission")
        .update({ status: toStatus })
        .in("track_id", trackIds)
        .in("status", fromStatuses);

    if (error) throw error;
}

export async function fetchSubmissionIdsByTrackIdsAndStatus(trackIds, status) {
    if (!trackIds?.length) return [];

    const { data, error } = await supabase
        .from("submission")
        .select("submission_id")
        .in("track_id", trackIds)
        .eq("status", status);

    if (error) throw error;
    return (data ?? []).map((row) => row.submission_id);
}

export async function fetchSubmittedScoreSheetsForSubmissions(submissionIds) {
    if (!submissionIds?.length) return [];

    const { data, error } = await supabase
        .from("score_sheet")
        .select("submission_id, judge_person_id")
        .in("submission_id", submissionIds)
        .eq("status", "submitted");

    if (error) throw error;
    return data ?? [];
}

export async function updateSubmissionStatusBySubmissionIds({ submissionIds, fromStatus, toStatus }) {
    if (!submissionIds?.length) return;

    const { error } = await supabase
        .from("submission")
        .update({ status: toStatus })
        .in("submission_id", submissionIds)
        .eq("status", fromStatus);

    if (error) throw error;
}
