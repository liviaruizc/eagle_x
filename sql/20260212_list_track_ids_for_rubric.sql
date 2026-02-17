-- Use this to find a valid track_id to place in:
-- sql/20260212_seed_mock_rubric_and_link_track.sql
-- set local app.target_track_id = '...';

select
    ei.event_instance_id,
    ei.name as event_instance_name,
    ei.status as event_instance_status,
    t.track_id,
    t.name as track_name,
    tt.code as track_type_code,
    tt.name as track_type_name
from track t
join event_instance ei on ei.event_instance_id = t.event_instance_id
left join track_type tt on tt.track_type_id = t.track_type_id
order by ei.created_at desc, t.display_order asc nulls last, t.created_at desc;
