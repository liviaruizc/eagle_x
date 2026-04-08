import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    calculateScoreTotal,
    clearJudgeScoringActivity,
    fetchScoringContext,
    markJudgeScoringActivity,
    submitScoreSheet,
    validateCriterionResponses,
} from "../services/score/scoreService.js";
import { getCurrentUser } from "../services/loginAuth/authService.js";
import ScorePageView from "./score/ScorePageView.jsx";

export default function ScorePage() {
    const { projectId: submissionId } = useParams();
    const [submissionTitle, setSubmissionTitle] = useState("Submission");
    const [trackId, setTrackId] = useState(null);
    const [rubricId, setRubricId] = useState(null);
    const [tableNumber, setTableNumber] = useState(null);
    const [tableSession, setTableSession] = useState(null);
    const [posterFileUrl, setPosterFileUrl] = useState(null);
    const [rubricName, setRubricName] = useState("Rubric");
    const [criteria, setCriteria] = useState([]);
    const [responsesByCriterionId, setResponsesByCriterionId] = useState({});
    const [overallComment, setOverallComment] = useState("");

    const [judgeId, setJudgeId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const total = useMemo(
        () => calculateScoreTotal(criteria, responsesByCriterionId),
        [criteria, responsesByCriterionId]
    );

    const navigate = useNavigate();

    useEffect(() => {
        async function loadScoringContext() {
            setError("");
            setIsLoading(true);

            const user = await getCurrentUser();
            const resolvedJudgeId = user?.person_id;

            if (!resolvedJudgeId) {
                setError("No active session found. Please log in first.");
                setIsLoading(false);
                return;
            }

            setJudgeId(resolvedJudgeId);

            try {
                const context = await fetchScoringContext(submissionId, resolvedJudgeId);
                setSubmissionTitle(context.submissionTitle || "Submission");
                setTrackId(context.trackId);
                setRubricId(context.rubricId);
                setRubricName(context.rubricName || "Rubric");
                setTableNumber(context.tableNumber ?? null);
                setTableSession(context.tableSession ?? null);
                setPosterFileUrl(context.posterFileUrl ?? null);
                setCriteria(context.criteria || []);

                const initialResponses = (context.criteria || []).reduce((acc, criterion) => {
                    acc[criterion.id] = {
                        value: "",
                        comment: "",
                    };
                    return acc;
                }, {});

                setResponsesByCriterionId(initialResponses);
            } catch (loadError) {
                console.error("[ScorePage] Failed to load scoring context:", loadError);
                setError(loadError.message || "Could not load scoring form.");
            } finally {
                setIsLoading(false);
            }
        }

        loadScoringContext();
    }, [submissionId]);

    useEffect(() => {
        if (!judgeId || !trackId || !submissionId) return;

        let isDisposed = false;

        async function markActive() {
            try {
                await markJudgeScoringActivity({
                    trackId,
                    judgePersonId: judgeId,
                    submissionId,
                });
            } catch (activityError) {
                if (!isDisposed) {
                    console.error("[ScorePage] Could not update scoring activity:", activityError);
                }
            }
        }

        markActive();
        const heartbeatId = window.setInterval(markActive, 2 * 60 * 1000);

        return () => {
            isDisposed = true;
            window.clearInterval(heartbeatId);
            clearJudgeScoringActivity({
                trackId,
                judgePersonId: judgeId,
                submissionId,
            }).catch((activityError) => {
                console.error("[ScorePage] Could not clear scoring activity:", activityError);
            });
        };
    }, [judgeId, trackId, submissionId]);

    function handleValueChange(criterionId, value) {
        setResponsesByCriterionId((prev) => ({
            ...prev,
            [criterionId]: {
                value,
                comment: prev?.[criterionId]?.comment || "",
            },
        }));
    }

    function handleCommentChange(criterionId, comment) {
        setResponsesByCriterionId((prev) => ({
            ...prev,
            [criterionId]: {
                value: prev?.[criterionId]?.value ?? "",
                comment,
            },
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!judgeId) {
            setError("No active judge profile found. Please sign up first.");
            return;
        }

        const result = validateCriterionResponses(criteria, responsesByCriterionId);
        if (!result.ok) {
            setError("Please answer all rubric questions.");
            return;
        }

        setIsSubmitting(true);

        try {
            await submitScoreSheet({
                submissionId,
                trackId,
                rubricId,
                judgePersonId: judgeId,
                criteria,
                responsesByCriterionId,
                overallComment,
            });

            await clearJudgeScoringActivity({
                trackId,
                judgePersonId: judgeId,
                submissionId,
            });

            alert("Submitted!");
            navigate(`/queue?trackId=${trackId}`);
        } catch (submitError) {
            console.error(submitError);
            setError("Could not submit score. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleBackToQueue() {
        if (trackId) {
            navigate(`/queue?trackId=${trackId}`);
            return;
        }

        navigate("/queue");
    }

    return (
        <ScorePageView
            submissionTitle={submissionTitle}
            rubricName={rubricName}
            tableNumber={tableNumber}
            tableSession={tableSession}
            posterFileUrl={posterFileUrl}
            total={total}
            isLoading={isLoading}
            criteria={criteria}
            responsesByCriterionId={responsesByCriterionId}
            overallComment={overallComment}
            error={error}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBackToQueue={handleBackToQueue}
            onValueChange={handleValueChange}
            onCommentChange={handleCommentChange}
            onOverallCommentChange={setOverallComment}
        />
    );
}