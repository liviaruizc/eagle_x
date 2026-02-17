// Schedule-based status synchronization service facade.
//
// Responsibilities:
// - Keep event_instance statuses aligned with timeline windows.
// - Cascade status updates to submissions by lifecycle phase.
// - Enforce score-threshold gates before moving to terminal submission states.

import {
    fetchEventInstancesForStatusSync,
    fetchSubmittedScoreSheetsForSubmissions,
    fetchSubmissionIdsByTrackIdsAndStatus,
    fetchTracksByEventInstanceIds,
    updateEventInstanceStatusesByIds,
    updateSubmissionStatusBySubmissionIds,
    updateSubmissionStatusByTrackIds,
} from "./statusSyncApi.js";
import {
    buildSubmissionTrackUpdateGroups,
    buildTrackIdsByEventInstanceId,
    getSubmissionIdsMeetingScoreThreshold,
    groupEventInstanceIdsByTargetStatus,
    normalizeInstancesWithResolvedStatus,
} from "./statusSyncUtils.js";

async function applyEventInstanceStatusChanges(instances, now) {
    const groupedIds = groupEventInstanceIdsByTargetStatus(instances, now);

    for (const [status, ids] of Object.entries(groupedIds)) {
        await updateEventInstanceStatusesByIds(status, ids);
    }
}

async function transitionSubmissionsToThresholdStatus({ trackIds, fromStatus, toStatus, minScores = 3 }) {
    if (!trackIds?.length) return;

    const candidateSubmissionIds = await fetchSubmissionIdsByTrackIdsAndStatus(trackIds, fromStatus);
    const scoreSheetRows = await fetchSubmittedScoreSheetsForSubmissions(candidateSubmissionIds);
    const passingSubmissionIds = getSubmissionIdsMeetingScoreThreshold(scoreSheetRows, minScores);

    await updateSubmissionStatusBySubmissionIds({
        submissionIds: [...passingSubmissionIds],
        fromStatus,
        toStatus,
    });
}

async function applySubmissionStatusChanges(instances) {
    if (!instances.length) return;

    // Group tracks by current event-instance lifecycle.
    const eventInstanceIds = instances.map((instance) => instance.event_instance_id);
    const tracks = await fetchTracksByEventInstanceIds(eventInstanceIds);
    if (!tracks.length) return;

    const trackIdsByEventInstanceId = buildTrackIdsByEventInstanceId(tracks);
    const updateGroups = buildSubmissionTrackUpdateGroups(instances, trackIdsByEventInstanceId);

    // Pre-scoring windows open direct progression into pre_scoring.
    await updateSubmissionStatusByTrackIds({
        trackIds: updateGroups.pre_scoring,
        fromStatuses: ["submitted", "pre_scoring", "pre_scored"],
        toStatus: "pre_scoring",
    });

    // Closed windows move eligible pre_scoring rows to pre_scored (threshold-gated).
    await transitionSubmissionsToThresholdStatus({
        trackIds: updateGroups.pre_scored,
        fromStatus: "pre_scoring",
        toStatus: "pre_scored",
        minScores: 3,
    });

    // Event-scoring windows open direct progression into event_scoring.
    await updateSubmissionStatusByTrackIds({
        trackIds: updateGroups.event_scoring,
        fromStatuses: ["submitted", "pre_scoring", "pre_scored", "event_scoring"],
        toStatus: "event_scoring",
    });

    // Done windows move eligible event_scoring rows to done (threshold-gated).
    await transitionSubmissionsToThresholdStatus({
        trackIds: updateGroups.done,
        fromStatus: "event_scoring",
        toStatus: "done",
        minScores: 3,
    });
}

// Synchronizes event and submission statuses against timeline windows.
export async function syncEventAndSubmissionStatusesBySchedule() {
    const now = new Date();

    // Load current event instances and short-circuit empty states.
    const instances = await fetchEventInstancesForStatusSync();
    if (!instances.length) return;

    // Apply event status updates first, then sync submission statuses.
    const normalizedInstances = normalizeInstancesWithResolvedStatus(instances, now);
    await applyEventInstanceStatusChanges(instances, now);
    await applySubmissionStatusChanges(normalizedInstances);
}
