// Rubric service facade for rubric CRUD + track assignment workflows.
//
// Responsibilities:
// - Keep page/component-facing API stable.
// - Orchestrate read/write steps for rubric + criteria + track link changes.
//
// Notes:
// - Raw Supabase queries live in `services/rubric/rubricApi`.
// - Mapping and computation helpers live in `services/rubric/rubricUtils`.

import {
    clearTrackDefaultRubrics,
    deleteRubricById,
    deleteRubricCriteriaByRubricId,
    fetchRubricCriteriaByRubricIds,
    fetchRubricsByIds,
    fetchTrackRubricRows,
    insertRubric,
    insertRubricCriteria,
    updateRubricById,
    upsertTrackRubricLink,
} from "./rubricApi.js";
import {
    computeRubricMaxPoints,
    mapTrackRubrics,
    normalizeCriteriaPayload,
} from "./rubricUtils.js";

export async function fetchTrackRubrics(trackId) {
    // Load link rows first to know which rubric records to fetch.
    const trackRubrics = await fetchTrackRubricRows(trackId);
    if (!trackRubrics.length) return [];

    const rubricIds = [...new Set(trackRubrics.map((item) => item.rubric_id))];

    // Fetch rubric metadata and criteria in parallel, then map to UI shape.
    const [rubrics, criteria] = await Promise.all([
        fetchRubricsByIds(rubricIds),
        fetchRubricCriteriaByRubricIds(rubricIds),
    ]);

    return mapTrackRubrics(trackRubrics, rubrics, criteria);
}

// Creates a rubric with criteria and links it to a track.
export async function createRubricAndAssignToTrack({
    trackId,
    name,
    description,
    version,
    isDefault,
    criteria,
}) {
    // Compute and persist base rubric row.
    const computedMaxTotalPoints = computeRubricMaxPoints(criteria);
    const rubricId = await insertRubric({
        name,
        description: description || null,
        max_total_points: computedMaxTotalPoints,
        version,
        is_active: true,
    });

    // Insert criteria; rollback rubric row if criteria insert fails.
    const criteriaPayload = normalizeCriteriaPayload(rubricId, criteria);
    try {
        await insertRubricCriteria(criteriaPayload);
    } catch (error) {
        await deleteRubricById(rubricId);
        throw error;
    }

    // Keep one default rubric per track when requested.
    if (isDefault) {
        await clearTrackDefaultRubrics(trackId);
    }

    const trackRubricId = await upsertTrackRubricLink({
        trackId,
        rubricId,
        isDefault,
    });

    return {
        rubricId,
        trackRubricId,
    };
}

export async function updateRubricAndTrackAssignment({
    trackId,
    rubricId,
    name,
    description,
    version,
    isDefault,
    criteria,
}) {
    // Update rubric metadata and replace criteria set.
    const computedMaxTotalPoints = computeRubricMaxPoints(criteria);
    await updateRubricById(rubricId, {
        name,
        description: description || null,
        version,
        max_total_points: computedMaxTotalPoints,
        is_active: true,
    });

    await deleteRubricCriteriaByRubricId(rubricId);

    const criteriaPayload = normalizeCriteriaPayload(rubricId, criteria);
    await insertRubricCriteria(criteriaPayload);

    // Keep one default rubric per track when requested.
    if (isDefault) {
        await clearTrackDefaultRubrics(trackId);
    }

    const trackRubricId = await upsertTrackRubricLink({
        trackId,
        rubricId,
        isDefault,
    });

    return {
        rubricId,
        trackRubricId,
    };
}
