-- ============================================================
-- FGCU Eagle-X Scoring System — Row Level Security Policies
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run: all policies are dropped before recreation.
-- ============================================================


-- ------------------------------------------------------------
-- SECTION 1: HELPER FUNCTIONS
-- SECURITY DEFINER lets these functions bypass RLS so they can
-- safely read person / person_event_role without recursion.
-- ------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_my_person_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Returns the bigint person_id for the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_my_person_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT person_id
  FROM public.person
  WHERE auth_user_id = auth.uid()
  LIMIT 1
$$;

-- Returns true when the current user has an active ADMIN role in any event.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.person_event_role per
    JOIN public.event_role er ON er.event_role_id = per.event_role_id
    WHERE per.person_id = public.get_my_person_id()
      AND per.is_active = true
      AND (UPPER(er.code) = 'ADMIN' OR UPPER(er.name) = 'ADMIN')
  )
$$;


-- ------------------------------------------------------------
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- ------------------------------------------------------------

ALTER TABLE public.event                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_instance                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_role                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_role_facet                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facet                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facet_option                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_event_role               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_event_role_facet_value   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criterion                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_type                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_facet                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_rubric                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_table                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_author               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_facet_value          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_file                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_table_assignment     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_assignment                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_sheet                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_item                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_category                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_result                    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 3: DROP ALL EXISTING POLICIES
-- Must run before recreation to avoid "policy already exists".
-- ============================================================

-- event
DROP POLICY IF EXISTS "event_select"      ON public.event;
DROP POLICY IF EXISTS "event_admin_write" ON public.event;

-- event_instance
DROP POLICY IF EXISTS "event_instance_select"      ON public.event_instance;
DROP POLICY IF EXISTS "event_instance_admin_write" ON public.event_instance;

-- event_role
DROP POLICY IF EXISTS "event_role_select"      ON public.event_role;
DROP POLICY IF EXISTS "event_role_admin_write" ON public.event_role;

-- event_role_facet
DROP POLICY IF EXISTS "event_role_facet_select"      ON public.event_role_facet;
DROP POLICY IF EXISTS "event_role_facet_admin_write" ON public.event_role_facet;

-- facet
DROP POLICY IF EXISTS "facet_select"      ON public.facet;
DROP POLICY IF EXISTS "facet_admin_write" ON public.facet;

-- facet_option
DROP POLICY IF EXISTS "facet_option_select"      ON public.facet_option;
DROP POLICY IF EXISTS "facet_option_admin_write" ON public.facet_option;

-- track
DROP POLICY IF EXISTS "track_select"      ON public.track;
DROP POLICY IF EXISTS "track_admin_write" ON public.track;

-- track_type
DROP POLICY IF EXISTS "track_type_select"      ON public.track_type;
DROP POLICY IF EXISTS "track_type_admin_write" ON public.track_type;

-- track_facet
DROP POLICY IF EXISTS "track_facet_select"      ON public.track_facet;
DROP POLICY IF EXISTS "track_facet_admin_write" ON public.track_facet;

-- track_rubric
DROP POLICY IF EXISTS "track_rubric_select"      ON public.track_rubric;
DROP POLICY IF EXISTS "track_rubric_admin_write" ON public.track_rubric;

-- rubric
DROP POLICY IF EXISTS "rubric_select"      ON public.rubric;
DROP POLICY IF EXISTS "rubric_admin_write" ON public.rubric;

-- rubric_criterion
DROP POLICY IF EXISTS "rubric_criterion_select"      ON public.rubric_criterion;
DROP POLICY IF EXISTS "rubric_criterion_admin_write" ON public.rubric_criterion;

-- award_category
DROP POLICY IF EXISTS "award_category_select"      ON public.award_category;
DROP POLICY IF EXISTS "award_category_admin_write" ON public.award_category;

