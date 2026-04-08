import { supabase } from "../../lib/supabaseClient.js";

const REQUIRED_FIELD_GROUPS = {
    college: ["COLLEGE"],
    major: ["PROGRAM", "MAJOR", "DEPARTMENT"],
    level: ["LEVEL"],
};

function normalizeCode(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function normalizeName(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function hasFacetValue(row) {
    if (!row) return false;
    if (row.facet_option_id) return true;
    if (String(row.value_text || "").trim()) return true;
    if (row.value_number !== null && row.value_number !== undefined) return true;
    if (row.value_date) return true;
    return false;
}

function buildRequiredFacetMap(facetRows) {
    const groups = {
        college: new Set(),
        major: new Set(),
        level: new Set(),
    };

    for (const row of facetRows ?? []) {
        const code = normalizeCode(row.code);
        const name = normalizeName(row.name);

        if (REQUIRED_FIELD_GROUPS.college.includes(code) || name === "college") {
            groups.college.add(row.facet_id);
        }

        if (
            REQUIRED_FIELD_GROUPS.major.includes(code) ||
            ["major", "program", "department", "class"].includes(name)
        ) {
            groups.major.add(row.facet_id);
        }

        if (REQUIRED_FIELD_GROUPS.level.includes(code) || name === "level") {
            groups.level.add(row.facet_id);
        }
    }

    return groups;
}

async function fetchRequiredFacetRows() {
    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code, name");

    if (error) throw error;
    return data ?? [];
}

async function fetchFacetOptionsByFacetIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, facet_id, value, label, parent_option_id, sort_order")
        .in("facet_id", facetIds)
        .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

async function resolveFacetOptionId(facetId, rawValue) {
    const normalized = String(rawValue || "").trim();
    if (!normalized) return null;

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, value, label")
        .eq("facet_id", facetId);

    if (error) throw error;

    const upper = normalized.toUpperCase();
    const option = (data ?? []).find((row) => {
        const value = String(row.value || "").trim().toUpperCase();
        const label = String(row.label || "").trim().toUpperCase();
        return value === upper || label === upper;
    });

    return option?.facet_option_id ?? null;
}

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
                    event_instance_id,
                    submission_open_at,
                    submission_close_at
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
    const facetRows = await fetchRequiredFacetRows();
    const requiredFacetMap = buildRequiredFacetMap(facetRows);

    const { data, error } = await supabase
        .from("submission_author")
        .select(`
            submission:submission_id (
                submission_id,
                submission_facet_value (
                    facet_id,
                    facet_option_id,
                    value_text,
                    value_number,
                    value_date
                ),
                track:track_id (
                    event_instance:event_instance_id (
                        event_instance_id,
                        name,
                        status,
                        start_at,
                        end_at
                    )
                )
            )
        `)
        .eq("person_id", personId);

    if (error) throw error;

    const eventsById = new Map();

    for (const row of data ?? []) {
        const submission = row.submission;
        const event = submission?.track?.event_instance;
        if (!submission || !event) continue;

        const facetValues = submission.submission_facet_value ?? [];
        const isPresentForGroup = (groupFacetIds) => {
            if (!groupFacetIds.size) return false;
            return facetValues.some(
                (valueRow) => groupFacetIds.has(valueRow.facet_id) && hasFacetValue(valueRow)
            );
        };

        const missing = {
            college: !isPresentForGroup(requiredFacetMap.college),
            major: !isPresentForGroup(requiredFacetMap.major),
            level: !isPresentForGroup(requiredFacetMap.level),
        };

        const missingAny = missing.college || missing.major || missing.level;

        if (!eventsById.has(event.event_instance_id)) {
            eventsById.set(event.event_instance_id, {
                ...event,
                action_needed: false,
                missing_submission_count: 0,
            });
        }

        const current = eventsById.get(event.event_instance_id);
        if (missingAny) {
            current.action_needed = true;
            current.missing_submission_count += 1;
        }
    }

    return [...eventsById.values()];
}

export async function fetchStudentSubmissionCompletionRows(personId, eventInstanceId) {
    const facetRows = await fetchRequiredFacetRows();
    const requiredFacetMap = buildRequiredFacetMap(facetRows);

    const { data, error } = await supabase
        .from("submission_author")
        .select(`
            submission:submission_id (
                submission_id,
                title,
                track:track_id (
                    event_instance_id
                ),
                submission_facet_value (
                    facet_id,
                    facet_option_id,
                    value_text,
                    value_number,
                    value_date,
                    facet_option (
                        label,
                        value
                    )
                )
            )
        `)
        .eq("person_id", personId)
        .eq("submission.track.event_instance_id", eventInstanceId);

    if (error) throw error;

    const getFirstGroupValue = (facetValues, facetIds) => {
        const found = (facetValues ?? []).find(
            (row) => facetIds.has(row.facet_id) && hasFacetValue(row)
        );

        if (!found) return "";

        const optionLabel = String(found.facet_option?.label || found.facet_option?.value || "").trim();
        if (optionLabel) return optionLabel;

        return String(found.value_text || "").trim();
    };

    return (data ?? [])
        .map((row) => row.submission)
        .filter(Boolean)
        .map((submission) => {
            const facetValues = submission.submission_facet_value ?? [];

            const college = getFirstGroupValue(facetValues, requiredFacetMap.college);
            const major = getFirstGroupValue(facetValues, requiredFacetMap.major);
            const level = getFirstGroupValue(facetValues, requiredFacetMap.level);

            const missing = {
                college: !college,
                major: !major,
                level: !level,
            };

            return {
                submission_id: submission.submission_id,
                title: submission.title || "Untitled",
                college,
                major,
                level,
                missing,
            };
        });
}

export async function fetchStudentSubmissionCompletionOptions() {
    const facetRows = await fetchRequiredFacetRows();
    const requiredFacetMap = buildRequiredFacetMap(facetRows);

    const pickFacetId = (set) => {
        const first = [...set][0];
        if (!first) return null;
        return first;
    };

    const collegeFacetId = pickFacetId(requiredFacetMap.college);
    const majorFacetId = pickFacetId(requiredFacetMap.major);
    const levelFacetId = pickFacetId(requiredFacetMap.level);

    const facetIds = [collegeFacetId, majorFacetId, levelFacetId].filter(Boolean);
    const options = await fetchFacetOptionsByFacetIds(facetIds);

    const toOption = (row) => ({
        id: row.facet_option_id,
        facetId: row.facet_id,
        parentOptionId: row.parent_option_id ?? null,
        value: String(row.value || "").trim(),
        label: String(row.label || "").trim(),
        display: String(row.label || row.value || "").trim(),
    });

    const allCollegeOptions = options
        .filter((row) => row.facet_id === collegeFacetId)
        .map(toOption);

    const allMajorOptions = options
        .filter((row) => row.facet_id === majorFacetId)
        .map(toOption);

    const allLevelOptions = options
        .filter((row) => row.facet_id === levelFacetId)
        .map(toOption);

    return {
        collegeOptions: allCollegeOptions,
        majorOptions: allMajorOptions,
        levelOptions: allLevelOptions,
    };
}

export async function saveStudentSubmissionCompletion({ submissionId, college, major, level }) {
    const normalized = {
        college: String(college || "").trim(),
        major: String(major || "").trim(),
        level: String(level || "").trim(),
    };

    if (!normalized.college || !normalized.major || !normalized.level) {
        throw new Error("College, major, and level are required.");
    }

    const facetRows = await fetchRequiredFacetRows();
    const requiredFacetMap = buildRequiredFacetMap(facetRows);

    const pickFacetId = (set) => {
        const first = [...set][0];
        if (!first) throw new Error("Required facet configuration is missing.");
        return first;
    };

    const targets = [
        { facetId: pickFacetId(requiredFacetMap.college), value: normalized.college },
        { facetId: pickFacetId(requiredFacetMap.major), value: normalized.major },
        { facetId: pickFacetId(requiredFacetMap.level), value: normalized.level },
    ];

    for (const target of targets) {
        const optionId = await resolveFacetOptionId(target.facetId, target.value);

        const { error: deleteError } = await supabase
            .from("submission_facet_value")
            .delete()
            .eq("submission_id", submissionId)
            .eq("facet_id", target.facetId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
            .from("submission_facet_value")
            .insert({
                submission_id: submissionId,
                facet_id: target.facetId,
                facet_option_id: optionId,
                value_text: target.value,
                value_number: null,
                value_date: null,
            });

        if (insertError) throw insertError;
    }
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

    function getDisplayName(person) {
        const explicitDisplayName = String(person?.display_name || "").trim();
        if (explicitDisplayName) return explicitDisplayName;

        const firstName = String(person?.first_name || "").trim();
        const lastName = String(person?.last_name || "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        if (fullName) return fullName;

        const email = String(person?.email || "").trim();
        if (email) return email.split("@")[0];

        return "Unnamed member";
    }

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
        .select(`person:person_id(email, first_name, last_name, display_name)`)
        .eq("submission_id", submissionId);
    if (authorsError) throw authorsError;

    const groupMembers = (authors ?? [])
        .map((row) => row.person)
        .filter(Boolean)
        .map((person) => ({
            name: getDisplayName(person),
            email: String(person.email || "").trim() || null,
        }));

    // Step 3: Fetch supervisor info
    let supervisor = null;
    if (submission.supervisor_person_id) {
        const { data: supervisorData, error: supervisorError } = await supabase
            .from("person")
            .select("email, first_name, last_name, display_name")
            .eq("person_id", submission.supervisor_person_id)
            .single();
        if (supervisorError) throw supervisorError;
        supervisor = {
            name: getDisplayName(supervisorData),
            email: String(supervisorData?.email || "").trim() || null,
        };
    }

    // Step 4: Fetch poster file
    const { data: files, error: fileError } = await supabase
        .from("submission_file")
        .select("file_url")
        .eq("submission_id", submissionId)
        .maybeSingle();
    if (fileError) throw fileError;

    

    const posterFile = files?.file_url ? { file_url: files.file_url } : null;

    // Step 5: Fetch track info
    const { data: trackData, error: trackError } = await supabase
        .from("track")
        .select("name")
        .eq("track_id", submission.track_id)
        .single();
    if (trackError) throw trackError;



    return {
        submission_id: submission.submission_id,
        title: submission.title || "Untitled Project",
        description: submission.description || "",
        track: trackData?.name || "N/A",
        group_members: groupMembers,
        supervisor,
        file_url: posterFile,
    };
}

