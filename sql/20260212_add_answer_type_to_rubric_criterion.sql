-- Adds answer type support for rubric criteria.

begin;

alter table if exists rubric_criterion
    add column if not exists answer_type text;

do $$
declare
    v_constraint record;
begin
    for v_constraint in
        select conname
        from pg_constraint
        where conrelid = 'rubric_criterion'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) ilike '%answer_type%'
    loop
        execute format('alter table rubric_criterion drop constraint if exists %I', v_constraint.conname);
    end loop;
end $$;

update rubric_criterion
set answer_type = case
    when answer_type is null then 'numeric_scale'
    when answer_type = 'scale_0_5' then 'numeric_scale'
    else answer_type
end;

alter table if exists rubric_criterion
    alter column answer_type set default 'numeric_scale';

alter table if exists rubric_criterion
    alter column answer_type set not null;

alter table if exists rubric_criterion
    add constraint rubric_criterion_answer_type_check
    check (answer_type in ('true_false', 'numeric_scale', 'dropdown', 'scale_0_5'));

update rubric_criterion
set answer_type = 'numeric_scale'
where answer_type = 'scale_0_5';

commit;
