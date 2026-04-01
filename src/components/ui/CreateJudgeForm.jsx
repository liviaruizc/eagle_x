import { useState } from "react";
import Button from "./Button.jsx";
import { createJudgeOrAdmin } from "../../services/judgeSignup/adminJudgeService.js";
import { importJudgesFromCleanedExcel } from "../../services/judgeSignup/judgeImportService.js";

export default function CreateJudgeForm({ eventInstanceId, onJudgeCreated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState("judge");
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
    const [isExcelImporting, setIsExcelImporting] = useState(false);
    const [bulkInput, setBulkInput] = useState("");
    const [bulkResultMessage, setBulkResultMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccessMessage("");
        setBulkResultMessage("");
        setIsSubmitting(true);

        try {
            const result = await createJudgeOrAdmin({
                email,
                displayName,
                role,
                eventInstanceId,
                isGlobalAdmin,
            });

            setSuccessMessage(
                role === "admin" && isGlobalAdmin
                    ? `Created global admin "${displayName}" (${email}). They can now log in and set their password.`
                    : `Created ${role === "admin" ? "event admin" : "judge"} "${displayName}" (${email}). They can now log in and set their password.`
            );

            // Reset form
            setEmail("");
            setDisplayName("");
            setRole("judge");
            setIsGlobalAdmin(false);

            // Notify parent if callback provided
            if (onJudgeCreated) {
                onJudgeCreated(result);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Could not create judge. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleBulkCreate() {
        setError("");
        setSuccessMessage("");
        setBulkResultMessage("");

        const rows = bulkInput
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (!rows.length) {
            setError("Paste at least one row in the format: email,display name");
            return;
        }

        setIsBulkSubmitting(true);

        let successCount = 0;
        const failures = [];

        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            const [rowEmail = "", rowDisplayName = ""] = row.split(",").map((cell) => cell.trim());

            if (!rowEmail || !rowDisplayName) {
                failures.push(`Row ${index + 1}: expected \"email,display name\".`);
                continue;
            }

            try {
                const result = await createJudgeOrAdmin({
                    email: rowEmail,
                    displayName: rowDisplayName,
                    role,
                    eventInstanceId,
                    isGlobalAdmin,
                });

                successCount += 1;
                if (onJudgeCreated) {
                    onJudgeCreated(result);
                }
            } catch (createError) {
                failures.push(`Row ${index + 1} (${rowEmail}): ${createError.message || "Could not create user."}`);
            }
        }

        const summary = `Bulk create complete: ${successCount} succeeded, ${failures.length} failed.`;
        setBulkResultMessage([summary, ...failures.slice(0, 5)].join("\n"));

        if (successCount > 0) {
            setBulkInput("");
        }

        setIsBulkSubmitting(false);
    }

    async function handleExcelUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        setError("");
        setSuccessMessage("");
        setBulkResultMessage("");
        setIsExcelImporting(true);

        try {
            const result = await importJudgesFromCleanedExcel({
                file,
                eventInstanceId,
            });

            const summaryLines = [
                `Excel import complete: ${result.imported} inserted, ${result.updated} updated, ${result.rowErrors.length} row errors, ${result.unmatched.length} unmatched codes.`,
            ];

            if (result.rowErrors.length) {
                summaryLines.push("Row errors (first 10):");
                result.rowErrors.slice(0, 10).forEach((rowError) => {
                    summaryLines.push(`- Row ${rowError.rowNumber} (${rowError.email}): ${rowError.message}`);
                });
            }

            if (result.unmatched.length) {
                summaryLines.push("Unmatched normalized codes (first 20):");
                result.unmatched.slice(0, 20).forEach((item) => {
                    summaryLines.push(
                        `- Row ${item.rowNumber} (${item.email}) [${item.column}]: ${item.code}`
                    );
                });
            }

            setBulkResultMessage(summaryLines.join("\n"));
        } catch (importError) {
            console.error(importError);
            setError(importError.message || "Could not import cleaned judge Excel file.");
        } finally {
            event.target.value = "";
            setIsExcelImporting(false);
        }
    }

    return (
        <div className="rounded border p-3">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left font-semibold text-gray-700 hover:text-gray-900"
            >
                {isOpen ? "▼" : "▶"} Create Judge or Admin
            </button>

            {isOpen && (
                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                    <div>
                        <label className="text-sm text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="judge@example.com"
                            className="mt-1 w-full rounded border p-2"
                            required
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Smith"
                            className="mt-1 w-full rounded border p-2"
                            required
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700">Role</label>
                        <select
                            value={role}
                            onChange={(e) => {
                                const selectedRole = e.target.value;
                                setRole(selectedRole);
                                if (selectedRole !== "admin") {
                                    setIsGlobalAdmin(false);
                                }
                            }}
                            className="mt-1 w-full rounded border p-2"
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                        >
                            <option value="judge">Judge</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {role === "admin" && (
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isGlobalAdmin}
                                onChange={(e) => setIsGlobalAdmin(e.target.checked)}
                                disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                            />
                            Create as global admin (not tied to this event)
                        </label>
                    )}

                    <div className="flex justify-start gap-2 pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting || !email || !displayName}
                        >
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                        >
                            Close
                        </Button>
                    </div>

                    <div className="mt-4 rounded border p-3">
                        <p className="text-sm font-semibold text-gray-700">Import CLEANED Judge Excel</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Required normalized columns: email, college_codes, class_codes, session_code. Uses only normalized columns for matching.
                        </p>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleExcelUpload}
                            className="mt-2 w-full rounded border p-2 text-sm"
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                        />
                        {isExcelImporting && (
                            <p className="mt-1 text-xs text-gray-500">Importing cleaned Excel...</p>
                        )}
                    </div>

                    <div className="mt-4 rounded border p-3">
                        <p className="text-sm font-semibold text-gray-700">Bulk Upload</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Paste one user per line: email,display name. Uses the selected role above.
                        </p>
                        <textarea
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                            placeholder={"judge1@example.com,Judge One\njudge2@example.com,Judge Two"}
                            className="mt-2 min-h-28 w-full rounded border p-2 text-sm"
                            disabled={isSubmitting || isBulkSubmitting || isExcelImporting}
                        />
                        <div className="mt-2 flex justify-start">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleBulkCreate}
                                disabled={isSubmitting || isBulkSubmitting || isExcelImporting || !bulkInput.trim()}
                            >
                                {isBulkSubmitting ? "Creating Bulk Users..." : "Create Bulk Users"}
                            </Button>
                        </div>
                    </div>

                    {successMessage && (
                        <p className="rounded bg-green-50 p-3 text-sm text-green-700">{successMessage}</p>
                    )}
                    {bulkResultMessage && (
                        <pre className="whitespace-pre-wrap rounded bg-blue-50 p-3 text-sm text-blue-800">
                            {bulkResultMessage}
                        </pre>
                    )}
                    {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                </form>
            )}
        </div>
    );
}
