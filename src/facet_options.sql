-- ============================================
-- FGCU facet_option seed (works with UUID PKs)
-- Requires these facets already exist in facet table:
--   LEVEL, COLLEGE, DEGREE, PROGRAM
-- ============================================

-- 1) LEVEL options
WITH f AS (
  SELECT facet_id FROM facet WHERE code = 'LEVEL'
),
vals AS (
  SELECT *
  FROM (VALUES
    ('GRADUATE', 'Graduate'),
    ('UNDERGRADUATE', 'Undergraduate')
  ) v(value, label)
),
ordered AS (
  SELECT value, label,
         ROW_NUMBER() OVER (ORDER BY label) AS sort_order
  FROM vals
)
INSERT INTO facet_option (facet_option_id, facet_id, value, label, parent_option_id, sort_order, created_at)
SELECT gen_random_uuid(), f.facet_id, o.value, o.label, NULL, o.sort_order, now()
FROM ordered o CROSS JOIN f
WHERE NOT EXISTS (
  SELECT 1 FROM facet_option fo
  WHERE fo.facet_id = f.facet_id AND fo.value = o.value
);

-- 2) COLLEGE options
WITH f AS (
  SELECT facet_id FROM facet WHERE code = 'COLLEGE'
),
vals AS (
  SELECT *
  FROM (VALUES
    ('COLLEGE_OF_ARTS_AND_SCIENCES', 'College of Arts & Sciences'),
    ('COLLEGE_OF_EDUCATION', 'College of Education'),
    ('LUTGERT_COLLEGE_OF_BUSINESS', 'Lutgert College of Business'),
    ('MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES', 'Marieb College of Health & Human Services'),
    ('SCHOOL_OF_ENTREPRENEURSHIP', 'School of Entrepreneurship'),
    ('U_A_WHITAKER_COLLEGE_OF_ENGINEERING', 'U.A. Whitaker College of Engineering')
  ) v(value, label)
),
ordered AS (
  SELECT value, label,
         ROW_NUMBER() OVER (ORDER BY label) AS sort_order
  FROM vals
)
INSERT INTO facet_option (facet_option_id, facet_id, value, label, parent_option_id, sort_order, created_at)
SELECT gen_random_uuid(), f.facet_id, o.value, o.label, NULL, o.sort_order, now()
FROM ordered o CROSS JOIN f
WHERE NOT EXISTS (
  SELECT 1 FROM facet_option fo
  WHERE fo.facet_id = f.facet_id AND fo.value = o.value
);

-- 3) DEGREE options (from your FGCU_Programs.xlsx)
WITH f AS (
  SELECT facet_id FROM facet WHERE code = 'DEGREE'
),
vals AS (
  SELECT *
  FROM (VALUES
    ('B_A', 'B.A.'),
    ('B_A_B_S', 'B.A./B.S.'),
    ('B_S', 'B.S.'),
    ('B_S_N', 'B.S.N.'),
    ('B_S_P_H', 'B.S.P.H.'),
    ('B_S_W', 'B.S.W.'),
    ('D_N_P', 'D.N.P.'),
    ('D_P_T', 'D.P.T.'),
    ('ED_D', 'Ed.D.'),
    ('M_A', 'M.A.'),
    ('M_A_T', 'M.A.T.'),
    ('M_B_A', 'M.B.A.'),
    ('M_S', 'M.S.'),
    ('M_S_N', 'M.S.N.')
  ) v(value, label)
),
ordered AS (
  SELECT value, label,
         ROW_NUMBER() OVER (ORDER BY label) AS sort_order
  FROM vals
)
INSERT INTO facet_option (facet_option_id, facet_id, value, label, parent_option_id, sort_order, created_at)
SELECT gen_random_uuid(), f.facet_id, o.value, o.label, NULL, o.sort_order, now()
FROM ordered o CROSS JOIN f
WHERE NOT EXISTS (
  SELECT 1 FROM facet_option fo
  WHERE fo.facet_id = f.facet_id AND fo.value = o.value
);

