-- Add supervisor relation for conflict-of-interest checks in judging queue.

begin;

alter table public.submission
    add column if not exists supervisor_person_id uuid null
        references public.person(person_id) on delete set null;

create index if not exists submission_supervisor_person_id_idx
    on public.submission (supervisor_person_id);

commit;
