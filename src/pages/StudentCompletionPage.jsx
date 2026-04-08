import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import {
    fetchStudentSubmissionCompletionOptions,
    fetchStudentSubmissionCompletionRows,
    saveStudentSubmissionCompletion,
} from "../services/studentProjects/studentApi.js";

export default function StudentCompletionPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [rows, setRows] = useState([]);
    const [options, setOptions] = useState({
        collegeOptions: [],
        majorOptions: [],
        levelOptions: [],
    });
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadRows() {
            setLoading(true);
            setError("");

            try {
                const personId = sessionStorage.getItem("auth_person_id");
                if (!personId) {
                    throw new Error("Session not found.");
                }

                const [data, optionData] = await Promise.all([
                    fetchStudentSubmissionCompletionRows(personId, eventInstanceId),
                    fetchStudentSubmissionCompletionOptions(),
                ]);

                setRows(data);
                setOptions(optionData);
            } catch (loadError) {
                console.error(loadError);
                setError(loadError.message || "Could not load completion data.");
            } finally {
                setLoading(false);
            }
        }

        loadRows();
    }, [eventInstanceId]);

    function setField(submissionId, field, value) {
        setRows((prev) =>
            prev.map((row) => (row.submission_id === submissionId ? { ...row, [field]: value } : row))
        );
    }

    function findCollegeOptionId(collegeValue) {
        const normalized = String(collegeValue || "").trim().toUpperCase();
        if (!normalized) return null;

        const match = options.collegeOptions.find((option) => {
            const display = String(option.display || "").trim().toUpperCase();
            const value = String(option.value || "").trim().toUpperCase();
            const label = String(option.label || "").trim().toUpperCase();
            return normalized === display || normalized === value || normalized === label;
        });

        return match?.id ?? null;
    }

    function getMajorOptionsForRow(row) {
        const majors = options.majorOptions ?? [];
        const hasParentedMajors = majors.some((option) => option.parentOptionId !== null);

        if (!hasParentedMajors) {
            return majors;
        }

        const selectedCollegeOptionId = findCollegeOptionId(row.college);
        if (!selectedCollegeOptionId) {
            return [];
        }

        return majors.filter((option) => option.parentOptionId === selectedCollegeOptionId);
    }

    function handleCollegeChange(row, nextCollege) {
        const nextRow = { ...row, college: nextCollege };
        const allowedMajors = getMajorOptionsForRow(nextRow).map((option) => option.display);
        const keepMajor = !nextRow.major || allowedMajors.includes(nextRow.major);

        setRows((prev) =>
            prev.map((item) =>
                item.submission_id === row.submission_id
                    ? {
                          ...item,
                          college: nextCollege,
                          major: keepMajor ? item.major : "",
                      }
                    : item
            )
        );
    }

    async function saveRow(row) {
        const college = String(row.college || "").trim();
        const major = String(row.major || "").trim();
        const level = String(row.level || "").trim();

        if (!college || !major || !level) {
            setError(`All fields are required for ${row.title}.`);
            return;
        }

        setSavingId(row.submission_id);
        setError("");

        try {
            await saveStudentSubmissionCompletion({
                submissionId: row.submission_id,
                college,
                major,
                level,
            });

            setRows((prev) =>
                prev.map((item) =>
                    item.submission_id === row.submission_id
                        ? {
                              ...item,
                              college,
                              major,
                              level,
                              missing: {
                                  college: false,
                                  major: false,
                                  level: false,
                              },
                          }
                        : item
                )
            );
        } catch (saveError) {
            console.error(saveError);
            setError(saveError.message || `Could not save ${row.title}.`);
        } finally {
            setSavingId(null);
        }
    }

    const rowsNeedingAction = rows.filter(
        (row) => row.missing?.college || row.missing?.major || row.missing?.level
    );

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#004785]">Complete Required Student Data</h1>
                <Button variant="secondary" onClick={() => navigate(`/students/${eventInstanceId}/projects`)}>
                    Back to Projects
                </Button>
            </div>

            <p className="text-sm text-[#55616D]">
                College, major, and level are required for filtering. Fill missing fields below.
            </p>

            {loading && <p className="text-sm text-[#55616D]">Loading...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!loading && !rowsNeedingAction.length && (
                <p className="text-sm text-[#00794C]">All your submissions are complete for this event.</p>
            )}

            <div className="space-y-3">
                {rowsNeedingAction.map((row) => {
                    const isSaving = savingId === row.submission_id;

                    return (
                        <div key={row.submission_id} className="rounded border p-3">
                            <p className="font-semibold text-[#004785]">{row.title}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-3">
                                <select
                                    required
                                    className="rounded border p-2 text-sm"
                                    value={row.college || ""}
                                    onChange={(event) => handleCollegeChange(row, event.target.value)}
                                >
                                    <option value="">Select college</option>
                                    {options.collegeOptions.map((option) => (
                                        <option key={option.id} value={option.display}>
                                            {option.display}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    required
                                    className="rounded border p-2 text-sm"
                                    value={row.major || ""}
                                    onChange={(event) => setField(row.submission_id, "major", event.target.value)}
                                >
                                    <option value="">Select major</option>
                                    {getMajorOptionsForRow(row).map((option) => (
                                        <option key={option.id} value={option.display}>
                                            {option.display}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    required
                                    className="rounded border p-2 text-sm"
                                    value={row.level || ""}
                                    onChange={(event) => setField(row.submission_id, "level", event.target.value)}
                                >
                                    <option value="">Select level</option>
                                    {options.levelOptions.map((option) => (
                                        <option key={option.id} value={option.display}>
                                            {option.display}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-2">
                                <Button
                                    type="button"
                                    variant="primary"
                                    disabled={isSaving}
                                    onClick={() => saveRow(row)}
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
