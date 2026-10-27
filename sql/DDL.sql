-- Optional
create schema if not exists public;

-- 1) Base tables first

CREATE TABLE public.event (
  event_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  description text,
  host_org text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_pkey PRIMARY KEY (event_id)
);

CREATE TABLE public.event_role (
  event_role_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  CONSTRAINT event_role_pkey PRIMARY KEY (event_role_id)
);

CREATE TABLE public.facet (
  facet_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  value_kind text NOT NULL CHECK (
    value_kind = ANY (
      ARRAY['single_select'::text, 'multi_select'::text, 'text'::text, 'number'::text, 'date'::text]
    )
  ),
  description text,
  CONSTRAINT facet_pkey PRIMARY KEY (facet_id)
);

CREATE TABLE public.person (
  person_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  first_name text,
  last_name text,
  affiliation text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  auth_user_id uuid UNIQUE,
  CONSTRAINT person_pkey PRIMARY KEY (person_id)
);

CREATE TABLE public.rubric (
  rubric_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  description text,
  max_total_points numeric,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rubric_pkey PRIMARY KEY (rubric_id)
);

CREATE TABLE public.track_type (
  track_type_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  CONSTRAINT track_type_pkey PRIMARY KEY (track_type_id)
);

-- 2) Tables depending on base tables

CREATE TABLE public.event_instance (
  event_instance_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id bigint NOT NULL,
  name text NOT NULL,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  location text,
  status text NOT NULL DEFAULT 'closed'::text CHECK (
    status = ANY (
      ARRAY['pre-scoring'::text, 'event_scoring'::text, 'closed'::text, 'done'::text]
    )
  ),
  timezone text NOT NULL DEFAULT 'UTC'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pre_scoring_start_at timestamp with time zone,
  pre_scoring_end_at timestamp with time zone,
  CONSTRAINT event_instance_pkey PRIMARY KEY (event_instance_id),
  CONSTRAINT event_instance_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.event(event_id)
);

CREATE TABLE public.event_role_facet (
  event_role_facet_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_role_id bigint NOT NULL,
  facet_id bigint NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_role_facet_pkey PRIMARY KEY (event_role_facet_id),
  CONSTRAINT event_role_facet_event_role_id_fkey
    FOREIGN KEY (event_role_id) REFERENCES public.event_role(event_role_id),
  CONSTRAINT event_role_facet_facet_id_fkey
    FOREIGN KEY (facet_id) REFERENCES public.facet(facet_id)
);

CREATE TABLE public.facet_option (
  facet_option_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  facet_id bigint NOT NULL,
  value text NOT NULL,
  label text,
  parent_option_id bigint,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT facet_option_pkey PRIMARY KEY (facet_option_id),
  CONSTRAINT facet_option_facet_id_fkey
    FOREIGN KEY (facet_id) REFERENCES public.facet(facet_id),
  CONSTRAINT facet_option_parent_option_id_fkey
    FOREIGN KEY (parent_option_id) REFERENCES public.facet_option(facet_option_id)
);

CREATE TABLE public.person_event_role (
  person_event_role_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_instance_id bigint NULL,
  person_id bigint NOT NULL,
  event_role_id bigint NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT person_event_role_pkey PRIMARY KEY (person_event_role_id),
  CONSTRAINT person_event_role_event_instance_id_fkey
    FOREIGN KEY (event_instance_id) REFERENCES public.event_instance(event_instance_id),
  CONSTRAINT person_event_role_person_id_fkey
    FOREIGN KEY (person_id) REFERENCES public.person(person_id),
  CONSTRAINT person_event_role_event_role_id_fkey
    FOREIGN KEY (event_role_id) REFERENCES public.event_role(event_role_id)
);

CREATE TABLE public.rubric_criterion (
  criterion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  rubric_id bigint NOT NULL,
  name text NOT NULL,
  description text,
  weight numeric NOT NULL DEFAULT 1.0,
  score_min numeric NOT NULL DEFAULT 0,
  score_max numeric NOT NULL DEFAULT 5,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  answer_type text NOT NULL DEFAULT 'numeric_scale'::text CHECK (
    answer_type = ANY (
      ARRAY['true_false'::text, 'numeric_scale'::text, 'dropdown'::text, 'scale_0_5'::text]
    )
  ),
  answer_config_json jsonb,
  criterion_category text NOT NULL DEFAULT 'abstract'::text CHECK (
    criterion_category = ANY (
      ARRAY[
        'abstract'::text,
        'methodology'::text,
        'results'::text,
        'presentation'::text,
        'significance'::text,
        'understanding'::text
      ]
    )
  ),
  scoring_phase text NOT NULL DEFAULT 'both'::text CHECK (
    scoring_phase = ANY (
      ARRAY['pre_scoring'::text, 'event_scoring'::text, 'both'::text]
    )
  ),
  CONSTRAINT rubric_criterion_pkey PRIMARY KEY (criterion_id),
  CONSTRAINT rubric_criterion_rubric_id_fkey
    FOREIGN KEY (rubric_id) REFERENCES public.rubric(rubric_id)
);

