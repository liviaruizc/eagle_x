-- Optional seed: maps COLLEGE and DEPARTMENT facets to the JUDGE role.
-- Auto-creates a judge-like role when event_role is empty.

begin;

do $$
declare
    role_id uuid;
    has_code boolean;
    has_name boolean;
begin
    select event_role_id
    into role_id
    from (
        select event_role_id, 1 as priority
        from event_role
        where upper(code) = 'JUDGE'

        union all

        select event_role_id, 2 as priority
        from event_role
        where lower(name) like '%judge%'

        union all

        select event_role_id, 3 as priority
        from event_role
    ) candidates
    order by priority
    limit 1;

    if role_id is not null then
        return;
    end if;

    select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'event_role'
          and column_name = 'code'
    ) into has_code;

    select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'event_role'
          and column_name = 'name'
    ) into has_name;

    if has_code and has_name then
        execute $sql$
            insert into event_role (code, name)
            values ('JUDGE', 'Judge')
            returning event_role_id
        $sql$ into role_id;
    elsif has_name then
        execute $sql$
            insert into event_role (name)
            values ('Judge')
            returning event_role_id
        $sql$ into role_id;
    elsif has_code then
        execute $sql$
            insert into event_role (code)
            values ('JUDGE')
            returning event_role_id
        $sql$ into role_id;
    else
        execute $sql$
            insert into event_role default values
            returning event_role_id
        $sql$ into role_id;
    end if;

exception
    when not_null_violation then
        raise exception
            'Could not auto-create judge role in event_role because additional required columns have no defaults. Insert one role manually, then re-run this seed.';
end
$$;

with judge_role as (
    select event_role_id
    from (
        select event_role_id, 1 as priority
        from event_role
        where upper(code) = 'JUDGE'

        union all

        select event_role_id, 2 as priority
        from event_role
        where lower(name) like '%judge%'

        union all

        select event_role_id, 3 as priority
        from event_role
    ) candidates
    order by priority
    limit 1
),
target_facets as (
    select facet_id, code
    from facet
    where upper(code) in ('COLLEGE', 'DEPARTMENT')
)
insert into event_role_facet (
    event_role_id,
    facet_id,
    is_required,
    display_order
)
select
    jr.event_role_id,
    tf.facet_id,
    true,
    case when upper(tf.code) = 'COLLEGE' then 1 else 2 end
from judge_role jr
cross join target_facets tf
on conflict (event_role_id, facet_id)
do update set
    is_required = excluded.is_required,
    display_order = excluded.display_order;

commit;
