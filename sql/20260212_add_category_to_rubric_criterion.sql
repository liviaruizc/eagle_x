-- Adds predefined criterion categories for rubric criteria.

begin;

alter table if exists rubric_criterion
    add column if not exists criterion_category text;

update rubric_criterion
set criterion_category = case
    when lower(split_part(split_part(coalesce(description, ''), 'section=', 2), ';', 1)) in (
        'abstract',
        'methodology',
        'results',
        'presentation',
        'significance',
        'understanding'
    )
        then lower(split_part(split_part(coalesce(description, ''), 'section=', 2), ';', 1))
    else coalesce(criterion_category, 'abstract')
end;

alter table if exists rubric_criterion
    alter column criterion_category set default 'abstract';

alter table if exists rubric_criterion
    alter column criterion_category set not null;

alter table if exists rubric_criterion
    drop constraint if exists rubric_criterion_category_check;

alter table if exists rubric_criterion
    add constraint rubric_criterion_category_check
    check (criterion_category in (
        'abstract',
        'methodology',
        'results',
        'presentation',
        'significance',
        'understanding'
    ));

commit;
