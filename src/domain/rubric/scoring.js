export const MIN_SCORE = 0;
export const MAX_SCORE = 5;

export function validateAnswers(answers, questions) {
    const missing = questions
        .filter((q) => answers[q.id] == null)
        .map((q) => q.id);

    return { ok: missing.length === 0, missing };
}

export function calculateTotal(answers, questions) {
    return questions.reduce((sum, q) => sum + (answers[q.id] ?? 0) * (q.weight ?? 1), 0);
}