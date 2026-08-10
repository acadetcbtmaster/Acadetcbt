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
  ReferralLeaderboardConfig,
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

import { auth, db } from '../lib/firebase';
import { ensureReferralFields } from '../utils/referrals';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

// Global Protection Against Native JSON.stringify Circular Errors (e.g., Y2 -> Ka -> Y2 in minified SDKs)
if (typeof window !== 'undefined' && !(window as any).__cbt_json_patched) {
  (window as any).__cbt_json_patched = true;
  const origStringify = JSON.stringify;
  JSON.stringify = function (value: any, replacer?: any, space?: any) {
    try {
      return origStringify(value, replacer, space);
    } catch (err: any) {
      if (err && (err.message?.includes('circular') || String(err).includes('circular'))) {
        const seen = new WeakSet();
        const safeReplacer = (key: string, val: any) => {
          if (key === 'toJSON') return undefined;
          if (typeof val === 'function' || typeof val === 'symbol') return undefined;
          if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) return '[Circular]';
            try { seen.add(val); } catch {}
            let cName = '';
            try { cName = val?.constructor?.name || ''; } catch {}
            if (
              cName === 'Y2' ||
              cName === 'Ka' ||
              cName === 'UserImpl' ||
              cName === 'AuthImpl' ||
              cName === 'Firestore' ||
              (cName.length > 0 && cName.length <= 3 && cName !== 'Object' && cName !== 'Array' && cName !== 'Set' && cName !== 'Map' && cName !== 'Date')
            ) {
              return `[SDK Object: ${cName}]`;
            }
          }
          if (typeof replacer === 'function') {
            return replacer(key, val);
          }
          return val;
        };
        try {
          return origStringify(value, safeReplacer, space);
        } catch {
          return '{}';
        }
      }
      throw err;
    }
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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
        cName.includes('Firestore') ||
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

    // 1. Minified Firebase Auth / Firestore SDK internal circular objects (Y2, Ka, etc.)
    let isCircularSdkObject = !isPlain;
    try {
      if (
        cName === 'Y2' ||
        cName === 'Ka' ||
        cName === 'UserImpl' ||
        cName === 'AuthImpl' ||
        cName === 'Firestore' ||
        cName === 'DocumentReference' ||
        cName === 'QuerySnapshot' ||
        cName.includes('Firebase') ||
        cName.includes('Auth') ||
        cName.includes('Firestore') ||
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
    if (typeof clean === 'string') {
      return clean;
    }
    const seenSet = new WeakSet();
    const result = JSON.stringify(
      clean,
      (key: string, value: any) => {
        if (key === 'toJSON') return undefined;
        if (typeof value === 'function' || typeof value === 'symbol') return undefined;
        if (typeof value === 'object' && value !== null) {
          if (seenSet.has(value)) {
            return '[Circular]';
          }
          let cName = '';
          try {
            cName = value?.constructor?.name || '';
          } catch {
            cName = '';
          }
          if (
            cName === 'Y2' ||
            cName === 'Ka' ||
            cName === 'UserImpl' ||
            cName === 'AuthImpl' ||
            cName === 'Firestore' ||
            (cName.length > 0 && cName.length <= 3 && cName !== 'Object' && cName !== 'Array' && cName !== 'Set' && cName !== 'Map' && cName !== 'Date')
          ) {
            return `[SDK Object: ${cName || 'Internal'}]`;
          }
          try {
            seenSet.add(value);
          } catch {
            // ignore
          }
        }
        return value;
      },
      indent
    );
    return result !== undefined ? result : 'null';
  } catch {
    try {
      const stripped = stripNonSerializable(obj);
      if (typeof stripped === 'string') return stripped;
      const seenSet = new WeakSet();
      const res = JSON.stringify(
        stripped,
        (key: string, value: any) => {
          if (key === 'toJSON') return undefined;
          if (typeof value === 'function' || typeof value === 'symbol') return undefined;
          if (typeof value === 'object' && value !== null) {
            if (seenSet.has(value)) return '[Circular]';
            try {
              seenSet.add(value);
            } catch {}
          }
          return value;
        },
        indent
      );
      return res !== undefined ? res : '{}';
    } catch {
      return '{}';
    }
  }
}

export function safeClone<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  try {
    const jsonStr = safeStringify(obj);
    if (jsonStr && jsonStr !== 'undefined' && jsonStr !== 'null') {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as T;
      }
    }
    return (Array.isArray(obj) ? [] : {}) as T;
  } catch {
    return (Array.isArray(obj) ? [] : {}) as T;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
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
  console.warn('Firestore Operation Notice: ', safeStringify(errInfo));
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
  REFERRAL_LEADERBOARD_CONFIG: 'cbt_referral_leaderboard_config',
  SIGNUP_FACULTY_GROUPS: 'cbt_signup_faculty_groups',
  FACE_ARENA_SETTINGS: 'cbt_face_arena_settings',
  FACE_ARENA_QUESTIONS: 'cbt_face_arena_questions',
  FACE_ARENA_PARTICIPANTS: 'cbt_face_arena_participants',
  FACE_ARENA_ARCHIVES: 'cbt_face_arena_archives',
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

const DEFAULT_USER: UserProfile = {
  id: 'usr-student-1',
  name: 'Alex Johnson',
  email: 'alex.student@unilag.edu.ng',
  role: 'student',
  universityId: 'uni-1',
  departmentId: 'dept-1',
  subscription: {
    isPremium: false,
    plan: '30-Question Free Tier',
    startDate: new Date().toISOString(),
    expiryDate: null,
    questionsAttemptedCount: 12,
    freeLimit: 30,
  },
  bookmarks: ['q-1', 'q-4'],
  createdDate: new Date().toISOString(),
  streakCount: 3,
  lastPracticeDate: new Date().toISOString().split('T')[0],
  streakHistory: [
    new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0],
  ],
};

