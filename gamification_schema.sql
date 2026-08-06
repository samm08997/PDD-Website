-- ============================================================
-- CramAI — Gamification & Productivity Module
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. STUDY STREAKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_streaks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak    INTEGER DEFAULT 0 NOT NULL,
  longest_streak    INTEGER DEFAULT 0 NOT NULL,
  total_study_days  INTEGER DEFAULT 0 NOT NULL,
  last_study_date   DATE,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT study_streaks_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_streaks_user_id ON public.study_streaks(user_id);

ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own streak" ON public.study_streaks;
CREATE POLICY "Users can view their own streak"
  ON public.study_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streak" ON public.study_streaks;
CREATE POLICY "Users can insert their own streak"
  ON public.study_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streak" ON public.study_streaks;
CREATE POLICY "Users can update their own streak"
  ON public.study_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. STUDY PLANNER
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_planner (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT DEFAULT '' NOT NULL,
  subject           TEXT DEFAULT '' NOT NULL,
  category          TEXT DEFAULT 'General' NOT NULL,
  priority          TEXT DEFAULT 'Medium' NOT NULL
                    CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  estimated_minutes INTEGER DEFAULT 30 NOT NULL,
  due_date          DATE,
  reminder_time     TIMESTAMPTZ,
  status            TEXT DEFAULT 'Pending' NOT NULL
                    CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue', 'Archived')),
  color_tag         TEXT DEFAULT '#6366F1' NOT NULL,
  notes             TEXT DEFAULT '' NOT NULL,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_planner_user_id   ON public.study_planner(user_id);
CREATE INDEX IF NOT EXISTS idx_study_planner_status    ON public.study_planner(status);
CREATE INDEX IF NOT EXISTS idx_study_planner_due_date  ON public.study_planner(due_date);
CREATE INDEX IF NOT EXISTS idx_study_planner_priority  ON public.study_planner(priority);

ALTER TABLE public.study_planner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own plans" ON public.study_planner;
CREATE POLICY "Users can view their own plans"
  ON public.study_planner FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own plans" ON public.study_planner;
CREATE POLICY "Users can insert their own plans"
  ON public.study_planner FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own plans" ON public.study_planner;
CREATE POLICY "Users can update their own plans"
  ON public.study_planner FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own plans" ON public.study_planner;
CREATE POLICY "Users can delete their own plans"
  ON public.study_planner FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. ACHIEVEMENT BADGES (definitions — seeded)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievement_badges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,  -- stable identifier used in logic
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,         -- emoji or icon name
  rarity      TEXT NOT NULL CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary')),
  xp_reward   INTEGER DEFAULT 50 NOT NULL,
  category    TEXT NOT NULL,
  requirement JSONB NOT NULL,        -- e.g. {"type":"streak","value":7}
  sort_order  INTEGER DEFAULT 0 NOT NULL
);

