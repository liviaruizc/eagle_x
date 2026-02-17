import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import ProjectsPage from "../pages/ProjectsPage.jsx";
import QueuePage from "../pages/QueuePage.jsx";
import ScorePage from "../pages/ScorePage.jsx";
import JudgePage from "../pages/JudgePage.jsx";
import AdminPage from "../pages/AdminPage.jsx";
import CreateEventPage from "../pages/CreateEventPage.jsx";
import EventDetailsPage from "../pages/EventDetailsPage.jsx";
import TrackSubmissionsPage from "../pages/TrackSubmissionsPage.jsx";
import TrackRubricsOverviewPage from "../pages/TrackRubricsOverviewPage.jsx";
import TrackRubricCreatePage from "../pages/TrackRubricCreatePage.jsx";
import TrackRubricEditPage from "../pages/TrackRubricEditPage.jsx";
import JudgeSignupPage from "../pages/judgeSignup/JudgeSignupPage.jsx";
import TrackResultsPage from "../pages/TrackResultsPage.jsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/queue" element={<QueuePage />} />
                <Route path="/judges" element={<JudgePage />} />
                <Route path="/judges/signup/:eventInstanceId" element={<JudgeSignupPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/create-event" element={<CreateEventPage />} />
                <Route path="/admin/events/:eventInstanceId" element={<EventDetailsPage />} />
                <Route
                    path="/admin/events/:eventInstanceId/tracks/:trackId/rubrics"
                    element={<TrackRubricsOverviewPage />}
                />
                <Route
                    path="/admin/events/:eventInstanceId/tracks/:trackId/rubrics/create"
                    element={<TrackRubricCreatePage />}
                />
                <Route
                    path="/admin/events/:eventInstanceId/tracks/:trackId/rubrics/:rubricId/edit"
                    element={<TrackRubricEditPage />}
                />
                <Route
                    path="/admin/events/:eventInstanceId/tracks/:trackId/submissions"
                    element={<TrackSubmissionsPage />}
                />
                <Route
                    path="/admin/events/:eventInstanceId/tracks/:trackId/results"
                    element={<TrackResultsPage />}
                />

                {/* Score page for a specific project */}
                <Route path="/score/:projectId" element={<ScorePage />} />
            </Routes>
        </BrowserRouter>
    );
}
