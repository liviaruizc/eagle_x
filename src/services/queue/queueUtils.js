export function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value || "")
    );
}

export function buildEmptyQueueResult() {
    return {
        submissions: [],
        filteredSubmissions: [],
        filterFacets: [],
        defaultSelectedTokensByFacetId: {},
    };
}

function buildFacetToken(valueRow) {
    if (valueRow?.facet_option_id) return String(valueRow.facet_option_id);
    if (valueRow?.value_text) return `text:${valueRow.value_text}`;
    if (valueRow?.value_number != null) return `number:${valueRow.value_number}`;
    if (valueRow?.value_date) return `date:${valueRow.value_date}`;
    return null;
}

function buildFacetDisplayLabel(valueRow, optionById) {
    if (valueRow?.facet_option_id) {
        const option = optionById.get(valueRow.facet_option_id);
        return option?.label || option?.value || String(valueRow.facet_option_id);
    }

    if (valueRow?.value_text) return valueRow.value_text;
    if (valueRow?.value_number != null) return String(valueRow.value_number);
    if (valueRow?.value_date) return valueRow.value_date;
    return "Unknown";
}

export function buildSelectedFiltersMap(judgeFacetValues, optionById) {
    const selectedFiltersByFacetId = {};

    for (const valueRow of judgeFacetValues) {
        const token = buildFacetToken(valueRow);
        if (!token) continue;

        const facetId = valueRow.facet_id;
        const current = selectedFiltersByFacetId[facetId] ?? [];
        const label = buildFacetDisplayLabel(valueRow, optionById);

        if (!current.some((item) => item.token === token)) {
            current.push({ token, label });
            selectedFiltersByFacetId[facetId] = current;
        }
    }

    return selectedFiltersByFacetId;
}

export function buildDefaultSelectedTokensByFacetId(selectedFiltersByFacetId) {
    return Object.fromEntries(
        Object.entries(selectedFiltersByFacetId).map(([facetId, items]) => [
            facetId,
            items.map((item) => item.token),
        ])
    );
}

export function buildSubmissionFacetMaps(submissionFacetValues, optionById) {
    const facetTokensBySubmissionId = new Map();
    const displayFacetsBySubmissionId = new Map();

    for (const row of submissionFacetValues) {
        const submissionId = row.submission_id;
        const facetId = row.facet_id;
        const token = buildFacetToken(row);
        if (!token) continue;

        if (!facetTokensBySubmissionId.has(submissionId)) {
            facetTokensBySubmissionId.set(submissionId, new Map());
        }

        const facetMap = facetTokensBySubmissionId.get(submissionId);
        const tokenSet = facetMap.get(facetId) ?? new Set();
        tokenSet.add(token);
        facetMap.set(facetId, tokenSet);

        if (!displayFacetsBySubmissionId.has(submissionId)) {
            displayFacetsBySubmissionId.set(submissionId, []);
        }

        const displayList = displayFacetsBySubmissionId.get(submissionId);
        const label = buildFacetDisplayLabel(row, optionById);

        if (!displayList.some((item) => item.facetId === facetId && item.token === token)) {
            displayList.push({
                facetId,
                facetOptionId: row.facet_option_id ?? null,
                token,
                label,
            });
        }
    }

    return { facetTokensBySubmissionId, displayFacetsBySubmissionId };
}

export function buildFilterFacets({ submissions, facetById, displayFacetsBySubmissionId, judgeDefaultFiltersByFacetId }) {
    const optionsByFacetId = new Map();

    for (const submission of submissions) {
        const facets = displayFacetsBySubmissionId.get(submission.submission_id) ?? [];

        for (const facet of facets) {
            const current = optionsByFacetId.get(facet.facetId) ?? new Map();
            const existing = current.get(facet.token);

            current.set(facet.token, {
                token: facet.token,
                label: facet.label,
                count: (existing?.count ?? 0) + 1,
            });

            optionsByFacetId.set(facet.facetId, current);
        }
    }

    Object.entries(judgeDefaultFiltersByFacetId).forEach(([facetId, defaults]) => {
        const current = optionsByFacetId.get(facetId) ?? new Map();

        defaults.forEach((defaultItem) => {
            if (!current.has(defaultItem.token)) {
                current.set(defaultItem.token, {
                    token: defaultItem.token,
                    label: defaultItem.label,
                    count: 0,
                });
            }
        });

        optionsByFacetId.set(facetId, current);
    });

    return [...optionsByFacetId.entries()]
        .map(([facetId, optionsMap]) => {
            const facetMeta = facetById.get(facetId);
            const options = [...optionsMap.values()].sort((a, b) => a.label.localeCompare(b.label));

            return {
                facetId,
                code: facetMeta?.code ?? "",
                name: facetMeta?.name ?? "",
                options,
            };
        })
        .sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));
}

export function applySubmissionFilters(submissions, selectedFiltersByFacetId) {
    return submissions.filter((submission) => {
        const filters = selectedFiltersByFacetId ?? {};
        const facetTokensByFacetId = submission.facetTokensByFacetId ?? {};

        for (const [facetId, selectedTokens] of Object.entries(filters)) {
            if (!selectedTokens?.length) continue;

            const submissionTokens = facetTokensByFacetId[facetId] ?? [];
            const hasMatch = selectedTokens.some((token) => submissionTokens.includes(token));

            if (!hasMatch) return false;
        }

        return true;
    });
}

export function buildNormalizedSubmissions({
    submissions,
    facetById,
    facetTokensBySubmissionId,
    displayFacetsBySubmissionId,
    trackNameById,
}) {
    return submissions.map((submission) => {
        const submissionId = submission.submission_id;
        const submissionFacetMap = facetTokensBySubmissionId.get(submissionId) ?? new Map();

        const facetTokensByFacetId = {};
        submissionFacetMap.forEach((tokenSet, facetId) => {
            facetTokensByFacetId[facetId] = [...tokenSet.values()];
        });

        const facets = (displayFacetsBySubmissionId.get(submissionId) ?? []).map((facet) => {
            const meta = facetById.get(facet.facetId);
            return {
                facetId: facet.facetId,
                code: meta?.code ?? "",
                name: meta?.name ?? "",
                label: facet.label,
                token: facet.token,
            };
        });

        return {
            submissionId,
            title: submission.title ?? "Untitled Submission",
            status: submission.status,
            trackId: submission.track_id,
            trackName: trackNameById.get(submission.track_id) ?? "Track",
            supervisorPersonId: submission.supervisor_person_id ?? null,
            createdAt: submission.created_at,
            facetTokensByFacetId,
            facets,
        };
    });
}

export function toUniqueIds(values) {
    return [...new Set(values.filter(Boolean))];
}
