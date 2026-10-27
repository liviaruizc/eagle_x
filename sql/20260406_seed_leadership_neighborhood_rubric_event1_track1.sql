-- Recreate "Eagle X 2026 | Leadership Neighborhood (v1)" rubric
-- and assign it as default to event_instance_id=1, track_id=1.
--
-- Safe to re-run:
-- - Upserts rubric by (name, version)
-- - Replaces criteria for that rubric
-- - Upserts track_rubric link for track 1

begin;

create unique index if not exists uq_rubric_name_version
    on rubric (name, version);

create unique index if not exists uq_track_rubric_track_rubric
    on track_rubric (track_id, rubric_id);

-- Validate target track exists and belongs to event instance 1.
do $$
declare
    v_track_event_instance_id bigint;
begin
    select t.event_instance_id
      into v_track_event_instance_id
      from track t
     where t.track_id = 1;

    if v_track_event_instance_id is null then
        raise exception 'track_id=1 was not found.';
    end if;

    if v_track_event_instance_id <> 1 then
        raise exception 'track_id=1 belongs to event_instance_id=% (expected 1).', v_track_event_instance_id;
    end if;
end $$;

with params as (
    select
        1::bigint as target_event_instance_id,
        1::bigint as target_track_id,
        'Eagle X 2026 | Leadership Neighborhood'::text as rubric_name,
        1::int as rubric_version,
        20::numeric as rubric_max_total_points
),
upsert_rubric as (
    insert into rubric (
        name,
        description,
        max_total_points,
        version,
        is_active
    )
    select
        p.rubric_name,
        'Leadership Neighborhood rubric',
        p.rubric_max_total_points,
        p.rubric_version,
        true
    from params p
    on conflict (name, version)
    do update set
        description = excluded.description,
        max_total_points = excluded.max_total_points,
        is_active = true
    returning rubric_id
),
resolved_rubric as (
    select rubric_id from upsert_rubric
    union all
    select r.rubric_id
    from rubric r
    join params p
      on r.name = p.rubric_name
     and r.version = p.rubric_version
    limit 1
),
clear_existing_criteria as (
    delete from rubric_criterion
     where rubric_id = (select rubric_id from resolved_rubric)
    returning criterion_id
),
insert_criteria as (
    insert into rubric_criterion (
        rubric_id,
        name,
        description,
        criterion_category,
        answer_type,
        answer_config_json,
        weight,
        score_min,
        score_max,
        display_order,
        scoring_phase
    )
    select
        (select rubric_id from resolved_rubric),
        c.name,
        c.description,
        c.criterion_category,
        'numeric_scale',
        null::jsonb,
        c.weight,
        c.score_min,
        c.score_max,
        c.display_order,
        'both'
    from (
        values
            ('Leadership Style & Self-Awareness', 'Is this project good?', 'abstract', 1::numeric, 0::numeric, 5::numeric, 1),
            ('Issue Identification & Community Relevance', null, 'abstract', 1::numeric, 0::numeric, 5::numeric, 2),
            ('Reflective Practice & Analysis', null, 'abstract', 1::numeric, 0::numeric, 5::numeric, 3),
            ('Application for Sustainable Impact', null, 'abstract', 1::numeric, 0::numeric, 5::numeric, 4),
            ('Presentation & Communication', null, 'abstract', 1::numeric, 0::numeric, 5::numeric, 5),
            ('test', 'adasdasdas', 'abstract', 1::numeric, 0::numeric, 5::numeric, 6)
    ) as c(name, description, criterion_category, weight, score_min, score_max, display_order)
    returning criterion_id
),
clear_other_defaults_for_track as (
    update track_rubric tr
       set is_default = false
     where tr.track_id = (select target_track_id from params)
),
upsert_track_rubric as (
    insert into track_rubric (
        track_id,
        rubric_id,
        is_default,
        condition_json
    )
    values (
        (select target_track_id from params),
        (select rubric_id from resolved_rubric),
        true,
        null
    )
    on conflict (track_id, rubric_id)
    do update set
        is_default = true,
        condition_json = excluded.condition_json
    returning track_rubric_id
)
select
    (select rubric_id from resolved_rubric) as rubric_id,
    (select count(*) from insert_criteria) as criteria_inserted,
    (select track_rubric_id from upsert_track_rubric) as track_rubric_id;

commit;
