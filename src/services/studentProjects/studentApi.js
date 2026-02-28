import { supabase } from "../../lib/supabaseClient.js";

export async function fetchStudentProjectsByPersonId(personId) {
    if (!personId) return [];

    const { data, error } = await supabase
        .from("submission_author")
        .select(`
            submission:submission_id (
                submission_id,
                title,
                status,
                created_at,
                track (
                    track_id,
                    name,
                    event_instance (
                        event_instance_id,
                        name,
                        status
                    )
                )
            )
        `)
        .eq("person_id", personId)
        .in("submission.track.event_instance.status", ["pre_scoring", "event_scoring"])
        .order("created_at", { foreignTable: "submission", ascending: false });

    if (error) throw error;

    // flatten response
    return (data ?? []).map(row => row.submission);
}