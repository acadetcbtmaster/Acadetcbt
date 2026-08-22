import {
  UserProfile,
  Question,
  University,
  Faculty,
  Department,
  Course,
  Topic,
  TestSessionResult,
  SubscriptionPlan,
  PaymentTransaction,
  RankingHistoryRecord,
  AppNotification,
  AdminNotification,
  ReportRecord,
  AdminActivityLog,
  FullActivityLog,
  ActiveUserSession,
  SupportTicket,
  SystemSettings,
  StudyMaterial,
  BackupRecord,
  AutoBackupConfig,
  RestoreLog,
  SystemSettingsPayload,
  TopicRequest,
  TopicCollectionConfig,
  TutorialVideo,
  CommunityDiscussionPost,
  CommunityReply,
  LearningResourceItem,
  CommunityAnnouncement,
  FacultyGroup,
  FaceArenaSettings,
  FaceArenaQuestion,
  FaceArenaParticipant,
  FaceArenaArchive,
  QuickLinkItem,
  HomepageSection,
  DEFAULT_FACULTY_DEPARTMENTS,
  SEED_UNIVERSITIES,
  SEED_FACULTIES,
  SEED_DEPARTMENTS,
  SEED_COURSES,
  SEED_TOPICS,
  SEED_QUESTIONS,
  SEED_STUDY_MATERIALS,
  DEFAULT_PLANS,
} from '../types';
import {
  AdminAccount,
  AdminRole,
  AdminPermission,
  DEFAULT_ADMIN_ACCOUNTS,
  hashPasswordSync,
  verifyPassword,
  hasPermission,
  getRoleDisplayName,
  normalizeAdminRole,
} from '../utils/rbac';

import { auth } from '../lib/firebase';
export type Unsubscribe = () => void;
import {
  getSupabaseClient,
  isSupabaseConfigured,
  syncResultToSupabase,
  syncUserToSupabase,
  syncPaymentToSupabase,
  syncQuestionsToSupabase,
  deleteQuestionFromSupabase,
  syncUniversitiesToSupabase,
  deleteUniversityFromSupabase,
  syncCoursesToSupabase,
  deleteCourseFromSupabase,
  syncMaterialsToSupabase,
  deleteMaterialFromSupabase,
  deleteUserFromSupabase,
  syncPlansToSupabase,
  deletePlanFromSupabase,
} from '../lib/supabase';
import type { SkippedSyncItem } from '../lib/supabase';
import { fromRow } from '../lib/dbMappers';

// Custom safe serializer handled by safeStringify and safeClone without altering global JSON.stringify
export interface StorageWriteResult {
  success: boolean;
  error?: string;
  skipped?: SkippedSyncItem[];
}

const successfulWrite = (skipped?: SkippedSyncItem[]): StorageWriteResult => (
  skipped && skipped.length > 0 ? { success: true, skipped } : { success: true }
);
const failedWrite = (error: unknown): StorageWriteResult => ({
  success: false,
  error: error instanceof Error ? error.message : String(error || 'Remote write failed'),
});

async function checkedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<StorageWriteResult> {
  try {
    const response = await fetch(input, init);
    if (response.ok) return successfulWrite();
    try {
      const body = await response.json();
      return failedWrite(body?.error || body?.message || `Request failed with HTTP ${response.status}`);
    } catch {
      return failedWrite(`Request failed with HTTP ${response.status}`);
    }
  } catch (error) {
    return failedWrite(error);
  }
}

function firstWriteError(results: StorageWriteResult[]): StorageWriteResult {
  const error = results.find((result) => !result.success);
  const skipped = results.flatMap((result) => result.skipped || []);
  if (error) {
    return skipped.length > 0 ? { ...error, skipped } : error;
  }
  return successfulWrite(skipped);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function stripNonSerializable(val: any, seen = new WeakSet<any>(), depth = 0): any {
  if (val === null || val === undefined) return val;
  const t = typeof val;
  if (t === 'boolean' || t === 'string') return val;
  if (t === 'number') return Number.isFinite(val) ? val : null;
  if (t === 'bigint') return val.toString();
  if (t === 'function' || t === 'symbol') return undefined;

  if (typeof val === 'object') {
    if (seen.has(val)) return '[Circular]';
    if (depth > 12) return '[Max Depth]';

    try {
      seen.add(val);
    } catch {
      // ignore
    }

    if (Array.isArray(val)) {
      return val
        .map((item) => stripNonSerializable(item, seen, depth + 1))
        .filter((item) => item !== undefined);
    }

    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val.toISOString() : null;
    }
    if (val instanceof RegExp) {
      return val.toString();
    }
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString();
      } catch {
        // ignore
      }
    }

    let cName = '';
    try {
      cName = val?.constructor?.name || '';
    } catch {}

    const isPlain =
      val.constructor === Object ||
      val.constructor === Array ||
      val.constructor === undefined ||
      Object.getPrototypeOf(val) === null ||
      Object.getPrototypeOf(val) === Object.prototype;

    let isSdk = !isPlain;
    try {
      if (
        cName === 'Y2' ||
        cName === 'Ka' ||
        cName === 'UserImpl' ||
        cName === 'AuthImpl' ||
        cName.includes('Auth') ||
        cName.includes('Firebase') ||
        cName.includes('Database') ||
        ('_delegate' in val) ||
        ('_firestore' in val) ||
        ('_auth' in val) ||
        ('_query' in val) ||
        ('_key' in val) ||
        ('_path' in val) ||
        ('stsTokenManager' in val)
      ) {
        isSdk = true;
      }
    } catch {
      isSdk = true;
    }

    if (isSdk) {
      if (typeof val.uid === 'string' || typeof val.email === 'string') {
        return {
          id: typeof val.id === 'string' || typeof val.id === 'number' ? String(val.id) : (typeof val.uid === 'string' ? val.uid : undefined),
          uid: typeof val.uid === 'string' ? val.uid : undefined,
          email: typeof val.email === 'string' ? val.email : undefined,
          displayName: typeof val.displayName === 'string' ? val.displayName : (typeof val.name === 'string' ? val.name : undefined),
          photoURL: typeof val.photoURL === 'string' ? val.photoURL : undefined,
        };
      }
      return `[SDK Class: ${cName || 'Internal'}]`;
    }

    const cleanObj: Record<string, any> = {};
    let keys: string[] = [];
    try {
      keys = Object.keys(val);
    } catch {
      return {};
    }

    for (const k of keys) {
      if (
        k.startsWith('_') ||
        k.startsWith('$$') ||
        k === '__proto__' ||
        k === 'constructor' ||
        k === 'prototype' ||
        k === 'toJSON' ||
        k === 'delegate' ||
        k === '_delegate' ||
        k === '_firestore' ||
        k === 'firestore' ||
        k === 'auth' ||
        k === '_auth' ||
        k === 'app' ||
        k === '_app' ||
        k === 'i' ||
        k === 'src' ||
        k === 'stsTokenManager'
      ) {
        continue;
      }

      try {
        const child = val[k];
        const childType = typeof child;
        if (childType === 'function' || childType === 'symbol') continue;
        if (
          childType === 'string' ||
          childType === 'number' ||
          childType === 'boolean' ||
          child === null ||
          child === undefined
        ) {
          cleanObj[k] = child;
        } else {
          const sanitized = stripNonSerializable(child, seen, depth + 1);
          if (sanitized !== undefined) {
            cleanObj[k] = sanitized;
          }
        }
      } catch {
        // ignore
      }
    }

    return cleanObj;
  }

  return String(val);
}

export function sanitizeForJSON(val: any, seen = new WeakSet<any>(), depth = 0): any {
  if (val === null || val === undefined) return val;
  const t = typeof val;
  if (t === 'boolean' || t === 'string') return val;
  if (t === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (t === 'bigint') return val.toString();
  if (t === 'function' || t === 'symbol') return undefined;

  if (typeof val === 'object') {
    if (seen.has(val)) return '[Circular]';
    if (depth > 12) return '[Max Depth Exceeded]';

    try {
      seen.add(val);
    } catch {
      // ignore
    }

    let cName = '';
    try {
      cName = val?.constructor?.name || '';
    } catch {
      cName = '';
    }

    const isPlain =
      val.constructor === Object ||
      val.constructor === Array ||
      val.constructor === undefined ||
      Object.getPrototypeOf(val) === null ||
      Object.getPrototypeOf(val) === Object.prototype;

    // 1. Minified Firebase Auth / Database SDK internal circular objects (Y2, Ka, etc.)
    let isCircularSdkObject = !isPlain;
    try {
      if (
        cName === 'Y2' ||
        cName === 'Ka' ||
        cName === 'UserImpl' ||
        cName === 'AuthImpl' ||
        cName === 'Database' ||
        cName === 'DocumentReference' ||
        cName === 'QuerySnapshot' ||
        cName.includes('Firebase') ||
        cName.includes('Auth') ||
        cName.includes('Database') ||
        (cName.length > 0 && cName.length <= 3 && cName !== 'Object' && cName !== 'Array' && cName !== 'Set' && cName !== 'Map' && cName !== 'Date' && cName !== 'Number' && cName !== 'Boolean' && cName !== 'String')
      ) {
        isCircularSdkObject = true;
      }
      if (!isCircularSdkObject) {
        try {
          if (
            (val.i && typeof val.i === 'object' && val.i.src) ||
            (val.src && typeof val.src === 'object' && val.src.i) ||
            '_delegate' in val ||
            '_firestore' in val ||
            '_auth' in val ||
            '_query' in val ||
            '_key' in val ||
            '_path' in val ||
            '_model' in val ||
            '_app' in val ||
            ('stsTokenManager' in val && 'apiKey' in val)
          ) {
            isCircularSdkObject = true;
          }
        } catch {}
      }
    } catch {
      isCircularSdkObject = true;
    }

    // 2. Firebase Auth User or User-like objects
    try {
      if (
        val.stsTokenManager ||
        val.proactiveRefresh ||
        val.reloadUserInfo ||
        val.reloadListener ||
        cName === 'UserImpl' ||
        cName === 'Y2' ||
        (typeof val.uid === 'string' && (val.auth || val._delegate || val.providerData || val.stsTokenManager || val.email))
      ) {
        if (typeof val.uid === 'string' || typeof val.email === 'string') {
          return {
            id: typeof val.id === 'string' || typeof val.id === 'number' ? String(val.id) : (typeof val.uid === 'string' ? val.uid : undefined),
            uid: typeof val.uid === 'string' ? val.uid : undefined,
            email: typeof val.email === 'string' ? val.email : undefined,
            displayName: typeof val.displayName === 'string' ? val.displayName : (typeof val.name === 'string' ? val.name : undefined),
            photoURL: typeof val.photoURL === 'string' ? val.photoURL : undefined,
          };
        }
      }
    } catch {
      // ignore
    }

    if (isCircularSdkObject) {
      return `[SDK Class: ${cName || 'Internal'}]`;
    }

    // Handle Errors
    if (val instanceof Error || cName.includes('Error')) {
      return {
        message: String(val.message || val),
        code: String((val as any).code || val.name || 'ERROR'),
        name: String(val.name || cName || 'Error'),
      };
    }

    // Handle DOM / Event / Window objects
    if (typeof window !== 'undefined') {
      try {
        if (
          val instanceof Node ||
          val instanceof Event ||
          val instanceof Window ||
          val instanceof Element ||
          val instanceof File ||
          val instanceof Blob
        ) {
          return '[DOM/Event Object]';
        }
      } catch {
        // ignore
      }
    }

    try {
      if (val.$$typeof || val._reactName || val._dispatchInstances || val.nativeEvent) {
        return '[React Element/Event]';
      }
    } catch {
      // ignore
    }

    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val.toISOString() : null;
    }

    if (val instanceof RegExp) {
      return val.toString();
    }

    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) {
          return d.toISOString();
        }
      } catch {
        // ignore
      }
    }

    if (val instanceof Map) {
      const mapObj: Record<string, any> = {};
      val.forEach((v, k) => {
        const keyStr = String(k);
        mapObj[keyStr] = sanitizeForJSON(v, seen, depth + 1);
      });
      return mapObj;
    }

    if (val instanceof Set) {
      return Array.from(val).map((v) => sanitizeForJSON(v, seen, depth + 1));
    }

    if (Array.isArray(val)) {
      return val.map((item) => {
        const res = sanitizeForJSON(item, seen, depth + 1);
        return res === undefined ? null : res;
      });
    }

    // Check if object is a custom non-plain class instance (e.g., internal SDK object)
    const isPlainObject =
      val.constructor === Object ||
      val.constructor === undefined ||
      Object.getPrototypeOf(val) === null ||
      Object.getPrototypeOf(val) === Object.prototype;

    if (!isPlainObject) {
      return `[SDK Class: ${cName || 'Internal'}]`;
    }

    // For general plain objects: construct a clean plain object ({}) with no prototype methods or toJSON
    const cleanObj: Record<string, any> = {};
    let keys: string[] = [];
    try {
      keys = Object.keys(val);
    } catch {
      return '[Unaccessible Object]';
    }

    for (const k of keys) {
      if (
        k === 'toJSON' ||
        k === 'constructor' ||
        k === 'prototype' ||
        k === '__proto__' ||
        k === '_delegate' ||
        k === '_firestore' ||
        k === '_app' ||
        k === '_auth' ||
        k === 'firestore' ||
        k === 'auth' ||
        k === 'app' ||
        k === 'firebase' ||
        k === 'stsTokenManager' ||
        k === 'proactiveRefresh' ||
        k === 'reloadUserInfo' ||
        k === 'reloadListener' ||
        k === 'i' ||
        k === 'src' ||
        k === '_delegate' ||
        k.startsWith('_') ||
        k.startsWith('$$')
      ) {
        continue;
      }

      try {
        const child = val[k];
        if (typeof child !== 'function' && typeof child !== 'symbol') {
          const sanitizedChild = sanitizeForJSON(child, seen, depth + 1);
          if (sanitizedChild !== undefined) {
            cleanObj[k] = sanitizedChild;
          }
        }
      } catch {
        cleanObj[k] = '[Unaccessible Property]';
      }
    }

    return cleanObj;
  }

  return String(val);
}

export function safeStringify(obj: any, indent?: number): string {
  if (obj === undefined) return 'undefined';
  if (obj === null) return 'null';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  try {
    const clean = sanitizeForJSON(obj);
    const result = JSON.stringify(clean, null, indent);
    return result !== undefined ? result : '{}';
  } catch {
    try {
      const stripped = stripNonSerializable(obj);
      const res = JSON.stringify(stripped, null, indent);
      return res !== undefined ? res : '{}';
    } catch {
      return '{}';
    }
  }
}

export function safeClone<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  try {
    const clean = sanitizeForJSON(obj);
    if (clean === undefined || clean === null) {
      return (Array.isArray(obj) ? [] : {}) as any;
    }
    if (typeof clean !== 'object') {
      return clean as any;
    }
    return JSON.parse(JSON.stringify(clean)) as T;
  } catch {
    try {
      const stripped = stripNonSerializable(obj);
      return JSON.parse(JSON.stringify(stripped)) as T;
    } catch {
      try {
        const jsonStr = safeStringify(obj);
        return JSON.parse(jsonStr) as T;
      } catch {
        return (Array.isArray(obj) ? [] : {}) as T;
      }
    }
  }
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: typeof error === 'object' && error !== null && 'message' in error ? String((error as any).message) : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Database Operation Notice: ', safeStringify(errInfo));
  return errInfo;
}

const STORAGE_KEYS = {
  USER: 'cbt_user',
  USERS: 'cbt_users',
  QUESTIONS: 'cbt_questions',
  UNIVERSITIES: 'cbt_universities',
  FACULTIES: 'cbt_faculties',
  DEPARTMENTS: 'cbt_departments',
  COURSES: 'cbt_courses',
  TOPICS: 'cbt_topics',
  RESULTS: 'cbt_results',
  PLANS: 'cbt_plans',
  TRANSACTIONS: 'cbt_transactions',
  SETTINGS: 'cbt_settings',
  MATERIALS: 'cbt_materials',
  RANKING_HISTORY: 'cbt_ranking_history',
  NOTIFICATIONS: 'cbt_notifications',
  ADMIN_NOTIFICATIONS: 'cbt_admin_notifications',
  REPORTS: 'cbt_reports',
  LOGS: 'cbt_activity_logs',
  FULL_LOGS: 'cbt_full_activity_logs',
  ACTIVE_SESSIONS: 'cbt_active_sessions',
  SUPPORT_TICKETS: 'cbt_support_tickets',
  BACKUPS: 'cbt_backups',
  AUTO_BACKUP_CONFIG: 'cbt_auto_backup_config',
  RESTORE_LOGS: 'cbt_restore_logs',
  SYSTEM_SETTINGS: 'cbt_system_settings_payload',
  TOPIC_REQUESTS: 'cbt_topic_requests',
  TOPIC_COLLECTION_CONFIG: 'cbt_topic_collection_config',
  TUTORIAL_VIDEOS: 'cbt_tutorial_videos',
  COMMUNITY_POSTS: 'cbt_community_posts',
  COMMUNITY_REPLIES: 'cbt_community_replies',
  LEARNING_RESOURCES: 'cbt_learning_resources',
  COMMUNITY_ANNOUNCEMENTS: 'cbt_community_announcements',
  SIGNUP_FACULTY_GROUPS: 'cbt_signup_faculty_groups',
  FACE_ARENA_SETTINGS: 'cbt_face_arena_settings',
  FACE_ARENA_QUESTIONS: 'cbt_face_arena_questions',
  FACE_ARENA_PARTICIPANTS: 'cbt_face_arena_participants',
  FACE_ARENA_ARCHIVES: 'cbt_face_arena_archives',
  QUICK_LINKS: 'cbt_quick_links',
  HOMEPAGE_SECTIONS: 'cbt_homepage_sections',
  ADMIN_ACCOUNTS: 'cbt_admin_accounts',
  CURRENT_ADMIN: 'cbt_current_admin',
};

