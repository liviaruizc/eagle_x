function mapById(rows, key) {
    return new Map((rows ?? []).map((row) => [row[key], row]));
}

export function mapEventInstanceSummaries(instances, events) {
    const eventById = mapById(events, "event_id");

    return (instances ?? []).map((instance) => {
        const event = eventById.get(instance.event_id);

        return {
            id: instance.event_instance_id,
            name: instance.name,
            date: instance.start_at,
            description: event?.description ?? "",
            umbrellaName: event?.name ?? "",
            status: instance.status,
            location: instance.location,
        };
    });
}

export function mapEventInstanceDetails(instance, event, tracks, trackTypes) {
    const trackTypeById = mapById(trackTypes, "track_type_id");

    return {
        id: instance.event_instance_id,
        name: instance.name,
        startAt: instance.start_at,
        endAt: instance.end_at,
        preScoringStartAt: instance.pre_scoring_start_at,
        preScoringEndAt: instance.pre_scoring_end_at,
        location: instance.location,
        status: instance.status,
        timezone: instance.timezone,
        event: {
            id: event.event_id,
            name: event.name,
            description: event.description,
            hostOrg: event.host_org,
            isActive: event.is_active,
        },
        tracks: (tracks ?? []).map((track) => {
            const trackType = trackTypeById.get(track.track_type_id);

            return {
                id: track.track_id,
                name: track.name,
                typeName: trackType?.name ?? "",
                typeCode: trackType?.code ?? "",
                submissionOpenAt: track.submission_open_at,
                submissionCloseAt: track.submission_close_at,
                scoringOpenAt: track.scoring_open_at,
                scoringCloseAt: track.scoring_close_at,
                displayOrder: track.display_order,
            };
        }),
    };
}
