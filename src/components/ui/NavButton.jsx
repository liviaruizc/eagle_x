import { useNavigate } from 'react-router-dom';
import Button from "./Button.jsx";

export default function NavButton({ to, children}) {
    const navigate = useNavigate();

    return (
        <Button
            onclick={() => navigate(to)}
            variant="outline-primary"
            >
            {children}
        </Button>
    );
}