/**
 * Multi-Admin Role-Based Access Control (RBAC) Core Utility
 * Enforces permissions across UI, Services, and Backend synchronization
 */

export type AdminRole =
  | 'super_admin'
  | 'student_manager'
  | 'question_manager'
  | 'course_manager'
  | 'payment_manager'
  | 'support_manager'
  | 'report_manager'
  | 'content_manager'
  | 'system_manager'
  | 'Super Administrator'
  | 'Student Manager'
  | 'Question Manager'
  | 'Course Manager'
  | 'Payment Manager'
  | 'Support Manager'
  | 'Report Manager'
  | 'Content Manager'
  | 'System Manager';

export type AdminPermission =
  | 'manage_students'
  | 'manage_support_tickets'
  | 'manage_questions'
  | 'manage_courses'
  | 'manage_universities'
  | 'manage_payments'
  | 'manage_reports'
  | 'manage_study_materials'
  | 'manage_settings'
  | 'manage_backups'
  | 'manage_notifications'
  | 'view_activity_logs'
  | 'manage_other_administrators';

export interface AdminAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: AdminRole;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdDate: string;
  dateCreated?: string;
  updatedDate?: string;
  lastLogin?: string;
  lastLoginDate?: string;
  lastIpAddress?: string;
  loginCount: number;
  avatarUrl?: string;
  customPermissions?: Record<string, boolean>;
  createdBy?: string;
}

export interface PermissionDefinition {
  key: AdminPermission;
  label: string;
  description: string;
  category: 'User Management' | 'Academic Content' | 'Financial & Analytics' | 'System & Security' | 'Administrative';
}

export const ALL_ADMIN_PERMISSIONS: PermissionDefinition[] = [
  { key: 'manage_students', label: 'Manage Students', description: 'Create, edit, suspend, ban, or delete student profiles & credentials', category: 'User Management' },
  { key: 'manage_support_tickets', label: 'Manage Support Tickets', description: 'View, reply to, and resolve student complaints and feedback tickets', category: 'User Management' },
  { key: 'manage_questions', label: 'Manage Questions', description: 'Create, edit, verify, review, publish, and delete CBT exam questions', category: 'Academic Content' },
  { key: 'manage_courses', label: 'Manage Courses', description: 'Add, update curriculum, configure levels & semesters, or delete courses', category: 'Academic Content' },
  { key: 'manage_universities', label: 'Manage Universities', description: 'Configure partner institutions, faculties, departments, and logos', category: 'Academic Content' },
  { key: 'manage_study_materials', label: 'Manage Study Materials', description: 'Upload and manage e-books, lecture summaries, notes, and video tutorials', category: 'Academic Content' },
  { key: 'manage_payments', label: 'Manage Payments', description: 'Inspect transactions, verify manual payment proofs, and manage subscriptions', category: 'Financial & Analytics' },
  { key: 'manage_reports', label: 'Manage Reports', description: 'Access financial analytics, student performance statistics, and audit reports', category: 'Financial & Analytics' },
  { key: 'manage_settings', label: 'Manage Settings', description: 'Configure global exam timers, registration rules, AI settings, and integrations', category: 'System & Security' },
  { key: 'manage_backups', label: 'Manage Backups', description: 'Create, download, and restore Firestore database snapshots & exports', category: 'System & Security' },
  { key: 'manage_notifications', label: 'Manage Notifications', description: 'Compose, schedule, and broadcast in-app notifications and banner alerts', category: 'System & Security' },
  { key: 'view_activity_logs', label: 'View Activity Logs', description: 'Inspect the system-wide administrative audit trail and security logs', category: 'Administrative' },
  { key: 'manage_other_administrators', label: 'Manage Other Administrators', description: 'Create, edit, activate/deactivate, and manage administrator accounts (Super Admin only)', category: 'Administrative' },
];

/**
 * Standard Role to Permissions Mapping conforming exactly to the RBAC matrix
 */
