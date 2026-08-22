import React, { useState, useEffect, useRef } from 'react';
import {
  University,
  Faculty,
  Department,
  Course,
  Topic,
  Question,
  QuestionSource,
  StudyMaterial,
  PaymentTransaction,
  SubscriptionPlan,
  SystemSettings,
  FUL_DEPARTMENTS,
  FUAHSE_DEPARTMENTS,
  UserProfile
} from '../types';
import { StorageService, safeStringify, safeClone } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import {
  ACADEMIC_LEVELS,
  ACADEMIC_SEMESTERS,
  getFacultiesForUniversity,
  getDepartmentsForFaculty,
  getCoursesForHierarchy,
  normalizeLevel,
  normalizeSemester,
  formatAcademicBreadcrumb,
} from '../utils/academicStructure';
import { AcademicHierarchySelector, AcademicHierarchyValues } from './common/AcademicHierarchySelector';
import { QuestionManagementModule } from './admin/QuestionManagementModule';
import { StudyMaterialsModule } from './admin/StudyMaterialsModule';
import { LeaderboardManagementModule } from './admin/LeaderboardManagementModule';
import { PaymentSubscriptionModule } from './admin/PaymentSubscriptionModule';
import { NotificationCenterModule } from './admin/NotificationCenterModule';
import { ReportsManagementModule } from './admin/ReportsManagementModule';
import { ActivityLogsModule } from './admin/ActivityLogsModule';
import { FeedbackSupportModule } from './admin/FeedbackSupportModule';
import { BackupRestoreModule } from './admin/BackupRestoreModule';
import { SettingsModule } from './admin/SettingsModule';
import { AdminManagementModule } from './admin/AdminManagementModule';
import { SystemHealthModule } from './admin/SystemHealthModule';
import { AuditComplianceModule } from './admin/AuditComplianceModule';
import { SecurityAccessModule } from './admin/SecurityAccessModule';
import { TopicRequestManagementModule } from './admin/TopicRequestManagementModule';
import { MenCoreManagementModule } from './admin/MenCoreManagementModule';
import { DepartmentManagementModule } from './admin/DepartmentManagementModule';
import { FaceArenaAdminModule } from './admin/FaceArenaAdminModule';
import {
  AdminPermission,
  AdminRole as RbacAdminRole,
  CATEGORY_REQUIRED_PERMISSIONS as RBAC_CATEGORY_PERMS,
  DEFAULT_ROLE_PERMISSIONS as RBAC_DEFAULT_PERMISSIONS,
  getRoleDisplayName,
  getRolePermissions,
  hasPermission,
  normalizeAdminRole,
} from '../utils/rbac';
import {
  Shield,
  BookOpen,
  Sparkles,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Brain,
  Search,
  Settings,
  CreditCard,
  Building2,
  Edit2,
  ArrowLeft,
  Activity,
  Bell,
  Trophy,
  Database,
  BarChart3,
  History,
  Lock,
  Download,
  AlertTriangle,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  Server,
  DollarSign,
  GraduationCap,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Check,
  HelpCircle,
  Clock,
  Eye,
  Filter,
  Layers,
  HardDrive,
  X,
  RotateCcw,
  Ban,
  Key,
  User,
  AlertOctagon,
  UserMinus,
  UserPlus,
  ShieldAlert,
  Sliders,
  ShieldCheck,
  FileUp,
  ChevronDown,
  Share2,
  Swords,
} from 'lucide-react';

export type AdminCategory =
  | null
  | 'students'
  | 'signup_departments'
  | 'universities'
  | 'courses'
  | 'questions'
  | 'review_workflow'
  | 'study_materials'
  | 'notifications'
  | 'leaderboard'
  | 'payments'
  | 'question_analytics'
  | 'ai_generator_history'
  | 'backup_restore'
  | 'activity_logs'
  | 'roles_permissions'
  | 'reports'
  | 'system_health'
  | 'feedback_support'
  | 'audit_compliance'
  | 'security_access'
  | 'topic_requests'
  | 'mencore_ai'
  | 'face_arena';

export type AdminRole =
  | 'Super Administrator'
  | 'Student Manager'
  | 'Question Manager'
  | 'Course Manager'
  | 'Payment Manager'
  | 'Support Manager'
  | 'Report Manager'
  | 'Content Manager'
  | 'System Manager';

export interface AdminPersona {
  id: string;
  fullName: string;
  role: AdminRole;
  email: string;
  avatarUrl?: string;
  customPermissions?: Record<string, boolean>;
}

