// Score service facade for scoring pages.
//
// Responsibilities:
// - Expose stable functions used by `ScorePage`.
// - Orchestrate score-context loading and score submission workflow.
//
// Notes:
// - Raw Supabase operations live in `services/score/scoreApi`.
// - Pure scoring math/validation lives in `services/score/scoreUtils`.

import {
    deleteScoreItemsByScoreSheetId,
    fetchLatestScoreSheet,
    fetchRubricById,
    fetchRubricCriteria,
    fetchScoreItems,
    fetchSubmissionForScoring,
    fetchTrackRubrics,
    insertScoreItems,
    insertScoreSheet,
    updateScoreSheet,
} from "./scoreApi.js";
import {
    calculateScoreTotal,
    computeCriterionScore,
    mapScoreItemsToResponses,
    normalizeCriterion,
    resolveTrackRubric,
    validateCriterionResponses,
} from "./scoreUtils.js";
import {
    assertJudgeCanScoreSubmission,
    ensureJudgeAssignment,
    updateSubmissionStatusIfThresholdReached,
} from "./scoreWorkflow.js";

export {
    computeCriterionScore,
    validateCriterionResponses,
    calculateScoreTotal,
};

export async function fetchScoringContext(submissionId, judgePersonId) {
    // Enforce conflict-of-interest before loading form data.
    await assertJudgeCanScoreSubmission(submissionId, judgePersonId);

    // Resolve submission + rubric context.
    const submission = await fetchSubmissionForScoring(submissionId);
    const trackRubrics = await fetchTrackRubrics(submission.track_id);

    const selectedTrackRubric = resolveTrackRubric(trackRubrics ?? []);
    if (!selectedTrackRubric?.rubric_id) {
        throw new Error("No rubric is linked to this submission's track.");
    }

    const rubric = await fetchRubricById(selectedTrackRubric.rubric_id);
    const criteriaRows = await fetchRubricCriteria(rubric.rubric_id);

    const criteria = (criteriaRows ?? []).map(normalizeCriterion);

    // Hydrate existing responses when judge already scored this submission.
    let existingResponsesByCriterionId = {};
    if (judgePersonId) {
        const existingScoreSheet = await fetchLatestScoreSheet(submissionId, judgePersonId);

        if (existingScoreSheet?.score_sheet_id) {
            const scoreItems = await fetchScoreItems(existingScoreSheet.score_sheet_id);
            existingResponsesByCriterionId = mapScoreItemsToResponses(scoreItems);
        }
    }

    return {
        submissionId: submission.submission_id,
        submissionTitle: submission.title,
        trackId: submission.track_id,
        rubricId: rubric.rubric_id,
        rubricName: rubric.name,
        criteria,
        existingResponsesByCriterionId,
    };
}

export async function submitScoreSheet({
    submissionId,
    trackId,
    rubricId,
    judgePersonId,
    criteria,
    responsesByCriterionId,
    overallComment,
}) {
    // Re-check scoring permissions and assignment before writing.
    await assertJudgeCanScoreSubmission(submissionId, judgePersonId);
    await ensureJudgeAssignment({ trackId, judgePersonId, submissionId });

    const timestamp = new Date().toISOString();
    const existing = await fetchLatestScoreSheet(submissionId, judgePersonId);

    let scoreSheetId = existing?.score_sheet_id;

    if (scoreSheetId) {
        await updateScoreSheet(scoreSheetId, {
            rubric_id: rubricId,
            status: "submitted",
            overall_comment: overallComment || null,
            submitted_at: timestamp,
        });

        await deleteScoreItemsByScoreSheetId(scoreSheetId);
    } else {
        scoreSheetId = await insertScoreSheet({
            submission_id: submissionId,
            judge_person_id: judgePersonId,
            rubric_id: rubricId,
            status: "submitted",
            overall_comment: overallComment || null,
            submitted_at: timestamp,
        });
    }

    // Persist criterion-level score rows.
    const itemPayload = criteria.map((criterion) => {
        const response = responsesByCriterionId?.[criterion.id] ?? {};
        const resolvedScoreValue = computeCriterionScore(criterion, response.value);

        return {
            score_sheet_id: scoreSheetId,
            criterion_id: criterion.id,
            score_value: resolvedScoreValue,
            comment: response.comment || null,
        };
    });

    await insertScoreItems(itemPayload);

    // Advance submission status once score threshold is reached.
    await updateSubmissionStatusIfThresholdReached(submissionId);

    return { scoreSheetId };
}