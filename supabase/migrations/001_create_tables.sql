-- ============================================================================
-- SUPABASE DATABASE SCHEMA FOR ACADET CBT MASTER
-- This migration creates all necessary tables for the CBT platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. UNIVERSITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  location TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. FACULTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, university_id)
);

-- ============================================================================
-- 3. DEPARTMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, university_id)
);

-- ============================================================================
-- 4. COURSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  level TEXT, -- e.g., "100 Level", "200 Level"
  credit_units INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(code, university_id)
);

-- ============================================================================
-- 5. QUESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- Must be A, B, C, or D
  explanation TEXT,
  difficulty TEXT DEFAULT 'Medium', -- Easy, Medium, Hard
  topic TEXT,
  category TEXT,
  created_by UUID, -- Admin user ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. STUDY MATERIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  material_type TEXT, -- e.g., "PDF", "Video", "Document"
  content TEXT,
  file_url TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. USERS TABLE (Students & Admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  profile_picture_url TEXT,
  role TEXT DEFAULT 'student', -- student, admin, etc.
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  level TEXT,
  subscription_status TEXT DEFAULT 'free', -- free, active, expired
  subscription_plan TEXT DEFAULT 'Free Tier',
  subscription_start_date TIMESTAMP,
  subscription_expiry_date TIMESTAMP,
  total_questions_attempted INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_score DECIMAL DEFAULT 0,
  referred_by TEXT,
  total_referrals INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  provider TEXT, -- squad, korapay
  amount DECIMAL NOT NULL,
  payment_reference TEXT UNIQUE,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  amount DECIMAL NOT NULL,
  plan TEXT NOT NULL,
  plan_id TEXT,
  duration_days INTEGER DEFAULT 30,
  provider TEXT, -- squad, korapay
  transaction_ref TEXT UNIQUE NOT NULL,
  gateway_transaction_id TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending', -- pending, success, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. RESULTS / EXAM RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  score DECIMAL DEFAULT 0,
  percentage DECIMAL DEFAULT 0,
  time_spent_seconds INTEGER,
  status TEXT DEFAULT 'completed', -- completed, in_progress, abandoned
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. ADMINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'super_admin', -- super_admin, student_manager, question_manager, etc.
  status TEXT DEFAULT 'Active', -- Active, Inactive, Suspended
  avatar_url TEXT,
  last_login TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- ============================================================================
-- 12. SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  duration_days INTEGER DEFAULT 30,
  description TEXT,
  features TEXT[], -- Array of features
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT, -- questions, courses, users, etc.
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 14. WEBHOOK LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  transaction_ref TEXT,
  provider TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  amount DECIMAL,
  status TEXT,
  response_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 15. SYSTEM CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_configs (
  id TEXT PRIMARY KEY,
  config_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Questions indexes
CREATE INDEX idx_questions_course_id ON questions(course_id);
CREATE INDEX idx_questions_university_id ON questions(university_id);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_university_id ON users(university_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Results indexes
CREATE INDEX idx_results_user_id ON results(user_id);
CREATE INDEX idx_results_course_id ON results(course_id);
CREATE INDEX idx_results_created_at ON results(created_at DESC);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_transaction_ref ON payments(transaction_ref);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at DESC);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Public read access for universities, courses, questions, materials
CREATE POLICY "Public read access" ON universities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON courses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON questions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON materials FOR SELECT USING (true);
CREATE POLICY "Public read access" ON faculties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON subscription_plans FOR SELECT USING (true);

-- Users can read their own data
CREATE POLICY "Users read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Admin can manage everything
CREATE POLICY "Admin full access" ON universities FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON courses FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON questions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON materials FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON payments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- SEED DATA (Optional - Default Subscription Plans)
-- ============================================================================

INSERT INTO subscription_plans (id, name, price, duration_days, description, is_active) 
VALUES 
  ('plan-1d', '1-Day Starter Pass', 150, 1, 'Access for 1 day', true),
  ('premium-150', '1-Day Starter Pass', 150, 1, 'Access for 1 day', true),
  ('plan-150', '1-Day Starter Pass', 150, 1, 'Access for 1 day', true),
  ('premium', 'Premium Plan', 800, 30, '30-day premium access', true),
  ('premium-basic', 'Premium Basic', 800, 14, '14-day premium access', true),
  ('plan-14d', 'Premium Basic (14-Day)', 800, 14, '14-day premium access', true),
  ('premium-plus', 'Premium Plus', 1500, 30, '30-day premium plus access', true),
  ('plan-30d', 'Premium Plus (30-Day)', 1500, 30, '30-day premium plus access', true),
  ('premium-pro', 'Premium Pro', 3500, 90, '90-day premium pro access', true),
  ('plan-90d', 'Premium Pro (90-Day)', 3500, 90, '90-day premium pro access', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
