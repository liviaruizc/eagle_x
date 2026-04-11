import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { fetchPersonByEmail } from "../../services/loginAuth/authApi.js";
import Button from "../../components/ui/Button.jsx";
import FGCUlogo from "../../assets/FGCU logo.jpg";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState(location.state?.email ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const person = await fetchPersonByEmail(normalizedEmail);

            if (!person) {
                throw new Error("No account found with that email.");
            }

            // Person exists but never set a password — send them to the set-password flow.
            if (!person.auth_user_id) {
                navigate("/set-password", { state: { email: normalizedEmail } });
                return;
            }

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                normalizedEmail,
                { redirectTo: `${window.location.origin}/reset-password` }
            );

            if (resetError) throw resetError;

            setSent(true);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md space-y-6">

                <div className="w-full bg-white rounded-xl shadow-sm p-4 flex justify-center items-center">
                    <img src={FGCUlogo} alt="FGCU Logo" className="w-full h-auto object-contain" />
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-[#004785]">Forgot Password</h1>
                    <p className="text-sm text-[#55616D] mt-1">
                        Enter your email and we'll send you a reset link.
                    </p>
                </div>

                {sent ? (
                    <div className="space-y-4">
                        <p className="text-sm text-[#00794C]">
                            Reset link sent to <strong>{email}</strong>. Check your inbox and follow the link to set a new password.
                        </p>
                        <Button variant="primary" className="w-full" onClick={() => navigate("/login")}>
                            Back to Login
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            required
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-[#55616D]/40 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00794C] transition"
                        />

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
                                {loading ? "Sending..." : "Send Reset Link"}
                            </Button>
                        </div>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    </form>
                )}

            </div>
        </div>
    );
}
