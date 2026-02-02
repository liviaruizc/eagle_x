import Button from "../components/ui/Button.jsx";
import {useNavigate} from "react-router-dom";

export default function JudgePage() {

    const navigate = useNavigate();

    function handleClick(url) {
        navigate(url);
    }

    return (
        <div className="judge-page text-center">
            <header className="text-5xl text-center font-bold">
                Welcome Judge
            </header>

            <Button className="flex-items-center" onClick={() => handleClick('/queue')} variant="primary">Start Judging</Button>
        </div>
    )
}