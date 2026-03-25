import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import Button from "../../components/ui/Button.jsx";
import FGCUlogo from "../../assets/FGCU logo.jpg";

export default function SetPasswordPage() {
    const location = useLocation();
    const { email } = location.state ?? {};

    const navigate = useNavigate();

    const [password, setPassword] = useState("");
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
        setLoading(true);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;

            await supabase
                .from("person")
                .update({ auth_user_id: data.user.id })
                .eq("email", email);

            alert("Password set! Please verify your email before logging in.");
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

                    {/* Password Input */}
                    <input
                        type="password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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