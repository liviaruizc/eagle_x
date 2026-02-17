import Button from "../Button.jsx";
import CriterionEditor from "../../rubric/CriterionEditor.jsx";

export default function TrackRubricFormView({
    mode,
    formData,
    criteria,
    isSubmitting,
    error,
    message,
    onSubmit,
    onFormChange,
    onCriterionChange,
    onDropdownOptionChange,
    onAddDropdownOption,
    onRemoveDropdownOption,
    onRemoveCriterion,
    onAddCriterion,
    onCancel,
}) {
    return (
        <form onSubmit={onSubmit} className="rounded border p-3 space-y-3">
            <p className="font-medium">
                {mode === "edit" ? "Edit Rubric" : "Create Rubric for this Track"}
            </p>

            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onFormChange}
                placeholder="Rubric name"
                className="w-full rounded border p-2"
                required
            />

            <textarea
                name="description"
                value={formData.description}
                onChange={onFormChange}
                placeholder="Rubric description"
                className="w-full rounded border p-2"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                    type="number"
                    name="version"
                    value={formData.version}
                    min="1"
                    onChange={onFormChange}
                    placeholder="Version"
                    className="rounded border p-2"
                    required
                />
                <div className="rounded border p-2 text-sm text-gray-700">
                    Max total points is calculated automatically from criteria.
                </div>
            </div>

            <label className="text-sm text-gray-700">
                <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={onFormChange}
                    className="mr-2"
                />
                Set as default rubric for this track
            </label>

            <div className="space-y-2">
                <p className="text-sm font-medium">Criteria</p>
                {criteria.map((criterion, index) => (
                    <CriterionEditor
                        key={index}
                        criterion={criterion}
                        index={index}
                        criteriaCount={criteria.length}
                        onCriterionChange={onCriterionChange}
                        onDropdownOptionChange={onDropdownOptionChange}
                        onAddDropdownOption={onAddDropdownOption}
                        onRemoveDropdownOption={onRemoveDropdownOption}
                        onRemoveCriterion={onRemoveCriterion}
                    />
                ))}

                <Button type="button" variant="secondary" onClick={onAddCriterion}>
                    Add criterion
                </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-gray-700">{message}</p>}

            <div className="flex justify-start gap-2">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    {isSubmitting
                        ? mode === "edit"
                            ? "Updating rubric..."
                            : "Creating rubric..."
                        : mode === "edit"
                          ? "Save Rubric"
                          : "Create Rubric"}
                </Button>
                {mode === "edit" && onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
