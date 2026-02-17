// Builds validated facet payload rows for submission_facet_value inserts.
export function buildSubmissionFacetValues(trackFacets, facetValues) {
    const values = [];

    for (const facet of trackFacets) {
        const current = facetValues[facet.facetId] ?? {};
        const selectedOptionId = current.facet_option_id || "";
        const valueText = (current.value_text || "").trim();
        const valueNumber = current.value_number;
        const valueDate = current.value_date || "";

        const hasValue = selectedOptionId || valueText || valueDate || valueNumber !== "";

        if (facet.isRequired && !hasValue) {
            throw new Error(`${facet.name} is required.`);
        }

        if (!hasValue) {
            continue;
        }

        values.push({
            facet_id: facet.facetId,
            facet_option_id: selectedOptionId || null,
            value_kind: facet.valueKind,
            value_text: valueText || null,
            value_number: valueNumber === "" || valueNumber === undefined ? null : Number(valueNumber),
            value_date: valueDate || null,
        });
    }

    return values;
}
