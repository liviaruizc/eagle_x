import { mockProjects } from "../mock/projects.js";

export function submitScore(judgeId, projectId) {
    const project = mockProjects.find((p) => p.projectId === projectId);

    if (!project) {
        return null;
    }

    //prevent duplicates
    if (project.scoredBy.includes(judgeId)) {
        return project;
    }

    project.scoredBy.push(judgeId);
    project.scoreCount += 1;

    if (project.scoreCount >= 3 ) {
        project.status = "done";
    } else {
        project.status = "available";
    }

    return project;
}