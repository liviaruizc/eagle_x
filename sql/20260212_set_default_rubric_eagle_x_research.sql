-- Sets Poster Scoring Rubric v1 as the default rubric
-- for all Eagle X Research tracks.

begin;

do $$
begin
    if not exists (
        select 1
        from rubric
        where name = 'Poster Scoring Rubric'
          and version = 1
    ) then
        raise exception 'Poster Scoring Rubric v1 not found. Run rubric seed first.';
    end if;
end $$;

with target_rubric as (
    select rubric_id
    from rubric
    where name = 'Poster Scoring Rubric'
      and version = 1
    limit 1
),
eagle_x_research_tracks as (
    select t.track_id
    from track t
    join event_instance ei on ei.event_instance_id = t.event_instance_id
    join event e on e.event_id = ei.event_id
    join track_type tt on tt.track_type_id = t.track_type_id
    where lower(e.name) like '%eagle x%'
      and upper(tt.code) = 'RESEARCH'
),
clear_defaults as (
    update track_rubric tr
    set is_default = false
    where tr.track_id in (select track_id from eagle_x_research_tracks)
),
upsert_defaults as (
    insert into track_rubric (
        track_id,
        rubric_id,
        is_default,
        condition_json
    )
    select
        et.track_id,
        tr.rubric_id,
        true,
        null
    from eagle_x_research_tracks et
    cross join target_rubric tr
    on conflict (track_id, rubric_id)
    do update set
        is_default = true,
        condition_json = excluded.condition_json
    returning track_rubric_id
)
select count(*) as defaults_set
from upsert_defaults;

commit;
