import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { setAuthIntent } from "../../services/loginAuth/authIntent.js";

export default function RoleSelectionPage() {
    const navigate = useNavigate();

    function handleRoleSelect(role) {
        setAuthIntent(role);
        navigate("/login/email");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded shadow text-center">
                <h1 className="text-3xl font-bold mb-6">
                    Welcome
                </h1>

                <p className="text-gray-600 mb-6">
                    Select how you will use the system
                </p>

                <div className="space-y-4">
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleRoleSelect("student")}
                    >
                        Login as Student
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleRoleSelect("judge")}
                    >
                        Login as Judge
                    </Button>

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => handleRoleSelect("admin")}
                    >
                        Login as Admin
                    </Button>
                </div>
            </div>
        </div>
    );
}