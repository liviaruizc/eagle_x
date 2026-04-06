import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ProjectsPage from "../pages/ProjectsPage.jsx";
import QueuePage from "../pages/QueuePage.jsx";
import ScorePage from "../pages/ScorePage.jsx";
import JudgePage from "../pages/JudgePage.jsx";
import AdminPage from "../pages/AdminPage.jsx";
import CreateEventPage from "../pages/CreateEventPage.jsx";
import EventDetailsPage from "../pages/EventDetailsPage.jsx";
import AdminJudgesPage from "../pages/AdminJudgesPage.jsx";
import AdminProjectsPage from "../pages/AdminProjectsPage.jsx";
import TrackSubmissionsPage from "../pages/TrackSubmissionsPage.jsx";
import TrackRubricsOverviewPage from "../pages/TrackRubricsOverviewPage.jsx";
import TrackRubricCreatePage from "../pages/TrackRubricCreatePage.jsx";
import TrackRubricEditPage from "../pages/TrackRubricEditPage.jsx";
import JudgeSignupPage from "../pages/judgeSignup/JudgeSignupPage.jsx";
import TrackResultsPage from "../pages/TrackResultsPage.jsx";
import TrackSelection from "../pages/TrackSelectPage.jsx";

import RoleSelectionPage from '../pages/LoginProcess/RoleSelectionPage.jsx';
import LoginEmailPage from '../pages/LoginProcess/LoginEmailPage.jsx';
import LoginSetPassword from '../pages/LoginProcess/LoginSetPassword.jsx';
import LoginAfterVerified from '../pages/LoginProcess/LoginAfterVerified.jsx';
import CompleteProfilePage from '../pages/LoginProcess/CompleteProfilePage.jsx';

import StudentDashboard from '../pages/StudentPage.jsx';
import StudentEventProjectsPage from '../pages/StudentProjectsPage.jsx';
import UploadPosterPage from '../pages/UploadPosterPage.jsx';
import StudentProjectDetails from '../pages/StudentProjectInfo.jsx';
import StudentCompletionPage from '../pages/StudentCompletionPage.jsx';

import ProtectedRoute from "./ProtectedRoute.jsx";
import PublicRoute from "./PublicRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';

import AppLayout from "../components/layout/AppLayout.jsx";
import SubmissionEvaluationsPage from '../pages/SubmissionEvaluationsPage.jsx';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ================= PUBLIC ROUTES ================= */}
                <Route element={<PublicRoute />}>
                    <Route path="/" element={<RoleSelectionPage />} />
                    <Route path="/login" element={<RoleSelectionPage />} />
                    <Route path="/login/email" element={<LoginEmailPage />} />
                    <Route path="/set-password" element={<LoginSetPassword />} />
                    <Route path="/login-password" element={<LoginAfterVerified />} />
                </Route>

                {/* ================= PROTECTED ROUTES ================= */}
                <Route element={<ProtectedRoute />}>

                    <Route path="/complete-profile" element={<CompleteProfilePage />} />
                    
                    <Route element={<AppLayout />}>
                        {/* General */}
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/queue" element={<QueuePage />} />
                        <Route path="/queue?trackId=:trackId" element={<QueuePage />} />

                        {/* Student */}
                        <Route element={<RoleRoute allowedRoles={["student"]} />}>
                            <Route path="/student" element={<StudentDashboard />} />
                            <Route path="/students/:eventInstanceId/projects" element={<StudentEventProjectsPage />} />
                            <Route path="/students/:eventInstanceId/complete-data" element={<StudentCompletionPage />} />
                            <Route path="/students/projects/:submissionId" element={<StudentProjectDetails />} />
                            <Route path="/students/projects/:submissionId/upload-poster" element={<UploadPosterPage />} />
                        </Route>
                   

                        {/* Judge */}
                        <Route element={<RoleRoute allowedRoles={["judge"]} />}>
                            <Route path="/judge" element={<JudgePage />} />
                            <Route path="/judges/signup/:eventInstanceId" element={<JudgeSignupPage />} />
                            <Route path="/judges/:eventInstanceId/tracks" element={<TrackSelection />} />
                            <Route path="/score/:projectId" element={<ScorePage />} />
                        </Route>

                        {/* Admin */}
                        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
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
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/submissions/:submissionId/evaluations"
                                element={<SubmissionEvaluationsPage />} 
                            />
                        </Route>

                     </Route>
                    {/* Admin */}
                    <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/admin/create-event" element={<CreateEventPage />} />
                        <Route path="/admin/events/:eventInstanceId" element={<EventDetailsPage />} />
                        <Route
                            path="/admin/events/:eventInstanceId/judges"
                            element={<AdminJudgesPage />}
                        />
                        <Route
                            path="/admin/events/:eventInstanceId/projects"
                            element={<AdminProjectsPage />}
                        />
                        <Route
                            path="/admin/events/:eventInstanceId/tracks/:trackId/projects"
                            element={<AdminProjectsPage />}
                        />
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
                    </Route>

                    {/* Scoring */}
                    

                    {/* Fallback for unmatched routes */}
                    {/* <Route path="*" element={<NotFoundPage />} /> */}
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}