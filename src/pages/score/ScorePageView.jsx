import Button from "../../components/ui/Button.jsx";

function renderCriterionInput(criterion, response, onValueChange) {
    if (criterion.answerType === "true_false") {
        return (
            <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="radio"
                        name={criterion.id}
                        value="true"
                        checked={response.value === "true"}
                        onChange={(event) => onValueChange(criterion.id, event.target.value)}
                        className="h-4 w-4"
                    />
                    {criterion.answerConfig?.trueLabel || "True"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="radio"
                        name={criterion.id}
                        value="false"
                        checked={response.value === "false"}
                        onChange={(event) => onValueChange(criterion.id, event.target.value)}
                        className="h-4 w-4"
                    />
                    {criterion.answerConfig?.falseLabel || "False"}
                </label>
            </div>
        );
    }

    if (criterion.answerType === "dropdown") {
        const options = criterion.answerConfig?.options ?? [];

        return (
            <select
                value={response.value}
                onChange={(event) => onValueChange(criterion.id, event.target.value)}
                className="mt-1 w-full rounded border p-2"
                required
            >
                <option value="">Select an option</option>
                {options.map((option, index) => (
                    <option key={`${criterion.id}-${index}`} value={Number(option.points)}>
                        {option.label}
                    </option>
                ))}
            </select>
        );
    }

    if (criterion.answerType === "numeric_scale") {
        const min = Number(criterion.scoreMin);
        const max = Number(criterion.scoreMax);
        const isIntegerRange = Number.isInteger(min) && Number.isInteger(max);
        const canRenderRadioRange = isIntegerRange && max >= min && max - min <= 20;

        if (canRenderRadioRange) {
            const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);

            return (
                <div className="flex flex-wrap items-center gap-4">
                    {values.map((value) => (
                        <label key={`${criterion.id}-${value}`} className="flex items-center gap-2 text-sm">
                            <input
                                type="radio"
                                name={criterion.id}
                                value={value}
                                checked={String(response.value) === String(value)}
                                onChange={(event) => onValueChange(criterion.id, event.target.value)}
                                className="h-4 w-4"
                            />
                            {value}
                        </label>
                    ))}
                </div>
            );
        }
    }

    return (
        <input
            type="number"
            min={criterion.scoreMin}
            max={criterion.scoreMax}
            step="0.01"
            value={response.value}
            onChange={(event) => onValueChange(criterion.id, event.target.value)}
            className="mt-1 w-full rounded border p-2"
            required
        />
    );
}

export default function ScorePageView({
    submissionTitle,
    rubricName,
    total,
    isLoading,
    criteria,
    responsesByCriterionId,
    overallComment,
    error,
    isSubmitting,
    onSubmit,
    onValueChange,
    onCommentChange,
    onOverallCommentChange,
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6">
                <h1 className="text-2x1 font-bold">Scoring Project</h1>
                <p className="mt-2 text-gray-600">{submissionTitle}</p>
                <form onSubmit={onSubmit} className="mx-auto max-w-3xl p-6">
                    <header className="flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Score Submission</h1>
                            <p className="mt-1 text-sm text-gray-600">Rubric: {rubricName}</p>
                            <p className="mt-1 text-sm text-gray-600">Total score: {total}</p>
                        </div>
                    </header>

                    {isLoading && <p className="mt-6 text-sm text-gray-500">Loading scoring form...</p>}

                    {!isLoading && (
                        <div className="mt-6 space-y-4">
                            {criteria.map((criterion, index) => (
                                <div key={criterion.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                                    <p className="text-sm font-semibold">
                                        {index + 1}. {criterion.name}
                                    </p>
                                    {!!criterion.description && (
                                        <p className="mt-1 text-xs text-gray-500">{criterion.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Weight: {criterion.weight}
                                        {criterion.answerType === "numeric_scale"
                                            ? ` · Range: ${criterion.scoreMin} to ${criterion.scoreMax}`
                                            : ""}
                                    </p>

                                    <div className="mt-3">
                                        {renderCriterionInput(
                                            criterion,
                                            responsesByCriterionId?.[criterion.id] ?? { value: "" },
                                            onValueChange
                                        )}
                                    </div>

                                    <label className="mt-3 block text-sm text-gray-700">
                                        Comment (optional)
                                        <textarea
                                            value={responsesByCriterionId?.[criterion.id]?.comment || ""}
                                            onChange={(event) =>
                                                onCommentChange(criterion.id, event.target.value)
                                            }
                                            className="mt-1 w-full rounded border p-2"
                                            rows={2}
                                        />
                                    </label>
                                </div>
                            ))}

                            <label className="block rounded-2xl border bg-white p-5 text-sm text-gray-700 shadow-sm">
                                Overall comment (optional)
                                <textarea
                                    value={overallComment}
                                    onChange={(event) => onOverallCommentChange(event.target.value)}
                                    className="mt-1 w-full rounded border p-2"
                                    rows={3}
                                />
                            </label>
                        </div>
                    )}

                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                    <div className="mt-6 flex justify-end">
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={isLoading || isSubmitting || !criteria.length}
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
