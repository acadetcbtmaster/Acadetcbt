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
  return stripEmptyTimestamps({
    id: q.id,
    course_id: q.courseId ?? null,
    university_id: q.universityId ?? null,
    department_id: q.departmentId ?? null,
    year: (q as any).year ?? null,
    topic: q.topicName ?? (q as any).topicName ?? '',
    question: q.question ?? '',
    option_a: q.optionA ?? '',
    option_b: q.optionB ?? '',
    option_c: q.optionC ?? '',
    option_d: q.optionD ?? '',
    correct_answer: q.correctAnswer ?? '',
    explanation: q.explanation ?? '',
    image_url: q.diagramUrl ?? null,
    difficulty: q.difficulty ?? 'Medium',
    status: q.status ?? 'Published',
    level: q.level ?? null,
    semester: q.semester ?? null,
    session: q.session ?? null,
    source: q.source ?? null,
    course_code: q.courseCode ?? null,
    question_type: q.questionType ?? 'MCQ',
    topic_id: q.topicId ?? null,
    topic_name: q.topicName ?? null,
    faculty_id: q.facultyId ?? null,
    created_by: q.createdBy ?? null,
    last_modified_by: q.lastModifiedBy ?? null,
    version_number: q.versionNumber ?? null,
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
    question: String(value(row, 'question', 'question', '')),
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
  return {
    id: u.id,
    name: u.name ?? '',
    short_name: u.abbreviation ?? (u as any).shortName ?? '',
    logo_url: u.logoUrl ?? null,
    location: u.location ?? null,
    website: (u as any).website ?? null,
  };
}

export function universityFromRow(row: DbRow): University {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    abbreviation: String(value(row, 'short_name', 'shortName', row.code ?? '')),
    location: String(row.location ?? ''),
    logoUrl: value(row, 'logo_url', 'logoUrl'),
  };
}

export function facultyToRow(f: Partial<Faculty> & { id: string }): DbRow {
  return { id: f.id, university_id: f.universityId ?? null, name: f.name ?? '' };
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
    id: d.id,
    faculty_id: d.facultyId ?? null,
    university_id: (d as any).universityId ?? null,
    name: d.name ?? '',
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
    id: c.id,
    university_id: c.universityId ?? null,
    department_id: c.departmentId ?? null,
    code: c.code ?? '',
    title: c.title ?? '',
    level: c.level ?? null,
    semester: c.semester ?? null,
    description: (c as any).description ?? null,
    session: c.session ?? null,
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
    id: m.id,
    course_id: m.courseId ?? null,
    university_id: m.universityId ?? null,
    title: m.title ?? '',
    level: m.level ?? null,
    semester: m.semester ?? null,
    course_code: m.courseCode ?? null,
    course_title: m.courseTitle ?? null,
    university_name: m.universityName ?? null,
    file_url: m.fileUrl ?? m.videoUrl ?? '',
    file_type: m.type ?? 'PDF',
    access_level: m.accessLevel ?? null,
    file_size: m.fileSize ?? null,
    total_downloads: m.totalDownloads ?? 0,
    uploaded_by: m.uploadedBy ?? null,
    upload_date: m.uploadDate ?? null,
    status: m.status ?? null,
    video_url: m.videoUrl ?? null,
    description: m.description ?? null,
    topic: m.topic ?? null,
    tags: m.tags ?? null,
    thumbnail_url: m.thumbnailUrl ?? null,
    pages_count: m.pagesCount ?? null,
  };
}

