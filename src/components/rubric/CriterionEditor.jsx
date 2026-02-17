import Button from "../ui/Button.jsx";
import DropdownOptionsEditor from "./DropdownOptionsEditor.jsx";
import { CRITERION_CATEGORY_OPTIONS, computeCriterionMaxPoints } from "./rubricFormUtils.js";

export default function CriterionEditor({
    criterion,
    index,
    criteriaCount,
    onCriterionChange,
    onDropdownOptionChange,
    onAddDropdownOption,
    onRemoveDropdownOption,
    onRemoveCriterion,
}) {
    const criterionNumber = index + 1;
    const isTrueFalse = criterion.answerType === "true_false";
    const isDropdown = criterion.answerType === "dropdown";
    const isNumericScale = criterion.answerType === "numeric_scale";

    function handleFieldChange(field) {
        return (event) => onCriterionChange(index, field, event.target.value);
    }

    return (
        <div className="space-y-2 rounded border p-2">
            <p className="text-sm font-medium">Criterion {criterionNumber}</p>

            <label className="block text-sm text-gray-700">
                Name
                <input
                    type="text"
                    value={criterion.name}
                    onChange={handleFieldChange("name")}
                    placeholder={`Criterion ${criterionNumber} name`}
                    className="mt-1 w-full rounded border p-2"
                    required
                />
            </label>

            <label className="block text-sm text-gray-700">
                Description
                <textarea
                    value={criterion.description}
                    onChange={handleFieldChange("description")}
                    placeholder="Criterion description"
                    className="mt-1 w-full rounded border p-2"
                />
            </label>

            <label className="block text-sm text-gray-700">
                Response type
                <select
                    value={criterion.answerType}
                    onChange={handleFieldChange("answerType")}
                    className="mt-1 w-full rounded border p-2"
                    required
                >
                    <option value="true_false">True / False</option>
                    <option value="numeric_scale">Numeric scale</option>
                    <option value="dropdown">Dropdown selection</option>
                </select>
            </label>

            <label className="block text-sm text-gray-700">
                Category
                <select
                    value={criterion.category}
                    onChange={handleFieldChange("category")}
                    className="mt-1 w-full rounded border p-2"
                    required
                >
                    {CRITERION_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            {isTrueFalse && (
                <p className="text-sm text-gray-500">Response options: True / False</p>
            )}

            {isDropdown && (
                <DropdownOptionsEditor
                    criterionIndex={index}
                    options={criterion.dropdownOptions}
                    onOptionChange={onDropdownOptionChange}
                    onAddOption={onAddDropdownOption}
                    onRemoveOption={onRemoveDropdownOption}
                />
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="text-sm text-gray-700">
                    Weight
                    <input
                        type="number"
                        value={criterion.weight}
                        min="0"
                        step="0.01"
                        onChange={handleFieldChange("weight")}
                        placeholder="Weight"
                        className="mt-1 w-full rounded border p-2"
                    />
                </label>
                {isNumericScale && (
                    <>
                        <label className="text-sm text-gray-700">
                            Score min
                            <input
                                type="number"
                                value={criterion.scoreMin}
                                onChange={handleFieldChange("scoreMin")}
                                placeholder="Score min"
                                className="mt-1 w-full rounded border p-2"
                            />
                        </label>
                        <label className="text-sm text-gray-700">
                            Score max
                            <input
                                type="number"
                                value={criterion.scoreMax}
                                onChange={handleFieldChange("scoreMax")}
                                placeholder="Score max"
                                className="mt-1 w-full rounded border p-2"
                            />
                        </label>
                    </>
                )}
            </div>

            <p className="text-xs text-gray-500">
                Criterion max points: {computeCriterionMaxPoints(criterion)}
            </p>

            {criteriaCount > 1 && (
                <Button type="button" variant="outline" onClick={() => onRemoveCriterion(index)}>
                    Remove criterion
                </Button>
            )}
        </div>
    );
}
