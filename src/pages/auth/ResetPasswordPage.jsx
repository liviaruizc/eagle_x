import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import Button from "../../components/ui/Button.jsx";
import FGCUlogo from "../../assets/FGCU logo.jpg";

export default function ResetPasswordPage() {
    const navigate = useNavigate();

    const [ready, setReady] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // Supabase processes the recovery token from the URL hash automatically.
    // Wait for the PASSWORD_RECOVERY event before showing the form.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) throw updateError;

            setDone(true);
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
                    <h1 className="text-3xl font-bold text-[#004785]">Reset Password</h1>
                    <p className="text-sm text-[#55616D] mt-1">Enter your new password below.</p>
                </div>

                {done ? (
                    <div className="space-y-4">
                        <p className="text-sm text-[#00794C]">
                            Password updated successfully. You can now log in with your new password.
                        </p>
                        <Button variant="primary" className="w-full" onClick={() => navigate("/login")}>
                            Go to Login
                        </Button>
                    </div>
                ) : !ready ? (
                    <p className="text-sm text-[#55616D] text-center py-4">Verifying reset link...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            required
                            placeholder="New password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full border border-[#55616D]/40 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00794C] transition"
                        />
                        <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            className="w-full border border-[#55616D]/40 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#00794C] transition"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Set New Password"}
                        </Button>

                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    </form>
                )}

            </div>
        </div>
    );
}
