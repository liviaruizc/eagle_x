// Low-level data-access helpers for rubric management.
//
// Responsibilities:
// - Read/write rubric, rubric criteria, and track-rubric link tables.
// - Keep raw Supabase operations out of orchestration code.

import { supabase } from "../../lib/supabaseClient.js";

export async function fetchHasSubmittedScoresForTrack(trackId) {
    const { data: submissions, error: subError } = await supabase
        .from("submission")
        .select("submission_id")
        .eq("track_id", trackId);

    if (subError) throw subError;
    if (!submissions?.length) return false;

    const submissionIds = submissions.map((s) => s.submission_id);

    const { count, error } = await supabase
        .from("score_sheet")
        .select("score_sheet_id", { count: "exact", head: true })
        .in("submission_id", submissionIds)
        .eq("status", "submitted");

    if (error) throw error;
    return (count ?? 0) > 0;
}

export async function fetchTrackRubricRows(trackId) {
    const { data, error } = await supabase
        .from("track_rubric")
        .select("track_rubric_id, track_id, rubric_id, is_default, condition_json")
        .eq("track_id", trackId);

    if (error) throw error;
    return data ?? [];
}

export async function fetchRubricsByIds(rubricIds) {
    if (!rubricIds?.length) return [];

    const { data, error } = await supabase
        .from("rubric")
        .select("rubric_id, name, description, max_total_points, version, is_active, created_at")
        .in("rubric_id", rubricIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchRubricCriteriaByRubricIds(rubricIds) {
    if (!rubricIds?.length) return [];

    const { data, error } = await supabase
        .from("rubric_criterion")
        .select(
            "criterion_id, rubric_id, name, description, criterion_category, answer_type, answer_config_json, weight, score_min, score_max, scoring_phase, display_order"
        )
        .in("rubric_id", rubricIds)
        .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function insertRubric(payload) {
    const { data, error } = await supabase
        .from("rubric")
        .insert(payload)
        .select("rubric_id")
        .single();

    if (error) throw error;
    return data.rubric_id;
}

export async function updateRubricById(rubricId, payload) {
    const { error } = await supabase
        .from("rubric")
        .update(payload)
        .eq("rubric_id", rubricId);

    if (error) throw error;
}

export async function deleteRubricById(rubricId) {
    const { error } = await supabase
        .from("rubric")
        .delete()
        .eq("rubric_id", rubricId);

    if (error) throw error;
}

export async function insertRubricCriteria(criteriaPayload) {
    if (!criteriaPayload?.length) return;

    const { error } = await supabase
        .from("rubric_criterion")
        .insert(criteriaPayload);

    if (error) throw error;
}

export async function upsertRubricCriteria(criteriaPayload) {
    if (!criteriaPayload?.length) return [];

    const { data, error } = await supabase
        .from("rubric_criterion")
        .upsert(criteriaPayload, { onConflict: "criterion_id" })
        .select("criterion_id");

    if (error) throw error;
    return (data ?? []).map((row) => row.criterion_id);
}

export async function deleteRubricCriteriaNotInList(rubricId, keepIds) {
    if (!keepIds?.length) return;

    const { error } = await supabase
        .from("rubric_criterion")
        .delete()
        .eq("rubric_id", rubricId)
        .not("criterion_id", "in", `(${keepIds.join(",")})`);

    if (error) throw error;
}

export async function deleteRubricCriteriaByRubricId(rubricId) {
    const { error } = await supabase
        .from("rubric_criterion")
        .delete()
        .eq("rubric_id", rubricId);

    if (error) throw error;
}

export async function clearTrackDefaultRubrics(trackId) {
    const { error } = await supabase
        .from("track_rubric")
        .update({ is_default: false })
        .eq("track_id", trackId)
        .eq("is_default", true);

    if (error) throw error;
}

export async function upsertTrackRubricLink({ trackId, rubricId, isDefault }) {
    const { data, error } = await supabase
        .from("track_rubric")
        .upsert(
            {
                track_id: trackId,
                rubric_id: rubricId,
                is_default: Boolean(isDefault),
                condition_json: null,
            },
            { onConflict: "track_id,rubric_id" }
        )
        .select("track_rubric_id")
        .single();

    if (error) throw error;
    return data.track_rubric_id;
}
