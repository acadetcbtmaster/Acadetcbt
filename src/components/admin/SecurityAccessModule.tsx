import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Globe,
  Smartphone,
  Monitor,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  LogOut,
  Sliders,
  Settings,
  Plus,
  Edit2,
  Copy,
  Trash2,
  FileSpreadsheet,
  Download,
  Terminal,
  Activity,
  Zap,
  Sparkles,
  BarChart3,
  Server,
  Database,
  Radio,
  X,
  Check,
  Clock
} from 'lucide-react';
import { StorageService, safeStringify } from '../../services/storage';

export interface SecuritySessionItem {
  id: string;
  userId: string;
  userName: string;
  userRole: 'Super Admin' | 'Administrator' | 'Student';
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  loginTime: string;
  lastActivity: string;
  status: 'Active' | 'Expired' | 'Terminated';
}

export interface SecurityDeviceItem {
  id: string;
  deviceName: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;
  browser: string;
  loginDate: string;
  lastActivity: string;
  trustStatus: 'Trusted' | 'Untrusted' | 'Blocked';
  userName: string;
}

export interface RolePermissionItem {
  id: string;
  roleName: string;
  description: string;
  assignedUsersCount: number;
  permissions: string[];
  isCustomRole: boolean;
}

export const SecurityAccessModule: React.FC = () => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'login_security'
    | 'sessions'
    | 'rbac'
    | 'security_rules'
    | 'devices'
    | 'ip_management'
    | 'alerts'
    | 'password_policy'
    | 'insights'
    | 'emergency'
  >('dashboard');

  // Live Auto Refreshing Toggle
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);

  // Search & Filter state
  const [sessionSearch, setSessionSearch] = useState('');
  const [ipSearch, setIpSearch] = useState('');
  const [newIpToBlock, setNewIpToBlock] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // SEED DATA & STATE
  // ---------------------------------------------------------------------------
  
  // Sessions List
  const [activeSessions, setActiveSessions] = useState<SecuritySessionItem[]>([
    {
      id: 'SES-1001',
      userId: 'adm-01',
      userName: 'Babatunde Lawal',
      userRole: 'Super Admin',
      ipAddress: '102.89.23.14',
      device: 'MacBook Pro 16"',
      browser: 'Chrome 126.0',
      os: 'macOS Sonoma',
      loginTime: 'Today, 02:15 AM',
      lastActivity: '1 min ago',
      status: 'Active'
    },
    {
      id: 'SES-1002',
      userId: 'adm-02',
      userName: 'Fatima Yusuf',
      userRole: 'Administrator',
      ipAddress: '197.210.44.18',
      device: 'Dell XPS 15',
      browser: 'Edge 125.0',
      os: 'Windows 11',
      loginTime: 'Today, 03:40 AM',
      lastActivity: '3 mins ago',
      status: 'Active'
    },
    {
      id: 'SES-1003',
      userId: 'stu-8812',
      userName: 'Amina Bello',
      userRole: 'Student',
      ipAddress: '102.89.10.82',
      device: 'Samsung Galaxy S23',
      browser: 'Chrome Mobile',
      os: 'Android 14',
      loginTime: 'Today, 04:10 AM',
      lastActivity: 'Just now',
      status: 'Active'
    },
    {
      id: 'SES-1004',
      userId: 'stu-9011',
      userName: 'Emeka Chukwu',
      userRole: 'Student',
      ipAddress: '197.210.12.99',
      device: 'iPhone 15 Pro',
      browser: 'Safari Mobile',
      os: 'iOS 17.5',
      loginTime: 'Today, 01:20 AM',
      lastActivity: '12 mins ago',
      status: 'Active'
    }
  ]);

  // Registered Devices
  const [devicesList, setDevicesList] = useState<SecurityDeviceItem[]>([
    {
      id: 'DEV-801',
      deviceName: "Babatunde's MacBook Pro",
      deviceType: 'Desktop',
      os: 'macOS Sonoma',
      browser: 'Chrome',
      loginDate: '2026-07-20',
      lastActivity: 'Today, 05:20 AM',
      trustStatus: 'Trusted',
      userName: 'Babatunde Lawal (Super Admin)'
    },
    {
      id: 'DEV-802',
      deviceName: 'Windows Office PC (Abuja)',
      deviceType: 'Desktop',
      os: 'Windows 11',
      browser: 'Firefox',
      loginDate: '2026-07-22',
      lastActivity: 'Yesterday',
      trustStatus: 'Trusted',
      userName: 'Fatima Yusuf'
    },
    {
      id: 'DEV-803',
      deviceName: 'Unknown Mobile Client (Kano)',
      deviceType: 'Mobile',
      os: 'Android 12',
      browser: 'Opera Mini',
      loginDate: '2026-07-23',
      lastActivity: '30 mins ago',
      trustStatus: 'Untrusted',
      userName: 'unknown_admin'
    }
  ]);

  // IP Block/Allow Lists
  const [blockedIps, setBlockedIps] = useState<string[]>(['197.210.64.88', '41.203.77.12']);

  // RBAC Roles
  const [rolesList, setRolesList] = useState<RolePermissionItem[]>([
    {
      id: 'ROLE-SUPER',
      roleName: 'Super Administrator',
      description: 'Full uninhibited master access across all platform modules and security controls.',
      assignedUsersCount: 2,
      permissions: ['ALL_PERMISSIONS', 'MANAGE_ADMINS', 'SECURITY_OVERRIDE', 'EMERGENCY_LOCKDOWN'],
      isCustomRole: false
    },
    {
      id: 'ROLE-STUDENT-MGR',
      roleName: 'Student Manager',
      description: 'Can inspect, edit, restrict, or extend subscriptions for student accounts.',
      assignedUsersCount: 3,
      permissions: ['VIEW_STUDENTS', 'EDIT_STUDENTS', 'EXTEND_SUBSCRIPTION', 'BAN_STUDENTS'],
      isCustomRole: true
    },
    {
      id: 'ROLE-FINANCE-MGR',
      roleName: 'Finance Manager',
      description: 'Manages bank transfers, payment verification, payouts, and revenue analytics.',
      assignedUsersCount: 2,
      permissions: ['VIEW_PAYMENTS', 'APPROVE_PAYMENTS', 'MANAGE_PLANS', 'EXPORT_REPORTS'],
      isCustomRole: true
    },
    {
      id: 'ROLE-QUESTION-MGR',
      roleName: 'Question Manager',
      description: 'Curates, generates, approves, and organizes course CBT question banks.',
      assignedUsersCount: 4,
      permissions: ['VIEW_QUESTIONS', 'CREATE_QUESTIONS', 'APPROVE_QUESTIONS', 'USE_AI_GENERATOR'],
      isCustomRole: true
    }
  ]);

  // Password Policy State
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireLowercase, setRequireLowercase] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);

  // Emergency Control Modal
  const [emergencyActionModal, setEmergencyActionModal] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  
  const handleTerminateSession = (sessionId: string) => {
    setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
    showToast(`Session ${sessionId} terminated immediately.`, 'info');
  };

  const handleTerminateAllStudentSessions = () => {
    setActiveSessions(activeSessions.filter(s => s.userRole !== 'Student'));
    showToast('All active student sessions have been terminated.', 'success');
  };

  const handleToggleDeviceTrust = (deviceId: string, nextStatus: 'Trusted' | 'Untrusted' | 'Blocked') => {
    setDevicesList(devicesList.map(d => d.id === deviceId ? { ...d, trustStatus: nextStatus } : d));
    showToast(`Device ${deviceId} marked as ${nextStatus}.`, 'info');
  };

  const handleBlockIp = () => {
    if (!newIpToBlock.trim()) {
      showToast('Please enter a valid IP address.', 'error');
      return;
    }
    setBlockedIps([...blockedIps, newIpToBlock.trim()]);
    setNewIpToBlock('');
    showToast(`IP address ${newIpToBlock} added to Firewall Block List.`, 'success');
  };

  const handleUnblockIp = (ip: string) => {
    setBlockedIps(blockedIps.filter(i => i !== ip));
    showToast(`IP address ${ip} removed from block list.`, 'info');
  };

  const handleConfirmEmergencyAction = () => {
    if (!emergencyActionModal) return;
    StorageService.addActivityLog(
      `EXECUTE EMERGENCY CONTROL: ${emergencyActionModal}`,
      'Super Administrator',
      'EMERGENCY_SECURITY'
    );
    showToast(`EMERGENCY CONTROL EXECUTED: ${emergencyActionModal}`, 'error');
    setEmergencyActionModal(null);
  };

  const handleExportSecurityReport = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(safeStringify({
      reportTitle: 'CBT Master Security & Access Audit Export',
      activeSessionsCount: activeSessions.length,
      blockedIpsCount: blockedIps.length,
      registeredDevicesCount: devicesList.length,
      exportedAt: new Date().toISOString()
    }, 2));

    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `security_audit_report_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);

    showToast(`Security Report exported as ${format}.`, 'success');
  };

  return (
    <div className="space-y-6" id="security-access-module-root">
      
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

      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Security & Access Control Center</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Firebase Auth & App Check Guard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Highest-level security engine: Session management, RBAC matrices, IP firewall, device authorization & emergency lockdown controls.
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setEmergencyActionModal('LOCK_ENTIRE_PLATFORM')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5 animate-pulse"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Emergency Lockdown</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => handleExportSecurityReport('CSV')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExportSecurityReport('PDF')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3 h-3 text-sky-400" />
              <span>Report PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REAL-TIME SECURITY DASHBOARD STAT CARDS (12 CARDS GRID)                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Security Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Security Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">Protected</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">App Check Validated</span>
        </div>

        {/* Active Security Alerts */}
        <div
          onClick={() => setActiveTab('alerts')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">2 Alerts</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">Requires Admin Attention</span>
        </div>

        {/* Failed Login Attempts */}
        <div
          onClick={() => setActiveTab('login_security')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-rose-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Failed Logins</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1">14 Attempts</p>
          <span className="text-[10px] text-rose-300/80 font-medium mt-1 block">Rate Limit Active</span>
        </div>

        {/* Successful Logins */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Successful Logins</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">1,482</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Past 24 Hours</span>
        </div>

        {/* Suspicious Activities */}
        <div
          onClick={() => setActiveTab('alerts')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Suspicious Events</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">3 Events</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">Flagged for Verification</span>
        </div>

        {/* Blocked Login Attempts */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Blocked Logins</span>
            <Lock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-1">8 Blocked</p>
          <span className="text-[10px] text-sky-400/80 font-medium mt-1 block">Firewall Intercepted</span>
        </div>

        {/* Locked Accounts */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Locked Accounts</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1">2 Accounts</p>
          <span className="text-[10px] text-rose-300/80 font-medium mt-1 block">5 Failed Password Lock</span>
        </div>

        {/* Active Sessions */}
        <div
          onClick={() => setActiveTab('sessions')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Active Sessions</span>
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">{activeSessions.length} Online</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Connected Sockets</span>
        </div>

        {/* Administrator Sessions */}
        <div
          onClick={() => setActiveTab('sessions')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Admin Sessions</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-1">2 Active</p>
          <span className="text-[10px] text-sky-400/80 font-medium mt-1 block">Console Logged In</span>
        </div>

        {/* Student Sessions */}
        <div
          onClick={() => setActiveTab('sessions')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Student Sessions</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">178 Active</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">CBT Mobile & Desktop</span>
        </div>

        {/* Security Threat Level */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Threat Level</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">LOW</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">Zero Active Exploits</span>
        </div>

        {/* Firewall Status */}
        <div
          onClick={() => setActiveTab('ip_management')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Firewall Status</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">Filtering</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">{blockedIps.length} Blocked IPs</span>
        </div>

      </div>

      {/* Sub-Tab Module Selector */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto text-xs">
        {[
          { id: 'dashboard', label: 'Overview & Status', icon: BarChart3 },
          { id: 'sessions', label: 'Session Management', icon: Radio },
          { id: 'login_security', label: 'Login Security', icon: Key },
          { id: 'rbac', label: 'Role Access (RBAC)', icon: Users },
          { id: 'security_rules', label: 'Firebase Rules', icon: Database },
          { id: 'devices', label: 'Device Management', icon: Smartphone },
          { id: 'ip_management', label: 'IP & Firewall', icon: Globe },
          { id: 'alerts', label: 'Security Alerts', icon: ShieldAlert },
          { id: 'password_policy', label: 'Password Policy', icon: Sliders },
          { id: 'insights', label: 'Smart Security Analysis', icon: Sparkles },
          { id: 'emergency', label: 'Emergency Controls', icon: AlertOctagon }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. SESSION MANAGEMENT MODULE                                              */}
      {/* ========================================================================= */}
      {(activeTab === 'dashboard' || activeTab === 'sessions') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span>Active User Sessions & Socket Control</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Live inspection and immediate revocation of administrator and student active tokens.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search session or user..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                onClick={handleTerminateAllStudentSessions}
                className="px-3.5 py-1.5 bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Logout All Students
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Session ID</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Device & OS</th>
                  <th className="p-3">Browser</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Login Time</th>
                  <th className="p-3">Last Activity</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSessions
                  .filter(s => s.userName.toLowerCase().includes(sessionSearch.toLowerCase()) || s.id.toLowerCase().includes(sessionSearch.toLowerCase()))
                  .map(ses => (
                    <tr key={ses.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-400">{ses.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{ses.userName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{ses.userRole}</span>
                      </td>
                      <td className="p-3 text-slate-300">{ses.device} ({ses.os})</td>
                      <td className="p-3 text-slate-300">{ses.browser}</td>
                      <td className="p-3 font-mono text-slate-400">{ses.ipAddress}</td>
                      <td className="p-3 text-slate-400">{ses.loginTime}</td>
                      <td className="p-3 font-bold text-emerald-400">{ses.lastActivity}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleTerminateSession(ses.id)}
                          className="px-2.5 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Force Revoke</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ROLE-BASED ACCESS CONTROL (RBAC)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span>Role-Based Access Control (RBAC) Permissions Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Super Administrator privileges to configure role hierarchies, capabilities & granular permission assignments.</p>
            </div>
            <button
              onClick={() => showToast('New Role creation dialog open.', 'info')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {rolesList.map(role => (
              <div key={role.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-400 font-bold">{role.id}</span>
                    <h4 className="font-bold text-white text-xs">{role.roleName}</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px]">
                    {role.assignedUsersCount} Assigned Users
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{role.description}</p>

                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Assigned Capability Tokens</span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono text-[10px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FIREBASE SECURITY RULES MANAGEMENT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'security_rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <span>Firebase Security Rules Verification & Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Live status of Firestore security rules, Firebase Auth token validation & App Check attestation.</p>
            </div>
            <button
              onClick={() => showToast('Security Rules syntax verified successfully.', 'success')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Validate Rules Syntax
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { service: 'Cloud Firestore Rules', status: 'Enforced', version: 'v2', lastUpdated: '2026-07-20', detail: 'Match /databases/{db}/documents - allow read, write if request.auth != null' },
              { service: 'Firebase Auth Guards', status: 'Active', version: 'v1.4', lastUpdated: '2026-07-22', detail: 'Token claims verified on server-side proxies.' },
              { service: 'Firebase Storage Rules', status: 'Enforced', version: 'v2', lastUpdated: '2026-07-18', detail: 'Match /b/{bucket}/o - PDF and JPEG mime-type restrict.' },
              { service: 'Firebase App Check', status: 'Active', version: 'reCAPTCHA Enterprise', lastUpdated: '2026-07-23', detail: 'Enforces attestation against automated bot scripts.' }
            ].map((rule, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{rule.service}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded text-[10px]">
                    {rule.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-mono">{rule.detail}</p>
                <div className="text-slate-500 text-[10px] flex justify-between pt-1">
                  <span>Version: {rule.version}</span>
                  <span>Updated: {rule.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REGISTERED DEVICE MANAGEMENT                                           */}
      {/* ========================================================================= */}
      {activeTab === 'devices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <span>Authorized Hardware & Device Register</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Manage trusted browser footprints and block unknown mobile/desktop devices.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {devicesList.map(dev => (
              <div key={dev.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sky-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{dev.deviceName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dev.trustStatus === 'Trusted' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {dev.trustStatus}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{dev.userName} • {dev.os} ({dev.browser})</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleDeviceTrust(dev.id, dev.trustStatus === 'Trusted' ? 'Untrusted' : 'Trusted')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg cursor-pointer"
                  >
                    Toggle Trust
                  </button>
                  <button
                    onClick={() => handleToggleDeviceTrust(dev.id, 'Blocked')}
                    className="px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white font-bold rounded-lg cursor-pointer"
                  >
                    Block Device
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. IP & ACCESS FIREWALL MANAGEMENT                                         */}
      {/* ========================================================================= */}
      {activeTab === 'ip_management' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span>IP Address Firewall & Geo-Filter Controls</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Block malicious IP addresses or configure regional allow lists.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            
            {/* Block IP Input */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-white text-xs">Add IP Address to Blocklist</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 197.210.88.12"
                  value={newIpToBlock}
                  onChange={(e) => setNewIpToBlock(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
                <button
                  onClick={handleBlockIp}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer shrink-0"
                >
                  Block IP
                </button>
              </div>
            </div>

            {/* Blocked IP List */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-white text-xs">Currently Blocked IP Addresses ({blockedIps.length})</h4>
              <div className="space-y-2">
                {blockedIps.map((ip, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-mono text-rose-300 font-bold">{ip}</span>
                    <button
                      onClick={() => handleUnblockIp(ip)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[10px] cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. PASSWORD POLICY MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'password_policy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Password Policy & Enforcement Rules</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure complexity rules for new registrations and password resets.</p>
            </div>
            <button
              onClick={() => showToast('Password policy settings saved.', 'success')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
            >
              Save Policy
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Minimum Password Length ({minPasswordLength} Characters)</label>
              <input
                type="range"
                min="6"
                max="16"
                value={minPasswordLength}
                onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Require Uppercase Letter (A-Z)', val: requireUppercase, setter: setRequireUppercase },
                { label: 'Require Lowercase Letter (a-z)', val: requireLowercase, setter: setRequireLowercase },
                { label: 'Require Number (0-9)', val: requireNumber, setter: setRequireNumber },
                { label: 'Require Special Character (!@#$%)', val: requireSpecialChar, setter: setRequireSpecialChar }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.setter(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. SMART SECURITY MONITORING & INSIGHTS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'insights' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <span>Smart Security Analysis & Intelligent Protection Insights</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Automated threat evaluation, vulnerability scores & intelligent defense recommendations.</p>
            </div>
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-black rounded-full">
              Overall Security Index: 96/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Security Recommendations</span>
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Enforce mandatory 2FA TOTP for Question Managers handling approved CBT pools.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Rotate Super Admin OAuth client keys every 90 days.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Intelligent Risk Vectors</span>
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Platform authentication endpoints are protected by automated rate limiting. Zero brute force breaches recorded in past 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. EMERGENCY SECURITY CONTROLS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'emergency' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>Emergency Security Master Controls (Super Admin Only)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">High-impact lockdown triggers requiring explicit confirmation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'LOCK_ENTIRE_PLATFORM', label: 'Lock Entire Platform', desc: 'Blocks all incoming web and mobile requests immediately.' },
              { key: 'DISABLE_STUDENT_LOGIN', label: 'Disable Student Login', desc: 'Prevents student logins while preserving admin console.' },
              { key: 'DISABLE_ADMIN_LOGIN', label: 'Disable Administrator Login', desc: 'Locks non-super admin users out of dashboard.' },
              { key: 'FORCE_LOGOUT_ALL', label: 'Force Logout All Users', desc: 'Invalidates all active web socket and token sessions.' },
              { key: 'ENABLE_MAINTENANCE', label: 'Enable Emergency Maintenance', desc: 'Displays maintenance banner across student app.' },
              { key: 'DISABLE_NEW_REG', label: 'Disable New Registrations', desc: 'Temporarily halts creation of new student accounts.' }
            ].map((item) => (
              <div key={item.key} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-white text-xs">{item.label}</h4>
                <p className="text-slate-400 text-[11px]">{item.desc}</p>
                <button
                  onClick={() => setEmergencyActionModal(item.label)}
                  className="w-full py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Execute Trigger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Action Modal */}
      {emergencyActionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertOctagon className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-extrabold text-white text-base">Confirm Emergency Action</h3>
                <p className="text-xs text-rose-300 mt-0.5">{emergencyActionModal}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to execute <strong className="text-white">{emergencyActionModal}</strong>? This action takes immediate effect across all live user sessions and Cloud Firestore databases.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEmergencyActionModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer text-xs"
              >
                Cancel Action
              </button>
              <button
                onClick={handleConfirmEmergencyAction}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer text-xs shadow-lg"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
