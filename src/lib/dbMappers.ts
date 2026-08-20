import type {
  Course,
  Department,
  Faculty,
  PaymentTransaction,
  Question,
  StudyMaterial,
  SubscriptionPlan,
  TestSessionResult,
  University,
  UserProfile,
} from '../types';
import type { AdminAccount } from '../utils/rbac';

export type DbRow = Record<string, any>;

/**
 * Deterministically converts any ID string (e.g. 'uni-ful', 'course-101', numeric string)
 * into a valid UUID v4-format string for Postgres UUID primary and foreign keys.
 * If input is already a valid UUID format, it preserves it exactly.
 */
export function toValidUuid(input: string | number | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  if (!str) return null;
  
  // Standard 8-4-4-4-12 hex UUID test
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str.toLowerCase();
  }

  // Fast, deterministic 128-bit hash
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x60bee2c9, h4 = 0x7b5d9e3b;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const fullHex = toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(13, 16)}-a${fullHex.slice(17, 20)}-${fullHex.slice(20, 32)}`.toLowerCase();
}

const value = (row: DbRow, snake: string, camel: string, fallback?: any): any =>
  row[snake] ?? row[camel] ?? fallback;

const dateValue = (row: DbRow, snake: string, camel: string, fallback = new Date().toISOString()): string =>
  String(value(row, snake, camel, fallback));

const stripEmptyTimestamps = (row: DbRow): DbRow => {
  const result = { ...row };
  if (result.created_at == null) delete result.created_at;
  if (result.updated_at == null) delete result.updated_at;
  if (result.completed_at == null) delete result.completed_at;
  if (result.upload_date == null) delete result.upload_date;
  return result;
};

export function questionToRow(q: Partial<Question> & { id: string }): DbRow {
  const rowId = toValidUuid(q.id) || q.id;
  return stripEmptyTimestamps({
    id: rowId,
    course_id: toValidUuid(q.courseId) ?? null,
    university_id: toValidUuid(q.universityId) ?? null,
    question_text: q.question ?? (q as any).question_text ?? '',
    option_a: q.optionA ?? (q as any).option_a ?? '',
    option_b: q.optionB ?? (q as any).option_b ?? '',
    option_c: q.optionC ?? (q as any).option_c ?? '',
    option_d: q.optionD ?? (q as any).option_d ?? '',
    correct_answer: q.correctAnswer ?? (q as any).correct_answer ?? 'A',
    explanation: q.explanation ?? (q as any).explanation ?? '',
    difficulty: q.difficulty ?? 'Medium',
    topic: q.topicName ?? (q as any).topic ?? '',
    category: (q as any).category ?? null,
    status: q.status ?? 'Published',
    level: q.level ?? null,
    semester: q.semester ?? null,
    session: q.session ?? null,
    source: q.source ?? 'Past Question',
    course_code: q.courseCode ?? (q as any).course_code ?? null,
    question_type: q.questionType ?? (q as any).question_type ?? 'MCQ',
    topic_id: toValidUuid(q.topicId) ?? null,
    topic_name: q.topicName ?? null,
    version_number: q.versionNumber ?? null,
    faculty_id: (q as any).facultyId ?? (q as any).faculty_id ?? null,
    created_by: q.createdBy ?? null,
    last_modified_by: q.lastModifiedBy ?? null,
    version_history: q.versionHistory ?? null,
    quality_score: q.qualityScore ?? null,
    issues_detected: q.issuesDetected ?? null,
    is_warning: q.isWarning ?? null,
    suggested_fix: q.suggestedFix ?? null,
    suggested_version: q.suggestedVersion ?? null,
    times_answered: q.timesAnswered ?? null,
    times_failed: q.timesFailed ?? null,
    average_success_rate: q.averageSuccessRate ?? null,
    created_at: q.createdDate ?? null,
    updated_at: q.updatedDate ?? null,
  });
}

export function questionFromRow(row: DbRow): Question {
  return {
    id: String(row.id),
    courseId: String(value(row, 'course_id', 'courseId', '')),
    universityId: String(value(row, 'university_id', 'universityId', '')),
    departmentId: value(row, 'department_id', 'departmentId'),
    question: String(value(row, 'question_text', 'question', value(row, 'question', 'question', ''))),
    optionA: String(value(row, 'option_a', 'optionA', '')),
    optionB: String(value(row, 'option_b', 'optionB', '')),
    optionC: String(value(row, 'option_c', 'optionC', '')),
    optionD: String(value(row, 'option_d', 'optionD', '')),
    correctAnswer: String(value(row, 'correct_answer', 'correctAnswer', 'A')),
    explanation: String(value(row, 'explanation', 'explanation', '')),
    topicName: String(value(row, 'topic_name', 'topicName', value(row, 'topic', 'topic', ''))),
    topicId: value(row, 'topic_id', 'topicId'),
    difficulty: value(row, 'difficulty', 'difficulty', 'Medium'),
    status: value(row, 'status', 'status', 'Published'),
    level: value(row, 'level', 'level'),
    semester: value(row, 'semester', 'semester'),
    session: value(row, 'session', 'session'),
    source: value(row, 'source', 'source', 'Past Question'),
    courseCode: value(row, 'course_code', 'courseCode'),
    questionType: value(row, 'question_type', 'questionType', 'MCQ'),
    createdBy: value(row, 'created_by', 'createdBy'),
    versionNumber: value(row, 'version_number', 'versionNumber'),
    diagramUrl: value(row, 'image_url', 'diagramUrl'),
    createdDate: dateValue(row, 'created_at', 'createdDate'),
    updatedDate: dateValue(row, 'updated_at', 'updatedDate'),
    facultyId: value(row, 'faculty_id', 'facultyId'),
    lastModifiedBy: value(row, 'last_modified_by', 'lastModifiedBy'),
    versionHistory: row.version_history ?? row.versionHistory,
    qualityScore: row.quality_score ?? row.qualityScore,
    issuesDetected: row.issues_detected ?? row.issuesDetected,
    isWarning: row.is_warning ?? row.isWarning,
    suggestedFix: row.suggested_fix ?? row.suggestedFix,
    suggestedVersion: row.suggested_version ?? row.suggestedVersion,
    timesAnswered: row.times_answered ?? row.timesAnswered,
    timesFailed: row.times_failed ?? row.timesFailed,
    averageSuccessRate: row.average_success_rate ?? row.averageSuccessRate,
  };
}

export function universityToRow(u: Partial<University> & { id: string }): DbRow {
  const rowId = toValidUuid(u.id) || u.id;
  return {
    id: rowId,
    name: u.name ?? '',
    code: u.abbreviation ?? (u as any).code ?? (u as any).shortName ?? '',
    logo_url: u.logoUrl ?? (u as any).logo_url ?? null,
    location: u.location ?? null,
    description: (u as any).description ?? null,
    website: (u as any).website ?? null,
    email: (u as any).email ?? null,
    phone: (u as any).phone ?? null,
  };
}

export function universityFromRow(row: DbRow): University {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    abbreviation: String(value(row, 'code', 'abbreviation', value(row, 'short_name', 'shortName', ''))),
    location: String(row.location ?? ''),
    logoUrl: value(row, 'logo_url', 'logoUrl'),
  };
}

export function facultyToRow(f: Partial<Faculty> & { id: string }): DbRow {
  return {
    id: toValidUuid(f.id) || f.id,
    university_id: toValidUuid(f.universityId) ?? null,
    name: f.name ?? '',
    description: (f as any).description ?? null,
  };
}

export function facultyFromRow(row: DbRow): Faculty {
  return {
    id: String(row.id),
    universityId: String(value(row, 'university_id', 'universityId', '')),
    name: String(row.name ?? ''),
  };
}

export function departmentToRow(d: Partial<Department> & { id: string }): DbRow {
  return {
    id: toValidUuid(d.id) || d.id,
    faculty_id: toValidUuid(d.facultyId) ?? null,
    university_id: toValidUuid((d as any).universityId) ?? null,
    code: (d as any).code ?? null,
    name: d.name ?? '',
    description: (d as any).description ?? null,
  };
}

export function departmentFromRow(row: DbRow): Department {
  return {
    id: String(row.id),
    facultyId: String(value(row, 'faculty_id', 'facultyId', '')),
    name: String(row.name ?? ''),
  };
}

export function courseToRow(c: Partial<Course> & { id: string }): DbRow {
  return {
    id: toValidUuid(c.id) || c.id,
    university_id: toValidUuid(c.universityId) ?? null,
    department_id: toValidUuid(c.departmentId) ?? null,
    code: c.code ?? '',
    title: c.title ?? '',
    level: c.level ?? null,
    credit_units: (c as any).creditUnits ?? (c as any).credit_units ?? null,
    description: (c as any).description ?? null,
    session: c.session ?? null,
    university_name: (c as any).universityName ?? (c as any).university_name ?? null,
    is_active: !(c as any).isDisabled,
  };
}

export function courseFromRow(row: DbRow): Course {
  return {
    id: String(row.id),
    code: String(row.code ?? ''),
    title: String(row.title ?? ''),
    universityId: value(row, 'university_id', 'universityId'),
    departmentId: String(value(row, 'department_id', 'departmentId', '')),
    level: value(row, 'level', 'level'),
    semester: value(row, 'semester', 'semester', 'First'),
    session: String(value(row, 'session', 'session', '')),
    universityName: row.university_name ?? row.universityName,
    isDisabled: row.is_active === undefined ? row.isDisabled : !row.is_active,
  };
}

export function materialToRow(m: Partial<StudyMaterial> & { id: string }): DbRow {
  return {
    id: toValidUuid(m.id) || m.id,
    course_id: toValidUuid(m.courseId) ?? null,
    university_id: toValidUuid(m.universityId) ?? null,
    title: m.title ?? '',
    level: m.level ?? null,
    semester: m.semester ?? null,
    course_code: m.courseCode ?? (m as any).course_code ?? null,
    course_title: m.courseTitle ?? (m as any).course_title ?? null,
    university_name: m.universityName ?? (m as any).university_name ?? null,
    file_url: m.fileUrl ?? m.videoUrl ?? (m as any).file_url ?? '',
    material_type: m.type ?? (m as any).material_type ?? 'PDF',
    content: (m as any).content ?? null,
    access_level: m.accessLevel ?? (m as any).access_level ?? null,
    file_size: m.fileSize ?? (m as any).file_size ?? null,
    total_downloads: m.totalDownloads ?? (m as any).total_downloads ?? 0,
    uploaded_by: m.uploadedBy ?? (m as any).uploaded_by ?? null,
    upload_date: m.uploadDate ?? (m as any).upload_date ?? null,
    status: m.status ?? null,
    video_url: m.videoUrl ?? (m as any).video_url ?? null,
    description: m.description ?? null,
    topic: m.topic ?? null,
    tags: m.tags ?? null,
    thumbnail_url: m.thumbnailUrl ?? (m as any).thumbnail_url ?? null,
    pages_count: m.pagesCount ?? (m as any).pages_count ?? null,
  };
}

export function materialFromRow(row: DbRow): StudyMaterial {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    universityId: String(value(row, 'university_id', 'universityId', '')),
    courseId: String(value(row, 'course_id', 'courseId', '')),
    type: value(row, 'material_type', 'type', value(row, 'file_type', 'fileType', 'PDF')),
    accessLevel: value(row, 'access_level', 'accessLevel', 'Free Trial'),
    totalDownloads: Number(value(row, 'total_downloads', 'totalDownloads', 0)),
    uploadedBy: value(row, 'uploaded_by', 'uploadedBy', ''),
    uploadDate: dateValue(row, 'upload_date', 'uploadDate'),
    status: value(row, 'status', 'status', 'Active'),
    fileUrl: value(row, 'file_url', 'fileUrl'),
    description: row.description ?? '',
    level: value(row, 'level', 'level'),
    semester: value(row, 'semester', 'semester'),
    courseCode: value(row, 'course_code', 'courseCode'),
    courseTitle: value(row, 'course_title', 'courseTitle'),
    universityName: value(row, 'university_name', 'universityName'),
    videoUrl: value(row, 'video_url', 'videoUrl'),
    topic: value(row, 'topic', 'topic'),
    tags: row.tags ?? row.tags,
    thumbnailUrl: value(row, 'thumbnail_url', 'thumbnailUrl'),
    pagesCount: row.pages_count ?? row.pagesCount,
  };
}

export function planToRow(p: Partial<SubscriptionPlan> & { id: string }): DbRow {
  return {
    id: toValidUuid(p.id) || p.id,
    name: p.name ?? '',
    price: Number(p.price ?? 0),
    duration_days: Number(p.durationDays ?? (p as any).duration_days ?? 30),
    description: (p as any).description ?? null,
    features: p.features ?? [],
    is_active: p.active ?? (p.status ? p.status === 'Active' : true),
  };
}

export function planFromRow(row: DbRow): SubscriptionPlan {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    price: Number(row.price ?? 0),
    durationDays: Number(value(row, 'duration_days', 'durationDays', 30)),
    features: row.features ?? [],
    active: Boolean(value(row, 'is_active', 'active', true)),
    status: value(row, 'is_active', 'active', true) ? 'Active' : 'Disabled',
    createdAt: value(row, 'created_at', 'createdAt'),
  };
}

export function userToRow(u: Partial<UserProfile> & { id: string }): DbRow {
  return {
    id: toValidUuid(u.id) || u.id,
    full_name: u.name ?? (u as any).fullName ?? (u as any).full_name ?? 'Student',
    username: u.username ?? '',
    email: u.email ?? '',
    phone: u.phone ?? null,
    avatar_url: u.avatarUrl ?? (u as any).avatar_url ?? null,
    photo_url: u.photoUrl ?? (u as any).photo_url ?? null,
    profile_picture_url: (u as any).profilePictureUrl ?? (u as any).profile_picture_url ?? u.avatarUrl ?? null,
    auth_provider: u.authProvider ?? (u as any).auth_provider ?? null,
    google_user_id: u.googleUserId ?? (u as any).google_user_id ?? null,
    role: u.role ?? 'student',
    university_id: toValidUuid(u.universityId) ?? null,
    department_id: toValidUuid(u.departmentId) ?? null,
    level: (u as any).level ?? null,
    subscription_status: u.subscriptionStatus ?? (u.subscription?.isPremium ? 'Active' : 'Free'),
    subscription_plan: u.subscriptionPlan ?? u.subscription?.plan ?? 'Free Tier',
    subscription_start_date: u.subscription?.startDate ?? null,
    subscription_expiry_date: u.subscription?.expiryDate ?? null,
    seen_question_ids: u.seenQuestionIds ?? [],
    purchased_material_ids: u.purchasedMaterialIds ?? [],
    streak_history: u.streakHistory ?? [],
    is_restricted: u.isRestricted ?? false,
    is_banned: u.isBanned ?? false,
    ban_reason: u.banReason ?? null,
    is_deleted: u.isDeleted ?? false,
    deleted_at: u.deletedAt ?? null,
    referred_by: (u as any).referredBy ?? null,
    total_referrals: (u as any).totalReferrals ?? 0,
    is_active: true,
  };
}

export function userFromRow(row: DbRow): UserProfile {
  return {
    id: String(row.id),
    name: String(value(row, 'full_name', 'fullName', 'Student')),
    username: row.username ?? '',
    email: String(row.email ?? ''),
    phone: row.phone ?? '',
    avatarUrl: row.avatar_url ?? row.avatarUrl,
    photoUrl: row.photo_url ?? row.photoUrl,
    authProvider: row.auth_provider ?? row.authProvider,
    googleUserId: row.google_user_id ?? row.googleUserId,
    role: row.role ?? 'student',
    universityId: String(value(row, 'university_id', 'universityId', '')),
    universityName: row.university_name ?? row.universityName ?? '',
    departmentId: String(value(row, 'department_id', 'departmentId', '')),
    departmentName: row.department_name ?? row.departmentName ?? '',
    subscription: {
      isPremium: row.subscription_status === 'Active' || row.subscription_status === 'Premium',
      plan: row.subscription_plan || 'Free Tier',
      startDate: row.subscription_start_date || undefined,
      expiryDate: row.subscription_expiry_date || undefined,
      questionsAttemptedCount: Number(value(row, 'total_questions_attempted', 'questionsAttemptedCount', 0)),
      freeLimit: 20,
    },
    subscriptionPlan: row.subscription_plan ?? row.subscriptionPlan,
    subscriptionStatus: row.subscription_status ?? row.subscriptionStatus,
    bookmarks: [],
    seenQuestionIds: row.seen_question_ids ?? row.seenQuestionIds ?? [],
    purchasedMaterialIds: row.purchased_material_ids ?? row.purchasedMaterialIds ?? [],
    createdDate: dateValue(row, 'created_at', 'createdDate'),
    streakCount: Number(value(row, 'total_questions_attempted', 'streakCount', 0)),
    lastPracticeDate: row.last_practice_date ?? row.lastPracticeDate,
    streakHistory: row.streak_history ?? row.streakHistory ?? [],
    isRestricted: row.is_restricted ?? row.isRestricted,
    isBanned: row.is_banned ?? row.isBanned,
    banReason: row.ban_reason ?? row.banReason,
    isDeleted: row.is_deleted ?? row.isDeleted,
    deletedAt: row.deleted_at ?? row.deletedAt,
    referredBy: row.referred_by ?? row.referredBy,
  };
}

export function resultToRow(r: Partial<TestSessionResult> & { id: string }): DbRow {
  return stripEmptyTimestamps({
    id: toValidUuid(r.id) || r.id,
    type: (r as any).type ?? null,
    user_id: toValidUuid((r as any).userId) ?? null,
    course_id: toValidUuid(r.courseId) ?? null,
    university_id: toValidUuid((r as any).universityId) ?? null,
    score: Number(r.score ?? 0),
    total_questions: Number(r.totalQuestions ?? 0),
    correct_answers: Number(r.score ?? 0),
    wrong_answers: Math.max(0, Number(r.totalQuestions ?? 0) - Number(r.score ?? 0)),
    percentage: Number(r.percentage ?? 0),
    time_spent_seconds: Number(r.timeSpentSeconds ?? 0),
    status: (r as any).status ?? 'Completed',
    course_code: (r as any).courseCode ?? null,
    course_title: (r as any).courseTitle ?? null,
    university_name: (r as any).universityName ?? null,
    question_ids: (r as any).questionIds ?? [],
    marked_for_review: (r as any).markedForReview ?? [],
    time_limit_minutes: (r as any).timeLimitMinutes ?? null,
  });
}

export function resultFromRow(row: DbRow): TestSessionResult {
  return {
    id: String(row.id),
    type: String(row.type ?? '') as TestSessionResult['type'],
    courseId: String(value(row, 'course_id', 'courseId', '')),
    courseCode: String(value(row, 'course_code', 'courseCode', '')),
    courseTitle: String(value(row, 'course_title', 'courseTitle', '')),
    universityName: String(value(row, 'university_name', 'universityName', '')),
    score: Number(row.score ?? 0),
    totalQuestions: Number(value(row, 'total_questions', 'totalQuestions', 0)),
    percentage: Number(row.percentage ?? 0),
    timeSpentSeconds: Number(value(row, 'time_spent_seconds', 'timeSpentSeconds', 0)),
    date: dateValue(row, 'created_at', 'date'),
    userAnswers: {},
    questionIds: row.question_ids ?? row.questionIds ?? [],
    markedForReview: row.marked_for_review ?? row.markedForReview ?? [],
    timeLimitMinutes: row.time_limit_minutes ?? row.timeLimitMinutes,
  };
}

export function paymentToRow(p: Partial<PaymentTransaction> & { id: string }): DbRow {
  return stripEmptyTimestamps({
    id: toValidUuid(p.id || p.reference) || p.id,
    transaction_ref: p.reference ?? (p as any).transaction_ref ?? '',
    user_id: toValidUuid(p.userId) ?? null,
    email: p.userEmail ?? (p as any).email ?? '',
    user_name: (p as any).userName ?? (p as any).user_name ?? '',
    plan: (p as any).plan ?? p.planName ?? (p as any).plan_name ?? (p as any).planId ?? 'General Access',
    plan_id: (p as any).planId ?? (p as any).plan_id ?? null,
    plan_name: (p as any).planName ?? (p as any).plan_name ?? (p as any).plan ?? 'General Access',
    amount: Number(p.amount ?? 0),
    status: p.status ?? 'pending',
    provider: p.gateway ?? (p as any).provider ?? 'squad',
    payment_method: (p as any).paymentMethod ?? (p as any).payment_method ?? 'card',
    duration_days: Number((p as any).durationDays ?? (p as any).duration_days ?? 30),
    expiry_date: (p as any).expiryDate ?? (p as any).expiry_date ?? null,
    notes: (p as any).notes ?? null,
  });
}

export function paymentFromRow(row: DbRow): PaymentTransaction {
  return {
    id: String(row.id),
    userId: String(value(row, 'user_id', 'userId', '')),
    userName: row.user_name ?? row.userName ?? '',
    userEmail: String(value(row, 'email', 'userEmail', value(row, 'user_email', 'userEmail', ''))),
    reference: String(value(row, 'transaction_ref', 'reference', value(row, 'reference', 'reference', ''))),
    planId: row.plan_id ?? row.planId,
    gateway: row.provider ?? row.gateway ?? 'Squad',
    amount: Number(row.amount ?? 0),
    planName: String(value(row, 'plan_name', 'planName', '')),
    date: dateValue(row, 'created_at', 'date'),
    status: row.status ?? 'Pending',
    paymentMethod: row.payment_method ?? row.paymentMethod,
    expiryDate: row.expiry_date ?? row.expiryDate,
    proofUrl: row.proof_url ?? row.proofUrl,
    handledByAdmin: row.handled_by_admin ?? row.handledByAdmin,
    rejectionReason: row.rejection_reason ?? row.rejectionReason,
    notes: row.notes ?? row.notes,
  };
}

export function adminToRow(a: {
  id: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  status?: string;
  passwordHash?: string;
  lastLogin?: string | null;
  loginCount?: number;
  avatarUrl?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
}): DbRow {
  return {
    id: a.id,
    full_name: a.fullName ?? (a as any).full_name ?? '',
    username: a.username ?? '',
    email: a.email ?? '',
    phone: a.phone ?? null,
    role: a.role ?? 'student_manager',
    status: a.status ?? 'Active',
    password_hash: a.passwordHash ?? (a as any).password_hash ?? '',
    last_login: a.lastLogin ?? null,
    login_count: a.loginCount ?? 0,
    avatar_url: a.avatarUrl ?? null,
    created_by: a.createdBy ?? null,
    created_date: a.createdDate ?? new Date().toISOString(),
    updated_date: a.updatedDate ?? new Date().toISOString(),
  };
}

export function adminFromRow(row: DbRow): AdminAccount {
  return {
    id: String(row.id),
    fullName: String(value(row, 'full_name', 'fullName', '')),
    username: String(row.username ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status ?? 'Active',
    passwordHash: row.password_hash ?? row.passwordHash,
    lastLogin: row.last_login ?? row.lastLogin,
    loginCount: Number(value(row, 'login_count', 'loginCount', 0)),
    avatarUrl: row.avatar_url ?? row.avatarUrl,
    createdBy: row.created_by ?? row.createdBy,
    createdDate: dateValue(row, 'created_date', 'createdDate', dateValue(row, 'created_at', 'createdDate')),
    updatedDate: row.updated_date ?? row.updatedDate ?? row.updated_at,
  };
}

export function systemConfigToRow(config: { key: string; data?: any; value?: any; id?: string }): DbRow {
  const cfgId = config.key || config.id || 'system_config';
  return {
    id: cfgId,
    config_data: config.data ?? config.value ?? {},
  };
}

export function systemConfigFromRow(row: DbRow): { key: string; data: any } {
  return {
    key: String(row.id ?? row.key),
    data: row.config_data ?? row.data ?? {},
  };
}

export const toRow = {
  question: questionToRow,
  university: universityToRow,
  faculty: facultyToRow,
  department: departmentToRow,
  course: courseToRow,
  material: materialToRow,
  plan: planToRow,
  user: userToRow,
  result: resultToRow,
  payment: paymentToRow,
  admin: adminToRow,
  systemConfig: systemConfigToRow,
};

export const fromRow = {
  question: questionFromRow,
  university: universityFromRow,
  faculty: facultyFromRow,
  department: departmentFromRow,
  course: courseFromRow,
  material: materialFromRow,
  plan: planFromRow,
  user: userFromRow,
  result: resultFromRow,
  payment: paymentFromRow,
  admin: adminFromRow,
  systemConfig: systemConfigFromRow,
};

