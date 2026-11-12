import { useNavigate } from "react-router";
import Button from "./Button.jsx";

export default function NavButton({ to, children }) {
    const navigate = useNavigate();

    return (
        <Button onClick={() => navigate(to)} variant="primary">
            {children}
        </Button>
    );
}