-- event_table
DROP POLICY IF EXISTS "event_table_select"      ON public.event_table;
DROP POLICY IF EXISTS "event_table_admin_write" ON public.event_table;

-- award_result
DROP POLICY IF EXISTS "award_result_select"      ON public.award_result;
DROP POLICY IF EXISTS "award_result_admin_write" ON public.award_result;

-- person
DROP POLICY IF EXISTS "person_select" ON public.person;
DROP POLICY IF EXISTS "person_insert" ON public.person;
DROP POLICY IF EXISTS "person_update" ON public.person;
DROP POLICY IF EXISTS "person_delete" ON public.person;

-- person_event_role
DROP POLICY IF EXISTS "person_event_role_select" ON public.person_event_role;
DROP POLICY IF EXISTS "person_event_role_insert" ON public.person_event_role;
DROP POLICY IF EXISTS "person_event_role_update" ON public.person_event_role;
DROP POLICY IF EXISTS "person_event_role_delete" ON public.person_event_role;

-- person_event_role_facet_value
DROP POLICY IF EXISTS "perf_value_select" ON public.person_event_role_facet_value;
DROP POLICY IF EXISTS "perf_value_insert" ON public.person_event_role_facet_value;
DROP POLICY IF EXISTS "perf_value_update" ON public.person_event_role_facet_value;
DROP POLICY IF EXISTS "perf_value_delete" ON public.person_event_role_facet_value;

-- submission
DROP POLICY IF EXISTS "submission_select" ON public.submission;
DROP POLICY IF EXISTS "submission_insert" ON public.submission;
DROP POLICY IF EXISTS "submission_update" ON public.submission;
DROP POLICY IF EXISTS "submission_delete" ON public.submission;

-- submission_author
DROP POLICY IF EXISTS "submission_author_select"      ON public.submission_author;
DROP POLICY IF EXISTS "submission_author_admin_write" ON public.submission_author;

-- submission_facet_value
DROP POLICY IF EXISTS "submission_facet_value_select" ON public.submission_facet_value;
DROP POLICY IF EXISTS "submission_facet_value_insert" ON public.submission_facet_value;
DROP POLICY IF EXISTS "submission_facet_value_update" ON public.submission_facet_value;
DROP POLICY IF EXISTS "submission_facet_value_delete" ON public.submission_facet_value;

-- submission_file
DROP POLICY IF EXISTS "submission_file_select" ON public.submission_file;
DROP POLICY IF EXISTS "submission_file_insert" ON public.submission_file;
DROP POLICY IF EXISTS "submission_file_update" ON public.submission_file;
DROP POLICY IF EXISTS "submission_file_delete" ON public.submission_file;

-- submission_table_assignment
DROP POLICY IF EXISTS "submission_table_assignment_select"      ON public.submission_table_assignment;
DROP POLICY IF EXISTS "submission_table_assignment_admin_write" ON public.submission_table_assignment;

-- judge_assignment
DROP POLICY IF EXISTS "judge_assignment_select" ON public.judge_assignment;
DROP POLICY IF EXISTS "judge_assignment_insert" ON public.judge_assignment;
DROP POLICY IF EXISTS "judge_assignment_update" ON public.judge_assignment;
DROP POLICY IF EXISTS "judge_assignment_delete" ON public.judge_assignment;

-- score_sheet
DROP POLICY IF EXISTS "score_sheet_select" ON public.score_sheet;
DROP POLICY IF EXISTS "score_sheet_insert" ON public.score_sheet;
DROP POLICY IF EXISTS "score_sheet_update" ON public.score_sheet;
DROP POLICY IF EXISTS "score_sheet_delete" ON public.score_sheet;

-- score_item
DROP POLICY IF EXISTS "score_item_select" ON public.score_item;
DROP POLICY IF EXISTS "score_item_insert" ON public.score_item;
DROP POLICY IF EXISTS "score_item_update" ON public.score_item;
DROP POLICY IF EXISTS "score_item_delete" ON public.score_item;


