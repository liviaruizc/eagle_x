-- Add uniqueness and indexing required for idempotent judge import.

begin;

-- Deduplicate person_event_role before adding uniqueness.
with ranked as (
    select
        person_event_role_id,
        min(person_event_role_id) over (
            partition by event_instance_id, person_id, event_role_id
        ) as keep_id,
        row_number() over (
            partition by event_instance_id, person_id, event_role_id
            order by person_event_role_id
        ) as rn
    from public.person_event_role
    where event_instance_id is not null
)
update public.person_event_role_facet_value fv
set person_event_role_id = r.keep_id
from ranked r
where fv.person_event_role_id = r.person_event_role_id
  and r.rn > 1;

with ranked as (
    select
        person_event_role_id,
        row_number() over (
            partition by event_instance_id, person_id, event_role_id
            order by person_event_role_id
        ) as rn
    from public.person_event_role
    where event_instance_id is not null
)
delete from public.person_event_role per
using ranked r
where per.person_event_role_id = r.person_event_role_id
  and r.rn > 1;

-- Deduplicate event_role_facet before adding uniqueness.
with ranked as (
    select
        event_role_facet_id,
        row_number() over (
            partition by event_role_id, facet_id
            order by event_role_facet_id
        ) as rn
    from public.event_role_facet
)
delete from public.event_role_facet erf
using ranked r
where erf.event_role_facet_id = r.event_role_facet_id
  and r.rn > 1;

create unique index if not exists ux_person_event_role_event_person_role
    on public.person_event_role (event_instance_id, person_id, event_role_id)
    where event_instance_id is not null;

create unique index if not exists ux_event_role_facet_role_facet
    on public.event_role_facet (event_role_id, facet_id);

create index if not exists idx_person_event_role_person_event
    on public.person_event_role (person_id, event_instance_id);

create index if not exists idx_person_event_role_event_role
    on public.person_event_role (event_role_id, event_instance_id);

create index if not exists idx_person_event_role_facet_value_role_facet
    on public.person_event_role_facet_value (person_event_role_id, facet_id);

create index if not exists idx_person_event_role_facet_value_option
    on public.person_event_role_facet_value (facet_option_id);

commit;
