-- Adds per-answer-type configuration for rubric criteria.

begin;

alter table if exists rubric_criterion
    add column if not exists answer_config_json jsonb;

commit;
