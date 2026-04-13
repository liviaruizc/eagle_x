import { supabase } from "../../lib/supabaseClient";

export async function fetchSubmissionById(submissionId) {
    const { data, error } = await supabase
        .from("submission")
        .select("submission_id, title, status")
        .eq("submission_id", submissionId)
        .single();

    if (error) throw error;
    return data;
}

export async function fetchEvaluationsBySubmission(submissionId) {
    const { data, error } = await supabase
        .from("score_sheet")
        .select(
            `score_sheet_id,
             overall_comment,
             submitted_at,
             judge:judge_person_id(display_name),
             score_item(
                 score_value,
                 comment,
                 rubric_criterion(
                     criterion_id,
                     name,
                     description,
                     display_order,
                     scoring_phase
                 )
             )`
        )
        .eq("submission_id", submissionId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}
