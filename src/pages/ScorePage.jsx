import { useMemo, useState } from 'react';
import RubricForm from '../components/scoring/RubricForm';
import { questionsRubric } from '../domain/rubric/questionsRubric';
import { calculateTotal, validateAnswers } from "../domain/rubric/scoring.js";
import Button from "../components/ui/Button.jsx";
import {useNavigate, useParams} from "react-router-dom";
import { submitScore } from "../services/scoreService.js";
import { mockJudge } from "../mock/judge.js";
import { HandlePullNext } from "../services/queueService";



export default function ScorePage() {

    const { projectId } = useParams();
    const [judgeName, setJudgeName] = useState('');
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState("");

    const judgeId = mockJudge.judgeId;
    const total = useMemo(() => calculateTotal(answers, questionsRubric), [answers]);
    const navigate = useNavigate();

    function handleChange(questionId, value) {
        setAnswers((prev) => ({...prev, [questionId]: value}));
    }

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        // Validate Judge Name
        if (!judgeName.trim()) {
            setError("Please enter your name.");
            return;
        }

        // Validate all rubric questions answered
        const result = validateAnswers(answers, questionsRubric);
        if (!result.ok) {
            setError("Please answer all rubric questions.");
            return;
        }

        // Submit Score
        submitScore(judgeId, projectId);

        // Confirmation + redirect
        console.log({ judgeName, answers, total });
        alert("Submitted!")
        navigate("/queue")
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6">
                <h1 className="text-2x1 font-bold">Scoring Project</h1>
                <p className="mt-2 text-gray-600">
                    Project ID: {projectId}
                </p>
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl p-6">
                <header className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Score Poster</h1>
                        <p className="mt-1 text-sm text-gray-600">Total score: {total}</p>
                    </div>
                </header>

                <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
                    <label className="text-sm font-medium">Judge name</label>
                    <input
                        value={judgeName}
                        onChange={(e) => setJudgeName(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2"
                        placeholder="Enter your name"
                    />
                </div>

                <div className="mt-6">
                    <RubricForm answers={answers} onChange={handleChange} />
                </div>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                <div className="mt-6 flex justify-end">
                    <Button
                        type="submit" variant="secondary">Submit</Button>
                </div>
            </form>
        </div>
        </div>
    );
}