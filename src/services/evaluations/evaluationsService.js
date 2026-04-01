import { fetchEvaluationsBySubmission, fetchSubmissionById } from "./evalutionsApi.js";

export async function fetchSubmissionEvaluations(submissionId) {
    const [submission, sheets] = await Promise.all([
        fetchSubmissionById(submissionId),
        fetchEvaluationsBySubmission(submissionId),
    ]);

    const evaluations = sheets.map((sheet) => {
        const scores = (sheet.score_item ?? [])
            .filter((item) => item.rubric_criterion)
            .map((item) => ({
                criterionId: item.rubric_criterion.criterion_id,
                criterionName: item.rubric_criterion.name,
                scoringPhase: item.rubric_criterion.scoring_phase,
                displayOrder: item.rubric_criterion.display_order,
                scoreValue: item.score_value,
                comment: item.comment ?? "",
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder);

        return {
            scoreSheetId: sheet.score_sheet_id,
            judgeName: sheet.judge?.display_name ?? "Unknown Judge",
            submittedAt: sheet.submitted_at,
            overallComment: sheet.overall_comment ?? "",
            scores,
        };
    });

    return {
        submissionTitle: submission.title,
        submissionStatus: submission.status,
        evaluations,
    };
}
