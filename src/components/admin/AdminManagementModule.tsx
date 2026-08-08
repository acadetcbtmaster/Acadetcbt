import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Key,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Activity,
  Check,
  X,
  RefreshCw,
  Clock,
  Laptop,
  Globe,
  Radio,
  Sliders,
  FileSpreadsheet,
  FileText,
  Ban,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertOctagon
} from 'lucide-react';
import { StorageService } from '../../services/storage';

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

export interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: 'Active' | 'Suspended' | 'Offline';
  isOnline: boolean;
  avatarUrl?: string;
  lastLogin: string;
  loginCount: number;
  dateCreated: string;
  createdBy: string;
  lastIpAddress?: string;
  deviceInfo?: string;
  customPermissions?: Record<string, boolean>;
}

export interface AdminLoginSession {
  sessionId: string;
  adminId: string;
  adminName: string;
  role: AdminRole;
  loginTime: string;
  lastActivity: string;
  device: string;
  browser: string;
  ipAddress: string;
  status: 'Active' | 'Terminated';
}

export interface SecurityAlert {
  id: string;
  adminId?: string;
  adminName?: string;
  type: 'Failed Login' | 'Suspicious Location' | 'Unknown Device' | 'Permission Violation' | 'Unauthorized Access';
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
  ipAddress: string;
  status: 'Unresolved' | 'Investigating' | 'Resolved';
}

const DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  'Super Administrator': [
    'manage_students', 'manage_universities', 'manage_courses', 'manage_questions',
    'manage_study_materials', 'manage_payments', 'manage_reports', 'manage_notifications',
    'manage_backups', 'manage_settings', 'manage_support_tickets', 'view_activity_logs',
    'manage_other_administrators'
  ],
  'Student Manager': ['manage_students', 'manage_support_tickets', 'view_activity_logs'],
  'Question Manager': ['manage_questions', 'manage_courses', 'view_activity_logs'],
  'Course Manager': ['manage_courses', 'manage_universities', 'view_activity_logs'],
  'Payment Manager': ['manage_payments', 'manage_reports', 'view_activity_logs'],
  'Support Manager': ['manage_support_tickets', 'manage_students', 'view_activity_logs'],
  'Report Manager': ['manage_reports', 'view_activity_logs'],
  'Content Manager': ['manage_study_materials', 'manage_questions', 'view_activity_logs'],
  'System Manager': ['manage_settings', 'manage_backups', 'view_activity_logs', 'manage_notifications']
};

const ALL_PERMISSION_KEYS = [
  { key: 'manage_students', label: 'Manage Students', desc: 'Create, edit, suspend, or delete student profiles' },
  { key: 'manage_universities', label: 'Manage Universities', desc: 'Add or configure tertiary partner institutions' },
  { key: 'manage_courses', label: 'Manage Courses', desc: 'Modify course structures, topics & curriculums' },
  { key: 'manage_questions', label: 'Manage Questions', desc: 'Approve, create, edit & manage CBT questions' },
  { key: 'manage_study_materials', label: 'Manage Study Materials', desc: 'Upload and manage e-books, summaries & notes' },
  { key: 'manage_payments', label: 'Manage Payments', desc: 'Verify transactions, handle refunds & plans' },
  { key: 'manage_reports', label: 'Manage Reports', desc: 'Access financial & student performance analytics' },
  { key: 'manage_notifications', label: 'Manage Notifications', desc: 'Send system broadcasts and announcement banners' },
  { key: 'manage_backups', label: 'Manage Backups', desc: 'Trigger Firestore snapshots & data restores' },
  { key: 'manage_settings', label: 'Manage Settings', desc: 'Configure global app rules, timers & limits' },
  { key: 'manage_support_tickets', label: 'Manage Support Tickets', desc: 'Resolve student help requests and complaints' },
  { key: 'view_activity_logs', label: 'View Activity Logs', desc: 'Inspect full system-wide administrative audit trail' },
  { key: 'manage_other_administrators', label: 'Manage Other Administrators', desc: 'Create, edit, assign roles & permissions to admins (Super Admin only)' }
];

