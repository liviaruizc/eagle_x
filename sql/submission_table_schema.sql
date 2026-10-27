create table public.submission (
  submission_id bigint generated always as identity not null,
  track_id bigint not null,
  title text not null,
  description text null,
  keywords text null,
  status text not null default 'submitted'::text,
  created_by_email text null,
  submitted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  supervisor_person_id bigint null,
  constraint submission_pkey primary key (submission_id),
  constraint submission_created_by_email_fkey foreign KEY (created_by_email) references person (email),
  constraint submission_supervisor_person_id_fkey foreign KEY (supervisor_person_id) references person (person_id),
  constraint submission_track_id_fkey foreign KEY (track_id) references track (track_id),
  constraint submission_status_check check (
    (
      status = any (
        array[
          'submitted'::text,
          'pre_scoring'::text,
          'pre_scored'::text,
          'event_scoring'::text,
          'done'::text,
          'withdrawn'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;