# FGCU - Judging Platform

FGCU Scoring System is a web application built for Florida Gulf Coast University to manage and run project judging events. It handles the full lifecycle of a judging event: student project submission, judge assignment, real-time scoring, and ranked results reporting.

---

## What it does

### For Admins
- Create and manage events and tracks (e.g. undergraduate research, graduate research)
- Import student submissions in bulk
- Configure rubrics per track with custom criteria, scoring types (numeric scale, true/false, dropdown), and scoring phases (pre-scoring, event scoring, or both)
- Assign physical table numbers and sessions to submissions
- Configure facet filters (e.g. department, college) to segment judges and projects
- View and export ranked results by overall score, rubric category, or scoring phase
- Drill into individual submission evaluations in a tabular view with per-question scores from every judge

### For Judges
- Self-register via a kiosk flow tied to a specific event
- Select a track and see a live queue of eligible submissions, filtered by assigned facets
- Score projects using the track's rubric — supports numeric scale, true/false, and dropdown answer types
- Return to "My Scores" to review or edit a previously submitted evaluation
- See real-time "currently being scored" indicators to avoid scoring collisions

### For Students
- Log in to view their submitted project
- Fill out completion data and facet information (department, category, etc.)
- Upload a poster file that judges can view during scoring

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Routing | React Router v6 |
| Auth | Supabase Auth with email/password + password reset flow |

---

## Architecture

```
src/
  app/           # Router, ProtectedRoute, RoleRoute
  pages/
    auth/        # Login, set password, forgot/reset password
    admin/       # Event management, projects, rubrics, results
    judge/       # Queue, scoring form, scores history
    student/     # Project view, completion form, poster upload
  components/
    ui/          # Shared components (Button, Card, CriterionInfoTooltip, etc.)
    rubric/      # Rubric form editor and criterion components
    layout/      # App shell and navigation
  services/
    loginAuth/   # Auth session and person lookup
    score/       # Scoring context, submission, workflow
    rubric/      # Rubric CRUD and track assignment
    results/     # Track results aggregation and ranking
    evaluations/ # Per-submission evaluation detail
    queue/       # Judge queue filtering and eligible submissions
    admin/       # Admin event/project views
    track/       # Track metadata helpers
  lib/
    supabaseClient.js   # Supabase client singleton
supabase/
  migrations/
    20260408_rls_policies.sql  # Full RLS policy set (safe to re-run)
```

---

## Key concepts

**Scoring phases** — Criteria are tagged as `pre_scoring`, `event_scoring`, or `both`. The scoring form only shows criteria relevant to the current event phase, so the same rubric works for both an online pre-review and the in-person event day.

**Facet filters** — Judges can be assigned to specific departments or categories via facets. The queue filters automatically to show only eligible submissions based on those assignments, and admins can filter the project list and results by the same facets.

**Score locking** — If a judge opens a submission for scoring, a heartbeat marks it as "being scored" in the database. Other judges see a badge in their queue and are redirected away if they try to open the same submission simultaneously. The lock clears on submit or when the judge leaves the page.

**Results ranking** — After scoring, admins see ranked submissions with average scores computed across all submitted evaluations. Rankings can be filtered by facet, viewed by scoring phase, and broken down by rubric category. Each row links to a detailed evaluation table showing one row per judge with Q_1, Q_2… columns for each rubric criterion.

**RLS policies** — All database access is controlled via Supabase Row Level Security. Judges can only write their own score sheets and score items. Students can only update their own submissions. Admins have full write access. The policy file is idempotent (drops before recreating) and safe to re-run against production.

---

## Running locally

```bash
npm install
npm run dev
```

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

To enable verbose debug logging in development:

```
VITE_DEBUG_LOGS=true
```
