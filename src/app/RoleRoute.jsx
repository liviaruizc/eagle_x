import { Navigate, Outlet } from "react-router-dom";

export default function RoleRoute({ allowedRoles }) {
    const role = sessionStorage.getItem("auth_role");

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}