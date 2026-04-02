// Queue service for judge scoring workflow.
//
// Responsibilities:
// - Load submissions that are eligible for a judge in an event instance.
// - Exclude submissions already scored by the judge and conflict-of-interest submissions.
// - Build facet-driven filter metadata, default judge filters, and filtered queue results.
// - Provide reusable queue filtering for UI interactions.
//
// Notes:
// - This module orchestrates query + normalization for queue pages.
// - Helper functions in this file are intentionally pure where possible.
import {
    fetchEligibleSubmissionsByTracks,
    fetchFacetOptionsByIds,
    fetchFacetsByIds,
    fetchJudgeFacetValuesForEvent,
    fetchQueueStatusSubmissions,
    fetchScoredSubmissionRows,
    fetchSubmissionFacetValues,
    fetchTableAssignmentsBySubmissions,
    fetchTracksByEventInstance,
    hasJudgeScoreSheet,
} from "./queueApi.js";
import {
    applySubmissionFilters,
    buildDefaultSelectedTokensByFacetId,
    buildEmptyQueueResult,
    buildFilterFacets,
    buildNormalizedSubmissions,
    buildSelectedFiltersMap,
    buildSubmissionFacetMaps,
    isUuid,
    toUniqueIds,
} from "./queueUtils.js";

const DEBUG_LOGS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === "true";
const SESSION_FILTER_FACET_ID = "__SESSION_FILTER__";

function normalizeSessionCode(value) {
    const text = String(value ?? "").trim().toUpperCase();
    if (!text) return "";

    const match = text.match(/[A-Z]/);
    return match ? match[0] : "";
}

function deriveSessionCodeFromTable(tableInfo) {
    if (!tableInfo) return "";

    const explicitSession = normalizeSessionCode(tableInfo.session);
    if (explicitSession) return explicitSession;

    const assignmentNameCandidates = [tableInfo.table_number, tableInfo.location_description];
    for (const candidate of assignmentNameCandidates) {
        const derived = normalizeSessionCode(candidate);
        if (derived) return derived;
    }

    return "";
}

function attachSessionFilters({
    eligibleSubmissionIds,
    tableBySubmissionId,
    facetTokensBySubmissionId,
    displayFacetsBySubmissionId,
    facetById,
}) {
    facetById.set(SESSION_FILTER_FACET_ID, {
        facet_id: SESSION_FILTER_FACET_ID,
        code: "SESSION",
        name: "Session",
    });

    for (const submissionId of eligibleSubmissionIds) {
        const tableInfo = tableBySubmissionId.get(submissionId) ?? null;
        const sessionCode = deriveSessionCodeFromTable(tableInfo);
        if (!sessionCode) continue;

        const token = `session:${sessionCode}`;

        if (!facetTokensBySubmissionId.has(submissionId)) {
            facetTokensBySubmissionId.set(submissionId, new Map());
        }

        const tokenMap = facetTokensBySubmissionId.get(submissionId);
        const existingTokenSet = tokenMap.get(SESSION_FILTER_FACET_ID) ?? new Set();
        existingTokenSet.add(token);
        tokenMap.set(SESSION_FILTER_FACET_ID, existingTokenSet);

        if (!displayFacetsBySubmissionId.has(submissionId)) {
            displayFacetsBySubmissionId.set(submissionId, []);
        }

        const displayFacets = displayFacetsBySubmissionId.get(submissionId);
        if (!displayFacets.some((item) => item.facetId === SESSION_FILTER_FACET_ID && item.token === token)) {
            displayFacets.push({
                facetId: SESSION_FILTER_FACET_ID,
                facetOptionId: null,
                token,
                label: `Session ${sessionCode}`,
            });
        }
    }
}

function attachSessionDefaults({ defaultFiltersMap, judgeFacetValues, optionById, facetById }) {
    const sessionDefaults = [];

    for (const valueRow of judgeFacetValues) {
        const facetMeta = facetById.get(valueRow.facet_id);
        const facetCode = String(facetMeta?.code || "").toUpperCase();
        if (!facetCode.includes("SESSION")) continue;

        const option = valueRow.facet_option_id ? optionById.get(valueRow.facet_option_id) : null;
        const sessionCode = normalizeSessionCode(option?.value || option?.label || valueRow.value_text || "");
        if (!sessionCode) continue;

        const token = `session:${sessionCode}`;
        if (!sessionDefaults.some((item) => item.token === token)) {
            sessionDefaults.push({ token, label: `Session ${sessionCode}` });
        }
    }

    if (sessionDefaults.length) {
        const current = defaultFiltersMap[SESSION_FILTER_FACET_ID] ?? [];
        defaultFiltersMap[SESSION_FILTER_FACET_ID] = [...current, ...sessionDefaults].filter(
            (item, index, arr) => arr.findIndex((next) => next.token === item.token) === index
        );
    }
}

/**
 * Returns the next available submission for a judge.
 * A submission is eligible when status is available and judge has not scored it yet.
 */

