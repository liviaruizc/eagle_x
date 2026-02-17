// Pure normalization and transform helpers for submission import/create.
//
// Responsibilities:
// - Normalize submission status/payload fields.
// - Build and merge facet-value payload structures.
// - Map imported College/Degree/Level/Program columns into facet values.

const VALID_SUBMISSION_STATUSES = new Set([
    "submitted",
    "pre_scoring",
    "pre_scored",
    "event_scoring",
    "done",
]);

export function normalizeSubmissionStatus(statusValue) {
    const normalized = String(statusValue || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (!normalized) return "submitted";
    if (VALID_SUBMISSION_STATUSES.has(normalized)) return normalized;

    if (normalized === "prescoring") return "pre_scoring";
    if (normalized === "prescored") return "pre_scored";
    if (normalized === "eventscoring") return "event_scoring";

    return "submitted";
}

export function normalizeSubmissionPayload(trackId, submission) {
    return {
        track_id: trackId,
        title: submission.title,
        description: submission.description || null,
        keywords: submission.keywords || null,
        supervisor_person_id: submission.supervisor_person_id || null,
        status: normalizeSubmissionStatus(submission.status),
        submitted_at: submission.submitted_at || new Date().toISOString(),
    };
}

export function normalizeFacetValuePayload(submissionId, facetValue) {
    const valueKind = String(facetValue.value_kind || "text").toLowerCase();

    const payload = {
        submission_id: submissionId,
        facet_id: facetValue.facet_id,
        facet_option_id: facetValue.facet_option_id || null,
        value_text: null,
        value_number: null,
        value_date: null,
    };

    if (valueKind === "number") {
        payload.value_number = facetValue.value_number ?? null;
    } else if (valueKind === "date") {
        payload.value_date = facetValue.value_date || null;
    } else {
        payload.value_text = facetValue.value_text || null;
    }

    return payload;
}

function normalizeCompareValue(value) {
    return String(value || "").trim().toLowerCase();
}

function getImportedFacetColumnValues(submission) {
    return {
        college: String(submission.college || "").trim(),
        degree: String(submission.degree || "").trim(),
        level: String(submission.level || "").trim(),
        program: String(submission.program || "").trim(),
    };
}

function findFacetByKey(trackFacets, key) {
    const normalizedKey = normalizeCompareValue(key);

    return (
        trackFacets.find((facet) => {
            const code = normalizeCompareValue(facet.code);
            const name = normalizeCompareValue(facet.name);

            return code === normalizedKey || name === normalizedKey;
        }) ?? null
    );
}

function findBestFacetOption(facet, rawValue, selectedCollegeOptionId) {
    const normalizedRawValue = normalizeCompareValue(rawValue);
    const options = facet.options ?? [];
    const hasParentedOptions = options.some((option) => option.parent_option_id);

    let candidateOptions = options;

    if (hasParentedOptions && selectedCollegeOptionId) {
        const filteredByParent = options.filter(
            (option) => String(option.parent_option_id || "") === String(selectedCollegeOptionId)
        );

        if (filteredByParent.length) {
            candidateOptions = filteredByParent;
        }
    }

    return (
        candidateOptions.find((option) => normalizeCompareValue(option.label) === normalizedRawValue) ??
        candidateOptions.find((option) => normalizeCompareValue(option.value) === normalizedRawValue) ??
        null
    );
}

function buildFacetValueFromImport({ facet, rawValue, selectedCollegeOptionId }) {
    const option = findBestFacetOption(facet, rawValue, selectedCollegeOptionId);

    return {
        facet_id: facet.facetId,
        facet_option_id: option?.facet_option_id ?? null,
        value_kind: facet.valueKind,
        value_text: option?.label ?? option?.value ?? rawValue,
        value_number: null,
        value_date: null,
    };
}

export function mergeFacetValues(existingFacetValues, importedFacetValues) {
    const mergedByFacetId = new Map();

    [...(existingFacetValues ?? []), ...(importedFacetValues ?? [])].forEach((value) => {
        if (!value?.facet_id) return;
        mergedByFacetId.set(value.facet_id, value);
    });

    return [...mergedByFacetId.values()];
}

export function buildImportedFacetValues(trackFacets, submission) {
    const columnValues = getImportedFacetColumnValues(submission);
    const facetsByKey = {
        college: findFacetByKey(trackFacets, "college"),
        degree: findFacetByKey(trackFacets, "degree"),
        level: findFacetByKey(trackFacets, "level"),
        program: findFacetByKey(trackFacets, "program"),
    };

    const importedFacetValues = [];

    let selectedCollegeOptionId = null;

    if (columnValues.college && facetsByKey.college) {
        const collegeValue = buildFacetValueFromImport({
            facet: facetsByKey.college,
            rawValue: columnValues.college,
            selectedCollegeOptionId: null,
        });

        importedFacetValues.push(collegeValue);
        selectedCollegeOptionId = collegeValue.facet_option_id;
    }

    if (columnValues.degree && facetsByKey.degree) {
        importedFacetValues.push(
            buildFacetValueFromImport({
                facet: facetsByKey.degree,
                rawValue: columnValues.degree,
                selectedCollegeOptionId,
            })
        );
    }

    if (columnValues.level && facetsByKey.level) {
        importedFacetValues.push(
            buildFacetValueFromImport({
                facet: facetsByKey.level,
                rawValue: columnValues.level,
                selectedCollegeOptionId,
            })
        );
    }

    if (columnValues.program && facetsByKey.program) {
        importedFacetValues.push(
            buildFacetValueFromImport({
                facet: facetsByKey.program,
                rawValue: columnValues.program,
                selectedCollegeOptionId,
            })
        );
    }

    return importedFacetValues;
}
