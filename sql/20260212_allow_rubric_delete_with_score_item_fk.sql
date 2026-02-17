-- Allow rubric deletion even when score_item rows reference rubric criteria.
-- Preserves historical score_item rows by setting criterion_id to null when a criterion is deleted.

begin;

do $$
declare
    fk record;
begin
    -- Ensure criterion_id can be nulled when parent criterion is deleted.
    alter table public.score_item
        alter column criterion_id drop not null;

    -- Drop any existing FK from score_item(criterion_id) -> rubric_criterion(criterion_id)
    -- regardless of its current constraint name.
    for fk in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_item'
          and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (criterion_id)%REFERENCES rubric_criterion%'
    loop
        execute format('alter table public.score_item drop constraint %I', fk.conname);
    end loop;

    -- Recreate FK with ON DELETE SET NULL to preserve historical score items.
    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_item'
          and c.conname = 'score_item_criterion_id_fkey'
    ) then
        alter table public.score_item
            add constraint score_item_criterion_id_fkey
            foreign key (criterion_id)
            references public.rubric_criterion (criterion_id)
            on delete set null;
    end if;
end
$$;

commit;
