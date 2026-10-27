-- Ensure judge import facets exist for normalized cleaned Excel columns.
-- These facets are used by import logic for college_codes, class_codes, session_code.

begin;

insert into public.facet (code, name, value_kind, description)
values
    ('JUDGE_COLLEGE_PREFERENCE', 'Judge College Preference', 'multi_select', 'Normalized college_codes from cleaned judge import.'),
    ('JUDGE_CLASSES_TAUGHT', 'Judge Classes Taught', 'multi_select', 'Normalized class_codes from cleaned judge import.'),
    ('JUDGE_SESSION_PREFERENCE', 'Judge Session Preference', 'multi_select', 'Normalized session_code from cleaned judge import.')
on conflict (code) do update
set
    name = excluded.name,
    value_kind = excluded.value_kind,
    description = excluded.description;

with judge_role as (
    select event_role_id
    from (
        select event_role_id, 1 as priority
        from public.event_role
        where upper(code) = 'JUDGE'

        union all

        select event_role_id, 2 as priority
        from public.event_role
        where lower(name) like '%judge%'
    ) ranked
    order by priority, event_role_id
    limit 1
),
judge_facets as (
    select facet_id,
           case
               when code = 'JUDGE_COLLEGE_PREFERENCE' then 1
               when code = 'JUDGE_CLASSES_TAUGHT' then 2
               when code = 'JUDGE_SESSION_PREFERENCE' then 3
               else 99
           end as display_order
    from public.facet
    where code in ('JUDGE_COLLEGE_PREFERENCE', 'JUDGE_CLASSES_TAUGHT', 'JUDGE_SESSION_PREFERENCE')
)
insert into public.event_role_facet (event_role_id, facet_id, is_required, display_order)
select jr.event_role_id, jf.facet_id, false, jf.display_order
from judge_role jr
cross join judge_facets jf
where not exists (
        select 1
        from public.event_role_facet erf
        where erf.event_role_id = jr.event_role_id
            and erf.facet_id = jf.facet_id
);

update public.event_role_facet erf
set
        is_required = false,
        display_order = case
                when f.code = 'JUDGE_COLLEGE_PREFERENCE' then 1
                when f.code = 'JUDGE_CLASSES_TAUGHT' then 2
                when f.code = 'JUDGE_SESSION_PREFERENCE' then 3
                else erf.display_order
        end
from public.facet f
where erf.facet_id = f.facet_id
    and f.code in ('JUDGE_COLLEGE_PREFERENCE', 'JUDGE_CLASSES_TAUGHT', 'JUDGE_SESSION_PREFERENCE')
    and exists (
            select 1
            from public.event_role er
            where er.event_role_id = erf.event_role_id
                and (upper(er.code) = 'JUDGE' or lower(er.name) like '%judge%')
    );

commit;
