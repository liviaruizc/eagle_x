import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { signInWithPassword } from "../../services/loginAuth/authService.js";
import { fetchPersonByEmail } from "../../services/loginAuth/authApi.js";
import FGCUlogo from "../../assets/FGCU logo.jpg";

export default function LoginPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { email, role } = location.state ?? {};

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!email || !role) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-[#55616D]">
                    Missing login context. Please start again.
                </p>
            </div>
        );
    }

    async function handleLogin(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await signInWithPassword(email, password);

            if (!user) {
                throw new Error("Authentication failed.");
            }

            const person = await fetchPersonByEmail(email);

            if (!person) {
                throw new Error("User profile not found.");
            }

            sessionStorage.setItem("auth_user_id", user.id);
            sessionStorage.setItem("auth_person_id", person.person_id);
            sessionStorage.setItem("auth_role", role);

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
        <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md space-y-6">

                {/* Logo */}
                <div className="w-full bg-white rounded-xl shadow-sm p-4 flex justify-center items-center">
                    <img
                        src={FGCUlogo}
                        alt="FGCU Logo"
                        className="w-full h-auto object-contain"
                    />
                </div>

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-[#004785]">
                        Enter Password
                    </h1>
                    <p className="text-md text-[#55616D] mt-3">
                        {email}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">

                    {/* Password Input */}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="
                            w-full border border-[#55616D]/40 rounded-lg p-2
                            focus:outline-none focus:ring-2 focus:ring-[#00794C]
                            transition
                        "
                    />

                    {/* Forgot Password */}
                    <div className="text-left">
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password", { state: { email } })}
                            className="text-sm text-[#004785] hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Login"}
                        </Button>
                    </div>
                </form>

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-600 text-center">
                        {error}
                    </p>
                )}

            </div>
        </div>
    );
}