export async function pullNext(judgeId) {
    const submissions = await fetchQueueStatusSubmissions();
    if (!submissions.length) return null;

    // Pick the first submission this judge has not scored yet.
    for (const submission of submissions) {
        const alreadyScored = isUuid(judgeId)
            ? await hasJudgeScoreSheet({ judgeId, submissionId: submission.submission_id })
            : false;

        if (!alreadyScored) return submission;
    }

    return null;
}

export async function fetchQueueSubmissionsForJudge({ judgePersonId, eventInstanceId, trackId }) {
    if (DEBUG_LOGS) {
        console.log("Fetching queue submissions with params:", { judgePersonId, eventInstanceId, trackId });
    }
    if (!judgePersonId) {
        throw new Error("Judge person id is required.");
    }

    if (!eventInstanceId) {
        throw new Error("Event instance id is required.");
    }

    let trackIds = [];
    let trackNameById = new Map();

    if (trackId) {
        // single track selected
        trackIds = [trackId];
        const track = await fetchTracksByEventInstance(eventInstanceId)
            .then(tracks => tracks.find(t => t.track_id === trackId));
        trackNameById.set(trackId, track?.name ?? "Track");
    } else {
        // fallback: all tracks
        const tracks = await fetchTracksByEventInstance(eventInstanceId);
        if (!tracks.length) return buildEmptyQueueResult();
        trackIds = tracks.map((track) => track.track_id);
        trackNameById = new Map(tracks.map((track) => [track.track_id, track.name ?? "Track"]));
    }

    if (DEBUG_LOGS) {
        console.log("Determined trackIds for queue fetch:", trackIds);
    }

    const submissions = await fetchEligibleSubmissionsByTracks({ trackIds: [trackIds], judgePersonId });
    if (!submissions.length) return buildEmptyQueueResult();

    const submissionIds = submissions.map((submission) => submission.submission_id);
    const scoredRows = await fetchScoredSubmissionRows({ judgePersonId, submissionIds });

    const scoredSubmissionIds = new Set((scoredRows ?? []).map((row) => row.submission_id));
    const unscoredSubmissions = submissions.filter(
        (submission) =>
            !scoredSubmissionIds.has(submission.submission_id) &&
            submission.supervisor_person_id !== judgePersonId
    );

    if (!unscoredSubmissions.length) return buildEmptyQueueResult();

    const eligibleSubmissionIds = unscoredSubmissions.map((submission) => submission.submission_id);
    const [submissionFacetValues, judgeFacetValues, tableAssignmentRows] = await Promise.all([
        fetchSubmissionFacetValues(eligibleSubmissionIds),
        fetchJudgeFacetValuesForEvent({ judgePersonId, eventInstanceId }),
        fetchTableAssignmentsBySubmissions(eligibleSubmissionIds),
    ]);

    const tableBySubmissionId = new Map(
        tableAssignmentRows.map((row) => [row.submission_id, row.event_table ?? null])
    );

    const facetIds = toUniqueIds([
        ...(submissionFacetValues ?? []).map((row) => row.facet_id),
        ...judgeFacetValues.map((row) => row.facet_id),
    ]);

    const optionIds = toUniqueIds([
        ...(submissionFacetValues ?? []).map((row) => row.facet_option_id),
        ...judgeFacetValues.map((row) => row.facet_option_id),
    ]);

    const [facetRows, optionRows] = await Promise.all([
        fetchFacetsByIds(facetIds),
        fetchFacetOptionsByIds(optionIds),
    ]);

    const facetById = new Map(facetRows.map((facet) => [facet.facet_id, facet]));
    const optionById = new Map(optionRows.map((option) => [option.facet_option_id, option]));

    const defaultFiltersMap = buildSelectedFiltersMap(judgeFacetValues, optionById);
    attachSessionDefaults({ defaultFiltersMap, judgeFacetValues, optionById, facetById });
    const defaultSelectedTokensByFacetId = buildDefaultSelectedTokensByFacetId(defaultFiltersMap);

    const { facetTokensBySubmissionId, displayFacetsBySubmissionId } = buildSubmissionFacetMaps(
        submissionFacetValues ?? [],
        optionById
    );

    attachSessionFilters({
        eligibleSubmissionIds,
        tableBySubmissionId,
        facetTokensBySubmissionId,
        displayFacetsBySubmissionId,
        facetById,
    });

    const normalizedSubmissions = buildNormalizedSubmissions({
        submissions: unscoredSubmissions,
        facetById,
        facetTokensBySubmissionId,
        displayFacetsBySubmissionId,
        trackNameById,
        tableBySubmissionId,
    });

    const filterFacets = buildFilterFacets({
        submissions: unscoredSubmissions,
        facetById,
        displayFacetsBySubmissionId,
        judgeDefaultFiltersByFacetId: defaultFiltersMap,
    });

    const filteredSubmissions = applySubmissionFilters(
        normalizedSubmissions,
        defaultSelectedTokensByFacetId
    );

    return {
        submissions: normalizedSubmissions,
        filteredSubmissions,
        filterFacets,
        defaultSelectedTokensByFacetId,
    };
}

export function filterQueueSubmissions(submissions, selectedFiltersByFacetId) {
    return applySubmissionFilters(submissions, selectedFiltersByFacetId);
}