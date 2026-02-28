export function setAuthIntent(role) {
    sessionStorage.setItem("auth_intent_role", role);
}

export function getAuthIntent() {
    return sessionStorage.getItem("auth_intent_role");
}

export function clearAuthIntent() {
    sessionStorage.removeItem("auth_intent_role");
}