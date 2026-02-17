const JUDGE_SESSION_KEY = "judge_session";

export function saveJudgeSession(session) {
    if (!session?.personId) return;
    localStorage.setItem(JUDGE_SESSION_KEY, JSON.stringify(session));
}

export function getJudgeSession() {
    const raw = localStorage.getItem(JUDGE_SESSION_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.personId) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearJudgeSession() {
    localStorage.removeItem(JUDGE_SESSION_KEY);
}