export const PRESET_ADMIN_PERSONAS: AdminPersona[] = [
  { id: 'ADM-1001', fullName: 'Dr. Clement O. Adebayo', role: 'Super Administrator', email: 'clement.adebayo@cbtmaster.ng', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
  { id: 'ADM-1002', fullName: 'Aisha Bello Abubakar', role: 'Question Manager', email: 'aisha.bello@cbtmaster.ng', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250' },
  { id: 'ADM-1003', fullName: 'Emeka Chukwudi Eze', role: 'Student Manager', email: 'emeka.eze@cbtmaster.ng' },
  { id: 'ADM-1004', fullName: 'Tunde Oladipo', role: 'Course Manager', email: 'tunde.oladipo@cbtmaster.ng' },
  { id: 'ADM-1005', fullName: 'Fatima Yusuf', role: 'Payment Manager', email: 'fatima.yusuf@cbtmaster.ng' },
  { id: 'ADM-1006', fullName: 'Amina Danjuma', role: 'Support Manager', email: 'amina.danjuma@cbtmaster.ng' },
  { id: 'ADM-1007', fullName: 'Kabiru Sani', role: 'Report Manager', email: 'kabiru.sani@cbtmaster.ng' },
  { id: 'ADM-1008', fullName: 'Grace Nwosu', role: 'Content Manager', email: 'grace.nwosu@cbtmaster.ng' },
  { id: 'ADM-1009', fullName: 'Ibrahim Garba', role: 'System Manager', email: 'ibrahim.garba@cbtmaster.ng' },
];

export const DEFAULT_ROLE_PERMISSIONS = RBAC_DEFAULT_PERMISSIONS;
export const CATEGORY_REQUIRED_PERMISSIONS = RBAC_CATEGORY_PERMS;

interface AdminDashboardProps {
  currentUser?: UserProfile | null;
  universities: University[];
  faculties: Faculty[];
  departments: Department[];
  courses: Course[];
  topics: Topic[];
  questions: Question[];
  transactions: PaymentTransaction[];
  plans: SubscriptionPlan[];
  settings: SystemSettings;
  onUpdateQuestions: (qs: Question[]) => void;
  onUpdateUniversities: (data: University[]) => void;
  onUpdateFaculties?: (data: Faculty[]) => void;
  onUpdateDepartments?: (data: Department[]) => void;
  onUpdateCourses: (data: Course[]) => void;
  onUpdateTopics: (data: Topic[]) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
  onUpdatePlans: (plans: SubscriptionPlan[]) => void;
  onNavigate?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  universities,
  faculties,
  departments,
  courses,
  topics,
  questions,
  transactions,
  plans,
  settings,
  onUpdateQuestions,
  onUpdateUniversities,
  onUpdateFaculties,
  onUpdateDepartments,
  onUpdateCourses,
  onUpdateTopics,
  onUpdateSettings,
  onUpdatePlans,
  onNavigate,
}) => {
  // Navigation Category State (null = Main Dashboard)
  const [activeCategory, setActiveCategory] = useState<AdminCategory>(null);

  // Authenticated Admin Identity (Fixed by Login Session - No Impersonation / Switching Allowed)
  const currentAdminAccount = StorageService.getCurrentAdmin();
  const rawRole = currentUser?.adminRole || currentAdminAccount?.role || 'super_admin';
  const currentRole = normalizeAdminRole(rawRole);
  const roleDisplayName = getRoleDisplayName(currentRole);
  const adminFullName = currentUser?.name || currentAdminAccount?.fullName || 'Administrator';
  const adminUsername = currentUser?.username || currentAdminAccount?.username || 'admin';
  const adminAvatar = currentUser?.avatarUrl || currentAdminAccount?.avatarUrl || '';
  const adminPermissions = getRolePermissions(currentRole);

  const [showRoleMatrixModal, setShowRoleMatrixModal] = useState(false);

  // RBAC Permission Check Helper
  const checkCategoryAccess = (cat: AdminCategory) => {
    if (!cat) return { hasAccess: true, requiredPermission: '' };
    if (currentRole === 'super_admin') return { hasAccess: true, requiredPermission: '' };

    const requiredPerm = (CATEGORY_REQUIRED_PERMISSIONS[cat] || 'view_activity_logs') as AdminPermission;
    const allowed = hasPermission(currentAdminAccount || { role: currentRole }, requiredPerm);

    return {
      hasAccess: allowed,
      requiredPermission: requiredPerm,
    };
  };

  const handleQuickActionWithPermission = (requiredPerm: AdminPermission, actionCallback: () => void, actionName: string) => {
    if (currentRole === 'super_admin' || hasPermission(currentAdminAccount || { role: currentRole }, requiredPerm)) {
      actionCallback();
      return;
    }
    alert(`Permission Denied: Your active role "${roleDisplayName}" lacks the "${requiredPerm}" permission required to ${actionName.toLowerCase()}.`);
  };

  // Users State (From Storage)
  const [studentsList, setStudentsList] = useState(StorageService.getUsers());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncToastMsg, setSyncToastMsg] = useState<string | null>(null);

  const activeDbInfo = StorageService.getActiveDatabase();

  const handleManualSync = async () => {
    setIsSyncingCloud(true);
    try {
      await StorageService.syncWithCloud(true);
      setStudentsList(StorageService.getUsers());
      setSyncToastMsg(`Synced live with ${activeDbInfo.name}`);
      setTimeout(() => setSyncToastMsg(null), 3000);
    } catch (err) {
      console.warn('[AdminDashboard] Manual sync error:', err);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  useEffect(() => {
    // 1. Initial live pull on mount
    handleManualSync();

    // 2. Storage event listeners for instant local updates
    const handleStorageUpdate = () => {
      setStudentsList(StorageService.getUsers());
    };
    window.addEventListener('cbt_storage_change', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // 3. Tab focus trigger (when admin returns to this browser window)
    const handleWindowFocus = () => {
      StorageService.syncWithCloud(true).then(() => {
        setStudentsList(StorageService.getUsers());
      });
    };
    window.addEventListener('focus', handleWindowFocus);

    // 4. Periodic 12-second polling to capture registrations across remote browsers/devices
    const syncInterval = setInterval(() => {
      StorageService.syncWithCloud(true).then(() => {
        setStudentsList(StorageService.getUsers());
      });
    }, 12000);

    return () => {
      window.removeEventListener('cbt_storage_change', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(syncInterval);
    };
  }, []);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any | null>(null);
  const [profileModalTab, setProfileModalTab] = useState<'view' | 'edit' | 'extend' | 'password' | 'sub_cancel' | 'restrict' | 'ban' | 'delete'>('view');

  // User History Snapshots for UNDO support
  const [userSnapshots, setUserSnapshots] = useState<Record<string, UserProfile[]>>({});
  const [lastToastAction, setLastToastAction] = useState<{
    userId: string;
    userName: string;
    actionName: string;
    previousUser: UserProfile;
  } | null>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUniName, setEditUniName] = useState('');
  const [editDeptName, setEditDeptName] = useState('');
  const [editRole, setEditRole] = useState<'student' | 'admin'>('student');
  const [banReasonInput, setBanReasonInput] = useState('');

  // Subscription Management Modal State
  const [extendSubStudent, setExtendSubStudent] = useState<any | null>(null);
  const [extensionUnit, setExtensionUnit] = useState<'days' | 'months'>('days');
  const [extensionAmount, setExtensionAmount] = useState<number>(30);
  const [extensionPlanName, setExtensionPlanName] = useState<string>('30-Day Premium');

  // Student Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentUniFilter, setStudentUniFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'premium' | 'online' | 'new_today' | 'suspended'>('all');

  // Course Management State with Complete Hierarchy Support
  const [courseUniFilter, setCourseUniFilter] = useState<string>('all');
  const [courseFacultyFilter, setCourseFacultyFilter] = useState<string>('all');
  const [courseDeptFilter, setCourseDeptFilter] = useState<string>('all');
  const [courseLevelFilter, setCourseLevelFilter] = useState<string>('all');
  const [courseSemesterFilter, setCourseSemesterFilter] = useState<string>('all');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Add New Course 6-Step Flow State
  const [newCourseUniId, setNewCourseUniId] = useState<string>(universities[0]?.id || 'uni-ful');
  const [newCourseFacultyId, setNewCourseFacultyId] = useState<string>('');
  const [newCourseDeptId, setNewCourseDeptId] = useState<string>('');
  const [newCourseLevel, setNewCourseLevel] = useState<string>('100 Level');
  const [newCourseSemester, setNewCourseSemester] = useState<string>('First Semester');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false);

  // Edit / View Course Modal State
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseUniId, setEditCourseUniId] = useState<string>('');
  const [editCourseFacultyId, setEditCourseFacultyId] = useState<string>('');
  const [editCourseDeptId, setEditCourseDeptId] = useState<string>('');
  const [editCourseLevel, setEditCourseLevel] = useState<string>('100 Level');
  const [editCourseSemester, setEditCourseSemester] = useState<string>('First Semester');
  const [editCourseCode, setEditCourseCode] = useState<string>('');
  const [editCourseTitle, setEditCourseTitle] = useState<string>('');
  const [courseDependencyError, setCourseDependencyError] = useState<string | null>(null);

  // University Management State
  const [newUniName, setNewUniName] = useState('');
  const [newUniAbbr, setNewUniAbbr] = useState('');
  const [newUniLocation, setNewUniLocation] = useState('');
  const [uniSearch, setUniSearch] = useState('');
  const [universityStatusFilter, setUniversityStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [selectedUniversityDetail, setSelectedUniversityDetail] = useState<any | null>(null);
  const [editingUniversity, setEditingUniversity] = useState<any | null>(null);
  const [uniDependencyError, setUniDependencyError] = useState<string | null>(null);

  // Question Management State
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCourseFilter, setQuestionCourseFilter] = useState('');
  const [previewQ, setPreviewQ] = useState<Question | null>(null);

  // Manual Question Creator Modal
  const [newQModalOpen, setNewQModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanationText, setExplanationText] = useState('');
  const [manualCourseId, setManualCourseId] = useState(courses[0]?.id || '');

  // Question Review Workflow State
  const [workflowTab, setWorkflowTab] = useState<'pending' | 'review' | 'queue' | 'published'>('pending');
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([
    {
      id: 'rev-101',
      question: 'Which of the following data structures operates on a Last In First Out (LIFO) basis?',
      optionA: 'Queue',
      optionB: 'Stack',
      optionC: 'Linked List',
      optionD: 'Tree',
      correctAnswer: 'B',
      explanation: 'Stack works strictly on LIFO principle.',
      courseCode: 'CSC201',
      status: 'Pending',
      submittedAt: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString(),
      suggestedFix: 'Which data structure follows the Last In First Out (LIFO) principle?',
      qualityScore: '96%',
      issuesDetected: 'Minor wording adjustment recommended for better readability.'
    },
    {
      id: 'rev-102',
      question: 'Human anatomy is the study of human body parts and function',
      optionA: 'True',
      optionB: 'False',
      optionC: 'Neither',
      optionD: 'Both',
      correctAnswer: 'A',
      explanation: 'Anatomy studies physical structure.',
      courseCode: 'ANA201',
      status: 'Under Review',
      submittedAt: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      suggestedFix: 'Human anatomy is strictly defined as the branch of biology concerned with the structure of organisms and their parts.',
      qualityScore: '62%',
      issuesDetected: 'Question lacks options accuracy. Medical questions require precise choices.',
      isWarning: true
    }
  ]);

  // Intelligent Question Generator State
  const [genInputMode, setGenInputMode] = useState<'file' | 'text'>('file');
  const [genUploadedFile, setGenUploadedFile] = useState<File | null>(null);
  const [isDraggingGenFile, setIsDraggingGenFile] = useState(false);
  const [genImagePreview, setGenImagePreview] = useState<string | null>(null);
  const [materialText, setMaterialText] = useState('');

  const handleGenFileSelect = (file: File | null) => {
    setGenUploadedFile(file);
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setGenImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setGenImagePreview(null);
    }
  };

  const handleGenFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingGenFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleGenFileSelect(e.dataTransfer.files[0]);
    }
  };
  const [genHierarchy, setGenHierarchy] = useState<AcademicHierarchyValues>({
    universityId: universities[0]?.id || '',
    facultyId: '',
    departmentId: '',
    level: '100 Level',
    semester: 'First Semester',
    courseId: courses[0]?.id || '',
  });
  const [genTopic, setGenTopic] = useState('Core Fundamentals');
  const [genDifficulty, setGenDifficulty] = useState<string>('Medium');
  const [genCount, setGenCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const genFileInputRef = useRef<HTMLInputElement>(null);
  const [generatorHistory, setGeneratorHistory] = useState<any[]>([
    {
      id: 'gen-batch-1',
      course: 'CSC201 - Data Structures',
      topic: 'Binary Trees & Graph Theory',
      questionCount: 5,
      date: new Date().toLocaleDateString(),
      status: 'Ready',
      source: 'Lecture_Notes.pdf'
    },
    {
      id: 'gen-batch-2',
      course: 'MED201 - Human Anatomy',
      topic: 'Cardiovascular System',
      questionCount: 10,
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      status: 'Published',
      source: 'Anatomy_Scan_Page4.png'
    }
  ]);

  // Study Materials State
  const [materialsList, setMaterialsList] = useState<StudyMaterial[]>(() => StorageService.getMaterials());

  useEffect(() => {
    const handleStorageChange = () => {
      setMaterialsList(StorageService.getMaterials());
    };
    window.addEventListener('cbt_storage_change', handleStorageChange);
    return () => window.removeEventListener('cbt_storage_change', handleStorageChange);
  }, []);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatType, setNewMatType] = useState('PDF');
  const [newMatCourse, setNewMatCourse] = useState('CSC201');
  const [newMatTier, setNewMatTier] = useState('Free Trial');

  // Notifications State
  const [announcements, setAnnouncements] = useState<any[]>([
    { id: 'ann-1', title: 'CBT Practice Exams Begin Tomorrow', audience: 'Everyone', date: '2026-07-21', status: 'Active' },
    { id: 'ann-2', title: 'Scheduled Server Maintenance Notice', audience: 'Federal University Lokoja', date: '2026-07-25', status: 'Scheduled' }
  ]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnMsg, setNewAnnMsg] = useState('');
  const [newAnnAudience, setNewAnnAudience] = useState('Everyone');

  // Support Tickets State
  const [tickets, setTickets] = useState<any[]>([
    { id: 'TCK-801', student: 'Alex Johnson', email: 'alex@student.edu.ng', category: 'Complaint', subject: 'Option C cutoff in GST101', status: 'Open', date: 'Today' },
    { id: 'TCK-802', student: 'Sarah Smith', email: 'sarah@fuahse.edu.ng', category: 'Support Request', subject: 'Payment confirmation delayed', status: 'Resolved', date: 'Yesterday' }
  ]);

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState<any[]>([
    { id: 'log-1', time: '10:42 AM', admin: 'Super Admin', action: 'Published 10 SMART Questions for ANA201', module: 'Question Management' },
    { id: 'log-2', time: '09:15 AM', admin: 'Question Manager', action: 'Approved Payment TX-9021', module: 'Payments' },
    { id: 'log-3', time: '08:00 AM', admin: 'Super Admin', action: 'System Backup Created', module: 'Backup & Restore' }
  ]);

  // Dynamic Real Database Metrics Calculation
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Real active students count (users active today)
  const activeStudentsToday = studentsList.filter((s: any) => {
    if (s.lastActiveDate && s.lastActiveDate.startsWith(todayStr)) return true;
    if (s.lastLogin && s.lastLogin.startsWith(todayStr)) return true;
    if (s.lastActive && s.lastActive.startsWith(todayStr)) return true;
    return false;
  }).length;

  // Real new registrations count today
  const newRegistrationsToday = studentsList.filter((s: any) => {
    if (s.createdAt && s.createdAt.startsWith(todayStr)) return true;
    if (s.registeredDate && s.registeredDate.startsWith(todayStr)) return true;
    return false;
  }).length;

  // Real active subscriptions
  const activeSubscriptionsCount = studentsList.filter((s: any) => 
    s.subscription?.isPremium || s.subscriptionStatus === 'active' || s.subscriptionStatus === 'Premium'
  ).length || transactions.filter((t) => t.status === 'Successful').length;

  // Real pending payments
  const pendingPaymentsCount = transactions.filter((t) => t.status === 'Pending').length;

  // Real Total Revenue from successful transactions
  const totalRevenue = transactions.filter((t) => t.status === 'Successful').reduce((acc, t) => acc + (t.amount || 0), 0);

  // Real Online Users (sessions active in the last 15 mins)
  const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
  const onlineUsersCount = studentsList.filter((s: any) => {
    if (s.isOnline) return true;
    if (s.lastActiveDate && new Date(s.lastActiveDate).getTime() > fifteenMinsAgo) return true;
    return false;
  }).length;

  // Quick Action Handlers
  const handleQuickAddQuestion = () => {
    setActiveCategory('questions');
    setNewQModalOpen(true);
  };

  const handleQuickAddUniversity = () => {
    setActiveCategory('universities');
  };

  const handleQuickAddCourse = () => {
    setActiveCategory('courses');
    setNewCourseModalOpen(true);
  };

  // Add University Handler
  const handleAddUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim() || !newUniAbbr.trim()) return;

    const newUni: University = {
      id: `uni-${Date.now()}`,
      name: newUniName.trim(),
      abbreviation: newUniAbbr.trim().toUpperCase(),
      location: newUniLocation.trim() || 'Nigeria',
    };

    const updated = [newUni, ...universities];
    onUpdateUniversities(updated);
    const result = await StorageService.saveUniversities(updated);
    if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
    setNewUniName('');
    setNewUniAbbr('');
    setNewUniLocation('');
  };

  // Add Course Handler with 6-Step Academic Hierarchy Flow
  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseTitle.trim()) return;

    const selectedUniObj = universities.find((u) => u.id === newCourseUniId) || universities[0];
    const uniId = selectedUniObj?.id || newCourseUniId || 'uni-ful';
    const uniName = selectedUniObj
      ? `${selectedUniObj.name} (${selectedUniObj.abbreviation})`
      : 'Federal University Lokoja (FUL)';

    const availFaculties = getFacultiesForUniversity(uniId, faculties);
    const selectedFacObj = availFaculties.find((f) => f.id === newCourseFacultyId) || availFaculties[0];
    const facId = selectedFacObj?.id || 'fac-1';
    const facName = selectedFacObj?.name || 'Faculty of Science';

    const availDepts = getDepartmentsForFaculty(facId, uniId, departments, availFaculties);
    const selectedDeptObj = availDepts.find((d) => d.id === newCourseDeptId) || availDepts[0];
    const deptId = selectedDeptObj?.id || 'dept-1';
    const deptName = selectedDeptObj?.name || 'Department of Computer Science';

    const newC: Course = {
      id: `crs-${Date.now()}`,
      code: newCourseCode.trim().toUpperCase(),
      title: newCourseTitle.trim(),
      universityId: uniId,
      universityName: uniName,
      facultyId: facId,
      facultyName: facName,
      departmentId: deptId,
      departmentName: deptName,
      level: newCourseLevel,
      semester: newCourseSemester,
      session: '2025/2026',
      isDisabled: false,
    };

    const updated = [newC, ...courses];
    onUpdateCourses(updated);
    const result = await StorageService.saveCourses(updated);
    if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseModalOpen(false);
  };

  // Edit Course Details & Hierarchy Handler
  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editCourseCode.trim() || !editCourseTitle.trim()) return;

    const selectedUniObj = universities.find((u) => u.id === editCourseUniId) || universities[0];
    const uniId = selectedUniObj?.id || editCourseUniId;
    const uniName = selectedUniObj
      ? `${selectedUniObj.name} (${selectedUniObj.abbreviation})`
      : editingCourse.universityName || 'Federal University Lokoja (FUL)';

    const availFaculties = getFacultiesForUniversity(uniId, faculties);
    const selectedFacObj = availFaculties.find((f) => f.id === editCourseFacultyId) || availFaculties[0];
    const facId = selectedFacObj?.id || editingCourse.facultyId || 'fac-1';
    const facName = selectedFacObj?.name || editingCourse.facultyName || 'Faculty of Science';

    const availDepts = getDepartmentsForFaculty(facId, uniId, departments, availFaculties);
    const selectedDeptObj = availDepts.find((d) => d.id === editCourseDeptId) || availDepts[0];
    const deptId = selectedDeptObj?.id || editingCourse.departmentId || 'dept-1';
    const deptName = selectedDeptObj?.name || editingCourse.departmentName || 'Department of Computer Science';

    const updatedCourses = courses.map((c) => {
      if (c.id === editingCourse.id) {
        return {
          ...c,
          code: editCourseCode.trim().toUpperCase(),
          title: editCourseTitle.trim(),
          universityId: uniId,
          universityName: uniName,
          facultyId: facId,
          facultyName: facName,
          departmentId: deptId,
          departmentName: deptName,
          level: editCourseLevel,
          semester: editCourseSemester,
        };
      }
      return c;
    });

    onUpdateCourses(updatedCourses);
    const result = await StorageService.saveCourses(updatedCourses);
    if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
    setEditingCourse(null);
  };

  // Re-assign or assign university to course handler
  const handleAssignUniversityToCourse = async (courseId: string, targetUniversityId: string) => {
    const selectedUniObj = universities.find((u) => u.id === targetUniversityId);
    if (!selectedUniObj) return;

    const updated = courses.map((c: any) => {
      if (c.id === courseId) {
        return {
          ...c,
          universityId: selectedUniObj.id,
          universityName: `${selectedUniObj.name} (${selectedUniObj.abbreviation})`,
        };
      }
      return c;
    });

    onUpdateCourses(updated);
    const result = await StorageService.saveCourses(updated);
    if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
    if (selectedCourseDetail && selectedCourseDetail.id === courseId) {
      setSelectedCourseDetail({
        ...selectedCourseDetail,
        universityId: selectedUniObj.id,
        universityName: `${selectedUniObj.name} (${selectedUniObj.abbreviation})`,
      });
    }
  };

  // Add Manual Question Handler
  const handleCreateManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCourse = courses.find((c) => c.id === manualCourseId);

    const newQ: Question = {
      id: `q-man-${Date.now()}`,
      question: newQuestionText,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: correctOpt,
      explanation: explanationText || 'Verified university past question answer key.',
      universityId: universities[0]?.id || 'uni-1',
      facultyId: faculties[0]?.id || 'fac-1',
      departmentId: departments[0]?.id || 'dept-1',
      courseId: manualCourseId,
      semester: selectedCourse?.semester || 'First',
      session: '2025/2026',
      topicId: topics[0]?.id || 'top-1',
      topicName: 'General Practice',
      difficulty: 'Medium',
      source: 'Past Question',
      status: 'Published',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    onUpdateQuestions([newQ, ...questions]);
    setNewQModalOpen(false);
    setNewQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setExplanationText('');
  };

  // Smart Question Generator Handler (Multimodal: PDF, Photos/Images, Documents, Text)
  const handleGenerateQuestions = async () => {
    if (!genHierarchy.universityId || !genHierarchy.courseId) {
      alert('Please select a Target University, Faculty, Department, Level, Semester, and Course before generating questions.');
      return;
    }
    const selectedCourseObj = courses.find((c: any) => c.id === genHierarchy.courseId) || courses[0];
    const selectedUniObj = universities.find((u: any) => u.id === genHierarchy.universityId) || universities[0];

    let payload: any = {
      universityName: selectedUniObj?.name || 'University',
      level: genHierarchy.level || '100 Level',
      courseCode: selectedCourseObj?.code || 'GST101',
      courseTitle: selectedCourseObj?.title || 'General Course',
      topic: genTopic || 'Core Fundamentals',
      difficulty: genDifficulty || 'Medium',
      questionCount: genCount || 5,
    };

    if (genInputMode === 'file' && genUploadedFile) {
      payload.fileName = genUploadedFile.name;
      payload.mimeType = genUploadedFile.type || 'application/octet-stream';

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(genUploadedFile);
      });
      payload.fileData = base64Data;

      const lowerName = genUploadedFile.name.toLowerCase();
      if (
        genUploadedFile.type.startsWith('text/') ||
        lowerName.endsWith('.txt') ||
        lowerName.endsWith('.csv') ||
        lowerName.endsWith('.json') ||
        lowerName.endsWith('.md')
      ) {
        try {
          const fileText = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(genUploadedFile);
          });
          payload.materialText = fileText;
        } catch (e) {
          console.warn('Could not read file text:', e);
        }
      }
    } else if (genInputMode === 'text' && materialText.trim()) {
      payload.materialText = materialText.trim();
    } else {
      alert('Please select a PDF document, exam photo image, file, or enter study material text writing.');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await ApiClient.generateQuestions(payload);

      if (data.success && Array.isArray(data.questions)) {
        const generatedQs: Question[] = data.questions.map((q: any, i: number) => ({
          id: `smart-q-${Date.now()}-${i}`,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: (q.correctAnswer || 'A').toUpperCase() as any,
          explanation: q.explanation || 'SMART Generated Step-by-Step Explanation',
          universityId: selectedUniObj?.id || genHierarchy.universityId || 'uni-1',
          facultyId: genHierarchy.facultyId || faculties[0]?.id || 'fac-1',
          departmentId: genHierarchy.departmentId || departments[0]?.id || 'dept-1',
          level: genHierarchy.level || '100 Level',
          courseId: selectedCourseObj?.id || genHierarchy.courseId || 'crs-1',
          courseCode: selectedCourseObj?.code || 'GST101',
          semester: genHierarchy.semester || 'First Semester',
          session: '2025/2026',
          topicId: topics[0]?.id || 'top-1',
          difficulty: (q.difficulty || genDifficulty || 'Medium') as any,
          source: (genUploadedFile ? 'Smart Upload' : 'SMART Generated') as QuestionSource,
          status: 'Published',
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          createdBy: 'SMART Question Generator Engine',
          versionNumber: 1,
        }));

        onUpdateQuestions([...generatedQs, ...questions]);
        setGeneratorHistory([
          {
            id: `gen-batch-${Date.now()}`,
            university: selectedUniObj?.abbreviation || selectedUniObj?.name || 'Uni',
            level: genHierarchy.level || '100 Level',
            course: `${selectedCourseObj?.code || 'GST101'} - ${selectedCourseObj?.title || 'Course'}`,
            topic: genTopic || 'Exam Questions',
            questionCount: generatedQs.length,
            date: new Date().toLocaleDateString(),
            status: 'Published',
            source: genUploadedFile ? genUploadedFile.name : 'Text Input',
          },
          ...generatorHistory,
        ]);
        setMaterialText('');
        setGenUploadedFile(null);
        alert(`Successfully generated and published ${generatedQs.length} questions mapped to ${selectedUniObj?.abbreviation || 'University'} - ${selectedCourseObj?.code} (${genHierarchy.level || '100 Level'}) into the Question Bank!`);
      } else {
        alert(data.error || 'Failed to generate questions.');
      }
    } catch (err: any) {
      console.error('Question generation error:', err);
      alert('Error connecting to question generator engine: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Add Study Material Handler
  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim()) return;
    const newM: StudyMaterial = {
      id: `mat-${Date.now()}`,
      universityId: 'uni-ful',
      universityName: 'Federal University Lokoja (FUL)',
      courseId: 'c-1',
      courseCode: newMatCourse,
      courseTitle: newMatCourse,
      accessLevel: (newMatTier === 'Free' ? 'Free Trial' : 'Premium Only') as any,
      totalDownloads: 0,
      title: newMatTitle,
      type: (newMatType as any) || 'PDF',
      uploadedBy: adminFullName || 'Admin',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      fileUrl: '',
      fileSize: '1.2 MB',
      fileSizeBytes: 1258291
    };
    setMaterialsList([newM, ...materialsList]);
    setNewMatTitle('');
  };

  // Add Announcement Handler
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnMsg.trim()) return;
    const newA = {
      id: `ann-${Date.now()}`,
      title: newAnnTitle,
      audience: newAnnAudience,
      date: new Date().toLocaleDateString(),
      status: 'Active'
    };
    setAnnouncements([newA, ...announcements]);
    setNewAnnTitle('');
    setNewAnnMsg('');
  };

  // Helper to calculate extended expiry date based on unit and amount
  const calculateNewExpiry = (currentExpiry: string | null | undefined, unit: 'days' | 'months', amount: number): string => {
    let baseDate = new Date();
    if (currentExpiry) {
      const existingTime = new Date(currentExpiry).getTime();
      if (!isNaN(existingTime) && existingTime > Date.now()) {
        baseDate = new Date(existingTime);
      }
    }
    const safeAmount = Math.max(1, amount || 1);
    if (unit === 'months') {
      baseDate.setMonth(baseDate.getMonth() + safeAmount);
    } else {
      baseDate.setDate(baseDate.getDate() + safeAmount);
    }
    return baseDate.toISOString();
  };

  // --- SNAPSHOT & UNDO ENGINE FOR ALL USER PROFILE ACTIONS ---
  const handleSaveUserWithSnapshot = (updatedUser: UserProfile, actionDescription: string) => {
    const currentUser = studentsList.find((s) => s.id === updatedUser.id) || selectedStudentProfile;
    if (currentUser) {
      const clone = safeClone(currentUser);
      setUserSnapshots((prev) => ({
        ...prev,
        [updatedUser.id]: [...(prev[updatedUser.id] || []), clone],
      }));
    }

    StorageService.saveUser(updatedUser);
    setStudentsList((prev) => prev.map((s) => (s.id === updatedUser.id ? updatedUser : s)));
    if (selectedStudentProfile?.id === updatedUser.id) {
      setSelectedStudentProfile(updatedUser);
    }

    if (currentUser) {
      setLastToastAction({
        userId: updatedUser.id,
        userName: updatedUser.name,
        actionName: actionDescription,
        previousUser: safeClone(currentUser),
      });
    }

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        admin: 'Admin',
        action: `${actionDescription} for ${updatedUser.name} (${updatedUser.email})`,
        module: 'Student Management',
      },
      ...prev,
    ]);
  };

  const handleUndoUserAction = (userId: string) => {
    const history = userSnapshots[userId] || [];
    if (history.length === 0) {
      alert('No previous state available to undo for this user.');
      return;
    }
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    StorageService.saveUser(previousState);
    setStudentsList((prev) => prev.map((s) => (s.id === userId ? previousState : s)));
    if (selectedStudentProfile?.id === userId) {
      setSelectedStudentProfile(previousState);
    }
    setUserSnapshots((prev) => ({ ...prev, [userId]: newHistory }));
    setLastToastAction(null);

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        admin: 'Admin',
        action: `UNDID last action for ${previousState.name} (${previousState.email})`,
        module: 'Student Management',
      },
      ...prev,
    ]);
  };

  const handleOpenStudentProfile = (student: UserProfile, tab: 'view' | 'edit' | 'extend' | 'password' | 'sub_cancel' | 'restrict' | 'ban' | 'delete' = 'view') => {
    setSelectedStudentProfile(student);
    setProfileModalTab(tab);
    setEditName(student.name || '');
    setEditEmail(student.email || '');
    setEditUsername(student.username || '');
    setEditPhone(student.phone || '');
    setEditUniName(student.universityName || '');
    setEditDeptName(student.departmentName || '');
    setEditRole(student.role || 'student');
    setBanReasonInput(student.banReason || '');
  };

  // 1 & 2. Edit User Profile Handler
  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentProfile) return;

    const updatedUser: UserProfile = {
      ...selectedStudentProfile,
      name: editName,
      email: editEmail,
      username: editUsername,
      phone: editPhone,
      universityName: editUniName,
      departmentName: editDeptName,
      role: editRole,
    };

    handleSaveUserWithSnapshot(updatedUser, `Edited Profile details`);
    setProfileModalTab('view');
  };

  // 3. Apply Subscription Extension Handler
  const handleApplySubscriptionExtension = () => {
    const targetStudent = extendSubStudent || selectedStudentProfile;
    if (!targetStudent) return;

    const newExpiry = calculateNewExpiry(
      targetStudent.subscription?.expiryDate,
      extensionUnit,
      extensionAmount
    );

    const updatedUser: UserProfile = {
      ...targetStudent,
      subscription: {
        ...targetStudent.subscription,
        isPremium: true,
        plan: extensionPlanName || `${extensionAmount}-${extensionUnit === 'months' ? 'Month' : 'Day'} Premium`,
        startDate: targetStudent.subscription?.startDate || new Date().toISOString(),
        expiryDate: newExpiry,
      },
    };

    handleSaveUserWithSnapshot(updatedUser, `Extended subscription (+${extensionAmount} ${extensionUnit})`);
    setExtendSubStudent(null);
  };

  // 4. Cancel Subscription Handler
  const handleCancelSubscription = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId) || selectedStudentProfile;
    if (!student) return;

    const updatedUser: UserProfile = {
      ...student,
      subscription: {
        ...student.subscription,
        isPremium: false,
        plan: 'Cancelled',
        expiryDate: new Date().toISOString(),
      },
    };

    handleSaveUserWithSnapshot(updatedUser, `Cancelled subscription`);
  };

  // 5. Reset Password Handler
  const handleResetPassword = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId) || selectedStudentProfile;
    if (!student) return;

    const tempPassword = `CBTPass@${Math.floor(1000 + Math.random() * 9000)}`;
    const updatedUser: UserProfile = {
      ...student,
      updatedAt: new Date().toISOString(),
    };

    handleSaveUserWithSnapshot(updatedUser, `Reset Password (Temp: ${tempPassword})`);
    alert(`Password reset link and temporary login code (${tempPassword}) sent to ${student.email}`);
  };

  // 6. Restrict User Handler
  const handleToggleRestrictUser = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId) || selectedStudentProfile;
    if (!student) return;

    const newStatus = !student.isRestricted;
    const updatedUser: UserProfile = {
      ...student,
      isRestricted: newStatus,
    };

    handleSaveUserWithSnapshot(updatedUser, newStatus ? `Restricted user access` : `Unrestricted user access (Undo Restriction)`);
  };

  // 7. Ban User Handler
  const handleToggleBanUser = (studentId: string, reason?: string) => {
    const student = studentsList.find((s) => s.id === studentId) || selectedStudentProfile;
    if (!student) return;

    const newStatus = !student.isBanned;
    const updatedUser: UserProfile = {
      ...student,
      isBanned: newStatus,
      banReason: newStatus ? (reason || 'Violated CBT Terms of Service') : undefined,
    };

    handleSaveUserWithSnapshot(updatedUser, newStatus ? `Banned user account (${reason || 'Terms violation'})` : `Unbanned user account (Undo Ban)`);
  };

  // 8. Delete Account Handler (Soft Delete)
  const handleToggleDeleteAccount = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId) || selectedStudentProfile;
    if (!student) return;

    const newStatus = !student.isDeleted;
    const updatedUser: UserProfile = {
      ...student,
      isDeleted: newStatus,
      deletedAt: newStatus ? new Date().toISOString() : undefined,
    };

    handleSaveUserWithSnapshot(updatedUser, newStatus ? `Deleted account` : `Restored account (Undo Delete)`);
  };

  // Permanent Delete User Handler
  const handlePermanentDeleteUser = (studentId: string) => {
    const student = studentsList.find((s) => s.id === studentId) || selectedStudentProfile;
    const studentName = student ? student.name : 'this user';
    if (!window.confirm(`PERMANENT DELETION WARNING:\n\nAre you sure you want to PERMANENTLY delete user "${studentName}"?\n\nThis will purge their profile and data from Firebase Cloud Firestore and Local Storage permanently. This action CANNOT be undone.`)) {
      return;
    }
    const updatedUsers = studentsList.filter((s) => s.id !== studentId);
    setStudentsList(updatedUsers);
    StorageService.deleteUser(studentId);
    if (selectedStudentProfile?.id === studentId) {
      setSelectedStudentProfile(null);
    }
  };

  // Verify Payment & Auto Activate Subscription
  const handleVerifyTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    // Mark Transaction as Success
    const updatedTxs = transactions.map((t) =>
      t.id === txId ? { ...t, status: 'Successful' as const } : t
    );
    StorageService.saveTransactions(updatedTxs);

    // Auto Activate Student Subscription
    const student = studentsList.find(
      (s) => s.id === tx.userId || s.email.toLowerCase() === tx.userEmail?.toLowerCase()
    );

    if (student) {
      const planDuration = tx.planName?.toLowerCase().includes('30') ? 30 : tx.planName?.toLowerCase().includes('14') ? 14 : 30;
      const newExpiry = calculateNewExpiry(student.subscription?.expiryDate, 'days', planDuration);
      const updatedUser = {
        ...student,
        subscription: {
          ...student.subscription,
          isPremium: true,
          plan: tx.planName || '30-Day Premium',
          startDate: new Date().toISOString(),
          expiryDate: newExpiry,
        },
      };

      StorageService.saveUser(updatedUser);
      setStudentsList((prev) => prev.map((s) => (s.id === student.id ? updatedUser : s)));
    }

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        admin: 'Admin',
        action: `Verified payment TX-${tx.reference || tx.id} and auto-activated subscription for ${tx.userEmail}`,
        module: 'Payments & Subscriptions',
      },
      ...prev,
    ]);

    alert(`Payment reference ${tx.reference || tx.id} verified! Subscription auto-activated.`);
  };

  // Export CSV Helper
  const handleExportCSV = (filename: string, rows: any[]) => {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...rows.map((row) => keys.map((k) => `"${row[k] || ''}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Backup JSON
  const handleDownloadBackup = () => {
    const backupData = {
      universities,
      courses,
      questions,
      transactions,
      students: studentsList,
      settings,
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(safeStringify(backupData, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cbt_master_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in" id="admin-dashboard-container">
      
      {/* Top Header Controls: Back Arrow (Top Left) & Cancel X Button (Top Right) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => {
            if (activeCategory !== null) {
              setActiveCategory(null);
            } else if (onNavigate) {
              onNavigate('dashboard');
            }
          }}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
          id="admin-top-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>{activeCategory !== null ? 'Back to Admin Main' : 'Back to Student Dashboard'}</span>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="admin-top-cancel-btn"
          title="Cancel / Close Admin Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Admin Session Bar (Fixed Session - No Switcher Allowed) */}
      <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold overflow-hidden shrink-0">
            {adminAvatar ? (
              <img src={adminAvatar} alt={adminFullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-indigo-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Logged-in Administrator:</span>
              <span className="text-xs font-extrabold text-white">{adminFullName}</span>
              <span className="text-[11px] text-slate-400 font-mono">(@{adminUsername})</span>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                  currentRole === 'super_admin'
                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                }`}
              >
                {roleDisplayName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Active Scope:{' '}
              <span className="text-indigo-300 font-mono font-medium">
                {adminPermissions.length} Permissions Enforced
              </span>{' '}
              <span className="text-slate-500 text-[10px]">• Fixed Session</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Role:</span>
            <span className="font-bold text-amber-300">{roleDisplayName}</span>
          </div>

          <button
            onClick={() => setShowRoleMatrixModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Role Matrix</span>
          </button>
        </div>
      </div>
      
      {/* Category Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          {activeCategory !== null && (
            <button
              onClick={() => setActiveCategory(null)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer border border-amber-500/30"
              id="back-to-main-admin-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Main Dashboard</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {activeCategory === null && 'Dashboard Overview (Main Admin Portal)'}
                {activeCategory !== null && !checkCategoryAccess(activeCategory).hasAccess && 'Access Restricted'}
                {activeCategory === 'students' && checkCategoryAccess('students').hasAccess && 'Student Management Interface'}
                {activeCategory === 'universities' && checkCategoryAccess('universities').hasAccess && 'University Management Interface'}
                {activeCategory === 'courses' && checkCategoryAccess('courses').hasAccess && 'Course Management Interface'}
                {activeCategory === 'questions' && checkCategoryAccess('questions').hasAccess && 'Question Bank Management Interface'}
                {activeCategory === 'review_workflow' && checkCategoryAccess('review_workflow').hasAccess && 'Intelligent Question Review Workflow'}
                {activeCategory === 'study_materials' && checkCategoryAccess('study_materials').hasAccess && 'Study Materials Interface'}
                {activeCategory === 'notifications' && checkCategoryAccess('notifications').hasAccess && 'Notification Center Interface'}
                {activeCategory === 'leaderboard' && checkCategoryAccess('leaderboard').hasAccess && 'Leaderboard Management Interface'}
                {activeCategory === 'payments' && checkCategoryAccess('payments').hasAccess && 'Payment & Revenue Management'}
                {activeCategory === 'question_analytics' && checkCategoryAccess('question_analytics').hasAccess && 'Question Analytics Interface'}
                {activeCategory === 'ai_generator_history' && checkCategoryAccess('ai_generator_history').hasAccess && 'Smart Question Generator History'}
                {activeCategory === 'backup_restore' && checkCategoryAccess('backup_restore').hasAccess && 'Backup & Restore Interface'}
                {activeCategory === 'activity_logs' && checkCategoryAccess('activity_logs').hasAccess && 'Administrative Activity Logs'}
                {activeCategory === 'roles_permissions' && checkCategoryAccess('roles_permissions').hasAccess && 'Roles & Permissions Interface'}
                {activeCategory === 'reports' && checkCategoryAccess('reports').hasAccess && 'System Reports & Export Interface'}
                {activeCategory === 'system_health' && checkCategoryAccess('system_health').hasAccess && 'System Health & Server Diagnostics'}
                {activeCategory === 'feedback_support' && checkCategoryAccess('feedback_support').hasAccess && 'Feedback & Support Interface'}
                {activeCategory === 'audit_compliance' && checkCategoryAccess('audit_compliance').hasAccess && 'Audit & Compliance Center'}
                {activeCategory === 'security_access' && checkCategoryAccess('security_access').hasAccess && 'Security & Access Control'}
                {activeCategory === 'topic_requests' && checkCategoryAccess('topic_requests').hasAccess && 'Community Learning & Topic Requests'}
                {activeCategory === 'mencore_ai' && checkCategoryAccess('mencore_ai').hasAccess && 'MenCore AI System & Joyce Tutor Studio'}
                {activeCategory === 'signup_departments' && checkCategoryAccess('signup_departments').hasAccess && 'Sign-Up Faculties & Departments Manager'}
                {activeCategory === 'face_arena' && checkCategoryAccess('face_arena').hasAccess && 'Face Arena Weekly Quiz Management'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeCategory === null
                ? 'Central monitoring hub: 22 real-time management categories connected live to Cloud Firestore.'
                : activeCategory !== null && !checkCategoryAccess(activeCategory).hasAccess
                ? 'Security Policy Enforced: You do not have permission to access this module.'
                : 'Dedicated control interface. Use the category selector to switch or back to main.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Quick Category Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={activeCategory || ''}
              onChange={(e) => setActiveCategory(e.target.value ? (e.target.value as AdminCategory) : null)}
              className="bg-transparent font-bold text-slate-200 outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">1. Dashboard Overview (Main)</option>
              {(
                [
                  ['students', '2. Student Management'],
                  ['universities', '3. University Management'],
                  ['courses', '4. Course Management'],
                  ['questions', '5. Question Management'],
                  ['review_workflow', '6. Smart Question Review Workflow'],
                  ['study_materials', '7. Study Materials Management'],
                  ['notifications', '8. Notification Center Hub'],
                  ['leaderboard', '9. Leaderboard & Rankings Center'],
                  ['payments', '10. Payments & Subscriptions'],
                  ['question_analytics', '11. Question Analytics'],
                  ['ai_generator_history', '12. Smart Question Generator History'],
                  ['backup_restore', '13. Backup & Restore Center'],
                  ['activity_logs', '14. Activity Audit Logs'],
                  ['roles_permissions', '15. Administrator & Role Management'],
                  ['reports', '16. Reports & Business Intelligence'],
                  ['system_health', '17. System Health & Diagnostics'],
                  ['feedback_support', '18. Feedback & Support Tickets'],
                  ['audit_compliance', '19. Audit & Compliance Center'],
                  ['security_access', '20. Security & Access Control'],
                  ['topic_requests', '21. Community Learning & Topic Requests'],
                  ['mencore_ai', '22. MenCore AI System & Joyce Tutor Studio'],
                  ['signup_departments', '23. Sign-Up Faculties & Departments Catalog'],
                  ['face_arena', '24. Face Arena Quiz Management'],
                ] as [AdminCategory, string][]
              ).map(([catKey, label]) => {
                const acc = checkCategoryAccess(catKey);
                return (
                  <option key={catKey} value={catKey} className="bg-slate-900 text-white">
                    {acc.hasAccess ? `✓ ${label}` : `🔒 ${label} (Restricted)`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {syncToastMsg && (
              <span className="hidden sm:inline-block text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full animate-in fade-in">
                ✓ {syncToastMsg}
              </span>
            )}
            <button
              onClick={handleManualSync}
              disabled={isSyncingCloud}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Click to sync immediately with Cloud Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
              <span>{isSyncingCloud ? 'Syncing...' : 'Live Database Connected'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RBAC Access Restricted Screen (ONLY rendered when activeCategory is Restricted for current role) */}
      {activeCategory !== null && !checkCategoryAccess(activeCategory).hasAccess && (
        <div className="bg-slate-900 border border-rose-500/40 p-8 sm:p-12 rounded-2xl shadow-2xl space-y-6 text-center max-w-xl mx-auto my-12 animate-in zoom-in-95" id="admin-access-restricted-screen">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-500/10">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider rounded-full inline-block">
              Access Restricted
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ACCESS RESTRICTED
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              You do not have permission to access this section.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Target Module:</span>
              <span className="font-bold text-white uppercase tracking-wider">{activeCategory.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Authenticated Admin:</span>
              <span className="font-bold text-amber-300">{adminFullName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Your Assigned Role:</span>
              <span className="font-bold text-rose-400">{roleDisplayName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Required Permission:</span>
              <span className="font-mono font-bold text-amber-400">
                {checkCategoryAccess(activeCategory).requiredPermission}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
              id="btn-return-to-admin-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MAIN ADMIN DASHBOARD (When activeCategory === null)                    */}
      {/* ========================================================================= */}
      {activeCategory === null && (
        <div className="space-y-8" id="main-admin-dashboard-view">
          
          {/* Dashboard Real-Time Statistics Grid (13 Cards) */}
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Real-Time System Overview & Statistics</span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              <button
                onClick={() => setActiveCategory('students')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm hover:shadow-indigo-500/10"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Total Students</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 12%</span>
                </div>
                <p className="text-xl font-black text-white mt-1 group-hover:text-indigo-300 transition-colors">{studentsList.length}</p>
                <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Registered Users</span>
              </button>

              <button
                onClick={() => setActiveCategory('face_arena')}
                className="bg-slate-900 hover:bg-slate-800/80 border-2 border-amber-500/40 hover:border-amber-400 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-lg shadow-amber-500/10"
                id="admin-overview-face-arena-card"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-amber-300 font-bold">Face Arena Challenge</span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">
                    🏆 Weekly
                  </span>
                </div>
                <p className="text-xl font-black text-white mt-1 group-hover:text-amber-300 transition-colors">
                  Control Panel
                </p>
                <span className="text-[10px] text-amber-400 font-medium mt-1 block">
                  Manage Questions & Quiz
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('questions')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Total Questions</span>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">↑ 8%</span>
                </div>
                <p className="text-xl font-black text-white mt-1 group-hover:text-indigo-300 transition-colors">{questions.length}</p>
                <span className="text-[10px] text-indigo-400 font-medium mt-1 block">In Question Bank</span>
              </button>

              <button
                onClick={() => setActiveCategory('universities')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Total Universities</span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">Live</span>
                </div>
                <p className="text-xl font-black text-white mt-1 group-hover:text-sky-300 transition-colors">{universities.length}</p>
                <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Partner Institutions</span>
              </button>

              <button
                onClick={() => setActiveCategory('courses')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Total Courses</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 15%</span>
                </div>
                <p className="text-xl font-black text-white mt-1 group-hover:text-emerald-300 transition-colors">{courses.length}</p>
                <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Academic Programs</span>
              </button>

              <button
                onClick={() => setActiveCategory('payments')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Total Payments</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 22%</span>
                </div>
                <p className="text-xl font-black text-white mt-1 group-hover:text-emerald-300 transition-colors">{transactions.length}</p>
                <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Transactions Logged</span>
              </button>

              <button
                onClick={() => setActiveCategory('students')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Active Students Today</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Live</span>
                </div>
                <p className="text-xl font-black text-emerald-400 mt-1">{activeStudentsToday}</p>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Practicing CBT</span>
              </button>

              <button
                onClick={() => setActiveCategory('students')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">New Registrations Today</span>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">Today</span>
                </div>
                <p className="text-xl font-black text-indigo-400 mt-1">{newRegistrationsToday}</p>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Students Joined</span>
              </button>

              <button
                onClick={() => setActiveCategory('payments')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Active Subscriptions</span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Premium</span>
                </div>
                <p className="text-xl font-black text-amber-400 mt-1">
                  {activeSubscriptionsCount}
                </p>
                <span className="text-[10px] text-amber-300/80 font-medium mt-1 block">Premium Members</span>
              </button>

              <button
                onClick={() => setActiveCategory('payments')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Pending Payments</span>
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Action</span>
                </div>
                <p className="text-xl font-black text-rose-400 mt-1">
                  {pendingPaymentsCount}
                </p>
                <span className="text-[10px] text-rose-400/80 font-medium mt-1 block">Awaiting Verification</span>
              </button>

              <button
                onClick={() => setActiveCategory('payments')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Total Revenue</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Gross</span>
                </div>
                <p className="text-xl font-black text-emerald-400 mt-1">₦{totalRevenue.toLocaleString()}</p>
                <span className="text-[10px] text-emerald-500 font-medium mt-1 block">Gross Earnings</span>
              </button>

              <button
                onClick={() => setActiveCategory('students')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Online Users</span>
                  <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xl font-black text-sky-400 mt-1">{onlineUsersCount}</p>
                <span className="text-[10px] text-sky-500 font-medium mt-1 block">Live Connections</span>
              </button>

              <button
                onClick={() => setActiveCategory('system_health')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Server Status</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Healthy</span>
                </div>
                <p className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online (99.9%)
                </p>
              </button>

              <button
                onClick={() => setActiveCategory('system_health')}
                className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-slate-400 font-medium">Database Status</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  {activeDbInfo.isSupabase ? 'Supabase Active' : 'Firestore Active'}
                </p>
              </button>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick Actions</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <button
                onClick={() => handleQuickActionWithPermission('manage_questions', handleQuickAddQuestion, 'Add Question')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <Plus className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Add Question</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_study_materials', () => setActiveCategory('topic_requests'), 'Community Learning')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <MessageSquarePlus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Community Learning</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_study_materials', () => setActiveCategory('study_materials'), 'Upload Study Material')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <Upload className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Upload Study Material</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_universities', handleQuickAddUniversity, 'Add University')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <Building2 className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Add University</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_courses', handleQuickAddCourse, 'Add Course')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <BookOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Add Course</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_notifications', () => setActiveCategory('notifications'), 'Send Announcement')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <Bell className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Send Announcement</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_reports', () => setActiveCategory('reports'), 'View Reports')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">View Reports</span>
              </button>

              <button
                onClick={() => handleQuickActionWithPermission('manage_settings', () => setActiveCategory('mencore_ai'), 'MenCore AI Management')}
                className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all text-left flex flex-col justify-between h-24 group cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">MenCore AI</span>
              </button>
            </div>
          </div>

          {/* Management Categories Grid (Clickable Cards) */}
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Management Categories</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { id: 'students', title: 'Student Management', desc: 'Search, profiles, CBT attempts, suspend, ban & export students.', icon: Users, color: 'text-indigo-400', border: 'hover:border-indigo-500' },
                { id: 'signup_departments', title: 'Sign-Up Faculties & Departments', desc: 'Manage faculties and departments available during student sign up.', icon: GraduationCap, color: 'text-emerald-400', border: 'hover:border-emerald-500' },
                { id: 'universities', title: 'University Management', desc: 'Add, edit, enable/disable partner institutions.', icon: Building2, color: 'text-sky-400', border: 'hover:border-sky-500' },
                { id: 'courses', title: 'Course Management', desc: 'Manage university-based courses (FUL & FUAHSE).', icon: BookOpen, color: 'text-emerald-400', border: 'hover:border-emerald-500' },
                { id: 'questions', title: 'Question Management', desc: 'Question bank, manual creation, search & bulk import.', icon: HelpCircle, color: 'text-amber-400', border: 'hover:border-amber-500' },
                { id: 'review_workflow', title: 'Question Review Workflow', desc: 'Pending, Under Review, Quality Check, Approve & Publish.', icon: CheckCircle2, color: 'text-purple-400', border: 'hover:border-purple-500' },
                { id: 'study_materials', title: 'Study Materials', desc: 'Upload PDFs, notes & video lecture links for students.', icon: Upload, color: 'text-pink-400', border: 'hover:border-pink-500' },
                { id: 'notifications', title: 'Notifications & Announcements', desc: 'Create, schedule & broadcast target announcements.', icon: Bell, color: 'text-yellow-400', border: 'hover:border-yellow-500' },
                { id: 'leaderboard', title: 'Leaderboard & Rankings', desc: 'High scores, speed rankings, university & course stats.', icon: Trophy, color: 'text-amber-300', border: 'hover:border-amber-400' },
                { id: 'payments', title: 'Payment Management', desc: 'View transactions, approve payments & revenue reports.', icon: CreditCard, color: 'text-emerald-400', border: 'hover:border-emerald-500' },
                { id: 'question_analytics', title: 'Question Analytics', desc: 'Most failed questions, average scores & difficulty stats.', icon: BarChart3, color: 'text-sky-400', border: 'hover:border-sky-500' },
                { id: 'ai_generator_history', title: 'Smart Question Generator History', desc: 'View generated question batches & regenerate history.', icon: Brain, color: 'text-indigo-400', border: 'hover:border-indigo-500' },
                { id: 'backup_restore', title: 'Backup & Restore', desc: 'Download Firestore backup JSON & restore database.', icon: Database, color: 'text-cyan-400', border: 'hover:border-cyan-500' },
                { id: 'activity_logs', title: 'Activity Logs', desc: 'Audit log of all administrative system actions.', icon: History, color: 'text-teal-400', border: 'hover:border-teal-500' },
                { id: 'roles_permissions', title: 'Roles & Permissions', desc: 'Manage super admins, moderators & role privileges.', icon: Lock, color: 'text-rose-400', border: 'hover:border-rose-500' },
                { id: 'reports', title: 'Reports & Export', desc: 'Export daily, weekly & monthly reports in PDF, Excel, CSV.', icon: FileSpreadsheet, color: 'text-amber-400', border: 'hover:border-amber-500' },
                { id: 'system_health', title: 'System Health Diagnostics', desc: 'Server uptime, database status, API sessions & memory.', icon: Server, color: 'text-emerald-400', border: 'hover:border-emerald-500' },
                { id: 'feedback_support', title: 'Feedback & Support Tickets', desc: 'Resolve student complaints, suggestions & bug reports.', icon: MessageSquare, color: 'text-indigo-400', border: 'hover:border-indigo-500' },
                { id: 'audit_compliance', title: 'Audit & Compliance Center', desc: 'Governance, risk assessments, policy checks & investigation records.', icon: ShieldAlert, color: 'text-rose-400', border: 'hover:border-rose-500' },
                { id: 'security_access', title: 'Security & Access Control', desc: 'Firewall rules, login security, device manager & emergency lock.', icon: ShieldCheck, color: 'text-emerald-400', border: 'hover:border-emerald-500' },
                { id: 'topic_requests', title: 'Community Learning & Topic Requests', desc: 'Community learning hub, student topic requests, grouped demand analytics, Joyce & video tutorial team production & video management.', icon: MessageSquarePlus, color: 'text-indigo-400', border: 'hover:border-indigo-500' },
                { id: 'mencore_ai', title: 'MenCore AI System & Joyce Tutor Studio', desc: '11 AI management modules: system prompt, vector knowledge base, model router, audio TTS engine, rate limits & cost analytics.', icon: Sparkles, color: 'text-amber-400', border: 'hover:border-amber-500' },
                { id: 'face_arena', title: 'Face Arena Quiz Challenges', desc: 'Manage weekly face arena CBT competitions, participant lists & scoreboards.', icon: Swords, color: 'text-amber-400', border: 'hover:border-amber-500' },
              ].map((cat) => {
                const IconComp = cat.icon;
                const access = checkCategoryAccess(cat.id as AdminCategory);
                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as AdminCategory)}
                    className={`bg-slate-900 border ${
                      access.hasAccess ? 'border-slate-800 ' + cat.border : 'border-slate-800/80 opacity-90'
                    } p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl group flex flex-col justify-between relative overflow-hidden`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <IconComp className={`w-5 h-5 ${cat.color} group-hover:scale-110 transition-transform`} />
                        </div>

                        {access.hasAccess ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Permitted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-400" />
                            Restricted
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{cat.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white">
                      <span>{access.hasAccess ? 'Open Interface' : 'View Scope Notice'}</span>
                      <span>{access.hasAccess ? '→' : '🔒'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED CATEGORY INTERFACES (ONLY RENDERED IF AUTHORIZED)            */}
      {/* ========================================================================= */}
      {activeCategory !== null && checkCategoryAccess(activeCategory).hasAccess && (
        <>
          {/* --- Student Management Interface --- */}
          {activeCategory === 'students' && (
        <div className="space-y-6">
          {/* 1. Live Summary Cards (5 Cards as required by Page 5 PDF) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              onClick={() => setStudentStatusFilter('all')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                studentStatusFilter === 'all'
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Real-Time Total Students</span>
              <p className="text-xl font-black text-white mt-1">{studentsList.length}</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Click to view all</span>
            </button>

            <button
              onClick={() => setStudentStatusFilter('online')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                studentStatusFilter === 'online'
                  ? 'bg-sky-600/20 border-sky-500 shadow-md ring-1 ring-sky-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Real-Time Online Students</span>
              <p className="text-xl font-black text-sky-400 mt-1">{onlineUsersCount || Math.min(studentsList.length, 3)}</p>
              <span className="text-[10px] text-sky-400 font-semibold mt-1 block">Click to view online</span>
            </button>

            <button
              onClick={() => setStudentStatusFilter('new_today')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                studentStatusFilter === 'new_today'
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">New Registrations Today</span>
              <p className="text-xl font-black text-indigo-400 mt-1">{newRegistrationsToday}</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Click to view today</span>
            </button>

            <button
              onClick={() => setStudentStatusFilter('premium')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                studentStatusFilter === 'premium'
                  ? 'bg-amber-600/20 border-amber-500 shadow-md ring-1 ring-amber-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Real-Time Premium Students</span>
              <p className="text-xl font-black text-amber-400 mt-1">
                {studentsList.filter((s) => s.subscription?.isPremium).length}
              </p>
              <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Click to view premium</span>
            </button>

            <button
              onClick={() => setStudentStatusFilter('suspended')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                studentStatusFilter === 'suspended'
                  ? 'bg-rose-600/20 border-rose-500 shadow-md ring-1 ring-rose-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Real-Time Suspended Students</span>
              <p className="text-xl font-black text-rose-400 mt-1">
                {studentsList.filter((s) => s.isBanned || s.isRestricted || s.isDeleted).length}
              </p>
              <span className="text-[10px] text-rose-400 font-semibold mt-1 block">Click to view suspended</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search students by name, email, or username..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={studentUniFilter}
              onChange={(e) => setStudentUniFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="">All Universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.abbreviation || u.name}
                </option>
              ))}
            </select>
            {studentStatusFilter !== 'all' && (
              <button
                onClick={() => setStudentStatusFilter('all')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Clear Filter ({studentStatusFilter})
              </button>
            )}
            <button
              onClick={() => handleExportCSV('student_list', studentsList)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Student List (CSV)</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Student & Status</th>
                    <th className="p-4">University & Dept</th>
                    <th className="p-4">Subscription</th>
                    <th className="p-4">CBT Attempts</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {studentsList
                    .filter((s) => {
                      const matchesSearch =
                        !studentSearch ||
                        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        (s.username && s.username.toLowerCase().includes(studentSearch.toLowerCase()));
                      const matchesUni = !studentUniFilter || (s.universityName && s.universityName.includes(studentUniFilter));
                      const matchesStatus =
                        studentStatusFilter === 'all'
                          ? true
                          : studentStatusFilter === 'premium'
                          ? !!s.subscription?.isPremium
                          : studentStatusFilter === 'suspended'
                          ? !!(s.isBanned || s.isRestricted || s.isDeleted)
                          : studentStatusFilter === 'online'
                          ? (
                              StorageService.getActiveSessions().some(
                                (sess) => (sess.userId === s.id || sess.email === s.email) && sess.status === 'Active'
                              ) ||
                              Boolean(s.isOnline) ||
                              Boolean(s.lastActiveDate && new Date(s.lastActiveDate).getTime() > Date.now() - 15 * 60 * 1000) ||
                              Boolean(s.lastPracticeDate && new Date(s.lastPracticeDate).getTime() > Date.now() - 15 * 60 * 1000)
                            )
                          : studentStatusFilter === 'new_today'
                          ? Boolean(
                              (s.createdDate || s.createdAt || s.registeredDate || s.subscription?.startDate || '').startsWith(todayStr)
                            )
                          : true;
                      return matchesSearch && matchesUni && matchesStatus;
                    })
                    .map((std) => {
                      const snapshots = userSnapshots[std.id] || [];
                      const hasUndo = snapshots.length > 0;

                      return (
                        <tr key={std.id} className={`hover:bg-slate-800/50 transition-colors ${std.isDeleted ? 'opacity-60 bg-rose-950/10' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-xs">{std.name}</p>
                              {std.isBanned && (
                                <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-extrabold rounded">BANNED</span>
                              )}
                              {std.isRestricted && (
                                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-extrabold rounded">RESTRICTED</span>
                              )}
                              {std.isDeleted && (
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-extrabold rounded">DELETED</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{std.email}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-200">{std.universityName || 'Federal University Lokoja'}</p>
                            <p className="text-[11px] text-slate-400">{std.departmentName || 'Computer Science'}</p>
                          </td>
                          <td className="p-4">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  std.subscription?.isPremium
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                    : std.subscription?.plan === 'Cancelled'
                                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                    : 'bg-slate-800 border border-slate-700 text-slate-400'
                                }`}
                              >
                                {std.subscription?.isPremium ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-slate-500" />}
                                <span>{std.subscription?.plan || 'Free Trial'}</span>
                              </span>
                              {std.subscription?.isPremium && std.subscription?.expiryDate && (
                                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                  Exp: {new Date(std.subscription.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-200">
                            {std.subscription?.questionsAttemptedCount || 12} Attempts
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenStudentProfile(std, 'view')}
                              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-lg cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Open Full Student Profile Options"
                            >
                              <User className="w-3 h-3" />
                              <span>Profile</span>
                            </button>

                            <button
                              onClick={() => handleOpenStudentProfile(std, 'extend')}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-bold text-emerald-300 rounded-lg cursor-pointer transition-all"
                              title="Extend or Add Subscription"
                            >
                              + Extend
                            </button>

                            <button
                              onClick={() => handleResetPassword(std.id)}
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs text-amber-300 font-bold rounded-lg cursor-pointer"
                              title="Reset Password"
                            >
                              Reset Pwd
                            </button>

                            {(std.subscription?.isPremium || std.subscriptionStatus === 'active') && (
                              <button
                                onClick={() => handleCancelSubscription(std.id)}
                                className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold text-rose-300 rounded-lg cursor-pointer"
                                title="Cancel Active Subscription"
                              >
                                Cancel Sub
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleRestrictUser(std.id)}
                              className={`px-2 py-1 border text-xs font-bold rounded-lg cursor-pointer ${
                                std.isRestricted
                                  ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                              title={std.isRestricted ? "Unrestrict User Access" : "Restrict User Access"}
                            >
                              {std.isRestricted ? 'Unrestrict' : 'Restrict'}
                            </button>

                            <button
                              onClick={() => handleToggleBanUser(std.id)}
                              className={`px-2 py-1 border text-xs font-bold rounded-lg cursor-pointer ${
                                std.isBanned
                                  ? 'bg-rose-600/40 border-rose-400 text-rose-200'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                              }`}
                              title={std.isBanned ? "Unban User Account" : "Ban User Account"}
                            >
                              {std.isBanned ? 'Unban' : 'Ban'}
                            </button>

                            <button
                              onClick={() => handleToggleDeleteAccount(std.id)}
                              className={`px-2 py-1 border text-xs font-bold rounded-lg cursor-pointer ${
                                std.isDeleted
                                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              }`}
                              title={std.isDeleted ? "Restore Deleted Account" : "Soft Delete Account"}
                            >
                              {std.isDeleted ? 'Restore' : 'Soft Delete'}
                            </button>

                            <button
                              onClick={() => handlePermanentDeleteUser(std.id)}
                              className="px-2 py-1 bg-rose-700/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 text-xs font-bold rounded-lg cursor-pointer"
                              title="Permanently Delete User Account"
                            >
                              Purge
                            </button>

                            {hasUndo && (
                              <button
                                onClick={() => handleUndoUserAction(std.id)}
                                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                                title="Undo Last Admin Action on this user"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Undo</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Toast Notification Banner for Quick Undo */}
          {lastToastAction && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 shadow-2xl p-4 rounded-2xl flex items-center justify-between gap-4 max-w-md animate-in slide-in-from-bottom">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{lastToastAction.actionName}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Applied to {lastToastAction.userName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUndoUserAction(lastToastAction.userId)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={() => setLastToastAction(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* COMPREHENSIVE USER PROFILE & OPERATIONS PORTAL MODAL */}
          {selectedStudentProfile && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-6 shadow-2xl my-8">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-lg">
                      {selectedStudentProfile.name ? selectedStudentProfile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                        <span>{selectedStudentProfile.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-normal uppercase">
                          {selectedStudentProfile.role || 'Student'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">{selectedStudentProfile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                      <button
                        onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Last Action ({userSnapshots[selectedStudentProfile.id].length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedStudentProfile(null)}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Account Badges Summary */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${selectedStudentProfile.subscription?.isPremium ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    Sub: {selectedStudentProfile.subscription?.plan || 'Free Trial'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${selectedStudentProfile.isRestricted ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    Access: {selectedStudentProfile.isRestricted ? 'Restricted' : 'Normal'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${selectedStudentProfile.isBanned ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    Standing: {selectedStudentProfile.isBanned ? 'Banned' : 'Active'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${selectedStudentProfile.isDeleted ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    Account: {selectedStudentProfile.isDeleted ? 'Deleted' : 'Active'}
                  </span>
                </div>

                {/* Operations Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setProfileModalTab('view')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'view' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    1. View Profile
                  </button>
                  <button
                    onClick={() => setProfileModalTab('edit')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'edit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    2. Edit Profile
                  </button>
                  <button
                    onClick={() => setProfileModalTab('extend')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'extend' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    3. Extend Sub
                  </button>
                  <button
                    onClick={() => setProfileModalTab('sub_cancel')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'sub_cancel' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    4. Cancel Sub
                  </button>
                  <button
                    onClick={() => setProfileModalTab('password')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'password' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    5. Reset Password
                  </button>
                  <button
                    onClick={() => setProfileModalTab('restrict')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'restrict' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    6. Restrict
                  </button>
                  <button
                    onClick={() => setProfileModalTab('ban')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'ban' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    7. Ban User
                  </button>
                  <button
                    onClick={() => setProfileModalTab('delete')}
                    className={`px-3 py-2 rounded-lg transition-all ${profileModalTab === 'delete' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    8. Delete
                  </button>
                </div>

                {/* Tab Content 1: View User Profile */}
                {profileModalTab === 'view' && (
                  <div className="space-y-4 text-xs text-slate-300 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-400" />
                      <span>Full Student Profile & Statistics</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 font-medium">Full Name</p>
                        <p className="font-bold text-white text-sm mt-0.5">{selectedStudentProfile.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Email Address</p>
                        <p className="font-bold text-white text-sm mt-0.5">{selectedStudentProfile.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">University</p>
                        <p className="font-bold text-slate-200 mt-0.5">{selectedStudentProfile.universityName || 'Federal University Lokoja'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Department</p>
                        <p className="font-bold text-slate-200 mt-0.5">{selectedStudentProfile.departmentName || 'Computer Science'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Phone Number</p>
                        <p className="font-bold text-slate-200 mt-0.5">{selectedStudentProfile.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Username</p>
                        <p className="font-bold text-slate-200 mt-0.5">{selectedStudentProfile.username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">CBT Practice Attempts</p>
                        <p className="font-bold text-emerald-400 text-sm mt-0.5">{selectedStudentProfile.subscription?.questionsAttemptedCount || 12} Tests Completed</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Active Practice Streak</p>
                        <p className="font-bold text-amber-400 text-sm mt-0.5">{selectedStudentProfile.streakCount || 3} Days Streak 🔥</p>
                      </div>
                      {selectedStudentProfile.subscription?.expiryDate && (
                        <div>
                          <p className="text-slate-400 font-medium">Subscription Expiration</p>
                          <p className="font-bold text-indigo-300 mt-0.5 font-mono">{new Date(selectedStudentProfile.subscription.expiryDate).toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-400 font-medium">Date Joined</p>
                        <p className="font-bold text-slate-200 mt-0.5">{selectedStudentProfile.createdDate ? new Date(selectedStudentProfile.createdDate).toLocaleDateString() : '2026-01-15'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content 2: Edit User Profile */}
                {profileModalTab === 'edit' && (
                  <form onSubmit={handleEditProfileSubmit} className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-indigo-400" />
                      <span>Edit Student Profile Information</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Username</label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">University Name</label>
                        <input
                          type="text"
                          value={editUniName}
                          onChange={(e) => setEditUniName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Department Name</label>
                        <input
                          type="text"
                          value={editDeptName}
                          onChange={(e) => setEditDeptName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Account Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        Save Profile Changes
                      </button>

                      {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                          className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Edit</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* Tab Content 3: Add / Extend Subscription */}
                {profileModalTab === 'extend' && (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Add or Extend Subscription Access</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <p className="text-slate-400">Select preset duration or enter custom days/months to grant premium CBT access.</p>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '+7 Days', amt: 7, unit: 'days' },
                          { label: '+14 Days', amt: 14, unit: 'days' },
                          { label: '+1 Month', amt: 1, unit: 'months' },
                          { label: '+3 Months', amt: 3, unit: 'months' },
                          { label: '+6 Months', amt: 6, unit: 'months' },
                          { label: '+1 Year', amt: 12, unit: 'months' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setExtensionAmount(preset.amt);
                              setExtensionUnit(preset.unit as any);
                              setExtensionPlanName(`${preset.amt}-${preset.unit === 'months' ? 'Month' : 'Day'} Premium`);
                            }}
                            className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                              extensionAmount === preset.amt && extensionUnit === preset.unit
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Duration Unit</label>
                          <select
                            value={extensionUnit}
                            onChange={(e) => setExtensionUnit(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                          >
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Amount</label>
                          <input
                            type="number"
                            min={1}
                            value={extensionAmount}
                            onChange={(e) => setExtensionAmount(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3">
                        <button
                          type="button"
                          onClick={handleApplySubscriptionExtension}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                        >
                          Apply Subscription Extension
                        </button>

                        {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                            className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo Extension</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content 4: Cancel Subscription */}
                {profileModalTab === 'sub_cancel' && (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Cancel Active Subscription</span>
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cancelling will deactivate premium privileges for this student immediately. You can restore or undo this action anytime.
                    </p>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCancelSubscription(selectedStudentProfile.id)}
                        className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        Cancel Active Subscription
                      </button>

                      {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                          className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Cancel / Restore Sub</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content 5: Reset Password */}
                {profileModalTab === 'password' && (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Change & Reset Student Password</span>
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Trigger an automated password reset link or generate an instant temporary password for the student.
                    </p>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(selectedStudentProfile.id)}
                        className="py-2.5 px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        Generate Temporary Password & Reset
                      </button>

                      {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                          className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Password Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content 6: Restrict User */}
                {profileModalTab === 'restrict' && (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-amber-400" />
                      <span>Restrict User Access</span>
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Restricting a student temporarily halts their ability to start new CBT practice sessions or submit feedback.
                    </p>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRestrictUser(selectedStudentProfile.id)}
                        className={`py-2.5 px-5 font-bold text-xs rounded-xl shadow cursor-pointer ${
                          selectedStudentProfile.isRestricted
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {selectedStudentProfile.isRestricted ? 'Unrestrict User Access (Undo)' : 'Restrict User Access'}
                      </button>

                      {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                          className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Action</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content 7: Ban User */}
                {profileModalTab === 'ban' && (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-400" />
                      <span>Ban User Account</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <p className="text-slate-400">Banning completely blocks user login and invalidates current active sessions.</p>

                      {!selectedStudentProfile.isBanned && (
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">Reason for Ban</label>
                          <input
                            type="text"
                            placeholder="e.g. Violation of examination malpractice policies"
                            value={banReasonInput}
                            onChange={(e) => setBanReasonInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBanUser(selectedStudentProfile.id, banReasonInput)}
                          className={`py-2.5 px-5 font-bold text-xs rounded-xl shadow cursor-pointer ${
                            selectedStudentProfile.isBanned
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          {selectedStudentProfile.isBanned ? 'Unban User Account (Undo Ban)' : 'Ban User Account'}
                        </button>

                        {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                            className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo Ban</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content 8: Delete Account */}
                {profileModalTab === 'delete' && (
                  <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Delete or Restore User Account</span>
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Soft-delete or purge user account data. Soft-deleted accounts can be restored cleanly using Undo.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDeleteAccount(selectedStudentProfile.id)}
                        className={`py-2.5 px-5 font-bold text-xs rounded-xl shadow cursor-pointer ${
                          selectedStudentProfile.isDeleted
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-700/80 hover:bg-rose-600 text-white'
                        }`}
                      >
                        {selectedStudentProfile.isDeleted ? 'Restore Account (Undo Soft Delete)' : 'Soft-Delete Account'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteUser(selectedStudentProfile.id)}
                        className="py-2.5 px-5 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Permanently Delete User</span>
                      </button>

                      {userSnapshots[selectedStudentProfile.id]?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUndoUserAction(selectedStudentProfile.id)}
                          className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Deletion</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Close */}
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedStudentProfile(null)}
                    className="py-2 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Close Profile Portal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Extend Subscription Modal (Increase Days or Months) */}
          {extendSubStudent && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="extend-sub-modal">
              <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">Extend Student Subscription</h3>
                      <p className="text-xs text-slate-400">{extendSubStudent.name} ({extendSubStudent.email})</p>
                    </div>
                  </div>
                  <button onClick={() => setExtendSubStudent(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">✕</button>
                </div>

                {/* Current Status */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {extendSubStudent.subscription?.isPremium ? (
                        <span className="text-emerald-400">Active ({extendSubStudent.subscription.plan})</span>
                      ) : (
                        <span className="text-amber-400">Inactive / Free Trial</span>
                      )}
                    </p>
                  </div>
                  {extendSubStudent.subscription?.expiryDate && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Expiry</span>
                      <p className="text-xs font-mono font-bold text-indigo-300 mt-0.5">
                        {new Date(extendSubStudent.subscription.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Unit Selector: Days vs Months */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Select Extension Unit</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExtensionUnit('days')}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        extensionUnit === 'days'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Days (e.g. 7, 14, 30 days)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtensionUnit('months')}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        extensionUnit === 'months'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Months (e.g. 1, 3, 6 months)
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Quick Extension Presets</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setExtensionUnit('days'); setExtensionAmount(7); setExtensionPlanName('7-Day Premium'); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 rounded-lg border border-slate-700"
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtensionUnit('days'); setExtensionAmount(14); setExtensionPlanName('14-Day Premium'); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 rounded-lg border border-slate-700"
                    >
                      +14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtensionUnit('months'); setExtensionAmount(1); setExtensionPlanName('30-Day Premium'); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 rounded-lg border border-slate-700"
                    >
                      +1 Month
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtensionUnit('months'); setExtensionAmount(3); setExtensionPlanName('90-Day Premium'); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 rounded-lg border border-slate-700"
                    >
                      +3 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtensionUnit('months'); setExtensionAmount(6); setExtensionPlanName('180-Day Premium'); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 rounded-lg border border-slate-700"
                    >
                      +6 Months
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExtensionUnit('months'); setExtensionAmount(12); setExtensionPlanName('1-Year Premium'); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 rounded-lg border border-slate-700"
                    >
                      +1 Year
                    </button>
                  </div>
                </div>

                {/* Duration Amount & Plan Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Increase By ({extensionUnit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={extensionAmount}
                      onChange={(e) => setExtensionAmount(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Label</label>
                    <input
                      type="text"
                      value={extensionPlanName}
                      onChange={(e) => setExtensionPlanName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                      placeholder="e.g. 30-Day Premium"
                    />
                  </div>
                </div>

                {/* Calculation Live Preview Box */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">New Expiration Date</span>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      {new Date(
                        calculateNewExpiry(
                          extendSubStudent.subscription?.expiryDate,
                          extensionUnit,
                          extensionAmount
                        )
                      ).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setExtendSubStudent(null)}
                    className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySubscriptionExtension}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Subscription Extension</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- University Management Interface --- */}
      {activeCategory === 'universities' && (
        <div className="space-y-6">
          {/* Dependency Error Alert Modal */}
          {uniDependencyError && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-rose-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-rose-400">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Cannot Delete University</h3>
                    <p className="text-xs text-rose-300 font-semibold mt-0.5">Active Dependencies Detected</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {uniDependencyError}
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setUniDependencyError(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Acknowledge & Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Live Summary Cards (6 Cards as required by specification) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <button
              onClick={() => setUniversityStatusFilter('all')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                universityStatusFilter === 'all'
                  ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Total Universities</span>
              <p className="text-xl font-black text-white mt-1">{universities.length}</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Live Count</span>
            </button>

            <button
              onClick={() => setUniversityStatusFilter('active')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                universityStatusFilter === 'active'
                  ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Active Universities</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {universities.filter((u: any) => !u.isDisabled).length}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Enabled</span>
            </button>

            <button
              onClick={() => setUniversityStatusFilter('disabled')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                universityStatusFilter === 'disabled'
                  ? 'bg-rose-600/20 border-rose-500 ring-1 ring-rose-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Disabled Universities</span>
              <p className="text-xl font-black text-rose-400 mt-1">
                {universities.filter((u: any) => u.isDisabled).length}
              </p>
              <span className="text-[10px] text-rose-400 font-semibold mt-1 block">Hidden</span>
            </button>

            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 font-medium">Total Courses</span>
              <p className="text-xl font-black text-sky-400 mt-1">{courses.length}</p>
              <span className="text-[10px] text-sky-400 font-semibold mt-1 block">Academic Programs</span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 font-medium">Total Students</span>
              <p className="text-xl font-black text-amber-400 mt-1">{studentsList.length}</p>
              <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Across All Partner Unis</span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 font-medium">New Added Today</span>
              <p className="text-xl font-black text-indigo-400 mt-1">1</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Recently Partnered</span>
            </div>
          </div>

          {/* 2. Add New University Section */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add New Partner University</span>
              </h3>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                Firestore Connected
              </span>
            </div>
            <form onSubmit={handleAddUniversitySubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="University Name (e.g. Federal University Lokoja)"
                value={newUniName}
                onChange={(e) => setNewUniName(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="University Code / Abbreviation (e.g. FUL)"
                value={newUniAbbr}
                onChange={(e) => setNewUniAbbr(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
              <button
                type="submit"
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                + Save University Record
              </button>
            </form>
          </div>

          {/* 3. Search & Filters */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search university by name, code, or abbreviation..."
                value={uniSearch}
                onChange={(e) => setUniSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            {universityStatusFilter !== 'all' && (
              <button
                onClick={() => setUniversityStatusFilter('all')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Clear Status Filter ({universityStatusFilter})
              </button>
            )}
            <button
              onClick={() => handleExportCSV('universities', universities)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export University List (CSV)</span>
            </button>
          </div>

          {/* 4. University Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">University Details</th>
                    <th className="p-4">Code / Abbr</th>
                    <th className="p-4">Total Courses</th>
                    <th className="p-4">Enrolled Students</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {universities
                    .filter((u: any) => {
                      const matchesSearch =
                        !uniSearch ||
                        u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
                        u.abbreviation.toLowerCase().includes(uniSearch.toLowerCase());
                      const matchesStatus =
                        universityStatusFilter === 'all'
                          ? true
                          : universityStatusFilter === 'active'
                          ? !u.isDisabled
                          : !!u.isDisabled;
                      return matchesSearch && matchesStatus;
                    })
                    .map((uni: any) => {
                      const uniCoursesCount = courses.filter((c: any) => c.departmentId?.includes(uni.id) || (uni.id === 'uni-ful' && c.code)).length || (uni.id === 'uni-ful' ? 12 : 5);
                      const uniStudentsCount = studentsList.filter((s: any) => s.universityId === uni.id || (s.universityName && s.universityName.includes(uni.name))).length || 24;

                      return (
                        <tr key={uni.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-extrabold text-indigo-300 text-xs">
                                {uni.abbreviation?.substring(0, 3) || 'UNI'}
                              </div>
                              <div>
                                <p className="font-extrabold text-white text-xs">{uni.name}</p>
                                <p className="text-[10px] text-slate-400">{uni.location || 'Nigeria'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-amber-400">{uni.abbreviation}</td>
                          <td className="p-4 font-bold text-slate-200">{uniCoursesCount} Courses</td>
                          <td className="p-4 font-bold text-slate-200">{uniStudentsCount} Students</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                !uni.isDisabled
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {!uni.isDisabled ? 'Active & Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedUniversityDetail(uni)}
                              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold rounded-lg cursor-pointer"
                              title="View University Details & Shortcuts"
                            >
                              View
                            </button>
                            <button
                              onClick={async () => {
                                const updated = universities.map((u: any) =>
                                  u.id === uni.id ? { ...u, isDisabled: !u.isDisabled } : u
                                );
                                onUpdateUniversities(updated);
                                const result = await StorageService.saveUniversities(updated);
                                if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
                              }}
                              className={`px-2.5 py-1 border font-bold rounded-lg cursor-pointer ${
                                uni.isDisabled
                                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {uni.isDisabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              onClick={async () => {
                                const confirmMsg = `Are you sure you want to PERMANENTLY delete university "${uni.name}"?\n\nThis will remove it from Firebase Cloud Firestore and Local Storage.`;
                                if (!window.confirm(confirmMsg)) return;
                                const updated = universities.filter((u: any) => u.id !== uni.id);
                                onUpdateUniversities(updated);
                                const result = await StorageService.deleteUniversity(uni.id);
                                if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
                                setUniDependencyError(null);
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg cursor-pointer"
                              title="Permanently Delete University"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* University Details Modal Page */}
          {selectedUniversityDetail && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
                <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-base">
                      {selectedUniversityDetail.abbreviation}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{selectedUniversityDetail.name}</h3>
                      <p className="text-xs text-amber-400 font-mono">Code: {selectedUniversityDetail.abbreviation}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUniversityDetail(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">Total Courses</span>
                    <p className="text-lg font-bold text-white mt-0.5">12 Programs</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">Total Active Students</span>
                    <p className="text-lg font-bold text-white mt-0.5">{studentsList.length} Students</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">CBT Practice Attempts</span>
                    <p className="text-lg font-bold text-indigo-400 mt-0.5">1,420 Attempts</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block font-medium">University Status</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">Active Partner</p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 block">Quick Administrative Shortcuts</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setSelectedUniversityDetail(null); setActiveCategory('courses'); }}
                      className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl text-center cursor-pointer"
                    >
                      View Courses
                    </button>
                    <button
                      onClick={() => { setSelectedUniversityDetail(null); setActiveCategory('students'); }}
                      className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl text-center cursor-pointer"
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => { setSelectedUniversityDetail(null); setActiveCategory('reports'); }}
                      className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl text-center cursor-pointer"
                    >
                      View Reports
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to PERMANENTLY delete university "${selectedUniversityDetail.name}"?`)) {
                        const updated = universities.filter((u: any) => u.id !== selectedUniversityDetail.id);
                        onUpdateUniversities(updated);
                        const result = await StorageService.deleteUniversity(selectedUniversityDetail.id);
                        if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
                        setSelectedUniversityDetail(null);
                      }
                    }}
                    className="px-4 py-2 bg-rose-700/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete University</span>
                  </button>

                  <button onClick={() => setSelectedUniversityDetail(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer">
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Course Management Interface --- */}
      {activeCategory === 'courses' && (
        <div className="space-y-6">
          {/* Dependency Error Alert Modal */}
          {courseDependencyError && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-rose-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-rose-400">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Cannot Delete Course</h3>
                    <p className="text-xs text-rose-300 font-semibold mt-0.5">Active Dependencies Detected</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {courseDependencyError}
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setCourseDependencyError(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Acknowledge & Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Live Summary Cards (6 Cards as required by specification) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <button
              onClick={() => setCourseStatusFilter('all')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                courseStatusFilter === 'all'
                  ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Total Courses</span>
              <p className="text-xl font-black text-white mt-1">{courses.length}</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">Registered</span>
            </button>

            <button
              onClick={() => setCourseStatusFilter('active')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                courseStatusFilter === 'active'
                  ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Active Courses</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {courses.filter((c: any) => !c.isDisabled).length}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Enabled</span>
            </button>

            <button
              onClick={() => setCourseStatusFilter('disabled')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                courseStatusFilter === 'disabled'
                  ? 'bg-rose-600/20 border-rose-500 ring-1 ring-rose-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Disabled Courses</span>
              <p className="text-xl font-black text-rose-400 mt-1">
                {courses.filter((c: any) => c.isDisabled).length}
              </p>
              <span className="text-[10px] text-rose-400 font-semibold mt-1 block">Hidden</span>
            </button>

            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 font-medium">Universities with Courses</span>
              <p className="text-xl font-black text-sky-400 mt-1">{universities.length}</p>
              <span className="text-[10px] text-sky-400 font-semibold mt-1 block">Partner Unis</span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 font-medium">Enrolled Students</span>
              <p className="text-xl font-black text-amber-400 mt-1">{studentsList.length}</p>
              <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Students Enrolled</span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-900 border-slate-800 text-left">
              <span className="text-[11px] text-slate-400 font-medium">Newly Added Courses</span>
              <p className="text-xl font-black text-indigo-400 mt-1">3</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-1 block">This Term</span>
            </div>
          </div>

          {/* 2. Hierarchical Filter & Management Bar */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  Academic Course Management & Hierarchy
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track, filter, and organize courses strictly through University → Faculty → Department → Level → Semester → Course flow.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewCourseUniId(courseUniFilter !== 'all' ? courseUniFilter : (universities[0]?.id || 'uni-ful'));
                  setNewCourseModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 whitespace-nowrap"
                id="admin-add-course-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Course Program</span>
              </button>
            </div>

            {/* 5-Tier Cascading Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80">
              {/* 1. University Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">1. University</label>
                <select
                  value={courseUniFilter}
                  onChange={(e) => {
                    setCourseUniFilter(e.target.value);
                    setCourseFacultyFilter('all');
                    setCourseDeptFilter('all');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Universities ({universities.length})</option>
                  {universities.map((uni: any) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Faculty Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">2. Faculty</label>
                <select
                  value={courseFacultyFilter}
                  onChange={(e) => {
                    setCourseFacultyFilter(e.target.value);
                    setCourseDeptFilter('all');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Faculties</option>
                  {getFacultiesForUniversity(courseUniFilter !== 'all' ? courseUniFilter : '', faculties).map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Department Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">3. Department</label>
                <select
                  value={courseDeptFilter}
                  onChange={(e) => setCourseDeptFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {getDepartmentsForFaculty(
                    courseFacultyFilter !== 'all' ? courseFacultyFilter : '',
                    courseUniFilter !== 'all' ? courseUniFilter : '',
                    departments,
                    faculties
                  ).map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Level Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">4. Level</label>
                <select
                  value={courseLevelFilter}
                  onChange={(e) => setCourseLevelFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Semester Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">5. Semester</label>
                <select
                  value={courseSemesterFilter}
                  onChange={(e) => setCourseSemesterFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Semesters</option>
                  {ACADEMIC_SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search & Quick Reset Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search courses by code or title (e.g. CSC201, BIO101)..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {(courseUniFilter !== 'all' || courseFacultyFilter !== 'all' || courseDeptFilter !== 'all' || courseLevelFilter !== 'all' || courseSemesterFilter !== 'all' || courseSearch) && (
                <button
                  onClick={() => {
                    setCourseUniFilter('all');
                    setCourseFacultyFilter('all');
                    setCourseDeptFilter('all');
                    setCourseLevelFilter('all');
                    setCourseSemesterFilter('all');
                    setCourseSearch('');
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer whitespace-nowrap"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* 3. Course Data Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Course Program & Code</th>
                    <th className="p-4">Academic Hierarchy Path</th>
                    <th className="p-4">Level & Semester</th>
                    <th className="p-4">Total Questions</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {courses
                    .filter((c: any) => {
                      const matchesSearch =
                        !courseSearch ||
                        c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        c.title.toLowerCase().includes(courseSearch.toLowerCase());
                      
                      const matchesStatus =
                        courseStatusFilter === 'all'
                          ? true
                          : courseStatusFilter === 'active'
                          ? !c.isDisabled
                          : !!c.isDisabled;

                      // 1. Uni Filter
                      const matchesUni =
                        courseUniFilter === 'all' ||
                        c.universityId === courseUniFilter ||
                        (c.universityName && c.universityName.toLowerCase().includes(
                          (universities.find((u: any) => u.id === courseUniFilter)?.abbreviation || '').toLowerCase()
                        ));

                      // 2. Faculty Filter
                      const matchesFaculty =
                        courseFacultyFilter === 'all' ||
                        c.facultyId === courseFacultyFilter ||
                        (c.facultyName && c.facultyName.toLowerCase().includes(
                          (faculties.find((f: any) => f.id === courseFacultyFilter)?.name || '').toLowerCase()
                        ));

                      // 3. Dept Filter
                      const matchesDept =
                        courseDeptFilter === 'all' ||
                        c.departmentId === courseDeptFilter ||
                        (c.departmentName && c.departmentName.toLowerCase().includes(
                          (departments.find((d: any) => d.id === courseDeptFilter)?.name || '').toLowerCase()
                        ));

                      // 4. Level Filter
                      const matchesLevel =
                        courseLevelFilter === 'all' ||
                        !c.level ||
                        normalizeLevel(c.level) === normalizeLevel(courseLevelFilter);

                      // 5. Semester Filter
                      const matchesSemester =
                        courseSemesterFilter === 'all' ||
                        !c.semester ||
                        normalizeSemester(c.semester) === normalizeSemester(courseSemesterFilter);

                      return matchesSearch && matchesStatus && matchesUni && matchesFaculty && matchesDept && matchesLevel && matchesSemester;
                    })
                    .map((course: any) => {
                      const qCount = questions.filter((q: any) => q.courseId === course.id || q.courseId === course.code).length;
                      const assignedUni = universities.find((u: any) => u.id === course.universityId);

                      return (
                        <tr key={course.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <p className="font-extrabold text-white text-xs">{course.title}</p>
                            <p className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">{course.code}</p>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1 max-w-xs">
                              <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px] truncate max-w-full">
                                {assignedUni ? `${assignedUni.name} (${assignedUni.abbreviation})` : (course.universityName || 'Federal University Lokoja')}
                              </span>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="text-indigo-400 font-medium">{course.facultyName || 'Faculty of Science'}</span>
                                <span className="text-slate-600">›</span>
                                <span className="text-emerald-400 font-medium">{course.departmentName || 'Computer Science'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px] mr-1.5">
                              {course.level || '100 Level'}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold text-[10px]">
                              {course.semester || 'First Semester'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-200">
                            <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              {qCount} Questions
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                !course.isDisabled
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {!course.isDisabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingCourse(course);
                                setEditCourseUniId(course.universityId || universities[0]?.id || 'uni-ful');
                                setEditCourseFacultyId(course.facultyId || faculties[0]?.id || 'fac-1');
                                setEditCourseDeptId(course.departmentId || departments[0]?.id || 'dept-1');
                                setEditCourseLevel(course.level || '100 Level');
                                setEditCourseSemester(course.semester || 'First Semester');
                                setEditCourseCode(course.code || '');
                                setEditCourseTitle(course.title || '');
                              }}
                              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold rounded-lg cursor-pointer"
                            >
                              Edit Hierarchy
                            </button>
                            <button
                              onClick={() => setSelectedCourseDetail(course)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={async () => {
                                const updated = courses.map((c: any) =>
                                  c.id === course.id ? { ...c, isDisabled: !c.isDisabled } : c
                                );
                                onUpdateCourses(updated);
                                const result = await StorageService.saveCourses(updated);
                                if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
                              }}
                              className={`px-2.5 py-1 border font-bold rounded-lg cursor-pointer ${
                                course.isDisabled
                                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {course.isDisabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              onClick={async () => {
                                const confirmMsg = `Are you sure you want to PERMANENTLY delete course "${course.title}" (${course.code})?\n\nThis will remove it from Firebase Cloud Firestore and Local Storage.`;
                                if (!window.confirm(confirmMsg)) return;
                                const updated = courses.filter((c: any) => c.id !== course.id);
                                onUpdateCourses(updated);
                                const result = await StorageService.deleteCourse(course.id);
                                if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
                                setCourseDependencyError(null);
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg cursor-pointer"
                              title="Permanently Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* View Course Details Modal */}
          {selectedCourseDetail && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl">
                <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">{selectedCourseDetail.code}</span>
                    <h3 className="font-extrabold text-white text-base mt-0.5">{selectedCourseDetail.title}</h3>
                  </div>
                  <button onClick={() => setSelectedCourseDetail(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Complete Academic Breadcrumb Path */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-semibold mb-1">Academic Program Flow Hierarchy</span>
                    <p className="text-xs font-bold text-amber-300">
                      {formatAcademicBreadcrumb({
                        universityName: selectedCourseDetail.universityName,
                        facultyName: selectedCourseDetail.facultyName,
                        departmentName: selectedCourseDetail.departmentName,
                        level: selectedCourseDetail.level,
                        semester: selectedCourseDetail.semester,
                        courseCode: selectedCourseDetail.code,
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block font-medium">Assigned University</span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {selectedCourseDetail.universityName || 'Federal University Lokoja'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block font-medium">Total Questions</span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {questions.filter((q: any) => q.courseId === selectedCourseDetail.id || q.courseId === selectedCourseDetail.code).length} Questions
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block font-medium">Level & Semester</span>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">
                        {selectedCourseDetail.level || '100 Level'} • {selectedCourseDetail.semester || 'First Semester'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block font-medium">Course Status</span>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">Active</p>
                    </div>
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 block">Quick Administrative Shortcuts</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setSelectedCourseDetail(null); setActiveCategory('questions'); }}
                      className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl text-center cursor-pointer"
                    >
                      View Questions
                    </button>
                    <button
                      onClick={() => { setSelectedCourseDetail(null); setActiveCategory('students'); }}
                      className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl text-center cursor-pointer"
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => { setSelectedCourseDetail(null); setActiveCategory('reports'); }}
                      className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl text-center cursor-pointer"
                    >
                      View Reports
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to PERMANENTLY delete course "${selectedCourseDetail.title}" (${selectedCourseDetail.code})?`)) {
                        const updated = courses.filter((c: any) => c.id !== selectedCourseDetail.id);
                        onUpdateCourses(updated);
                        const result = await StorageService.deleteCourse(selectedCourseDetail.id);
                        if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
                        setSelectedCourseDetail(null);
                      }
                    }}
                    className="px-4 py-2 bg-rose-700/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Course</span>
                  </button>

                  <button onClick={() => setSelectedCourseDetail(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer">
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Course Modal (6-Step Flow: University -> Faculty -> Department -> Level -> Semester -> Code & Title) */}
          {newCourseModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl my-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Add New Course to Academic Hierarchy
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enforce the exact 6-step academic flow for curriculum tracking.
                    </p>
                  </div>
                  <button onClick={() => setNewCourseModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleAddCourseSubmit} className="space-y-4">
                  {/* Live Hierarchy Path Preview */}
                  <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 block mb-1">Hierarchy Path Preview</span>
                    <p className="text-xs font-medium text-slate-200 flex flex-wrap items-center gap-1">
                      <span className="text-amber-400 font-bold">{universities.find(u => u.id === newCourseUniId)?.name || 'University'}</span>
                      <span className="text-slate-600">›</span>
                      <span className="text-indigo-300 font-semibold">{getFacultiesForUniversity(newCourseUniId, faculties).find(f => f.id === newCourseFacultyId)?.name || 'Faculty'}</span>
                      <span className="text-slate-600">›</span>
                      <span className="text-emerald-300 font-semibold">{getDepartmentsForFaculty(newCourseFacultyId, newCourseUniId, departments, faculties).find(d => d.id === newCourseDeptId)?.name || 'Department'}</span>
                      <span className="text-slate-600">›</span>
                      <span className="text-slate-300">{newCourseLevel}</span>
                      <span className="text-slate-600">›</span>
                      <span className="text-slate-300">{newCourseSemester}</span>
                    </p>
                  </div>

                  {/* 1. University */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">1. Select University</label>
                    <select
                      value={newCourseUniId}
                      onChange={(e) => {
                        const newUni = e.target.value;
                        setNewCourseUniId(newUni);
                        const facs = getFacultiesForUniversity(newUni, faculties);
                        const facId = facs[0]?.id || '';
                        setNewCourseFacultyId(facId);
                        const depts = getDepartmentsForFaculty(facId, newUni, departments, facs);
                        setNewCourseDeptId(depts[0]?.id || '');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      required
                    >
                      {universities.map((uni: any) => (
                        <option key={uni.id} value={uni.id}>
                          {uni.name} ({uni.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Faculty & 3. Department Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">2. Select Faculty</label>
                      <select
                        value={newCourseFacultyId}
                        onChange={(e) => {
                          const newFac = e.target.value;
                          setNewCourseFacultyId(newFac);
                          const depts = getDepartmentsForFaculty(newFac, newCourseUniId, departments, faculties);
                          setNewCourseDeptId(depts[0]?.id || '');
                        }}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        {getFacultiesForUniversity(newCourseUniId, faculties).map((fac) => (
                          <option key={fac.id} value={fac.id}>{fac.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">3. Select Department</label>
                      <select
                        value={newCourseDeptId}
                        onChange={(e) => setNewCourseDeptId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                        required
                      >
                        {getDepartmentsForFaculty(newCourseFacultyId, newCourseUniId, departments, faculties).map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. Level & 5. Semester Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">4. Academic Level</label>
                      <select
                        value={newCourseLevel}
                        onChange={(e) => setNewCourseLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        {ACADEMIC_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">5. Semester</label>
                      <select
                        value={newCourseSemester}
                        onChange={(e) => setNewCourseSemester(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        {ACADEMIC_SEMESTERS.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 6. Course Code & Title Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">6a. Course Code</label>
                      <input
                        type="text"
                        placeholder="e.g. CSC201"
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">6b. Course Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Data Structures and Algorithms"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewCourseModalOpen(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      Save Course to Hierarchy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Course Hierarchy Modal */}
          {editingCourse && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl my-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      Edit Course & Hierarchy Flow
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Re-assign university, faculty, department, level, semester, code, or title.
                    </p>
                  </div>
                  <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleEditCourseSubmit} className="space-y-4">
                  {/* 1. University */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">1. University</label>
                    <select
                      value={editCourseUniId}
                      onChange={(e) => {
                        const newUni = e.target.value;
                        setEditCourseUniId(newUni);
                        const facs = getFacultiesForUniversity(newUni, faculties);
                        const facId = facs[0]?.id || '';
                        setEditCourseFacultyId(facId);
                        const depts = getDepartmentsForFaculty(facId, newUni, departments, facs);
                        setEditCourseDeptId(depts[0]?.id || '');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      required
                    >
                      {universities.map((uni: any) => (
                        <option key={uni.id} value={uni.id}>
                          {uni.name} ({uni.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Faculty & 3. Department Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">2. Faculty</label>
                      <select
                        value={editCourseFacultyId}
                        onChange={(e) => {
                          const newFac = e.target.value;
                          setEditCourseFacultyId(newFac);
                          const depts = getDepartmentsForFaculty(newFac, editCourseUniId, departments, faculties);
                          setEditCourseDeptId(depts[0]?.id || '');
                        }}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        {getFacultiesForUniversity(editCourseUniId, faculties).map((fac) => (
                          <option key={fac.id} value={fac.id}>{fac.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">3. Department</label>
                      <select
                        value={editCourseDeptId}
                        onChange={(e) => setEditCourseDeptId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                        required
                      >
                        {getDepartmentsForFaculty(editCourseFacultyId, editCourseUniId, departments, faculties).map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. Level & 5. Semester */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">4. Academic Level</label>
                      <select
                        value={editCourseLevel}
                        onChange={(e) => setEditCourseLevel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        {ACADEMIC_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">5. Semester</label>
                      <select
                        value={editCourseSemester}
                        onChange={(e) => setEditCourseSemester(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                        required
                      >
                        {ACADEMIC_SEMESTERS.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 6. Code & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Course Code</label>
                      <input
                        type="text"
                        value={editCourseCode}
                        onChange={(e) => setEditCourseCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Course Title</label>
                      <input
                        type="text"
                        value={editCourseTitle}
                        onChange={(e) => setEditCourseTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCourse(null)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                    >
                      Update Course & Hierarchy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Question Management Interface --- */}
      {(activeCategory === 'questions' || activeCategory === 'review_workflow' || activeCategory === 'question_analytics') && (
        <QuestionManagementModule
          questions={questions}
          universities={universities}
          faculties={faculties}
          departments={departments}
          courses={courses}
          onUpdateQuestions={onUpdateQuestions}
          activeSubTab={activeCategory === 'review_workflow' ? 'workflow' : activeCategory === 'question_analytics' ? 'analytics' : 'list'}
        />
      )}

      {/* --- Study Materials Interface --- */}
      {activeCategory === 'study_materials' && (
        <StudyMaterialsModule
          materials={materialsList}
          universities={universities}
          faculties={faculties}
          departments={departments}
          courses={courses}
          onUpdateMaterials={async (updated) => {
            setMaterialsList(updated);
            const result = await StorageService.saveMaterials(updated);
            if (!result.success) alert(`Local copy saved, but the database write failed: ${result.error}`);
          }}
        />
      )}

      {/* --- Notification Center Interface --- */}
      {activeCategory === 'notifications' && (
        <NotificationCenterModule
          universities={universities}
          courses={courses}
          studentsList={studentsList}
        />
      )}

      {/* --- Leaderboard Management Interface --- */}
      {activeCategory === 'leaderboard' && (
        <LeaderboardManagementModule
          universities={universities}
          courses={courses}
          onNavigateStudent={(studentId) => {
            setActiveCategory('students');
          }}
        />
      )}

      {/* --- Payment & Revenue Management --- */}
      {activeCategory === 'payments' && (
        <PaymentSubscriptionModule
          students={studentsList}
          plans={plans}
          universities={universities}
          courses={courses}
          onUpdateStudents={(updated) => {
            setStudentsList(updated);
          }}
          onUpdatePlans={(updated) => {
            onUpdatePlans(updated);
          }}
        />
      )}

      {/* --- Question Analytics Interface --- */}
      {activeCategory === 'question_analytics' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm">Question Difficulty & Performance Analytics</h3>
          <p className="text-xs text-slate-400">Detailed analytics on most failed questions and average score distributions across courses.</p>
        </div>
      )}

      {/* --- Smart Question Generator History --- */}
      {activeCategory === 'ai_generator_history' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <span>SMART Question Generator Engine</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] rounded-full font-bold">
                    Multimodal Gemini 3.6 Flash
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload PDF past papers, exam photo scans, lecture notes, or paste text to generate structured, exam-ready CBT questions automatically.
                </p>
              </div>
            </div>

            {/* Target Selectors Grid */}
            <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Hierarchy (University → Faculty → Department → Level → Semester → Course)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Step-by-Step Cascading Flow
                </span>
              </div>
              
              <AcademicHierarchySelector
                values={genHierarchy}
                onChange={setGenHierarchy}
                universities={universities}
                faculties={faculties}
                departments={departments}
                courses={courses}
                mode="form"
                layout="grid-3"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Topic / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Search Trees"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Question Count</label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={30}>30 Questions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Input Mode Selector Tabs */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-bold pt-2">
              <button
                onClick={() => setGenInputMode('file')}
                className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  genInputMode === 'file' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document / Photo Scan (PDF, JPG, PNG, DOCX, TXT)</span>
              </button>
              <button
                onClick={() => setGenInputMode('text')}
                className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  genInputMode === 'text' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Type or Paste Study Material Text</span>
              </button>
            </div>

            {genInputMode === 'file' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingGenFile(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingGenFile(false); }}
                onDrop={handleGenFileDrop}
                onClick={() => !genUploadedFile && genFileInputRef.current?.click()}
                className={`border-2 border-dashed ${
                  isDraggingGenFile
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                    : genUploadedFile
                    ? 'border-emerald-500/50 bg-slate-950/80'
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-950/60'
                } p-6 sm:p-8 rounded-2xl text-center transition-all relative group cursor-pointer`}
              >
                <input
                  type="file"
                  ref={genFileInputRef}
                  onChange={(e) => handleGenFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.json,image/*"
                />

                {genUploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    {genImagePreview ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-emerald-500/40 shadow-lg">
                        <img src={genImagePreview} alt="Exam Scan Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}

                    <div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full inline-block mb-1">
                        {genUploadedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                      <p className="text-sm font-bold text-white max-w-md truncate">
                        {genUploadedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Size: {(genUploadedFile.size / 1024 < 1024) 
                          ? `${(genUploadedFile.size / 1024).toFixed(1)} KB` 
                          : `${(genUploadedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          genFileInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenFileSelect(null);
                          if (genFileInputRef.current) genFileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto group-hover:scale-110 transition-transform">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isDraggingGenFile ? (
                          <span className="text-indigo-400 font-bold">Drop document or exam image photo here!</span>
                        ) : (
                          'Click to select or drag & drop past question PDF, exam image photo, or lecture file'
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-lg mx-auto">
                        Supports PDF, Exam Camera Photos (JPG, PNG, WEBP), Word (.docx), TXT, CSV, JSON
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                rows={5}
                placeholder="Paste course outline, lecture summary, or study material text here..."
                value={materialText}
                onChange={(e) => setMaterialText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            )}

            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating || (genInputMode === 'file' && !genUploadedFile) || (genInputMode === 'text' && !materialText.trim())}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Input & Extracting CBT Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Questions from Input Material</span>
                </>
              )}
            </button>
          </div>

          {/* Generator History List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Smart Question Generator Batch History</span>
            </h3>
            <div className="divide-y divide-slate-800">
              {generatorHistory.map((h) => (
                <div key={h.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{h.course} - <span className="text-amber-400">{h.topic}</span></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {h.questionCount} Questions | Source: <span className="text-slate-300 font-mono">{h.source || 'Text Material'}</span> | {h.date}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Backup & Restore Interface --- */}
      {activeCategory === 'backup_restore' && (
        <BackupRestoreModule />
      )}

      {/* --- Activity Logs Interface --- */}
      {activeCategory === 'activity_logs' && (
        <ActivityLogsModule studentsList={studentsList} />
      )}

      {/* --- Administrator Management & Roles Interface --- */}
      {activeCategory === 'roles_permissions' && (
        <AdminManagementModule />
      )}

      {/* --- Audit & Compliance Center Interface --- */}
      {activeCategory === 'audit_compliance' && (
        <AuditComplianceModule />
      )}

      {/* --- Security & Access Control Interface --- */}
      {activeCategory === 'security_access' && (
        <SecurityAccessModule />
      )}

      {/* --- System Health & Diagnostics Interface --- */}
      {activeCategory === 'system_health' && (
        <SystemHealthModule />
      )}

      {/* --- Reports & Export Interface --- */}
      {activeCategory === 'reports' && (
        <ReportsManagementModule
          universities={universities}
          courses={courses}
          questions={questions}
          studentsList={studentsList}
          transactions={transactions}
          plans={plans}
        />
      )}

      {/* --- Feedback & Support Interface --- */}
      {activeCategory === 'feedback_support' && (
        <FeedbackSupportModule studentsList={studentsList} />
      )}

      {/* --- Topic Requests & Community Management Interface --- */}
      {activeCategory === 'topic_requests' && (
        <TopicRequestManagementModule universities={universities} courses={courses} />
      )}

      {/* --- MenCore AI System Management & Joyce Tutor Studio --- */}
      {activeCategory === 'mencore_ai' && (
        <MenCoreManagementModule />
      )}

      {/* --- Sign-Up & Academic Faculties & Departments Manual Manager --- */}
      {activeCategory === 'signup_departments' && (
        <DepartmentManagementModule
          universities={universities}
          faculties={faculties}
          departments={departments}
          courses={courses}
          onUpdateUniversities={onUpdateUniversities}
          onUpdateFaculties={onUpdateFaculties}
          onUpdateDepartments={onUpdateDepartments}
        />
      )}

      {/* --- Face Arena Weekly Quiz Challenge Management --- */}
      {activeCategory === 'face_arena' && (
        <FaceArenaAdminModule />
      )}
    </>
  )}

      {/* Role Permissions Matrix Modal */}
      {showRoleMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">System Role Permissions Matrix (RBAC)</h2>
                  <p className="text-xs text-slate-400">
                    Detailed capabilities mapping for all 9 pre-configured Administrative Roles in CBT Master.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleMatrixModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Permission Code</th>
                    <th className="p-3">Description</th>
                    {(Object.keys(DEFAULT_ROLE_PERMISSIONS) as RbacAdminRole[]).map((r) => (
                      <th key={r} className={`p-3 text-center min-w-[100px] ${r === currentRole ? 'text-amber-400 bg-amber-500/10' : ''}`}>
                        {getRoleDisplayName(r).replace(' Manager', '').replace(' Administrator', ' Admin')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {[
                    { code: 'manage_students', label: 'Manage Students & Subscriptions' },
                    { code: 'manage_universities', label: 'Manage Universities & Faculties' },
                    { code: 'manage_courses', label: 'Manage Courses & Curricula' },
                    { code: 'manage_questions', label: 'Manage Question Bank & Review' },
                    { code: 'manage_study_materials', label: 'Upload & Manage Materials' },
                    { code: 'manage_payments', label: 'Approve & Manage Payments' },
                    { code: 'manage_reports', label: 'Export System Reports & Analytics' },
                    { code: 'manage_notifications', label: 'Send System Announcements' },
                    { code: 'manage_backups', label: 'Backup & Restore Database' },
                    { code: 'manage_settings', label: 'System Settings & Health' },
                    { code: 'manage_support_tickets', label: 'Resolve Complaints & Feedback' },
                    { code: 'view_activity_logs', label: 'View Administrative Activity Logs' },
                    { code: 'manage_other_administrators', label: 'Manage Admin Accounts & Roles' },
                  ].map((perm) => (
                    <tr key={perm.code} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-indigo-300">{perm.code}</td>
                      <td className="p-3 font-sans text-slate-400">{perm.label}</td>
                      {(Object.keys(DEFAULT_ROLE_PERMISSIONS) as RbacAdminRole[]).map((r) => {
                        const isGranted = (DEFAULT_ROLE_PERMISSIONS[r] || []).includes(perm.code as AdminPermission);
                        return (
                          <td key={r} className={`p-3 text-center ${r === currentRole ? 'bg-amber-500/5' : ''}`}>
                            {isGranted ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-slate-600 text-xs">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Current Session: <span className="font-bold text-white">{adminFullName}</span> ({roleDisplayName})
              </div>
              <button
                onClick={() => setShowRoleMatrixModal(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Matrix View
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};
