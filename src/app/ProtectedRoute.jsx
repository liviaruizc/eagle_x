import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const personId = sessionStorage.getItem("auth_person_id");

    if (!personId) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}