-- ============================================================
-- SECTION 4: READ-ONLY CONFIGURATION / REFERENCE TABLES
--
-- SELECT open to everyone (including anon) because:
--   - Login email lookup queries person before auth exists
--   - Judge self-signup reads event_role, facet, facet_option
--   - Scoring form reads rubric / track immediately after login
--
-- INSERT / UPDATE / DELETE restricted to admins only.
-- ============================================================

-- event
CREATE POLICY "event_select"      ON public.event FOR SELECT USING (true);
CREATE POLICY "event_admin_write" ON public.event FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- event_instance
CREATE POLICY "event_instance_select"      ON public.event_instance FOR SELECT USING (true);
CREATE POLICY "event_instance_admin_write" ON public.event_instance FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- event_role  (code values: ADMIN, JUDGE, STUDENT)
CREATE POLICY "event_role_select"      ON public.event_role FOR SELECT USING (true);
CREATE POLICY "event_role_admin_write" ON public.event_role FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- event_role_facet
CREATE POLICY "event_role_facet_select"      ON public.event_role_facet FOR SELECT USING (true);
CREATE POLICY "event_role_facet_admin_write" ON public.event_role_facet FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- facet
CREATE POLICY "facet_select"      ON public.facet FOR SELECT USING (true);
CREATE POLICY "facet_admin_write" ON public.facet FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- facet_option
CREATE POLICY "facet_option_select"      ON public.facet_option FOR SELECT USING (true);
CREATE POLICY "facet_option_admin_write" ON public.facet_option FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- track
CREATE POLICY "track_select"      ON public.track FOR SELECT USING (true);
CREATE POLICY "track_admin_write" ON public.track FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- track_type
CREATE POLICY "track_type_select"      ON public.track_type FOR SELECT USING (true);
CREATE POLICY "track_type_admin_write" ON public.track_type FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- track_facet
CREATE POLICY "track_facet_select"      ON public.track_facet FOR SELECT USING (true);
CREATE POLICY "track_facet_admin_write" ON public.track_facet FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- track_rubric
CREATE POLICY "track_rubric_select"      ON public.track_rubric FOR SELECT USING (true);
CREATE POLICY "track_rubric_admin_write" ON public.track_rubric FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- rubric
CREATE POLICY "rubric_select"      ON public.rubric FOR SELECT USING (true);
CREATE POLICY "rubric_admin_write" ON public.rubric FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- rubric_criterion
CREATE POLICY "rubric_criterion_select"      ON public.rubric_criterion FOR SELECT USING (true);
CREATE POLICY "rubric_criterion_admin_write" ON public.rubric_criterion FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- award_category
CREATE POLICY "award_category_select"      ON public.award_category FOR SELECT USING (true);
CREATE POLICY "award_category_admin_write" ON public.award_category FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- event_table  (physical tables at the venue)
CREATE POLICY "event_table_select"      ON public.event_table FOR SELECT USING (true);
CREATE POLICY "event_table_admin_write" ON public.event_table FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- award_result  (computed winners — all logged-in users can view)
CREATE POLICY "award_result_select"      ON public.award_result FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "award_result_admin_write" ON public.award_result FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================
-- SECTION 5: PERSON
--
-- SELECT open to everyone: login flow calls fetchPersonByEmail
--   with the anon key before the user is authenticated.
-- INSERT open to everyone: admin pre-loads persons; the judge
--   kiosk creates a person row before Supabase auth exists.
-- UPDATE: own row matched by auth_user_id, or by email when
--   auth_user_id has not been linked yet (bootstrap case), or admin.
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "person_select" ON public.person
  FOR SELECT USING (true);

CREATE POLICY "person_insert" ON public.person
  FOR INSERT WITH CHECK (true);

