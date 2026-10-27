// Helpers for cleaned judge Excel import normalization and parsing.

const HEADER_ALIASES = {
    email: ["email", "email_address", "mail", "e_mail"],
    first_name: ["first_name", "firstname", "first"],
    last_name: ["last_name", "lastname", "last"],
    display_name: ["display_name", "displayname", "name", "full_name", "fullname"],
    college_codes: ["college_codes", "college_code", "collegecodes", "judge_college_codes"],
    class_codes: ["class_codes", "class_code", "classcodes", "major_codes", "program_codes", "judge_class_codes"],
    session_code: ["session_code", "session", "session_codes", "judge_session_code"],
};

export function normalizeHeader(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function getFirstPresentValue(row, aliases) {
    for (const alias of aliases) {
        if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== "") {
            return String(row[alias]).trim();
        }
    }

    return "";
}

export function parsePipeCodes(value) {
    return String(value ?? "")
        .split("|")
        .map((token) => token.trim())
        .filter(Boolean);
}

export function normalizeJudgeImportRow(rawRow) {
    const normalizedRow = {};

    Object.entries(rawRow ?? {}).forEach(([key, value]) => {
        normalizedRow[normalizeHeader(key)] = value;
    });

    const email = getFirstPresentValue(normalizedRow, HEADER_ALIASES.email).toLowerCase();
    const firstName = getFirstPresentValue(normalizedRow, HEADER_ALIASES.first_name);
    const lastName = getFirstPresentValue(normalizedRow, HEADER_ALIASES.last_name);
    const displayNameFromSheet = getFirstPresentValue(normalizedRow, HEADER_ALIASES.display_name);
    const derivedDisplayName = [firstName, lastName].filter(Boolean).join(" ").trim();

    return {
        email,
        firstName,
        lastName,
        displayName: displayNameFromSheet || derivedDisplayName,
        collegeCodes: parsePipeCodes(getFirstPresentValue(normalizedRow, HEADER_ALIASES.college_codes)),
        classCodes: parsePipeCodes(getFirstPresentValue(normalizedRow, HEADER_ALIASES.class_codes)),
        sessionCodes: parsePipeCodes(getFirstPresentValue(normalizedRow, HEADER_ALIASES.session_code)),
    };
}