CREATE TABLE public.track (
  track_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_instance_id bigint NOT NULL,
  track_type_id bigint NOT NULL,
  name text NOT NULL,
  submission_open_at timestamp with time zone,
  submission_close_at timestamp with time zone,
  scoring_open_at timestamp with time zone,
  scoring_close_at timestamp with time zone,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT track_pkey PRIMARY KEY (track_id),
  CONSTRAINT track_event_instance_id_fkey
    FOREIGN KEY (event_instance_id) REFERENCES public.event_instance(event_instance_id),
  CONSTRAINT track_track_type_id_fkey
    FOREIGN KEY (track_type_id) REFERENCES public.track_type(track_type_id)
);

CREATE TABLE public.event_table (
  table_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_instance_id bigint NOT NULL,
  table_number integer NOT NULL,
  session text,
  location_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_table_pkey PRIMARY KEY (table_id),
  CONSTRAINT event_table_event_instance_fkey
    FOREIGN KEY (event_instance_id) REFERENCES public.event_instance(event_instance_id)
);

-- 3) Tables depending on track / person / facet / rubric

CREATE TABLE public.person_event_role_facet_value (
  person_event_role_facet_value_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  person_event_role_id bigint NOT NULL,
  facet_id bigint NOT NULL,
  facet_option_id bigint,
  value_text text,
  value_number numeric,
  value_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT person_event_role_facet_value_pkey PRIMARY KEY (person_event_role_facet_value_id),
  CONSTRAINT person_event_role_facet_value_person_event_role_id_fkey
    FOREIGN KEY (person_event_role_id) REFERENCES public.person_event_role(person_event_role_id),
  CONSTRAINT person_event_role_facet_value_facet_id_fkey
    FOREIGN KEY (facet_id) REFERENCES public.facet(facet_id),
  CONSTRAINT person_event_role_facet_value_facet_option_id_fkey
    FOREIGN KEY (facet_option_id) REFERENCES public.facet_option(facet_option_id)
);

CREATE TABLE public.track_facet (
  track_facet_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  track_id bigint NOT NULL,
  facet_id bigint NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  depends_on_facet_id bigint,
  depends_on_option_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT track_facet_pkey PRIMARY KEY (track_facet_id),
  CONSTRAINT track_facet_track_id_fkey
    FOREIGN KEY (track_id) REFERENCES public.track(track_id),
  CONSTRAINT track_facet_facet_id_fkey
    FOREIGN KEY (facet_id) REFERENCES public.facet(facet_id),
  CONSTRAINT track_facet_depends_on_facet_id_fkey
    FOREIGN KEY (depends_on_facet_id) REFERENCES public.facet(facet_id),
  CONSTRAINT track_facet_depends_on_option_id_fkey
    FOREIGN KEY (depends_on_option_id) REFERENCES public.facet_option(facet_option_id)
);

CREATE TABLE public.track_rubric (
  track_rubric_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  track_id bigint NOT NULL,
  rubric_id bigint NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  condition_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT track_rubric_pkey PRIMARY KEY (track_rubric_id),
  CONSTRAINT track_rubric_track_id_fkey
    FOREIGN KEY (track_id) REFERENCES public.track(track_id),
  CONSTRAINT track_rubric_rubric_id_fkey
    FOREIGN KEY (rubric_id) REFERENCES public.rubric(rubric_id)
);

CREATE TABLE public.submission (
  submission_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  track_id bigint NOT NULL,
  title text NOT NULL,
  description text,
  keywords text,
  status text NOT NULL DEFAULT 'submitted'::text CHECK (
    status = ANY (
      ARRAY[
        'submitted'::text,
        'pre_scoring'::text,
        'pre_scored'::text,
        'event_scoring'::text,
        'done'::text,
        'withdrawn'::text
      ]
    )
  ),
  created_by_email text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  supervisor_person_id bigint,
  CONSTRAINT submission_pkey PRIMARY KEY (submission_id),
  CONSTRAINT submission_track_id_fkey
    FOREIGN KEY (track_id) REFERENCES public.track(track_id),
  CONSTRAINT submission_created_by_email_fkey
    FOREIGN KEY (created_by_email) REFERENCES public.person(email),
  CONSTRAINT submission_supervisor_person_id_fkey
    FOREIGN KEY (supervisor_person_id) REFERENCES public.person(person_id)
);

CREATE TABLE public.judge_assignment (
  judge_assignment_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  track_id bigint NOT NULL,
  person_id bigint NOT NULL,
  submission_id bigint,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT judge_assignment_pkey PRIMARY KEY (judge_assignment_id),
  CONSTRAINT judge_assignment_track_id_fkey
    FOREIGN KEY (track_id) REFERENCES public.track(track_id),
  CONSTRAINT judge_assignment_person_id_fkey
    FOREIGN KEY (person_id) REFERENCES public.person(person_id),
  CONSTRAINT judge_assignment_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id)
);

