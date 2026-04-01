import * as XLSX from "xlsx";
import { normalizeJudgeImportRow } from "./judgeImportUtils.js";

export async function parseJudgeImportExcelFile(file) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    return rawRows
        .map((rawRow, index) => ({ rowNumber: index + 2, ...normalizeJudgeImportRow(rawRow) }))
        .filter((row) => row.email);
}
