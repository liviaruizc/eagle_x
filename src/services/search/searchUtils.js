function normalizeSearchText(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

export function matchesSearchTerm(values, searchTerm) {
    const normalizedTerm = normalizeSearchText(searchTerm);
    if (!normalizedTerm) return true;

    const haystack = normalizeSearchText(
        (values ?? [])
            .filter(Boolean)
            .join(" ")
    );

    return haystack.includes(normalizedTerm);
}
