-- Adds role-based facet config and person-event-role facet values.

begin;

create table if not exists event_role_facet (
    event_role_facet_id uuid primary key default gen_random_uuid(),
    event_role_id uuid not null references event_role(event_role_id) on delete cascade,
    facet_id uuid not null references facet(facet_id) on delete cascade,
    is_required boolean not null default false,
    display_order int not null default 1,
    created_at timestamptz not null default now(),
    unique (event_role_id, facet_id)
);

create table if not exists person_event_role_facet_value (
    person_event_role_facet_value_id uuid primary key default gen_random_uuid(),
    person_event_role_id uuid not null references person_event_role(person_event_role_id) on delete cascade,
    facet_id uuid not null references facet(facet_id) on delete cascade,
    facet_option_id uuid null references facet_option(facet_option_id) on delete set null,
    value_text text null,
    value_number numeric null,
    value_date date null,
    created_at timestamptz not null default now(),
    unique (person_event_role_id, facet_id)
);

commit;
