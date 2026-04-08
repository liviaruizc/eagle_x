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
    fetchFacetOptionsByFacetIds,
    fetchFacetsByIds,
    fetchJudgeAssignmentsBySubmissionIds,
    fetchJudgeFacetValuesForEvent,
    fetchQueueStatusSubmissions,
    fetchScoreSheetRowsBySubmissionIds,
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
const SCORING_ACTIVITY_TTL_MS = 5 * 60 * 1000;

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
    targetFacetId,
    optionTokenBySessionCode,
    optionLabelBySessionCode,
}) {
    const sessionFacetId = targetFacetId || SESSION_FILTER_FACET_ID;

    if (!targetFacetId) {
        facetById.set(SESSION_FILTER_FACET_ID, {
            facet_id: SESSION_FILTER_FACET_ID,
            code: "SESSION",
            name: "Session",
        });
    }

    for (const submissionId of eligibleSubmissionIds) {
        const tableInfo = tableBySubmissionId.get(submissionId) ?? null;
        const sessionCode = deriveSessionCodeFromTable(tableInfo);
        if (!sessionCode) continue;

        const token = optionTokenBySessionCode?.get(sessionCode) || `session:${sessionCode}`;
        const label = optionLabelBySessionCode?.get(sessionCode) || `Session ${sessionCode}`;

        if (!facetTokensBySubmissionId.has(submissionId)) {
            facetTokensBySubmissionId.set(submissionId, new Map());
        }

        const tokenMap = facetTokensBySubmissionId.get(submissionId);
        const existingTokenSet = tokenMap.get(sessionFacetId) ?? new Set();
        existingTokenSet.add(token);
        tokenMap.set(sessionFacetId, existingTokenSet);

        if (!displayFacetsBySubmissionId.has(submissionId)) {
            displayFacetsBySubmissionId.set(submissionId, []);
        }

        const displayFacets = displayFacetsBySubmissionId.get(submissionId);
        if (!displayFacets.some((item) => item.facetId === sessionFacetId && item.token === token)) {
            displayFacets.push({
                facetId: sessionFacetId,
                facetOptionId: null,
                token,
                label,
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

function hasRealSessionFacet(facetById) {
    for (const facet of facetById.values()) {
        const facetCode = String(facet?.code || "").toUpperCase();
        if (facetCode.includes("SESSION")) return true;
    }

    return false;
}

function findRealSessionFacetId(facetById) {
    let fallbackFacetId = null;

    for (const facet of facetById.values()) {
        const facetCode = String(facet?.code || "").toUpperCase();
        if (!facetCode.includes("SESSION")) continue;

        if (facetCode === "SESSION") {
            return facet.facet_id;
        }

        if (!fallbackFacetId) {
            fallbackFacetId = facet.facet_id;
        }
    }

    return fallbackFacetId;
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
            .then((tracks) => tracks.find((t) => String(t.track_id) === String(trackId)));
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

    const submissions = await fetchEligibleSubmissionsByTracks({ trackIds, judgePersonId });
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
    const [submissionFacetValues, judgeFacetValues, tableAssignmentRows, scoreSheetRows, assignmentRows] = await Promise.all([
        fetchSubmissionFacetValues(eligibleSubmissionIds),
        fetchJudgeFacetValuesForEvent({ judgePersonId, eventInstanceId }),
        fetchTableAssignmentsBySubmissions(eligibleSubmissionIds),
        fetchScoreSheetRowsBySubmissionIds(eligibleSubmissionIds),
        fetchJudgeAssignmentsBySubmissionIds(eligibleSubmissionIds),
    ]);

    const scoreCountBySubmissionId = new Map();
    for (const row of scoreSheetRows ?? []) {
        const submissionId = row.submission_id;
        scoreCountBySubmissionId.set(submissionId, (scoreCountBySubmissionId.get(submissionId) ?? 0) + 1);
    }

    const latestAssignedAtBySubmissionId = new Map();
    for (const row of assignmentRows ?? []) {
        const submissionId = row.submission_id;
        const assignedAt = row.assigned_at;
        if (!submissionId || !assignedAt) continue;

        const assignedAtMs = new Date(assignedAt).getTime();
        const currentLatest = latestAssignedAtBySubmissionId.get(submissionId) ?? 0;
        if (assignedAtMs > currentLatest) {
            latestAssignedAtBySubmissionId.set(submissionId, assignedAtMs);
        }
    }

    const nowMs = Date.now();
    const isBeingScoredBySubmissionId = new Map();
    for (const submissionId of eligibleSubmissionIds) {
        const latestAssignedAtMs = latestAssignedAtBySubmissionId.get(submissionId) ?? 0;
        const isRecentlyAssigned = latestAssignedAtMs > 0 && (nowMs - latestAssignedAtMs) <= SCORING_ACTIVITY_TTL_MS;
        isBeingScoredBySubmissionId.set(submissionId, isRecentlyAssigned);
    }

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

    const [facetRows, optionRows, allFacetOptionRows] = await Promise.all([
        fetchFacetsByIds(facetIds),
        fetchFacetOptionsByIds(optionIds),
        fetchFacetOptionsByFacetIds(facetIds),
    ]);

    const facetById = new Map(facetRows.map((facet) => [facet.facet_id, facet]));
    const optionById = new Map(optionRows.map((option) => [option.facet_option_id, option]));
    const includesRealSessionFacet = hasRealSessionFacet(facetById);
    const realSessionFacetId = includesRealSessionFacet ? findRealSessionFacetId(facetById) : null;
    const sessionOptionTokenBySessionCode = new Map();
    const sessionOptionLabelBySessionCode = new Map();

    if (realSessionFacetId) {
        for (const option of allFacetOptionRows) {
            if (option.facet_id !== realSessionFacetId) continue;
            const code = normalizeSessionCode(option.value || option.label);
            if (!code) continue;

            const token = String(option.facet_option_id);
            sessionOptionTokenBySessionCode.set(code, token);
            sessionOptionLabelBySessionCode.set(code, option.label || option.value || `Session ${code}`);
        }
    }

    const defaultFiltersMap = buildSelectedFiltersMap(judgeFacetValues, optionById);
    if (!includesRealSessionFacet) {
        attachSessionDefaults({ defaultFiltersMap, judgeFacetValues, optionById, facetById });
    }
    const defaultSelectedTokensByFacetId = buildDefaultSelectedTokensByFacetId(defaultFiltersMap);

    const { facetTokensBySubmissionId, displayFacetsBySubmissionId } = buildSubmissionFacetMaps(
        submissionFacetValues ?? [],
        optionById
    );

    // Always map table-assigned sessions into the session filter.
    // If a real SESSION facet exists, enrich that facet; otherwise create synthetic SESSION facet.
    attachSessionFilters({
        eligibleSubmissionIds,
        tableBySubmissionId,
        facetTokensBySubmissionId,
        displayFacetsBySubmissionId,
        facetById,
        targetFacetId: realSessionFacetId,
        optionTokenBySessionCode: sessionOptionTokenBySessionCode,
        optionLabelBySessionCode: sessionOptionLabelBySessionCode,
    });

    const normalizedSubmissions = buildNormalizedSubmissions({
        submissions: unscoredSubmissions,
        facetById,
        facetTokensBySubmissionId,
        displayFacetsBySubmissionId,
        trackNameById,
        tableBySubmissionId,
        scoreCountBySubmissionId,
        isBeingScoredBySubmissionId,
    });

    const filterFacets = buildFilterFacets({
        submissions: unscoredSubmissions,
        facetById,
        displayFacetsBySubmissionId,
        judgeDefaultFiltersByFacetId: defaultFiltersMap,
        allFacetOptionRows,
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
