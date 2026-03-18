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
                ),
                submission_file (
                    file_url
                ),
                table_assignment:submission_table_assignment (
                    table_id,
                    event_table:table_id (
                        table_number,
                        session
                    )
                )
            )
        `)
        .eq("person_id", personId)
        .eq("submission.track.event_instance_id", eventInstanceId);

    if (error) throw error;

    return (data ?? []).map(row => {
        const submission = row.submission;

        const tableInfo = submission.table_assignment?.event_table ?? null;

        return {
            ...submission,
            poster_file_url: submission.submission_file?.file_url ?? null,
            table_number: tableInfo?.table_number ?? null,
            session: tableInfo?.session ?? null
        };
    });
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

    const { data } = supabase.storage
        .from("submission-files")
        .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

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


export async function fetchSubmissionDetails(submissionId) {

    // Step 1: Fetch submission
    const { data: submission, error: submissionError } = await supabase
        .from("submission")
        .select("submission_id, title, description, track_id, supervisor_person_id")
        .eq("submission_id", submissionId)
        .single();
    if (submissionError) throw submissionError;
    if (!submission) return null;

    // Step 2: Fetch student author info
    const { data: authors, error: authorsError } = await supabase
        .from("submission_author")
        .select(`person:person_id(email, first_name, last_name)`)
        .eq("submission_id", submissionId);
    if (authorsError) throw authorsError;

    const student = authors?.[0]?.person ?? null;

    // Step 3: Fetch supervisor info
    let supervisor = null;
    if (submission.supervisor_person_id) {
        const { data: supervisorData, error: supervisorError } = await supabase
            .from("person")
            .select("email, first_name, last_name")
            .eq("person_id", submission.supervisor_person_id)
            .single();
        if (supervisorError) throw supervisorError;
        supervisor = supervisorData;
    }

    // Step 4: Fetch poster file
    const { data: files, error: fileError } = await supabase
        .from("submission_file")
        .select("file_url")
        .eq("submission_id", submissionId)
        .single();
    if (fileError) throw fileError;

    

    const posterFile = files.file_url ? { file_url: files.file_url } : null;

    // Step 5: Fetch track info
    const { data: trackData, error: trackError } = await supabase
        .from("track")
        .select("name")
        .eq("track_id", submission.track_id)
        .single();
    if (trackError) throw trackError;



    return {
        submission_id: submission.submission_id,
        title: submission.title,
        description: submission.description,
        track: trackData?.name ?? "",
        student,
        supervisor,
        file_url: posterFile,
    };
}

