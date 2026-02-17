import { useEffect, useMemo, useState } from "react";
import { createRubricAndAssignToTrack, updateRubricAndTrackAssignment } from "../../services/rubric/rubricService.js";
import {
    buildFormState,
    computeRubricMaxTotalPoints,
    emptyCriterion,
    hasDropdownWithoutOptions,
    hasInvalidScoreRange,
    normalizeCriteria,
} from "../rubric/rubricFormUtils.js";
import TrackRubricFormView from "./trackRubric/TrackRubricFormView.jsx";

// Main rubric editor form used in both creation and edit modes.
//
// `mode="create"`  -> creates a new rubric and links it to the current track.
// `mode="edit"`    -> updates an existing rubric and keeps track linkage/default state in sync.
//
// Parent page can pass:
// - `initialRubric` for prefilled edit values
// - `onSaved` callback to refresh external lists
// - `onCancel` callback to collapse edit mode UI
export default function TrackRubricForm({
    trackId,
    mode = "create",
    initialRubric = null,
    onSaved,
    onCancel,
}) {
    // Build a stable initial state from incoming rubric props.
    // `useMemo` avoids rebuilding unless `initialRubric` actually changes.
    const initialState = useMemo(() => buildFormState(initialRubric), [initialRubric]);

    // Top-level rubric fields (name/version/default flag).
    const [formData, setFormData] = useState(initialState.formData);

    // Criteria list edited dynamically (add/remove/reorder by array position).
    const [criteria, setCriteria] = useState(initialState.criteria.length ? initialState.criteria : [emptyCriterion()]);

    // Submission and user feedback state.
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Keep local form state synchronized whenever the source rubric changes
    // (for example when switching between different rubrics in edit mode).
    useEffect(() => {
        setFormData(initialState.formData);
        setCriteria(initialState.criteria.length ? initialState.criteria : [emptyCriterion()]);
        setError("");
        setMessage("");
    }, [initialState]);

    // Generic input handler for top-level rubric fields.
    function handleFormChange(event) {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    // Updates one criterion field and applies answer-type-specific defaults.
    // This keeps criterion data shape valid when switching response modes.
    function handleCriterionChange(index, field, value) {
        setCriteria((prev) =>
            prev.map((criterion, criterionIndex) =>
                criterionIndex === index
                    ? {
                        ...criterion,
                        [field]: value,
                        ...(field === "answerType" && value === "true_false"
                            ? { scoreMin: 0, scoreMax: 0 }
                            : {}),
                        ...(field === "answerType" && value === "numeric_scale"
                            ? { scoreMin: 0, scoreMax: 5 }
                            : {}),
                        ...(field === "answerType" && value === "dropdown"
                            ? {
                                scoreMin: 0,
                                scoreMax: 0,
                                dropdownOptions: criterion.dropdownOptions?.length
                                    ? criterion.dropdownOptions
                                    : [{ label: "", points: 0 }],
                            }
                            : {}),
                    }
                    : criterion
            )
        );
    }

    // Updates a single dropdown option row inside a specific criterion.
    function handleDropdownOptionChange(criterionIndex, optionIndex, field, value) {
        setCriteria((prev) =>
            prev.map((criterion, currentCriterionIndex) => {
                if (currentCriterionIndex !== criterionIndex) return criterion;

                return {
                    ...criterion,
                    dropdownOptions: criterion.dropdownOptions.map((option, currentOptionIndex) =>
                        currentOptionIndex === optionIndex
                            ? { ...option, [field]: value }
                            : option
                    ),
                };
            })
        );
    }

    // Adds a new empty dropdown option row for the target criterion.
    function addDropdownOption(criterionIndex) {
        setCriteria((prev) =>
            prev.map((criterion, currentCriterionIndex) =>
                currentCriterionIndex === criterionIndex
                    ? {
                        ...criterion,
                        dropdownOptions: [...criterion.dropdownOptions, { label: "", points: 0 }],
                    }
                    : criterion
            )
        );
    }

    // Removes one dropdown option row and ensures at least one row remains.
    function removeDropdownOption(criterionIndex, optionIndex) {
        setCriteria((prev) =>
            prev.map((criterion, currentCriterionIndex) => {
                if (currentCriterionIndex !== criterionIndex) return criterion;

                const filtered = criterion.dropdownOptions.filter((_, idx) => idx !== optionIndex);

                return {
                    ...criterion,
                    dropdownOptions: filtered.length ? filtered : [{ label: "", points: 0 }],
                };
            })
        );
    }

    // Appends a new blank criterion card.
    function addCriterion() {
        setCriteria((prev) => [...prev, emptyCriterion()]);
    }

    // Removes one criterion by index.
    function removeCriterion(index) {
        setCriteria((prev) => prev.filter((_, criterionIndex) => criterionIndex !== index));
    }

    // Handles form submission for both create and edit flows.
    // Steps:
    // 1) Validate required rubric and criterion fields.
    // 2) Normalize criteria into DB payload shape.
    // 3) Validate answer-type specific constraints.
    // 4) Compute max points from criteria rules.
    // 5) Call create/update service.
    // 6) Show status message and refresh parent data.
    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!formData.name.trim()) {
            setError("Rubric name is required.");
            return;
        }

        if (!criteria.length || criteria.some((criterion) => !criterion.name.trim())) {
            setError("Each criterion must have a name.");
            return;
        }

        // Normalize UI state into consistent scoring schema expected by service layer.
        const normalizedCriteria = normalizeCriteria(criteria);

        // Dropdown criteria must define at least one option.
        if (hasDropdownWithoutOptions(normalizedCriteria)) {
            setError("Dropdown criteria must include at least one option.");
            return;
        }

        // Guard against invalid numeric scale ranges.
        if (hasInvalidScoreRange(normalizedCriteria)) {
            setError("Criterion score min cannot be greater than score max.");
            return;
        }

        // Derived rubric total is always computed from criterion rules.
        const computedMaxTotalPoints = computeRubricMaxTotalPoints(normalizedCriteria);

        setIsSubmitting(true);

        try {
            // Shared payload between create and edit paths.
            const payload = {
                trackId,
                name: formData.name.trim(),
                description: formData.description.trim(),
                version: Number(formData.version),
                isDefault: formData.isDefault,
                criteria: normalizedCriteria,
            };

            // Decide whether to update an existing rubric or create a new one.
            const result =
                mode === "edit" && initialRubric?.rubricId
                    ? await updateRubricAndTrackAssignment({
                        ...payload,
                        rubricId: initialRubric.rubricId,
                    })
                    : await createRubricAndAssignToTrack(payload);

            // Human-readable status for admin feedback.
            setMessage(
                `Rubric ${mode === "edit" ? "updated" : "created"} (${result.rubricId}). Max points: ${computedMaxTotalPoints}.`
            );

            // In create mode we reset the form for quick additional rubric creation.
            if (mode === "create") {
                setFormData({
                    name: "",
                    description: "",
                    version: Number(formData.version) + 1,
                    isDefault: true,
                });
                setCriteria([emptyCriterion()]);
            }

            // Let parent refresh rubric list/details after successful save.
            if (onSaved) {
                await onSaved();
            }
        } catch (submitError) {
            console.error(submitError);
            setError(`Could not ${mode === "edit" ? "update" : "create"} rubric for this track.`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <TrackRubricFormView
            mode={mode}
            formData={formData}
            criteria={criteria}
            isSubmitting={isSubmitting}
            error={error}
            message={message}
            onSubmit={handleSubmit}
            onFormChange={handleFormChange}
            onCriterionChange={handleCriterionChange}
            onDropdownOptionChange={handleDropdownOptionChange}
            onAddDropdownOption={addDropdownOption}
            onRemoveDropdownOption={removeDropdownOption}
            onRemoveCriterion={removeCriterion}
            onAddCriterion={addCriterion}
            onCancel={onCancel}
        />
    );
}
