// Track service facade for track metadata and facet configuration.
//
// Responsibilities:
// - Expose stable functions used by pages/forms for tracks and facets.
// - Orchestrate fallback behavior when no explicit track-facet rows exist.
//
// Notes:
// - Raw Supabase calls are delegated to `services/track/trackApi`.
// - Pure mapping helpers are delegated to `services/track/trackUtils`.

import {
    fetchAllFacetRows,
    fetchFacetOptionRowsByFacetIds,
    fetchFacetRowsByIds,
    fetchTrackFacetRows,
    fetchTrackNameRow,
    fetchTrackTypeRows,
    upsertTrackTypes,
    fetchTracksByEventInstance,
} from "./trackApi.js";
import {
    DEFAULT_TRACK_TYPES,
    mapFallbackFacets,
    mapTrackFacets,
    toUniqueFacetIds,
} from "./trackUtils.js";

// Reads available track types for event creation flow.
export async function fetchTrackTypes() {
    return fetchTrackTypeRows();
}

// Reads all tracks for an event instance, used for track selection and track name lookups.
export async function fetchTracksForEvent(eventInstanceId) {
    return fetchTracksByEventInstance(eventInstanceId);
}



// Reads a single track name for pages that receive only track_id in the route.
export async function fetchTrackName(trackId) {
    const data = await fetchTrackNameRow(trackId);
    return data?.name ?? "Track";
}

// Loads track facet definitions and facet options for submission forms.
export async function fetchTrackFacets(trackId) {
    const trackFacets = await fetchTrackFacetRows(trackId);

    // Fallback: if track has no explicit facet mapping, expose all facets/options.
    if (!trackFacets?.length) {
        const facets = await fetchAllFacetRows();
        if (!facets?.length) return [];

        const facetIds = facets.map((facet) => facet.facet_id);
        const options = await fetchFacetOptionRowsByFacetIds(facetIds);

        return mapFallbackFacets(facets, options);
    }

    const facetIds = toUniqueFacetIds(trackFacets);
    const [facets, options] = await Promise.all([
        fetchFacetRowsByIds(facetIds),
        fetchFacetOptionRowsByFacetIds(facetIds),
    ]);

    return mapTrackFacets(trackFacets, facets, options);
}

// Seeds default track types if they do not exist.
export async function ensureDefaultTrackTypes() {
    await upsertTrackTypes(DEFAULT_TRACK_TYPES);
}