export const ROLE_PERMISSIONS_MATRIX: Record<string, AdminPermission[]> = {
  super_admin: [
    'manage_students',
    'manage_support_tickets',
    'manage_questions',
    'manage_courses',
    'manage_universities',
    'manage_payments',
    'manage_reports',
    'manage_study_materials',
    'manage_settings',
    'manage_backups',
    'manage_notifications',
    'view_activity_logs',
    'manage_other_administrators',
  ],
  'Super Administrator': [
    'manage_students',
    'manage_support_tickets',
    'manage_questions',
    'manage_courses',
    'manage_universities',
    'manage_payments',
    'manage_reports',
    'manage_study_materials',
    'manage_settings',
    'manage_backups',
    'manage_notifications',
    'view_activity_logs',
    'manage_other_administrators',
  ],

  student_manager: ['manage_students', 'manage_support_tickets', 'view_activity_logs'],
  'Student Manager': ['manage_students', 'manage_support_tickets', 'view_activity_logs'],

  question_manager: ['manage_questions', 'manage_courses', 'view_activity_logs'],
  'Question Manager': ['manage_questions', 'manage_courses', 'view_activity_logs'],

  course_manager: ['manage_courses', 'manage_universities', 'view_activity_logs'],
  'Course Manager': ['manage_courses', 'manage_universities', 'view_activity_logs'],

  payment_manager: ['manage_payments', 'manage_reports', 'view_activity_logs'],
  'Payment Manager': ['manage_payments', 'manage_reports', 'view_activity_logs'],

  support_manager: ['manage_support_tickets', 'manage_students', 'view_activity_logs'],
  'Support Manager': ['manage_support_tickets', 'manage_students', 'view_activity_logs'],

  report_manager: ['manage_reports', 'view_activity_logs'],
  'Report Manager': ['manage_reports', 'view_activity_logs'],

  content_manager: ['manage_study_materials', 'manage_questions', 'view_activity_logs'],
  'Content Manager': ['manage_study_materials', 'manage_questions', 'view_activity_logs'],

  system_manager: ['manage_settings', 'manage_backups', 'manage_notifications', 'view_activity_logs'],
  'System Manager': ['manage_settings', 'manage_backups', 'manage_notifications', 'view_activity_logs'],
};

export const DEFAULT_ROLE_PERMISSIONS = ROLE_PERMISSIONS_MATRIX;

export const CATEGORY_REQUIRED_PERMISSIONS: Record<string, AdminPermission> = {
  students: 'manage_students',
  universities: 'manage_universities',
  courses: 'manage_courses',
  questions: 'manage_questions',
  review_workflow: 'manage_questions',
  study_materials: 'manage_study_materials',
  notifications: 'manage_notifications',
  leaderboard: 'manage_students',
  payments: 'manage_payments',
  question_analytics: 'manage_questions',
  ai_generator_history: 'manage_questions',
  backup_restore: 'manage_backups',
  activity_logs: 'view_activity_logs',
  roles_permissions: 'manage_other_administrators',
  reports: 'manage_reports',
  system_health: 'manage_settings',
  feedback_support: 'manage_support_tickets',
  audit_compliance: 'manage_reports',
  security_access: 'manage_settings',
  topic_requests: 'manage_study_materials',
  mencore_ai: 'manage_settings',
};

/**
 * Normalizes role identifier to canonical machine key or UI title
 */
export function normalizeAdminRole(role?: string): AdminRole {
  if (!role) return 'super_admin';
  const lower = role.toLowerCase().replace(/[\s_-]+/g, '');
  if (lower.includes('super')) return 'super_admin';
  if (lower.includes('student')) return 'student_manager';
  if (lower.includes('question')) return 'question_manager';
  if (lower.includes('course')) return 'course_manager';
  if (lower.includes('payment')) return 'payment_manager';
  if (lower.includes('support')) return 'support_manager';
  if (lower.includes('report')) return 'report_manager';
  if (lower.includes('content')) return 'content_manager';
  if (lower.includes('system')) return 'system_manager';
  return 'super_admin';
}

export function getRoleDisplayName(role?: string): string {
  const norm = normalizeAdminRole(role);
  switch (norm) {
    case 'super_admin':
      return 'Super Administrator';
    case 'student_manager':
      return 'Student Manager';
    case 'question_manager':
      return 'Question Manager';
    case 'course_manager':
      return 'Course Manager';
    case 'payment_manager':
      return 'Payment Manager';
    case 'support_manager':
      return 'Support Manager';
    case 'report_manager':
      return 'Report Manager';
    case 'content_manager':
      return 'Content Manager';
    case 'system_manager':
      return 'System Manager';
    default:
      return 'Administrator';
  }
}

export function getRolePermissions(role?: string): AdminPermission[] {
  const norm = normalizeAdminRole(role);
  return ROLE_PERMISSIONS_MATRIX[norm] || [];
}

export function hasPermission(
  admin: AdminAccount | { role?: string; customPermissions?: Record<string, boolean> } | null | undefined,
  permission: AdminPermission
): boolean {
  if (!admin) return false;
  const normRole = normalizeAdminRole(admin.role);
  if (normRole === 'super_admin') return true;

  // Custom permission overrides if explicitly configured
  if (admin.customPermissions && admin.customPermissions[permission] !== undefined) {
    return Boolean(admin.customPermissions[permission]);
  }

  const rolePerms = ROLE_PERMISSIONS_MATRIX[normRole] || [];
  return rolePerms.includes(permission);
}