-- 4) PROGRAM options (hierarchical under COLLEGE via parent_option_id)
WITH program_f AS (
  SELECT facet_id FROM facet WHERE code = 'PROGRAM'
),
college_f AS (
  SELECT facet_id FROM facet WHERE code = 'COLLEGE'
),
college_map AS (
  SELECT fo.value AS college_value, fo.facet_option_id AS college_option_id
  FROM facet_option fo
  JOIN college_f cf ON cf.facet_id = fo.facet_id
),
vals AS (
  SELECT *
  FROM (VALUES
    -- Arts & Sciences
    ('COLLEGE_OF_ARTS_AND_SCIENCES:ANTHROPOLOGY', 'Anthropology', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:BIOCHEMISTRY', 'Biochemistry', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:BIOLOGY', 'Biology', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:CHEMISTRY', 'Chemistry', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:MARINE_SCIENCE', 'Marine Science', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:MATHEMATICS', 'Mathematics', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:PSYCHOLOGY', 'Psychology', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:SOCIOLOGY', 'Sociology', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:M_A_ENGLISH', 'M.A. English', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:M_S_APPLIED_MATHEMATICS', 'M.S. Applied Mathematics', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:M_S_BIOLOGY', 'M.S. Biology', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:M_S_CHEMISTRY', 'M.S. Chemistry', 'COLLEGE_OF_ARTS_AND_SCIENCES'),
    ('COLLEGE_OF_ARTS_AND_SCIENCES:M_S_PSYCHOLOGY', 'M.S. Psychology', 'COLLEGE_OF_ARTS_AND_SCIENCES'),

    -- Education
    ('COLLEGE_OF_EDUCATION:CURRICULUM_INSTRUCTION', 'Curriculum & Instruction', 'COLLEGE_OF_EDUCATION'),
    ('COLLEGE_OF_EDUCATION:EDUCATIONAL_LEADERSHIP', 'Educational Leadership', 'COLLEGE_OF_EDUCATION'),
    ('COLLEGE_OF_EDUCATION:MENTAL_HEALTH_COUNSELING', 'Mental Health Counseling', 'COLLEGE_OF_EDUCATION'),
    ('COLLEGE_OF_EDUCATION:SECONDARY_EDUCATION', 'Secondary Education', 'COLLEGE_OF_EDUCATION'),
    ('COLLEGE_OF_EDUCATION:SPECIAL_EDUCATION', 'Special Education', 'COLLEGE_OF_EDUCATION'),

    -- Lutgert Business
    ('LUTGERT_COLLEGE_OF_BUSINESS:ACCOUNTING', 'Accounting', 'LUTGERT_COLLEGE_OF_BUSINESS'),
    ('LUTGERT_COLLEGE_OF_BUSINESS:DATA_ANALYTICS', 'Data Analytics', 'LUTGERT_COLLEGE_OF_BUSINESS'),
    ('LUTGERT_COLLEGE_OF_BUSINESS:FINANCE', 'Finance', 'LUTGERT_COLLEGE_OF_BUSINESS'),
    ('LUTGERT_COLLEGE_OF_BUSINESS:MANAGEMENT', 'Management', 'LUTGERT_COLLEGE_OF_BUSINESS'),
    ('LUTGERT_COLLEGE_OF_BUSINESS:MARKETING', 'Marketing', 'LUTGERT_COLLEGE_OF_BUSINESS'),
    ('LUTGERT_COLLEGE_OF_BUSINESS:M_B_A', 'M.B.A.', 'LUTGERT_COLLEGE_OF_BUSINESS'),

    -- Marieb Health & Human Services
    ('MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES:COMMUNITY_HEALTH', 'Community Health', 'MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES'),
    ('MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES:NURSING', 'Nursing', 'MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES'),
    ('MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES:PHYSICAL_THERAPY', 'Physical Therapy', 'MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES'),
    ('MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES:SOCIAL_WORK', 'Social Work', 'MARIEB_COLLEGE_OF_HEALTH_AND_HUMAN_SERVICES'),

    -- Entrepreneurship
    ('SCHOOL_OF_ENTREPRENEURSHIP:ENTREPRENEURSHIP', 'Entrepreneurship', 'SCHOOL_OF_ENTREPRENEURSHIP'),

    -- Whitaker Engineering
    ('U_A_WHITAKER_COLLEGE_OF_ENGINEERING:COMPUTER_ENGINEERING', 'Computer Engineering', 'U_A_WHITAKER_COLLEGE_OF_ENGINEERING'),
    ('U_A_WHITAKER_COLLEGE_OF_ENGINEERING:COMPUTING_SCIENCE', 'Computing Science', 'U_A_WHITAKER_COLLEGE_OF_ENGINEERING'),
    ('U_A_WHITAKER_COLLEGE_OF_ENGINEERING:SOFTWARE_ENGINEERING', 'Software Engineering', 'U_A_WHITAKER_COLLEGE_OF_ENGINEERING'),
    ('U_A_WHITAKER_COLLEGE_OF_ENGINEERING:CIVIL_ENGINEERING', 'Civil Engineering', 'U_A_WHITAKER_COLLEGE_OF_ENGINEERING'),
    ('U_A_WHITAKER_COLLEGE_OF_ENGINEERING:ENVIRONMENTAL_ENGINEERING', 'Environmental Engineering', 'U_A_WHITAKER_COLLEGE_OF_ENGINEERING')
  ) v(value, label, college_value)
),
ordered AS (
  SELECT value, label, college_value,
         ROW_NUMBER() OVER (PARTITION BY college_value ORDER BY label) AS sort_order
  FROM vals
)
INSERT INTO facet_option (facet_option_id, facet_id, value, label, parent_option_id, sort_order, created_at)
SELECT gen_random_uuid(),
       pf.facet_id,
       o.value,
       o.label,
       cm.college_option_id,
       o.sort_order,
       now()
FROM ordered o
JOIN college_map cm ON cm.college_value = o.college_value
CROSS JOIN program_f pf
WHERE NOT EXISTS (
  SELECT 1 FROM facet_option fo
  WHERE fo.facet_id = pf.facet_id AND fo.value = o.value
);