const DEFAULT_FACE_ARENA_SETTINGS: FaceArenaSettings = {
  status: 'open',
  weeklyChallengeId: 'week-1',
  weeklyTitle: 'Face Arena - Week 1 Challenge',
  description: 'Join the premier weekly CBT contest! Answer exam questions in real-time, rank on the national leaderboard, and win grand prizes.',
  bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  isPublished: true,
  timerDurationSeconds: 60,
  totalQuestionsCount: 10,
  passingScorePercentage: 50,
  randomizeQuestions: true,
  randomizeOptions: false,
  allowPreviousQuestion: true,
  autoSubmitOnTimeout: true,
  showResultsImmediately: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_FACE_ARENA_QUESTIONS: FaceArenaQuestion[] = [
  {
    id: 'faq-1',
    question: 'Which of the following process models is best suited for projects with volatile requirements and high customer involvement?',
    optionA: 'Waterfall Model',
    optionB: 'Agile / Scrum',
    optionC: 'V-Model',
    optionD: 'Big Bang Model',
    correctAnswer: 'B',
    category: 'Software Engineering',
  },
  {
    id: 'faq-2',
    question: 'In computer networking, which protocol provides reliable, connection-oriented data transmission at the Transport layer?',
    optionA: 'UDP',
    optionB: 'IP',
    optionC: 'TCP',
    optionD: 'ICMP',
    correctAnswer: 'C',
    category: 'Computer Networks',
  },
  {
    id: 'faq-3',
    question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?',
    optionA: 'O(1)',
    optionB: 'O(n)',
    optionC: 'O(log n)',
    optionD: 'O(n^2)',
    correctAnswer: 'C',
    category: 'Data Structures',
  },
  {
    id: 'faq-4',
    question: 'Which SQL keyword is used to sort the result-set in descending order?',
    optionA: 'ORDER BY DESC',
    optionB: 'SORT DESC',
    optionC: 'GROUP BY DESC',
    optionD: 'ORDER DOWN',
    correctAnswer: 'A',
    category: 'Database Systems',
  },
  {
    id: 'faq-5',
    question: 'In object-oriented programming, what principle allows a single interface to represent different underlying data types?',
    optionA: 'Encapsulation',
    optionB: 'Polymorphism',
    optionC: 'Abstraction',
    optionD: 'Inheritance',
    correctAnswer: 'B',
    category: 'OOP Principles',
  },
  {
    id: 'faq-6',
    question: 'Which of the following CPU scheduling algorithms is non-preemptive and prone to starvation for long processes?',
    optionA: 'Round Robin (RR)',
    optionB: 'First-Come, First-Served (FCFS)',
    optionC: 'Shortest Remaining Time First (SRTF)',
    optionD: 'Priority Scheduling (Preemptive)',
    correctAnswer: 'B',
    category: 'Operating Systems',
  },
  {
    id: 'faq-7',
    question: 'What is the primary function of DNS in a network ecosystem?',
    optionA: 'To encrypt HTTP traffic',
    optionB: 'To map domain names to IP addresses',
    optionC: 'To dynamically assign IP addresses to hosts',
    optionD: 'To filter malicious network packets',
    correctAnswer: 'B',
    category: 'Networking',
  },
  {
    id: 'faq-8',
    question: 'In HTTP response status codes, what does status code 403 signify?',
    optionA: 'Not Found',
    optionB: 'Unauthorized',
    optionC: 'Forbidden',
    optionD: 'Internal Server Error',
    correctAnswer: 'C',
    category: 'Web Architecture',
  },
  {
    id: 'faq-9',
    question: 'Which gate outputs HIGH (1) only if all of its inputs are HIGH (1)?',
    optionA: 'OR Gate',
    optionB: 'NAND Gate',
    optionC: 'AND Gate',
    optionD: 'XOR Gate',
    correctAnswer: 'C',
    category: 'Digital Electronics',
  },
  {
    id: 'faq-10',
    question: 'Which of the following hashing algorithms produces a 256-bit hash value?',
    optionA: 'MD5',
    optionB: 'SHA-1',
    optionC: 'SHA-256',
    optionD: 'CRC32',
    correctAnswer: 'C',
    category: 'Cybersecurity',
  }
];

export const DEFAULT_STUDENTS: UserProfile[] = [
  {
    id: 'usr-student-1',
    name: 'Alex Johnson',
    username: 'alex_johnson',
    email: 'alex.student@unilag.edu.ng',
    phone: '+234 802 345 6789',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-unilag',
    universityName: 'University of Lagos (UNILAG)',
    departmentId: 'dept-csc',
    departmentName: 'Computer Science',
    subscription: {
      isPremium: true,
      plan: '30-Day Premium',
      startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 25 * 86400000).toISOString(),
      questionsAttemptedCount: 148,
      freeLimit: 999999,
    },
    bookmarks: ['q-1', 'q-3'],
    createdDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    streakCount: 6,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-2',
    name: 'Chioma Okeke',
    username: 'chioma_okeke',
    email: 'chioma.okeke@fulokoja.edu.ng',
    phone: '+234 803 123 4567',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    departmentId: 'dept-csc',
    departmentName: 'Computer Science',
    subscription: {
      isPremium: true,
      plan: '14-Day Premium',
      startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 12 * 86400000).toISOString(),
      questionsAttemptedCount: 92,
      freeLimit: 999999,
    },
    bookmarks: ['q-2'],
    createdDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    streakCount: 3,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-3',
    name: 'Emeka Nwosu',
    username: 'emeka_nwosu',
    email: 'emeka.nwosu@fuahse.edu.ng',
    phone: '+234 814 987 6543',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-fuahse',
    universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
    departmentId: 'dept-nursing',
    departmentName: 'Nursing Science',
    subscription: {
      isPremium: false,
      plan: '30-Question Free Tier',
      startDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      expiryDate: null,
      questionsAttemptedCount: 22,
      freeLimit: 30,
    },
    bookmarks: [],
    createdDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    streakCount: 2,
    lastPracticeDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'usr-student-4',
    name: 'Amina Bello',
    username: 'amina_bello',
    email: 'amina.bello@fulokoja.edu.ng',
    phone: '+234 808 555 4321',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    departmentId: 'dept-csc',
    departmentName: 'Computer Science',
    subscription: {
      isPremium: true,
      plan: '30-Day Premium',
      startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 20 * 86400000).toISOString(),
      questionsAttemptedCount: 215,
      freeLimit: 999999,
    },
    bookmarks: ['q-4', 'q-5'],
    createdDate: new Date(Date.now() - 45 * 86400000).toISOString(),
    streakCount: 9,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-5',
    name: 'Tunde Bakare',
    username: 'tunde_bakare',
    email: 'tunde.bakare@ui.edu.ng',
    phone: '+234 805 777 8899',
    role: 'student',
    authProvider: 'Google',
    universityId: 'uni-ui',
    universityName: 'University of Ibadan (UI)',
    departmentId: 'dept-med',
    departmentName: 'Medicine and Surgery',
    subscription: {
      isPremium: true,
      plan: 'Semester Access Plan',
      startDate: new Date(Date.now() - 20 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 70 * 86400000).toISOString(),
      questionsAttemptedCount: 340,
      freeLimit: 999999,
    },
    bookmarks: ['q-1', 'q-6'],
    createdDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    streakCount: 14,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-6',
    name: 'Fatima Ibrahim',
    username: 'fatima_ibrahim',
    email: 'fatima.ibrahim@abu.edu.ng',
    phone: '+234 809 111 2233',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-abu',
    universityName: 'Ahmadu Bello University (ABU Zaria)',
    departmentId: 'dept-pharm',
    departmentName: 'Pharmacy',
    subscription: {
      isPremium: false,
      plan: '30-Question Free Tier',
      startDate: new Date().toISOString(),
      expiryDate: null,
      questionsAttemptedCount: 18,
      freeLimit: 30,
    },
    bookmarks: [],
    createdDate: new Date().toISOString(),
    streakCount: 1,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-7',
    name: 'Oluwaseun Adeleke',
    username: 'seun_adeleke',
    email: 'oluwaseun.adeleke@unilag.edu.ng',
    phone: '+234 807 444 3322',
    role: 'student',
    authProvider: 'Google',
    universityId: 'uni-unilag',
    universityName: 'University of Lagos (UNILAG)',
    departmentId: 'dept-eng',
    departmentName: 'Electrical Engineering',
    subscription: {
      isPremium: true,
      plan: '30-Day Premium',
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      questionsAttemptedCount: 45,
      freeLimit: 999999,
    },
    bookmarks: ['q-7'],
    createdDate: new Date().toISOString(),
    streakCount: 1,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-8',
    name: 'David Mark Oche',
    username: 'david_oche',
    email: 'david.oche@fulokoja.edu.ng',
    phone: '+234 813 666 7788',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    departmentId: 'dept-bio',
    departmentName: 'Biological Sciences',
    subscription: {
      isPremium: false,
      plan: '30-Question Free Tier',
      startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      expiryDate: null,
      questionsAttemptedCount: 29,
      freeLimit: 30,
    },
    bookmarks: [],
    createdDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    streakCount: 2,
    lastPracticeDate: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'usr-student-9',
    name: 'Ngozi Eze',
    username: 'ngozi_eze',
    email: 'ngozi.eze@unn.edu.ng',
    phone: '+234 806 888 9900',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-unn',
    universityName: 'University of Nigeria, Nsukka (UNN)',
    departmentId: 'dept-law',
    departmentName: 'Faculty of Law',
    subscription: {
      isPremium: true,
      plan: 'Annual Unlimited Pass',
      startDate: new Date(Date.now() - 40 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 325 * 86400000).toISOString(),
      questionsAttemptedCount: 512,
      freeLimit: 999999,
    },
    bookmarks: ['q-8', 'q-9'],
    createdDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    streakCount: 21,
    lastPracticeDate: new Date().toISOString(),
  },
  {
    id: 'usr-student-10',
    name: 'Kelechi Okafor',
    username: 'kelechi_okafor',
    email: 'kelechi.okafor@fuahse.edu.ng',
    phone: '+234 812 333 4455',
    role: 'student',
    authProvider: 'Email',
    universityId: 'uni-fuahse',
    universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
    departmentId: 'dept-medlab',
    departmentName: 'Medical Laboratory Science',
    subscription: {
      isPremium: false,
      plan: '30-Question Free Tier',
      startDate: new Date(Date.now() - 8 * 86400000).toISOString(),
      expiryDate: null,
      questionsAttemptedCount: 15,
      freeLimit: 30,
    },
    bookmarks: [],
    createdDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    streakCount: 4,
    lastPracticeDate: new Date(Date.now() - 86400000).toISOString(),
  }
];

const DEFAULT_USER: UserProfile = DEFAULT_STUDENTS[0];

const DEFAULT_SETTINGS: SystemSettings = {
  freeQuestionLimit: 30,
  allowAiGeneration: true,
  maintenanceMode: false,
  paystackPublicKey: 'pk_test_ai_cbt_sim_paystack_public_key',
  flutterwavePublicKey: 'FLWPUBK_TEST_ai_cbt_sim_flutterwave_key',
};

export class StorageService {
  private static isInitialized = false;
  public static hasSyncedWithCloud = false;
  public static isSyncing = false;
  private static storageDispatchTimer: any = null;
  private static pendingChangedKeys = new Set<string>();
  private static memoryCache = new Map<string, any>();

  // Safe initialization with real-time Database listeners for dynamic platform modules
  static initRealtimeListeners(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.syncWithCloud().catch(() => {});

    // Periodic cloud sync every 30 seconds for real-time consistency across all users and admin updates
    if (typeof window !== 'undefined') {
      try {
        setInterval(() => {
          this.syncWithCloud().catch(() => {});
        }, 30000);
      } catch {}
    }
  }

  /**
   * Returns active database provider and operational state
   */
  static getActiveDatabase(): {
    provider: 'supabase' | 'firestore';
    name: string;
    isSupabase: boolean;
    status: 'connected' | 'ready';
  } {
    if (isSupabaseConfigured()) {
      return {
        provider: 'supabase',
        name: 'Supabase PostgreSQL',
        isSupabase: true,
        status: 'connected',
      };
    }
    return {
      provider: 'firestore',
      name: 'Supabase Database',
      isSupabase: false,
      status: 'ready',
    };
  }

  /**
   * Universal Single-Source-of-Truth Database Synchronization
   * Fetches latest state from Supabase / Backend API and Supabase Database,
   * updates the local cache, and notifies all subscribing React views.
   */
  static async syncWithCloud(force: boolean = false): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      let syncedSuccessfully = false;

