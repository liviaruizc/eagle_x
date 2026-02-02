import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { pullNext } from "../services/queueService.js";
import {mockJudge} from "../mock/judge.js";

export default function QueuePage() {

    const navigate = useNavigate();
    const judgeId = mockJudge.judgeId;

    /**
     * Calls pullNext function to check for next available projects.
     */
    function handlePullNext() {
        const project = pullNext(judgeId);

        console.log(project);

        if (!project) {
            alert("No projects available right now.")
            return;
        }

        navigate(`/score/${project.projectId}`);
    }

    return (
        <div>
            <Button variant="primary" onClick={handlePullNext}>
                Pull Next
            </Button>
        </div>
    );
}
