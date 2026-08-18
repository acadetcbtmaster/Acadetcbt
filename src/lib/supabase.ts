import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely extract Supabase credentials from either client or server environment
const getSupabaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
    if (process.env.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_SUPABASE_URL) return metaEnv.VITE_SUPABASE_URL;
  } catch {}
  return '';
};

const getSupabaseAnonKey = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
    if (process.env.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_SUPABASE_ANON_KEY) return metaEnv.VITE_SUPABASE_ANON_KEY;
  } catch {}
  return '';
};

const getSupabaseServiceKey = (): string => {
  if (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return '';
};

let cachedClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Checks if Supabase URL and Anon Key are set in the environment
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0 && !url.includes('placeholder'));
}

/**
 * Returns the public client for frontend / standard database queries
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase] Client initialization notice:', err);
      return null;
    }
  }

  return cachedClient;
}

/**
 * Returns the privileged admin / service-role client for backend operations
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey() || getSupabaseAnonKey();

  if (!url || !serviceKey) {
    return null;
  }

  if (!cachedAdminClient) {
    try {
      cachedAdminClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('[Supabase] Admin client initialization notice:', err);
      return null;
    }
  }

  return cachedAdminClient;
}

/**
 * Deterministically maps arbitrary string IDs to standard valid PostgreSQL UUIDs
 */
