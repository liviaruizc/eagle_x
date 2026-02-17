// Queue service for judge scoring workflow.
//
// Responsibilities:
// - Load submissions that are eligible for a judge in an event instance.
// - Exclude submissions already scored by the judge and conflict-of-interest submissions.
// - Build facet-driven filter metadata, default judge filters, and filtered queue results.
// - Provide reusable queue filtering for UI interactions.
//
// Notes:
// - This module orchestrates sync + query + normalization for queue pages.
// - Helper functions in this file are intentionally pure where possible.
import { syncEventAndSubmissionStatusesBySchedule } from "../statusSync/statusSyncService.js";
import {
    fetchEligibleSubmissionsByTracks,
    fetchFacetOptionsByIds,
    fetchFacetsByIds,
    fetchJudgeFacetValuesForEvent,
    fetchQueueStatusSubmissions,
    fetchScoredSubmissionRows,
    fetchSubmissionFacetValues,
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

/**
 * Returns the next available submission for a judge.
 * A submission is eligible when status is available and judge has not scored it yet.
 */

export async function pullNext(judgeId) {
    await syncEventAndSubmissionStatusesBySchedule();

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

export async function fetchQueueSubmissionsForJudge({ judgePersonId, eventInstanceId }) {
    if (!judgePersonId) {
        throw new Error("Judge person id is required.");
    }

    if (!eventInstanceId) {
        throw new Error("Event instance id is required.");
    }

    await syncEventAndSubmissionStatusesBySchedule();

    const tracks = await fetchTracksByEventInstance(eventInstanceId);
    if (!tracks.length) return buildEmptyQueueResult();

    const trackIds = tracks.map((track) => track.track_id);
    const trackNameById = new Map(tracks.map((track) => [track.track_id, track.name ?? "Track"]));

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
    const [submissionFacetValues, judgeFacetValues] = await Promise.all([
        fetchSubmissionFacetValues(eligibleSubmissionIds),
        fetchJudgeFacetValuesForEvent({ judgePersonId, eventInstanceId }),
    ]);

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
    const defaultSelectedTokensByFacetId = buildDefaultSelectedTokensByFacetId(defaultFiltersMap);

    const { facetTokensBySubmissionId, displayFacetsBySubmissionId } = buildSubmissionFacetMaps(
        submissionFacetValues ?? [],
        optionById
    );

    const normalizedSubmissions = buildNormalizedSubmissions({
        submissions: unscoredSubmissions,
        facetById,
        facetTokensBySubmissionId,
        displayFacetsBySubmissionId,
        trackNameById,
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