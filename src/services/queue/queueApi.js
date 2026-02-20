import { supabase } from "../../lib/supabaseClient.js";

export async function fetchQueueStatusSubmissions() {
    const { data, error } = await supabase
        .from("submission")
        .select("submission_id, status, created_at")
        .in("status", ["pre_scoring", "event_scoring"])
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function hasJudgeScoreSheet({ judgeId, submissionId }) {
    const { data, error } = await supabase
        .from("score_sheet")
        .select("score_sheet_id")
        .eq("submission_id", submissionId)
        .eq("judge_person_id", judgeId)
        .maybeSingle();

    if (error) throw error;
    return Boolean(data);
}

export async function fetchTracksByEventInstance(eventInstanceId) {
    const { data, error } = await supabase
        .from("track")
        .select("track_id, name")
        .eq("event_instance_id", eventInstanceId);

    if (error) throw error;
    return data ?? [];
}

export async function fetchEligibleSubmissionsByTracks({ trackIds, judgePersonId }) {
    if (!trackIds?.length) return [];

    const { data, error } = await supabase
        .from("submission")
        .select(`submission_id, title, track_id, status, created_at, supervisor_person_id, track(name)`)
        .in("track_id", trackIds) // notice .in for array
        .in("status", ["pre_scoring", "event_scoring"])
        .neq("supervisor_person_id", judgePersonId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
}



export async function fetchScoredSubmissionRows({ judgePersonId, submissionIds }) {
    if (!submissionIds?.length) return [];

    const { data, error } = await supabase
        .from("score_sheet")
        .select("submission_id")
        .eq("judge_person_id", judgePersonId)
        .in("submission_id", submissionIds);

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

export async function fetchJudgeFacetValuesForEvent({ judgePersonId, eventInstanceId }) {
    const { data: roles, error: rolesError } = await supabase
        .from("person_event_role")
        .select("person_event_role_id")
        .eq("person_id", judgePersonId)
        .eq("event_instance_id", eventInstanceId)
        .eq("is_active", true);

    if (rolesError) throw rolesError;
    if (!roles?.length) return [];

    const roleIds = roles.map((role) => role.person_event_role_id);

    const { data: values, error: valuesError } = await supabase
        .from("person_event_role_facet_value")
        .select("facet_id, facet_option_id, value_text, value_number, value_date")
        .in("person_event_role_id", roleIds);

    if (valuesError) throw valuesError;
    return values ?? [];
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

export async function fetchFacetOptionsByIds(optionIds) {
    if (!optionIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, value, label")
        .in("facet_option_id", optionIds);

    if (error) throw error;
    return data ?? [];
}
