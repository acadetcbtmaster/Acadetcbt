import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from './firebase';

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
      return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-a000-000000000000';
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

// Internal admin headers helper
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cbt_admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {}
  return headers;
}

/**
 * Save or sync a test exam result to Supabase
 */
export async function syncResultToSupabase(result: any): Promise<boolean> {
  try {
    if (!result) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
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
      await admin.from('results').upsert(payload);
      return true;
    }
    
    if (typeof window !== 'undefined') {
      await fetch('/api/results/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(result),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Save or sync a user profile to Supabase
 */
export async function syncUserToSupabase(user: any): Promise<boolean> {
  try {
    if (!user) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
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
      await admin.from('users').upsert(payload);
      return true;
    }
    
    if (typeof window !== 'undefined') {
      const headers = getAuthHeaders();
      if (auth.currentUser) {
        headers['Authorization'] = `Bearer ${await auth.currentUser.getIdToken()}`;
      }
      await fetch('/api/users/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(user),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Save or sync a payment record to Supabase
 */
export async function syncPaymentToSupabase(payment: any): Promise<boolean> {
  try {
    if (!payment) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const payload = {
        id: toUuid(payment.id),
        transaction_ref: payment.reference || payment.transactionRef || `REF-${Date.now()}`,
        user_id: payment.userId ? toUuid(payment.userId) : null,
        email: payment.userEmail || payment.email || 'student@cbt.app',
        amount: Number(payment.amount || 0),
        plan: payment.planId || payment.plan || 'Premium',
        status: payment.status || 'success',
      };
      await admin.from('payments').upsert(payload);
      return true;
    }
    
    if (typeof window !== 'undefined') {
      await fetch('/api/payments/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payment),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Save or sync questions to Supabase in bulk
 */
export async function syncQuestionsToSupabase(questions: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(questions) || questions.length === 0) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
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

      const chunkSize = 100;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await admin.from('questions').upsert(chunk);
      }
      return true;
    }

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/catalog/questions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ questions }),
      });
      return res.ok;
    }
    return false;
  } catch (err) {
    console.warn('[Supabase] Questions sync notice:', err);
    return false;
  }
}

/**
 * Save or sync a single question to Supabase
 */
export async function syncQuestionToSupabase(q: any): Promise<boolean> {
  return syncQuestionsToSupabase([q]);
}

/**
 * Delete a question from Supabase
 */
export async function deleteQuestionFromSupabase(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      await admin.from('questions').delete().eq('id', toUuid(id));
      return true;
    }

    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/catalog/questions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sync universities to Supabase
 */
export async function syncUniversitiesToSupabase(unis: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(unis) || unis.length === 0) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const records = unis.map((u: any) => ({
        id: toUuid(u.id),
        name: u.name || '',
        code: u.shortName || u.short_name || u.code || '',
        logo_url: u.logoUrl || u.logo_url || '',
        website: u.website || '',
      }));
      await admin.from('universities').upsert(records);
      return true;
    }

    if (typeof window !== 'undefined') {
      for (const u of unis) {
        await fetch('/api/catalog/universities', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(u),
        }).catch(() => {});
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sync courses to Supabase
 */
export async function syncCoursesToSupabase(courses: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(courses) || courses.length === 0) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
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
      await admin.from('courses').upsert(records);
      return true;
    }

    if (typeof window !== 'undefined') {
      for (const c of courses) {
        await fetch('/api/catalog/courses', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(c),
        }).catch(() => {});
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Delete a course from Supabase
 */
export async function deleteCourseFromSupabase(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      await admin.from('courses').delete().eq('id', toUuid(id));
      return true;
    }
    if (typeof window !== 'undefined') {
      await fetch(`/api/catalog/courses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Delete a university from Supabase
 */
export async function deleteUniversityFromSupabase(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      await admin.from('universities').delete().eq('id', toUuid(id));
      return true;
    }
    if (typeof window !== 'undefined') {
      await fetch(`/api/catalog/universities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sync materials to Supabase
 */
export async function syncMaterialsToSupabase(materials: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(materials) || materials.length === 0) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const records = materials.map((m: any) => ({
        id: toUuid(m.id),
        title: m.title || '',
        course_id: m.courseId || m.course_id ? toUuid(m.courseId || m.course_id) : null,
        university_id: m.universityId || m.university_id ? toUuid(m.universityId || m.university_id) : null,
        file_url: m.fileUrl || m.file_url || m.url || '',
        material_type: m.fileType || m.file_type || m.material_type || 'pdf',
        description: m.description || '',
      }));
      await admin.from('materials').upsert(records);
      return true;
    }
    if (typeof window !== 'undefined') {
      for (const m of materials) {
        await fetch('/api/catalog/materials', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(m),
        }).catch(() => {});
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Delete a material from Supabase
 */
export async function deleteMaterialFromSupabase(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      await admin.from('materials').delete().eq('id', toUuid(id));
      return true;
    }
    if (typeof window !== 'undefined') {
      await fetch(`/api/catalog/materials/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sync subscription plans to Supabase
 */
export async function syncPlansToSupabase(plans: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(plans) || plans.length === 0) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      const records = plans.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        price: Number(p.price || 0),
        duration_days: Number(p.durationDays || p.duration_days || 30),
        features: p.features || [],
        is_active: p.isActive ?? true,
      }));
      await admin.from('subscription_plans').upsert(records);
      return true;
    }
    if (typeof window !== 'undefined') {
      for (const p of plans) {
        await fetch('/api/catalog/subscription-plans', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(p),
        }).catch(() => {});
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Delete a subscription plan from Supabase
 */
export async function deletePlanFromSupabase(id: string): Promise<boolean> {
  try {
    if (!id) return false;
    const admin = getSupabaseAdminClient();
    if (admin) {
      await admin.from('subscription_plans').delete().eq('id', id);
      return true;
    }
    if (typeof window !== 'undefined') {
      await fetch(`/api/catalog/subscription-plans/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