const DEFAULT_SETTINGS: SystemSettings = {
  freeQuestionLimit: 30,
  allowAiGeneration: true,
  maintenanceMode: false,
  paystackPublicKey: 'pk_test_ai_cbt_sim_paystack_public_key',
  flutterwavePublicKey: 'FLWPUBK_TEST_ai_cbt_sim_flutterwave_key',
};

export class StorageService {
  private static isInitialized = false;
  private static unsubscribers: Unsubscribe[] = [];

  // Initialize live Firebase Cloud Firestore real-time listeners for questions, universities, courses, etc.
  static initRealtimeListeners(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Real-time Questions Listener
    try {
      const unsubQuestions = onSnapshot(
        collection(db, 'questions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const qs: Question[] = [];
            snapshot.forEach((docSnap) => {
              qs.push({ ...docSnap.data(), id: docSnap.id } as Question);
            });
            this.setItem(STORAGE_KEYS.QUESTIONS, qs);
          } else {
            // Seed Firestore with initial questions if collection is empty
            SEED_QUESTIONS.forEach((q) => {
              setDoc(doc(db, 'questions', q.id), safeClone(q), { merge: true }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `questions/${q.id}`)
              );
            });
            this.setItem(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'questions');
        }
      );
      this.unsubscribers.push(unsubQuestions);
    } catch (err) {
      console.warn('Failed to attach questions listener:', err);
    }