export function toUuid(id?: string | null): string {
  if (!id) {
    try {
      return crypto.randomUUID();
    } catch {
      return '00000000-0000-4000-a000-000000000000';
    }
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < id.length; i++) {
    ch = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hexFull = (hex1 + hex2 + hex1 + hex2).slice(0, 32);
  
  return `${hexFull.slice(0, 8)}-${hexFull.slice(8, 12)}-4${hexFull.slice(13, 16)}-a${hexFull.slice(17, 20)}-${hexFull.slice(20, 32)}`;
}

/**
 * Frontend Helper: Save or sync a test exam result to Supabase
 */
export async function syncResultToSupabase(result: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !result) return false;

    const payload = {
      id: toUuid(result.id),
      user_id: result.userId ? toUuid(result.userId) : null,
      course_id: result.courseId ? toUuid(result.courseId) : null,
      score: Number(result.score || 0),
      total_questions: Number(result.totalQuestions || 0),
      percentage: Number(result.percentage || 0),
      time_spent_seconds: Number(result.timeSpentSeconds || 0),
      answers_data: result.answers || result.userAnswers || {},
    };

    const { error } = await supabase.from('results').upsert(payload);
    if (error) {
      console.warn('[Supabase] Result sync notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Frontend Helper: Save or sync a user profile to Supabase
 */
export async function syncUserToSupabase(user: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return false;

    const payload = {
      id: toUuid(user.id),
      email: user.email || '',
      full_name: user.fullName || user.name || 'Student',
      username: user.username || '',
      phone: user.phone || '',
      role: user.role || 'student',
      university_name: user.universityName || '',
      department_name: user.departmentName || '',
      subscription: user.subscription || { isPremium: false, plan: 'Free Tier' },
      bookmarks: user.bookmarks || [],
      streak_count: Number(user.streakCount || 0),
    };

    const { error } = await supabase.from('users').upsert(payload);
    if (error) {
      console.warn('[Supabase] User sync notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Frontend Helper: Save or sync a payment record to Supabase
 */
export async function syncPaymentToSupabase(payment: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !payment) return false;

    const payload = {
      id: toUuid(payment.id),
      reference: payment.reference || `REF-${Date.now()}`,
      user_id: payment.userId ? toUuid(payment.userId) : null,
      user_email: payment.userEmail || '',
      amount: Number(payment.amount || 0),
      gateway: payment.gateway || 'squad',
      status: payment.status || 'success',
      plan_id: payment.planId || '',
      metadata: payment.metadata || {},
    };

    const { error } = await supabase.from('payments').upsert(payload);
    if (error) {
      console.warn('[Supabase] Payment sync notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Frontend Helper: Save or sync questions to Supabase in bulk
 */
export async function syncQuestionsToSupabase(questions: any[]): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !Array.isArray(questions) || questions.length === 0) return false;

    const records = questions.map((q: any) => ({
      id: toUuid(q.id),
      course_id: q.courseId || q.course_id ? toUuid(q.courseId || q.course_id) : null,
      university_id: q.universityId || q.university_id ? toUuid(q.universityId || q.university_id) : null,
      department_id: q.departmentId || q.department_id ? toUuid(q.departmentId || q.department_id) : null,
      question_text: q.question || q.question_text || '',
      option_a: q.optionA || q.option_a || '',
      option_b: q.optionB || q.option_b || '',
      option_c: q.optionC || q.option_c || '',
      option_d: q.optionD || q.option_d || '',
      correct_answer: q.correctAnswer || q.correct_answer || 'A',
      explanation: q.explanation || '',
      topic: q.topic || '',
      difficulty: q.difficulty || 'Medium',
    }));

    // Perform chunked upsert (max 100 items per chunk)
    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase.from('questions').upsert(chunk);
      if (error) {
        console.warn('[Supabase] Questions batch sync notice:', error.message);
      }
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Questions sync exception:', err);
    return false;
  }
}

/**
 * Frontend Helper: Save or sync a single question to Supabase
 */
export async function syncQuestionToSupabase(q: any): Promise<boolean> {
  return syncQuestionsToSupabase([q]);
}

/**
 * Frontend Helper: Delete a question from Supabase
 */
export async function deleteQuestionFromSupabase(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !id) return false;
    const { error } = await supabase.from('questions').delete().eq('id', toUuid(id));
    if (error) {
      console.warn('[Supabase] Question delete notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Frontend Helper: Sync universities to Supabase
 */
export async function syncUniversitiesToSupabase(unis: any[]): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !Array.isArray(unis) || unis.length === 0) return false;

    const records = unis.map((u: any) => ({
      id: toUuid(u.id),
      name: u.name || '',
      code: u.shortName || u.short_name || u.code || '',
      logo_url: u.logoUrl || u.logo_url || '',
      website: u.website || '',
    }));

    const { error } = await supabase.from('universities').upsert(records);
    if (error) {
      console.warn('[Supabase] Universities sync notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Frontend Helper: Sync courses to Supabase
 */
export async function syncCoursesToSupabase(courses: any[]): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !Array.isArray(courses) || courses.length === 0) return false;

    const records = courses.map((c: any) => ({
      id: toUuid(c.id),
      code: c.code || '',
      title: c.title || '',
      university_id: c.universityId || c.university_id ? toUuid(c.universityId || c.university_id) : null,
      department_id: c.departmentId || c.department_id ? toUuid(c.departmentId || c.department_id) : null,
      level: c.level || '100',
      description: c.description || '',
      is_active: c.isActive ?? true,
    }));

    const { error } = await supabase.from('courses').upsert(records);
    if (error) {
      console.warn('[Supabase] Courses sync notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Frontend Helper: Sync materials to Supabase
 */
export async function syncMaterialsToSupabase(materials: any[]): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || !Array.isArray(materials) || materials.length === 0) return false;

    const records = materials.map((m: any) => ({
      id: toUuid(m.id),
      title: m.title || '',
      course_id: m.courseId || m.course_id ? toUuid(m.courseId || m.course_id) : null,
      file_url: m.fileUrl || m.file_url || m.url || '',
      file_type: m.fileType || m.file_type || 'pdf',
      description: m.description || '',
      uploader_id: m.uploaderId || m.uploader_id ? toUuid(m.uploaderId || m.uploader_id) : null,
    }));

    const { error } = await supabase.from('materials').upsert(records);
    if (error) {
      console.warn('[Supabase] Materials sync notice:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

