-- ==============================================================================
-- ACADET CBT MASTER — COMPLETE SUPABASE POSTGRESQL DATABASE SCHEMA
-- Run this SQL in your Supabase Dashboard -> SQL Editor -> Click 'Run'
-- ==============================================================================

-- Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Universities Table
CREATE TABLE IF NOT EXISTS public.universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  location TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Faculties Table
CREATE TABLE IF NOT EXISTS public.faculties (
  id TEXT PRIMARY KEY,
  university_id TEXT REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  faculty_id TEXT REFERENCES public.faculties(id) ON DELETE CASCADE,
  university_id TEXT REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  university_id TEXT REFERENCES public.universities(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  level TEXT DEFAULT '100',
  semester TEXT DEFAULT 'First',
  session TEXT,
  university_name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  university_id TEXT,
  department_id TEXT,
  year TEXT,
  topic TEXT,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  difficulty TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'Published',
  level TEXT,
  semester TEXT,
  session TEXT,
  source TEXT,
  course_code TEXT,
  question_type TEXT DEFAULT 'MCQ',
  topic_id TEXT,
  topic_name TEXT,
  faculty_id TEXT,
  created_by TEXT,
  last_modified_by TEXT,
  version_number INTEGER,
  version_history JSONB,
  quality_score TEXT,
  issues_detected JSONB,
  is_warning BOOLEAN,
  suggested_fix TEXT,
  suggested_version JSONB,
  times_answered INTEGER,
  times_failed INTEGER,
  average_success_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Study Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  university_id TEXT,
  title TEXT NOT NULL,
  level TEXT,
  semester TEXT,
  course_code TEXT,
  course_title TEXT,
  university_name TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  access_level TEXT,
  file_size TEXT,
  total_downloads INTEGER DEFAULT 0,
  uploaded_by TEXT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'Active',
  video_url TEXT,
  description TEXT,
  topic TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  pages_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_days INTEGER DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Users / Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  photo_url TEXT,
  auth_provider TEXT,
  google_user_id TEXT,
  role TEXT DEFAULT 'student',
  university_id TEXT,
  university_name TEXT,
  department_id TEXT,
  department_name TEXT,
  subscription JSONB DEFAULT '{"isPremium": false, "plan": "Free Tier"}'::jsonb,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  seen_question_ids JSONB DEFAULT '[]'::jsonb,
  purchased_material_ids JSONB DEFAULT '[]'::jsonb,
  streak_count INTEGER DEFAULT 0,
  last_practice_date TIMESTAMPTZ,
  streak_history JSONB DEFAULT '[]'::jsonb,
  is_restricted BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  subscription_plan TEXT,
  subscription_status TEXT,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Test Results & CBT Sessions Table
CREATE TABLE IF NOT EXISTS public.results (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT,
  type TEXT DEFAULT 'practice',
  course_code TEXT,
  course_title TEXT,
  university_name TEXT,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  question_ids JSONB DEFAULT '[]'::jsonb,
  marked_for_review JSONB DEFAULT '[]'::jsonb,
  time_limit_minutes INTEGER,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  gateway TEXT DEFAULT 'squad',
  status TEXT DEFAULT 'pending',
  plan_id TEXT,
  plan_name TEXT,
  payment_method TEXT,
  expiry_date TIMESTAMPTZ,
  proof_url TEXT,
  handled_by_admin TEXT,
  rejection_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. System Configurations & Signup Faculty Groups Table
CREATE TABLE IF NOT EXISTS public.system_configs (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password hashes are service-role-only data. RLS is enabled with no policy,
-- so the server must have SUPABASE_SERVICE_ROLE_KEY configured for admin sync.
CREATE TABLE IF NOT EXISTS public.admins (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.full_activity_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT,
  module TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Indexes for High-Speed Query Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON public.questions(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_university_id ON public.questions(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON public.courses(university_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON public.results(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Allow students and visitors to browse courses & questions)
DROP POLICY IF EXISTS "Public Read Universities" ON public.universities;
CREATE POLICY "Public Read Universities" ON public.universities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Faculties" ON public.faculties;
CREATE POLICY "Public Read Faculties" ON public.faculties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Departments" ON public.departments;
CREATE POLICY "Public Read Departments" ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Courses" ON public.courses;
CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Questions" ON public.questions;
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Materials" ON public.materials;
CREATE POLICY "Public Read Materials" ON public.materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Plans" ON public.subscription_plans;
CREATE POLICY "Public Read Plans" ON public.subscription_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Read Configs" ON public.system_configs;
CREATE POLICY "Public Read Configs" ON public.system_configs FOR SELECT USING (true);

-- Authenticated / Service-Role Full Access Policies
DROP POLICY IF EXISTS "Full Access Universities" ON public.universities;
CREATE POLICY "Full Access Universities" ON public.universities FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Faculties" ON public.faculties;
DROP POLICY IF EXISTS "Full Access Departments" ON public.departments;
CREATE POLICY "Full Access Departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Courses" ON public.courses;
CREATE POLICY "Full Access Courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Questions" ON public.questions;
CREATE POLICY "Full Access Questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Materials" ON public.materials;
CREATE POLICY "Full Access Materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Plans" ON public.subscription_plans;
CREATE POLICY "Full Access Plans" ON public.subscription_plans FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Users" ON public.users;
CREATE POLICY "Full Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Results" ON public.results;
CREATE POLICY "Full Access Results" ON public.results FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Payments" ON public.payments;
CREATE POLICY "Full Access Payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Full Access Configs" ON public.system_configs;
CREATE POLICY "Full Access Configs" ON public.system_configs FOR ALL USING (true) WITH CHECK (true);
