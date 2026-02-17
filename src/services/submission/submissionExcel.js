import * as XLSX from "xlsx";

// Normalizes incoming Excel headers for resilient key matching.
function normalizeHeader(value) {
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Returns the first populated value for any of the provided keys.
function getRowValue(row, keys) {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
            return row[key];
        }
    }

    return "";
}

// Maps one spreadsheet row to the submission import shape.
function mapExcelRowToSubmission(row) {
    const normalizedRow = {};

    Object.entries(row).forEach(([key, value]) => {
        normalizedRow[normalizeHeader(key)] = value;
    });

    const submittedAtRaw = getRowValue(normalizedRow, ["submittedat", "submissiondate"]);
    let submittedAt = "";

    if (submittedAtRaw) {
        const parsed = new Date(submittedAtRaw);
        if (!Number.isNaN(parsed.getTime())) {
            submittedAt = parsed.toISOString();
        }
    }

    return {
        title: String(getRowValue(normalizedRow, ["title"]))?.trim(),
        description: String(getRowValue(normalizedRow, ["description", "abstract"]))?.trim(),
        keywords: String(getRowValue(normalizedRow, ["keywords"]))?.trim(),
        status: String(getRowValue(normalizedRow, ["status", "submittedstatus"]))?.trim() || "submitted",
        created_by_email: String(getRowValue(normalizedRow, ["createdbyemail", "createdbypersonid"]))?.trim(),
        supervisor_email: String(getRowValue(normalizedRow, ["supervisoremail", "supervisor"]))?.trim(),
        college: String(getRowValue(normalizedRow, ["college"]))?.trim(),
        degree: String(getRowValue(normalizedRow, ["degree"]))?.trim(),
        level: String(getRowValue(normalizedRow, ["level"]))?.trim(),
        program: String(getRowValue(normalizedRow, ["program"]))?.trim(),
        submitted_at: submittedAt,
    };
}

// Parses the first worksheet and returns valid submission rows.
export async function parseSubmissionExcelFile(file) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    return rawRows
        .map(mapExcelRowToSubmission)
        .filter((submission) => submission.title);
}
