// Pure helpers for schedule-driven event/submission status decisions.
//
// Responsibilities:
// - Resolve event-instance status from timeline windows.
// - Build grouped update targets for event and submission status operations.
// - Compute which submissions pass score-sheet judge thresholds.

export function resolveEventInstanceStatus(instance, now) {
    const eventStartAt = instance.start_at ? new Date(instance.start_at) : null;
    const eventEndAt = instance.end_at ? new Date(instance.end_at) : null;
    const preScoringStartAt = instance.pre_scoring_start_at ? new Date(instance.pre_scoring_start_at) : null;
    const preScoringEndAt = instance.pre_scoring_end_at ? new Date(instance.pre_scoring_end_at) : null;

    if (eventEndAt && now >= eventEndAt) return "done";
    if (eventStartAt && now >= eventStartAt) return "event_scoring";

    const hasPreScoringWindow = preScoringStartAt && preScoringEndAt;
    if (hasPreScoringWindow && now >= preScoringStartAt && now < preScoringEndAt) {
        return "pre-scoring";
    }

    return "closed";
}

export function groupEventInstanceIdsByTargetStatus(instances, now) {
    const grouped = {
        "pre-scoring": [],
        event_scoring: [],
        done: [],
        closed: [],
    };

    for (const instance of instances ?? []) {
        const targetStatus = resolveEventInstanceStatus(instance, now);
        if (instance.status !== targetStatus) {
            grouped[targetStatus].push(instance.event_instance_id);
        }
    }

    return grouped;
}

export function buildTrackIdsByEventInstanceId(tracks) {
    const trackIdsByEventInstanceId = new Map();

    for (const track of tracks ?? []) {
        if (!trackIdsByEventInstanceId.has(track.event_instance_id)) {
            trackIdsByEventInstanceId.set(track.event_instance_id, []);
        }

        trackIdsByEventInstanceId.get(track.event_instance_id).push(track.track_id);
    }

    return trackIdsByEventInstanceId;
}

export function buildSubmissionTrackUpdateGroups(instances, trackIdsByEventInstanceId) {
    const updateGroups = {
        pre_scoring: [],
        pre_scored: [],
        event_scoring: [],
        done: [],
    };

    for (const instance of instances ?? []) {
        const trackIds = trackIdsByEventInstanceId.get(instance.event_instance_id) ?? [];
        if (!trackIds.length) continue;

        if (instance.status === "pre-scoring") {
            updateGroups.pre_scoring.push(...trackIds);
        } else if (instance.status === "closed") {
            updateGroups.pre_scored.push(...trackIds);
        } else if (instance.status === "event_scoring") {
            updateGroups.event_scoring.push(...trackIds);
        } else if (instance.status === "done") {
            updateGroups.done.push(...trackIds);
        }
    }

    return {
        pre_scoring: [...new Set(updateGroups.pre_scoring)],
        pre_scored: [...new Set(updateGroups.pre_scored)],
        event_scoring: [...new Set(updateGroups.event_scoring)],
        done: [...new Set(updateGroups.done)],
    };
}

export function getSubmissionIdsMeetingScoreThreshold(scoreSheetRows, minScores = 3) {
    const judgeSetBySubmissionId = new Map();

    for (const row of scoreSheetRows ?? []) {
        if (!row?.submission_id || !row?.judge_person_id) continue;

        const current = judgeSetBySubmissionId.get(row.submission_id) ?? new Set();
        current.add(row.judge_person_id);
        judgeSetBySubmissionId.set(row.submission_id, current);
    }

    const passingSubmissionIds = new Set();

    judgeSetBySubmissionId.forEach((judgeSet, submissionId) => {
        if (judgeSet.size >= minScores) {
            passingSubmissionIds.add(submissionId);
        }
    });

    return passingSubmissionIds;
}

export function normalizeInstancesWithResolvedStatus(instances, now) {
    return (instances ?? []).map((instance) => ({
        ...instance,
        status: resolveEventInstanceStatus(instance, now),
    }));
}
