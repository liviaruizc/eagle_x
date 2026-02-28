import { supabase } from "../../lib/supabaseClient.js";
import { fetchPersonRoles } from "./authApi.js";

export async function signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data.user;
}

export async function createPasswordForPreloadedUser(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;
    return data.user;
}

export async function getCurrentUser() {
    const personId = sessionStorage.getItem("auth_person_id");

    if (!personId) {
        return null;
    }

    const roles = await fetchPersonRoles(personId);

    return {
        person_id: personId,
        roles,
    };
}
export async function getCurrentUserWithRoles() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    const user = data.user;
    if (!user) return null;

    const personId = sessionStorage.getItem("auth_person_id");
    if (!personId) return null;

    const roles = await fetchPersonRoles(personId);

    return {
        user,
        personId,
        roles,
    };
}