CREATE POLICY "person_update" ON public.person
  FOR UPDATE
  USING (
    auth_user_id = auth.uid()
    OR (auth_user_id IS NULL AND email = auth.email())
    OR public.is_admin()
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR (auth_user_id IS NULL AND email = auth.email())
    OR public.is_admin()
  );

CREATE POLICY "person_delete" ON public.person
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 6: PERSON_EVENT_ROLE
--
-- SELECT open to everyone: fetchPersonRoles is called on the
--   login email step before any Supabase auth session exists,
--   so restricting to authenticated users breaks login.
-- INSERT open (anon): judge self-signup creates this row before
--   the person has a Supabase auth session.
-- UPDATE / DELETE: admin only.
-- ============================================================

CREATE POLICY "person_event_role_select" ON public.person_event_role
  FOR SELECT USING (true);

CREATE POLICY "person_event_role_insert" ON public.person_event_role
  FOR INSERT WITH CHECK (true);

CREATE POLICY "person_event_role_update" ON public.person_event_role
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "person_event_role_delete" ON public.person_event_role
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 7: PERSON_EVENT_ROLE_FACET_VALUE
--
-- Stores judge department / college selections from signup form.
-- SELECT / UPDATE: own values (via person_event_role join) or admin.
-- INSERT open (anon): written by signup form before full auth.
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "perf_value_select" ON public.person_event_role_facet_value
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_event_role per
      WHERE per.person_event_role_id = person_event_role_facet_value.person_event_role_id
        AND per.person_id = public.get_my_person_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "perf_value_insert" ON public.person_event_role_facet_value
  FOR INSERT WITH CHECK (true);

CREATE POLICY "perf_value_update" ON public.person_event_role_facet_value
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.person_event_role per
      WHERE per.person_event_role_id = person_event_role_facet_value.person_event_role_id
        AND per.person_id = public.get_my_person_id()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_event_role per
      WHERE per.person_event_role_id = person_event_role_facet_value.person_event_role_id
        AND per.person_id = public.get_my_person_id()
    )
    OR public.is_admin()
  );

CREATE POLICY "perf_value_delete" ON public.person_event_role_facet_value
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 8: SUBMISSION
--
-- SELECT: all authenticated — judges need the full list for
--   queue filtering; students view their own.
-- INSERT: admin only (bulk Excel import).
-- UPDATE: admin, or the submission's own authors — students
--   update status / completion data via StudentCompletionPage.
--   Authorship is checked via auth_user_id or email fallback
--   for person rows not yet linked to a Supabase auth user.
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "submission_select" ON public.submission
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "submission_insert" ON public.submission
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "submission_update" ON public.submission
  FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  );

CREATE POLICY "submission_delete" ON public.submission
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 9: SUBMISSION_AUTHOR
--
-- SELECT: all authenticated (judges use this for COI check).
-- Writes: admin only — authorship is set at import time.
-- ============================================================

CREATE POLICY "submission_author_select"      ON public.submission_author FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "submission_author_admin_write" ON public.submission_author FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================
-- SECTION 10: SUBMISSION_FACET_VALUE
--
-- SELECT: all authenticated — judges use this for queue filters.
-- INSERT / UPDATE: admin (bulk import) or submission authors.
--   Uses auth_user_id or email fallback so students whose person
--   row was pre-loaded without a linked Supabase auth user can
--   still write their own facet values.
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "submission_facet_value_select" ON public.submission_facet_value
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "submission_facet_value_insert" ON public.submission_facet_value
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission_facet_value.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  );

CREATE POLICY "submission_facet_value_update" ON public.submission_facet_value
  FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission_facet_value.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission_facet_value.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  );

CREATE POLICY "submission_facet_value_delete" ON public.submission_facet_value
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 11: SUBMISSION_FILE
--
-- SELECT: all authenticated — judges view poster links on the
--   score form via the "View Poster" button.
-- INSERT / UPDATE: admin or submission authors.
--   Uses auth_user_id or email fallback (same reason as above).
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "submission_file_select" ON public.submission_file
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "submission_file_insert" ON public.submission_file
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission_file.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  );

