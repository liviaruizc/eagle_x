import { fetchTrackTypes } from "../track/trackService.js";
import {
    createEvent,
    createEventInstance,
    deleteEventInstanceById,
    deleteTracksByEventInstanceId,
    fetchEventById,
    fetchEventByIds,
    fetchEventInstanceById,
    fetchEventInstanceRows,
    fetchTracksByEventInstanceId,
    findEventIdByName,
    insertTracks,
    updateEventInstanceById,
} from "./eventInstanceApi.js";
import { mapEventInstanceDetails, mapEventInstanceSummaries } from "./eventInstanceMappers.js";
import {
    buildEventInsertPayload,
    buildEventInstanceInsertPayload,
    normalizeEventStatus,
    toIsoString,
    buildTrackInsertRows,
} from "./eventInstanceUtils.js";
import { syncEventAndSubmissionStatusesBySchedule } from "../statusSync/statusSyncService.js";

// Fetches event instances and enriches with umbrella event metadata.
export async function fetchEventInstances() {
    const instances = await fetchEventInstanceRows();
    if (!instances.length) return [];

    const eventIds = [...new Set(instances.map((instance) => instance.event_id))];
    const events = await fetchEventByIds(eventIds);

    return mapEventInstanceSummaries(instances, events);
}

// Fetches full details for a single event instance including tracks.
export async function fetchEventInstanceDetails(eventInstanceId) {
    const instance = await fetchEventInstanceById(eventInstanceId);
    const [event, tracks, trackTypes] = await Promise.all([
        fetchEventById(instance.event_id),
        fetchTracksByEventInstanceId(eventInstanceId),
        fetchTrackTypes(),
    ]);

    return mapEventInstanceDetails(instance, event, tracks, trackTypes);
}

// Deletes an event instance and all related track rows.
export async function deleteEventInstance(eventInstanceId) {
    await deleteTracksByEventInstanceId(eventInstanceId);
    await deleteEventInstanceById(eventInstanceId);
}

// Creates event, event instance, and tracks from admin form data.
export async function createEventHierarchyFromForm(form) {
    const {
        eventName,
        eventDescription,
        hostOrg,
        isActive,
        instanceName,
        startAt,
        endAt,
        location,
        status,
        timezone,
        preScoringEnabled,
        preScoringStartAt,
        preScoringEndAt,
        submissionOpenAt,
        submissionCloseAt,
        selectedTrackTypeIds,
            // Removed: track-level pre-scoring
    } = form;

    let eventId = await findEventIdByName(eventName);

    if (!eventId) {
        const eventPayload = buildEventInsertPayload({
            eventName,
            eventDescription,
            hostOrg,
            isActive,
        });
        eventId = await createEvent(eventPayload);
    }

    const hasTracks = selectedTrackTypeIds.length > 0;
    const eventInstancePayload = buildEventInstanceInsertPayload({
        eventId,
        instanceName,
        startAt,
        endAt,
        preScoringEnabled: hasTracks ? "no" : preScoringEnabled,
        preScoringStartAt: hasTracks ? null : preScoringStartAt,
        preScoringEndAt: hasTracks ? null : preScoringEndAt,
        location,
        status,
        timezone,
    });
    const eventInstanceId = await createEventInstance(eventInstancePayload);

    const selectedTrackTypes = await fetchTrackTypes();
    const trackTypesToCreate = selectedTrackTypes.filter((trackType) =>
        selectedTrackTypeIds.includes(trackType.track_type_id)
    );

    if (trackTypesToCreate.length) {
        const tracksToInsert = buildTrackInsertRows({
            trackTypesToCreate,
            eventInstanceId,
            instanceName,
            submissionOpenAt,
            submissionCloseAt,
            startAt,
            endAt,
            preScoringStartAt,
                // Removed: track-level pre-scoring
        });

        await insertTracks(tracksToInsert);
    }

    return {
        eventId,
        eventInstanceId,
        tracksCreated: trackTypesToCreate.length,
    };
}

// Updates event-instance timeline fields and immediately syncs statuses.
export async function updateEventInstanceSchedule(eventInstanceId, form) {
    const payload = {
        name: form.instanceName?.trim(),
        start_at: toIsoString(form.startAt),
        end_at: toIsoString(form.endAt),
        pre_scoring_start_at: form.preScoringEnabled === "yes" && form.preScoringStartAt
            ? toIsoString(form.preScoringStartAt)
            : null,
        pre_scoring_end_at: form.preScoringEnabled === "yes" && form.preScoringEndAt
            ? toIsoString(form.preScoringEndAt)
            : null,
        location: form.location?.trim() || null,
        timezone: form.timezone?.trim() || "UTC",
        status: normalizeEventStatus(form.status),
    };

    await updateEventInstanceById(eventInstanceId, payload);
    await syncEventAndSubmissionStatusesBySchedule();
}
