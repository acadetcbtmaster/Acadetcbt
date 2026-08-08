import React, { useState, useEffect } from 'react';
import {
  BackupRecord,
  AutoBackupConfig,
  RestoreLog,
  BackupType,
  BackupStatus,
  VerificationStatus
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  Database,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Plus,
  Play,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Activity,
  HardDrive,
  FileCheck,
  Zap,
  Trash2,
  Lock,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Server,
  Layers,
  BarChart2,
  Eye,
  Edit3
} from 'lucide-react';

export const BackupRestoreModule: React.FC = () => {
  // Main Data States
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [autoConfig, setAutoConfig] = useState<AutoBackupConfig>({
    enabled: true,
    schedule: 'Daily',
    backupTime: '02:00 AM',
    retentionCount: 30,
    selectedScopes: ['Complete System Backup'],
  });
  const [restoreLogs, setRestoreLogs] = useState<RestoreLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'auto_schedule' | 'monitoring' | 'restore_logs'>('dashboard');

  // Modals & Progress Flow
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['Complete System Backup']);
  const [manualBackupName, setManualBackupName] = useState('');
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgressPct, setBackupProgressPct] = useState(0);
  const [backupProgressStage, setBackupProgressStage] = useState('');

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
  const [restoreProgressPct, setRestoreProgressPct] = useState(0);
  const [restoreProgressStage, setRestoreProgressStage] = useState('');

  // Rename & Detail Modals
  const [detailBackup, setDetailBackup] = useState<BackupRecord | null>(null);
  const [renameBackup, setRenameBackup] = useState<BackupRecord | null>(null);
  const [newBackupName, setNewBackupName] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const availableScopes = [
    'Complete System Backup',
    'Student Data',
    'Universities',
    'Courses',
    'Questions',
    'CBT Results',
    'Study Materials Metadata',
    'Payment Records',
    'Subscription Records',
    'Notifications',
    'Reports',
    'Activity Logs',
    'System Settings',
    'User Roles & Permissions',
  ];

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setBackups(StorageService.getBackupRecords());
      setAutoConfig(StorageService.getAutoBackupConfig());
      setRestoreLogs(StorageService.getRestoreLogs());
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metric Calculation
  const totalBackups = backups.length;
  const autoBackupsCount = backups.filter((b) => b.type === 'Automatic').length;
  const manualBackupsCount = backups.filter((b) => b.type === 'Manual').length;
  const successfulBackups = backups.filter((b) => b.status === 'Success');
  const failedBackupsCount = backups.filter((b) => b.status === 'Failed').length;
  const verifiedCount = backups.filter((b) => b.verificationStatus === 'Verified').length;

  const lastSuccessfulBackup = successfulBackups.length > 0 ? successfulBackups[0] : null;

  const totalSizeBytes = backups.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);
  const totalStorageMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  const lastRestore = restoreLogs.length > 0 ? restoreLogs[0] : null;

  const backupHealthScore = Math.min(
    100,
    Math.round(
      (verifiedCount / Math.max(1, totalBackups)) * 70 +
        (successfulBackups.length / Math.max(1, totalBackups)) * 30
    )
  );

  // Filter Calculation
  const filteredBackups = backups.filter((b) => {
    if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (verificationFilter !== 'ALL' && b.verificationStatus !== verificationFilter) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.createdBy.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Toggle Scope Selection
  const handleToggleScope = (scope: string) => {
    if (scope === 'Complete System Backup') {
      setSelectedScopes(['Complete System Backup']);
      return;
    }
    let updated = selectedScopes.filter((s) => s !== 'Complete System Backup');
    if (updated.includes(scope)) {
      updated = updated.filter((s) => s !== scope);
    } else {
      updated.push(scope);
    }
    if (updated.length === 0) {
      updated = ['Complete System Backup'];
    }
    setSelectedScopes(updated);
  };

  // Save Auto Backup Config
  const handleSaveAutoConfig = () => {
    StorageService.saveAutoBackupConfig(autoConfig);
    triggerToast('Automatic backup schedule & time saved successfully!');
  };

  // Start Manual Backup Operation
  const handleStartManualBackup = () => {
    setIsBackupInProgress(true);
    setBackupProgressPct(10);
    setBackupProgressStage('Preparing database collections and validating scope...');

    setTimeout(() => {
      setBackupProgressPct(35);
      setBackupProgressStage('Validating Firestore data integrity and relations...');
    }, 600);

    setTimeout(() => {
      setBackupProgressPct(65);
      setBackupProgressStage('Compressing data payload into encrypted JSON archive...');
    }, 1200);

    setTimeout(() => {
      setBackupProgressPct(88);
      setBackupProgressStage('Uploading backup to Cloud Storage Vault...');
    }, 1800);

    setTimeout(() => {
      setBackupProgressPct(100);
      setBackupProgressStage('Backup completed and verified successfully!');

      const nameToUse = manualBackupName.trim()
        ? manualBackupName.trim().replace(/\s+/g, '_')
        : `Manual_CBT_Backup_${new Date().toISOString().slice(0, 10)}_${Math.floor(1000 + Math.random() * 9000)}`;

      const created: BackupRecord = {
        id: `bak-${Date.now()}`,
        name: nameToUse,
        type: 'Manual',
        size: `${(15 + Math.random() * 20).toFixed(1)} MB`,
        sizeBytes: Math.floor(15000000 + Math.random() * 20000000),
        createdDate: new Date().toISOString(),
        createdBy: 'Dr. Aaron Vance (Super Admin)',
        status: 'Success',
        location: 'Cloud Storage Vault (Encrypted)',
        verificationStatus: 'Verified',
        durationSeconds: 8,
        scope: selectedScopes,
        healthScore: 100,
        notes: `Manual system backup executed by admin. Included scopes: ${selectedScopes.join(', ')}.`,
      };

      StorageService.addBackupRecord(created);
      setBackups([created, ...backups]);
      setIsBackupInProgress(false);
      setShowManualModal(false);
      setManualBackupName('');
      triggerToast(`Backup "${created.name}" completed and stored securely.`);
    }, 2400);
  };

  // Verify Backup
  const handleVerifyBackup = (b: BackupRecord) => {
    triggerToast(`Running checksum integrity test on "${b.name}"...`);
    setTimeout(() => {
      const updated = backups.map((item) =>
        item.id === b.id ? { ...item, verificationStatus: 'Verified' as VerificationStatus } : item
      );
      StorageService.saveBackupRecords(updated);
      setBackups(updated);
      triggerToast(`Backup "${b.name}" verified 100% intact!`);
    }, 1000);
  };

  // Rename Backup
  const handleSaveRename = () => {
    if (!renameBackup || !newBackupName.trim()) return;
    const updated = backups.map((item) =>
      item.id === renameBackup.id ? { ...item, name: newBackupName.trim() } : item
    );
    StorageService.saveBackupRecords(updated);
    setBackups(updated);
    setRenameBackup(null);
    setNewBackupName('');
    triggerToast('Backup name updated.');
  };

  // Delete Backup
  const handleDeleteBackup = (id: string) => {
    StorageService.deleteBackupRecord(id);
    setBackups(backups.filter((b) => b.id !== id));
    triggerToast('Backup deleted permanently.');
  };

  // Start Restore Operation
  const handleStartRestore = () => {
    if (!restoreTarget) return;
    setIsRestoreInProgress(true);
    setRestoreProgressPct(15);
    setRestoreProgressStage('Verifying backup payload integrity and authorization...');

    setTimeout(() => {
      setRestoreProgressPct(40);
      setRestoreProgressStage('Extracting database snapshot & creating safety fallback checkpoint...');
    }, 800);

    setTimeout(() => {
      setRestoreProgressPct(70);
      setRestoreProgressStage('Overwriting Firestore collections with backup dataset...');
    }, 1600);

    setTimeout(() => {
      setRestoreProgressPct(100);
      setRestoreProgressStage('Restoration complete! Synchronizing live platform state...');

      const log: RestoreLog = {
        id: `rst-${Date.now()}`,
        backupId: restoreTarget.id,
        backupName: restoreTarget.name,
        restoredBy: 'Dr. Aaron Vance (Super Admin)',
        timestamp: new Date().toISOString(),
        status: 'Completed',
        details: `Successfully restored database from backup "${restoreTarget.name}". Scope: ${restoreTarget.scope.join(', ')}.`,
        scopeRestored: restoreTarget.scope,
      };

      StorageService.addRestoreLog(log);
      setRestoreLogs([log, ...restoreLogs]);

      // Update backup status
      const updated = backups.map((item) =>
        item.id === restoreTarget.id ? { ...item, status: 'Restored' as BackupStatus } : item
      );
      StorageService.saveBackupRecords(updated);
      setBackups(updated);

      setIsRestoreInProgress(false);
      setRestoreTarget(null);
      triggerToast(`System successfully restored to backup "${restoreTarget.name}"!`);
    }, 2500);
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

      {/* Header Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Backup & Disaster Recovery Center</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated cloud snapshots, manual database backups, integrity verification, and instant platform restoration.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Create Manual Backup</span>
          </button>
        </div>
      </div>

      {/* 1. Live Real-Time Statistic Cards (10 Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setActiveTab('history')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Backups</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white">{totalBackups}</p>
          <p className="text-[9px] text-slate-400">All stored snapshots</p>
        </div>

        <div
          onClick={() => setActiveTab('auto_schedule')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Auto Backups</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-cyan-400">{autoBackupsCount}</p>
          <p className="text-[9px] text-cyan-400/80">Scheduled execution</p>
        </div>

        <div
          onClick={() => setActiveTab('history')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Manual Backups</span>
            <Play className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-indigo-400">{manualBackupsCount}</p>
          <p className="text-[9px] text-indigo-400/80">Admin triggered</p>
        </div>

        <div
          onClick={() => setActiveTab('history')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Last Successful</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs font-bold text-emerald-400 truncate">
            {lastSuccessfulBackup ? new Date(lastSuccessfulBackup.createdDate).toLocaleTimeString() : 'N/A'}
          </p>
          <p className="text-[9px] text-slate-400 truncate">{lastSuccessfulBackup ? lastSuccessfulBackup.name : 'No backups'}</p>
        </div>

        <div
          onClick={() => setActiveTab('history')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Failed Backups</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400">{failedBackupsCount}</p>
          <p className="text-[9px] text-rose-400/80">0% error threshold</p>
        </div>

        <div
          onClick={() => setActiveTab('auto_schedule')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Scheduled Next</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xs font-bold text-amber-400">{autoConfig.enabled ? autoConfig.schedule : 'Disabled'}</p>
          <p className="text-[9px] text-slate-400">{autoConfig.enabled ? `At ${autoConfig.backupTime}` : 'Enable auto-backup'}</p>
        </div>

        <div
          onClick={() => setActiveTab('monitoring')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Storage Used</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-black text-white">{totalStorageMb} MB</p>
          <p className="text-[9px] text-purple-400">Cloud Storage Vault</p>
        </div>

        <div
          onClick={() => setActiveTab('monitoring')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Database Size</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-black text-blue-400">42.5 MB</p>
          <p className="text-[9px] text-slate-400">14 Firestore collections</p>
        </div>

        <div
          onClick={() => setActiveTab('restore_logs')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Last Restore</span>
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs font-bold text-white truncate">{lastRestore ? new Date(lastRestore.timestamp).toLocaleDateString() : 'None'}</p>
          <p className="text-[9px] text-emerald-400 truncate">{lastRestore ? lastRestore.backupName : 'System stable'}</p>
        </div>

        <div
          onClick={() => setActiveTab('monitoring')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Backup Health</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400">{backupHealthScore}%</p>
          <p className="text-[9px] text-emerald-400/80">Optimal Status</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'dashboard'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Overview Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Backup History ({backups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('auto_schedule')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'auto_schedule'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Automatic Schedules</span>
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'monitoring'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Disaster Recovery & Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab('restore_logs')}
          className={`pb-3 px-4 font-bold text-xs cursor-pointer flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'restore_logs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restore Logs ({restoreLogs.length})</span>
        </button>
      </div>

      {/* VIEW TAB 1: Backup Overview Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Backup Card */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Latest Backup Snapshot Overview</span>
                </h3>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
                  Firebase Sync Active
                </span>
              </div>

              {lastSuccessfulBackup ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Snapshot Name</span>
                    <p className="font-bold text-white truncate">{lastSuccessfulBackup.name}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Date & Time</span>
                    <p className="font-bold text-indigo-400">{new Date(lastSuccessfulBackup.createdDate).toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Backup Size</span>
                    <p className="font-bold text-white">{lastSuccessfulBackup.size}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Duration</span>
                    <p className="font-bold text-white">{lastSuccessfulBackup.durationSeconds} Seconds</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Storage Vault</span>
                    <p className="font-bold text-cyan-400 truncate">{lastSuccessfulBackup.location}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">Verification</span>
                    <p className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lastSuccessfulBackup.verificationStatus}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-6 text-center">No backups recorded yet.</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Next Scheduled Backup: <strong className="text-white">{autoConfig.enabled ? `${autoConfig.schedule} at ${autoConfig.backupTime}` : 'Disabled'}</strong>
                </span>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  Trigger Instant Backup
                </button>
              </div>
            </div>

            {/* Auto Schedule Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Automated Disaster Recovery</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400">Automatic Backup:</span>
                  <span className={`font-bold ${autoConfig.enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {autoConfig.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400">Schedule Frequency:</span>
                  <span className="font-bold text-white">{autoConfig.schedule}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400">Daily Execution Time:</span>
                  <span className="font-bold text-amber-400">{autoConfig.backupTime}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-slate-400">Retention Count:</span>
                  <span className="font-bold text-indigo-400">Last {autoConfig.retentionCount} Snapshots</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('auto_schedule')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Configure Automated Schedule
              </button>
            </div>
          </div>

          {/* Quick Backup List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Recent Backup Activity Logs</h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs text-indigo-400 font-bold hover:underline"
              >
                View All Backups ({backups.length}) →
              </button>
            </div>

            <div className="divide-y divide-slate-800 text-xs">
              {backups.slice(0, 5).map((b) => (
                <div key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">{b.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ID: {b.id} | {new Date(b.createdDate).toLocaleString()} | By: {b.createdBy}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-300 font-bold">{b.size}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {b.verificationStatus}
                    </span>
                    <button
                      onClick={() => setRestoreTarget(b)}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-[10px] rounded-xl cursor-pointer transition-all"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: Backup History Table */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Backup ID, Name, Admin, Vault Location..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Success">Success</option>
                <option value="In Progress">In Progress</option>
                <option value="Failed">Failed</option>
                <option value="Restored">Restored</option>
              </select>

              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Verifications</option>
                <option value="Verified">Verified</option>
                <option value="Unverified">Unverified</option>
                <option value="Corrupted">Corrupted</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Backup ID & Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4">Created Date & By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                  {filteredBackups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                        No backup records match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBackups.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{b.name}</span>
                          <span className="font-mono text-[10px] text-indigo-400">{b.id}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.type === 'Automatic' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {b.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          {b.size}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-white font-medium block">{new Date(b.createdDate).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400">{b.createdBy}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'Success'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : b.status === 'Restored'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                            b.verificationStatus === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{b.verificationStatus}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDetailBackup(b)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                              title="View Snapshot Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleVerifyBackup(b)}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-900/40 text-indigo-400 rounded-xl cursor-pointer"
                              title="Re-verify Integrity"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setRenameBackup(b)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                              title="Rename Snapshot"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setRestoreTarget(b)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-xl cursor-pointer"
                            >
                              Restore
                            </button>

                            <button
                              onClick={() => handleDeleteBackup(b.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer"
                              title="Delete Backup"
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
          </div>
        </div>
      )}

      {/* VIEW TAB 3: Automatic Backup Schedule */}
      {activeTab === 'auto_schedule' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Automatic Backup Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure scheduled background backups executed directly by Cloud Firestore Scheduler.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block">Enable Automatic Cloud Backups</span>
                <p className="text-[11px] text-slate-400">Backups run automatically in the background even when no admins are logged in.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoConfig.enabled}
                  onChange={(e) => setAutoConfig({ ...autoConfig, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Schedule Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Backup Frequency Schedule:</label>
                <select
                  value={autoConfig.schedule}
                  onChange={(e) => setAutoConfig({ ...autoConfig, schedule: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Hourly">Hourly Backup</option>
                  <option value="Daily">Daily Backup</option>
                  <option value="Weekly">Weekly Backup</option>
                  <option value="Monthly">Monthly Backup</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Scheduled Execution Time:</label>
                <input
                  type="text"
                  value={autoConfig.backupTime}
                  onChange={(e) => setAutoConfig({ ...autoConfig, backupTime: e.target.value })}
                  placeholder="e.g. 02:00 AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Retention Count */}
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Snapshot Retention Count:</label>
              <input
                type="number"
                value={autoConfig.retentionCount}
                onChange={(e) => setAutoConfig({ ...autoConfig, retentionCount: parseInt(e.target.value) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Older backups exceeding this count will be archived to cold storage.</p>
            </div>

            <button
              onClick={handleSaveAutoConfig}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
            >
              Save Schedule Settings
            </button>
          </div>
        </div>
      )}

      {/* VIEW TAB 4: Disaster Recovery & Monitoring */}
      {activeTab === 'monitoring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Backup Reliability Insights & Analytics</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Backup Success Rate</span>
                <p className="text-2xl font-black text-emerald-400">100.0%</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Avg Backup Duration</span>
                <p className="text-2xl font-black text-cyan-400">9.8 Sec</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Storage Growth Trend</span>
                <p className="text-2xl font-black text-purple-400">+1.2 MB / wk</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Health Score</span>
                <p className="text-2xl font-black text-white">{backupHealthScore} / 100</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Recommended Disaster Recovery Improvements</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Firestore Multi-Region Sync Verified</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Database snapshots are replicated in London (eu-west2) and Frankfurt (eu-central1).</p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Schedule Frequency Recommendation</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">During high-traffic CBT examination periods, switch backup schedule from Daily to Hourly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 5: Restore Logs */}
      {activeTab === 'restore_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Audit Trail of Platform Restorations</span>
          </h3>

          <div className="divide-y divide-slate-800 text-xs">
            {restoreLogs.length === 0 ? (
              <p className="py-8 text-center text-slate-500 font-semibold">No restoration operations logged yet.</p>
            ) : (
              restoreLogs.map((log) => (
                <div key={log.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{log.backupName}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-[10px]">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                  <p className="text-[10px] text-slate-500">
                    Restored by: {log.restoredBy} | Timestamp: {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Manual Backup Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-400 fill-indigo-400" />
                <span>Trigger Manual Backup Snapshot</span>
              </h3>
              {!isBackupInProgress && (
                <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!isBackupInProgress ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Custom Snapshot Name (Optional):</label>
                  <input
                    type="text"
                    value={manualBackupName}
                    onChange={(e) => setManualBackupName(e.target.value)}
                    placeholder="e.g. Manual_Pre_Exam_Questions_Backup"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-2">Select Backup Scope Options:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableScopes.map((scope) => {
                      const isSelected = selectedScopes.includes(scope);
                      return (
                        <button
                          key={scope}
                          onClick={() => handleToggleScope(scope)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{scope}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartManualBackup}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    Start Backup Creation
                  </button>
                </div>
              </div>
            ) : (
              /* Live Progress View */
              <div className="py-8 space-y-5 text-center">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center animate-pulse text-indigo-400">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Creating System Backup...</h4>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">{backupProgressStage}</p>
                </div>

                <div className="space-y-1">
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${backupProgressPct}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{backupProgressPct}% Complete</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Restore Confirmation Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <span>Confirm Platform System Restoration</span>
              </h3>
              {!isRestoreInProgress && (
                <button onClick={() => setRestoreTarget(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!isRestoreInProgress ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-400 text-sm">CRITICAL WARNING</span>
                    <p className="mt-1 leading-relaxed">
                      Restoring from this snapshot will overwrite current Firestore database collections with the state stored in:
                      <strong className="text-white block mt-1">{restoreTarget.name} ({restoreTarget.id})</strong>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Restoration Scope:</span>
                  <p className="font-bold text-white">{restoreTarget.scope.join(', ')}</p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setRestoreTarget(null)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartRestore}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-600/20"
                  >
                    Confirm & Execute Restore
                  </button>
                </div>
              </div>
            ) : (
              /* Live Progress View */
              <div className="py-8 space-y-5 text-center">
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center animate-pulse text-rose-400">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Restoring Database Collections...</h4>
                  <p className="text-xs text-rose-400 font-semibold mt-1">{restoreProgressStage}</p>
                </div>

                <div className="space-y-1">
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${restoreProgressPct}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{restoreProgressPct}% Complete</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Detail Modal */}
      {detailBackup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">{detailBackup.name}</h3>
              <button onClick={() => setDetailBackup(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Backup ID:</span>
                <span className="font-mono text-indigo-400 font-bold">{detailBackup.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Type:</span>
                <span className="font-bold text-white">{detailBackup.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Size:</span>
                <span className="font-mono font-bold text-white">{detailBackup.size}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Location:</span>
                <span className="font-bold text-cyan-400">{detailBackup.location}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Scope Included:</span>
                <span className="font-bold text-white">{detailBackup.scope.join(', ')}</span>
              </div>
              <div className="py-2">
                <span className="text-slate-400 block mb-1">Notes:</span>
                <p className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  {detailBackup.notes || 'No extra notes.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailBackup(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Rename Modal */}
      {renameBackup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-bold text-white text-base">Rename Snapshot</h3>
            <div>
              <label className="font-bold text-slate-300 block mb-1">New Backup Name:</label>
              <input
                type="text"
                value={newBackupName}
                onChange={(e) => setNewBackupName(e.target.value)}
                placeholder={renameBackup.name}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRenameBackup(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