export function materialFromRow(row: DbRow): StudyMaterial {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    universityId: String(value(row, 'university_id', 'universityId', '')),
    courseId: String(value(row, 'course_id', 'courseId', '')),
    type: value(row, 'file_type', 'fileType', 'PDF'),
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
    id: p.id,
    name: p.name ?? '',
    price: Number(p.price ?? 0),
    duration_days: Number(p.durationDays ?? 30),
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
    id: u.id,
    full_name: u.name ?? (u as any).fullName ?? 'Student',
    username: u.username ?? '',
    email: u.email ?? '',
    phone: u.phone ?? null,
    avatar_url: u.avatarUrl ?? null,
    photo_url: u.photoUrl ?? null,
    auth_provider: u.authProvider ?? null,
    google_user_id: u.googleUserId ?? null,
    role: u.role ?? 'student',
    university_id: u.universityId ?? null,
    university_name: u.universityName ?? '',
    department_id: u.departmentId ?? null,
    department_name: u.departmentName ?? '',
    subscription: u.subscription ?? { isPremium: false, plan: 'Free Tier' },
    subscription_plan: u.subscriptionPlan ?? null,
    subscription_status: u.subscriptionStatus ?? null,
    bookmarks: u.bookmarks ?? [],
    seen_question_ids: u.seenQuestionIds ?? [],
    purchased_material_ids: u.purchasedMaterialIds ?? [],
    streak_count: u.streakCount ?? 0,
    last_practice_date: u.lastPracticeDate ?? null,
    streak_history: u.streakHistory ?? [],
    is_restricted: u.isRestricted ?? false,
    is_banned: u.isBanned ?? false,
    ban_reason: u.banReason ?? null,
    is_deleted: u.isDeleted ?? false,
    deleted_at: u.deletedAt ?? null,
    referred_by: (u as any).referredBy ?? null,
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
    universityName: row.university_name ?? row.universityName,
    departmentId: String(value(row, 'department_id', 'departmentId', '')),
    departmentName: row.department_name ?? row.departmentName,
    subscription: row.subscription ?? { isPremium: false, plan: 'Free Tier' },
    subscriptionPlan: row.subscription_plan ?? row.subscriptionPlan,
    subscriptionStatus: row.subscription_status ?? row.subscriptionStatus,
    bookmarks: row.bookmarks ?? [],
    seenQuestionIds: row.seen_question_ids ?? row.seenQuestionIds,
    purchasedMaterialIds: row.purchased_material_ids ?? row.purchasedMaterialIds,
    createdDate: dateValue(row, 'created_at', 'createdDate'),
    streakCount: Number(value(row, 'streak_count', 'streakCount', 0)),
    lastPracticeDate: row.last_practice_date ?? row.lastPracticeDate,
    streakHistory: row.streak_history ?? row.streakHistory,
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
    id: r.id,
    type: (r as any).type ?? null,
    user_id: (r as any).userId ?? null,
    course_id: r.courseId ?? null,
    score: Number(r.score ?? 0),
    total_questions: Number(r.totalQuestions ?? 0),
    percentage: Number(r.percentage ?? 0),
    time_spent_seconds: Number(r.timeSpentSeconds ?? 0),
    answers: r.userAnswers ?? {},
    question_ids: (r as any).questionIds ?? [],
    marked_for_review: (r as any).markedForReview ?? [],
    time_limit_minutes: (r as any).timeLimitMinutes ?? null,
    course_code: (r as any).courseCode ?? null,
    course_title: (r as any).courseTitle ?? null,
    university_name: (r as any).universityName ?? null,
    completed_at: (r as any).date ?? null,
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
    date: dateValue(row, 'completed_at', 'date'),
    userAnswers: row.answers ?? {},
    questionIds: row.question_ids ?? row.questionIds ?? [],
    markedForReview: row.marked_for_review ?? row.markedForReview ?? [],
    timeLimitMinutes: row.time_limit_minutes ?? row.timeLimitMinutes,
  };
}

export function paymentToRow(p: Partial<PaymentTransaction> & { id: string }): DbRow {
  return stripEmptyTimestamps({
    id: p.id,
    reference: p.reference ?? '',
    user_id: p.userId ?? null,
    user_email: p.userEmail ?? '',
    amount: Number(p.amount ?? 0),
    gateway: p.gateway ?? 'squad',
    status: p.status ?? 'pending',
    plan_id: (p as any).planId ?? null,
    plan_name: (p as any).planName ?? null,
    user_name: (p as any).userName ?? null,
    payment_method: (p as any).paymentMethod ?? null,
    expiry_date: (p as any).expiryDate ?? null,
    proof_url: (p as any).proofUrl ?? null,
    handled_by_admin: (p as any).handledByAdmin ?? null,
    rejection_reason: (p as any).rejectionReason ?? null,
    notes: (p as any).notes ?? null,
    metadata: p.squadResponse ?? {},
  });
}

export function paymentFromRow(row: DbRow): PaymentTransaction {
  return {
    id: String(row.id),
    userId: String(value(row, 'user_id', 'userId', '')),
    userName: row.user_name ?? row.userName ?? '',
    userEmail: String(value(row, 'user_email', 'userEmail', '')),
    reference: String(row.reference ?? ''),
    planId: row.plan_id ?? row.planId,
    gateway: row.gateway ?? 'Squad',
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
    full_name: a.fullName ?? '',
    username: a.username ?? '',
    email: a.email ?? '',
    phone: a.phone ?? null,
    role: a.role ?? 'student_manager',
    status: a.status ?? 'Active',
    password_hash: a.passwordHash ?? '',
    last_login: a.lastLogin ?? null,
    login_count: a.loginCount ?? 0,
    avatar_url: a.avatarUrl ?? null,
    created_by: a.createdBy ?? null,
    created_at: a.createdDate ?? null,
    updated_at: a.updatedDate ?? null,
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
    createdDate: dateValue(row, 'created_at', 'createdDate'),
    updatedDate: row.updated_at ?? row.updatedDate,
  };
}

export function systemConfigToRow(config: { key: string; data: any }): DbRow {
  return { key: config.key, data: config.data };
}

export function systemConfigFromRow(row: DbRow): { key: string; data: any } {
  return { key: String(row.key ?? row.id), data: row.data };
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
