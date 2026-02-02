/**
 * Project object used throughout the app
 */

export const mockProjects = [
    {
        projectId: "p1",
        title: "Eagle X Scoring",
        supervisorId: "profA",
        scoreCount: 0,
        scoredBy: [],
        status: "available", // available, pulled, done
        groupId: "1", // foreign key
    },
    {
        projectId: "p2",
        title: "Robotics Showcase",
        supervisorId: "profB",
        scoreCount: 0,
        scoredBy: [],
        status: "available",
        groupId: "2",
    },
];