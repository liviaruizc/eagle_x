alter table if exists event_instance
    add column if not exists pre_scoring_start_at timestamptz,
    add column if not exists pre_scoring_end_at timestamptz;

alter table if exists event_instance
    alter column status set default 'closed';

alter table if exists submission
    alter column status set default 'submitted';
