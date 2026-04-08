-- Seed LEVEL facet options for facet_id = 3.
-- Safe to run multiple times.

begin;

insert into public.facet_option (facet_id, value, label, sort_order)
select 3, v.value, v.label, v.sort_order
from (
  values
    ('UNDERGRADUATE', 'Undergraduate', 1),
    ('GRADUATE', 'Graduate', 2)
) as v(value, label, sort_order)
where not exists (
  select 1
  from public.facet_option fo
  where fo.facet_id = 3
    and upper(fo.value) = upper(v.value)
);

commit;

-- Verify
-- select facet_option_id, value, label, sort_order
-- from public.facet_option
-- where facet_id = 3
-- order by sort_order, facet_option_id;
