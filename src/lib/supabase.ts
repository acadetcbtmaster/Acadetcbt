import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  courseToRow,
  type DbRow,
  materialToRow,
  paymentToRow,
  planToRow,
  questionToRow,
  resultToRow,
  toValidUuid,
  universityToRow,
  userToRow,
} from './dbMappers';

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

class NoopWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = NoopWebSocket.CONNECTING;
  readonly OPEN = NoopWebSocket.OPEN;
  readonly CLOSING = NoopWebSocket.CLOSING;
  readonly CLOSED = NoopWebSocket.CLOSED;
  readonly readyState = this.CLOSED;
  readonly url: string;
  readonly protocol = '';
  onopen: ((this: NoopWebSocket, event: Event) => void) | null = null;
  onmessage: ((this: NoopWebSocket, event: MessageEvent) => void) | null = null;
  onerror: ((this: NoopWebSocket, event: Event) => void) | null = null;
  onclose: ((this: NoopWebSocket, event: CloseEvent) => void) | null = null;
  binaryType = 'blob';
  bufferedAmount = 0;
  extensions = '';

  constructor(url: string | URL, _subprotocols?: string | string[]) {
    this.url = String(url);
  }

  addEventListener(_type: string, _listener: EventListener): void {}
  removeEventListener(_type: string, _listener: EventListener): void {}
  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView): void {}
  close(_code?: number, _reason?: string): void {}
}

type RealtimeOptions = NonNullable<NonNullable<Parameters<typeof createClient>[2]>['realtime']>;

function getRealtimeOptions(): RealtimeOptions | undefined {
  const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.versions?.node);
  const hasWebSocket = typeof (globalThis as { WebSocket?: unknown }).WebSocket !== 'undefined';
  return isNode && !hasWebSocket ? { transport: NoopWebSocket } : undefined;
}

function logInitializationFailure(kind: 'client' | 'admin client', error: unknown): void {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`[Supabase] Supabase persistence is disabled: ${kind} initialization failed. Cause: ${reason}`);
}

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
        realtime: getRealtimeOptions(),
      });
    } catch (err) {
      logInitializationFailure('client', err);
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
        realtime: getRealtimeOptions(),
      });
    } catch (err) {
      logInitializationFailure('admin client', err);
      return null;
    }
  }

  return cachedAdminClient;
}

// Internal admin headers helper
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cbt_admin_token') || 'adm_sess_master_admin_session';
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  skipped?: SkippedSyncItem[];
}

export interface SkippedSyncItem {
  id: string;
  reason: string;
}

const ok = (skipped?: SkippedSyncItem[]): SyncResult => (
  skipped && skipped.length > 0 ? { success: true, skipped } : { success: true }
);
const fail = (error: unknown, skipped?: SkippedSyncItem[]): SyncResult => ({
  success: false,
  error: error instanceof Error ? error.message : String(error || 'Unknown Supabase error'),
  ...(skipped && skipped.length > 0 ? { skipped } : {}),
});

async function responseResult(response: Response): Promise<SyncResult> {
  try {
    const body = await response.json() as Record<string, unknown>;
    if (response.ok) {
      const skipped = Array.isArray(body.skipped) ? body.skipped as SkippedSyncItem[] : undefined;
      return ok(skipped);
    }
    const skipped = Array.isArray(body.skipped) ? body.skipped as SkippedSyncItem[] : undefined;
    return fail(body.error || body.message || `Request failed with HTTP ${response.status}`, skipped);
  } catch {
    if (response.ok) return ok();
    return fail(`Request failed with HTTP ${response.status}`);
  }
}

async function upsertRows(table: string, rows: DbRow[]): Promise<SyncResult> {
  const admin = getSupabaseAdminClient();
  if (!admin) return fail('Supabase is not configured');
  const { error } = await admin.from(table).upsert(rows);
  return error ? fail(error.message) : ok();
}

export async function syncResultToSupabase(result: any): Promise<SyncResult> {
  try {
    if (!result) return fail('Result is required');
    if (typeof window !== 'undefined') {
      return responseResult(await fetch('/api/results/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(result),
      }));
    }
    if (getSupabaseAdminClient()) return upsertRows('results', [resultToRow(result)]);
    return fail('Supabase is not configured');
  } catch (error) {
    return fail(error);
  }
}

