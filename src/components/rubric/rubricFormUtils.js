// Canonical category options shown in rubric create/edit forms.
// These values are persisted as `criterion_category` and should stay stable
// once used in stored rubric criteria.
export const CRITERION_CATEGORY_OPTIONS = [
    { value: "abstract", label: "Abstract / Introduction" },
    { value: "methodology", label: "Methodology / Approach" },
    { value: "results", label: "Results / Conclusion / Discussion" },
    { value: "presentation", label: "Presentation / Organization" },
    { value: "significance", label: "Significance / Importance" },
    { value: "understanding", label: "Understanding & Professionalism" },
];

// Shared defaults to keep fallback values consistent across helpers.
const DEFAULT_ANSWER_TYPE = "numeric_scale";
const DEFAULT_CATEGORY = "abstract";
const DEFAULT_VERSION = 1;
const DEFAULT_WEIGHT = 1;
const DEFAULT_SCORE_MIN = 0;
const DEFAULT_SCORE_MAX = 5;
const EMPTY_DROPDOWN_OPTION = { label: "", points: 0 };

// Helper to always provide at least one dropdown option row in form state.
function ensureAtLeastOneDropdownOption(options) {
    return options.length ? options : [{ ...EMPTY_DROPDOWN_OPTION }];
}

// Safe numeric coercion helper used throughout form normalization.
// Returns `fallback` when value is empty/invalid/non-finite.
export function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

// Returns the default criterion model used when adding a new criterion row.
// This object shape matches what `TrackRubricForm` expects in local UI state.
export function emptyCriterion() {
    return {
        name: "",
        description: "",
        category: DEFAULT_CATEGORY,
        answerType: DEFAULT_ANSWER_TYPE,
        dropdownOptions: [{ ...EMPTY_DROPDOWN_OPTION }],
        weight: DEFAULT_WEIGHT,
        scoreMin: DEFAULT_SCORE_MIN,
        scoreMax: DEFAULT_SCORE_MAX,
    };
}

// Converts one persisted criterion object into form-friendly shape.
// Handles legacy/missing fields and ensures dropdown options are always present.
//
// Input (example):
// {
//   name, description, category, answerType, answerConfig, weight, scoreMin, scoreMax
// }
//
// Output:
// UI-safe criterion object with normalized numeric defaults and options array.
export function toFormCriterion(criterion) {
    const answerType = criterion.answerType ?? DEFAULT_ANSWER_TYPE;
    const dropdownOptions = Array.isArray(criterion.answerConfig?.options)
        ? criterion.answerConfig.options.map((option) => ({
            label: option.label ?? "",
            points: toNumber(option.points, 0),
        }))
        : [];

    return {
        name: criterion.name ?? "",
        description: criterion.description ?? "",
        category: criterion.category ?? DEFAULT_CATEGORY,
        answerType,
        dropdownOptions: ensureAtLeastOneDropdownOption(dropdownOptions),
        weight: toNumber(criterion.weight, DEFAULT_WEIGHT),
        scoreMin: toNumber(criterion.scoreMin, DEFAULT_SCORE_MIN),
        scoreMax: toNumber(criterion.scoreMax, DEFAULT_SCORE_MAX),
    };
}

// Builds initial rubric form state for create/edit modes.
// - Create mode (`initialRubric` missing): empty defaults
// - Edit mode (`initialRubric` present): maps rubric + criteria into form state
export function buildFormState(initialRubric) {
    if (!initialRubric) {
        return {
            formData: {
                name: "",
                description: "",
                version: DEFAULT_VERSION,
                isDefault: true,
            },
            criteria: [emptyCriterion()],
        };
    }

    return {
        formData: {
            name: initialRubric.name ?? "",
            description: initialRubric.description ?? "",
            version: toNumber(initialRubric.version, DEFAULT_VERSION),
            isDefault: Boolean(initialRubric.isDefault),
        },
        criteria: (initialRubric.criteria ?? []).map(toFormCriterion),
    };
}

// Normalizes UI criteria into payload-ready criteria.
// This is the primary transformation before sending data to service layer.
//
// Key rules:
// - Dropdown options are trimmed and empty labels removed.
// - `answerConfig` varies by answer type:
//   - true_false: fixed true/false labels and points
//   - dropdown: explicit options array
//   - numeric_scale: null config
// - `scoreMin/scoreMax` only apply to numeric scale, otherwise forced to 0.
export function normalizeCriteria(criteria) {
    return criteria.map((criterion) => {
        const normalizedAnswerType = criterion.answerType;
        const dropdownOptions = (criterion.dropdownOptions ?? [])
            .map((option) => ({
                label: String(option.label || "").trim(),
                points: toNumber(option.points, 0),
            }))
            .filter((option) => option.label.length > 0);

        let answerConfig = null;
        if (normalizedAnswerType === "true_false") {
            answerConfig = {
                trueLabel: "True",
                falseLabel: "False",
                truePoints: 1,
                falsePoints: 0,
            };
        }

        if (normalizedAnswerType === "dropdown") {
            answerConfig = {
                options: dropdownOptions,
            };
        }

        const resolvedScoreMin =
            normalizedAnswerType === "numeric_scale"
                ? toNumber(criterion.scoreMin, DEFAULT_SCORE_MIN)
                : DEFAULT_SCORE_MIN;
        const resolvedScoreMax =
            normalizedAnswerType === "numeric_scale"
                ? toNumber(criterion.scoreMax, DEFAULT_SCORE_MAX)
                : DEFAULT_SCORE_MAX;

        return {
            name: criterion.name.trim(),
            description: criterion.description.trim(),
            category: criterion.category,
            answerType: normalizedAnswerType,
            answerConfig,
            weight: toNumber(criterion.weight, 0),
            scoreMin: resolvedScoreMin,
            scoreMax: resolvedScoreMax,
        };
    });
}

// Validation helper: at least one dropdown option is required
// for criteria using `answerType = dropdown`.
export function hasDropdownWithoutOptions(criteria) {
    return criteria.some(
        (criterion) => criterion.answerType === "dropdown" && !(criterion.answerConfig?.options?.length)
    );
}

// Validation helper: numeric range boundaries must be valid.
export function hasInvalidScoreRange(criteria) {
    return criteria.some((criterion) => criterion.scoreMin > criterion.scoreMax);
}

// Computes max points for a single criterion after weight is applied.
//
// By answer type:
// - true_false: uses `truePoints * weight`
// - dropdown: uses the highest option points * weight
// - numeric_scale: uses `scoreMax * weight`
export function computeCriterionMaxPoints(criterion) {
    const weight = toNumber(criterion.weight, 0);

    switch (criterion.answerType) {
    case "true_false": {
        const truePoints = toNumber(criterion.answerConfig?.truePoints, 1);
        return truePoints * weight;
    }
    case "dropdown": {
        const options = criterion.dropdownOptions ?? criterion.answerConfig?.options ?? [];
        const optionMax = Math.max(0, ...options.map((option) => toNumber(option.points, 0)));
        return optionMax * weight;
    }
    default:
        return toNumber(criterion.scoreMax, 0) * weight;
    }
}

// Computes rubric maximum total points as sum of each criterion max points.
// Used for user feedback in form and for persisted rubric metadata.
export function computeRubricMaxTotalPoints(criteria) {
    return criteria.reduce((sum, criterion) => sum + computeCriterionMaxPoints(criterion), 0);
}
