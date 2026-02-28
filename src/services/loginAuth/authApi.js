import { supabase } from "../../lib/supabaseClient.js";

export async function fetchPersonByEmail(email) {
  const { data, error } = await supabase
    .from("person")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function linkAuthUserToPerson(personId, authUserId) {
  const { error } = await supabase
    .from("person")
    .update({ auth_user_id: authUserId })
    .eq("person_id", personId);

  if (error) throw error;
}

export async function fetchPersonRoles(personId) {
    const { data, error } = await supabase
        .from("person_event_role")
        .select(`
            event_role (
                event_role_id,
                code,
                name
            )
        `)
        .eq("person_id", personId)
        .eq("is_active", true);

    if (error) throw error;

    return (data ?? []).map(row => row.event_role?.code);
}