// Low-level Supabase queries for scoring workflows.
//
// Responsibilities:
// - Read/write submission, score sheet/item, rubric, and judge assignment rows.
// - Keep raw database operations separate from scoring orchestration logic.

import { supabase } from "../../lib/supabaseClient.js";

export async function fetchSubmissionForScoring(submissionId) {
    const { data, error } = await supabase
        .from("submission")
        .select("submission_id, title, track_id, supervisor_person_id, status")
        .eq("submission_id", submissionId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Submission not found.");
    return data;
}

export async function fetchSubmissionTableAssignment(submissionId) {
    const { data, error } = await supabase
        .from("submission_table_assignment")
        .select("event_table:table_id (table_number, session)")
        .eq("submission_id", submissionId)
        .maybeSingle();

    if (error) throw error;
    return data?.event_table ?? null;
}

export async function fetchSubmissionPosterFileUrl(submissionId) {
    const { data, error } = await supabase
        .from("submission_file")
        .select("file_url")
        .eq("submission_id", submissionId)
        .maybeSingle();

    if (error) throw error;
    return data?.file_url ?? null;
}

export async function fetchTrackRubrics(trackId) {
    const { data, error } = await supabase
        .from("track_rubric")
        .select("rubric_id, is_default")
        .eq("track_id", trackId);

    if (error) throw error;
    return data ?? [];
}

export async function fetchRubricById(rubricId) {
    const { data, error } = await supabase
        .from("rubric")
        .select("rubric_id, name")
        .eq("rubric_id", rubricId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Rubric not found.");
    return data;
}

export async function fetchEventInstanceStatusByTrack(trackId) {
    const { data: trackData, error: trackError } = await supabase
        .from("track")
        .select("event_instance_id")
        .eq("track_id", trackId)
        .maybeSingle();

    if (trackError) throw trackError;
    if (!trackData) return null;

    const { data, error } = await supabase
        .from("event_instance")
        .select("status")
        .eq("event_instance_id", trackData.event_instance_id)
        .maybeSingle();

    if (error) throw error;
    return data?.status ?? null;
}

export async function fetchRubricCriteria(rubricId) {
    const { data, error } = await supabase
        .from("rubric_criterion")
        .select(
            "criterion_id, name, description, criterion_category, answer_type, answer_config_json, weight, score_min, score_max, display_order, scoring_phase"
        )
        .eq("rubric_id", rubricId)
        .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchLatestScoreSheet(submissionId, judgePersonId) {
    const { data, error } = await supabase
        .from("score_sheet")
        .select("score_sheet_id")
        .eq("submission_id", submissionId)
        .eq("judge_person_id", judgePersonId)
        .order("created_at", { ascending: false })
        .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
}

export async function fetchScoreItems(scoreSheetId) {
    const { data, error } = await supabase
        .from("score_item")
        .select("criterion_id, score_value, comment")
        .eq("score_sheet_id", scoreSheetId);

    if (error) throw error;
    return data ?? [];
}

export async function findJudgeAssignment({ trackId, judgePersonId, submissionId }) {
    const { data, error } = await supabase
        .from("judge_assignment")
        .select("judge_assignment_id")
        .eq("track_id", trackId)
        .eq("person_id", judgePersonId)
        .eq("submission_id", submissionId)
        .limit(1);

    if (error) throw error;
    return data ?? [];
}

export async function insertJudgeAssignment({ trackId, judgePersonId, submissionId, assignedAt }) {
    const { error } = await supabase
        .from("judge_assignment")
        .insert({
            track_id: trackId,
            person_id: judgePersonId,
            submission_id: submissionId,
            assigned_at: assignedAt,
        });

    if (error) throw error;
}

export async function updateJudgeAssignmentTimestamp({ trackId, judgePersonId, submissionId, assignedAt }) {
    const { error } = await supabase
        .from("judge_assignment")
        .update({ assigned_at: assignedAt })
        .eq("track_id", trackId)
        .eq("person_id", judgePersonId)
        .eq("submission_id", submissionId);

    if (error) throw error;
}

export async function updateScoreSheet(scoreSheetId, payload) {
    const { error } = await supabase
        .from("score_sheet")
        .update(payload)
        .eq("score_sheet_id", scoreSheetId);

    if (error) throw error;
}

export async function insertScoreSheet(payload) {
    const { data, error } = await supabase
        .from("score_sheet")
        .insert(payload)
        .select("score_sheet_id")
        .single();

    if (error) throw error;
    return data.score_sheet_id;
}

export async function deleteScoreItemsByScoreSheetId(scoreSheetId) {
    const { error } = await supabase
        .from("score_item")
        .delete()
        .eq("score_sheet_id", scoreSheetId);

    if (error) throw error;
}

export async function insertScoreItems(itemPayload) {
    if (!itemPayload?.length) return;

    const { error } = await supabase
        .from("score_item")
        .insert(itemPayload);

    if (error) throw error;
}

export async function fetchSubmittedJudgeRowsBySubmission(submissionId) {
    const { data, error } = await supabase
        .from("score_sheet")
        .select("judge_person_id")
        .eq("submission_id", submissionId)
        .eq("status", "submitted");

    if (error) throw error;
    return data ?? [];
}

export async function fetchScoreSheetsByJudge(judgePersonId) {
    const { data, error } = await supabase
        .from("score_sheet")
        .select(`
            score_sheet_id,
            status,
            submitted_at,
            submission:submission_id (
                submission_id,
                title,
                track:track_id (
                    name,
                    event_instance:event_instance_id (
                        event_instance_id,
                        name
                    )
                )
            )
        `)
        .eq("judge_person_id", judgePersonId)
        .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function fetchScoreSheetsBySubmissionIds(submissionIds) {
    if (!submissionIds?.length) return [];

    const { data, error } = await supabase
        .from("score_sheet")
        .select("judge_person_id")
        .in("submission_id", submissionIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchActiveJudgeAssignment(submissionId, excludeJudgePersonId) {
    const thresholdTs = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from("judge_assignment")
        .select("person_id, assigned_at")
        .eq("submission_id", submissionId)
        .neq("person_id", excludeJudgePersonId)
        .gt("assigned_at", thresholdTs)
        .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
}

export async function updateSubmissionStatusIfCurrent(submissionId, fromStatus, toStatus) {
    const { error } = await supabase
        .from("submission")
        .update({ status: toStatus })
        .eq("submission_id", submissionId)
        .eq("status", fromStatus);

    if (error) throw error;
}
