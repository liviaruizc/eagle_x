-- Allow judges to store multiple option selections for the same facet
-- (e.g., multiple PROGRAM/DEPARTMENT entries).

begin;

do $$
declare
    constraint_row record;
begin
    -- Drop legacy uniqueness that enforced a single row per facet.
    for constraint_row in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'u'
          and n.nspname = 'public'
          and t.relname = 'person_event_role_facet_value'
          and pg_get_constraintdef(c.oid) ilike 'UNIQUE (person_event_role_id, facet_id)%'
    loop
        execute format(
            'alter table public.person_event_role_facet_value drop constraint %I',
            constraint_row.conname
        );
    end loop;

    -- Prevent duplicate option rows for the same person-event-role + facet.
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'u'
          and n.nspname = 'public'
          and t.relname = 'person_event_role_facet_value'
          and c.conname = 'person_event_role_facet_value_role_facet_option_key'
    ) then
        alter table public.person_event_role_facet_value
            add constraint person_event_role_facet_value_role_facet_option_key
            unique (person_event_role_id, facet_id, facet_option_id);
    end if;
end
$$;

commit;