CREATE POLICY "submission_file_update" ON public.submission_file
  FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission_file.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.submission_author sa
      JOIN public.person p ON p.person_id = sa.person_id
      WHERE sa.submission_id = submission_file.submission_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
  );

CREATE POLICY "submission_file_delete" ON public.submission_file
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 12: SUBMISSION_TABLE_ASSIGNMENT
--
-- SELECT: all authenticated — judges need table numbers shown
--   in the queue and on the score form.
-- Writes: admin only (set during event logistics setup).
-- ============================================================

CREATE POLICY "submission_table_assignment_select"      ON public.submission_table_assignment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "submission_table_assignment_admin_write" ON public.submission_table_assignment FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================
-- SECTION 13: JUDGE_ASSIGNMENT
--
-- SELECT: all authenticated — every judge reads ALL assignment
--   rows for eligible submissions to compute the "being scored"
--   badge in the queue (SCORING_ACTIVITY_TTL_MS = 5 min).
-- INSERT / UPDATE: own rows or admin.
--   Matched via person join (auth_user_id or email fallback)
--   because judge person rows may not have auth_user_id linked.
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "judge_assignment_select" ON public.judge_assignment
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "judge_assignment_insert" ON public.judge_assignment
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person p
      WHERE p.person_id = judge_assignment.person_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );

CREATE POLICY "judge_assignment_update" ON public.judge_assignment
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.person p
      WHERE p.person_id = judge_assignment.person_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person p
      WHERE p.person_id = judge_assignment.person_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );

CREATE POLICY "judge_assignment_delete" ON public.judge_assignment
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 14: SCORE_SHEET
--
-- SELECT: all authenticated — queueService counts submitted
--   score_sheets per submission for scoreCount display, and
--   scoreWorkflow checks the 3-judge threshold before advancing
--   submission status.
-- INSERT / UPDATE: own rows or admin.
--   Matched via person join (auth_user_id or email fallback).
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "score_sheet_select" ON public.score_sheet
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "score_sheet_insert" ON public.score_sheet
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person p
      WHERE p.person_id = score_sheet.judge_person_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );

CREATE POLICY "score_sheet_update" ON public.score_sheet
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.person p
      WHERE p.person_id = score_sheet.judge_person_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person p
      WHERE p.person_id = score_sheet.judge_person_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );

CREATE POLICY "score_sheet_delete" ON public.score_sheet
  FOR DELETE USING (public.is_admin());


-- ============================================================
-- SECTION 15: SCORE_ITEM
--
-- SELECT: all authenticated — admin reads all score_items to
--   compute results rankings on TrackResultsPage.
-- INSERT / UPDATE: own items only (via score_sheet join) or admin.
--   Matched via person join (auth_user_id or email fallback).
-- DELETE: admin only.
-- ============================================================

CREATE POLICY "score_item_select" ON public.score_item
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "score_item_insert" ON public.score_item
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.score_sheet ss
      JOIN public.person p ON p.person_id = ss.judge_person_id
      WHERE ss.score_sheet_id = score_item.score_sheet_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );

CREATE POLICY "score_item_update" ON public.score_item
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.score_sheet ss
      JOIN public.person p ON p.person_id = ss.judge_person_id
      WHERE ss.score_sheet_id = score_item.score_sheet_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.score_sheet ss
      JOIN public.person p ON p.person_id = ss.judge_person_id
      WHERE ss.score_sheet_id = score_item.score_sheet_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );

CREATE POLICY "score_item_delete" ON public.score_item
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.score_sheet ss
      JOIN public.person p ON p.person_id = ss.judge_person_id
      WHERE ss.score_sheet_id = score_item.score_sheet_id
        AND (p.auth_user_id = auth.uid() OR p.email = auth.email())
    )
    OR public.is_admin()
  );
