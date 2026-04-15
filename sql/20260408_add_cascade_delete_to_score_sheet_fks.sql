-- Ensure score-related rows are removed automatically when parent rows are deleted.
-- 1) Deleting a submission cascades to score_sheet.
-- 2) Deleting a score_sheet cascades to score_item.

begin;

do $$
declare
    fk record;
begin
    -- Replace FK on score_sheet(submission_id) -> submission(submission_id) with ON DELETE CASCADE.
    for fk in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_sheet'
          and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (submission_id)%REFERENCES submission%'
    loop
        execute format('alter table public.score_sheet drop constraint %I', fk.conname);
    end loop;

    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_sheet'
          and c.conname = 'score_sheet_submission_id_fkey'
    ) then
        alter table public.score_sheet
            add constraint score_sheet_submission_id_fkey
            foreign key (submission_id)
            references public.submission (submission_id)
            on delete cascade;
    end if;

    -- Replace FK on score_item(score_sheet_id) -> score_sheet(score_sheet_id) with ON DELETE CASCADE.
    for fk in
        select c.conname
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_item'
          and pg_get_constraintdef(c.oid) ilike 'FOREIGN KEY (score_sheet_id)%REFERENCES score_sheet%'
    loop
        execute format('alter table public.score_item drop constraint %I', fk.conname);
    end loop;

    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where c.contype = 'f'
          and n.nspname = 'public'
          and t.relname = 'score_item'
          and c.conname = 'score_item_score_sheet_id_fkey'
    ) then
        alter table public.score_item
            add constraint score_item_score_sheet_id_fkey
            foreign key (score_sheet_id)
            references public.score_sheet (score_sheet_id)
            on delete cascade;
    end if;
end
$$;

commit;
