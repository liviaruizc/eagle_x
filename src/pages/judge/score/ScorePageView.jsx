import Button from "../../../components/ui/Button.jsx";

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
    tableNumber,
    tableSession,
    posterFileUrl,
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
        <div className="min-h-screen bg-[#F3F3F3]">
            <div className="mx-auto max-w-3xl p-6">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-[#004785]">Score Submission</h1>
                    <p className="text-[#55616D] mt-1 text-lg font-medium">{submissionTitle}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span className="text-[#55616D]">Rubric: <span className="font-semibold text-[#004785]">{rubricName}</span></span>
                        {tableNumber != null && (
                            <span className="font-semibold text-[#00794C]">
                                Table {tableNumber}{tableSession ? ` · Session ${tableSession}` : ""}
                            </span>
                        )}
                        {posterFileUrl && (
                            <a
                                href={posterFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#004785] hover:underline"
                            >
                                View Poster ↗
                            </a>
                        )}
                    </div>
                </div>

                <form onSubmit={onSubmit}>
                    {isLoading && <p className="text-[#55616D] text-center py-10">Loading scoring form...</p>}

                    {!isLoading && (
                        <div className="space-y-4">
                            {criteria.map((criterion, index) => (
                                <div key={criterion.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
                                    <p className="text-sm font-bold text-[#004785]">
                                        {index + 1}. {criterion.name}
                                    </p>
                                    {!!criterion.description && (
                                        <p className="mt-1 text-xs text-[#55616D]">{criterion.description}</p>
                                    )}
                                    <p className="mt-1 text-xs text-[#55616D]">
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

                                    <label className="mt-3 block text-sm text-[#55616D]">
                                        Comment (optional)
                                        <textarea
                                            value={responsesByCriterionId?.[criterion.id]?.comment || ""}
                                            onChange={(event) => onCommentChange(criterion.id, event.target.value)}
                                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                            rows={2}
                                        />
                                    </label>
                                </div>
                            ))}

                            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
                                <label className="block text-sm font-semibold text-[#004785] mb-1">
                                    Overall comment (optional)
                                </label>
                                <textarea
                                    value={overallComment}
                                    onChange={(event) => onOverallCommentChange(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    {/* Running total */}
                    {!isLoading && (
                        <div className="mt-4 rounded-xl bg-[#004785]/8 border border-[#004785]/20 px-4 py-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#004785]">Running Total</span>
                            <span className="text-lg font-bold text-[#004785]">{total}</span>
                        </div>
                    )}

                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                    <div className="mt-6 flex justify-end">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading || isSubmitting || !criteria.length}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Score"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