    // 2. Real-time Universities Listener
    try {
      const unsubUniversities = onSnapshot(
        collection(db, 'universities'),
        (snapshot) => {
          if (!snapshot.empty) {
            const unis: University[] = [];
            snapshot.forEach((docSnap) => {
              unis.push({ ...docSnap.data(), id: docSnap.id } as University);
            });
            this.setItem(STORAGE_KEYS.UNIVERSITIES, unis);
          } else {
            SEED_UNIVERSITIES.forEach((u) => {
              setDoc(doc(db, 'universities', u.id), safeClone(u), { merge: true }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `universities/${u.id}`)
              );
            });
            this.setItem(STORAGE_KEYS.UNIVERSITIES, SEED_UNIVERSITIES);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'universities');
        }
      );
      this.unsubscribers.push(unsubUniversities);
    } catch (err) {
      console.warn('Failed to attach universities listener:', err);
    }

    // 3. Real-time Courses Listener
    try {
      const unsubCourses = onSnapshot(
        collection(db, 'courses'),
        (snapshot) => {
          if (!snapshot.empty) {
            const crs: Course[] = [];
            snapshot.forEach((docSnap) => {
              crs.push({ ...docSnap.data(), id: docSnap.id } as Course);
            });
            this.setItem(STORAGE_KEYS.COURSES, crs);
          } else {
            SEED_COURSES.forEach((c) => {
              setDoc(doc(db, 'courses', c.id), safeClone(c), { merge: true }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `courses/${c.id}`)
              );
            });
            this.setItem(STORAGE_KEYS.COURSES, SEED_COURSES);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'courses');
        }
      );
      this.unsubscribers.push(unsubCourses);
    } catch (err) {
      console.warn('Failed to attach courses listener:', err);
    }

    // 4. Real-time Users Listener
    try {
      const unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          if (!snapshot.empty) {
            const usersList: UserProfile[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              usersList.push({
                id: docSnap.id,
                name: data.fullName || data.name || 'User',
                email: data.email || '',
                role: data.role || 'student',
                universityName: data.universityName || '',
                departmentName: data.departmentName || '',
                subscription: data.subscription,
                bookmarks: data.bookmarks || [],
                createdDate: data.createdDate || new Date().toISOString(),
                ...data,
              } as UserProfile);
            });
            this.setItem(STORAGE_KEYS.USERS, usersList);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      );
      this.unsubscribers.push(unsubUsers);
    } catch (err) {
      console.warn('Failed to attach users listener:', err);
    }

    // 5. Real-time Test Results Listener
    try {
      const unsubResults = onSnapshot(
        collection(db, 'results'),
        (snapshot) => {
          if (!snapshot.empty) {
            const resultsList: TestSessionResult[] = [];
            snapshot.forEach((docSnap) => {
              resultsList.push({ ...docSnap.data(), id: docSnap.id } as TestSessionResult);
            });
            this.setItem(STORAGE_KEYS.RESULTS, resultsList);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'results');
        }
      );
      this.unsubscribers.push(unsubResults);
    } catch (err) {
      console.warn('Failed to attach results listener:', err);
    }

    // 6. Real-time Study Materials Listener
    try {
      const unsubMaterials = onSnapshot(
        collection(db, 'materials'),
        (snapshot) => {
          if (!snapshot.empty) {
            const matList: StudyMaterial[] = [];
            snapshot.forEach((docSnap) => {
              matList.push({ ...docSnap.data(), id: docSnap.id } as StudyMaterial);
            });
            this.setItem(STORAGE_KEYS.MATERIALS, matList);
          } else {
            SEED_STUDY_MATERIALS.forEach((m) => {
              setDoc(doc(db, 'materials', m.id), safeClone(m), { merge: true }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `materials/${m.id}`)
              );
            });
            this.setItem(STORAGE_KEYS.MATERIALS, SEED_STUDY_MATERIALS);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'materials');
        }
      );
      this.unsubscribers.push(unsubMaterials);
    } catch (err) {
      console.warn('Failed to attach materials listener:', err);
    }

    // 7. Real-time Payment Transactions Listener
    try {
      const unsubTransactions = onSnapshot(
        collection(db, 'transactions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const txList: PaymentTransaction[] = [];
            snapshot.forEach((docSnap) => {
              txList.push({ ...docSnap.data(), id: docSnap.id } as PaymentTransaction);
            });
            this.setItem(STORAGE_KEYS.TRANSACTIONS, txList);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'transactions');
        }
      );
      this.unsubscribers.push(unsubTransactions);
    } catch (err) {
      console.warn('Failed to attach transactions listener:', err);
    }

    // 8. Real-time Notifications Listener
    try {
      const unsubNotifs = onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          if (!snapshot.empty) {
            const notifList: AppNotification[] = [];
            snapshot.forEach((docSnap) => {
              notifList.push({ ...docSnap.data(), id: docSnap.id } as AppNotification);
            });
            this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifList);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'notifications');
        }
      );
      this.unsubscribers.push(unsubNotifs);
    } catch (err) {
      console.warn('Failed to attach notifications listener:', err);
    }

    // 9. Real-time Ranking History Listener
    try {
      const unsubRanking = onSnapshot(
        collection(db, 'ranking_history'),
        (snapshot) => {
          if (!snapshot.empty) {
            const rhList: RankingHistoryRecord[] = [];
            snapshot.forEach((docSnap) => {
              rhList.push({ ...docSnap.data(), id: docSnap.id } as RankingHistoryRecord);
            });
            this.setItem(STORAGE_KEYS.RANKING_HISTORY, rhList);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'ranking_history');
        }
      );
      this.unsubscribers.push(unsubRanking);
    } catch (err) {
      console.warn('Failed to attach ranking history listener:', err);
    }

    // 10. Real-time Subscription Plans Listener
    try {
      const unsubPlans = onSnapshot(
        collection(db, 'plans'),
        (snapshot) => {
          if (!snapshot.empty) {
            const planList: SubscriptionPlan[] = [];
            snapshot.forEach((docSnap) => {
              planList.push({ ...docSnap.data(), id: docSnap.id } as SubscriptionPlan);
            });
            this.setItem(STORAGE_KEYS.PLANS, planList);
          } else {
            DEFAULT_PLANS.forEach((p) => {
              setDoc(doc(db, 'plans', p.id), safeClone(p), { merge: true }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `plans/${p.id}`)
              );
            });
            this.setItem(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'plans');
        }
      );
      this.unsubscribers.push(unsubPlans);
    } catch (err) {
      console.warn('Failed to attach plans listener:', err);
    }

    // 11. Real-time System Settings Listener
    try {
      const unsubSettings = onSnapshot(
        doc(db, 'system_configs', 'global_settings'),
        (docSnap) => {
          if (docSnap.exists()) {
            const payload = docSnap.data() as SystemSettingsPayload;
            this.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, payload);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'system_configs/global_settings');
        }
      );
      this.unsubscribers.push(unsubSettings);
    } catch (err) {
      console.warn('Failed to attach settings listener:', err);
    }

    // 12. Real-time Topic Requests Listener
    try {
      const unsubTopicRequests = onSnapshot(
        collection(db, 'topic_requests'),
        (snapshot) => {
          if (!snapshot.empty) {
            const reqs: TopicRequest[] = [];
            snapshot.forEach((docSnap) => {
              reqs.push({ ...docSnap.data(), id: docSnap.id } as TopicRequest);
            });
            this.setItem(STORAGE_KEYS.TOPIC_REQUESTS, reqs);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'topic_requests');
        }
      );
      this.unsubscribers.push(unsubTopicRequests);
    } catch (err) {
      console.warn('Failed to attach topic_requests listener:', err);
    }

    // 13. Real-time Tutorial Videos Listener
    try {
      const unsubTutorialVideos = onSnapshot(
        collection(db, 'tutorial_videos'),
        (snapshot) => {
          if (!snapshot.empty) {
            const vids: TutorialVideo[] = [];
            snapshot.forEach((docSnap) => {
              vids.push({ ...docSnap.data(), id: docSnap.id } as TutorialVideo);
            });
            this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, vids);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'tutorial_videos');
        }
      );
      this.unsubscribers.push(unsubTutorialVideos);
    } catch (err) {
      console.warn('Failed to attach tutorial_videos listener:', err);
    }

    // 14. Real-time Community Posts Listener
    try {
      const unsubPosts = onSnapshot(
        collection(db, 'community_posts'),
        (snapshot) => {
          if (!snapshot.empty) {
            const posts: CommunityDiscussionPost[] = [];
            snapshot.forEach((docSnap) => {
              posts.push({ ...docSnap.data(), id: docSnap.id } as CommunityDiscussionPost);
            });
            this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, posts);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'community_posts');
        }
      );
      this.unsubscribers.push(unsubPosts);
    } catch (err) {
      console.warn('Failed to attach community_posts listener:', err);
    }

    // 15. Real-time Topic Collection Config Listener
    try {
      const unsubTopicConfig = onSnapshot(
        doc(db, 'system_configs', 'topic_collection_status'),
        (docSnap) => {
          if (docSnap.exists()) {
            const cfg = docSnap.data() as TopicCollectionConfig;
            this.setItem(STORAGE_KEYS.TOPIC_COLLECTION_CONFIG, cfg);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'system_configs/topic_collection_status');
        }
      );
      this.unsubscribers.push(unsubTopicConfig);
    } catch (err) {
      console.warn('Failed to attach topic_collection_status listener:', err);
    }

    // 16. Real-time Referral Leaderboard Config Listener
    try {
      const unsubReferralLeaderboardConfig = onSnapshot(
        doc(db, 'system_configs', 'referral_leaderboard'),
        (docSnap) => {
          if (docSnap.exists()) {
            const cfg = docSnap.data() as ReferralLeaderboardConfig;
            this.setItem(STORAGE_KEYS.REFERRAL_LEADERBOARD_CONFIG, cfg);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'system_configs/referral_leaderboard');
        }
      );
      this.unsubscribers.push(unsubReferralLeaderboardConfig);
    } catch (err) {
      console.warn('Failed to attach referral_leaderboard listener:', err);
    }

    // 17. Real-time Face Arena Settings Listener
    try {
      const unsubFaceArenaSettings = onSnapshot(
        doc(db, 'system_configs', 'face_arena_settings'),
        (docSnap) => {
          if (docSnap.exists()) {
            this.setItem(STORAGE_KEYS.FACE_ARENA_SETTINGS, docSnap.data() as FaceArenaSettings);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'system_configs/face_arena_settings');
        }
      );
      this.unsubscribers.push(unsubFaceArenaSettings);
    } catch (err) {
      console.warn('Failed to attach face_arena_settings listener:', err);
    }

    // 18. Real-time Face Arena Questions Listener
    try {
      const unsubFaceArenaQuestions = onSnapshot(
        collection(db, 'face_arena_questions'),
        (snapshot) => {
          const list: FaceArenaQuestion[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as FaceArenaQuestion);
          });
          if (list.length > 0) {
            this.setItem(STORAGE_KEYS.FACE_ARENA_QUESTIONS, list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'face_arena_questions');
        }
      );
      this.unsubscribers.push(unsubFaceArenaQuestions);
    } catch (err) {
      console.warn('Failed to attach face_arena_questions listener:', err);
    }

    // 19. Real-time Face Arena Participants Listener
    try {
      const unsubFaceArenaParticipants = onSnapshot(
        collection(db, 'face_arena_participants'),
        (snapshot) => {
          const list: FaceArenaParticipant[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as FaceArenaParticipant);
          });
          this.setItem(STORAGE_KEYS.FACE_ARENA_PARTICIPANTS, list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'face_arena_participants');
        }
      );
      this.unsubscribers.push(unsubFaceArenaParticipants);
    } catch (err) {
      console.warn('Failed to attach face_arena_participants listener:', err);
    }

    // 20. Real-time Face Arena Archives Listener
    try {
      const unsubFaceArenaArchives = onSnapshot(
        collection(db, 'face_arena_archives'),
        (snapshot) => {
          const list: FaceArenaArchive[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as FaceArenaArchive);
          });
          this.setItem(STORAGE_KEYS.FACE_ARENA_ARCHIVES, list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'face_arena_archives');
        }
      );
      this.unsubscribers.push(unsubFaceArenaArchives);
    } catch (err) {
      console.warn('Failed to attach face_arena_archives listener:', err);
    }

    // 21. Real-time Admin Notifications Listener
    try {
      const unsubAdminNotifications = onSnapshot(
        collection(db, 'admin_notifications'),
        (snapshot) => {
          const list: AdminNotification[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AdminNotification);
          });
          if (list.length > 0) {
            this.setItem(STORAGE_KEYS.ADMIN_NOTIFICATIONS, list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'admin_notifications');
        }
      );
      this.unsubscribers.push(unsubAdminNotifications);
    } catch (err) {
      console.warn('Failed to attach admin_notifications listener:', err);
    }
  }

  private static getItem<T>(key: string, defaultValue: T): T {
    this.initRealtimeListeners();
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, safeStringify(value));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cbt_storage_change', { detail: { key, timestamp: Date.now() } }));
      }, 0);
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  // Helper to check and enforce subscription status (30-question limit for non-subscribed, unlimited for active premium)
  private static enforceSubscriptionExpiry(user: UserProfile): UserProfile {
    if (!user) return user;

    // Admins retain unrestricted access
    if (user.role === 'admin') {
      return {
        ...user,
        subscription: {
          isPremium: true,
          plan: user.subscription?.plan || 'Administrator Pass',
          startDate: user.subscription?.startDate || new Date().toISOString(),
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
      const lower = p.toLowerCase();
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
        },
      };
    }

    // Non-subscribed or expired accounts are placed on the 30-question free limit
    return {
      ...user,
      subscription: {
        isPremium: false,
        plan: sub?.plan === 'Cancelled' ? 'Cancelled (Free Tier)' : '30-Question Free Tier',
        startDate: sub?.startDate || new Date().toISOString(),
        expiryDate: sub?.expiryDate || null,
        questionsAttemptedCount: sub?.questionsAttemptedCount || 0,
        freeLimit: 30,
      },
    };
  }

  // User & Users
  static getUsers(): UserProfile[] {
    const rawUsers = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, [DEFAULT_USER]);
    let hasChanges = false;
    const updatedUsers = rawUsers.map((u) => {
      let checked = this.enforceSubscriptionExpiry(u);
      checked = ensureReferralFields(checked, rawUsers);
      if (checked !== u) hasChanges = true;
      return checked;
    });
    if (hasChanges) {
      this.setItem(STORAGE_KEYS.USERS, updatedUsers);
    }
    return updatedUsers;
  }

  static saveUsers(users: UserProfile[]): void {
    const previous = this.getUsers();
    this.setItem(STORAGE_KEYS.USERS, users);
    users.forEach((u) => {
      setDoc(doc(db, 'users', u.id), safeClone(u), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`)
      );
    });

    // Sync deletions to Firestore
    const newIds = new Set(users.map((u) => u.id));
    previous.forEach((pu) => {
      if (!newIds.has(pu.id)) {
        deleteDoc(doc(db, 'users', pu.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `users/${pu.id}`)
        );
      }
    });
  }

  static deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.saveUsers(users);

    const activeUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (activeUser && activeUser.id === userId) {
      this.clearUserSession();
    }

    deleteDoc(doc(db, 'users', userId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`)
    );
  }

  static getUser(): UserProfile | null {
    const rawUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!rawUser) return null;

    const users = this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
    const updatedRecord = users.find((u) => u.id === rawUser.id);
    const targetUser = updatedRecord || rawUser;

    let checked = this.enforceSubscriptionExpiry(targetUser);
    checked = ensureReferralFields(checked, users);
    if (safeStringify(checked) !== safeStringify(rawUser)) {
      this.setItem(STORAGE_KEYS.USER, checked);
    }
    return checked;
  }

  static clearUserSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  static saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const userWithReferral = ensureReferralFields(user, users);

    const activeSessionUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (!activeSessionUser || activeSessionUser.id === userWithReferral.id) {
      this.setItem(STORAGE_KEYS.USER, userWithReferral);
    }

    const idx = users.findIndex((u) => u.id === userWithReferral.id);
    if (idx >= 0) {
      users[idx] = userWithReferral;
    } else {
      users.unshift(userWithReferral);
    }
    this.setItem(STORAGE_KEYS.USERS, users);

    // Secure Firestore Sync
    try {
      if (userWithReferral && userWithReferral.id) {
        setDoc(
          doc(db, 'users', userWithReferral.id),
          safeClone({
            fullName: userWithReferral.name,
            username: userWithReferral.username || '',
            email: userWithReferral.email,
            phone: userWithReferral.phone || '',
            role: userWithReferral.role,
            universityName: userWithReferral.universityName || '',
            departmentName: userWithReferral.departmentName || '',
            subscription: userWithReferral.subscription,
            bookmarks: userWithReferral.bookmarks || [],
            createdDate: userWithReferral.createdDate,
            referralCode: userWithReferral.referralCode || '',
            successfulReferrals: userWithReferral.successfulReferrals ?? 0,
            referredBy: userWithReferral.referredBy || '',
            referredByCode: userWithReferral.referredByCode || '',
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${userWithReferral.id}`));
      }
    } catch (e) {
      console.warn('Firestore write user error:', e);
    }
  }

  // Questions
  static getQuestions(): Question[] {
    return this.getItem<Question[]>(STORAGE_KEYS.QUESTIONS, SEED_QUESTIONS);
  }

  static saveQuestions(questions: Question[]): void {
    const previous = this.getQuestions();
    this.setItem(STORAGE_KEYS.QUESTIONS, questions);

    // Sync upserts to Firestore
    questions.forEach((q) => {
      setDoc(doc(db, 'questions', q.id), safeClone(q), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `questions/${q.id}`)
      );
    });

    // Delete removed questions from Firestore
    const newIds = new Set(questions.map((q) => q.id));
    previous.forEach((pq) => {
      if (!newIds.has(pq.id)) {
        deleteDoc(doc(db, 'questions', pq.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `questions/${pq.id}`)
        );
      }
    });
  }

  static addQuestion(q: Question): void {
    const list = this.getQuestions();
    list.unshift(q);
    this.saveQuestions(list);
  }

  // Universities, Faculties, Depts, Courses, Topics
  static getUniversities(): University[] {
    const list = this.getItem<University[]>(STORAGE_KEYS.UNIVERSITIES, SEED_UNIVERSITIES);
    // Combine with SEED_UNIVERSITIES to ensure any new universities are included
    const existingIds = new Set(list.map((u) => u.id));
    const merged = [...list];
    SEED_UNIVERSITIES.forEach((seedUni) => {
      if (!existingIds.has(seedUni.id)) {
        merged.push(seedUni);
      }
    });
    // Sort alphabetically by university name
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }

  static saveUniversities(data: University[]): void {
    const previous = this.getUniversities();
    this.setItem(STORAGE_KEYS.UNIVERSITIES, data);

    // Sync upserts to Firestore
    data.forEach((u) => {
      setDoc(doc(db, 'universities', u.id), safeClone(u), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `universities/${u.id}`)
      );
    });

    // Delete removed universities from Firestore
    const newIds = new Set(data.map((u) => u.id));
    previous.forEach((pu) => {
      if (!newIds.has(pu.id)) {
        deleteDoc(doc(db, 'universities', pu.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `universities/${pu.id}`)
        );
      }
    });
  }

  static deleteUniversity(id: string): void {
    const remaining = this.getUniversities().filter((u) => u.id !== id);
    this.saveUniversities(remaining);
    deleteDoc(doc(db, 'universities', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `universities/${id}`)
    );
  }

  static getFaculties(): Faculty[] {
    return this.getItem<Faculty[]>(STORAGE_KEYS.FACULTIES, SEED_FACULTIES);
  }

  static saveFaculties(data: Faculty[]): void {
    this.setItem(STORAGE_KEYS.FACULTIES, data);
  }

  static getDepartments(): Department[] {
    return this.getItem<Department[]>(STORAGE_KEYS.DEPARTMENTS, SEED_DEPARTMENTS);
  }

  static saveDepartments(data: Department[]): void {
    this.setItem(STORAGE_KEYS.DEPARTMENTS, data);
  }

  static getCourses(): Course[] {
    return this.getItem<Course[]>(STORAGE_KEYS.COURSES, SEED_COURSES);
  }

  static saveCourses(data: Course[]): void {
    const previous = this.getCourses();
    this.setItem(STORAGE_KEYS.COURSES, data);

    // Sync upserts to Firestore
    data.forEach((c) => {
      setDoc(doc(db, 'courses', c.id), safeClone(c), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `courses/${c.id}`)
      );
    });

    // Delete removed courses from Firestore
    const newIds = new Set(data.map((c) => c.id));
    previous.forEach((pc) => {
      if (!newIds.has(pc.id)) {
        deleteDoc(doc(db, 'courses', pc.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `courses/${pc.id}`)
        );
      }
    });
  }

  static deleteCourse(id: string): void {
    const remaining = this.getCourses().filter((c) => c.id !== id);
    this.saveCourses(remaining);
    deleteDoc(doc(db, 'courses', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `courses/${id}`)
    );
  }

  static getTopics(): Topic[] {
    return this.getItem<Topic[]>(STORAGE_KEYS.TOPICS, SEED_TOPICS);
  }

  static saveTopics(data: Topic[]): void {
    this.setItem(STORAGE_KEYS.TOPICS, data);
  }

  // Test Results
  static getResults(): TestSessionResult[] {
    return this.getItem<TestSessionResult[]>(STORAGE_KEYS.RESULTS, []);
  }

  static getTestResults(): TestSessionResult[] {
    return this.getResults();
  }

  static saveResults(results: TestSessionResult[]): void {
    this.setItem(STORAGE_KEYS.RESULTS, results);
    results.forEach((res) => {
      setDoc(doc(db, 'results', res.id), safeClone(res), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `results/${res.id}`)
      );
    });
  }

  static saveTestResults(results: TestSessionResult[]): void {
    this.saveResults(results);
  }

  static saveResult(res: TestSessionResult): void {
    const list = this.getResults();
    list.unshift(res);
    this.saveResults(list);
  }

  // Plans & Transactions
  static getPlans(): SubscriptionPlan[] {
    return this.getItem<SubscriptionPlan[]>(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
  }

  static getSubscriptionPlans(): SubscriptionPlan[] {
    return this.getPlans();
  }

  static savePlans(plans: SubscriptionPlan[]): void {
    this.setItem(STORAGE_KEYS.PLANS, plans);
    plans.forEach((p) => {
      const payload = safeClone({
        ...p,
        active: p.active !== false,
        updatedAt: new Date().toISOString(),
      });
      setDoc(doc(db, 'subscription_plans', p.id), payload, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `subscription_plans/${p.id}`)
      );
    });
  }

  static saveSubscriptionPlans(plans: SubscriptionPlan[]): void {
    this.savePlans(plans);
  }

  static deleteSubscriptionPlan(planId: string): void {
    const plans = this.getPlans().filter((p) => p.id !== planId);
    this.setItem(STORAGE_KEYS.PLANS, plans);
    deleteDoc(doc(db, 'subscription_plans', planId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `subscription_plans/${planId}`)
    );
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

  static saveTransactions(transactions: PaymentTransaction[]): void {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    transactions.forEach((tx) => {
      setDoc(doc(db, 'transactions', tx.id), safeClone(tx), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`)
      );
    });
  }

  static saveTransaction(tx: PaymentTransaction): void {
    const list = this.getTransactions();
    const idx = list.findIndex((t) => t.id === tx.id || (t.reference && t.reference === tx.reference));
    if (idx >= 0) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    this.saveTransactions(list);

    // Sync payments and subscriptions collections in Firestore
    try {
      const statusStr = String(tx.status || '').toLowerCase();
      const isSuccess = statusStr === 'successful' || statusStr === 'success';
      const isFailed = statusStr === 'failed';

      if (tx.reference) {
        setDoc(
          doc(db, 'payments', tx.reference),
          safeClone({
            paymentId: tx.paymentId || tx.id || tx.reference,
            userId: tx.userId,
            amount: tx.amount,
            reference: tx.reference,
            status: isSuccess ? 'success' : isFailed ? 'failed' : 'pending',
            createdAt: tx.date || new Date().toISOString(),
            verifiedAt: isSuccess ? (tx.paymentDate || new Date().toISOString()) : null,
          }),
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `payments/${tx.reference}`));
      }

      if (isSuccess && tx.userId) {
        setDoc(
          doc(db, 'subscriptions', tx.userId),
          safeClone({
            userId: tx.userId,
            plan: tx.planName,
            startDate: tx.paymentDate || new Date().toISOString(),
            expiryDate: tx.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString(),
            status: 'active',
          }),
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `subscriptions/${tx.userId}`));
      }
    } catch (e) {
      console.warn('Firestore payment/subscription write error:', e);
    }
  }

  static deleteTransaction(id: string): void {
    const list = this.getTransactions();
    const target = list.find((t) => t.id === id);
    const updated = list.filter((t) => t.id !== id);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
    deleteDoc(doc(db, 'transactions', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`)
    );
    if (target?.reference) {
      deleteDoc(doc(db, 'payments', target.reference)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `payments/${target.reference}`)
      );
    }
    // Trigger custom event for state sync across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbt_storage_change'));
    }
  }

  static deleteTransactions(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    const list = this.getTransactions();
    const updated = list.filter((t) => !ids.includes(t.id));
    this.setItem(STORAGE_KEYS.TRANSACTIONS, updated);
    ids.forEach((id) => {
      const target = list.find((t) => t.id === id);
      deleteDoc(doc(db, 'transactions', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`)
      );
      if (target?.reference) {
        deleteDoc(doc(db, 'payments', target.reference)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `payments/${target.reference}`)
        );
      }
    });
    // Trigger custom event for state sync across components
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
      setDoc(doc(db, 'ranking_history', r.id), safeClone(r), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `ranking_history/${r.id}`)
      );
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
      setDoc(doc(db, 'notifications', n.id), safeClone(n), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`)
      );
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
      setDoc(doc(db, 'activity_logs', l.id), safeClone(l), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `activity_logs/${l.id}`)
      );
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

  static saveMaterials(materials: StudyMaterial[]): void {
    const previous = this.getMaterials();
    this.setItem(STORAGE_KEYS.MATERIALS, materials);

    // Sync upserts to Firestore
    materials.forEach((m) => {
      setDoc(doc(db, 'materials', m.id), safeClone(m), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `materials/${m.id}`)
      );
    });

    // Delete removed materials from Firestore
    const newIds = new Set(materials.map((m) => m.id));
    previous.forEach((pm) => {
      if (!newIds.has(pm.id)) {
        deleteDoc(doc(db, 'materials', pm.id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `materials/${pm.id}`)
        );
      }
    });
  }

  // Face Arena Weekly Quiz Challenge Methods
  static getFaceArenaSettings(): FaceArenaSettings {
    return this.getItem<FaceArenaSettings>(STORAGE_KEYS.FACE_ARENA_SETTINGS, DEFAULT_FACE_ARENA_SETTINGS);
  }

  static saveFaceArenaSettings(settings: FaceArenaSettings): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_SETTINGS, settings);
    setDoc(doc(db, 'system_configs', 'face_arena_settings'), safeClone(settings), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/face_arena_settings')
    );
  }

  static getFaceArenaQuestions(): FaceArenaQuestion[] {
    return this.getItem<FaceArenaQuestion[]>(STORAGE_KEYS.FACE_ARENA_QUESTIONS, DEFAULT_FACE_ARENA_QUESTIONS);
  }

  static saveFaceArenaQuestions(questions: FaceArenaQuestion[]): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_QUESTIONS, questions);
    questions.forEach((q) => {
      setDoc(doc(db, 'face_arena_questions', q.id), safeClone(q), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `face_arena_questions/${q.id}`)
      );
    });
  }

  static deleteFaceArenaQuestion(id: string): void {
    const list = this.getFaceArenaQuestions().filter((q) => q.id !== id);
    this.setItem(STORAGE_KEYS.FACE_ARENA_QUESTIONS, list);
    deleteDoc(doc(db, 'face_arena_questions', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `face_arena_questions/${id}`)
    );
  }

  static getFaceArenaParticipants(): FaceArenaParticipant[] {
    return this.getItem<FaceArenaParticipant[]>(STORAGE_KEYS.FACE_ARENA_PARTICIPANTS, []);
  }

  static saveFaceArenaParticipants(participants: FaceArenaParticipant[]): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_PARTICIPANTS, participants);
    participants.forEach((p) => {
      setDoc(doc(db, 'face_arena_participants', p.id), safeClone(p), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `face_arena_participants/${p.id}`)
      );
    });
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
    setDoc(doc(db, 'face_arena_participants', participant.id), safeClone(participant), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `face_arena_participants/${participant.id}`)
    );
  }

  static getFaceArenaArchives(): FaceArenaArchive[] {
    return this.getItem<FaceArenaArchive[]>(STORAGE_KEYS.FACE_ARENA_ARCHIVES, []);
  }

  static saveFaceArenaArchives(archives: FaceArenaArchive[]): void {
    this.setItem(STORAGE_KEYS.FACE_ARENA_ARCHIVES, archives);
    archives.forEach((arc) => {
      setDoc(doc(db, 'face_arena_archives', arc.id), safeClone(arc), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `face_arena_archives/${arc.id}`)
      );
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

  static addMaterial(material: StudyMaterial): void {
    const list = this.getMaterials();
    list.unshift(material);
    this.saveMaterials(list);
  }

  static deleteMaterial(id: string): void {
    const list = this.getMaterials().filter((m) => m.id !== id);
    this.saveMaterials(list);
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
    notifs.forEach((n) => {
      setDoc(doc(db, 'admin_notifications', n.id), safeClone(n), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `admin_notifications/${n.id}`)
      );
    });
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
    reports.forEach((r) => {
      setDoc(doc(db, 'report_records', r.id), safeClone(r), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `report_records/${r.id}`)
      );
    });
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
      setDoc(doc(db, 'full_activity_logs', l.id), safeClone(l), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `full_activity_logs/${l.id}`)
      );
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
      setDoc(doc(db, 'active_sessions', s.sessionId), safeClone(s), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `active_sessions/${s.sessionId}`)
      );
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
    tickets.forEach((t) => {
      setDoc(doc(db, 'support_tickets', t.id), safeClone(t), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `support_tickets/${t.id}`)
      );
    });
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
        location: 'Cloud Firestore Primary Bucket (eu-west2)',
        verificationStatus: 'Verified',
        durationSeconds: 14,
        scope: ['Complete System Backup'],
        healthScore: 100,
        notes: 'Automated 02:00 AM daily platform snapshot. All Firestore collections passed integrity check.',
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
        location: 'Cloud Firestore Primary Bucket (eu-west2)',
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
      setDoc(doc(db, 'backups', b.id), safeClone(b), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `backups/${b.id}`)
      );
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
    setDoc(doc(db, 'system_configs', 'auto_backup'), safeClone(config), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/auto_backup')
    );
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
      setDoc(doc(db, 'restore_logs', l.id), safeClone(l), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `restore_logs/${l.id}`)
      );
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
          name: 'Firebase Firestore & Auth',
          serviceKey: 'FIREBASE_CORE',
          status: 'Connected',
          lastTested: new Date().toISOString(),
          details: 'Firestore Database & Firebase Authentication SDK v10.8 active.',
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
    setDoc(doc(db, 'system_configs', 'global_settings'), safeClone(payload), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/global_settings')
    );
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
    setDoc(doc(db, 'topic_requests', req.id), safeClone(req), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `topic_requests/${req.id}`)
    );
  }

  static updateTopicRequestStatus(id: string, status: TopicRequest['status']): void {
    const requests = this.getTopicRequests();
    const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
    this.setItem(STORAGE_KEYS.TOPIC_REQUESTS, updated);
    setDoc(doc(db, 'topic_requests', id), { status }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `topic_requests/${id}`)
    );
  }

  static deleteTopicRequest(id: string): void {
    const requests = this.getTopicRequests();
    const updated = requests.filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.TOPIC_REQUESTS, updated);
    deleteDoc(doc(db, 'topic_requests', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `topic_requests/${id}`)
    );
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
    setDoc(doc(db, 'system_configs', 'topic_collection_status'), safeClone(config), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/topic_collection_status')
    );
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
    setDoc(doc(db, 'tutorial_videos', video.id), safeClone(video), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `tutorial_videos/${video.id}`)
    );
  }

  static deleteTutorialVideo(id: string): void {
    const videos = this.getTutorialVideos();
    const updated = videos.filter((v) => v.id !== id);
    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
    deleteDoc(doc(db, 'tutorial_videos', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `tutorial_videos/${id}`)
    );
  }

  static incrementVideoViews(id: string): void {
    const videos = this.getTutorialVideos();
    const updated = videos.map((v) => (v.id === id ? { ...v, viewsCount: (v.viewsCount || 0) + 1 } : v));
    this.setItem(STORAGE_KEYS.TUTORIAL_VIDEOS, updated);
    const target = updated.find((v) => v.id === id);
    if (target) {
      setDoc(doc(db, 'tutorial_videos', id), safeClone(target), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `tutorial_videos/${id}`)
      );
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
        setDoc(doc(db, 'tutorial_videos', id), safeClone(updatedVid), { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `tutorial_videos/${id}`)
        );
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
        setDoc(doc(db, 'tutorial_videos', id), safeClone(updatedVid), { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `tutorial_videos/${id}`)
        );
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
    setDoc(doc(db, 'content_reports', reportObj.id), safeClone(reportObj)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `content_reports/${reportObj.id}`)
    );
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
    setDoc(doc(db, 'community_posts', post.id), safeClone(post), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `community_posts/${post.id}`)
    );
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
    setDoc(doc(db, 'community_posts', postId), { isReported: true, reportReason: reason, reportedBy: reporterId }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `community_posts/${postId}`)
    );
  }

  static deleteCommunityPost(postId: string): void {
    const posts = this.getCommunityPosts();
    const updated = posts.filter((p) => p.id !== postId);
    this.setItem(STORAGE_KEYS.COMMUNITY_POSTS, updated);
    deleteDoc(doc(db, 'community_posts', postId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `community_posts/${postId}`)
    );
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

    setDoc(doc(db, 'community_replies', reply.id), safeClone(reply), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `community_replies/${reply.id}`)
    );
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

  // Referral Leaderboard Config & Reset Methods
  static getReferralLeaderboardConfig(): ReferralLeaderboardConfig {
    const defaultConfig: ReferralLeaderboardConfig = {
      enabled: true,
      showOnHomepage: true,
      showOnDashboard: true,
      updatedAt: new Date().toISOString(),
    };
    return this.getItem<ReferralLeaderboardConfig>(STORAGE_KEYS.REFERRAL_LEADERBOARD_CONFIG, defaultConfig);
  }

  static saveReferralLeaderboardConfig(config: ReferralLeaderboardConfig): void {
    const updated = { ...config, updatedAt: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.REFERRAL_LEADERBOARD_CONFIG, updated);
    setDoc(doc(db, 'system_configs', 'referral_leaderboard'), safeClone(updated), { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/referral_leaderboard');
    });
  }

  static resetReferralRankings(): void {
    const allUsers = this.getUsers();
    const resetUsers = allUsers.map((u) => ({
      ...u,
      successfulReferrals: 0,
      completedReferrals: 0,
    }));

    this.setItem(STORAGE_KEYS.USERS, resetUsers);

    // Sync to Firestore for each user
    resetUsers.forEach((u) => {
      setDoc(doc(db, 'users', u.id), { successfulReferrals: 0, completedReferrals: 0 }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`);
      });
    });

    // Also reset current logged-in user if saved locally
    const currentUser = this.getItem<UserProfile | null>(STORAGE_KEYS.USER, null);
    if (currentUser) {
      this.setItem(STORAGE_KEYS.USER, {
        ...currentUser,
        successfulReferrals: 0,
        completedReferrals: 0,
      });
    }
  }

  // Sign Up Faculties & Departments Management
  static getSignupFacultyGroups(): FacultyGroup[] {
    return this.getItem<FacultyGroup[]>(STORAGE_KEYS.SIGNUP_FACULTY_GROUPS, DEFAULT_FACULTY_DEPARTMENTS);
  }

  static saveSignupFacultyGroups(groups: FacultyGroup[]): void {
    this.setItem(STORAGE_KEYS.SIGNUP_FACULTY_GROUPS, groups);
    setDoc(doc(db, 'system_configs', 'signup_faculties'), { groups: safeClone(groups) }, { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, 'system_configs/signup_faculties');
    });
  }

  static resetSignupFacultyGroups(): FacultyGroup[] {
    this.saveSignupFacultyGroups(DEFAULT_FACULTY_DEPARTMENTS);
    return DEFAULT_FACULTY_DEPARTMENTS;
  }
}


