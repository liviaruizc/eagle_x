import Button from "../ui/Button.jsx";

// DropdownOptionsEditor
//
// Purpose:
// Renders the editable list of dropdown answer options for one rubric criterion,
// including each option's display label and points value.
//
// Where it is used:
// Embedded inside CriterionEditor when the criterion answer type is "dropdown".
//
// Props:
// - criterionIndex (number): index of the parent criterion in the criteria array.
// - options (Array<{ label: string, points: number|string }>): current option rows.
// - onOptionChange (fn): called when option label/points changes.
//   Signature: (criterionIndex, optionIndex, fieldName, value) => void
// - onAddOption (fn): adds a new option row for this criterion.
//   Signature: (criterionIndex) => void
// - onRemoveOption (fn): removes one option row.
//   Signature: (criterionIndex, optionIndex) => void
//
// Behavior notes:
// - At least one option should exist (parent form logic enforces this).
// - "Remove option" is only shown when more than one option is present.

export default function DropdownOptionsEditor({
    criterionIndex,
    options,
    onOptionChange,
    onAddOption,
    onRemoveOption,
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm text-gray-700">Dropdown options and points</p>
            {options.map((option, optionIndex) => (
                <div key={optionIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="sm:col-span-2 text-sm text-gray-700">
                        Option label
                        <input
                            type="text"
                            value={option.label}
                            onChange={(event) =>
                                onOptionChange(
                                    criterionIndex,
                                    optionIndex,
                                    "label",
                                    event.target.value
                                )
                            }
                            className="mt-1 w-full rounded border p-2"
                            placeholder={`Option ${optionIndex + 1}`}
                            required
                        />
                    </label>
                    <label className="text-sm text-gray-700">
                        Points
                        <input
                            type="number"
                            value={option.points}
                            onChange={(event) =>
                                onOptionChange(
                                    criterionIndex,
                                    optionIndex,
                                    "points",
                                    event.target.value
                                )
                            }
                            className="mt-1 w-full rounded border p-2"
                            required
                        />
                    </label>
                    {options.length > 1 && (
                        <div className="sm:col-span-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onRemoveOption(criterionIndex, optionIndex)}
                            >
                                Remove option
                            </Button>
                        </div>
                    )}
                </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => onAddOption(criterionIndex)}>
                Add dropdown option
            </Button>
        </div>
    );
}
