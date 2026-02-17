import { supabase } from "../../lib/supabaseClient.js";

const EVENT_INSTANCE_LIST_SELECT =
    "event_instance_id, event_id, name, start_at, end_at, pre_scoring_start_at, pre_scoring_end_at, location, status";

const EVENT_INSTANCE_DETAIL_SELECT =
    "event_instance_id, event_id, name, start_at, end_at, pre_scoring_start_at, pre_scoring_end_at, location, status, timezone";

const EVENT_DETAIL_SELECT = "event_id, name, description, host_org, is_active";

const TRACK_SELECT =
    "track_id, name, track_type_id, submission_open_at, submission_close_at, scoring_open_at, scoring_close_at, display_order";

export async function fetchEventInstanceRows() {
    const { data, error } = await supabase
        .from("event_instance")
        .select(EVENT_INSTANCE_LIST_SELECT)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}

export async function fetchEventByIds(eventIds) {
    if (!eventIds?.length) return [];

    const { data, error } = await supabase
        .from("event")
        .select("event_id, name, description")
        .in("event_id", eventIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchEventInstanceById(eventInstanceId) {
    const { data, error } = await supabase
        .from("event_instance")
        .select(EVENT_INSTANCE_DETAIL_SELECT)
        .eq("event_instance_id", eventInstanceId)
        .single();

    if (error) throw error;
    return data;
}

export async function fetchEventById(eventId) {
    const { data, error } = await supabase
        .from("event")
        .select(EVENT_DETAIL_SELECT)
        .eq("event_id", eventId)
        .single();

    if (error) throw error;
    return data;
}

export async function fetchTracksByEventInstanceId(eventInstanceId) {
    const { data, error } = await supabase
        .from("track")
        .select(TRACK_SELECT)
        .eq("event_instance_id", eventInstanceId)
        .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function findEventIdByName(eventName) {
    const { data, error } = await supabase
        .from("event")
        .select("event_id")
        .eq("name", eventName)
        .maybeSingle();

    if (error) throw error;
    return data?.event_id ?? null;
}

export async function createEvent(payload) {
    const { data, error } = await supabase
        .from("event")
        .insert(payload)
        .select("event_id")
        .single();

    if (error) throw error;
    return data.event_id;
}

export async function createEventInstance(payload) {
    const { data, error } = await supabase
        .from("event_instance")
        .insert(payload)
        .select("event_instance_id")
        .single();

    if (error) throw error;
    return data.event_instance_id;
}

export async function insertTracks(trackRows) {
    const { error } = await supabase.from("track").insert(trackRows);
    if (error) throw error;
}

export async function deleteTracksByEventInstanceId(eventInstanceId) {
    const { error } = await supabase
        .from("track")
        .delete()
        .eq("event_instance_id", eventInstanceId);

    if (error) throw error;
}

export async function deleteEventInstanceById(eventInstanceId) {
    const { error } = await supabase
        .from("event_instance")
        .delete()
        .eq("event_instance_id", eventInstanceId);

    if (error) throw error;
}
