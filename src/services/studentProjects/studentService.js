import {fetchSubmissionDetails } from "./studentApi";


// export async function getStudentProjects(personId) {
//     try {
//         const projects = await fetchStudentProjectsByPersonId(personId);
//         return projects;
//     } catch (error) {
//         console.error("Error fetching student projects:", error);
//         throw error;
//     }
// }

export async function getStudentProjectInfo(submissionId) {
    try {
        const project_info = await fetchSubmissionDetails(submissionId);
        return project_info;
    } catch (error) {
        console.error("Error fetching student project info:", error);
        throw error;
    }       
}
