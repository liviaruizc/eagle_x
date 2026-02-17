// Scoring workflow helpers for permissions, assignments, and status progression.
//
// Responsibilities:
// - Enforce conflict-of-interest rules for scoring.
// - Ensure judge-assignment rows exist before score submission.
// - Advance submission status after threshold of submitted judge scores.

import {
    fetchSubmissionForScoring,
    findJudgeAssignment,
    insertJudgeAssignment,
    fetchSubmittedJudgeRowsBySubmission,
    updateSubmissionStatusIfCurrent,
} from "./scoreApi.js";

export async function assertJudgeCanScoreSubmission(submissionId, judgePersonId) {
    const submission = await fetchSubmissionForScoring(submissionId);

    if (submission?.supervisor_person_id && submission.supervisor_person_id === judgePersonId) {
        throw new Error("Conflict of interest: supervisors cannot score their own submissions.");
    }
}

export async function ensureJudgeAssignment({ trackId, judgePersonId, submissionId }) {
    const existing = await findJudgeAssignment({
        trackId,
        judgePersonId,
        submissionId,
    });

    if (existing?.length) return;

    await insertJudgeAssignment({
        trackId,
        judgePersonId,
        submissionId,
        assignedAt: new Date().toISOString(),
    });
}

export async function updateSubmissionStatusIfThresholdReached(submissionId) {
    const scoreSheets = await fetchSubmittedJudgeRowsBySubmission(submissionId);

    const distinctJudges = new Set((scoreSheets ?? []).map((row) => row.judge_person_id).filter(Boolean));
    if (distinctJudges.size < 3) return;

    // Move from pre-scoring lifecycle once threshold is met.
    await updateSubmissionStatusIfCurrent(submissionId, "pre_scoring", "pre_scored");

    // Move from event-scoring lifecycle once threshold is met.
    await updateSubmissionStatusIfCurrent(submissionId, "event_scoring", "done");
}
