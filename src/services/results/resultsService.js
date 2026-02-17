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
    buildCategoryRankings,
    buildCriterionCategoryById,
    buildEmptyResultsReport,
    buildFacetMaps,
    buildFilterFacets,
    buildNormalizedSubmissions,
    buildOverallRankings,
    buildSheetTotals,
    buildSubmissionAggregate,
    collectFacetAndOptionIds,
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

    // Build score totals from criterion categories.
    const criterionIds = [...new Set(scoreItems.map((item) => item.criterion_id).filter(Boolean))];
    const criteria = await fetchRubricCriteria(criterionIds);
    const criterionCategoryById = buildCriterionCategoryById(criteria);
    const { sheetTotalById, sheetCategoryTotalsById } = buildSheetTotals(scoreItems, criterionCategoryById);

    const aggregateBySubmissionId = buildSubmissionAggregate(
        submissionRows,
        scoreSheetRows,
        sheetTotalById,
        sheetCategoryTotalsById
    );

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

    // Build final rankings and response payload.
    const normalizedSubmissions = buildNormalizedSubmissions(
        aggregateBySubmissionId,
        facetTokensBySubmissionId,
        displayFacetsBySubmissionId
    );
    const overallRankings = buildOverallRankings(normalizedSubmissions);
    const { categories, categoryRankingsByCategory } = buildCategoryRankings(normalizedSubmissions);
    const filterFacets = buildFilterFacets(filterOptionsByFacetId, facetById);

    return {
        submissions: normalizedSubmissions,
        overallRankings,
        categoryRankingsByCategory,
        categories,
        filterFacets,
        defaultSelectedFiltersByFacetId: {},
    };
}
