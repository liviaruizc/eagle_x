import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import ProjectsPage from "../pages/ProjectsPage.jsx";
import QueuePage from "../pages/QueuePage.jsx";
import ScorePage from "../pages/ScorePage.jsx";
import JudgePage from "../pages/JudgePage.jsx";
import AdminPage from "../pages/AdminPage.jsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/queue" element={<QueuePage />} />
                <Route path="/judges" element={<JudgePage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* Score page for a specific project */}
                <Route path="/score/:projectId" element={<ScorePage />} />
            </Routes>
        </BrowserRouter>
    );
}
