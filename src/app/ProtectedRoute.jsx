import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
    const location = useLocation();
    const personId = sessionStorage.getItem("auth_person_id");
    const profileComplete = sessionStorage.getItem("profile_complete");

    if (!personId) {
        return <Navigate to="/login" replace />;
    }

    if (profileComplete === "false" && location.pathname !== "/complete-profile") {
        return <Navigate to="/complete-profile" replace />;
    }

    return <Outlet />;
}