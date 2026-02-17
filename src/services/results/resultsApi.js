// Low-level data-access layer for track results reporting.
//
// Responsibilities:
// - Execute Supabase queries for submissions, score sheets/items, rubric criteria, and facets.
// - Keep all raw DB I/O separate from report aggregation logic.

import { supabase } from "../../lib/supabaseClient.js";

export async function fetchTrackSubmissions(trackId) {
    const { data, error } = await supabase
        .from("submission")
        .select("submission_id, title, status, created_at")
        .eq("track_id", trackId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchSubmittedScoreSheets(submissionIds) {
    if (!submissionIds?.length) return [];

    const { data, error } = await supabase
        .from("score_sheet")
        .select("score_sheet_id, submission_id, judge_person_id, status")
        .in("submission_id", submissionIds)
        .eq("status", "submitted");

    if (error) throw error;
    return data ?? [];
}

export async function fetchScoreItems(scoreSheetIds) {
    if (!scoreSheetIds?.length) return [];

    const { data, error } = await supabase
        .from("score_item")
        .select("score_sheet_id, criterion_id, score_value")
        .in("score_sheet_id", scoreSheetIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchRubricCriteria(criterionIds) {
    if (!criterionIds?.length) return [];

    const { data, error } = await supabase
        .from("rubric_criterion")
        .select("criterion_id, criterion_category")
        .in("criterion_id", criterionIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchSubmissionFacetValues(submissionIds) {
    if (!submissionIds?.length) return [];

    const { data, error } = await supabase
        .from("submission_facet_value")
        .select("submission_id, facet_id, facet_option_id, value_text, value_number, value_date")
        .in("submission_id", submissionIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetsByIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code, name")
        .in("facet_id", facetIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetOptionsByIds(facetOptionIds) {
    if (!facetOptionIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, value, label")
        .in("facet_option_id", facetOptionIds);

    if (error) throw error;
    return data ?? [];
}
