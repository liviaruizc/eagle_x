-- Seed facet_option values used by cleaned judge import and queue matching.
-- Uses separate WITH scopes per INSERT to avoid CTE scope errors.

begin;

with college_f as (
    select facet_id
    from public.facet
    where upper(code) = 'COLLEGE'
    limit 1
)
insert into public.facet_option (facet_id, value, label, sort_order)
select f.facet_id, v.value, v.label, v.sort_order
from college_f f
cross join (
    values
        ('COLLEGE_OF_ARTS_AND_SCIENCES','College of Arts & Sciences',1),
        ('LUTGERT_COLLEGE_OF_BUSINESS','Lutgert College of Business',2),
        ('MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES','Marieb College of Health & Human Services',3),
        ('WHITAKER_COLLEGE_OF_ENGINEERING','U.A. Whitaker College of Engineering',4),
        ('THE_WATER_SCHOOL','The Water School',5)
) as v(value,label,sort_order)
where not exists (
    select 1
    from public.facet_option fo
    where fo.facet_id = f.facet_id
      and upper(fo.value) = upper(v.value)
);

with program_f as (
    select facet_id
    from public.facet
    where upper(code) = 'PROGRAM'
    limit 1
)
insert into public.facet_option (facet_id, value, label, sort_order)
select f.facet_id, v.value, v.label, v.sort_order
from program_f f
cross join (
    values
        ('BIOLOGY_BIOMEDICAL','Biology / Biomedical',1),
        ('CHEMISTRY_BIOCHEMISTRY','Chemistry / Biochemistry',2),
        ('CIVIL_ENVIRONMENTAL_ENGINEERING','Civil / Environmental Engineering',3),
        ('COMMUNICATION','Communication',4),
        ('COMPUTER_SCIENCE','Computer Science',5),
        ('CONSTRUCTION_MANAGEMENT','Construction Management',6),
        ('DATA_SCIENCE_ANALYTICS','Data Science / Analytics',7),
        ('ECONOMICS','Economics',8),
        ('EDUCATION_FIRST_YEAR_STUDIES','Education / First Year Studies',9),
        ('ENGINEERING_GENERAL','Engineering (General)',10),
        ('EXERCISE_SCIENCE','Exercise Science',11),
        ('GENERAL_ED_RESEARCH','General Ed Research',12),
        ('HEALTH_SCIENCES','Health Sciences',13),
        ('HISTORY','History',14),
        ('LIBRARY_RESEARCH_GENERAL_ED','Library Research / General Ed',15),
        ('MARKETING','Marketing',16),
        ('MATHEMATICS','Mathematics',17),
        ('NURSING','Nursing',18),
        ('PHYSICAL_THERAPY','Physical Therapy',19),
        ('PHYSICIAN_ASSISTANT_STUDIES','Physician Assistant Studies',20),
        ('PHYSICS','Physics',21),
        ('PSYCHOLOGY','Psychology',22),
        ('PUBLIC_HEALTH','Public Health',23),
        ('SOCIAL_WORK','Social Work',24),
        ('SOFTWARE_ENGINEERING','Software Engineering',25)
) as v(value,label,sort_order)
where not exists (
    select 1
    from public.facet_option fo
    where fo.facet_id = f.facet_id
      and upper(fo.value) = upper(v.value)
);

with session_f as (
    select facet_id
    from public.facet
    where upper(code) in ('JUDGE_SESSION_PREFERENCE','SESSION')
    limit 1
)
insert into public.facet_option (facet_id, value, label, sort_order)
select f.facet_id, v.value, v.label, v.sort_order
from session_f f
cross join (
    values
        ('A','Session A',1),
        ('B','Session B',2)
) as v(value,label,sort_order)
where not exists (
    select 1
    from public.facet_option fo
    where fo.facet_id = f.facet_id
      and upper(fo.value) = upper(v.value)
);

commit;
