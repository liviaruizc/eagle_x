-- Allow rubric deletion even when score_sheet rows exist.
-- Keeps historical score sheets by setting rubric_id to null on rubric delete.

begin;

do $$
declare
    fk record;
begin
    -- Ensure rubric_id can be nulled when parent rubric is deleted.
    alter table public.score_sheet
        alter column rubric_id drop not null;

    -- Drop any existing FK from score_sheet(rubric_id) -> rubric(rubric_id)
    -- regardless of its current constraint name.
    for fk in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_sheet'
          and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (rubric_id)%REFERENCES rubric%'
    loop
        execute format('alter table public.score_sheet drop constraint %I', fk.conname);
    end loop;

    -- Recreate FK with ON DELETE SET NULL to preserve scoring history.
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_sheet'
          and c.conname = 'score_sheet_rubric_id_fkey'
    ) then
        alter table public.score_sheet
            add constraint score_sheet_rubric_id_fkey
            foreign key (rubric_id)
            references public.rubric (rubric_id)
            on delete set null;
    end if;
end
$$;

commit;
