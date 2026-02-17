// Low-level Supabase access helpers for track and facet configuration.
//
// Responsibilities:
// - Read track types/names and track-facet mappings.
// - Read facet and facet-option metadata used by submission forms.
// - Seed default track types when missing.

import { supabase } from "../../lib/supabaseClient.js";

export async function fetchTrackTypeRows() {
    const { data, error } = await supabase
        .from("track_type")
        .select("track_type_id, code, name")
        .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchTrackNameRow(trackId) {
    const { data, error } = await supabase
        .from("track")
        .select("name")
        .eq("track_id", trackId)
        .single();

    if (error) throw error;
    return data;
}

export async function fetchTrackFacetRows(trackId) {
    const { data, error } = await supabase
        .from("track_facet")
        .select("track_facet_id, facet_id, is_required, display_order, depends_on_facet_id, depends_on_option_id")
        .eq("track_id", trackId)
        .order("display_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetRowsByIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code, name, value_kind")
        .in("facet_id", facetIds);

    if (error) throw error;
    return data ?? [];
}

export async function fetchAllFacetRows() {
    const { data, error } = await supabase
        .from("facet")
        .select("facet_id, code, name, value_kind")
        .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function fetchFacetOptionRowsByFacetIds(facetIds) {
    if (!facetIds?.length) return [];

    const { data, error } = await supabase
        .from("facet_option")
        .select("facet_option_id, facet_id, value, label, parent_option_id, sort_order")
        .in("facet_id", facetIds)
        .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function upsertTrackTypes(rows) {
    const { error } = await supabase
        .from("track_type")
        .upsert(rows, { onConflict: "code" });

    if (error) throw error;
}
