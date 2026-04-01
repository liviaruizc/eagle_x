// Pure transformation and ranking helpers for track results.
//
// Responsibilities:
// - Aggregate sheet/item rows into per-submission metrics.
// - Build category/overall rankings and facet-driven filter metadata.
// - Keep business transforms side-effect free and reusable.

const EMPTY_PHASE_RANKINGS = { overallRankings: [], categoryRankingsByCategory: {}, categories: [] };

export function buildEmptyResultsReport() {
    return {
        submissions: [],
        rankingsByPhase: { all: EMPTY_PHASE_RANKINGS, pre_scoring: EMPTY_PHASE_RANKINGS, event_scoring: EMPTY_PHASE_RANKINGS },
        filterFacets: [],
        defaultSelectedFiltersByFacetId: {},
    };
}

export function filterCriteriaByPhase(criteria, phase) {
    if (!phase || phase === "all") return criteria;
    return (criteria ?? []).filter(
        (c) => c.scoring_phase === phase || c.scoring_phase === "both"
    );
}

export function computePhaseRankings(phase, { scoreItems, criteria, scoreSheetRows, submissionRows, facetTokensBySubmissionId, displayFacetsBySubmissionId }) {
    const phaseCriteria = filterCriteriaByPhase(criteria, phase);
    const criterionCategoryById = buildCriterionCategoryById(phaseCriteria);
    const { sheetTotalById, sheetCategoryTotalsById } = buildSheetTotals(scoreItems, criterionCategoryById);
    const aggregateBySubmissionId = buildSubmissionAggregate(submissionRows, scoreSheetRows, sheetTotalById, sheetCategoryTotalsById);
    const normalizedSubs = buildNormalizedSubmissions(aggregateBySubmissionId, facetTokensBySubmissionId, displayFacetsBySubmissionId);
    const overallRankings = buildOverallRankings(normalizedSubs);
    const { categories, categoryRankingsByCategory } = buildCategoryRankings(normalizedSubs);
    return { overallRankings, categoryRankingsByCategory, categories };
}

function average(values) {
    if (!values.length) return null;
    const sum = values.reduce((acc, value) => acc + Number(value || 0), 0);
    return sum / values.length;
}

function sortByScoreDesc(rows, scoreKey) {
    return [...rows].sort((a, b) => {
        const scoreA = a?.[scoreKey];
        const scoreB = b?.[scoreKey];

        if (scoreA == null && scoreB == null) return 0;
        if (scoreA == null) return 1;
        if (scoreB == null) return -1;
        return scoreB - scoreA;
    });
}

function rankRows(rows, scoreKey) {
    let rank = 1;
    let previousScore = null;

    return rows.map((row, index) => {
        const score = row?.[scoreKey];

        if (score == null) {
            return {
                ...row,
                rank: null,
            };
        }

        if (previousScore != null && score !== previousScore) {
            rank = index + 1;
        }

        previousScore = score;

        return {
            ...row,
            rank,
        };
    });
}

function facetToken(row) {
    if (row?.facet_option_id) return String(row.facet_option_id);
    if (row?.value_text) return `text:${row.value_text}`;
    if (row?.value_number != null) return `number:${row.value_number}`;
    if (row?.value_date) return `date:${row.value_date}`;
    return null;
}

function facetLabel(row, optionById) {
    if (row?.facet_option_id) {
        const option = optionById.get(row.facet_option_id);
        return option?.label || option?.value || String(row.facet_option_id);
    }

    if (row?.value_text) return row.value_text;
    if (row?.value_number != null) return String(row.value_number);
    if (row?.value_date) return row.value_date;
    return "Unknown";
}

function toUnique(values) {
    return [...new Set((values ?? []).filter(Boolean))];
}

export function filterTrackResults(submissions, selectedFiltersByFacetId) {
    return submissions.filter((submission) => {
        const facetTokensByFacetId = submission.facetTokensByFacetId ?? {};

        for (const [facetId, selectedToken] of Object.entries(selectedFiltersByFacetId ?? {})) {
            if (!selectedToken) continue;

            const tokens = facetTokensByFacetId[facetId] ?? [];
            if (!tokens.includes(selectedToken)) {
                return false;
            }
        }

        return true;
    });
}

export function buildCriterionCategoryById(criteria) {
    return new Map(
        (criteria ?? []).map((criterion) => [
            criterion.criterion_id,
            criterion.criterion_category || "uncategorized",
        ])
    );
}

export function buildSheetTotals(scoreItems, criterionCategoryById) {
    const sheetTotalById = new Map();
    const sheetCategoryTotalsById = new Map();

    for (const item of scoreItems ?? []) {
        const category = criterionCategoryById.get(item.criterion_id);
        if (!category) continue; // skip items whose criterion is not in the active phase

        const sheetId = item.score_sheet_id;
        const points = Number(item.score_value || 0);

        sheetTotalById.set(sheetId, (sheetTotalById.get(sheetId) ?? 0) + points);

        const categoryTotals = sheetCategoryTotalsById.get(sheetId) ?? new Map();
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + points);
        sheetCategoryTotalsById.set(sheetId, categoryTotals);
    }

    return { sheetTotalById, sheetCategoryTotalsById };
}