export async function syncUserToSupabase(user: any): Promise<SyncResult> {
  try {
    if (!user) return fail('User is required');
    if (typeof window !== 'undefined') {
      return responseResult(await fetch('/api/users/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(user),
      }));
    }
    if (getSupabaseAdminClient()) return upsertRows('users', [userToRow(user)]);
    return fail('Supabase is not configured');
  } catch (error) {
    return fail(error);
  }
}

export async function syncPaymentToSupabase(payment: any): Promise<SyncResult> {
  try {
    if (!payment) return fail('Payment is required');
    const normalized = { ...payment, id: payment.id || payment.reference || `REF-${Date.now()}` };
    if (typeof window !== 'undefined') {
      return responseResult(await fetch('/api/payments/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payment),
      }));
    }
    if (getSupabaseAdminClient()) return upsertRows('payments', [paymentToRow(normalized)]);
    return fail('Supabase is not configured');
  } catch (error) {
    return fail(error);
  }
}

export async function syncQuestionsToSupabase(questions: any[]): Promise<SyncResult> {
  try {
    if (!Array.isArray(questions)) return fail('Questions must be an array');
    if (questions.length === 0) return ok();
    if (typeof window !== 'undefined') {
      return responseResult(await fetch('/api/catalog/questions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ questions }),
      }));
    }
    if (getSupabaseAdminClient()) {
      const rows = questions.map((q) => questionToRow({ ...q, id: q.id }));
      for (let i = 0; i < rows.length; i += 100) {
        const result = await upsertRows('questions', rows.slice(i, i + 100));
        if (!result.success) return result;
      }
      return ok();
    }
    return fail('Supabase is not configured');
  } catch (error) {
    return fail(error);
  }
}

export async function syncQuestionToSupabase(q: any): Promise<SyncResult> {
  return syncQuestionsToSupabase([q]);
}

async function deleteRow(table: string, id: string, endpoint: string): Promise<SyncResult> {
  try {
    if (!id) return fail('ID is required');
    if (typeof window !== 'undefined') {
      return responseResult(await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }));
    }
    const admin = getSupabaseAdminClient();
    if (admin) {
      const targetId = toValidUuid(id) || id;
      const { error } = await admin.from(table).delete().eq('id', targetId);
      return error ? fail(error.message) : ok();
    }
    return fail('Supabase is not configured');
  } catch (error) {
    return fail(error);
  }
}

export const deleteQuestionFromSupabase = (id: string) => deleteRow('questions', id, '/api/catalog/questions');
export const deleteCourseFromSupabase = (id: string) => deleteRow('courses', id, '/api/catalog/courses');
export const deleteUniversityFromSupabase = (id: string) => deleteRow('universities', id, '/api/catalog/universities');
export const deleteMaterialFromSupabase = (id: string) => deleteRow('materials', id, '/api/catalog/materials');
export const deletePlanFromSupabase = (id: string) => deleteRow('subscription_plans', id, '/api/catalog/plans');
export const deleteUserFromSupabase = (id: string) => deleteRow('users', id, '/api/users');

async function syncCollection(
  table: string,
  rows: any[],
  mapper: (row: any) => DbRow,
  endpoint: string,
): Promise<SyncResult> {
  try {
    if (!Array.isArray(rows)) return fail(`${table} rows must be an array`);
    if (rows.length === 0) return ok();
    if (typeof window !== 'undefined') {
      for (const row of rows) {
        const result = await responseResult(await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(row),
        }));
        if (!result.success) return result;
      }
      return ok();
    }
    if (getSupabaseAdminClient()) return upsertRows(table, rows.map((row) => mapper(row)));
    return fail('Supabase is not configured');
  } catch (error) {
    return fail(error);
  }
}

export const syncUniversitiesToSupabase = (rows: any[]) => syncCollection('universities', rows, universityToRow, '/api/catalog/universities');
export const syncCoursesToSupabase = (rows: any[]) => syncCollection('courses', rows, courseToRow, '/api/catalog/courses');
export const syncMaterialsToSupabase = (rows: any[]) => syncCollection('materials', rows, materialToRow, '/api/catalog/materials');
export const syncPlansToSupabase = (rows: any[]) => syncCollection('subscription_plans', rows, planToRow, '/api/catalog/plans');