CREATE TABLE public.score_sheet (
  score_sheet_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  submission_id bigint NOT NULL,
  judge_person_id bigint NOT NULL,
  rubric_id bigint,
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (
    status = ANY (
      ARRAY['in_progress'::text, 'submitted'::text, 'locked'::text]
    )
  ),
  overall_comment text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT score_sheet_pkey PRIMARY KEY (score_sheet_id),
  CONSTRAINT score_sheet_judge_person_id_fkey
    FOREIGN KEY (judge_person_id) REFERENCES public.person(person_id),
  CONSTRAINT score_sheet_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id) ON DELETE CASCADE,
  CONSTRAINT score_sheet_rubric_id_fkey
    FOREIGN KEY (rubric_id) REFERENCES public.rubric(rubric_id)
);

CREATE TABLE public.award_category (
  award_category_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_instance_id bigint NOT NULL,
  track_id bigint,
  name text NOT NULL,
  n_winners integer NOT NULL DEFAULT 1 CHECK (n_winners > 0),
  selection_method text NOT NULL DEFAULT 'avg_of_judges'::text CHECK (
    selection_method = ANY (
      ARRAY['avg_of_judges'::text, 'sum'::text, 'trimmed_mean'::text, 'max'::text]
    )
  ),
  filter_json jsonb,
  tie_breaker_criterion_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT award_category_pkey PRIMARY KEY (award_category_id),
  CONSTRAINT award_category_event_instance_id_fkey
    FOREIGN KEY (event_instance_id) REFERENCES public.event_instance(event_instance_id),
  CONSTRAINT award_category_track_id_fkey
    FOREIGN KEY (track_id) REFERENCES public.track(track_id),
  CONSTRAINT award_category_tie_breaker_criterion_id_fkey
    FOREIGN KEY (tie_breaker_criterion_id) REFERENCES public.rubric_criterion(criterion_id)
);

-- 4) Final dependent tables

CREATE TABLE public.score_item (
  score_item_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  score_sheet_id bigint NOT NULL,
  criterion_id bigint,
  score_value numeric NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT score_item_pkey PRIMARY KEY (score_item_id),
  CONSTRAINT score_item_score_sheet_id_fkey
    FOREIGN KEY (score_sheet_id) REFERENCES public.score_sheet(score_sheet_id) ON DELETE CASCADE,
  CONSTRAINT score_item_criterion_id_fkey
    FOREIGN KEY (criterion_id) REFERENCES public.rubric_criterion(criterion_id)
);

CREATE TABLE public.award_result (
  award_result_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  award_category_id bigint NOT NULL,
  submission_id bigint NOT NULL,
  rank integer NOT NULL CHECK (rank > 0),
  score_value numeric,
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT award_result_pkey PRIMARY KEY (award_result_id),
  CONSTRAINT award_result_award_category_id_fkey
    FOREIGN KEY (award_category_id) REFERENCES public.award_category(award_category_id),
  CONSTRAINT award_result_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id)
);

CREATE TABLE public.submission_author (
  submission_id bigint NOT NULL,
  person_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT submission_author_pkey PRIMARY KEY (submission_id, person_id),
  CONSTRAINT submission_author_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id),
  CONSTRAINT submission_author_person_id_fkey
    FOREIGN KEY (person_id) REFERENCES public.person(person_id)
);

CREATE TABLE public.submission_facet_value (
  submission_facet_value_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  submission_id bigint NOT NULL,
  facet_id bigint NOT NULL,
  facet_option_id bigint,
  value_text text,
  value_number numeric,
  value_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT submission_facet_value_pkey PRIMARY KEY (submission_facet_value_id),
  CONSTRAINT submission_facet_value_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id),
  CONSTRAINT submission_facet_value_facet_id_fkey
    FOREIGN KEY (facet_id) REFERENCES public.facet(facet_id),
  CONSTRAINT submission_facet_value_facet_option_id_fkey
    FOREIGN KEY (facet_option_id) REFERENCES public.facet_option(facet_option_id)
);

CREATE TABLE public.submission_file (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  submission_id bigint NOT NULL UNIQUE,
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  file_type text,
  CONSTRAINT submission_file_pkey PRIMARY KEY (id),
  CONSTRAINT submission_file_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id)
);

CREATE TABLE public.submission_table_assignment (
  assignment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  submission_id bigint NOT NULL UNIQUE,
  table_id integer NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT submission_table_assignment_pkey PRIMARY KEY (assignment_id),
  CONSTRAINT submission_table_assignment_submission_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submission(submission_id),
  CONSTRAINT submission_table_assignment_table_fkey
    FOREIGN KEY (table_id) REFERENCES public.event_table(table_id)
);