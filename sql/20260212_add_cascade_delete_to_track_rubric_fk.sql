-- Make rubric deletion automatically remove track_rubric links.
-- This prevents FK errors when deleting a rubric that is still assigned to tracks.

begin;

do $$
declare
    fk record;
begin
    -- Drop any existing FK from track_rubric(rubric_id) -> rubric(rubric_id)
    -- regardless of constraint name.
    for fk in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'track_rubric'
          and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (rubric_id)%REFERENCES rubric%'
    loop
        execute format('alter table public.track_rubric drop constraint %I', fk.conname);
    end loop;

    -- Recreate FK with cascade delete behavior.
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'track_rubric'
          and c.conname = 'track_rubric_rubric_id_fkey'
    ) then
        alter table public.track_rubric
            add constraint track_rubric_rubric_id_fkey
            foreign key (rubric_id)
            references public.rubric (rubric_id)
            on delete cascade;
    end if;
end
$$;

commit;
