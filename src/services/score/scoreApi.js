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
        .single();

    if (error) throw error;
    return data;
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
        .single();

    if (error) throw error;
    return data;
}

export async function fetchRubricCriteria(rubricId) {
    const { data, error } = await supabase
        .from("rubric_criterion")
        .select(
            "criterion_id, name, description, criterion_category, answer_type, answer_config_json, weight, score_min, score_max, display_order"
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

export async function updateSubmissionStatusIfCurrent(submissionId, fromStatus, toStatus) {
    const { error } = await supabase
        .from("submission")
        .update({ status: toStatus })
        .eq("submission_id", submissionId)
        .eq("status", fromStatus);

    if (error) throw error;
}
