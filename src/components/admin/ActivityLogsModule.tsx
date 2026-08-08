import React, { useState, useEffect } from 'react';
import {
  FullActivityLog,
  ActiveUserSession,
  ActivityLogCategory,
  ActivityLogStatus,
  ActivityLogUserRole,
  UserProfile
} from '../../types';
import { StorageService, safeStringify } from '../../services/storage';
import {
  Activity,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Clock,
  UserCheck,
  Shield,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  AlertTriangle,
  Server,
  Lock,
  Globe,
  Monitor,
  Smartphone,
  Trash2,
  Archive,
  RotateCcw,
  UserX,
  X,
  CheckCircle2,
  AlertOctagon,
  Layers,
  ChevronRight
} from 'lucide-react';

interface ActivityLogsModuleProps {
  studentsList?: UserProfile[];
}

export const ActivityLogsModule: React.FC<ActivityLogsModuleProps> = ({
  studentsList = [],
}) => {
  // Main State
  const [logs, setLogs] = useState<FullActivityLog[]>([]);
  const [sessions, setSessions] = useState<ActiveUserSession[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'security' | 'sessions' | 'archived'>('logs');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<string>('ALL');

  // Modals
  const [selectedLog, setSelectedLog] = useState<FullActivityLog | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [terminateSessionId, setTerminateSessionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Data
  const loadData = () => {
    const loadedLogs = StorageService.getFullActivityLogs();
    const loadedSessions = StorageService.getActiveSessions();
    setLogs(loadedLogs);
    setSessions(loadedSessions);
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Logs Calculation
  const filteredLogs = logs.filter((log) => {
    // Tab check
    if (activeTab === 'security' && !log.isSecurityAlert && log.status !== 'Failed' && log.category !== 'Security Alert') {
      return false;
    }
    if (activeTab === 'archived' && !log.isArchived) {
      return false;
    }
    if (activeTab !== 'archived' && log.isArchived) {
      return false;
    }

    // Category Filter
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
      return false;
    }

    // Status Filter
    if (statusFilter !== 'ALL' && log.status !== statusFilter) {
      return false;
    }

    // Role Filter
    if (roleFilter !== 'ALL' && log.userRole !== roleFilter) {
      return false;
    }

    // Time Filter
    if (timeFilter !== 'ALL') {
      const logDate = new Date(log.timestamp).getTime();
      const now = Date.now();
      if (timeFilter === 'TODAY' && now - logDate > 86400000) return false;
      if (timeFilter === '7DAYS' && now - logDate > 86400000 * 7) return false;
      if (timeFilter === '30DAYS' && now - logDate > 86400000 * 30) return false;
    }

    // Search Term
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = log.userName.toLowerCase().includes(q);
      const matchEmail = (log.userEmail || '').toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchModule = log.module.toLowerCase().includes(q);
      const matchIp = log.ipAddress.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      return matchName || matchEmail || matchAction || matchModule || matchIp || matchDetails;
    }

    return true;
  });

  // Calculate Statistics
  const totalLogsCount = logs.length;
  const adminActivitiesCount = logs.filter((l) => l.userRole === 'Administrator').length;
  const studentActivitiesCount = logs.filter((l) => l.userRole === 'Student').length;
  const loginActivitiesCount = logs.filter((l) => l.action.toLowerCase().includes('login') && l.status === 'Success').length;
  const securityAlertsCount = logs.filter((l) => l.isSecurityAlert || l.status === 'Failed' || l.category === 'Security Alert').length;

  // Export handlers
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      triggerToast('No logs available to export.');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'User Name', 'Role', 'Email', 'Category', 'Action', 'Module', 'IP Address', 'Device', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString(),
      `"${l.userName}"`,
      l.userRole,
      l.userEmail || '',
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      l.ipAddress,
      `"${l.device || ''}"`,
      l.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Exported ${filteredLogs.length} activity logs to CSV.`);
  };

  // Archive Handler
  const handlePerformArchive = () => {
    const cutoffTime = Date.now() - retentionDays * 86400000;
    let archivedCount = 0;
    const updated = logs.map((l) => {
      if (new Date(l.timestamp).getTime() < cutoffTime && !l.isArchived) {
        archivedCount++;
        return { ...l, isArchived: true };
      }
      return l;
    });

    StorageService.saveFullActivityLogs(updated);
    setLogs(updated);
    setShowArchiveModal(false);
    triggerToast(`Archived ${archivedCount} log records older than ${retentionDays} days.`);
  };

  // Restore Archived Logs
  const handleRestoreAllArchived = () => {
    const updated = logs.map((l) => ({ ...l, isArchived: false }));
    StorageService.saveFullActivityLogs(updated);
    setLogs(updated);
    triggerToast('Restored all archived activity logs back to primary store.');
  };

  // Terminate Session
  const handleConfirmTerminateSession = () => {
    if (!terminateSessionId) return;
    StorageService.terminateSession(terminateSessionId);
    const updated = sessions.map((s) => (s.sessionId === terminateSessionId ? { ...s, status: 'Terminated' as const } : s));
    setSessions(updated);
    setTerminateSessionId(null);
    triggerToast('User session terminated and auth token revoked.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-800 border border-indigo-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Control Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Audit Trail & Activity Logs Engine</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated real-time monitoring of admin actions, student exams, payment events, & security alerts.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Refresh Logs</span>
          </button>

          <button
            onClick={() => setShowArchiveModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-2"
          >
            <Archive className="w-4 h-4 text-amber-400" />
            <span>Retention & Archive</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Activity Logs</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalLogsCount.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400 font-medium">Real-time Cloud Firestore synced</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Admin Activities</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{adminActivitiesCount.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-medium">Question edits, settings, roles</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Student Activities</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{studentActivitiesCount.toLocaleString()}</p>
          <p className="text-[10px] text-cyan-400 font-medium">CBT exams, practice sessions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Login Events</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{loginActivitiesCount.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-400 font-medium">Successful user auth sessions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl space-y-2 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Security Alerts</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400">{securityAlertsCount.toLocaleString()}</p>
          <p className="text-[10px] text-rose-400/80 font-medium">Failed logins & suspicious IPs</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>All Activity Logs ({logs.filter((l) => !l.isArchived).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security Alerts ({securityAlertsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'sessions'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Active User Sessions ({sessions.filter((s) => s.status !== 'Terminated').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'archived'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived Logs ({logs.filter((l) => l.isArchived).length})</span>
        </button>
      </div>

      {/* Tab 1, 2, 4: Activity Log Table View */}
      {activeTab !== 'sessions' && (
        <div className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by User, Action, Module, IP Address, Details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Student Activity">Student Activity</option>
                <option value="Administrator Activity">Administrator Activity</option>
                <option value="Payment Activity">Payment Activity</option>
                <option value="Question Activity">Question Activity</option>
                <option value="System Activity">System Activity</option>
                <option value="Security Alert">Security Alert</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Warning">Warning</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Student">Student</option>
                <option value="Administrator">Administrator</option>
                <option value="System">System</option>
              </select>

              {/* Time Frame Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today (24 Hrs)</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Archived Actions Bar */}
          {activeTab === 'archived' && logs.filter((l) => l.isArchived).length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-amber-300 font-medium">Viewing archived activity logs retention repository.</span>
              <button
                onClick={handleRestoreAllArchived}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All Archived Logs</span>
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Log ID / Time</th>
                    <th className="py-3.5 px-4">User & Role</th>
                    <th className="py-3.5 px-4">Category & Action</th>
                    <th className="py-3.5 px-4">Module & Details</th>
                    <th className="py-3.5 px-4">IP & Client Device</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                        <p className="font-semibold text-sm">No activity log entries found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                        {/* Time & Log ID */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-indigo-400 font-bold block text-[11px]">{log.id}</span>
                          <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </td>

                        {/* User & Role */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{log.userName}</span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                            log.userRole === 'Administrator'
                              ? 'bg-purple-500/10 text-purple-400'
                              : log.userRole === 'Student'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {log.userRole}
                          </span>
                        </td>

                        {/* Category & Action */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-200 block">{log.action}</span>
                          <span className="text-[10px] text-slate-400 block">{log.category}</span>
                        </td>

                        {/* Module & Details */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-semibold text-slate-300 block text-[11px]">{log.module}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{log.details}</span>
                        </td>

                        {/* IP & Device */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] text-slate-300 block">{log.ipAddress}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{log.device || log.browser || 'Web Client'}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            log.status === 'Success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.status === 'Failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.status === 'Success' && <CheckCircle2 className="w-3 h-3" />}
                            {log.status === 'Failed' && <AlertTriangle className="w-3 h-3" />}
                            {log.status === 'Warning' && <AlertOctagon className="w-3 h-3" />}
                            <span>{log.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Active User Sessions View */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Active User Sessions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Live active authenticated sessions across CBT Master platform. Administrators can revoke sessions immediately.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Session ID</th>
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Client IP & Location</th>
                    <th className="py-3.5 px-4">Device & Browser</th>
                    <th className="py-3.5 px-4">Login / Last Activity</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4 text-right">Revoke Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">No active sessions.</td>
                    </tr>
                  ) : (
                    sessions.map((sess) => (
                      <tr key={sess.sessionId} className="hover:bg-slate-850/50">
                        <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold text-[11px]">
                          {sess.sessionId}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{sess.userName}</span>
                          <span className="text-[10px] text-slate-400 block">{sess.email} ({sess.userRole})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300 block text-[11px]">{sess.ipAddress}</span>
                          <span className="text-[10px] text-slate-500 block">{sess.location || 'Nigeria'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-200 block text-[11px]">{sess.device}</span>
                          <span className="text-[10px] text-slate-500 block">{sess.browser} ({sess.operatingSystem})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] text-slate-300 block">Logged in: {new Date(sess.loginTime).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-slate-500 block">Last: {new Date(sess.lastActivityTime).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sess.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : sess.status === 'Idle'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {sess.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {sess.status !== 'Terminated' ? (
                            <button
                              onClick={() => setTerminateSessionId(sess.sessionId)}
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] rounded-xl cursor-pointer transition-all flex items-center gap-1 ml-auto"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Terminate</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Terminated</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Log Details Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold block">{selectedLog.id}</span>
                <h3 className="font-bold text-white text-base mt-0.5">{selectedLog.action}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">User Name</span>
                <p className="font-bold text-white">{selectedLog.userName}</p>
                <p className="text-[11px] text-slate-400">{selectedLog.userEmail || 'N/A'} ({selectedLog.userRole})</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Timestamp</span>
                <p className="font-bold text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">{selectedLog.category}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Client IP Address</span>
                <p className="font-mono font-bold text-indigo-400">{selectedLog.ipAddress}</p>
                <p className="text-[11px] text-slate-400">Geolocation: Nigeria (Cloudflare Ingress)</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Device & OS</span>
                <p className="font-bold text-white">{selectedLog.device || 'Standard Web Browser'}</p>
                <p className="text-[11px] text-slate-400">{selectedLog.browser} ({selectedLog.operatingSystem})</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Action Payload & Details</span>
              <p className="text-slate-300 font-medium">{selectedLog.details}</p>
            </div>

            {selectedLog.metadata && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Exact Metadata JSON</span>
                <pre className="font-mono text-[11px] text-cyan-300 overflow-x-auto p-2.5 bg-slate-900 rounded-xl">
                  {safeStringify(selectedLog.metadata, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Archival & Retention Settings Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <span>Log Retention & Archival</span>
              </h3>
              <button onClick={() => setShowArchiveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select retention window to compress and archive older activity log entries. Archived logs can be viewed under the "Archived Logs" tab or restored.
            </p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-300 block">Archive Logs Older Than:</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-2xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformArchive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Run Archive Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Terminate Session Confirmation */}
      {terminateSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-white text-base text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Revoke Session</span>
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to terminate session <span className="font-mono text-cyan-400 font-bold">{terminateSessionId}</span>? The user will be immediately logged out.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setTerminateSessionId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTerminateSession}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
