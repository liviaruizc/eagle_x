import { fetchStudentProjectsByPersonId } from "./studentApi";


export async function getStudentProjects(personId) {
    try {
        const projects = await fetchStudentProjectsByPersonId(personId);
        return projects;
    } catch (error) {
        console.error("Error fetching student projects:", error);
        throw error;
    }
}