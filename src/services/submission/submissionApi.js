// Low-level Supabase access helpers for submission creation/import flows.
//
// Responsibilities:
// - Query and mutate person, role, submission, author-link, and facet-value tables.
// - Keep raw DB operations out of orchestration logic.

import { supabase } from "../../lib/supabaseClient.js";

export async function findPersonByEmail(email) {
    const { data, error } = await supabase
        .from("person")
        .select("person_id")
        .eq("email", email)
        .maybeSingle();

    if (error) throw error;
    return data?.person_id ?? null;
}

export async function insertPerson({ email, displayName }) {
    const { data, error } = await supabase
        .from("person")
        .insert({
            email,
            display_name: displayName,
        })
        .select("person_id")
        .single();

    if (error) throw error;
    return data.person_id;
}

export async function findEventRoleIdByCode(code) {
    const { data, error } = await supabase
        .from("event_role")
        .select("event_role_id")
        .eq("code", code)
        .maybeSingle();

    if (error) throw error;
    return data?.event_role_id ?? null;
}

export async function findEventRoleIdByNameLike(nameFragment) {
    const { data, error } = await supabase
        .from("event_role")
        .select("event_role_id")
        .ilike("name", `%${nameFragment}%`)
        .maybeSingle();

    if (error) throw error;
    return data?.event_role_id ?? null;
}

export async function fetchTrackEventInstanceId(trackId) {
    const { data, error } = await supabase
        .from("track")
        .select("event_instance_id")
        .eq("track_id", trackId)
        .single();

    if (error) throw error;
    return data?.event_instance_id ?? null;
}

export async function findPersonEventRoleId({ eventInstanceId, personId, eventRoleId }) {
    const { data, error } = await supabase
        .from("person_event_role")
        .select("person_event_role_id")
        .eq("event_instance_id", eventInstanceId)
        .eq("person_id", personId)
        .eq("event_role_id", eventRoleId)
        .maybeSingle();

    if (error) throw error;
    return data?.person_event_role_id ?? null;
}

export async function insertPersonEventRole({ eventInstanceId, personId, eventRoleId }) {
    const { error } = await supabase
        .from("person_event_role")
        .insert({
            event_instance_id: eventInstanceId,
            person_id: personId,
            event_role_id: eventRoleId,
            is_active: true,
        });

    if (error) throw error;
}

export async function insertSubmission(payload) {
    const { data, error } = await supabase
        .from("submission")
        .insert(payload)
        .select("submission_id")
        .single();

    if (error) throw error;
    return data;
}

export async function deleteSubmissionById(submissionId) {
    const { error } = await supabase
        .from("submission")
        .delete()
        .eq("submission_id", submissionId);

    if (error) throw error;
}

export async function insertSubmissionAuthor({ submissionId, personId }) {
    const { error } = await supabase
        .from("submission_author")
        .insert({
            submission_id: submissionId,
            person_id: personId,
        });

    if (error) throw error;
}

export async function insertSubmissionFacetValues(payloads) {
    if (!payloads?.length) return;

    const { error } = await supabase
        .from("submission_facet_value")
        .insert(payloads);

    if (error) throw error;
}
