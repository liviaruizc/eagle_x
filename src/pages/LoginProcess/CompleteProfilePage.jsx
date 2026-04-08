import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { fetchPersonById, updatePersonBasicProfile } from "../../services/loginAuth/authApi.js";

export default function CompleteProfilePage() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError("");

            try {
                const personId = sessionStorage.getItem("auth_person_id");
                if (!personId) {
                    navigate("/login", { replace: true });
                    return;
                }

                const person = await fetchPersonById(personId);
                setFirstName(String(person?.first_name || ""));
                setLastName(String(person?.last_name || ""));
            } catch (loadError) {
                console.error(loadError);
                setError(loadError.message || "Could not load your profile.");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [navigate]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const personId = sessionStorage.getItem("auth_person_id");
        if (!personId) {
            setError("Session not found.");
            return;
        }

        setSaving(true);

        try {
            await updatePersonBasicProfile(personId, firstName, lastName);
            sessionStorage.setItem("profile_complete", "true");

            const nextPath = sessionStorage.getItem("post_login_path") || "/";
            sessionStorage.removeItem("post_login_path");
            navigate(nextPath, { replace: true });
        } catch (saveError) {
            console.error(saveError);
            setError(saveError.message || "Could not save profile.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <p className="p-6 text-sm text-[#55616D]">Loading profile...</p>;
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-[#004785]">Complete Your Profile</h1>
            <p className="mt-2 text-sm text-[#55616D]">
                First name and last name are required before continuing.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <input
                    type="text"
                    required
                    placeholder="First name"
                    className="w-full rounded border p-2"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                    type="text"
                    required
                    placeholder="Last name"
                    className="w-full rounded border p-2"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />

                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving..." : "Save and Continue"}
                </Button>
            </form>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
    );
}
