import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import Button from "../../components/ui/Button.jsx";
import FGCUlogo from "../../assets/FGCU logo.jpg";

function validatePasswordRequirements(value) {
    if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
    if (!/[0-9]/.test(value)) return "Password must include at least one number.";
    return "";
}

export default function SetPasswordPage() {
    const location = useLocation();
    const { email } = location.state ?? {};

    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-[#55616D]">
                    Email not provided!
                </p>
            </div>
        );
    }

    async function handleSetPassword(e) {
        e.preventDefault();
        setError("");

        const passwordValidationError = validatePasswordRequirements(password);
        if (passwordValidationError) {
            setError(passwordValidationError);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match. Please re-enter both fields.");
            return;
        }

        setLoading(true);

        try {
            const normalizedEmail = email.toString().trim().toLowerCase();

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
            });

            if (signUpError) throw signUpError;

            const authUserId = data?.user?.id;
            if (!authUserId) {
                throw new Error("Auth account creation did not return a user id.");
            }

            const { error: updateError } = await supabase
                .from("person")
                .update({ auth_user_id: authUserId })
                .eq("email", normalizedEmail);

            if (updateError?.code === "22P02") {
                throw new Error(
                    "Database column person.auth_user_id has the wrong type. It must store UUID values from Supabase Auth."
                );
            }

            if (updateError) throw updateError;

            navigate("/login");

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
                        Set Your Password
                    </h1>
                    <p className="text-sm text-[#55616D] mt-1">
                        {email}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSetPassword} className="space-y-4">

                    <div className="rounded-lg border border-[#004785]/20 bg-[#004785]/5 p-3 text-xs text-[#1F2D3A]">
                        <p className="font-semibold text-[#004785]">Password creation guide</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Use at least 8 characters.</li>
                            <li>Include at least one uppercase letter.</li>
                            <li>Include at least one lowercase letter.</li>
                            <li>Include at least one number.</li>
                            <li>Avoid using personal info like your name or email.</li>
                        </ul>
                    </div>

                    {/* Password Input */}
                    <input
                        type="password"
                        name="new-password"
                        autoComplete="new-password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                        className="
                            w-full border border-[#55616D]/40 rounded-lg p-3
                            focus:outline-none focus:ring-2 focus:ring-[#00794C]
                            transition
                        "
                    />
                    <p className="text-xs text-[#55616D]">
                        Use at least 8 characters with one uppercase letter, one lowercase letter, and one number.
                    </p>

                    <input
                        type="password"
                        name="confirm-new-password"
                        autoComplete="new-password"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        required
                        className="
                            w-full border border-[#55616D]/40 rounded-lg p-3
                            focus:outline-none focus:ring-2 focus:ring-[#00794C]
                            transition
                        "
                    />

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
                            {loading ? "Setting..." : "Set Password"}
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