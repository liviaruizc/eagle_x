import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    calculateScoreTotal,
    fetchScoringContext,
    submitScoreSheet,
    validateCriterionResponses,
} from "../services/score/scoreService.js";
import { getJudgeSession } from "../services/judgeSession.js";
import ScorePageView from "./score/ScorePageView.jsx";

export default function ScorePage() {
    const { projectId: submissionId } = useParams();
    const [submissionTitle, setSubmissionTitle] = useState("Submission");
    const [trackId, setTrackId] = useState(null);
    const [rubricId, setRubricId] = useState(null);
    const [rubricName, setRubricName] = useState("Rubric");
    const [criteria, setCriteria] = useState([]);
    const [responsesByCriterionId, setResponsesByCriterionId] = useState({});
    const [overallComment, setOverallComment] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const judgeSession = getJudgeSession();
    const judgeId = judgeSession?.personId;

    const total = useMemo(
        () => calculateScoreTotal(criteria, responsesByCriterionId),
        [criteria, responsesByCriterionId]
    );

    const navigate = useNavigate();

    useEffect(() => {
        async function loadScoringContext() {
            setError("");
            setIsLoading(true);

            if (!judgeId) {
                setError("No active judge profile found. Please sign up first.");
                setIsLoading(false);
                return;
            }

            try {
                const context = await fetchScoringContext(submissionId, judgeId);
                setSubmissionTitle(context.submissionTitle || "Submission");
                setTrackId(context.trackId);
                setRubricId(context.rubricId);
                setRubricName(context.rubricName || "Rubric");
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
                console.error(loadError);
                setError(loadError.message || "Could not load scoring form.");
            } finally {
                setIsLoading(false);
            }
        }

        loadScoringContext();
    }, [judgeId, submissionId]);

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

            alert("Submitted!");
            navigate("/queue");
        } catch (submitError) {
            console.error(submitError);
            setError("Could not submit score. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ScorePageView
            submissionTitle={submissionTitle}
            rubricName={rubricName}
            total={total}
            isLoading={isLoading}
            criteria={criteria}
            responsesByCriterionId={responsesByCriterionId}
            overallComment={overallComment}
            error={error}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onValueChange={handleValueChange}
            onCommentChange={handleCommentChange}
            onOverallCommentChange={setOverallComment}
        />
    );
}