import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { signInWithPassword } from "../../services/loginAuth/authService.js";
import { fetchPersonByEmail } from "../../services/loginAuth/authApi.js";

export default function LoginPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { email, role } = location.state ?? {};

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!email || !role) {
        return <p>Missing login context. Please start again.</p>;
    }

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1️⃣ Authenticate with Supabase Auth
            const user = await signInWithPassword(email, password);

            if (!user) {
                throw new Error("Authentication failed.");
            }

            // 2️⃣ Load person profile
            const person = await fetchPersonByEmail(email);

            if (!person) {
                throw new Error("User profile not found.");
            }

            // 3️⃣ Store session info (adjust to your session system)
            sessionStorage.setItem("auth_user_id", user.id);
            sessionStorage.setItem("auth_person_id", person.person_id);
            sessionStorage.setItem("auth_role", role);

            alert(user);

            // 4️⃣ Redirect by role
            if (role === "student") navigate("/student");
            if (role === "judge") navigate("/judge");
            if (role === "admin") navigate("/admin");

        } catch (err) {
            console.error(err);
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Enter Password</h1>
            <p className="mb-4 text-gray-600">{email}</p>

            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border p-2 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                </Button>
            </form>

            {error && <p className="text-red-600 mt-3">{error}</p>}
        </div>
    );
}