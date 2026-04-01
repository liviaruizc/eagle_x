import { supabase } from "../../lib/supabaseClient.js";

export async function fetchEventTableByNumber(eventInstanceId, trackId, tableNumber, session) {
    let query = supabase
        .from("event_table")
        .select("table_id, table_number, session")
        .eq("event_instance_id", eventInstanceId)
        .eq("track_id", trackId)
        .eq("table_number", tableNumber);

    if (session) {
        query = query.eq("session", session);
    } else {
        query = query.is("session", null);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ?? null;
}

export async function createEventTable(eventInstanceId, trackId, tableNumber, session) {
    const { data, error } = await supabase
        .from("event_table")
        .insert({ event_instance_id: eventInstanceId, track_id: trackId, table_number: tableNumber, session: session || null })
        .select("table_id, table_number, session")
        .single();

    if (error) throw error;
    return data;
}

export async function upsertSubmissionTableAssignment(submissionId, tableId) {
    const { error } = await supabase
        .from("submission_table_assignment")
        .upsert({ submission_id: submissionId, table_id: tableId }, { onConflict: "submission_id" });

    if (error) throw error;
}

export async function deleteSubmissionTableAssignment(submissionId) {
    const { error } = await supabase
        .from("submission_table_assignment")
        .delete()
        .eq("submission_id", submissionId);

    if (error) throw error;
}
