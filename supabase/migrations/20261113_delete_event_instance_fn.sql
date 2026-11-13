-- ============================================================
-- FGCU Eagle-X Scoring System — Delete Event Instance
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run: the function is replaced and grants are re-applied.
-- Requires public.is_admin() from 20260408_rls_policies.sql.
-- ============================================================


-- ============================================================
-- SECTION 1: DELETE_EVENT_INSTANCE
--
-- Deletes one event instance and every row under it in a single
-- transaction. All foreign keys are NO ACTION, so rows must be
-- deleted children-first.
--
-- Deliberately NOT deleted:
--   - event (shared by other instances of the same event)
--   - person, rubric, rubric_criterion, track_type, facet,
--     facet_option, event_role (shared across events)
--   - Files in the submission-files storage bucket. The deleted
--     submission ids are returned for a separate cleanup.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_event_instance(
  p_event_instance_id bigint,
  p_confirm_name      text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name                text;
  v_track_ids           bigint[];
  v_submission_ids      bigint[];
  v_score_sheet_ids     bigint[];
  v_table_ids           bigint[];
  v_award_category_ids  bigint[];
  v_role_ids            bigint[];
  v_counts              jsonb := '{}'::jsonb;
  v_n                   bigint;
BEGIN
  -- SECURITY DEFINER bypasses RLS, so this check is the only access control.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete an event.'
      USING ERRCODE = '42501';
  END IF;

  SELECT name
    INTO v_name
    FROM public.event_instance
   WHERE event_instance_id = p_event_instance_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event instance % was not found.', p_event_instance_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Checked here so the typed-name confirmation cannot be skipped by
  -- calling the function directly.
  IF p_confirm_name IS DISTINCT FROM v_name THEN
    RAISE EXCEPTION 'The confirmation name does not match the event name.'
      USING ERRCODE = '22023';
  END IF;

  -- Collect child ids first; they cannot be found once their parents
  -- are deleted.
  SELECT coalesce(array_agg(track_id), ARRAY[]::bigint[])
    INTO v_track_ids
    FROM public.track
   WHERE event_instance_id = p_event_instance_id;

  SELECT coalesce(array_agg(submission_id), ARRAY[]::bigint[])
    INTO v_submission_ids
    FROM public.submission
   WHERE track_id = ANY (v_track_ids);

  SELECT coalesce(array_agg(score_sheet_id), ARRAY[]::bigint[])
    INTO v_score_sheet_ids
    FROM public.score_sheet
   WHERE submission_id = ANY (v_submission_ids);

  SELECT coalesce(array_agg(table_id::bigint), ARRAY[]::bigint[])
    INTO v_table_ids
    FROM public.event_table
   WHERE event_instance_id = p_event_instance_id;

  SELECT coalesce(array_agg(award_category_id), ARRAY[]::bigint[])
    INTO v_award_category_ids
    FROM public.award_category
   WHERE event_instance_id = p_event_instance_id
      OR track_id = ANY (v_track_ids);

  SELECT coalesce(array_agg(person_event_role_id), ARRAY[]::bigint[])
    INTO v_role_ids
    FROM public.person_event_role
   WHERE event_instance_id = p_event_instance_id;

  -- Delete order: a row can only be deleted after every row that
  -- references it, so each table below comes before the tables it points to.
  DELETE FROM public.award_result
   WHERE award_category_id = ANY (v_award_category_ids)
      OR submission_id     = ANY (v_submission_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('award_result', v_n);

  DELETE FROM public.award_category
   WHERE award_category_id = ANY (v_award_category_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('award_category', v_n);

  DELETE FROM public.score_item
   WHERE score_sheet_id = ANY (v_score_sheet_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('score_item', v_n);

  DELETE FROM public.score_sheet
   WHERE score_sheet_id = ANY (v_score_sheet_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('score_sheet', v_n);

  DELETE FROM public.judge_assignment
   WHERE track_id      = ANY (v_track_ids)
      OR submission_id = ANY (v_submission_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('judge_assignment', v_n);

  DELETE FROM public.submission_table_assignment
   WHERE submission_id = ANY (v_submission_ids)
      OR table_id      = ANY (v_table_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('submission_table_assignment', v_n);

  DELETE FROM public.submission_author
   WHERE submission_id = ANY (v_submission_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('submission_author', v_n);

  DELETE FROM public.submission_facet_value
   WHERE submission_id = ANY (v_submission_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('submission_facet_value', v_n);

  DELETE FROM public.submission_file
   WHERE submission_id = ANY (v_submission_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('submission_file', v_n);

  DELETE FROM public.submission
   WHERE submission_id = ANY (v_submission_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('submission', v_n);

  DELETE FROM public.track_facet
   WHERE track_id = ANY (v_track_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('track_facet', v_n);

  DELETE FROM public.track_rubric
   WHERE track_id = ANY (v_track_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('track_rubric', v_n);

  DELETE FROM public.track
   WHERE track_id = ANY (v_track_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('track', v_n);

  DELETE FROM public.event_table
   WHERE event_instance_id = p_event_instance_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('event_table', v_n);

  DELETE FROM public.person_event_role_facet_value
   WHERE person_event_role_id = ANY (v_role_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('person_event_role_facet_value', v_n);

  DELETE FROM public.person_event_role
   WHERE person_event_role_id = ANY (v_role_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('person_event_role', v_n);

  -- Raises, rolling back everything above, if any row still references the instance.
  DELETE FROM public.event_instance
   WHERE event_instance_id = p_event_instance_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('event_instance', v_n);

  RETURN jsonb_build_object(
    'event_instance_id',      p_event_instance_id,
    'name',                   v_name,
    'deleted_counts',         v_counts,
    'deleted_submission_ids', to_jsonb(v_submission_ids)
  );
END;
$$;


-- ============================================================
-- SECTION 2: PERMISSIONS
--
-- New functions are executable by PUBLIC and anon by default.
-- Restrict to authenticated users; is_admin() limits it to admins.
-- ============================================================

REVOKE ALL ON FUNCTION public.delete_event_instance(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_event_instance(bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_event_instance(bigint, text) TO authenticated;