-- Seed all 25 badges
INSERT INTO public.achievement_badges (key, name, description, icon, rarity, xp_reward, category, requirement, sort_order) VALUES
  -- Beginner
  ('first_session',       'First Step',           'Complete your first study session',              '📘', 'Common',    50,  'Beginner',     '{"type":"sessions","value":1}',         1),
  -- Consistency — Streaks
  ('streak_3',            '3-Day Streak',          'Study 3 days in a row',                         '🔥', 'Common',    50,  'Consistency',  '{"type":"streak","value":3}',           2),
  ('streak_7',            'Week Warrior',          'Study 7 days in a row',                         '🔥', 'Rare',      100, 'Consistency',  '{"type":"streak","value":7}',           3),
  ('streak_15',           'Fortnight Flame',       'Study 15 days in a row',                        '🔥', 'Rare',      150, 'Consistency',  '{"type":"streak","value":15}',          4),
  ('streak_30',           'Monthly Master',        'Study 30 days in a row',                        '🔥', 'Epic',      200, 'Consistency',  '{"type":"streak","value":30}',          5),
  ('streak_60',           '60-Day Legend',         'Study 60 days in a row',                        '🔥', 'Epic',      300, 'Consistency',  '{"type":"streak","value":60}',          6),
  ('streak_100',          'Century Scholar',       'Study 100 days in a row',                       '🔥', 'Legendary', 500, 'Consistency',  '{"type":"streak","value":100}',         7),
  -- Productivity — Sessions
  ('plan_10',             'Planner Pro',           'Plan 10 study sessions',                        '📅', 'Common',    50,  'Productivity', '{"type":"planner_created","value":10}', 8),
  ('complete_25',         'Dedicated Learner',     'Complete 25 study sessions',                    '📅', 'Common',    75,  'Productivity', '{"type":"sessions","value":25}',        9),
  ('complete_50',         'Study Champion',        'Complete 50 study sessions',                    '📅', 'Rare',      150, 'Productivity', '{"type":"sessions","value":50}',        10),
  ('complete_100',        'Session Centurion',     'Complete 100 study sessions',                   '📅', 'Epic',      300, 'Productivity', '{"type":"sessions","value":100}',       11),
  -- Time Master — Hours
  ('hours_5',             'First Hours',           'Study for 5 hours total',                       '⏱', 'Common',    50,  'Time Master',  '{"type":"hours","value":5}',            12),
  ('hours_10',            'Time Investor',         'Study for 10 hours total',                      '⏱', 'Common',    75,  'Time Master',  '{"type":"hours","value":10}',           13),
  ('hours_25',            'Quarter Century',       'Study for 25 hours total',                      '⏱', 'Rare',      150, 'Time Master',  '{"type":"hours","value":25}',           14),
  ('hours_50',            'Half Century',          'Study for 50 hours total',                      '⏱', 'Epic',      250, 'Time Master',  '{"type":"hours","value":50}',           15),
  ('hours_100',           'Century of Study',      'Study for 100 hours total',                     '⏱', 'Legendary', 500, 'Time Master',  '{"type":"hours","value":100}',          16),
  -- Focus Master
  ('focus_master',        'Focus Master',          'Complete 10 planner tasks on time',             '🎯', 'Rare',      150, 'Focus',        '{"type":"on_time_tasks","value":10}',   17),
  -- Consistent Learner
  ('week_learner',        'Consistent Learner',    'Study every day for a full week',               '📆', 'Rare',      100, 'Consistency',  '{"type":"streak","value":7}',           18),
  -- Subject Explorer
  ('subject_explorer',    'Subject Explorer',      'Study in 5 different subjects',                 '🗺', 'Rare',      150, 'Productivity', '{"type":"subjects","value":5}',         19),
  -- Planner Champion
  ('planner_champion',    'Planner Champion',      'Complete every planned task in a week',         '🏆', 'Epic',      300, 'Productivity', '{"type":"weekly_perfect","value":1}',   20),
  -- XP Milestones
  ('xp_1000',             'XP Climber',            'Earn 1,000 total XP',                           '⭐', 'Common',    100, 'XP',           '{"type":"xp","value":1000}',            21),
  ('xp_5000',             'XP Legend',             'Earn 5,000 total XP',                           '⭐', 'Rare',      200, 'XP',           '{"type":"xp","value":5000}',            22),
  -- Quiz & Deck
  ('quiz_master',         'Quiz Master',           'Complete 10 quizzes',                           '🧠', 'Rare',      150, 'Productivity', '{"type":"quizzes","value":10}',         23),
  ('deck_builder',        'Deck Builder',          'Create 10 flashcard decks',                     '🗂', 'Rare',      150, 'Productivity', '{"type":"decks","value":10}',           24),
  -- Legendary
  ('legendary_scholar',   'Legendary Scholar',     'Unlock every available badge',                  '👑', 'Legendary', 1000,'Legendary',    '{"type":"all_badges","value":24}',      25)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. USER BADGES (unlock records)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES public.achievement_badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  xp_awarded  INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id  ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;
CREATE POLICY "Users can insert their own badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 5. USER PROGRESS (XP + stats)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_progress (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp              INTEGER DEFAULT 0 NOT NULL,
  level                 INTEGER DEFAULT 1 NOT NULL,
  total_sessions        INTEGER DEFAULT 0 NOT NULL,
  total_minutes_studied INTEGER DEFAULT 0 NOT NULL,
  total_planner_tasks   INTEGER DEFAULT 0 NOT NULL,
  total_quizzes         INTEGER DEFAULT 0 NOT NULL,
  total_decks_created   INTEGER DEFAULT 0 NOT NULL,
  subjects_studied      TEXT[] DEFAULT '{}' NOT NULL,
  on_time_tasks         INTEGER DEFAULT 0 NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT user_progress_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Done! Run this entire script in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────