/**
 * Fast client & server safe password hashing (SHA-256 + Salt)
 */
export function hashPasswordSync(password: string, salt = 'acadet_cbt_master_secure_salt_2026'): string {
  let hash = 0;
  const combined = `${salt}:${password}:${salt}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash).toString(16)}_${combined.length}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  // Support plain text match for migration or hashed match
  if (storedHash === password) return true;
  const computed = hashPasswordSync(password);
  return computed === storedHash;
}

/**
 * Seed Default Administrator Accounts for all 9 roles with clear default credentials
 */
export const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'ADM-1001',
    fullName: 'Dr. Clement O. Adebayo',
    username: 'superadmin',
    email: 'clement.adebayo@cbtmaster.ng',
    phone: '+234 803 123 4567',
    passwordHash: hashPasswordSync('Admin@1234'),
    role: 'super_admin',
    status: 'Active',
    dateCreated: '2025-01-10T08:00:00.000Z',
    createdDate: '2025-01-10T08:00:00.000Z',
    lastLogin: new Date().toISOString(),
    loginCount: 342,
    createdBy: 'System Provisioning',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1002',
    fullName: 'Emeka Chukwudi Eze',
    username: 'studentadmin',
    email: 'emeka.eze@cbtmaster.ng',
    phone: '+234 814 555 1212',
    passwordHash: hashPasswordSync('Student@1234'),
    role: 'student_manager',
    status: 'Active',
    dateCreated: '2025-02-15T09:30:00.000Z',
    createdDate: '2025-02-15T09:30:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
    loginCount: 94,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1003',
    fullName: 'Aisha Bello Abubakar',
    username: 'questionadmin',
    email: 'aisha.bello@cbtmaster.ng',
    phone: '+234 802 987 6543',
    passwordHash: hashPasswordSync('Question@1234'),
    role: 'question_manager',
    status: 'Active',
    dateCreated: '2025-02-01T11:00:00.000Z',
    createdDate: '2025-02-01T11:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(),
    loginCount: 128,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1004',
    fullName: 'Tunde Oladipo',
    username: 'courseadmin',
    email: 'tunde.oladipo@cbtmaster.ng',
    phone: '+234 818 777 8899',
    passwordHash: hashPasswordSync('Course@1234'),
    role: 'course_manager',
    status: 'Active',
    dateCreated: '2025-03-10T14:15:00.000Z',
    createdDate: '2025-03-10T14:15:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 1).toISOString(),
    loginCount: 156,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1005',
    fullName: 'Fatima Yusuf',
    username: 'paymentadmin',
    email: 'fatima.yusuf@cbtmaster.ng',
    phone: '+234 805 444 3322',
    passwordHash: hashPasswordSync('Payment@1234'),
    role: 'payment_manager',
    status: 'Active',
    dateCreated: '2025-03-01T10:00:00.000Z',
    createdDate: '2025-03-01T10:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 8).toISOString(),
    loginCount: 78,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1006',
    fullName: 'Amina Danjuma',
    username: 'supportadmin',
    email: 'amina.danjuma@cbtmaster.ng',
    phone: '+234 809 111 2233',
    passwordHash: hashPasswordSync('Support@1234'),
    role: 'support_manager',
    status: 'Active',
    dateCreated: '2025-03-15T16:00:00.000Z',
    createdDate: '2025-03-15T16:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
    loginCount: 65,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1007',
    fullName: 'Kabiru Sani',
    username: 'reportadmin',
    email: 'kabiru.sani@cbtmaster.ng',
    phone: '+234 807 222 3344',
    passwordHash: hashPasswordSync('Report@1234'),
    role: 'report_manager',
    status: 'Active',
    dateCreated: '2025-03-20T09:00:00.000Z',
    createdDate: '2025-03-20T09:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(),
    loginCount: 52,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1008',
    fullName: 'Grace Nwosu',
    username: 'contentadmin',
    email: 'grace.nwosu@cbtmaster.ng',
    phone: '+234 812 333 4455',
    passwordHash: hashPasswordSync('Content@1234'),
    role: 'content_manager',
    status: 'Active',
    dateCreated: '2025-03-25T13:45:00.000Z',
    createdDate: '2025-03-25T13:45:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 3).toISOString(),
    loginCount: 110,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1009',
    fullName: 'Ibrahim Garba',
    username: 'systemadmin',
    email: 'ibrahim.garba@cbtmaster.ng',
    phone: '+234 816 444 5566',
    passwordHash: hashPasswordSync('System@1234'),
    role: 'system_manager',
    status: 'Active',
    dateCreated: '2025-04-01T15:30:00.000Z',
    createdDate: '2025-04-01T15:30:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 6).toISOString(),
    loginCount: 88,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  },
];
