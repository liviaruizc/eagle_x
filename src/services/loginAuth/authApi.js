import { supabase } from "../../lib/supabaseClient.js";

const DEBUG_LOGS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_LOGS === "true";

export async function fetchPersonByEmail(email) {
  const { data, error } = await supabase
    .from("person")
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPersonById(personId) {
  const { data, error } = await supabase
    .from("person")
    .select("person_id, email, first_name, last_name, display_name")
    .eq("person_id", personId)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePersonBasicProfile(personId, firstName, lastName) {
  const normalizedFirstName = String(firstName || "").trim();
  const normalizedLastName = String(lastName || "").trim();

  if (!normalizedFirstName || !normalizedLastName) {
    throw new Error("First name and last name are required.");
  }

  const { error } = await supabase
    .from("person")
    .update({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      display_name: `${normalizedFirstName} ${normalizedLastName}`.trim(),
    })
    .eq("person_id", personId);

  if (error) throw error;
}

export async function linkAuthUserToPerson(personId, authUserId) {
  const { error } = await supabase
    .from("person")
    .update({ auth_user_id: authUserId })
    .eq("person_id", personId);

  if (error) throw error;
}

export async function fetchPersonRoles(personId) {
  if (DEBUG_LOGS) {
    console.log("[auth] fetchPersonRoles:start", { personId });
  }

    const { data: personRoleRows, error: personRoleError } = await supabase
        .from("person_event_role")
        .select("event_role_id")
        .eq("person_id", personId)
        .eq("is_active", true);

    if (personRoleError) throw personRoleError;

    const eventRoleIds = (personRoleRows ?? [])
        .map((row) => row.event_role_id)
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value));

    if (DEBUG_LOGS) {
      console.log("[auth] fetchPersonRoles:roleLinks", {
        personId,
        roleLinkCount: personRoleRows?.length ?? 0,
        eventRoleIds,
      });
    }

    if (!eventRoleIds.length) {
        return [];
    }

    const { data: roleRows, error: roleError } = await supabase
        .from("event_role")
        .select("event_role_id, code, name")
        .in("event_role_id", eventRoleIds);

    if (roleError) throw roleError;

    const roleById = new Map(
        (roleRows ?? []).map((role) => [String(role.event_role_id), role])
    );

    // Normalize role identifiers so login checks work across different DB seeds
    // (e.g. code may be ADMIN/admin/null while name is Admin).
    const normalizedRoles = eventRoleIds
        .map((roleId) => roleById.get(roleId))
        .filter(Boolean)
        .map((role) => (role.code || role.name || "").toString().trim().toUpperCase())
        .filter(Boolean);

    if (DEBUG_LOGS) {
      console.log("[auth] fetchPersonRoles:resolved", {
        personId,
        roleRows,
        normalizedRoles,
      });
    }

    return normalizedRoles;
}