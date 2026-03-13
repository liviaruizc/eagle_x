import { supabase } from "../../lib/supabaseClient.js";

export async function fetchStudentProjectsForEvent(personId, eventInstanceId) {

    const { data, error } = await supabase
        .from("submission_author")
        .select(`
            submission:submission_id (
                submission_id,
                title,
                status,
                track (
                    track_id,
                    name,
                    event_instance_id
                )
            )
        `)
        .eq("person_id", personId)
        .eq("submission.track.event_instance_id", eventInstanceId);

    if (error) throw error;

    return (data ?? []).map(row => row.submission);
}


export async function fetchStudentEventInstances(personId) {
    const { data, error } = await supabase
        .from("person_event_role")
        .select(`
            event_instance (
                event_instance_id,
                name,
                status,
                start_at,
                end_at
            ),
            event_role (code)
        `)
        .eq("person_id", personId)
        .eq("is_active", true)
        .eq("event_role.code", "student");

    if (error) throw error;

    return (data ?? []).map(row => row.event_instance);
}

export async function uploadPoster(submissionId, file, personId) {
    // 1️⃣ Define file path in bucket
    const filePath = `posters/${submissionId}/${file.name}`;

    // 2️⃣ Upload to Supabase Storage
    const { data: storageData, error: uploadError } = await supabase.storage
        .from("submission-files")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {  
        alert(`Upload error: ${uploadError.message}`);
        throw uploadError;
    }

    const { publicUrl } = supabase.storage
        .from("submission-files")
        .getPublicUrl(filePath);

        alert(`File uploaded. Public URL: ${publicUrl}`);

    // 3️⃣ Insert or update row in submission_file table
    const { error: dbError } = await supabase
        .from("submission_file")
        .upsert({
            submission_id: submissionId,
            file_url: publicUrl,
            file_type: file.type
        }, { onConflict: ['submission_id'] });

    if (dbError) {
        alert(`Database error: ${dbError.message}`);
        throw dbError;
    }

    return publicUrl;
}