export function buildSubmissionAggregate(submissionRows, scoreSheetRows, sheetTotalById, sheetCategoryTotalsById) {
    const aggregateBySubmissionId = new Map(
        (submissionRows ?? []).map((submission) => [
            submission.submission_id,
            {
                submissionId: submission.submission_id,
                title: submission.title ?? "Untitled Submission",
                status: submission.status,
                createdAt: submission.created_at,
                judgeIds: new Set(),
                sheetTotals: [],
                categorySheetTotals: new Map(),
            },
        ])
    );

    for (const sheet of scoreSheetRows ?? []) {
        const aggregate = aggregateBySubmissionId.get(sheet.submission_id);
        if (!aggregate) continue;

        if (sheet.judge_person_id) {
            aggregate.judgeIds.add(sheet.judge_person_id);
        }

        const sheetTotal = sheetTotalById.get(sheet.score_sheet_id);
        if (sheetTotal != null) {
            aggregate.sheetTotals.push(sheetTotal);
        }

        const categoryTotals = sheetCategoryTotalsById.get(sheet.score_sheet_id) ?? new Map();
        categoryTotals.forEach((value, category) => {
            const current = aggregate.categorySheetTotals.get(category) ?? [];
            current.push(value);
            aggregate.categorySheetTotals.set(category, current);
        });
    }

    return aggregateBySubmissionId;
}

export function buildFacetMaps(submissionFacetRows, facetById, optionById) {
    const facetTokensBySubmissionId = new Map();
    const displayFacetsBySubmissionId = new Map();
    const filterOptionsByFacetId = new Map();

    for (const row of submissionFacetRows ?? []) {
        const token = facetToken(row);
        if (!token) continue;

        if (!facetTokensBySubmissionId.has(row.submission_id)) {
            facetTokensBySubmissionId.set(row.submission_id, {});
        }

        const submissionFacetTokens = facetTokensBySubmissionId.get(row.submission_id);
        const currentTokens = submissionFacetTokens[row.facet_id] ?? [];
        if (!currentTokens.includes(token)) {
            currentTokens.push(token);
            submissionFacetTokens[row.facet_id] = currentTokens;
        }

        if (!displayFacetsBySubmissionId.has(row.submission_id)) {
            displayFacetsBySubmissionId.set(row.submission_id, []);
        }

        const label = facetLabel(row, optionById);
        const meta = facetById.get(row.facet_id);
        const displayList = displayFacetsBySubmissionId.get(row.submission_id);

        if (!displayList.some((item) => item.facetId === row.facet_id && item.token === token)) {
            displayList.push({
                facetId: row.facet_id,
                code: meta?.code ?? "",
                name: meta?.name ?? "",
                label,
                token,
            });
        }

        const facetOptionMap = filterOptionsByFacetId.get(row.facet_id) ?? new Map();
        const existing = facetOptionMap.get(token);
        facetOptionMap.set(token, {
            token,
            label,
            count: (existing?.count ?? 0) + 1,
        });
        filterOptionsByFacetId.set(row.facet_id, facetOptionMap);
    }

    return { facetTokensBySubmissionId, displayFacetsBySubmissionId, filterOptionsByFacetId };
}

export function buildNormalizedSubmissions(aggregateBySubmissionId, facetTokensBySubmissionId, displayFacetsBySubmissionId) {
    return [...aggregateBySubmissionId.values()].map((aggregate) => {
        const scoreCount = aggregate.sheetTotals.length;
        const sumScore = aggregate.sheetTotals.reduce((s, v) => s + v, 0);
        const avgScore = average(aggregate.sheetTotals);

        const categoryScores = {};
        const categorySums = {};
        const categoryCounts = {};
        aggregate.categorySheetTotals.forEach((categoryValues, category) => {
            categoryScores[category] = average(categoryValues);
            categorySums[category] = categoryValues.reduce((s, v) => s + v, 0);
            categoryCounts[category] = categoryValues.length;
        });

        return {
            submissionId: aggregate.submissionId,
            title: aggregate.title,
            status: aggregate.status,
            createdAt: aggregate.createdAt,
            scoreCount,
            sumScore,
            totalScore: avgScore,
            categoryScores,
            categorySums,
            categoryCounts,
            facetTokensByFacetId: facetTokensBySubmissionId.get(aggregate.submissionId) ?? {},
            facets: displayFacetsBySubmissionId.get(aggregate.submissionId) ?? [],
        };
    });
}

export function buildOverallRankings(normalizedSubmissions) {
    const scored = normalizedSubmissions.filter((s) => s.scoreCount > 0);
    return rankRows(sortByScoreDesc(scored, "totalScore"), "totalScore");
}

export function buildCategoryRankings(normalizedSubmissions) {
    const categories = toUnique(
        normalizedSubmissions.flatMap((submission) => Object.keys(submission.categoryScores || {}))
    ).sort((a, b) => a.localeCompare(b));

    const categoryRankingsByCategory = {};

    for (const category of categories) {
        const rows = normalizedSubmissions
            .filter((submission) => submission.scoreCount > 0)
            .map((submission) => ({
                ...submission,
                categoryScore: submission.categoryScores?.[category] ?? null,
                categorySum: submission.categorySums?.[category] ?? null,
                categoryCount: submission.categoryCounts?.[category] ?? 0,
            }));

        categoryRankingsByCategory[category] = rankRows(
            sortByScoreDesc(rows, "categoryScore"),
            "categoryScore"
        );
    }

    return { categories, categoryRankingsByCategory };
}

export function buildFilterFacets(filterOptionsByFacetId, facetById) {
    return [...filterOptionsByFacetId.entries()]
        .map(([facetId, optionMap]) => {
            const facetMeta = facetById.get(facetId);

            return {
                facetId,
                code: facetMeta?.code ?? "",
                name: facetMeta?.name ?? "",
                options: [...optionMap.values()].sort((a, b) => a.label.localeCompare(b.label)),
            };
        })
        .sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));
}

export function collectFacetAndOptionIds(submissionFacetRows) {
    return {
        facetIds: toUnique((submissionFacetRows ?? []).map((row) => row.facet_id)),
        facetOptionIds: toUnique((submissionFacetRows ?? []).map((row) => row.facet_option_id)),
    };
}
