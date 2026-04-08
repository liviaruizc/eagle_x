import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { getAuthIntent } from "../../services/loginAuth/authIntent.js";
import { fetchPersonByEmail, fetchPersonRoles } from "../../services/loginAuth/authApi.js";
import FGCUlogo from "../../assets/FGCU logo.jpg";


export default function LoginEmailPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const selectedRole = getAuthIntent();

    if (!selectedRole) {
        navigate("/login");
        return null;
    }

    async function handleContinue(e) {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const person = await fetchPersonByEmail(email);

            if (!person) {
                throw new Error("Account not found.");
            }

            const roles = await fetchPersonRoles(person.person_id);
            const requiredRole = selectedRole.toString().trim().toUpperCase();
            const normalizedRoles = roles.map((role) => role.toString().trim().toUpperCase());

            if (!normalizedRoles.includes(requiredRole)) {
                throw new Error(`You do not have the ${selectedRole} role on this account.`);
            }

            if (!person.auth_user_id) {
                navigate("/set-password", { state: { email } });
            } else {
                navigate("/login-password", { state: { email, role: selectedRole } });
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
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
                        Sign In
                    </h1>
                    <p className="text-sm text-[#55616D] mt-1">
                        Enter your email to continue
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleContinue} className="space-y-4">

                    {/* Email Input */}
                    <input
                        type="email"
                        required
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                            disabled={isLoading}
                        >
                            {isLoading ? "Checking..." : "Continue"}
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