export const AdminManagementModule: React.FC = () => {
  // Current Logged-in User Role Simulator (Defaults to Super Administrator)
  const [currentUserRole, setCurrentUserRole] = useState<'Super Administrator' | 'Regular Administrator'>('Super Administrator');

  // Administrators State
  const [admins, setAdmins] = useState<AdminUser[]>([
    {
      id: 'ADM-1001',
      fullName: 'Dr. Clement O. Adebayo',
      username: 'superadmin',
      email: 'clement.adebayo@cbtmaster.ng',
      phone: '+234 803 123 4567',
      role: 'Super Administrator',
      status: 'Active',
      isOnline: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 12).toLocaleString(),
      loginCount: 342,
      dateCreated: '2025-01-10',
      createdBy: 'System Root',
      lastIpAddress: '102.89.23.14',
      deviceInfo: 'MacBook Pro / Chrome 126',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'ADM-1002',
      fullName: 'Aisha Bello Abubakar',
      username: 'aishabello',
      email: 'aisha.bello@cbtmaster.ng',
      phone: '+234 802 987 6543',
      role: 'Question Manager',
      status: 'Active',
      isOnline: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 45).toLocaleString(),
      loginCount: 128,
      dateCreated: '2025-02-01',
      createdBy: 'Dr. Clement O. Adebayo',
      lastIpAddress: '197.210.64.88',
      deviceInfo: 'Windows 11 / Firefox 128',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'ADM-1003',
      fullName: 'Emeka Chukwudi Eze',
      username: 'emekaeze',
      email: 'emeka.eze@cbtmaster.ng',
      phone: '+234 814 555 1212',
      role: 'Student Manager',
      status: 'Active',
      isOnline: false,
      lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString(),
      loginCount: 94,
      dateCreated: '2025-02-15',
      createdBy: 'Dr. Clement O. Adebayo',
      lastIpAddress: '102.91.4.110',
      deviceInfo: 'Dell XPS 15 / Edge 125'
    },
    {
      id: 'ADM-1004',
      fullName: 'Blessing Omotola',
      username: 'blessingo',
      email: 'blessing.omotola@cbtmaster.ng',
      phone: '+234 805 444 3322',
      role: 'Payment Manager',
      status: 'Suspended',
      isOnline: false,
      lastLogin: '2026-06-18 14:22',
      loginCount: 41,
      dateCreated: '2025-03-01',
      createdBy: 'Dr. Clement O. Adebayo',
      lastIpAddress: '102.88.19.2',
      deviceInfo: 'iPhone 15 Pro / Safari'
    },
    {
      id: 'ADM-1005',
      fullName: 'Tunde Oladipo',
      username: 'tundeoladipo',
      email: 'tunde.oladipo@cbtmaster.ng',
      phone: '+234 818 777 8899',
      role: 'Course Manager',
      status: 'Active',
      isOnline: true,
      lastLogin: new Date(Date.now() - 1000 * 60 * 2).toLocaleString(),
      loginCount: 156,
      dateCreated: '2025-03-10',
      createdBy: 'Dr. Clement O. Adebayo',
      lastIpAddress: '197.211.12.95',
      deviceInfo: 'Ubuntu / Chrome 126'
    }
  ]);

  // Login Sessions State
  const [sessions, setSessions] = useState<AdminLoginSession[]>([
    {
      sessionId: 'SES-901',
      adminId: 'ADM-1001',
      adminName: 'Dr. Clement O. Adebayo',
      role: 'Super Administrator',
      loginTime: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString(),
      lastActivity: '1 min ago',
      device: 'MacBook Pro (macOS 14.5)',
      browser: 'Chrome 126.0',
      ipAddress: '102.89.23.14 (Lagos, NG)',
      status: 'Active'
    },
    {
      sessionId: 'SES-902',
      adminId: 'ADM-1002',
      adminName: 'Aisha Bello Abubakar',
      role: 'Question Manager',
      loginTime: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
      lastActivity: '3 mins ago',
      device: 'Windows 11 Desktop',
      browser: 'Firefox 128.0',
      ipAddress: '197.210.64.88 (Abuja, NG)',
      status: 'Active'
    },
    {
      sessionId: 'SES-903',
      adminId: 'ADM-1005',
      adminName: 'Tunde Oladipo',
      role: 'Course Manager',
      loginTime: new Date(Date.now() - 1000 * 60 * 20).toLocaleTimeString(),
      lastActivity: 'Just now',
      device: 'Linux Workstation',
      browser: 'Chrome 126.0',
      ipAddress: '197.211.12.95 (Ibadan, NG)',
      status: 'Active'
    }
  ]);

  // Security Alerts State
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([
    {
      id: 'ALT-401',
      adminId: 'ADM-1004',
      adminName: 'Blessing Omotola',
      type: 'Failed Login',
      severity: 'Warning',
      message: '3 consecutive failed password attempts detected from IP 102.88.19.2',
      timestamp: 'Today, 04:12 AM',
      ipAddress: '102.88.19.2',
      status: 'Unresolved'
    },
    {
      id: 'ALT-402',
      adminId: 'ADM-1003',
      adminName: 'Emeka Chukwudi Eze',
      type: 'Suspicious Location',
      severity: 'Critical',
      message: 'Login attempt from unknown country (Frankfurt, DE) - blocked automatically.',
      timestamp: 'Yesterday, 11:40 PM',
      ipAddress: '185.220.101.5',
      status: 'Investigating'
    }
  ]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlineFilter, setOnlineFilter] = useState<string>('all');
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Active Tab View: 'admins' | 'roles' | 'sessions' | 'security'
  const [activeSubTab, setActiveSubTab] = useState<'admins' | 'roles' | 'sessions' | 'security'>('admins');

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewProfileAdmin, setViewProfileAdmin] = useState<AdminUser | null>(null);
  const [editAdminModal, setEditAdminModal] = useState<AdminUser | null>(null);
  const [resetPassModal, setResetPassModal] = useState<AdminUser | null>(null);
  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState<AdminUser | null>(null);
  const [confirmStatusToggle, setConfirmStatusToggle] = useState<{ admin: AdminUser; nextStatus: 'Active' | 'Suspended' } | null>(null);
  const [rolePermissionsAdmin, setRolePermissionsAdmin] = useState<AdminUser | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Create Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('Question Manager');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleState, setEditRoleState] = useState<AdminRole>('Question Manager');

  // Reset Password State
  const [resetPassValue, setResetPassValue] = useState('');

  // Role Permissions Modal State (Custom Matrix)
  const [customPermsState, setCustomPermsState] = useState<Record<string, boolean>>({});

  // Summary Metrics
  const totalAdmins = admins.length;
  const onlineAdmins = admins.filter(a => a.isOnline).length;
  const offlineAdmins = admins.filter(a => !a.isOnline).length;
  const superAdmins = admins.filter(a => a.role === 'Super Administrator').length;
  const activeAdminsCount = admins.filter(a => a.status === 'Active').length;
  const suspendedAdminsCount = admins.filter(a => a.status === 'Suspended').length;
  const loginsToday = 14;
  const failedLoginsToday = securityAlerts.filter(a => a.type === 'Failed Login').length;
  const newAdminsThisMonth = 3;
  const adminActivitiesToday = 48;

  // Filtered List
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch =
      admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
    const matchesOnline =
      onlineFilter === 'all' ||
      (onlineFilter === 'online' && admin.isOnline) ||
      (onlineFilter === 'offline' && !admin.isOnline);

    return matchesSearch && matchesRole && matchesStatus && matchesOnline;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = filteredAdmins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAdmins(paginatedAdmins.map(a => a.id));
    } else {
      setSelectedAdmins([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedAdmins.includes(id)) {
      setSelectedAdmins(selectedAdmins.filter(item => item !== id));
    } else {
      setSelectedAdmins([...selectedAdmins, id]);
    }
  };

  // Create Administrator Handler
  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole !== 'Super Administrator') {
      showToast('Permission Denied: Only Super Administrators can create administrator accounts.', 'error');
      return;
    }

    if (!newFullName || !newUsername || !newEmail || !newPassword) {
      showToast('Please fill in all mandatory required fields.', 'error');
      return;
    }

    if (newPassword !== newConfirmPassword) {
      showToast('Passwords do not match. Please recheck password confirmation.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters in length.', 'error');
      return;
    }

    // Check Uniqueness
    const emailExists = admins.some(a => a.email.toLowerCase() === newEmail.toLowerCase());
    const usernameExists = admins.some(a => a.username.toLowerCase() === newUsername.toLowerCase());

    if (emailExists) {
      showToast('An administrator account with this email address already exists.', 'error');
      return;
    }

    if (usernameExists) {
      showToast('This username is already taken. Please choose another username.', 'error');
      return;
    }

    setCreateLoading(true);

    setTimeout(() => {
      const newAdminObj: AdminUser = {
        id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: newFullName,
        username: newUsername,
        email: newEmail,
        phone: newPhone || '+234 800 000 0000',
        role: newRole,
        status: 'Active',
        isOnline: false,
        lastLogin: 'Never (New Account)',
        loginCount: 0,
        dateCreated: new Date().toISOString().split('T')[0],
        createdBy: 'Super Administrator',
        avatarUrl: newAvatarUrl || undefined
      };

      setAdmins([newAdminObj, ...admins]);
      StorageService.addActivityLog(
        `Created new administrator account: ${newFullName} (${newRole})`,
        'Super Administrator',
        'ADMIN_CREATED'
      );

      setCreateLoading(false);
      setCreateModalOpen(false);
      // Reset Form
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewAvatarUrl('');

      showToast(`Administrator account for ${newFullName} successfully created & notification sent!`, 'success');
    }, 800);
  };

  // Edit Admin Handler
  const handleOpenEditModal = (admin: AdminUser) => {
    setEditAdminModal(admin);
    setEditFullName(admin.fullName);
    setEditUsername(admin.username);
    setEditEmail(admin.email);
    setEditPhone(admin.phone);
    setEditRoleState(admin.role);
  };

  const handleSaveEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdminModal) return;

    const updated = admins.map(a => {
      if (a.id === editAdminModal.id) {
        return {
          ...a,
          fullName: editFullName,
          username: editUsername,
          email: editEmail,
          phone: editPhone,
          role: editRoleState
        };
      }
      return a;
    });

    setAdmins(updated);
    StorageService.addActivityLog(
      `Updated administrator profile details for ${editFullName} (${editAdminModal.id})`,
      'Super Administrator',
      'ADMIN_UPDATED'
    );
    setEditAdminModal(null);
    showToast(`Administrator details for ${editFullName} updated successfully!`);
  };

  // Status Toggle (Suspend / Activate)
  const handleConfirmStatusToggle = () => {
    if (!confirmStatusToggle) return;
    const { admin, nextStatus } = confirmStatusToggle;

    const updated = admins.map(a => {
      if (a.id === admin.id) {
        return { ...a, status: nextStatus, isOnline: nextStatus === 'Suspended' ? false : a.isOnline };
      }
      return a;
    });

    setAdmins(updated);
    StorageService.addActivityLog(
      `${nextStatus === 'Suspended' ? 'Suspended' : 'Activated'} administrator account: ${admin.fullName} (${admin.id})`,
      'Super Administrator',
      'ADMIN_STATUS_CHANGED'
    );
    setConfirmStatusToggle(null);
    showToast(`Administrator ${admin.fullName} has been ${nextStatus === 'Suspended' ? 'suspended' : 'activated'}.`);
  };

  // Delete Admin
  const handleDeleteAdmin = () => {
    if (!confirmDeleteAdmin) return;
    setAdmins(admins.filter(a => a.id !== confirmDeleteAdmin.id));
    StorageService.addActivityLog(
      `Deleted administrator account permanently: ${confirmDeleteAdmin.fullName} (${confirmDeleteAdmin.id})`,
      'Super Administrator',
      'ADMIN_DELETED'
    );
    setConfirmDeleteAdmin(null);
    showToast(`Administrator account deleted successfully.`);
  };

  // Force Terminate Session
  const handleTerminateSession = (sessionId: string, adminName: string) => {
    setSessions(sessions.filter(s => s.sessionId !== sessionId));
    // Also mark admin as offline if matching
    setAdmins(admins.map(a => a.fullName === adminName ? { ...a, isOnline: false } : a));
    StorageService.addActivityLog(
      `Force terminated active login session for ${adminName} (${sessionId})`,
      'Super Administrator',
      'SESSION_TERMINATED'
    );
    showToast(`Session ${sessionId} for ${adminName} has been force terminated.`);
  };

  // Bulk Actions
  const handleBulkActivate = () => {
    if (selectedAdmins.length === 0) return;
    setAdmins(admins.map(a => selectedAdmins.includes(a.id) ? { ...a, status: 'Active' } : a));
    showToast(`${selectedAdmins.length} administrators activated successfully.`);
    setSelectedAdmins([]);
  };

  const handleBulkSuspend = () => {
    if (selectedAdmins.length === 0) return;
    setAdmins(admins.map(a => selectedAdmins.includes(a.id) ? { ...a, status: 'Suspended', isOnline: false } : a));
    showToast(`${selectedAdmins.length} administrators suspended successfully.`);
    setSelectedAdmins([]);
  };

  const handleBulkDelete = () => {
    if (selectedAdmins.length === 0) return;
    setAdmins(admins.filter(a => !selectedAdmins.includes(a.id)));
    showToast(`${selectedAdmins.length} administrators deleted.`);
    setSelectedAdmins([]);
  };

  // Export Data
  const handleExportData = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    const exportItems = filteredAdmins.map(a => ({
      ID: a.id,
      FullName: a.fullName,
      Username: a.username,
      Email: a.email,
      Phone: a.phone,
      Role: a.role,
      Status: a.status,
      Online: a.isOnline ? 'Online' : 'Offline',
      LastLogin: a.lastLogin,
      DateCreated: a.dateCreated,
      CreatedBy: a.createdBy
    }));

    if (format === 'CSV' || format === 'EXCEL') {
      const headers = Object.keys(exportItems[0] || {}).join(',');
      const rows = exportItems.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `administrators_list_${Date.now()}.${format === 'CSV' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.print();
    }
    showToast(`Administrator data exported successfully as ${format}.`);
  };

  // Save Custom Permissions for Role/Admin
  const handleOpenPermissions = (admin: AdminUser) => {
    setRolePermissionsAdmin(admin);
    const existing = admin.customPermissions || {};
    const defaultRolePerms = DEFAULT_PERMISSIONS[admin.role] || [];
    const initialMap: Record<string, boolean> = {};

    ALL_PERMISSION_KEYS.forEach(p => {
      initialMap[p.key] = existing[p.key] !== undefined ? existing[p.key] : defaultRolePerms.includes(p.key);
    });

    setCustomPermsState(initialMap);
  };

  const handleSavePermissions = () => {
    if (!rolePermissionsAdmin) return;

    setAdmins(admins.map(a => {
      if (a.id === rolePermissionsAdmin.id) {
        return { ...a, customPermissions: customPermsState };
      }
      return a;
    }));

    StorageService.addActivityLog(
      `Updated customized RBAC security permissions for ${rolePermissionsAdmin.fullName}`,
      'Super Administrator',
      'PERMISSIONS_UPDATED'
    );
    setRolePermissionsAdmin(null);
    showToast(`Permissions updated & synchronized live for ${rolePermissionsAdmin.fullName}.`);
  };

  return (
    <div className="space-y-6" id="admin-management-module-root">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-3 ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            : toastMessage.type === 'info'
            ? 'bg-sky-950/90 text-sky-200 border-sky-500/50'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
        }`}>
          {toastMessage.type === 'error' ? <AlertOctagon className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner: Privileges Control Switch & Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Administrator Management Center</h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
                Super Admin Access
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Control center for administrator accounts, RBAC permissions, live sessions, security alerts & activity audit trails.
            </p>
          </div>
        </div>

        {/* User Role Simulator Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400 pl-2 font-medium">Logged in as:</span>
          <button
            onClick={() => {
              setCurrentUserRole('Super Administrator');
              showToast('Switched identity to Super Administrator (Full Privileges)', 'info');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              currentUserRole === 'Super Administrator'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Super Administrator
          </button>
          <button
            onClick={() => {
              setCurrentUserRole('Regular Administrator');
              showToast('Switched identity to Regular Administrator (Restricted View)', 'info');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              currentUserRole === 'Regular Administrator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Regular Admin
          </button>
        </div>
      </div>

      {/* 1. Real-Time Statistic Summary Cards (10 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Admins */}
        <button
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setOnlineFilter('all'); }}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Total Administrators</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1 group-hover:text-amber-300 transition-colors">{totalAdmins}</p>
          <span className="text-[10px] text-amber-400 font-medium mt-1 block">Platform Control</span>
        </button>

        {/* Online Admins */}
        <button
          onClick={() => { setOnlineFilter('online'); setStatusFilter('all'); }}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Online Now</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">{onlineAdmins}</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">Active Live Sessions</span>
        </button>

        {/* Offline Admins */}
        <button
          onClick={() => { setOnlineFilter('offline'); }}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Offline Admins</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-300 mt-1">{offlineAdmins}</p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Not Logged In</span>
        </button>

        {/* Super Admins */}
        <button
          onClick={() => { setRoleFilter('Super Administrator'); }}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Super Admins</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">{superAdmins}</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Full Privilege Level</span>
        </button>

        {/* Active Admins */}
        <button
          onClick={() => { setStatusFilter('Active'); }}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-1">{activeAdminsCount}</p>
          <span className="text-[10px] text-sky-400/80 font-medium mt-1 block">Authorized Operational</span>
        </button>

        {/* Suspended Admins */}
        <button
          onClick={() => { setStatusFilter('Suspended'); }}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Suspended</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1">{suspendedAdminsCount}</p>
          <span className="text-[10px] text-rose-400/80 font-medium mt-1 block">Access Revoked</span>
        </button>

        {/* Logins Today */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Logins Today</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">{loginsToday}</p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Successful Authentications</span>
        </div>

        {/* Failed Login Attempts */}
        <button
          onClick={() => setActiveSubTab('security')}
          className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Failed Logins</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1">{failedLoginsToday}</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">Security Alerts</span>
        </button>

        {/* New Accounts */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">New Accounts</span>
            <UserPlus className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-1">{newAdminsThisMonth}</p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Created This Month</span>
        </div>

        {/* Activities Today */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Activities Today</span>
            <Sliders className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 mt-1">{adminActivitiesToday}</p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">Audit Log Entries</span>
        </div>

      </div>

      {/* Sub-Tab Navigation Bar & Action Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('admins')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'admins'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Administrator Directory ({admins.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'roles'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Roles & RBAC Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'sessions'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Login Monitoring ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'security'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Security Alerts ({securityAlerts.length})</span>
          </button>
        </div>

        {/* Primary Action Button: Create Administrator (Super Admin Only) */}
        <button
          onClick={() => {
            if (currentUserRole !== 'Super Administrator') {
              showToast('Only Super Administrators can create new administrator accounts.', 'error');
            } else {
              setCreateModalOpen(true);
            }
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
            currentUserRole === 'Super Administrator'
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Administrator</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ADMINISTRATOR DIRECTORY LIST                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'admins' && (
        <div className="space-y-4">
          
          {/* Search, Filter & Bulk Actions Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Administrator Name, Username, Email, ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Role Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-slate-900 text-white">All Roles</option>
                  <option value="Super Administrator" className="bg-slate-900 text-white">Super Administrator</option>
                  <option value="Question Manager" className="bg-slate-900 text-white">Question Manager</option>
                  <option value="Student Manager" className="bg-slate-900 text-white">Student Manager</option>
                  <option value="Course Manager" className="bg-slate-900 text-white">Course Manager</option>
                  <option value="Payment Manager" className="bg-slate-900 text-white">Payment Manager</option>
                  <option value="Support Manager" className="bg-slate-900 text-white">Support Manager</option>
                  <option value="Report Manager" className="bg-slate-900 text-white">Report Manager</option>
                  <option value="Content Manager" className="bg-slate-900 text-white">Content Manager</option>
                  <option value="System Manager" className="bg-slate-900 text-white">System Manager</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                <option value="Active" className="bg-slate-900 text-white">Active Only</option>
                <option value="Suspended" className="bg-slate-900 text-white">Suspended Only</option>
              </select>

              {/* Online Filter */}
              <select
                value={onlineFilter}
                onChange={(e) => { setOnlineFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Presence</option>
                <option value="online" className="bg-slate-900 text-white">Online Only</option>
                <option value="offline" className="bg-slate-900 text-white">Offline Only</option>
              </select>

              {/* Export Button */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => handleExportData('CSV')}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Export to CSV"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExportData('EXCEL')}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Export to Excel"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExportData('PDF')}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Print / PDF"
                >
                  <Download className="w-3 h-3 text-indigo-400" />
                  <span>PDF</span>
                </button>
              </div>

            </div>
          </div>

          {/* Bulk Selection Bar (Shows when items checked) */}
          {selectedAdmins.length > 0 && (
            <div className="bg-indigo-950/80 border border-indigo-500/30 p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
              <span className="text-indigo-200 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>{selectedAdmins.length} Administrator(s) Selected</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkActivate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Activate Selected</span>
                </button>

                <button
                  onClick={handleBulkSuspend}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suspend Selected</span>
                </button>

                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          )}

          {/* Administrators Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={paginatedAdmins.length > 0 && selectedAdmins.length === paginatedAdmins.length}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Administrator</th>
                    <th className="p-4">ID & Username</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {paginatedAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No administrator accounts found matching your search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAdmins.map(admin => (
                      <tr key={admin.id} className="hover:bg-slate-800/40 transition-colors">
                        
                        {/* Checkbox */}
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedAdmins.includes(admin.id)}
                            onChange={() => handleSelectOne(admin.id)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Administrator Photo & Full Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {admin.avatarUrl ? (
                                <img src={admin.avatarUrl} alt={admin.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-xs">
                                  {admin.fullName.charAt(0)}
                                </div>
                              )}
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${admin.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            </div>

                            <div>
                              <p className="font-bold text-white text-xs">{admin.fullName}</p>
                              <p className="text-[11px] text-slate-400">{admin.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* ID & Username */}
                        <td className="p-4 font-mono text-[11px]">
                          <span className="text-amber-400 font-bold block">{admin.id}</span>
                          <span className="text-slate-400">@{admin.username}</span>
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            admin.role === 'Super Administrator'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : admin.role === 'Question Manager'
                              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                              : admin.role === 'Payment Manager'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                          }`}>
                            {admin.role}
                          </span>
                        </td>

                        {/* Account Status */}
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit ${
                            admin.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {admin.status}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="p-4 text-slate-400 text-[11px]">
                          {admin.lastLogin}
                        </td>

                        {/* Created Date */}
                        <td className="p-4 text-slate-400 text-[11px]">
                          <div>{admin.dateCreated}</div>
                          <span className="text-[10px] text-slate-500">By: {admin.createdBy}</span>
                        </td>

                        {/* Quick Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* View Profile */}
                            <button
                              onClick={() => setViewProfileAdmin(admin)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="View Full Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Custom Permissions Matrix (Super Admin Only) */}
                            <button
                              onClick={() => handleOpenPermissions(admin)}
                              className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors cursor-pointer"
                              title="Customize RBAC Permissions"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Details */}
                            <button
                              onClick={() => handleOpenEditModal(admin)}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 rounded-lg transition-colors cursor-pointer"
                              title="Edit Administrator Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspend / Activate Toggle */}
                            <button
                              onClick={() => setConfirmStatusToggle({ admin, nextStatus: admin.status === 'Active' ? 'Suspended' : 'Active' })}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                admin.status === 'Active'
                                  ? 'bg-slate-800 hover:bg-amber-600/30 text-amber-400'
                                  : 'bg-slate-800 hover:bg-emerald-600/30 text-emerald-400'
                              }`}
                              title={admin.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Administrator */}
                            <button
                              onClick={() => setConfirmDeleteAdmin(admin)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete Administrator Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Showing {paginatedAdmins.length} of {filteredAdmins.length} Administrators</span>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-bold text-white">Page {currentPage} of {totalPages}</span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ROLES & RBAC PERMISSIONS MATRIX                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>Role-Based Access Control (RBAC) System Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Predefined system capabilities mapped across 9 specialized administrative roles.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full">
                9 Roles Preconfigured
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(DEFAULT_PERMISSIONS) as AdminRole[]).map(roleName => {
                const perms = DEFAULT_PERMISSIONS[roleName];
                const count = perms.length;
                return (
                  <div key={roleName} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>{roleName}</span>
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        {count} / {ALL_PERMISSION_KEYS.length} Perms
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      {perms.map(pKey => {
                        const permObj = ALL_PERMISSION_KEYS.find(pk => pk.key === pKey);
                        return (
                          <div key={pKey} className="flex items-center gap-1.5 text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{permObj?.label || pKey}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: LIVE LOGIN MONITORING                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span>Real-Time Active Administrator Login Sessions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Monitor live device connections, IP addresses, locations & force terminate sessions.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
                {sessions.length} Active Sessions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessions.map(sess => (
                <div key={sess.sessionId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">{sess.adminName}</span>
                      <span className="text-[10px] text-amber-400 font-medium">{sess.role}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sess.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>IP: {sess.ipAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Logged in: {sess.loginTime} (Activity: {sess.lastActivity})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTerminateSession(sess.sessionId, sess.adminName)}
                    className="w-full py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Force Terminate Session</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SECURITY MONITORING & ALERTS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Security Monitoring & Intrusion Detection</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automated threat detection for failed logins, unknown device locations & permission violations.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {securityAlerts.map(alert => (
                <div key={alert.id} className="bg-slate-950 border border-rose-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl shrink-0">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{alert.type}</span>
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded">
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Origin IP: {alert.ipAddress} | Admin Target: {alert.adminName || 'Unknown'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSecurityAlerts(securityAlerts.filter(a => a.id !== alert.id));
                      showToast(`Security alert ${alert.id} marked as resolved.`);
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE ADMINISTRATOR (SUPER ADMIN)                               */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Create New Administrator Account</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Yakubu Muhammed"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yakubum"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="yakubu@cbtmaster.ng"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+234 803 000 0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned Administrative Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Super Administrator">Super Administrator (Full Privileges)</option>
                  <option value="Question Manager">Question Manager</option>
                  <option value="Student Manager">Student Manager</option>
                  <option value="Course Manager">Course Manager</option>
                  <option value="Payment Manager">Payment Manager</option>
                  <option value="Support Manager">Support Manager</option>
                  <option value="Report Manager">Report Manager</option>
                  <option value="Content Manager">Content Manager</option>
                  <option value="System Manager">System Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Profile Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{createLoading ? 'Creating Account...' : 'Create Administrator'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW ADMINISTRATOR PROFILE                                       */}
      {/* ========================================================================= */}
      {viewProfileAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-mono text-amber-400 font-bold text-xs">{viewProfileAdmin.id}</span>
              <button onClick={() => setViewProfileAdmin(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-2xl text-amber-400 overflow-hidden shrink-0">
                {viewProfileAdmin.avatarUrl ? (
                  <img src={viewProfileAdmin.avatarUrl} alt={viewProfileAdmin.fullName} className="w-full h-full object-cover" />
                ) : (
                  viewProfileAdmin.fullName.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">{viewProfileAdmin.fullName}</h3>
                <p className="text-xs text-slate-400">@{viewProfileAdmin.username} • {viewProfileAdmin.email}</p>
                <span className="mt-1 inline-block px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-md">
                  {viewProfileAdmin.role}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-semibold text-white">{viewProfileAdmin.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Status:</span>
                <span className="font-semibold text-emerald-400">{viewProfileAdmin.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Logins:</span>
                <span className="font-semibold text-white">{viewProfileAdmin.loginCount} logins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Login:</span>
                <span className="font-semibold text-slate-300">{viewProfileAdmin.lastLogin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created Date:</span>
                <span className="font-semibold text-slate-300">{viewProfileAdmin.dateCreated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created By:</span>
                <span className="font-semibold text-slate-300">{viewProfileAdmin.createdBy}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setViewProfileAdmin(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CUSTOM PERMISSIONS MATRIX MODAL                                  */}
      {/* ========================================================================= */}
      {rolePermissionsAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span>Customize Administrative Permissions</span>
                </h3>
                <p className="text-xs text-slate-400">Target: {rolePermissionsAdmin.fullName} ({rolePermissionsAdmin.role})</p>
              </div>
              <button onClick={() => setRolePermissionsAdmin(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {ALL_PERMISSION_KEYS.map(perm => (
                <div key={perm.key} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{perm.label}</span>
                    <span className="text-[11px] text-slate-400">{perm.desc}</span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={!!customPermsState[perm.key]}
                      onChange={(e) => setCustomPermsState({ ...customPermsState, [perm.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setRolePermissionsAdmin(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-lg"
              >
                Save & Apply Permissions
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM STATUS TOGGLE / DELETE                                    */}
      {/* ========================================================================= */}
      {confirmStatusToggle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Account Status Change</h3>
            </div>
            <p className="text-slate-300">
              Are you sure you want to change account status for <strong className="text-white">{confirmStatusToggle.admin.fullName}</strong> to <strong className="text-amber-400">{confirmStatusToggle.nextStatus}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button onClick={() => setConfirmStatusToggle(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
              <button onClick={handleConfirmStatusToggle} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl">Confirm Change</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Permanent Deletion</h3>
            </div>
            <p className="text-slate-300">
              Are you sure you want to permanently delete administrator <strong className="text-white">{confirmDeleteAdmin.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button onClick={() => setConfirmDeleteAdmin(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
              <button onClick={handleDeleteAdmin} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAdminModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Administrator Profile</h3>
              <button onClick={() => setEditAdminModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveEditAdmin} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Username</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Role</label>
                <select value={editRoleState} onChange={(e) => setEditRoleState(e.target.value as AdminRole)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white">
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Question Manager">Question Manager</option>
                  <option value="Student Manager">Student Manager</option>
                  <option value="Course Manager">Course Manager</option>
                  <option value="Payment Manager">Payment Manager</option>
                  <option value="Support Manager">Support Manager</option>
                  <option value="Report Manager">Report Manager</option>
                  <option value="Content Manager">Content Manager</option>
                  <option value="System Manager">System Manager</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditAdminModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
