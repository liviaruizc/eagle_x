import { fetchTrackTypes } from "../track/trackService.js";
import { syncEventAndSubmissionStatusesBySchedule } from "../statusSync/statusSyncService.js";
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
} from "./eventInstanceApi.js";
import { mapEventInstanceDetails, mapEventInstanceSummaries } from "./eventInstanceMappers.js";
import {
    buildEventInsertPayload,
    buildEventInstanceInsertPayload,
    buildTrackInsertRows,
} from "./eventInstanceUtils.js";

// Fetches event instances and enriches with umbrella event metadata.
export async function fetchEventInstances() {
    await syncEventAndSubmissionStatusesBySchedule();

    const instances = await fetchEventInstanceRows();
    if (!instances.length) return [];

    const eventIds = [...new Set(instances.map((instance) => instance.event_id))];
    const events = await fetchEventByIds(eventIds);

    return mapEventInstanceSummaries(instances, events);
}

// Fetches full details for a single event instance including tracks.
export async function fetchEventInstanceDetails(eventInstanceId) {
    await syncEventAndSubmissionStatusesBySchedule();

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

    const eventInstancePayload = buildEventInstanceInsertPayload({
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
        });

        await insertTracks(tracksToInsert);
    }

    return {
        eventId,
        eventInstanceId,
        tracksCreated: trackTypesToCreate.length,
    };
}
