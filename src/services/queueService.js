import { mockProjects } from "../mock/projects.js";
import {useNavigate} from "react-router-dom";
import {mockJudge} from "../mock/judge.js";

const MIN_REQUIRED_SCORES = 3;


/**
 * Calls pullNext function to check for next available projects.
 */
export function HandlePullNext() {
    const navigate = useNavigate();
    const judgeId = mockJudge.judgeId;

    const project = pullNext(judgeId);

    if (!project) {
        alert("No projects available right now.")
        return;
    }

    navigate(`/score/${project.projectId}`);
}

/**
 * Returns the next eligible project for a judge
 * Enforces:
 * - Not supervised by judge
 * - Not already scored by judge
 * - Not complete (needs < 3 scores)
 * - Not already pulled
 */

export function pullNext(judgeId) {
    const nextProject = mockProjects.find((project) => {
        const notSupervisor = project.supervisorId !== judgeId;
        const notAlreadyScored = !project.scoredBy.includes(judgeId);
        const notComplete = project.scoreCount < 3;
        const available = project.status === "available";

        return notSupervisor && notAlreadyScored && notComplete && available;
    });

    if (!nextProject) {
        return null; // no project available
    }

    // Mark as pulled so nobody else gets it
    nextProject.status = "pulled";

    return nextProject;
}