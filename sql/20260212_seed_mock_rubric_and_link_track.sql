-- Seeds the current mock rubric questions into rubric/rubric_criterion
-- and links the rubric to a track in track_rubric.
--
-- HOW TO USE:
-- 1) Run sql/20260212_list_track_ids_for_rubric.sql to get a real track_id.
-- 2) Replace the track UUID in the SET LOCAL line below.
-- 3) Run this script.
-- 4) Re-run for each track that should use this rubric.

begin;

set local app.target_track_id = '00000000-0000-0000-0000-000000000000';

do $$
declare
    v_track_id uuid := current_setting('app.target_track_id')::uuid;
begin
    if v_track_id = '00000000-0000-0000-0000-000000000000'::uuid then
        raise exception 'Replace app.target_track_id with a real track_id before running this script.';
    end if;

    if not exists (
        select 1
        from track
        where track_id = v_track_id
    ) then
        raise exception 'track_id % was not found in track table.', v_track_id;
    end if;
end $$;

create unique index if not exists uq_rubric_name_version
    on rubric (name, version);

create unique index if not exists uq_track_rubric_track_rubric
    on track_rubric (track_id, rubric_id);

with params as (
    select
    current_setting('app.target_track_id')::uuid as target_track_id,
        1::int as target_version
),
upsert_rubric as (
    insert into rubric (
        name,
        description,
        max_total_points,
        version,
        is_active
    )
    values (
        'Poster Scoring Rubric',
        'Seeded from mock questionsRubric.js',
        75,
        (select target_version from params),
        true
    )
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
    join params p on p.target_version = r.version
    where r.name = 'Poster Scoring Rubric'
    limit 1
),
cleared as (
    delete from rubric_criterion
    where rubric_id = (select rubric_id from resolved_rubric)
    returning criterion_id
),
ins_criteria as (
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
        display_order
    )
    select
        (select rubric_id from resolved_rubric),
        c.name,
        c.description,
        c.criterion_category,
        c.answer_type,
        c.answer_config_json,
        c.weight,
        c.score_min,
        c.score_max,
        c.display_order
    from (
        values
                ('Research question is well-formulated.', 'section=abstract; question_id=abstract_research_question', 'abstract', 'numeric_scale', null::jsonb, 1, 1, 5, 1),
                ('Objectives are clearly stated.', 'section=abstract; question_id=abstract_objectives', 'abstract', 'numeric_scale', null::jsonb, 1, 1, 5, 2),
                ('Study is summarized well.', 'section=abstract; question_id=abstract_summary', 'abstract', 'numeric_scale', null::jsonb, 1, 1, 5, 3),

                ('Methods are appropriate and properly applied.', 'section=methodology; question_id=method_methods', 'methodology', 'numeric_scale', null::jsonb, 1, 1, 5, 4),
                ('Study is original work by presenter.', 'section=methodology; question_id=method_original', 'methodology', 'numeric_scale', null::jsonb, 1, 1, 5, 5),

                ('Strengths and limitations are presented.', 'section=results; question_id=results_strengths_limits', 'results', 'numeric_scale', null::jsonb, 1, 1, 5, 6),
                ('Significance and implications emphasized.', 'section=results; question_id=results_significance', 'results', 'numeric_scale', null::jsonb, 1, 1, 5, 7),
                ('Goals/questions addressed.', 'section=results; question_id=results_goals_addressed', 'results', 'numeric_scale', null::jsonb, 1, 1, 5, 8),

                ('Poster design is clean and clear.', 'section=presentation; question_id=presentation_design', 'presentation', 'numeric_scale', null::jsonb, 1, 1, 5, 9),
                ('Well organized.', 'section=presentation; question_id=presentation_organized', 'presentation', 'numeric_scale', null::jsonb, 1, 1, 5, 10),
                ('Effectively summarized.', 'section=presentation; question_id=presentation_summary', 'presentation', 'numeric_scale', null::jsonb, 1, 1, 5, 11),

                ('Contribution to field.', 'section=significance; question_id=significance_contribution', 'significance', 'numeric_scale', null::jsonb, 1, 1, 5, 12),
                ('Novel / new approach.', 'section=significance; question_id=significance_novel', 'significance', 'numeric_scale', null::jsonb, 1, 1, 5, 13),

                ('Understands subject and related areas.', 'section=understanding; question_id=understanding_subject', 'understanding', 'numeric_scale', null::jsonb, 1, 1, 5, 14),
                ('Effective responses to questions.', 'section=understanding; question_id=understanding_responses', 'understanding', 'numeric_scale', null::jsonb, 1, 1, 5, 15)
            ) as c(name, description, criterion_category, answer_type, answer_config_json, weight, score_min, score_max, display_order)
    returning criterion_id
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
        is_default = excluded.is_default,
        condition_json = excluded.condition_json
    returning track_rubric_id
)
select
    (select rubric_id from resolved_rubric) as rubric_id,
    (select count(*) from ins_criteria) as criteria_inserted,
    (select track_rubric_id from upsert_track_rubric) as track_rubric_id;

commit;
