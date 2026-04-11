import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth
import RoleSelectionPage from '../pages/auth/RoleSelectionPage.jsx';
import LoginEmailPage from '../pages/auth/LoginEmailPage.jsx';
import LoginSetPassword from '../pages/auth/LoginSetPassword.jsx';
import LoginAfterVerified from '../pages/auth/LoginAfterVerified.jsx';
import CompleteProfilePage from '../pages/auth/CompleteProfilePage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';

// Judge
import JudgePage from '../pages/judge/JudgePage.jsx';
import TrackSelection from '../pages/judge/TrackSelectPage.jsx';
import QueuePage from '../pages/judge/QueuePage.jsx';
import JudgeProfilePage from '../pages/judge/JudgeProfilePage.jsx';
import JudgeScoresPage from '../pages/judge/JudgeScoresPage.jsx';
import JudgeSignupPage from '../pages/judge/signup/JudgeSignupPage.jsx';
import ScorePage from '../pages/judge/score/ScorePage.jsx';

// Admin
import AdminPage from '../pages/admin/AdminPage.jsx';
import AdminJudgesPage from '../pages/admin/AdminJudgesPage.jsx';
import AdminProjectsPage from '../pages/admin/AdminProjectsPage.jsx';
import CreateEventPage from '../pages/admin/CreateEventPage.jsx';
import EventDetailsPage from '../pages/admin/EventDetailsPage.jsx';
import SubmissionEvaluationsPage from '../pages/admin/SubmissionEvaluationsPage.jsx';
import TrackSubmissionsPage from '../pages/admin/track/TrackSubmissionsPage.jsx';
import TrackRubricsOverviewPage from '../pages/admin/track/TrackRubricsOverviewPage.jsx';
import TrackRubricCreatePage from '../pages/admin/track/TrackRubricCreatePage.jsx';
import TrackRubricEditPage from '../pages/admin/track/TrackRubricEditPage.jsx';
import TrackResultsPage from '../pages/admin/track/TrackResultsPage.jsx';

// Student
import StudentDashboard from '../pages/student/StudentPage.jsx';
import StudentEventProjectsPage from '../pages/student/StudentProjectsPage.jsx';
import StudentProjectDetails from '../pages/student/StudentProjectInfo.jsx';
import StudentCompletionPage from '../pages/student/StudentCompletionPage.jsx';
import UploadPosterPage from '../pages/student/UploadPosterPage.jsx';

// App shell
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';

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
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* ================= PROTECTED ROUTES ================= */}
                <Route element={<ProtectedRoute />}>

                    <Route path="/complete-profile" element={<CompleteProfilePage />} />

                    <Route element={<AppLayout />}>

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
                            <Route path="/queue" element={<QueuePage />} />
                            <Route path="/score/:projectId" element={<ScorePage />} />
                            <Route path="/judge/profile" element={<JudgeProfilePage />} />
                            <Route path="/judge/scores" element={<JudgeScoresPage />} />
                        </Route>

                        {/* Admin */}
                        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                            <Route path="/admin" element={<AdminPage />} />
                            <Route path="/admin/create-event" element={<CreateEventPage />} />
                            <Route path="/admin/events/:eventInstanceId" element={<EventDetailsPage />} />
                            <Route path="/admin/events/:eventInstanceId/judges" element={<AdminJudgesPage />} />
                            <Route path="/admin/events/:eventInstanceId/projects" element={<AdminProjectsPage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/projects" element={<AdminProjectsPage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/rubrics" element={<TrackRubricsOverviewPage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/rubrics/create" element={<TrackRubricCreatePage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/rubrics/:rubricId/edit" element={<TrackRubricEditPage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/submissions" element={<TrackSubmissionsPage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/results" element={<TrackResultsPage />} />
                            <Route path="/admin/events/:eventInstanceId/tracks/:trackId/submissions/:submissionId/evaluations" element={<SubmissionEvaluationsPage />} />
                        </Route>

                    </Route>

                    <Route path="/unauthorized" element={<UnauthorizedPage />} />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}
