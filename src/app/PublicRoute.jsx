import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PublicRoute() {
    const personId = sessionStorage.getItem("auth_person_id");
    const authRole = sessionStorage.getItem("auth_role");
    const location = useLocation();

    if (personId) {
        // Prevent redirect loop
        if (location.pathname.startsWith("/login")) {
            return <Navigate to={`/${authRole}`} replace />;
        }
    }

    return <Outlet />;
}