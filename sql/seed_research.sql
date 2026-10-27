begin;

create unique index if not exists uq_rubric_name_version
    on rubric (name, version);

create unique index if not exists uq_track_rubric_track_rubric
    on track_rubric (track_id, rubric_id);

with params as (
    select
        1::bigint as target_event_instance_id,
        2::bigint as target_track_id,
        'Poster Scoring Rubric'::text as rubric_name,
        1::int as rubric_version,
        75::numeric as max_points
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
        'Imported rubric for event_instance_id=1',
        p.max_points,
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
        1,
        1,
        5,
        c.display_order,
        'both'
    from (
        values
            ('Research question is well-formulated.', 'section=abstract; question_id=abstract_research_question', 'abstract', 1),
            ('Objectives are clearly stated.', 'section=abstract; question_id=abstract_objectives', 'abstract', 2),
            ('Study is summarized well.', 'section=abstract; question_id=abstract_summary', 'abstract', 3),

            ('Methods are appropriate and properly applied.', 'section=methodology; question_id=method_methods', 'methodology', 4),
            ('Study is original work by presenter.', 'section=methodology; question_id=method_original', 'methodology', 5),

            ('Strengths and limitations are presented.', 'section=results; question_id=results_strengths_limits', 'results', 6),
            ('Significance and implications emphasized.', 'section=results; question_id=results_significance', 'results', 7),
            ('Goals/questions addressed.', 'section=results; question_id=results_goals_addressed', 'results', 8),

            ('Poster design is clean and clear.', 'section=presentation; question_id=presentation_design', 'presentation', 9),
            ('Well organized.', 'section=presentation; question_id=presentation_organized', 'presentation', 10),
            ('Effectively summarized.', 'section=presentation; question_id=presentation_summary', 'presentation', 11),

            ('Contribution to field.', 'section=significance; question_id=significance_contribution', 'significance', 12),
            ('Novel / new approach.', 'section=significance; question_id=significance_novel', 'significance', 13),

            ('Understands subject and related areas.', 'section=understanding; question_id=understanding_subject', 'understanding', 14),
            ('Effective responses to questions.', 'section=understanding; question_id=understanding_responses', 'understanding', 15)
    ) as c(name, description, criterion_category, display_order)
    returning criterion_id
),
target_tracks as (
    select t.track_id
    from track t
    join params p
      on t.event_instance_id = p.target_event_instance_id
    where t.track_id = p.target_track_id
),
clear_other_defaults as (
    update track_rubric tr
       set is_default = false
      from target_tracks tt
     where tr.track_id = tt.track_id
),
upsert_track_links as (
    insert into track_rubric (
        track_id,
        rubric_id,
        is_default,
        condition_json
    )
    select
        tt.track_id,
        (select rubric_id from resolved_rubric),
        true,
        null
    from target_tracks tt
    on conflict (track_id, rubric_id)
    do update set
        is_default = true,
        condition_json = excluded.condition_json
    returning track_rubric_id
)
select
    (select rubric_id from resolved_rubric) as rubric_id,
    (select count(*) from insert_criteria) as criteria_inserted,
    (select count(*) from target_tracks) as tracks_found,
    (select count(*) from upsert_track_links) as track_links_upserted;

commit;