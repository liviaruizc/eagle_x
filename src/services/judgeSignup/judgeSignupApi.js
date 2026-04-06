// Low-level Supabase access layer for judge-signup workflows.
//
// Responsibilities:
// - Provide focused query/mutation functions for roles, people, facets, and facet values.
// - Keep data access concerns isolated from orchestration and transformation logic.
//
// Notes:
// - Functions in this file should stay small and map closely to DB operations.
// - Callers are responsible for composing behavior and handling fallbacks.
import { supabase } from "../../lib/supabaseClient.js";

export async function findJudgeRoleByCode() {
    const { data, error } = await supabase
        .from("event_role")
        .select("event_role_id")
        .eq("code", "JUDGE")
        .maybeSingle();

    if (error) throw error;
    return data?.event_role_id ?? null;
}


export async function fetchJudgeEventInstances(personId) {
    const { data, error } = await supabase
        .from("person_event_role")
        .select(`
            event_instance (
                event_instance_id,
                name,
                status,
                start_at,
                end_at,
                pre_scoring_start_at,
                pre_scoring_end_at,
                location
            ),
            event_role (code, name)
        `)
        .eq("person_id", personId)
        .eq("is_active", true);

    if (error) throw error;

    return (data ?? [])
        .filter((row) => {
            const code = String(row.event_role?.code || "").trim().toUpperCase();
            const name = String(row.event_role?.name || "").trim().toUpperCase();
            return code === "JUDGE" || name.includes("JUDGE");
        })
        .map((row) => row.event_instance)
        .filter(Boolean);
}

export async function findJudgeRoleByName() {
    const { data, error } = await supabase
        .from("event_role")
        .select("event_role_id")
        .ilike("name", "%judge%")
        .maybeSingle();

    if (error) throw error;
    return data?.event_role_id ?? null;
}

export async function findFirstEventRoleId() {
    const { data, error } = await supabase
        .from("event_role")
        .select("event_role_id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (error) throw error;
    return data?.event_role_id ?? null;
}

export async function findPersonIdByEmail(email) {
    const { data, error } = await supabase
        .from("person")
        .select("person_id")
        .ilike("email", email)
        .limit(1)
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

export async function findPersonEventRoleId({ eventInstanceId, personId, eventRoleId }) {
    let query = supabase
        .from("person_event_role")
        .select("person_event_role_id")
        .eq("person_id", personId)
        .eq("event_role_id", eventRoleId);

    if (eventInstanceId === null || eventInstanceId === undefined) {
        query = query.is("event_instance_id", null);
    } else {
        query = query.eq("event_instance_id", eventInstanceId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data?.person_event_role_id ?? null;
}

export async function insertPersonEventRole({ eventInstanceId, personId, eventRoleId }) {
    const payload = {
        person_id: personId,
        event_role_id: eventRoleId,
        is_active: true,
    };

    if (eventInstanceId) {
        payload.event_instance_id = eventInstanceId;
    }

    const { data, error } = await supabase
        .from("person_event_role")
        .insert(payload)
        .select("person_event_role_id")
        .single();

    if (error) throw error;
    return data.person_event_role_id;
}

export async function fetchRoleFacets(eventRoleId) {
    const { data, error } = await supabase
        .from("event_role_facet")
        .select("event_role_facet_id, facet_id, is_required, display_order")
        .eq("event_role_id", eventRoleId)
        .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetIdsByCodes(codes) {
    if (!codes?.length) return [];

    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code")
        .in("code", codes);

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetOptionRowsByFacetIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, facet_id")
        .in("facet_id", facetIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchChildFacetRowsByParentOptionIds(parentOptionIds) {
    if (!parentOptionIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_id")
        .in("parent_option_id", parentOptionIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetRowsByIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code, name, value_kind")
        .in("facet_id", facetIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetOptionsByFacetIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, facet_id, value, label, parent_option_id, sort_order")
        .in("facet_id", facetIds)
        .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetOptionsByIds(facetOptionIds) {
    if (!facetOptionIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, facet_id, value, label")
        .in("facet_option_id", facetOptionIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchPersonEventRoleWithFacets(personId, eventInstanceId) {
    let query = supabase
        .from("person_event_role")
        .select(`
            person_event_role_id,
            event_instance_id,
            person_event_role_facet_value (
                facet_id,
                facet_option_id
            )
        `)
        .eq("person_id", personId)
        .eq("is_active", true);

    if (eventInstanceId) {
        query = query.eq("event_instance_id", eventInstanceId);
    }

    const { data, error } = await query.order("person_event_role_id", { ascending: false }).limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
}

export async function deletePersonEventRoleFacetValues(personEventRoleId, facetIds) {
    if (!facetIds?.length) return;

    const { error } = await supabase
        .from("person_event_role_facet_value")
        .delete()
        .eq("person_event_role_id", personEventRoleId)
        .in("facet_id", facetIds);

    if (error) throw error;
}

export async function insertPersonEventRoleFacetValues(payloads) {
    if (!payloads?.length) return;

    const { error } = await supabase
        .from("person_event_role_facet_value")
        .insert(payloads);

    if (error) throw error;
}

export async function fetchJudgesForEvent(eventInstanceId) {
    const { data, error } = await supabase
        .from("person_event_role")
        .select(`
            person_event_role_id,
            person (
                person_id,
                email,
                display_name
            ),
            person_event_role_facet_value (
                facet_id,
                facet_option_id
            ),
            event_role (code)
        `)
        .eq("event_instance_id", eventInstanceId)
        .eq("is_active", true)
        .eq("event_role.code", "judge");

    if (error) throw error;
    return data ?? [];
}
