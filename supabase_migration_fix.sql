-- Idempotent persistence alignment for existing AcadeTCBT databases.

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_text TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS session TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'MCQ';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic_id TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic_name TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS version_number INTEGER;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS faculty_id TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS last_modified_by TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS version_history JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS quality_score TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS issues_detected JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_warning BOOLEAN;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS suggested_fix TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS suggested_version JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS times_answered INTEGER;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS times_failed INTEGER;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS average_success_rate NUMERIC;
ALTER TABLE public.questions ALTER COLUMN status SET DEFAULT 'Published';

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.courses ALTER COLUMN is_active SET DEFAULT TRUE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS session TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS percentage NUMERIC DEFAULT 0;
ALTER TABLE public.results ALTER COLUMN percentage SET DEFAULT 0;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'practice';
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS course_title TEXT;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS question_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS marked_for_review JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;

ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS course_title TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS university_name TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS access_level TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS total_downloads INTEGER DEFAULT 0;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS pages_count INTEGER;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS google_user_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seen_question_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS purchased_material_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_practice_date TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by TEXT;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS handled_by_admin TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Catalog rows live in local seed/localStorage and are pushed on demand.
-- Enforced catalog FKs turn an unsynchronized course upload into a failed
-- question write, which is the silent failure this migration fixes.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_course_id_fkey;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_university_id_fkey;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_department_id_fkey;
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_course_id_fkey;
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_university_id_fkey;

-- Password hashes are service-role-only data. RLS is enabled with no policy,
-- so only the service-role key may touch admins. Configure
-- SUPABASE_SERVICE_ROLE_KEY for server-side admin sync to work.
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
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.full_activity_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT,
  module TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
