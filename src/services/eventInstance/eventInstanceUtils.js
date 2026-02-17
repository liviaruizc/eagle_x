export const ALLOWED_EVENT_STATUSES = ["closed", "pre-scoring", "event_scoring", "done"];

const PRE_SCORING_ENABLED_VALUE = "yes";

export function normalizeEventStatus(status) {
    return ALLOWED_EVENT_STATUSES.includes(status) ? status : "closed";
}

export function toIsoString(value) {
    return new Date(value).toISOString();
}

export function buildEventInsertPayload({ eventName, eventDescription, hostOrg, isActive }) {
    return {
        name: eventName,
        description: eventDescription || null,
        host_org: hostOrg || null,
        is_active: isActive,
    };
}

export function buildEventInstanceInsertPayload({
    eventId,
    instanceName,
    startAt,
    endAt,
    preScoringEnabled,
    preScoringStartAt,
    preScoringEndAt,
    location,
    status,
    timezone,
}) {
    const preScoringIsEnabled = preScoringEnabled === PRE_SCORING_ENABLED_VALUE;

    return {
        event_id: eventId,
        name: instanceName,
        start_at: toIsoString(startAt),
        end_at: toIsoString(endAt),
        pre_scoring_start_at:
            preScoringIsEnabled && preScoringStartAt ? toIsoString(preScoringStartAt) : null,
        pre_scoring_end_at:
            preScoringIsEnabled && preScoringEndAt ? toIsoString(preScoringEndAt) : null,
        location: location || null,
        status: normalizeEventStatus(status),
        timezone,
    };
}

export function buildTrackInsertRows({
    trackTypesToCreate,
    eventInstanceId,
    instanceName,
    submissionOpenAt,
    submissionCloseAt,
    startAt,
    endAt,
}) {
    return (trackTypesToCreate ?? []).map((trackType, index) => ({
        event_instance_id: eventInstanceId,
        track_type_id: trackType.track_type_id,
        name: `${instanceName} ${trackType.name}`,
        submission_open_at: toIsoString(submissionOpenAt),
        submission_close_at: toIsoString(submissionCloseAt),
        scoring_open_at: toIsoString(startAt),
        scoring_close_at: toIsoString(endAt),
        display_order: index + 1,
    }));
}
