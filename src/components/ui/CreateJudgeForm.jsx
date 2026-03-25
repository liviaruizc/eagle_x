import { useState } from "react";
import Button from "./Button.jsx";
import { createJudgeOrAdmin } from "../../services/judgeSignup/adminJudgeService.js";

export default function CreateJudgeForm({ eventInstanceId, onJudgeCreated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState("judge");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSuccessMessage("");
        setIsSubmitting(true);

        try {
            const result = await createJudgeOrAdmin({
                email,
                displayName,
                role,
                eventInstanceId,
            });

            setSuccessMessage(
                `Created ${role === "admin" ? "admin" : "judge"} "${displayName}" (${email}). They can now log in and set their password.`
            );

            // Reset form
            setEmail("");
            setDisplayName("");
            setRole("judge");

            // Notify parent if callback provided
            if (onJudgeCreated) {
                onJudgeCreated(result);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Could not create judge. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="rounded border p-3">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left font-semibold text-gray-700 hover:text-gray-900"
            >
                {isOpen ? "▼" : "▶"} Create Judge or Admin
            </button>

            {isOpen && (
                <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                    <div>
                        <label className="text-sm text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="judge@example.com"
                            className="mt-1 w-full rounded border p-2"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Smith"
                            className="mt-1 w-full rounded border p-2"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-700">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 w-full rounded border p-2"
                            disabled={isSubmitting}
                        >
                            <option value="judge">Judge</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-start gap-2 pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || !email || !displayName}
                        >
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                    </div>

                    {successMessage && (
                        <p className="rounded bg-green-50 p-3 text-sm text-green-700">{successMessage}</p>
                    )}
                    {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                </form>
            )}
        </div>
    );
}
