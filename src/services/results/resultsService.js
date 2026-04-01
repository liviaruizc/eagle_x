// Track results service facade.
//
// Responsibilities:
// - Expose stable report/filter functions for results pages.
// - Orchestrate data retrieval and aggregation using focused helper modules.
//
// Notes:
// - Keep this file lean; heavy transforms belong in `resultsUtils`.
// - Keep raw Supabase reads in `resultsApi`.

import {
    fetchFacetOptionsByIds,
    fetchFacetsByIds,
    fetchRubricCriteria,
    fetchScoreItems,
    fetchSubmissionFacetValues,
    fetchSubmittedScoreSheets,
    fetchTrackSubmissions,
} from "./resultsApi.js";
import {
    buildEmptyResultsReport,
    buildFacetMaps,
    buildFilterFacets,
    collectFacetAndOptionIds,
    computePhaseRankings,
    filterTrackResults,
} from "./resultsUtils.js";

export { filterTrackResults };

export async function fetchTrackResultsReport(trackId) {
    const submissionRows = await fetchTrackSubmissions(trackId);
    if (!submissionRows.length) return buildEmptyResultsReport();

    // Pull score data for the track submissions.
    const submissionIds = submissionRows.map((submission) => submission.submission_id);
    const scoreSheetRows = await fetchSubmittedScoreSheets(submissionIds);
    const scoreSheetIds = scoreSheetRows.map((scoreSheet) => scoreSheet.score_sheet_id);
    const scoreItems = await fetchScoreItems(scoreSheetIds);

    // Fetch criteria with scoring_phase for phase-aware ranking.
    const criterionIds = [...new Set(scoreItems.map((item) => item.criterion_id).filter(Boolean))];
    const criteria = await fetchRubricCriteria(criterionIds);

    // Attach facet metadata for filtering and segmented views.
    const submissionFacetRows = await fetchSubmissionFacetValues(submissionIds);
    const { facetIds, facetOptionIds } = collectFacetAndOptionIds(submissionFacetRows);

    const [facets, facetOptions] = await Promise.all([
        fetchFacetsByIds(facetIds),
        fetchFacetOptionsByIds(facetOptionIds),
    ]);

    const facetById = new Map(facets.map((facet) => [facet.facet_id, facet]));
    const optionById = new Map(facetOptions.map((option) => [option.facet_option_id, option]));

    const { facetTokensBySubmissionId, displayFacetsBySubmissionId, filterOptionsByFacetId } =
        buildFacetMaps(submissionFacetRows, facetById, optionById);

    const phaseArgs = { scoreItems, criteria, scoreSheetRows, submissionRows, facetTokensBySubmissionId, displayFacetsBySubmissionId };
    const rankingsByPhase = {
        all: computePhaseRankings("all", phaseArgs),
        pre_scoring: computePhaseRankings("pre_scoring", phaseArgs),
        event_scoring: computePhaseRankings("event_scoring", phaseArgs),
    };

    // Use "all" phase submissions for facet filter counts.
    const { overallRankings } = rankingsByPhase.all;
    const submissionsForFilter = overallRankings.map((r) => ({
        submissionId: r.submissionId,
        facetTokensByFacetId: facetTokensBySubmissionId.get(r.submissionId) ?? {},
    }));
    const filterFacets = buildFilterFacets(filterOptionsByFacetId, facetById);

    return {
        submissions: submissionsForFilter,
        rankingsByPhase,
        filterFacets,
        defaultSelectedFiltersByFacetId: {},
    };
}