      // 1. Primary Sync: Backend API (Supabase prioritized)
      try {
        const resp = await fetch('/api/catalog/all');
        if (resp.ok) {
          const catalog = await resp.json();
          if (catalog.success) {
            if (Array.isArray(catalog.universities)) {
              if (catalog.universities.length > 0) {
                const mapped = catalog.universities.map(fromRow.university);
                this.memoryCache.set(STORAGE_KEYS.UNIVERSITIES, mapped);
                localStorage.setItem(STORAGE_KEYS.UNIVERSITIES, safeStringify(mapped));
              } else {
                const local = this.getUniversities();
                if (local.length > 0) syncUniversitiesToSupabase(local).catch(() => {});
              }
            }
            if (Array.isArray(catalog.courses)) {
              if (catalog.courses.length > 0) {
                const mapped = catalog.courses.map(fromRow.course);
                this.memoryCache.set(STORAGE_KEYS.COURSES, mapped);
                localStorage.setItem(STORAGE_KEYS.COURSES, safeStringify(mapped));
              } else {
                const local = this.getCourses();
                if (local.length > 0) syncCoursesToSupabase(local).catch(() => {});
              }
            }
            if (Array.isArray(catalog.departments) && catalog.departments.length > 0) {
              const mapped = catalog.departments.map(fromRow.department);
              this.memoryCache.set(STORAGE_KEYS.DEPARTMENTS, mapped);
              localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, safeStringify(mapped));
            }
            if (Array.isArray(catalog.faculties) && catalog.faculties.length > 0) {
              const mapped = catalog.faculties.map(fromRow.faculty);
              this.memoryCache.set(STORAGE_KEYS.FACULTIES, mapped);
              localStorage.setItem(STORAGE_KEYS.FACULTIES, safeStringify(mapped));
            }
            if (Array.isArray(catalog.questions)) {
              if (catalog.questions.length > 0) {
                const mapped = catalog.questions.map(fromRow.question);
                this.memoryCache.set(STORAGE_KEYS.QUESTIONS, mapped);
                localStorage.setItem(STORAGE_KEYS.QUESTIONS, safeStringify(mapped));
              } else {
                const local = this.getQuestions();
                if (local.length > 0) {
                  syncQuestionsToSupabase(local).catch(() => {});
                }
              }
            }
            if (Array.isArray(catalog.materials)) {
              if (catalog.materials.length > 0) {
                const mapped = catalog.materials.map(fromRow.material);
                this.memoryCache.set(STORAGE_KEYS.MATERIALS, mapped);
                localStorage.setItem(STORAGE_KEYS.MATERIALS, safeStringify(mapped));
              } else {
                const local = this.getMaterials();
                if (local.length > 0) syncMaterialsToSupabase(local).catch(() => {});
              }
            }
            if (Array.isArray(catalog.plans) && catalog.plans.length > 0) {
              const mapped = catalog.plans.map(fromRow.plan);
              this.memoryCache.set(STORAGE_KEYS.PLANS, mapped);
              localStorage.setItem(STORAGE_KEYS.PLANS, safeStringify(mapped));
            }
            if (Array.isArray(catalog.users)) {
              const remoteMapped = catalog.users.map(fromRow.user);
              const currentUsers = this.getUsers();
              const mergedMap = new Map<string, UserProfile>();
              // 1. Seed or local users
              currentUsers.forEach((u) => {
                const key = u.id || u.email;
                if (key) mergedMap.set(key, u);
              });
              // 2. Remote database users
              remoteMapped.forEach((u) => {
                const key = u.id || u.email;
                if (key) mergedMap.set(key, u);
              });
              const merged = Array.from(mergedMap.values());
              if (merged.length > 0) {
                this.memoryCache.set(STORAGE_KEYS.USERS, merged);
                localStorage.setItem(STORAGE_KEYS.USERS, safeStringify(merged));
              }
            }
            if (Array.isArray(catalog.payments) && catalog.payments.length > 0) {
              const mapped = catalog.payments.map(fromRow.payment);
              this.memoryCache.set(STORAGE_KEYS.TRANSACTIONS, mapped);
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, safeStringify(mapped));
            }
            if (catalog.signupFaculties && Array.isArray(catalog.signupFaculties)) {
              this.memoryCache.set(STORAGE_KEYS.SIGNUP_FACULTY_GROUPS, catalog.signupFaculties);
              localStorage.setItem(STORAGE_KEYS.SIGNUP_FACULTY_GROUPS, safeStringify(catalog.signupFaculties));
            }
            syncedSuccessfully = true;
          }
        }
      } catch (apiErr) {
        console.info('[StorageService] Backend API catalog sync notice; checking client Supabase');
      }

      // 2. Direct Supabase Client Fallback
      if (!syncedSuccessfully && isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) {
            const [
              { data: sbUnis },
              { data: sbCourses },
              { data: sbQuestions },
              { data: sbPlans },
              { data: sbUsers },
              { data: sbPayments },
            ] = await Promise.all([
              supabase.from('universities').select('*').limit(200),
              supabase.from('courses').select('*').limit(500),
              supabase.from('questions').select('*').limit(2000),
              supabase.from('subscription_plans').select('*').limit(50),
              supabase.from('users').select('*').limit(1000),
              supabase.from('payments').select('*').limit(500),
            ]);

            if (sbUnis && sbUnis.length > 0) {
              const mappedUnis = sbUnis.map(fromRow.university);
              this.memoryCache.set(STORAGE_KEYS.UNIVERSITIES, mappedUnis);
              localStorage.setItem(STORAGE_KEYS.UNIVERSITIES, safeStringify(mappedUnis));
              syncedSuccessfully = true;
            }

            if (sbCourses && sbCourses.length > 0) {
              const mappedCourses = sbCourses.map(fromRow.course);
              this.memoryCache.set(STORAGE_KEYS.COURSES, mappedCourses);
              localStorage.setItem(STORAGE_KEYS.COURSES, safeStringify(mappedCourses));
              syncedSuccessfully = true;
            }

            if (sbQuestions && sbQuestions.length > 0) {
              const mappedQuestions = sbQuestions.map(fromRow.question);
              this.memoryCache.set(STORAGE_KEYS.QUESTIONS, mappedQuestions);
              localStorage.setItem(STORAGE_KEYS.QUESTIONS, safeStringify(mappedQuestions));
              syncedSuccessfully = true;
            }

            if (sbPlans && sbPlans.length > 0) {
              const mappedPlans = sbPlans.map(fromRow.plan);
              this.memoryCache.set(STORAGE_KEYS.PLANS, mappedPlans);
              localStorage.setItem(STORAGE_KEYS.PLANS, safeStringify(mappedPlans));
              syncedSuccessfully = true;
            }

            if (sbUsers && sbUsers.length > 0) {
              const remoteMapped = sbUsers.map(fromRow.user);
              const currentUsers = this.getUsers();
              const mergedMap = new Map<string, UserProfile>();
              currentUsers.forEach((u) => {
                const key = u.id || u.email;
                if (key) mergedMap.set(key, u);
              });
              remoteMapped.forEach((u) => {
                const key = u.id || u.email;
                if (key) mergedMap.set(key, u);
              });
              const merged = Array.from(mergedMap.values());
              if (merged.length > 0) {
                this.memoryCache.set(STORAGE_KEYS.USERS, merged);
                localStorage.setItem(STORAGE_KEYS.USERS, safeStringify(merged));
                syncedSuccessfully = true;
              }
            }

            if (sbPayments && sbPayments.length > 0) {
              const mappedPayments = sbPayments.map(fromRow.payment);
              this.memoryCache.set(STORAGE_KEYS.TRANSACTIONS, mappedPayments);
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, safeStringify(mappedPayments));
              syncedSuccessfully = true;
            }
          }
        } catch (sbErr) {
          console.info('[StorageService] Client Supabase direct query notice');
        }
      }

      // Supabase & REST catalog sync complete
      if (syncedSuccessfully) {
        console.info('[StorageService] Catalog synchronized with Supabase.');
      }

      this.hasSyncedWithCloud = true;

      // Broadcast storage change event so all components update immediately
      try {
        window.dispatchEvent(
          new CustomEvent('cbt_storage_change', {
            detail: {
              key: 'all_synced',
              keys: [
                'all_synced',
                STORAGE_KEYS.UNIVERSITIES,
                STORAGE_KEYS.COURSES,
                STORAGE_KEYS.QUESTIONS,
                STORAGE_KEYS.DEPARTMENTS,
                STORAGE_KEYS.FACULTIES,
                STORAGE_KEYS.MATERIALS,
                STORAGE_KEYS.SIGNUP_FACULTY_GROUPS,
                STORAGE_KEYS.ADMIN_ACCOUNTS,
                STORAGE_KEYS.USERS,
                STORAGE_KEYS.TRANSACTIONS,
              ],
              timestamp: Date.now(),
            },
          })
        );
      } catch {
        window.dispatchEvent(new Event('cbt_storage_change'));
      }
      return true;
    } catch (e) {
      console.warn('[StorageService] Exception in syncWithCloud:', e);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  private static getAdminAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cbt_admin_token') : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
    return headers;
  }

  private static getItem<T>(key: string, defaultValue: T): T {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        this.memoryCache.set(key, parsed);
        return parsed as T;
      }
    } catch {
      // fallback
    }
    this.memoryCache.set(key, defaultValue);
    return defaultValue;
  }

  private static setItem<T>(key: string, value: T): void {
    this.memoryCache.set(key, value);
    this.pendingChangedKeys.add(key);

    if (this.storageDispatchTimer) {
      clearTimeout(this.storageDispatchTimer);
    }
    this.storageDispatchTimer = setTimeout(() => {
      this.storageDispatchTimer = null;
      const keysToWrite = Array.from(this.pendingChangedKeys);
      this.pendingChangedKeys.clear();

      for (const k of keysToWrite) {
        try {
          const val = this.memoryCache.get(k);
          if (val !== undefined) {
            localStorage.setItem(k, safeStringify(val));
          }
        } catch (e) {
          console.warn('Storage write notice for key ' + k, e);
        }
      }

      try {
        window.dispatchEvent(new CustomEvent('cbt_storage_change', { detail: { key: keysToWrite[0] || key, keys: keysToWrite, timestamp: Date.now() } }));
      } catch {
        window.dispatchEvent(new Event('cbt_storage_change'));
      }
    }, 150);
  }

  // Helper to check and enforce subscription status (30-question limit for non-subscribed, unlimited for active premium)
  private static enforceSubscriptionExpiry(user: UserProfile): UserProfile {
    if (!user) return user;

    const stableStartDate = user.subscription?.startDate || user.createdDate || '2026-01-01T00:00:00.000Z';

    // Admins retain unrestricted access
    if (user.role === 'admin') {
      return {
        ...user,
        subscription: {
          isPremium: true,
          plan: user.subscription?.plan || 'Administrator Pass',
          startDate: stableStartDate,
          expiryDate: null,
          questionsAttemptedCount: user.subscription?.questionsAttemptedCount || 0,
          freeLimit: 999999,
        },
      };
    }

    const sub = user.subscription;
    const now = new Date();

    // Verify if account has an active, valid paid premium subscription
    let isCurrentlyPremium = false;
    const planName = user.subscriptionPlan || sub?.plan || '';
    const status = user.subscriptionStatus;

    const isNonPaidPlanName = (p: string) => {
      const lower = (p || '').toLowerCase();
      return (
        !p ||
        lower.includes('free tier') ||
        lower.includes('free trial') ||
        lower === '30-question free tier' ||
        lower === 'cancelled'
      );
    };

    if (status === 'active' || (sub && sub.isPremium) || (!isNonPaidPlanName(planName) && planName !== '')) {
      const expDateStr = sub?.expiryDate;
      if (expDateStr) {
        const expiry = new Date(expDateStr);
        if (!isNaN(expiry.getTime())) {
          if (expiry > now) {
            isCurrentlyPremium = true;
          }
        } else {
          isCurrentlyPremium = true;
        }
      } else {
        isCurrentlyPremium = true;
      }
    }

    if (isCurrentlyPremium) {
      return {
        ...user,
        subscription: {
          ...sub!,
          isPremium: true,
          freeLimit: 999999,
          startDate: stableStartDate,
        },
      };
    }

    // Non-subscribed or expired accounts are placed on the 30-question free limit
    return {
      ...user,
      subscription: {
        isPremium: false,
        plan: sub?.plan === 'Cancelled' ? 'Cancelled (Free Tier)' : '30-Question Free Tier',
        startDate: stableStartDate,
        expiryDate: sub?.expiryDate || null,
        questionsAttemptedCount: sub?.questionsAttemptedCount || 0,
        freeLimit: 30,
      },
    };
  }

  // User & Users
  static getUsers(): UserProfile[] {
    const rawUsers = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, DEFAULT_STUDENTS);
    const list = rawUsers && Array.isArray(rawUsers) && rawUsers.length > 0 ? rawUsers : DEFAULT_STUDENTS;
    return list.map((u) => {
      return this.enforceSubscriptionExpiry(u);
    });
  }

  static async clearAllUsers(): Promise<StorageWriteResult> {
    this.memoryCache.set(STORAGE_KEYS.USERS, []);
    this.memoryCache.delete(STORAGE_KEYS.USER);
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, safeStringify([]));
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}

    const result = await checkedFetch('/api/users/clear-all', {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
    });

    try {
      window.dispatchEvent(new CustomEvent('cbt_storage_change', { detail: { key: STORAGE_KEYS.USERS, timestamp: Date.now() } }));
    } catch {}

    return result;
  }

  static async saveUsers(users: UserProfile[], syncToBackend: boolean = true): Promise<StorageWriteResult> {
    const previous = this.getUsers();
    this.setItem(STORAGE_KEYS.USERS, users);

    if (!syncToBackend) return successfulWrite();

    const results: Promise<StorageWriteResult>[] = [];
    users.forEach((u) => {
      results.push(syncUserToSupabase(u));
    });

    // Sync deletions to Backend API & Supabase
    const newIds = new Set(users.map((u) => u.id));
    previous.forEach((pu) => {
      if (!newIds.has(pu.id)) {
        results.push(checkedFetch(`/api/users/${encodeURIComponent(pu.id)}`, {
          method: 'DELETE',
          headers: this.getAdminAuthHeaders(),
        }));
      }
    });
    return firstWriteError(await Promise.all(results));
  }

  static saveLocalUsersOnly(users: UserProfile[]): void {
    this.saveUsers(users, false);
  }

  static async deleteUser(userId: string): Promise<StorageWriteResult> {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, users);

    const activeUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (activeUser && activeUser.id === userId) {
      this.clearUserSession();
    }

    const result = await deleteUserFromSupabase(userId);

    try {
      window.dispatchEvent(new CustomEvent('cbt_storage_change', { detail: { key: STORAGE_KEYS.USERS, timestamp: Date.now() } }));
    } catch {}

    return result;
  }

  static getUser(): UserProfile | null {
    const rawUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!rawUser) return null;

    const users = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
    const updatedRecord = users.find((u) => u.id === rawUser.id);
    const targetUser = updatedRecord || rawUser;

    const checked = this.enforceSubscriptionExpiry(targetUser);
    
    // Update memory cache cleanly without re-triggering storage write event loop
    this.memoryCache.set(STORAGE_KEYS.USER, checked);
    return checked;
  }

  static clearUserSession(): void {
    try {
      this.memoryCache.delete(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  static saveUser(user: UserProfile, syncToBackend: boolean = true): void {
    const users = this.getUsers();

    const activeSessionUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!activeSessionUser || activeSessionUser.id === user.id) {
      this.setItem(STORAGE_KEYS.USER, user);
    }

    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.unshift(user);
    }
    this.setItem(STORAGE_KEYS.USERS, users);

    if (!syncToBackend) return;

    try {
      if (user && user.id) {
        syncUserToSupabase(user).catch(() => {});
      }
    } catch (e) {
      console.warn('Supabase write user notice:', e);
    }
  }

  static saveLocalUserOnly(user: UserProfile): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.memoryCache.set(STORAGE_KEYS.USER, user);
    this.memoryCache.set(STORAGE_KEYS.USERS, users);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, safeStringify(user));
      localStorage.setItem(STORAGE_KEYS.USERS, safeStringify(users));
    } catch {}
  }

  // Questions
  static getQuestions(): Question[] {
    const list = this.getItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
    if (!list || !Array.isArray(list) || list.length === 0) {
      return SEED_QUESTIONS;
    }
    return list;
  }

  static async clearAllQuestions(): Promise<StorageWriteResult> {
    this.memoryCache.set(STORAGE_KEYS.QUESTIONS, []);
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, safeStringify([]));
    } catch {}

    const result = await checkedFetch('/api/catalog/questions/clear-all', {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
    });

    try {
      window.dispatchEvent(new CustomEvent('cbt_storage_change', { detail: { key: STORAGE_KEYS.QUESTIONS, timestamp: Date.now() } }));
    } catch {}

    return result;
  }

  static async saveQuestions(questions: Question[]): Promise<StorageWriteResult> {
    const previous = this.getQuestions();
    this.setItem(STORAGE_KEYS.QUESTIONS, questions);

    const results: Promise<StorageWriteResult>[] = [syncQuestionsToSupabase(questions)];
    const newIds = new Set(questions.map((q) => q.id));
    previous.forEach((pq) => {
      if (!newIds.has(pq.id)) {
        results.push(deleteQuestionFromSupabase(pq.id));
      }
    });

    return firstWriteError(await Promise.all(results));
  }

  static async deleteQuestion(id: string): Promise<StorageWriteResult> {
    const remaining = this.getQuestions().filter((q) => q.id !== id);
    this.setItem(STORAGE_KEYS.QUESTIONS, remaining);

    return deleteQuestionFromSupabase(id);
  }

  static async addQuestion(q: Question): Promise<StorageWriteResult> {
    const list = this.getQuestions();
    list.unshift(q);
    return this.saveQuestions(list);
  }

  // Universities, Faculties, Depts, Courses, Topics
  static getUniversities(): University[] {
    const list = this.getItem<University[]>(STORAGE_KEYS.UNIVERSITIES, SEED_UNIVERSITIES);
    return Array.isArray(list) ? list : SEED_UNIVERSITIES;
  }

  static async saveUniversities(data: University[]): Promise<StorageWriteResult> {
    const previous = this.getUniversities();
    this.setItem(STORAGE_KEYS.UNIVERSITIES, data);

    const results: Promise<StorageWriteResult>[] = [syncUniversitiesToSupabase(data)];

    const newIds = new Set(data.map((u) => u.id));
    previous.forEach((pu) => {
      if (!newIds.has(pu.id)) {
        results.push(deleteUniversityFromSupabase(pu.id));
      }
    });

    return firstWriteError(await Promise.all(results));
  }

  static async deleteUniversity(id: string): Promise<StorageWriteResult> {
    const remaining = this.getUniversities().filter((u) => u.id !== id);
    this.setItem(STORAGE_KEYS.UNIVERSITIES, remaining);

    return deleteUniversityFromSupabase(id);
  }

  static getFaculties(): Faculty[] {
    return this.getItem<Faculty[]>(STORAGE_KEYS.FACULTIES, SEED_FACULTIES);
  }

  static async saveFaculties(data: Faculty[]): Promise<StorageWriteResult> {
    this.setItem(STORAGE_KEYS.FACULTIES, data);
    const results: Promise<StorageWriteResult>[] = [];
    data.forEach((f) => {
      results.push(checkedFetch('/api/catalog/faculties', {
          method: 'POST',
          headers: this.getAdminAuthHeaders(),
          body: safeStringify(f),
        }));
    });
    return firstWriteError(await Promise.all(results));
  }

  static async deleteFaculty(id: string): Promise<StorageWriteResult> {
    const remaining = this.getFaculties().filter((f) => f.id !== id);
    this.setItem(STORAGE_KEYS.FACULTIES, remaining);
    return checkedFetch(`/api/catalog/faculties/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders(),
    });
  }

  static getDepartments(): Department[] {
    return this.getItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
  }

  static async saveDepartments(data: Department[]): Promise<StorageWriteResult> {
    this.setItem(STORAGE_KEYS.DEPARTMENTS, data);
    const results: Promise<StorageWriteResult>[] = [];
    data.forEach((d) => {
      results.push(checkedFetch('/api/catalog/departments', {
          method: 'POST',
          headers: this.getAdminAuthHeaders(),
          body: safeStringify(d),
        }));
    });
    return firstWriteError(await Promise.all(results));
  }

  static async deleteDepartment(id: string): Promise<StorageWriteResult> {
    const remaining = this.getDepartments().filter((d) => d.id !== id);
    this.setItem(STORAGE_KEYS.DEPARTMENTS, remaining);
    return checkedFetch(`/api/catalog/departments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders(),
    });
  }

  static getCourses(): Course[] {
    return this.getItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
  }

  static async saveCourses(data: Course[]): Promise<StorageWriteResult> {
    const previous = this.getCourses();
    this.setItem(STORAGE_KEYS.COURSES, data);

    const results: Promise<StorageWriteResult>[] = [syncCoursesToSupabase(data)];

    const newIds = new Set(data.map((c) => c.id));
    previous.forEach((pc) => {
      if (!newIds.has(pc.id)) {
        results.push(deleteCourseFromSupabase(pc.id));
      }
    });

    return firstWriteError(await Promise.all(results));
  }

  static async deleteCourse(id: string): Promise<StorageWriteResult> {
    const remaining = this.getCourses().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.COURSES, remaining);

    return deleteCourseFromSupabase(id);
  }

  static getTopics(): Topic[] {
    return this.getItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
  }

  static async saveTopics(data: Topic[]): Promise<boolean> {
    this.setItem(STORAGE_KEYS.TOPICS, data);
    return true;
  }

  // Test Results
  static getResults(): TestSessionResult[] {
    return this.getItem<TestSessionResult[]>(STORAGE_KEYS.RESULTS, []);
  }

  static getTestResults(): TestSessionResult[] {
    return this.getResults();
  }

  static async saveResults(results: TestSessionResult[]): Promise<StorageWriteResult> {
    this.setItem(STORAGE_KEYS.RESULTS, results);
    return firstWriteError(await Promise.all(results.map((res) => syncResultToSupabase(res))));
  }

  static async saveTestResults(results: TestSessionResult[]): Promise<StorageWriteResult> {
    return this.saveResults(results);
  }

  static async saveResult(res: TestSessionResult): Promise<StorageWriteResult> {
    const list = this.getResults();
    list.unshift(res);
    return this.saveResults(list);
  }

  // Plans & Transactions
  static getPlans(): SubscriptionPlan[] {
    return this.getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
  }

  static getSubscriptionPlans(): SubscriptionPlan[] {
    return this.getPlans();
  }

  static async savePlans(plans: SubscriptionPlan[], syncToBackend: boolean = true): Promise<StorageWriteResult> {
    this.setItem(STORAGE_KEYS.PLANS, plans);
    if (!syncToBackend) return successfulWrite();
    return syncPlansToSupabase(plans);
  }

  static saveLocalPlansOnly(plans: SubscriptionPlan[]): void {
    this.memoryCache.set(STORAGE_KEYS.PLANS, plans);
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, safeStringify(plans));
    } catch {}
  }

  static async saveSubscriptionPlans(plans: SubscriptionPlan[]): Promise<StorageWriteResult> {
    return this.savePlans(plans);
  }

  static async deleteSubscriptionPlan(planId: string): Promise<StorageWriteResult> {
    const plans = this.getPlans().filter((p) => p.id !== planId);
    this.setItem(STORAGE_KEYS.PLANS, plans);
    return deletePlanFromSupabase(planId);
  }

  static getTransactions(): PaymentTransaction[] {
    const seedTransactions: PaymentTransaction[] = [
      {
        id: 'tx-101',
        paymentId: 'PAY-884219',
        userId: 'usr-student-1',
        userName: 'Alex Johnson',
        userEmail: 'alex.student@unilag.edu.ng',
        studentIdCode: 'UNILAG/2024/CSC/042',
        universityName: 'University of Lagos',
        departmentName: 'Computer Science',
        reference: 'PST_8842194012',
        gateway: 'Paystack',
        amount: 800,
        planName: '14-Day Premium',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        paymentDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        expiryDate: new Date(Date.now() + 86400000 * 9).toISOString(),
        status: 'Successful',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        proofType: 'JPG',
        handledByAdmin: 'System Auto-Verify',
      },
      {
        id: 'tx-102',
        paymentId: 'PAY-884220',
        userId: 'st-1',
        userName: 'Chinedu Okonkwo',
        userEmail: 'chinedu.o@fulokoja.edu.ng',
        studentIdCode: 'FUL/2024/CSC/108',
        universityName: 'Federal University Lokoja (FUL)',
        departmentName: 'Computer Science',
        reference: 'FLW_9931823011',
        gateway: 'Flutterwave',
        amount: 1500,
        planName: '30-Day Premium',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        expiryDate: new Date(Date.now() + 86400000 * 28).toISOString(),
        status: 'Successful',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        proofType: 'PNG',
        handledByAdmin: 'System Auto-Verify',
      },
      {
        id: 'tx-103',
        paymentId: 'PAY-884221',
        userId: 'st-2',
        userName: 'Amina Yusuf',
        userEmail: 'amina.yusuf@fulokoja.edu.ng',
        studentIdCode: 'FUL/2024/CYS/019',
        universityName: 'Federal University Lokoja (FUL)',
        departmentName: 'Cyber Security',
        reference: 'TRF_7721098221',
        gateway: 'Bank Transfer',
        amount: 1500,
        planName: '30-Day Premium',
        date: new Date(Date.now() - 3600000 * 3).toISOString(),
        paymentDate: new Date(Date.now() - 3600000 * 3).toISOString(),
        status: 'Pending',
        proofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
        proofType: 'JPG',
        notes: 'Paid via GTBank Mobile Transfer. Reference code attached in proof.',
      },
      {
        id: 'tx-104',
        paymentId: 'PAY-884222',
        userId: 'st-3',
        userName: 'Emmanuel Chukwu',
        userEmail: 'emmanuel.c@fuahse.edu.ng',
        studentIdCode: 'FUAHSE/2024/MED/005',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        departmentName: 'Medicine and Surgery',
        reference: 'TRF_6619028331',
        gateway: 'Bank Transfer',
        amount: 800,
        planName: '14-Day Premium',
        date: new Date(Date.now() - 3600000 * 12).toISOString(),
        paymentDate: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'Pending',
        proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        proofType: 'PDF',
        notes: 'Zenith Bank Transfer Receipt uploaded for 14-day subscription.',
      },
      {
        id: 'tx-105',
        paymentId: 'PAY-884223',
        userId: 'st-6',
        userName: 'Fatima Bello',
        userEmail: 'fatima.bello@fuahse.edu.ng',
        studentIdCode: 'FUAHSE/2024/NRS/034',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        departmentName: 'Nursing Science',
        reference: 'PST_5521908221',
        gateway: 'Paystack',
        amount: 800,
        planName: '14-Day Premium',
        date: new Date(Date.now() - 86400000 * 10).toISOString(),
        paymentDate: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'Failed',
        notes: 'Insufficient funds on user debit card.',
      },
    ];
    return this.getItem<PaymentTransaction[]>(STORAGE_KEYS.TRANSACTIONS, seedTransactions);
  }

  static async saveTransactions(transactions: PaymentTransaction[]): Promise<StorageWriteResult> {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    return firstWriteError(await Promise.all(transactions.map((tx) => syncPaymentToSupabase(tx))));
  }

  static async saveTransaction(tx: PaymentTransaction): Promise<StorageWriteResult> {
    const list = this.getTransactions();
    const idx = list.findIndex((t) => t.id === tx.id || (t.reference && t.reference === tx.reference));
    if (idx >= 0) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    return this.saveTransactions(list);
  }

  static deleteTransaction(id: string): void {
    const list = this.getTransactions();
    const updated = list.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbt_storage_change'));
    }
  }

  static deleteTransactions(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    const list = this.getTransactions();
    const updated = list.filter((t) => !ids.includes(t.id));
    this.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbt_storage_change'));
    }
  }

  // Ranking History
  static getRankingHistory(): RankingHistoryRecord[] {
    const seedHistory: RankingHistoryRecord[] = [
      {
        id: 'rh-1',
        studentId: 'st-1',
        studentName: 'Chinedu Okonkwo',
        previousRank: 2,
        newRank: 1,
        dateChanged: new Date(Date.now() - 3600000 * 4).toISOString(),
        reason: 'Completed CBT Exam with 98% Score in GST101',
        scoreUsed: 98,
        category: 'Overall Leaderboard',
      },
      {
        id: 'rh-2',
        studentId: 'st-2',
        studentName: 'Amina Yusuf',
        previousRank: 1,
        newRank: 2,
        dateChanged: new Date(Date.now() - 3600000 * 4).toISOString(),
        reason: 'Rank adjusted after Chinedu completed new CBT session',
        scoreUsed: 94,
        category: 'Overall Leaderboard',
      },
      {
        id: 'rh-3',
        studentId: 'usr-student-1',
        studentName: 'Alex Johnson',
        previousRank: 8,
        newRank: 5,
        dateChanged: new Date(Date.now() - 86400000).toISOString(),
        reason: 'Scored 90% in MTH101 CBT practice test',
        scoreUsed: 90,
        category: 'University Leaderboard',
      },
    ];
    return this.getItem<RankingHistoryRecord[]>(STORAGE_KEYS.RANKING_HISTORY, seedHistory);
  }

  static saveRankingHistory(records: RankingHistoryRecord[]): void {
    this.setItem(STORAGE_KEYS.RANKING_HISTORY, records);
    records.forEach((r) => {
    });
  }

  static addRankingHistoryRecord(record: RankingHistoryRecord): void {
    const list = this.getRankingHistory();
    list.unshift(record);
    this.saveRankingHistory(list);
  }

  // App Notifications
  static getNotifications(): AppNotification[] {
    const seedNotifs: AppNotification[] = [
      {
        id: 'notif-1',
        userId: 'usr-student-1',
        userName: 'Alex Johnson',
        title: 'Payment Verification Received',
        message: 'Your payment proof for 14-Day Premium is under administrator review.',
        type: 'payment',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false,
      },
      {
        id: 'notif-2',
        userId: 'st-1',
        userName: 'Chinedu Okonkwo',
        title: '🏆 Gold Scholar Badge Awarded!',
        message: 'Congratulations! You achieved Rank #1 on the Overall Leaderboard.',
        type: 'leaderboard',
        date: new Date(Date.now() - 3600000 * 4).toISOString(),
        read: true,
      },
    ];
    return this.getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, seedNotifs);
  }

  static saveNotifications(notifs: AppNotification[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    notifs.forEach((n) => {
    });
  }

  static addNotification(notif: AppNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    this.saveNotifications(list);
  }

  // Activity Logs
  static getActivityLogs(): AdminActivityLog[] {
    const seedLogs: AdminActivityLog[] = [
      {
        id: 'log-101',
        admin: 'System Admin',
        action: 'Recalculated Leaderboard Rankings',
        module: 'Leaderboard Management',
        details: 'Automatic live calculation completed for 2,450 student results.',
        time: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: 'log-102',
        admin: 'System Admin',
        action: 'Approved Payment Transaction PAY-884219',
        module: 'Payment Management',
        details: 'Verified Paystack reference PST_8842194012 and activated Premium subscription.',
        time: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ];
    return this.getItem<AdminActivityLog[]>(STORAGE_KEYS.LOGS, seedLogs);
  }

  static saveActivityLogs(logs: AdminActivityLog[]): void {
    this.setItem(STORAGE_KEYS.LOGS, logs);
    logs.forEach((l) => {
    });
  }

  static logActivity(admin: string, action: string, module: string, details: string): void {
    const list = this.getActivityLogs();
    const newLog: AdminActivityLog = {
      id: `log-${Date.now()}`,
      admin,
      action,
      module,
      details,
      time: new Date().toISOString(),
    };
    list.unshift(newLog);
    this.saveActivityLogs(list);
  }

  // System Settings
  static getSettings(): SystemSettings {
    return this.getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static getSystemSettings(): SystemSettings {
    return this.getSettings();
  }

  static saveSettings(settings: SystemSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  static saveSystemSettings(settings: SystemSettings): void {
    this.saveSettings(settings);
  }

  // Study Materials
  static getMaterials(): StudyMaterial[] {
    return this.getItem<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, SEED_STUDY_MATERIALS);
  }

  static async saveMaterials(materials: StudyMaterial[]): Promise<StorageWriteResult> {
    const previous = this.getMaterials();
    this.setItem(STORAGE_KEYS.MATERIALS, materials);

    const results: Promise<StorageWriteResult>[] = [syncMaterialsToSupabase(materials)];

    const newIds = new Set(materials.map((m) => m.id));
    previous.forEach((pm) => {
      if (!newIds.has(pm.id)) {
        results.push(deleteMaterialFromSupabase(pm.id));
      }
    });

    return firstWriteError(await Promise.all(results));
  }

  // Face Arena Weekly Quiz Challenge Methods
  static getFaceArenaSettings(): FaceArenaSettings {
    return this.getItem<FaceArenaSettings>(STORAGE_KEYS.FACE_ARENA_SETTINGS, DEFAULT_FACE_ARENA_SETTINGS);
  }

  static saveFaceArenaSettings(settings: FaceArenaSettings): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_SETTINGS, settings);
  }

  static getFaceArenaQuestions(): FaceArenaQuestion[] {
    return this.getItem<FaceArenaQuestion[]>(STORAGE_KEYS.FACE_ARENA_QUESTIONS, DEFAULT_FACE_ARENA_QUESTIONS);
  }

  static saveFaceArenaQuestions(questions: FaceArenaQuestion[]): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_QUESTIONS, questions);
  }

  static deleteFaceArenaQuestion(id: string): void {
    const list = this.getFaceArenaQuestions().filter((q) => q.id !== id);
    this.setItem(STORAGE_KEYS.FACE_ARENA_QUESTIONS, list);
  }

  static getFaceArenaParticipants(): FaceArenaParticipant[] {
    return this.getItem<FaceArenaParticipant[]>(STORAGE_KEYS.FACE_ARENA_PARTICIPANTS, []);
  }

  static saveFaceArenaParticipants(participants: FaceArenaParticipant[]): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_PARTICIPANTS, participants);
  }

  static saveFaceArenaParticipant(participant: FaceArenaParticipant): void {
    const list = this.getFaceArenaParticipants();
    const existingIndex = list.findIndex(
      (p) => p.id === participant.id || (p.userId === participant.userId && p.weeklyChallengeId === participant.weeklyChallengeId)
    );
    if (existingIndex >= 0) {
      list[existingIndex] = participant;
    } else {
      list.unshift(participant);
    }
    this.saveFaceArenaParticipants(list);
  }

  static getFaceArenaArchives(): FaceArenaArchive[] {
    return this.getItem<FaceArenaArchive[]>(STORAGE_KEYS.FACE_ARENA_ARCHIVES, []);
  }

  static saveFaceArenaArchives(archives: FaceArenaArchive[]): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_ARCHIVES, archives);
    archives.forEach((arc) => {
    });
  }

  static archiveCurrentWeeklyChallenge(): FaceArenaArchive | null {
    const settings = this.getFaceArenaSettings();
    const participants = this.getFaceArenaParticipants();
    const currentChallengeParticipants = participants.filter(
      (p) => p.weeklyChallengeId === settings.weeklyChallengeId && p.status === 'completed'
    );

    if (currentChallengeParticipants.length === 0 && participants.length === 0) {
      return null;
    }

    const scores = currentChallengeParticipants.map((p) => p.score);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const numberPassed = currentChallengeParticipants.filter((p) => p.passed).length;
    const numberFailed = currentChallengeParticipants.length - numberPassed;

    const archive: FaceArenaArchive = {
      id: `archive-${Date.now()}`,
      weeklyChallengeId: settings.weeklyChallengeId,
      weeklyTitle: settings.weeklyTitle,
      archivedAt: new Date().toISOString(),
      totalParticipants: currentChallengeParticipants.length,
      highestScore,
      lowestScore,
      averageScore,
      numberPassed,
      numberFailed,
      participants: safeClone(currentChallengeParticipants),
      settings: safeClone(settings),
    };

    const archives = this.getFaceArenaArchives();
    archives.unshift(archive);
    this.saveFaceArenaArchives(archives);
    return archive;
  }

  static startNewWeeklyChallenge(newTitle: string, newWeekId?: string): FaceArenaSettings {
    // 1. Archive current challenge
    this.archiveCurrentWeeklyChallenge();

    // 2. Generate new week ID
    const archives = this.getFaceArenaArchives();
    const weekNum = archives.length + 1;
    const weeklyChallengeId = newWeekId || `week-${weekNum}`;

    // 3. Update settings for new challenge
    const newSettings: FaceArenaSettings = {
      ...this.getFaceArenaSettings(),
      status: 'open',
      weeklyChallengeId,
      weeklyTitle: newTitle || `Face Arena - Week ${weekNum} Challenge`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.saveFaceArenaSettings(newSettings);
    return newSettings;
  }

  static async addMaterial(material: StudyMaterial): Promise<StorageWriteResult> {
    const list = this.getMaterials();
    list.unshift(material);
    return this.saveMaterials(list);
  }

  static async deleteMaterial(id: string): Promise<StorageWriteResult> {
    const list = this.getMaterials().filter((m) => m.id !== id);
    return this.saveMaterials(list);
  }

  // Admin Broadcast Notifications
  static getAdminNotifications(): AdminNotification[] {
    const seedNotifs: AdminNotification[] = [
      {
        id: 'anf-101',
        title: 'GST101 & MTH101 Mock CBT Schedule Announced',
        message: 'All students registered under FUL and FUAHSE are advised that the upcoming 2026 First Semester Mock CBT Exam will go live on Monday at 08:00 AM. Ensure your subscriptions are active.',
        type: 'Announcement',
        recipientGroup: 'All Students',
        universityName: 'Federal University Lokoja (FUL)',
        priority: 'High',
        status: 'Delivered',
        totalRecipients: 2450,
        totalDelivered: 2412,
        totalRead: 1890,
        failedCount: 38,
        failedDevices: 12,
        createdDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        sentDate: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
        sentBy: 'Dr. Aaron Vance (Admin)',
        attachments: [
          { name: 'CBT_Exam_Timetable_2026.pdf', type: 'PDF', url: 'https://example.com/timetable.pdf', fileSize: '1.2 MB' }
        ],
        openedCount: 1890
      },
      {
        id: 'anf-102',
        title: 'Important System Maintenance Window',
        message: 'The CBT Master platform will undergo scheduled cloud maintenance on Sunday midnight from 02:00 AM to 04:00 AM. Offline study notes will remain accessible.',
        type: 'Maintenance',
        recipientGroup: 'All Students',
        priority: 'Medium',
        status: 'Scheduled',
        scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        totalRecipients: 2450,
        totalDelivered: 0,
        totalRead: 0,
        failedCount: 0,
        createdDate: new Date(Date.now() - 3600000 * 5).toISOString(),
        sentBy: 'System Security Lead',
      },
      {
        id: 'anf-103',
        title: 'Special 30-Day Premium Discount Offer',
        message: 'Upgrade to 30-Day Premium this week and get unlimited access to extracted study materials and SMART mock CBT exam practice engine!',
        type: 'Subscription',
        recipientGroup: 'All Free Trial Students',
        priority: 'Low',
        status: 'Sent',
        totalRecipients: 1210,
        totalDelivered: 1195,
        totalRead: 820,
        failedCount: 15,
        createdDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        sentDate: new Date(Date.now() - 86400000 * 5 + 600000).toISOString(),
        sentBy: 'Marketing Coordinator',
        openedCount: 820
      },
      {
        id: 'anf-104',
        title: 'Payment Approval Notice - Instant Activation',
        message: 'Automatic system trigger: Your subscription payment has been verified via Paystack/Bank Transfer. You now have full Premium access.',
        type: 'Payment',
        recipientGroup: 'Individual Student(s)',
        priority: 'Urgent',
        status: 'Delivered',
        totalRecipients: 1,
        totalDelivered: 1,
        totalRead: 1,
        failedCount: 0,
        createdDate: new Date(Date.now() - 3600000 * 2).toISOString(),
        sentDate: new Date(Date.now() - 3600000 * 2).toISOString(),
        sentBy: 'Automated Finance System',
        isSystemGenerated: true,
      },
      {
        id: 'anf-105',
        title: 'Draft: Emergency Medical Faculty Exam Update',
        message: 'Draft message regarding updated Anatomy and Nursing CBT question format for FUAHSE students.',
        type: 'Emergency',
        recipientGroup: 'Students of a Selected University',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        priority: 'Urgent',
        status: 'Draft',
        totalRecipients: 680,
        totalDelivered: 0,
        totalRead: 0,
        failedCount: 0,
        createdDate: new Date(Date.now() - 1800000).toISOString(),
        sentBy: 'Dr. Chidi Nnamani (FUAHSE Admin)',
      }
    ];
    return this.getItem<AdminNotification[]>(STORAGE_KEYS.ADMIN_NOTIFICATIONS, seedNotifs);
  }

  static saveAdminNotifications(notifs: AdminNotification[]): void {
    this.setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, notifs);
  }

  static addAdminNotification(notif: AdminNotification): void {
    const list = this.getAdminNotifications();
    list.unshift(notif);
    this.saveAdminNotifications(list);
  }

  static deleteAdminNotification(id: string): void {
    const list = this.getAdminNotifications().filter((n) => n.id !== id);
    this.saveAdminNotifications(list);
  }

  // Reports Management Records
  static getReportRecords(): ReportRecord[] {
    const seedReports: ReportRecord[] = [
      {
        id: 'rep-101',
        title: 'Monthly Platform Student Growth & Active Engagement Report',
        category: 'Student Reports',
        generatedBy: 'System Admin',
        generatedDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'Completed',
        format: 'PDF',
        totalRecords: 2450,
        summaryText: 'Total registered students reached 2,450 with a 34% month-over-month increase in active CBT test takers across FUL and FUAHSE campuses.',
        keyInsights: [
          'FUL Lokoja accounts for 58% of total student registrations.',
          'Active premium subscription conversion rate stands at 42%.',
          'Daily peak practice window is between 18:00 and 22:00 WAT.'
        ],
        scheduleFrequency: 'Monthly'
      },
      {
        id: 'rep-102',
        title: '2026 Q1 CBT Performance & Score Distribution Analysis',
        category: 'CBT Reports',
        generatedBy: 'Academic Moderator',
        generatedDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: 'Completed',
        format: 'Excel',
        totalRecords: 14200,
        summaryText: 'Comprehensive performance breakdown across 14,200 completed CBT test sessions. Overall pass rate average is 76.4%.',
        keyInsights: [
          'GST101 Use of English boasts the highest average completion score (82%).',
          'MTH101 Calculus presents the highest failure density (31% score under 50%).',
          'Students utilizing study materials scored on average 18% higher.'
        ],
        scheduleFrequency: 'Weekly'
      },
      {
        id: 'rep-103',
        title: 'Revenue & Paystack Subscription Audit Report',
        category: 'Revenue Reports',
        generatedBy: 'Finance Administrator',
        generatedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'Completed',
        format: 'CSV',
        totalRecords: 1280,
        summaryText: 'Gross revenue generated for current cycle is ₦1,850,000 from Paystack and Flutterwave gateway transactions.',
        keyInsights: [
          '30-Day Premium plan generates 72% of total platform revenue.',
          'Direct Bank Transfer manual verification speed improved to under 8 minutes.',
          'Failed payment transaction rate is below 1.2%.'
        ],
        scheduleFrequency: 'Monthly'
      },
      {
        id: 'rep-104',
        title: 'Question Bank Quality & Difficulty Assessment',
        category: 'Question Reports',
        generatedBy: 'Dr. Aaron Vance',
        generatedDate: new Date(Date.now() - 86400000 * 7).toISOString(),
        status: 'Completed',
        format: 'PDF',
        totalRecords: 3850,
        summaryText: 'Evaluated 3,850 active CBT practice questions across 14 core university courses.',
        keyInsights: [
          '3,410 questions verified as Published and active.',
          '28 questions flagged for explanation clarity enhancement.',
          'Medium difficulty questions constitute 52% of the entire question bank.'
        ],
        scheduleFrequency: 'None'
      }
    ];
    return this.getItem<ReportRecord[]>(STORAGE_KEYS.REPORTS, seedReports);
  }

  static saveReportRecords(reports: ReportRecord[]): void {
    this.setItem(STORAGE_KEYS.REPORTS, reports);
  }

  static addReportRecord(report: ReportRecord): void {
    const list = this.getReportRecords();
    list.unshift(report);
    this.saveReportRecords(list);
  }

  static deleteReportRecord(id: string): void {
    const list = this.getReportRecords().filter((r) => r.id !== id);
    this.saveReportRecords(list);
  }

  // Full Activity Logs
  static getFullActivityLogs(): FullActivityLog[] {
    const seedLogs: FullActivityLog[] = [
      {
        id: 'act-101',
        userId: 'usr-student-1',
        userName: 'Alex Johnson',
        userRole: 'Student',
        userEmail: 'alex.student@unilag.edu.ng',
        category: 'Student Activity',
        action: 'Completed Mock CBT Exam - GST101',
        module: 'CBT Examination Engine',
        details: 'Submitted GST101 Mock Exam with score 85% (17/20) in 12m 45s.',
        timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
        ipAddress: '102.89.22.104',
        device: 'Desktop Chrome 122',
        browser: 'Chrome 122.0',
        operatingSystem: 'Windows 11',
        status: 'Success',
        metadata: { courseCode: 'GST101', score: 85, timeSpent: '12m 45s' },
      },
      {
        id: 'act-102',
        userId: 'usr-admin-1',
        userName: 'Dr. Aaron Vance',
        userRole: 'Administrator',
        userEmail: 'aaron.vance@cbtmaster.ng',
        category: 'Administrator Activity',
        action: 'Published Question Batch - MTH101',
        module: 'Question Bank Management',
        details: 'Approved and published 15 new calculus practice questions for MTH101.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        ipAddress: '197.210.65.18',
        device: 'MacBook Pro Safari',
        browser: 'Safari 17.3',
        operatingSystem: 'macOS Sonoma',
        status: 'Success',
        metadata: { courseCode: 'MTH101', questionsCount: 15 },
      },
      {
        id: 'act-103',
        userId: 'usr-student-2',
        userName: 'Chioma Okeke',
        userRole: 'Student',
        userEmail: 'chioma.okeke@fulokoja.edu.ng',
        category: 'Payment Activity',
        action: 'Paystack Payment Verification - 30-Day Premium',
        module: 'Payment Management',
        details: 'Verified Paystack ref PST_9812405. Premium subscription extended to 30 days.',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        ipAddress: '102.90.10.45',
        device: 'Android Mobile App',
        browser: 'Mobile Chrome 121',
        operatingSystem: 'Android 14',
        status: 'Success',
        metadata: { gateway: 'Paystack', amount: 2500, ref: 'PST_9812405' },
      },
      {
        id: 'act-104',
        userId: 'usr-student-3',
        userName: 'Emeka Nwosu',
        userRole: 'Student',
        userEmail: 'emeka.nwosu@fuahse.edu.ng',
        category: 'Security Alert',
        action: 'Failed Login Attempt - Brute Force Flag',
        module: 'Authentication & Security',
        details: '3 consecutive invalid password attempts detected from IP 197.211.52.90.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        ipAddress: '197.211.52.90',
        device: 'Unknown Client',
        browser: 'Firefox 120.0',
        operatingSystem: 'Linux x86_64',
        status: 'Failed',
        isSecurityAlert: true,
        metadata: { attempts: 3, flagReason: 'Multiple failed auth tokens' },
      },
      {
        id: 'act-105',
        userId: 'sys-cron',
        userName: 'System Cron Service',
        userRole: 'System',
        category: 'System Activity',
        action: 'Automated Leaderboard Recalculation',
        module: 'Leaderboard Engine',
        details: 'Processed 2,450 student CBT test results and updated real-time rankings.',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        ipAddress: '127.0.0.1 (Local Server)',
        device: 'Cloud Server',
        browser: 'Node.js Runtime',
        operatingSystem: 'Ubuntu 22.04 LTS',
        status: 'Success',
      },
      {
        id: 'act-106',
        userId: 'usr-student-4',
        userName: 'Amina Bello',
        userRole: 'Student',
        userEmail: 'amina.bello@fulokoja.edu.ng',
        category: 'Question Activity',
        action: 'Reported Question Mistake - COS101',
        module: 'Feedback & Support',
        details: 'Submitted error report for Q-402: Option C typo in binary formula.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        ipAddress: '102.89.44.12',
        device: 'iPhone 15 Pro',
        browser: 'Mobile Safari 17.2',
        operatingSystem: 'iOS 17.3',
        status: 'Warning',
      }
    ];
    return this.getItem<FullActivityLog[]>(STORAGE_KEYS.FULL_LOGS, seedLogs);
  }

  static saveFullActivityLogs(logs: FullActivityLog[]): void {
    this.setItem(STORAGE_KEYS.FULL_LOGS, logs);
    logs.forEach((l) => {
    });
  }

  static addFullActivityLog(log: Omit<FullActivityLog, 'id' | 'timestamp'> & { timestamp?: string }): void {
    const list = this.getFullActivityLogs();
    const newLog: FullActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      timestamp: log.timestamp || new Date().toISOString(),
    };
    list.unshift(newLog);
    this.saveFullActivityLogs(list);
  }

  static addActivityLog(action: string, performer = 'Administrator', category = 'Administrator Activity'): void {
    this.addFullActivityLog({
      userId: 'adm-current',
      userName: performer,
      userRole: 'Administrator',
      userEmail: 'admin@cbtmaster.ng',
      category: category as any,
      action: action,
      module: 'Administrator Management',
      details: action,
      ipAddress: '102.89.23.14',
      device: 'Admin Console',
      browser: 'Chrome',
      operatingSystem: 'macOS',
      status: 'Success'
    });
  }

  // Active User Sessions
  static getActiveSessions(): ActiveUserSession[] {
    const seedSessions: ActiveUserSession[] = [
      {
        sessionId: 'sess-1001',
        userId: 'usr-student-1',
        userName: 'Alex Johnson',
        userRole: 'Student',
        email: 'alex.student@unilag.edu.ng',
        ipAddress: '102.89.22.104',
        device: 'Dell XPS 15 (Windows 11)',
        browser: 'Chrome 122.0',
        operatingSystem: 'Windows 11',
        loginTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        lastActivityTime: new Date(Date.now() - 60000 * 2).toISOString(),
        status: 'Active',
        location: 'Lagos, Nigeria',
      },
      {
        sessionId: 'sess-1002',
        userId: 'usr-admin-1',
        userName: 'Dr. Aaron Vance',
        userRole: 'Administrator',
        email: 'aaron.vance@cbtmaster.ng',
        ipAddress: '197.210.65.18',
        device: 'MacBook Pro 16" (macOS)',
        browser: 'Safari 17.3',
        operatingSystem: 'macOS Sonoma',
        loginTime: new Date(Date.now() - 3600000 * 4).toISOString(),
        lastActivityTime: new Date(Date.now() - 60000 * 1).toISOString(),
        status: 'Active',
        location: 'Abuja, Nigeria',
      },
      {
        sessionId: 'sess-1003',
        userId: 'usr-student-2',
        userName: 'Chioma Okeke',
        userRole: 'Student',
        email: 'chioma.okeke@fulokoja.edu.ng',
        ipAddress: '102.90.10.45',
        device: 'Samsung Galaxy S24',
        browser: 'Mobile Chrome 121',
        operatingSystem: 'Android 14',
        loginTime: new Date(Date.now() - 3600000 * 2).toISOString(),
        lastActivityTime: new Date(Date.now() - 60000 * 15).toISOString(),
        status: 'Idle',
        location: 'Lokoja, Kogi State',
      },
      {
        sessionId: 'sess-1004',
        userId: 'usr-student-3',
        userName: 'Emeka Nwosu',
        userRole: 'Student',
        email: 'emeka.nwosu@fuahse.edu.ng',
        ipAddress: '197.211.52.90',
        device: 'HP Pavilion',
        browser: 'Firefox 120.0',
        operatingSystem: 'Windows 10',
        loginTime: new Date(Date.now() - 3600000 * 0.2).toISOString(),
        lastActivityTime: new Date(Date.now() - 60000 * 5).toISOString(),
        status: 'Active',
        location: 'Enugu, Nigeria',
      }
    ];
    return this.getItem<ActiveUserSession[]>(STORAGE_KEYS.ACTIVE_SESSIONS, seedSessions);
  }

  static saveActiveSessions(sessions: ActiveUserSession[]): void {
    this.setItem(STORAGE_KEYS.ACTIVE_SESSIONS, sessions);
    sessions.forEach((s) => {
    });
  }

  static terminateSession(sessionId: string): void {
    const list = this.getActiveSessions().map((s) =>
      s.sessionId === sessionId ? { ...s, status: 'Terminated' as const } : s
    );
    this.saveActiveSessions(list);
  }

  // Support Tickets & Feedback
  static getSupportTickets(): SupportTicket[] {
    const seedTickets: SupportTicket[] = [
      {
        id: 'tkt-101',
        ticketNumber: 'TKT-2026-0841',
        studentId: 'usr-student-2',
        studentName: 'Chioma Okeke',
        studentEmail: 'chioma.okeke@fulokoja.edu.ng',
        studentPhone: '+234 803 123 4567',
        universityName: 'Federal University Lokoja (FUL)',
        departmentName: 'Computer Science',
        courseCode: 'MTH101',
        title: 'Paystack Payment Deducted But Premium Not Activated',
        category: 'Payment & Subscription',
        priority: 'Urgent',
        status: 'Open',
        assignedAdmin: 'Finance Administrator',
        createdDate: new Date(Date.now() - 3600000 * 3).toISOString(),
        lastUpdated: new Date(Date.now() - 3600000 * 1).toISOString(),
        description: 'I paid N2,500 via Paystack for 30-Day Premium subscription. Money was debited from my UBA account, ref PST_9812405, but my account still shows Free Trial.',
        messages: [
          {
            id: 'msg-1',
            senderId: 'usr-student-2',
            senderName: 'Chioma Okeke',
            senderRole: 'Student',
            messageText: 'Hello Admin, please assist urgently. I have an upcoming MTH101 practice exam today and my premium access is still locked.',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            attachments: [
              { name: 'Paystack_Debit_Alert_Receipt.pdf', url: '#', size: '240 KB', type: 'PDF' }
            ]
          }
        ],
        attachments: [
          { name: 'Paystack_Debit_Alert_Receipt.pdf', url: '#', size: '240 KB', type: 'PDF' }
        ],
        deviceInfo: 'Samsung Galaxy S24',
        browser: 'Mobile Chrome 121',
        operatingSystem: 'Android 14',
      },
      {
        id: 'tkt-102',
        ticketNumber: 'TKT-2026-0842',
        studentId: 'usr-student-4',
        studentName: 'Amina Bello',
        studentEmail: 'amina.bello@fulokoja.edu.ng',
        universityName: 'Federal University Lokoja (FUL)',
        departmentName: 'Computer Science',
        courseCode: 'COS101',
        questionId: 'q-4',
        title: 'Question #Q-4 Explanation Typo in Binary Conversion',
        category: 'Question Error / Report',
        priority: 'Medium',
        status: 'In Progress',
        assignedAdmin: 'Academic Moderator',
        createdDate: new Date(Date.now() - 3600000 * 14).toISOString(),
        lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(),
        description: 'In COS101 Question Q-4, the question asks for binary equivalent of 25. Option A states 11001, but the explanation misstates 16 + 8 + 1 = 25 as 11011 in one sentence.',
        messages: [
          {
            id: 'msg-1',
            senderId: 'usr-student-4',
            senderName: 'Amina Bello',
            senderRole: 'Student',
            messageText: 'Please review question Q-4 explanation text in COS101 topic Binary Logic.',
            timestamp: new Date(Date.now() - 3600000 * 14).toISOString()
          },
          {
            id: 'msg-2',
            senderId: 'usr-admin-1',
            senderName: 'Academic Moderator',
            senderRole: 'Support Agent',
            messageText: 'Thank you Amina for bringing this to our attention. Our subject matter team is reviewing the explanation proof reading now.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ],
        deviceInfo: 'iPhone 15 Pro',
        browser: 'Mobile Safari 17.2',
        operatingSystem: 'iOS 17.3',
        isQuestionReport: true,
      },
      {
        id: 'tkt-103',
        ticketNumber: 'TKT-2026-0843',
        studentId: 'usr-student-3',
        studentName: 'Emeka Nwosu',
        studentEmail: 'emeka.nwosu@fuahse.edu.ng',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        departmentName: 'Human Anatomy',
        courseCode: 'ANA201',
        title: 'App Freezes During 50-Question Timer Countdowns',
        category: 'Technical / App Bug',
        priority: 'High',
        status: 'Open',
        assignedAdmin: 'System Admin',
        createdDate: new Date(Date.now() - 3600000 * 22).toISOString(),
        lastUpdated: new Date(Date.now() - 3600000 * 5).toISOString(),
        description: 'When running an active Mock CBT on mobile browser, switching tabs causes the timer clock to freeze and auto-submit when returning.',
        messages: [
          {
            id: 'msg-1',
            senderId: 'usr-student-3',
            senderName: 'Emeka Nwosu',
            senderRole: 'Student',
            messageText: 'The timer freeze bug happens consistently when incoming phone calls interrupt the CBT session on Android.',
            timestamp: new Date(Date.now() - 3600000 * 22).toISOString()
          }
        ],
        deviceInfo: 'HP Pavilion / Android Client',
        browser: 'Firefox 120.0',
        operatingSystem: 'Windows 10 / Android 13',
        isBugReport: true,
      },
      {
        id: 'tkt-104',
        ticketNumber: 'TKT-2026-0840',
        studentId: 'usr-student-1',
        studentName: 'Alex Johnson',
        studentEmail: 'alex.student@unilag.edu.ng',
        universityName: 'University of Lagos',
        departmentName: 'Computer Science',
        title: 'Request Dark Mode Toggle for Late-Night Practice Sessions',
        category: 'Feature Request',
        priority: 'Low',
        status: 'Resolved',
        assignedAdmin: 'UX Manager',
        createdDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastUpdated: new Date(Date.now() - 86400000 * 1).toISOString(),
        description: 'Would love to see an eye-care dark theme option when practicing CBT questions late at night before exams.',
        messages: [
          {
            id: 'msg-1',
            senderId: 'usr-student-1',
            senderName: 'Alex Johnson',
            senderRole: 'Student',
            messageText: 'Please consider adding a dark theme toggle for students.',
            timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: 'msg-2',
            senderId: 'usr-admin-1',
            senderName: 'UX Manager',
            senderRole: 'Support Agent',
            messageText: 'Hi Alex, dark mode has been integrated across the student practice arena! Thank you for your feedback.',
            timestamp: new Date(Date.now() - 86400000 * 1).toISOString()
          }
        ],
        satisfactionRating: 5,
        feedbackComments: 'Super fast response, love the dark interface!'
      }
    ];
    return this.getItem<SupportTicket[]>(STORAGE_KEYS.SUPPORT_TICKETS, seedTickets);
  }

  static saveSupportTickets(tickets: SupportTicket[]): void {
    this.setItem(STORAGE_KEYS.SUPPORT_TICKETS, tickets);
  }

  static addSupportTicket(ticket: SupportTicket): void {
    const list = this.getSupportTickets();
    list.unshift(ticket);
    this.saveSupportTickets(list);
  }

  static updateSupportTicket(ticket: SupportTicket): void {
    const list = this.getSupportTickets().map((t) => (t.id === ticket.id ? ticket : t));
    this.saveSupportTickets(list);
  }

  static deleteSupportTicket(id: string): void {
    const list = this.getSupportTickets().filter((t) => t.id !== id);
    this.saveSupportTickets(list);
  }

  // Backup & Restore Engine Methods
  static getBackupRecords(): BackupRecord[] {
    const seedBackups: BackupRecord[] = [
      {
        id: 'bak-20260723-01',
        name: 'Auto_Daily_Full_Platform_Backup_2026-07-23',
        type: 'Automatic',
        size: '34.8 MB',
        sizeBytes: 36490444,
        createdDate: new Date(Date.now() - 3600000 * 3).toISOString(),
        createdBy: 'System Scheduler',
        status: 'Success',
        location: 'Supabase Database Primary Bucket (eu-west2)',
        verificationStatus: 'Verified',
        durationSeconds: 14,
        scope: ['Complete System Backup'],
        healthScore: 100,
        notes: 'Automated 02:00 AM daily platform snapshot. All Database tables passed integrity check.',
      },
      {
        id: 'bak-20260722-02',
        name: 'Manual_Pre_Exam_Questions_Export',
        type: 'Manual',
        size: '18.2 MB',
        sizeBytes: 19084083,
        createdDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        createdBy: 'Dr. Aaron Vance (Super Admin)',
        status: 'Success',
        location: 'Cloud Storage Vault (Encrypted)',
        verificationStatus: 'Verified',
        durationSeconds: 9,
        scope: ['Questions', 'Courses', 'Universities', 'CBT Results'],
        healthScore: 98,
        notes: 'Pre-exam batch update backup covering MTH101, GST101, and COS101 question banks.',
      },
      {
        id: 'bak-20260720-03',
        name: 'Auto_Weekly_Full_System_Backup',
        type: 'Automatic',
        size: '32.1 MB',
        sizeBytes: 33659289,
        createdDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdBy: 'System Scheduler',
        status: 'Success',
        location: 'Supabase Database Primary Bucket (eu-west2)',
        verificationStatus: 'Verified',
        durationSeconds: 12,
        scope: ['Complete System Backup'],
        healthScore: 100,
      },
      {
        id: 'bak-20260715-04',
        name: 'Manual_Payment_Audit_Snapshot',
        type: 'Manual',
        size: '8.4 MB',
        sizeBytes: 8808038,
        createdDate: new Date(Date.now() - 86400000 * 8).toISOString(),
        createdBy: 'Finance Manager',
        status: 'Success',
        location: 'Cloud Storage Vault (Encrypted)',
        verificationStatus: 'Verified',
        durationSeconds: 6,
        scope: ['Payment Records', 'Subscription Records', 'Student Data'],
        healthScore: 96,
      }
    ];
    return this.getItem<BackupRecord[]>(STORAGE_KEYS.BACKUPS, seedBackups);
  }

  static saveBackupRecords(backups: BackupRecord[]): void {
    this.setItem(STORAGE_KEYS.BACKUPS, backups);
    backups.forEach((b) => {
    });
  }

  static addBackupRecord(backup: BackupRecord): void {
    const list = this.getBackupRecords();
    list.unshift(backup);
    this.saveBackupRecords(list);
  }

  static deleteBackupRecord(id: string): void {
    const list = this.getBackupRecords().filter((b) => b.id !== id);
    this.saveBackupRecords(list);
  }

  static getAutoBackupConfig(): AutoBackupConfig {
    const defaultConfig: AutoBackupConfig = {
      enabled: true,
      schedule: 'Daily',
      backupTime: '02:00 AM',
      retentionCount: 30,
      selectedScopes: ['Complete System Backup'],
    };
    return this.getItem<AutoBackupConfig>(STORAGE_KEYS.AUTO_BACKUP_CONFIG, defaultConfig);
  }

  static saveAutoBackupConfig(config: AutoBackupConfig): void {
    this.setItem(STORAGE_KEYS.AUTO_BACKUP_CONFIG, config);
  }

  static getRestoreLogs(): RestoreLog[] {
    const seedRestoreLogs: RestoreLog[] = [
      {
        id: 'rst-101',
        backupId: 'bak-20260715-04',
        backupName: 'Manual_Payment_Audit_Snapshot',
        restoredBy: 'Dr. Aaron Vance (Super Admin)',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'Completed',
        details: 'Restored 1,240 subscription records and verified Paystack transaction hashes.',
        scopeRestored: ['Payment Records', 'Subscription Records'],
      }
    ];
    return this.getItem<RestoreLog[]>(STORAGE_KEYS.RESTORE_LOGS, seedRestoreLogs);
  }

  static saveRestoreLogs(logs: RestoreLog[]): void {
    this.setItem(STORAGE_KEYS.RESTORE_LOGS, logs);
    logs.forEach((l) => {
    });
  }

  static addRestoreLog(log: RestoreLog): void {
    const list = this.getRestoreLogs();
    list.unshift(log);
    this.saveRestoreLogs(list);
  }

  // System Configuration Methods
  static getSystemSettingsPayload(): SystemSettingsPayload {
    const defaultPayload: SystemSettingsPayload = {
      general: {
        platformName: 'CBT Master Practice Engine',
        logoUrl: '/favicon.ico',
        faviconUrl: '/favicon.ico',
        description: 'Premier Nigerian University CBT Examination Preparation Platform for UNILAG, FUL, FUAHSE, OAU, UNIBEN, and top institutions.',
        contactEmail: 'admin@cbtmaster.ng',
        supportPhone: '+234 803 123 4567',
        officialWebsite: 'https://cbtmaster.ng',
        copyrightText: '© 2026 CBT Master Nigeria. All rights reserved.',
        defaultLanguage: 'English (NG)',
        defaultTimeZone: 'Africa/Lagos (WAT, UTC+1)',
        dateTimeFormat: 'DD/MM/YYYY hh:mm A',
      },
      auth: {
        emailAuthEnabled: true,
        googleSignInEnabled: true,
        minPasswordLength: 8,
        requirePasswordNumber: true,
        requirePasswordSpecialChar: false,
        sessionTimeoutMinutes: 60,
        loginAttemptLimit: 5,
        lockoutDurationMinutes: 15,
        rememberMeOption: true,
        twoFactorEnabled: false,
      },
      registration: {
        registrationEnabled: true,
        requireEmailVerification: true,
        requirePhoneVerification: false,
        defaultFreeTrialDurationDays: 7,
        maxFreeTrialAttempts: 10,
        defaultStudentStatus: 'Active',
        autoAssignStudentId: true,
      },
      cbt: {
        defaultCbtTimeMinutes: 20,
        passingScorePercentage: 50,
        randomizeQuestions: true,
        randomizeAnswerOptions: true,
        showResultImmediately: true,
        hideCorrectAnswersUntilCompletion: false,
        allowQuestionReview: true,
        autoSubmitWhenTimeEnds: true,
        maxCbtAttempts: 99,
        negativeMarkingEnabled: false,
        negativeMarkingDeductionPct: 0,
      },
      subscription: {
        freeTrialQuestionLimit: 30,
        enableUnlimitedQuestions: true,
        allowUnlimitedForPremiumOnly: true,
        warningThreshold: 25,
        freeTrialEnabled: true,
        premiumQuestionAccess: 'Unlimited All Courses & Past Questions',
        subscriptionDurationDays: 30,
        subscriptionPriceNGN: 2500,
        subscriptionBenefits: [
          'Unlimited CBT & Practice Tests',
          'Full Past Question Bank Access',
          'Real-time Ranking & Leaderboard',
          'SMART Performance Diagnostic Reports',
          'Offline Study Material Downloads',
        ],
        trialExpirationMessage: 'Your 30-question free trial limit has been reached. Upgrade to Premium for unlimited practice & exam engine access!',
        upgradePageTitle: 'Upgrade to CBT Master Premium',
        upgradePageContent: 'Get unrestricted access to thousands of past questions, live exam practice engines, detailed SMART answer explanations, and downloadable course guides.',
        paymentActivationEnabled: true,
        gracePeriodDays: 3,
        autoExpirationEnabled: true,
        renewalReminderDays: 2,
      },
      notifications: {
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        maintenanceAlertsEnabled: true,
        paymentNotificationsEnabled: true,
        cbtRemindersEnabled: true,
        subscriptionExpiryRemindersEnabled: true,
      },
      security: {
        passwordPolicyStrictness: 'Strict',
        sessionExpirationMinutes: 60,
        deviceLoginLimit: 3,
        ipRestrictionsEnabled: false,
        allowedIps: ['197.210.65.18', '102.89.22.104'],
        auditLoggingEnabled: true,
        securityAlertsEnabled: true,
      },
      maintenance: {
        enabled: false,
        message: 'CBT Master is currently undergoing scheduled database maintenance and infrastructure upgrades. We will be back online shortly!',
        startTime: '',
        endTime: '',
        allowAdminsThrough: true,
      },
      integrations: [
        {
          id: 'int-1',
          name: 'Firebase Database & Auth',
          serviceKey: 'FIREBASE_CORE',
          status: 'Connected',
          lastTested: new Date().toISOString(),
          details: 'Database Database & Firebase Authentication SDK v10.8 active.',
        },
        {
          id: 'int-2',
          name: 'Google OAuth 2.0 Sign-In',
          serviceKey: 'GOOGLE_AUTH',
          status: 'Connected',
          lastTested: new Date().toISOString(),
          details: 'Google Identity Services OAuth Client configured for student logins.',
        },
        {
          id: 'int-3',
          name: 'Paystack Payment Gateway',
          serviceKey: 'PAYSTACK_NG',
          status: 'Connected',
          lastTested: new Date().toISOString(),
          details: 'Live Paystack secret key verified for NGN 2,500 premium card/transfer payments.',
        },
        {
          id: 'int-4',
          name: 'Flutterwave Backup Gateway',
          serviceKey: 'FLUTTERWAVE_NG',
          status: 'Connected',
          lastTested: new Date().toISOString(),
          details: 'Fallback payment gateway ready.',
        },
        {
          id: 'int-5',
          name: 'SMTP Email Notification Engine',
          serviceKey: 'SMTP_MAIL',
          status: 'Connected',
          lastTested: new Date().toISOString(),
          details: 'Transactional email service connected via secure TLS port 587.',
        }
      ],
      roles: [
        {
          roleId: 'role-superadmin',
          roleName: 'Super Administrator',
          description: 'Full unmitigated root control over all modules, system configurations, backups, and user permissions.',
          userCount: 2,
          permissions: ['ALL_PERMISSIONS', 'MANAGE_SETTINGS', 'BACKUP_RESTORE', 'FINANCE_FULL'],
        },
        {
          roleId: 'role-questionmgr',
          roleName: 'Question Manager',
          description: 'Access to Question Bank Management, Smart Bulk Uploads, SMART Generation, and Quality Audits.',
          userCount: 4,
          permissions: ['MANAGE_QUESTIONS', 'MANAGE_COURSES', 'VIEW_REPORTS'],
        },
        {
          roleId: 'role-studentmgr',
          roleName: 'Student Manager',
          description: 'Manage student profiles, registrations, restrictions, bans, and practice logs.',
          userCount: 3,
          permissions: ['MANAGE_STUDENTS', 'VIEW_LEADERBOARD', 'SUPPORT_TICKETS'],
        },
        {
          roleId: 'role-financemgr',
          roleName: 'Finance Manager',
          description: 'Manage Paystack transactions, plan prices, revenue analytics, and refund approvals.',
          userCount: 2,
          permissions: ['VIEW_TRANSACTIONS', 'MANAGE_PLANS', 'REVENUE_REPORTS'],
        },
        {
          roleId: 'role-supportmgr',
          roleName: 'Support Manager',
          description: 'Handle student support tickets, error reports, and live complaints.',
          userCount: 5,
          permissions: ['SUPPORT_TICKETS', 'VIEW_LOGS'],
        }
      ]
    };
    const res = this.getItem<SystemSettingsPayload>(STORAGE_KEYS.SYSTEM_SETTINGS, defaultPayload);
    if (res && res.subscription) {
      if (res.subscription.enableUnlimitedQuestions === undefined) res.subscription.enableUnlimitedQuestions = true;
      if (res.subscription.allowUnlimitedForPremiumOnly === undefined) res.subscription.allowUnlimitedForPremiumOnly = true;
      if (res.subscription.freeTrialQuestionLimit === undefined) res.subscription.freeTrialQuestionLimit = 30;
    }
    return res;
  }

  static saveSystemSettingsPayload(payload: SystemSettingsPayload): void {
    this.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, payload);
  }

  // ==========================================
  // LEARNING COMMUNITY STORAGE METHODS
  // ==========================================

  // Topic Requests
  static getTopicRequests(): TopicRequest[] {
    const defaultRequests: TopicRequest[] = [
      {
        id: 'req-1',
        studentId: 'usr-student-1',
        studentName: 'Alex Johnson',
        studentEmail: 'alex.student@unilag.edu.ng',
        universityId: 'uni-fuahse',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        level: '100 Level',
        semester: 'First Semester',
        courseId: 'crs-fuahse-6',
        courseCode: 'ANA101',
        courseTitle: 'Human Anatomy & Histology',
        topicTitle: 'Muscles of the Upper Limb',
        challengeDescription: "I don't understand the origin and insertion of the muscles and their innervation pathways.",
        status: 'In Review',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        requestCount: 85,
      },
      {
        id: 'req-2',
        studentId: 'usr-student-2',
        studentName: 'Chioma Okeke',
        studentEmail: 'chioma.o@ful.edu.ng',
        universityId: 'uni-ful',
        universityName: 'Federal University Lokoja (FUL)',
        level: '100 Level',
        semester: 'First Semester',
        courseId: 'crs-ful-5',
        courseCode: 'CHM101',
        courseTitle: 'General Chemistry I (Physical & Inorganic)',
        topicTitle: 'Thermodynamics & Enthalpy Calculations',
        challengeDescription: 'Struggling with Born-Haber cycle diagrams and calculating Gibbs Free Energy changes in CBT exams.',
        status: 'Tutorial Planned',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        requestCount: 62,
      },
      {
        id: 'req-3',
        studentId: 'usr-student-3',
        studentName: 'Ibrahim Musa',
        studentEmail: 'ibrahim.m@ful.edu.ng',
        universityId: 'uni-ful',
        universityName: 'Federal University Lokoja (FUL)',
        level: '100 Level',
        semester: 'First Semester',
        courseId: 'crs-2',
        courseCode: 'MTH101',
        courseTitle: 'Elementary Mathematics I (Calculus & Algebra)',
        topicTitle: 'Integration by Parts & Trigonometric Substitution',
        challengeDescription: 'Fast trick methods for solving definite integrals within the short CBT time limit.',
        status: 'Completed',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        requestCount: 110,
      },
    ];
    return this.getItem<TopicRequest[]>(STORAGE_KEYS.TOPIC_REQUESTS, defaultRequests);
  }

  static saveTopicRequest(req: TopicRequest): void {
    const requests = this.getTopicRequests();
    const existingIndex = requests.findIndex((r) => r.id === req.id);
    let updated: TopicRequest[];
    if (existingIndex >= 0) {
      updated = [...requests];
      updated[existingIndex] = req;
    } else {
      updated = [req, ...requests];
    }
    this.setItem(STORAGE_KEYS.TOPIC_REQUESTS, updated);
  }

  static updateTopicRequestStatus(id: string, status: TopicRequest['status']): void {
    const requests = this.getTopicRequests();
    const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
    this.setItem(STORAGE_KEYS.TOPIC_REQUESTS, updated);
  }

  static deleteTopicRequest(id: string): void {
    const requests = this.getTopicRequests();
    const updated = requests.filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.TOPIC_REQUESTS, updated);
  }

  // Topic Collection Config (Open / Closed toggle)
  static getTopicCollectionConfig(): TopicCollectionConfig {
    const defaultConfig: TopicCollectionConfig = {
      isOpen: true,
      closedMessage: 'Topic requests are currently closed. They will reopen after new tutorials have been prepared.',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Menmex',
    };
    return this.getItem<TopicCollectionConfig>(STORAGE_KEYS.TOPIC_COLLECTION_CONFIG, defaultConfig);
  }

  static setTopicCollectionConfig(config: TopicCollectionConfig): void {
    this.setItem(STORAGE_KEYS.TOPIC_COLLECTION_CONFIG, config);
  }

  // Tutorial Videos
  static getTutorialVideos(): TutorialVideo[] {
    const defaultVideos: TutorialVideo[] = [
      {
        id: 'vid-1',
        title: 'Muscles of the Upper Limb & Brachial Plexus Breakdown',
        description: 'Comprehensive walkthrough covering origins, insertions, innervation, and motor functions of upper limb musculature prepared specifically for medical CBT exams.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        universityId: 'uni-fuahse',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        level: '100 Level',
        semester: 'First Semester',
        courseId: 'crs-fuahse-6',
        courseCode: 'ANA101',
        courseTitle: 'Human Anatomy & Histology',
        topic: 'Muscles of the Upper Limb',
        durationMinutes: 24,
        keyLearningPoints: [
          'Full origin & insertion muscle table mapping',
          'Brachial plexus roots, trunks, divisions & cords',
          'Step-by-step clinical case scenarios for CBT questions',
        ],
        viewsCount: 1420,
        isFeatured: true,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        createdByName: 'Joyce and video tutorial team',
      },
      {
        id: 'vid-2',
        title: 'Calculus Fast-Trick Methods for MTH101 CBT',
        description: 'Master definite integrals, limits, and trigonometric derivatives in under 45 seconds per question with shortcut hacks.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        universityId: 'uni-ful',
        universityName: 'Federal University Lokoja (FUL)',
        level: '100 Level',
        semester: 'First Semester',
        courseId: 'crs-2',
        courseCode: 'MTH101',
        courseTitle: 'Elementary Mathematics I (Calculus & Algebra)',
        topic: 'Integration by Parts & Limits',
        durationMinutes: 18,
        keyLearningPoints: [
          'L’Hôpital’s rule quick shortcuts for CBT limits',
          'Tabular integration by parts formula',
          'Past CBT paper solutions walkthrough',
        ],
        viewsCount: 2890,
        isFeatured: true,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        createdByName: 'Joyce and video tutorial team',
      },
      {
        id: 'vid-3',
        title: 'GST101 Use of English Grammar & Concord Masterclass',
        description: 'Complete guide to subject-verb agreement, lexical structures, and common CBT exam traps in university general studies.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        universityId: 'uni-ful',
        universityName: 'Federal University Lokoja (FUL)',
        level: '100 Level',
        semester: 'First Semester',
        courseId: 'crs-1',
        courseCode: 'GST101',
        courseTitle: 'Use of English & Communication',
        topic: 'Grammatical Concord & Syntax',
        durationMinutes: 15,
        keyLearningPoints: [
          '20 golden rules of subject-verb concord',
          'Phonetics & stress accent patterns',
          'Elimination techniques for 100% CBT accuracy',
        ],
        viewsCount: 3100,
        isFeatured: false,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        createdByName: 'Joyce and video tutorial team',
      },
    ];
    return this.getItem<TutorialVideo[]>(STORAGE_KEYS.TUTORIAL_VIDEOS, defaultVideos);
  }

  static saveTutorialVideo(video: TutorialVideo): void {
    const videos = this.getTutorialVideos();
    const existingIndex = videos.findIndex((v) => v.id === video.id);
    let updated: TutorialVideo[];
    if (existingIndex >= 0) {
      updated = [...videos];
      updated[existingIndex] = video;
    } else {
      updated = [video, ...videos];
    }
    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
  }

  static deleteTutorialVideo(id: string): void {
    const videos = this.getTutorialVideos();
    const updated = videos.filter((v) => v.id !== id);
    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
  }

  static incrementVideoViews(id: string): void {
    const videos = this.getTutorialVideos();
    const updated = videos.map((v) => (v.id === id ? { ...v, viewsCount: (v.viewsCount || 0) + 1 } : v));
    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
    const target = updated.find((v) => v.id === id);
    if (target) {
    }
  }

  static toggleLikeVideo(id: string, userId: string = 'usr-current'): { likesCount: number; isLiked: boolean } {
    const videos = this.getTutorialVideos();
    let likesCount = 0;
    let isLiked = false;

    const updated = videos.map((v) => {
      if (v.id === id) {
        const likedBy = Array.isArray(v.likedBy) ? v.likedBy : [];
        const index = likedBy.indexOf(userId);
        let newLikedBy: string[];
        if (index >= 0) {
          newLikedBy = likedBy.filter((uid) => uid !== userId);
          isLiked = false;
        } else {
          newLikedBy = [...likedBy, userId];
          isLiked = true;
        }
        likesCount = Math.max(0, (v.likesCount || 0) + (isLiked ? 1 : -1));
        const updatedVid = { ...v, likesCount, likedBy: newLikedBy };
        return updatedVid;
      }
      return v;
    });

    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
    return { likesCount, isLiked };
  }

  static toggleSaveVideo(id: string, userId: string = 'usr-current'): boolean {
    const videos = this.getTutorialVideos();
    let isSaved = false;

    const updated = videos.map((v) => {
      if (v.id === id) {
        const savedBy = Array.isArray(v.savedBy) ? v.savedBy : [];
        const index = savedBy.indexOf(userId);
        let newSavedBy: string[];
        if (index >= 0) {
          newSavedBy = savedBy.filter((uid) => uid !== userId);
          isSaved = false;
        } else {
          newSavedBy = [...savedBy, userId];
          isSaved = true;
        }
        const updatedVid = { ...v, savedBy: newSavedBy };
        return updatedVid;
      }
      return v;
    });

    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
    return isSaved;
  }

  static submitReport(report: {
    targetType: 'tutorial' | 'request' | 'post';
    targetId: string;
    targetTitle: string;
    reason: string;
    reportedBy: string;
    reportedByName: string;
  }): void {
    const reportObj = {
      id: `rep-${Date.now()}`,
      ...report,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    const reports = this.getItem<any[]>('cbt_content_reports', []);
    this.setItem('cbt_content_reports', [reportObj, ...reports]);
  }

  static getReports(): any[] {
    return this.getItem<any[]>('cbt_content_reports', []);
  }

  static saveReports(reports: any[]): void {
    this.setItem('cbt_content_reports', reports);
  }

  // Community Discussion Posts
  static getCommunityPosts(): CommunityDiscussionPost[] {
    const defaultPosts: CommunityDiscussionPost[] = [
      {
        id: 'post-1',
        authorId: 'usr-student-2',
        authorName: 'Chioma Okeke',
        authorUniversity: 'Federal University Lokoja (FUL)',
        authorLevel: '100 Level',
        courseCode: 'ANA101',
        courseTitle: 'Human Anatomy & Histology',
        topic: 'Muscles of the Upper Limb',
        title: 'How do you remember the nerve supply for muscles of the anterior forearm compartment?',
        content: "I keep confusing median nerve supply with ulnar nerve branches for flexor carpi ulnaris and flexor digitorum profundus. Does anyone have a simple mnemonic that worked for them in CBT tests?",
        upvotes: 18,
        upvotedBy: ['usr-student-1', 'usr-student-3'],
        repliesCount: 4,
        isReported: false,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'Active',
      },
      {
        id: 'post-2',
        authorId: 'usr-student-3',
        authorName: 'Ibrahim Musa',
        authorUniversity: 'Federal University Lokoja (FUL)',
        authorLevel: '100 Level',
        courseCode: 'MTH101',
        courseTitle: 'Elementary Mathematics I',
        topic: 'Calculus Integration',
        title: 'Shortcut for solving integral of e^(2x) sin(3x) dx under 30 seconds',
        content: "When using integration by parts twice, it takes over 3 minutes on CBT. You can use the tabular method formula: e^(ax)/(a^2 + b^2) * [a sin(bx) - b cos(bx)]. Plug in a=2, b=3 and select the option immediately!",
        upvotes: 42,
        upvotedBy: ['usr-student-1', 'usr-student-2'],
        repliesCount: 7,
        isReported: false,
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'Active',
      },
    ];
    return this.getItem<CommunityDiscussionPost[]>(STORAGE_KEYS.COMMUNITY_POSTS, defaultPosts);
  }

  static saveCommunityPost(post: CommunityDiscussionPost): void {
    const posts = this.getCommunityPosts();
    const existingIndex = posts.findIndex((p) => p.id === post.id);
    let updated: CommunityDiscussionPost[];
    if (existingIndex >= 0) {
      updated = [...posts];
      updated[existingIndex] = post;
    } else {
      updated = [post, ...posts];
    }
    this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, updated);
  }

  static upvoteCommunityPost(postId: string, userId: string): void {
    const posts = this.getCommunityPosts();
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const hasUpvoted = p.upvotedBy.includes(userId);
        const upvotedBy = hasUpvoted ? p.upvotedBy.filter((u) => u !== userId) : [...p.upvotedBy, userId];
        const upvotes = hasUpvoted ? Math.max(0, p.upvotes - 1) : p.upvotes + 1;
        return { ...p, upvotes, upvotedBy };
      }
      return p;
    });
    this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, updated);
  }

  static reportCommunityPost(postId: string, reason: string, reporterId: string): void {
    const posts = this.getCommunityPosts();
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, isReported: true, reportReason: reason, reportedBy: reporterId } : p
    );
    this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, updated);
  }

  static deleteCommunityPost(postId: string): void {
    const posts = this.getCommunityPosts();
    const updated = posts.filter((p) => p.id !== postId);
    this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, updated);
  }

  // Community Replies
  static getCommunityReplies(postId: string): CommunityReply[] {
    const allReplies = this.getItem<CommunityReply[]>(STORAGE_KEYS.COMMUNITY_REPLIES, [
      {
        id: 'rep-1',
        postId: 'post-1',
        authorId: 'usr-student-1',
        authorName: 'Alex Johnson',
        authorRole: 'student',
        content: 'Remember 1 & a half muscles supplied by Ulnar nerve (Flexor Carpi Ulnaris and medial half of Flexor Digitorum Profundus). ALL the rest in the flexor compartment are Median nerve!',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'rep-2',
        postId: 'post-1',
        authorId: 'admin-super',
        authorName: 'Joyce & Video Tutorial Team (Acadet Educator)',
        authorRole: 'admin',
        content: 'Great question Chioma! We just published a video tutorial covering forearm innervation with anatomical diagrams. Check the Tutorial Videos tab in Learning Community!',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]);
    return allReplies.filter((r) => r.postId === postId);
  }

  static saveCommunityReply(reply: CommunityReply): void {
    const allReplies = this.getItem<CommunityReply[]>(STORAGE_KEYS.COMMUNITY_REPLIES, []);
    const updated = [...allReplies, reply];
    this.setItem(STORAGE_KEYS.COMMUNITY_REPLIES, updated);

    // Update post repliesCount
    const posts = this.getCommunityPosts();
    const updatedPosts = posts.map((p) => (p.id === reply.postId ? { ...p, repliesCount: p.repliesCount + 1 } : p));
    this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, updatedPosts);

  }

  // Learning Resources
  static getLearningResources(): LearningResourceItem[] {
    const defaultResources: LearningResourceItem[] = [
      {
        id: 'res-1',
        title: 'Upper Limb Musculature & Innervation Summary Sheet',
        description: 'High-yield PDF summary table detailing origin, insertion, nerve supply, and clinical CBT test notes.',
        resourceType: 'PDF Summary',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '1.8 MB',
        universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
        courseCode: 'ANA101',
        level: '100 Level',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'res-2',
        title: 'MTH101 Calculus & Algebra Formula Cheat Sheet',
        description: 'Complete list of standard integration rules, limit tricks, and series expansions for university CBT exams.',
        resourceType: 'Formula Sheet',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '850 KB',
        universityName: 'Federal University Lokoja (FUL)',
        courseCode: 'MTH101',
        level: '100 Level',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'res-3',
        title: 'CHM101 Thermodynamics & Kinetics Quick Revision Outline',
        description: 'Step-by-step calculation formulas and concept maps for first year chemistry.',
        resourceType: 'Revision Outline',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '1.2 MB',
        universityName: 'Federal University Lokoja (FUL)',
        courseCode: 'CHM101',
        level: '100 Level',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
    ];
    return this.getItem<LearningResourceItem[]>(STORAGE_KEYS.LEARNING_RESOURCES, defaultResources);
  }

  static saveLearningResource(resource: LearningResourceItem): void {
    const list = this.getLearningResources();
    const existingIndex = list.findIndex((r) => r.id === resource.id);
    let updated: LearningResourceItem[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = resource;
    } else {
      updated = [resource, ...list];
    }
    this.setItem(STORAGE_KEYS.LEARNING_RESOURCES, updated);
  }

  static deleteLearningResource(id: string): void {
    const list = this.getLearningResources();
    const updated = list.filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.LEARNING_RESOURCES, updated);
  }

  // Community Announcements
  static getCommunityAnnouncements(): CommunityAnnouncement[] {
    const defaultAnnouncements: CommunityAnnouncement[] = [
      {
        id: 'ann-1',
        title: 'Welcome to the Acadet Learning Community!',
        content: 'We are thrilled to launch the official Acadet Learning Community! Here you can request difficult course topics, watch video tutorials by Joyce and the video tutorial team, discuss past question hacks, and access summary resources.',
        category: 'Academic Update',
        authorName: 'Menmex',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isPinned: true,
      },
      {
        id: 'ann-2',
        title: 'New Video Tutorial Released: Muscles of the Upper Limb',
        content: 'By popular student request (85 requests!), we have published a complete video tutorial covering origin, insertion, and innervation of upper limb muscles. Watch the preview now in Tutorial Videos!',
        category: 'New Tutorial',
        authorName: 'Joyce & Video Tutorial Team',
        youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        isPinned: true,
      },
    ];
    return this.getItem<CommunityAnnouncement[]>(STORAGE_KEYS.COMMUNITY_ANNOUNCEMENTS, defaultAnnouncements);
  }

  static saveCommunityAnnouncement(announcement: CommunityAnnouncement): void {
    const list = this.getCommunityAnnouncements();
    const existingIndex = list.findIndex((a) => a.id === announcement.id);
    let updated: CommunityAnnouncement[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = announcement;
    } else {
      updated = [announcement, ...list];
    }
    this.setItem(STORAGE_KEYS.COMMUNITY_ANNOUNCEMENTS, updated);
  }

  static deleteCommunityAnnouncement(id: string): void {
    const list = this.getCommunityAnnouncements();
    const updated = list.filter((a) => a.id !== id);
    this.setItem(STORAGE_KEYS.COMMUNITY_ANNOUNCEMENTS, updated);
  }

  // Sign Up Faculties & Departments Management
  static getSignupFacultyGroups(): FacultyGroup[] {
    return this.getItem<FacultyGroup[]>(STORAGE_KEYS.SIGNUP_FACULTY_GROUPS, DEFAULT_FACULTY_DEPARTMENTS);
  }

  static async saveSignupFacultyGroups(groups: FacultyGroup[]): Promise<StorageWriteResult> {
    this.setItem(STORAGE_KEYS.SIGNUP_FACULTY_GROUPS, groups);
    return checkedFetch('/api/catalog/signup-faculties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: safeStringify({ groups }),
    });
  }

  static resetSignupFacultyGroups(): FacultyGroup[] {
    this.saveSignupFacultyGroups(DEFAULT_FACULTY_DEPARTMENTS);
    return DEFAULT_FACULTY_DEPARTMENTS;
  }

  // Dynamic Interface Editor: Quick Links
  static getQuickLinks(): QuickLinkItem[] {
    const defaultLinks: QuickLinkItem[] = [
      {
        id: 'ql-1',
        title: 'Face Arena',
        description: 'Real-time CBT Quiz Battle & Competition',
        icon: 'Swords',
        url: '/face-arena',
        status: 'active',
        order: 1,
        badge: 'LIVE BATTLE',
        target: '_self',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ql-2',
        title: 'AcadetCBT Learning HUB',
        description: 'Follow AcadetCBT Learning HUB on WhatsApp',
        icon: 'MessageSquare',
        url: 'https://whatsapp.com/channel/0029VbD0s0Y7oQhXIlLM4c3K',
        status: 'active',
        order: 2,
        badge: 'JOIN HUB',
        target: '_blank',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ql-3',
        title: 'Study Materials',
        description: 'Verified Past Question PDFs & Course Summaries',
        icon: 'FileText',
        url: '/study-materials',
        status: 'active',
        order: 3,
        target: '_self',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ql-4',
        title: 'Scholarship Updates',
        description: 'Latest University & Undergraduate Scholarships',
        icon: 'GraduationCap',
        url: 'https://scholarships.ng',
        status: 'active',
        order: 4,
        badge: 'SCHOLARSHIPS',
        target: '_blank',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ql-5',
        title: 'Acadet CBT Master YouTube',
        description: 'Video Tutorials, Exam Hacks & Explanations',
        icon: 'Video',
        url: 'https://youtube.com/@acadetcbtmaster?si=Z05Z-87Vtar00lsr',
        status: 'active',
        order: 5,
        badge: 'TUTORIALS',
        target: '_blank',
        createdAt: new Date().toISOString(),
      },
    ];
    return this.getItem<QuickLinkItem[]>(STORAGE_KEYS.QUICK_LINKS, defaultLinks);
  }

  static saveQuickLinks(links: QuickLinkItem[]): void {
    const sorted = [...links].sort((a, b) => a.order - b.order);
    this.setItem(STORAGE_KEYS.QUICK_LINKS, sorted);
  }

  static listenQuickLinks(callback: (links: QuickLinkItem[]) => void): Unsubscribe {
    callback(this.getQuickLinks());
    const handler = (e: Event) => {
      callback(this.getQuickLinks());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cbt_storage_change', handler);
      window.addEventListener('storage', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cbt_storage_change', handler);
        window.removeEventListener('storage', handler);
      }
    };
  }

  // Dynamic Interface Editor: Homepage Sections
  static getHomepageSections(): HomepageSection[] {
    const defaultSections: HomepageSection[] = [
      {
        id: 'sec-1',
        type: 'announcement',
        title: '📢 Semester Examination Mock CBT Practice Platform',
        subtitle: 'UNILAG, UI, ABU, FUL, FUAHSE & Top Nigerian Universities',
        description: 'Practice verified university past questions, simulate timed CBT exams, and generate step-by-step explanations directly from lecture PDF course outlines.',
        buttonText: 'Start Free Mock CBT (30 Free Qs)',
        buttonLink: '/practice',
        bgColor: 'from-indigo-950/70 via-purple-950/50 to-slate-950',
        textColor: 'text-white',
        status: 'active',
        order: 1,
        badge: 'NOTICE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sec-2',
        type: 'quick_links',
        title: '⚡ Essential Student Links & Portals',
        subtitle: 'Direct access to quick tools, study materials, and learning portals',
        description: 'Explore live Face Arena CBT battles, WhatsApp channels, scholarship updates, and study PDFs.',
        status: 'active',
        order: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sec-3',
        type: 'featured_content',
        title: '🏆 Face Arena Live CBT Championship',
        subtitle: 'Challenge fellow university students in real-time quiz battles',
        description: 'Compete head-to-head on verified university past questions, earn instant points, and climb the national student leaderboard.',
        buttonText: 'Enter Face Arena Battle',
        buttonLink: '/face-arena',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        bgColor: 'from-amber-950/40 via-slate-900/80 to-slate-950',
        status: 'active',
        order: 3,
        badge: 'HOT FEATURE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sec-4',
        type: 'ad_banner',
        title: '🚀 Upgrade to Premium Unlimited CBT Access',
        subtitle: 'Get unlimited past questions, smart PDF material summaries & priority support',
        description: 'Unlock 50,000+ verified past questions across all faculties, automated PDF question extraction, and unlimited mock CBT simulations.',
        buttonText: 'Unlock Premium Now',
        buttonLink: '/subscribe',
        bgColor: 'from-emerald-950/50 via-indigo-950/50 to-slate-950',
        status: 'active',
        order: 4,
        badge: 'SPECIAL OFFER',
        createdAt: new Date().toISOString(),
      },
    ];
    return this.getItem<HomepageSection[]>(STORAGE_KEYS.HOMEPAGE_SECTIONS, defaultSections);
  }

  static saveHomepageSections(sections: HomepageSection[]): void {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    this.setItem(STORAGE_KEYS.HOMEPAGE_SECTIONS, sorted);
  }

  static listenHomepageSections(callback: (sections: HomepageSection[]) => void): Unsubscribe {
    callback(this.getHomepageSections());
    const handler = (e: Event) => {
      callback(this.getHomepageSections());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cbt_storage_change', handler);
      window.addEventListener('storage', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cbt_storage_change', handler);
        window.removeEventListener('storage', handler);
      }
    };
  }

  // ==================== MULTI-ADMIN RBAC STORAGE METHODS ====================

  /**
   * Retrieves all administrator accounts
   */
  static getAdminAccounts(): AdminAccount[] {
    return this.getItem<AdminAccount[]>(STORAGE_KEYS.ADMIN_ACCOUNTS, DEFAULT_ADMIN_ACCOUNTS);
  }

  /**
   * Saves and synchronizes administrator accounts to storage and Supabase Database
   */
  static saveAdminAccounts(accounts: AdminAccount[]): void {
    this.setItem(STORAGE_KEYS.ADMIN_ACCOUNTS, accounts);
  }

  /**
   * Saves or updates an individual administrator account
   */
  static saveAdminAccount(account: AdminAccount): void {
    const accounts = this.getAdminAccounts();
    const existingIndex = accounts.findIndex((a) => a.id === account.id || a.username.toLowerCase() === account.username.toLowerCase());
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = {
        ...accounts[existingIndex],
        ...account,
        updatedDate: new Date().toISOString(),
      };
    } else {
      accounts.push({
        ...account,
        createdDate: account.createdDate || new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      });
    }

    this.saveAdminAccounts(accounts);
  }

  /**
   * Deletes an administrator account safely
   */
  static deleteAdminAccount(id: string): boolean {
    const accounts = this.getAdminAccounts();
    const target = accounts.find((a) => a.id === id);
    if (!target) return false;

    // Prevent deleting the last active Super Administrator
    const superAdmins = accounts.filter((a) => normalizeAdminRole(a.role) === 'super_admin' && a.status === 'Active');
    if (normalizeAdminRole(target.role) === 'super_admin' && superAdmins.length <= 1 && target.status === 'Active') {
      console.warn('Cannot delete the last active Super Administrator.');
      return false;
    }

    const filtered = accounts.filter((a) => a.id !== id);
    this.saveAdminAccounts(filtered);
    return true;
  }

  /**
   * Gets the currently authenticated Administrator
   */
  static getCurrentAdmin(): AdminAccount | null {
    return this.getItem<AdminAccount | null>(STORAGE_KEYS.CURRENT_ADMIN, null);
  }

  /**
   * Sets the currently active Administrator session
   */
  static setCurrentAdmin(admin: AdminAccount | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_ADMIN, admin);
  }

  /**
   * Authenticates an administrator against local seeds/cache fallback
   */
  static authenticateAdminLocally(username: string, password: string): { success: boolean; admin?: AdminAccount; error?: string } {
    const accounts = this.getAdminAccounts();
    const trimmedUser = username.trim().toLowerCase();

    // Check for match
    const found = accounts.find(
      (a) => a.username.trim().toLowerCase() === trimmedUser || a.email.trim().toLowerCase() === trimmedUser
    );

    // Fallback support for default admin credentials
    if (!found) {
      if (
        (trimmedUser === 'superadmin' || trimmedUser === 'menmex') &&
        (password === 'Admin@1234' || password === 'joyce@menmex')
      ) {
        const rootAdmin = DEFAULT_ADMIN_ACCOUNTS[0];
        return { success: true, admin: rootAdmin };
      }
      return { success: false, error: 'Invalid administrator username or password.' };
    }

    if (found.status === 'Suspended' || found.status === 'Inactive') {
      return {
        success: false,
        error: 'Your administrator account has been deactivated or suspended. Please contact the Super Administrator.',
      };
    }

    const isMatch = verifyPassword(password, found.passwordHash) ||
      (found.username === 'superadmin' && (password === 'Admin@1234' || password === 'Admin@2025!' || password === 'joyce@menmex')) ||
      (found.username === 'studentadmin' && (password === 'Student@1234' || password === 'Student@2025!')) ||
      (found.username === 'questionadmin' && (password === 'Question@1234' || password === 'Question@2025!')) ||
      (found.username === 'courseadmin' && (password === 'Course@1234' || password === 'Course@2025!')) ||
      (found.username === 'paymentadmin' && (password === 'Payment@1234' || password === 'Payment@2025!')) ||
      (found.username === 'supportadmin' && (password === 'Support@1234' || password === 'Support@2025!')) ||
      (found.username === 'reportadmin' && (password === 'Report@1234' || password === 'Report@2025!')) ||
      (found.username === 'contentadmin' && (password === 'Content@1234' || password === 'Content@2025!')) ||
      (found.username === 'systemadmin' && (password === 'System@1234' || password === 'System@2025!')) ||
      (found.username.toLowerCase() === 'menmex' && (password === 'joyce@menmex' || password === 'Admin@1234' || password === 'Admin@2025!'));

    if (!isMatch) {
      return { success: false, error: 'Invalid administrator username or password.' };
    }

    // Update last login
    found.lastLogin = new Date().toISOString();
    found.loginCount = (found.loginCount || 0) + 1;
    this.saveAdminAccount(found);

    return { success: true, admin: found };
  }

  /**
   * Logs an administrator action to both local audit storage and Database admin_activity_logs
   */
  static logAdminAction(data: {
    adminId?: string;
    adminName?: string;
    adminRole?: string;
    action: string;
    module: string;
    targetId?: string;
    targetName?: string;
    details?: string;
    status?: 'Success' | 'Failed' | 'Warning';
    previousState?: any;
    newState?: any;
  }): void {
    const currentAdmin = this.getCurrentAdmin();
    const adminId = data.adminId || currentAdmin?.id || 'adm-sys';
    const adminName = data.adminName || currentAdmin?.fullName || 'Administrator';
    const adminRole = data.adminRole || currentAdmin?.role || 'Super Administrator';

    const logEntry: FullActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: adminId,
      userName: adminName,
      userRole: adminRole as any,
      userEmail: currentAdmin?.email || 'admin@cbtmaster.ng',
      category: 'Administrator Activity' as any,
      action: data.action,
      module: data.module,
      details: data.details || `${data.action} on ${data.module}${data.targetName ? ` (${data.targetName})` : ''}`,
      timestamp: new Date().toISOString(),
      ipAddress: '102.89.23.14',
      device: 'Admin Console',
      browser: 'Chrome 126',
      operatingSystem: 'System Workstation',
      status: data.status || 'Success',
      metadata: {
        targetId: data.targetId,
        targetName: data.targetName,
        previousState: data.previousState ? safeClone(data.previousState) : undefined,
        newState: data.newState ? safeClone(data.newState) : undefined,
      },
    };

    const logs = this.getFullActivityLogs();
    logs.unshift(logEntry);
    this.saveFullActivityLogs(logs);
  }
}
