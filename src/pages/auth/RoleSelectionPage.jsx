import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import { setAuthIntent } from "../../services/loginAuth/authIntent.js";
import FGCUlogo from "../../assets/FGCU logo.jpg";

export default function RoleSelectionPage() {
    const navigate = useNavigate();

    function handleRoleSelect(role) {
        setAuthIntent(role);
        navigate("/login/email");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md text-center space-y-6">

                {/* Logo (same style as sidebar) */}
                <div className="w-full bg-white rounded-xl shadow-sm p-4 flex justify-center items-center">
                    <img
                        src={FGCUlogo}
                        alt="FGCU Logo"
                        className="w-full h-auto object-contain"
                    />
                </div>

                

                <p className="text-[#55616D]">
                    Select how you will use the system
                </p>

                {/* Buttons */}
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
                        variant="primary"
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