// Pure helpers for rubric normalization, scoring metadata, and mapping.
//
// Responsibilities:
// - Convert form-shaped criterion data into DB payloads.
// - Compute rubric max score from criterion configuration.
// - Map DB rows into UI-facing rubric objects.

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getCriterionMaxPoints(criterion) {
    const weight = toNumber(criterion.weight, 0);

    if (criterion.answerType === "true_false") {
        const truePoints = toNumber(criterion.answerConfig?.truePoints, 1);
        return truePoints * weight;
    }

    if (criterion.answerType === "dropdown") {
        const optionMax = Math.max(
            0,
            ...(criterion.answerConfig?.options ?? []).map((option) => toNumber(option.points, 0))
        );
        return optionMax * weight;
    }

    return toNumber(criterion.scoreMax, 0) * weight;
}

export function computeRubricMaxPoints(criteria) {
    return (criteria ?? []).reduce((sum, criterion) => sum + getCriterionMaxPoints(criterion), 0);
}

export function normalizeCriteriaPayload(rubricId, criteria) {
    return (criteria ?? []).map((criterion, index) => ({
        rubric_id: rubricId,
        name: criterion.name,
        description: criterion.description || null,
        criterion_category: criterion.category,
        answer_type: criterion.answerType,
        answer_config_json: criterion.answerConfig ?? null,
        weight: criterion.weight,
        score_min: criterion.scoreMin,
        score_max: criterion.scoreMax,
        display_order: index + 1,
    }));
}

export function mapTrackRubrics(trackRubrics, rubrics, criteria) {
    const rubricById = new Map((rubrics ?? []).map((rubric) => [rubric.rubric_id, rubric]));
    const criteriaByRubricId = new Map();

    for (const criterion of criteria ?? []) {
        const current = criteriaByRubricId.get(criterion.rubric_id) ?? [];
        current.push({
            id: criterion.criterion_id,
            name: criterion.name,
            description: criterion.description ?? "",
            category: criterion.criterion_category ?? "abstract",
            answerType: criterion.answer_type,
            answerConfig: criterion.answer_config_json ?? null,
            weight: criterion.weight,
            scoreMin: criterion.score_min,
            scoreMax: criterion.score_max,
            displayOrder: criterion.display_order,
        });
        criteriaByRubricId.set(criterion.rubric_id, current);
    }

    return (trackRubrics ?? [])
        .map((trackRubric) => {
            const rubric = rubricById.get(trackRubric.rubric_id);
            if (!rubric) return null;

            return {
                trackRubricId: trackRubric.track_rubric_id,
                trackId: trackRubric.track_id,
                rubricId: rubric.rubric_id,
                name: rubric.name,
                description: rubric.description ?? "",
                version: rubric.version,
                maxTotalPoints: rubric.max_total_points,
                isActive: rubric.is_active,
                isDefault: Boolean(trackRubric.is_default),
                createdAt: rubric.created_at,
                criteria: criteriaByRubricId.get(rubric.rubric_id) ?? [],
            };
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0));
}
