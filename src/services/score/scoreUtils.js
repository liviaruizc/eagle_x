// Pure scoring helpers shared by score service workflows.
//
// Responsibilities:
// - Normalize rubric criterion rows.
// - Compute weighted criterion/total scores.
// - Validate that required responses are present.

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveTrackRubric(trackRubrics) {
    if (!trackRubrics?.length) return null;
    const defaultRubric = trackRubrics.find((item) => item.is_default);
    return defaultRubric ?? trackRubrics[0];
}

export function normalizeCriterion(criterion) {
    return {
        id: criterion.criterion_id,
        name: criterion.name,
        description: criterion.description ?? "",
        category: criterion.criterion_category ?? "abstract",
        answerType: criterion.answer_type,
        answerConfig: criterion.answer_config_json ?? null,
        weight: toNumber(criterion.weight, 1),
        scoreMin: toNumber(criterion.score_min, 0),
        scoreMax: toNumber(criterion.score_max, 5),
        displayOrder: criterion.display_order,
    };
}

export function computeCriterionScore(criterion, rawAnswer) {
    const weight = toNumber(criterion.weight, 1);

    if (criterion.answerType === "true_false") {
        const truePoints = toNumber(criterion.answerConfig?.truePoints, 1);
        const falsePoints = toNumber(criterion.answerConfig?.falsePoints, 0);
        const isTrue = rawAnswer === true || rawAnswer === "true";
        return (isTrue ? truePoints : falsePoints) * weight;
    }

    if (criterion.answerType === "dropdown") {
        return toNumber(rawAnswer, 0) * weight;
    }

    return toNumber(rawAnswer, 0) * weight;
}

export function validateCriterionResponses(criteria, responsesByCriterionId) {
    const missing = (criteria ?? [])
        .filter((criterion) => {
            const response = responsesByCriterionId?.[criterion.id];
            return response == null || response.value === "" || response.value == null;
        })
        .map((criterion) => criterion.id);

    return {
        ok: missing.length === 0,
        missing,
    };
}

export function calculateScoreTotal(criteria, responsesByCriterionId) {
    return (criteria ?? []).reduce((sum, criterion) => {
        const response = responsesByCriterionId?.[criterion.id];
        if (!response) return sum;
        return sum + computeCriterionScore(criterion, response.value);
    }, 0);
}

export function mapScoreItemsToResponses(scoreItems) {
    return (scoreItems ?? []).reduce((acc, item) => {
        acc[item.criterion_id] = {
            value: item.score_value,
            comment: item.comment ?? "",
        };
        return acc;
    }, {});
}
