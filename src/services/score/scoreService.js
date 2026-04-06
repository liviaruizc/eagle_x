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
    fetchEventInstanceStatusByTrack,
    fetchLatestScoreSheet,
    fetchRubricById,
    fetchRubricCriteria,
    fetchScoreItems,
    fetchSubmissionPosterFileUrl,
    fetchSubmissionForScoring,
    fetchSubmissionTableAssignment,
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
    resolveAllowedScoringPhases,
    resolveTrackRubric,
    validateCriterionResponses,
} from "./scoreUtils.js";
import {
    assertJudgeCanScoreSubmission,
    clearJudgeScoringActivity,
    ensureJudgeAssignment,
    markJudgeScoringActivity,
    updateSubmissionStatusIfThresholdReached,
} from "./scoreWorkflow.js";

const DEBUG_LOGS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === "true";

export {
    computeCriterionScore,
    validateCriterionResponses,
    calculateScoreTotal,
};

export {
    markJudgeScoringActivity,
    clearJudgeScoringActivity,
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

    const [rubric, eventStatus, tableInfo, posterFileUrl] = await Promise.all([
        fetchRubricById(selectedTrackRubric.rubric_id),
        fetchEventInstanceStatusByTrack(submission.track_id),
        fetchSubmissionTableAssignment(submissionId),
        fetchSubmissionPosterFileUrl(submissionId),
    ]);

    const allowedPhases = resolveAllowedScoringPhases(eventStatus);
    const criteriaRows = await fetchRubricCriteria(rubric.rubric_id);

    if (DEBUG_LOGS) {
        console.log("[scoring] eventStatus:", eventStatus);
        console.log("[scoring] allowedPhases:", allowedPhases);
        console.log("[scoring] criteriaRows (before filter):", criteriaRows.map((r) => ({ name: r.name, scoring_phase: r.scoring_phase })));
    }

    const criteria = (criteriaRows ?? [])
        .filter((row) => allowedPhases.includes(row.scoring_phase))
        .map(normalizeCriterion);

    if (DEBUG_LOGS) {
        console.log("[scoring] criteria (after filter):", criteria.map((c) => ({ name: c.name })));
    }

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
        tableNumber: tableInfo?.table_number ?? null,
        tableSession: tableInfo?.session ?? null,
        posterFileUrl,
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