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
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  university_id TEXT REFERENCES public.universities(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Study Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  university_id TEXT REFERENCES public.universities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  description TEXT,
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
  role TEXT DEFAULT 'student',
  university_name TEXT,
  department_name TEXT,
  subscription JSONB DEFAULT '{"isPremium": false, "plan": "Free Tier"}'::jsonb,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Test Results & CBT Sessions Table
CREATE TABLE IF NOT EXISTS public.results (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  user_id TEXT,
  user_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  gateway TEXT DEFAULT 'squad',
  status TEXT DEFAULT 'pending',
  plan_id TEXT,
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
-- Re-run these policy changes against the live Supabase project after deployment.
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

-- Public Read Policies (Allow students and visitors to browse courses & questions)
CREATE POLICY "Public Read Universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Public Read Faculties" ON public.faculties FOR SELECT USING (true);
CREATE POLICY "Public Read Departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public Read Materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Public Read Plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public Read Configs" ON public.system_configs FOR SELECT USING (true);

-- Authenticated / Service-Role Full Access Policies
CREATE POLICY "Full Access Universities" ON public.universities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Faculties" ON public.faculties FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Departments" ON public.departments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Courses" ON public.courses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Questions" ON public.questions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Materials" ON public.materials FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Plans" ON public.subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Results" ON public.results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Payments" ON public.payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Configs" ON public.system_configs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users select own profile" ON public.users FOR SELECT TO authenticated
  USING ((auth.uid())::text = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO authenticated
  USING ((auth.uid())::text = id) WITH CHECK ((auth.uid())::text = id);
CREATE POLICY "Results select own" ON public.results FOR SELECT TO authenticated
  USING ((auth.uid())::text = user_id);
CREATE POLICY "Results insert own" ON public.results FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Payments select own" ON public.payments FOR SELECT TO authenticated
  USING ((auth.uid())::text = user_id);
