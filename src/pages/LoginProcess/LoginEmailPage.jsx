import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { getAuthIntent } from "../../services/loginAuth/authIntent.js";
import { fetchPersonByEmail, fetchPersonRoles } from "../../services/loginAuth/authApi.js";

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

            const roles = await fetchPersonRoles(person.person_id);

            console.log("Roles: " + roles.join(", "));

            // roles example: ["student", "judge"]

            if (!roles.includes(selectedRole.toUpperCase())) {
                throw new Error("You do not have permission to access this role.");
            }
            
            if (!person) {
                throw new Error("Account not found.");
            }
            else if (!person.auth_user_id) {
                navigate("/set-password", { state: { email} });
            }
            else {
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded shadow">
                <h1 className="text-2xl font-bold mb-2">
                    Sign In
                </h1>

                <p className="text-sm text-gray-600 mb-6">
                    Enter your email to continue
                </p>

                <form onSubmit={handleContinue} className="space-y-4">
                    <input
                        type="email"
                        required
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded p-3"
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Checking..." : "Continue"}
                    </Button>
                </form>

                {error && (
                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}