import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Search,
  Filter,
  Download,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  User,
  Users,
  Building2,
  Lock,
  Key,
  FolderArchive,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  FileCode,
  Calendar,
  X,
  Plus,
  Edit2,
  Trash2,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
  Info,
  Check,
  AlertCircle,
  HelpCircle,
  Server,
  Activity,
  History,
  Archive,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { StorageService, safeStringify } from '../../services/storage';

export interface AuditRecord {
  id: string;
  eventType: string;
  user: string;
  userRole: 'Super Admin' | 'Administrator' | 'Student' | 'System';
  module: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Archived' | 'Under Investigation' | 'Resolved';
  timestamp: string;
  ipAddress: string;
  device: string;
  complianceLevel: 'Compliant' | 'Warning' | 'Non-Compliant';
}

export interface InvestigationItem {
  id: string;
  title: string;
  assignedTo: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
  relatedAuditIds: string[];
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
  timeline: { date: string; note: string; author: string }[];
}

export interface RiskItem {
  id: string;
  category: string;
  riskScore: number;
  level: 'Critical Risk' | 'High Risk' | 'Medium Risk' | 'Low Risk';
  reason: string;
  recommendedAction: string;
  status: 'Open Mitigation' | 'In Progress' | 'Mitigated';
}

export const AuditComplianceModule: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'audit_trail' | 'compliance_flags' | 'investigations' | 'risk_assessment' | 'reports' | 'timeline' | 'retention'
  >('dashboard');

  // Live Auto Refreshing Toggle
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Row Selection for Table
  const [selectedAuditIds, setSelectedAuditIds] = useState<string[]>([]);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<AuditRecord | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // SEED DATA: AUDIT RECORDS
  // ---------------------------------------------------------------------------
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([
    {
      id: 'AUD-9011',
      eventType: 'Permission Changes',
      user: 'Babatunde Lawal (Super Admin)',
      userRole: 'Super Admin',
      module: 'Administrator Management',
      description: 'Elevated role permissions for Admin user "Fatima Yusuf" to Finance Manager.',
      severity: 'Critical',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleString(),
      ipAddress: '102.89.23.14',
      device: 'MacBook Pro - Chrome (Lagos, NG)',
      complianceLevel: 'Compliant'
    },
    {
      id: 'AUD-9010',
      eventType: 'Multiple Failed Logins',
      user: 'unknown_admin@cbtmaster.ng',
      userRole: 'Administrator',
      module: 'Authentication',
      description: '5 consecutive invalid password login attempts detected within 30 seconds.',
      severity: 'High',
      status: 'Under Investigation',
      timestamp: new Date(Date.now() - 1000 * 60 * 28).toLocaleString(),
      ipAddress: '197.210.64.88',
      device: 'Windows 11 - Firefox (Abuja, NG)',
      complianceLevel: 'Non-Compliant'
    },
    {
      id: 'AUD-9009',
      eventType: 'Payment Approval',
      user: 'Chidi Nwosu (Finance Mgr)',
      userRole: 'Administrator',
      module: 'Financial Management',
      description: 'Manually verified bank transfer payment transaction #PAY-88219 (₦15,000 for UNILAG Premium Plan).',
      severity: 'Medium',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleString(),
      ipAddress: '102.89.44.101',
      device: 'Windows 10 - Edge (Ibadan, NG)',
      complianceLevel: 'Compliant'
    },
    {
      id: 'AUD-9008',
      eventType: 'Database Configuration Changes',
      user: 'Babatunde Lawal (Super Admin)',
      userRole: 'Super Admin',
      module: 'Database Settings',
      description: 'Updated Firestore read replica threshold limits and re-indexed course collection.',
      severity: 'Medium',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toLocaleString(),
      ipAddress: '102.89.23.14',
      device: 'MacBook Pro - Chrome (Lagos, NG)',
      complianceLevel: 'Compliant'
    },
    {
      id: 'AUD-9007',
      eventType: 'Large Data Exports',
      user: 'Emanuel Ojo (Question Mgr)',
      userRole: 'Administrator',
      module: 'Question Bank',
      description: 'Exported 1,500 questions from GST101 course pool into CSV format.',
      severity: 'High',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 150).toLocaleString(),
      ipAddress: '197.210.22.19',
      device: 'Linux Ubuntu - Firefox (Kano, NG)',
      complianceLevel: 'Warning'
    },
    {
      id: 'AUD-9006',
      eventType: 'Question Approval',
      user: 'Emanuel Ojo (Question Mgr)',
      userRole: 'Administrator',
      module: 'Review Workflow',
      description: 'Batch approved 45 student-submitted GST108 questions into production pool.',
      severity: 'Low',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 220).toLocaleString(),
      ipAddress: '197.210.22.19',
      device: 'Linux Ubuntu - Firefox (Kano, NG)',
      complianceLevel: 'Compliant'
    },
    {
      id: 'AUD-9005',
      eventType: 'Student Account Violations',
      user: 'Student #STU-4821 (Amina Bello)',
      userRole: 'Student',
      module: 'CBT Test Engine',
      description: 'Tab switching and window blur detected 4 times during GST101 live examination session.',
      severity: 'High',
      status: 'Under Investigation',
      timestamp: new Date(Date.now() - 1000 * 60 * 310).toLocaleString(),
      ipAddress: '102.89.10.82',
      device: 'Android Mobile - Chrome (Zaria, NG)',
      complianceLevel: 'Non-Compliant'
    },
    {
      id: 'AUD-9004',
      eventType: 'Maintenance Mode Toggled',
      user: 'System Automated Guard',
      userRole: 'System',
      module: 'System Health',
      description: 'Automated 15-minute maintenance mode check performed successfully.',
      severity: 'Low',
      status: 'Resolved',
      timestamp: new Date(Date.now() - 1000 * 60 * 420).toLocaleString(),
      ipAddress: '127.0.0.1 (Internal)',
      device: 'Cloud Run Worker Node',
      complianceLevel: 'Compliant'
    },
    {
      id: 'AUD-9003',
      eventType: 'Backup Creation',
      user: 'Babatunde Lawal (Super Admin)',
      userRole: 'Super Admin',
      module: 'Backup & Restore',
      description: 'Created full system Firestore snapshot backup #BK-2026-0723.',
      severity: 'Low',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 600).toLocaleString(),
      ipAddress: '102.89.23.14',
      device: 'MacBook Pro - Chrome (Lagos, NG)',
      complianceLevel: 'Compliant'
    },
    {
      id: 'AUD-9002',
      eventType: 'Password Reset',
      user: 'Amina Bello (Student)',
      userRole: 'Student',
      module: 'Authentication',
      description: 'Self-service account password reset completed via verified email token.',
      severity: 'Low',
      status: 'Active',
      timestamp: new Date(Date.now() - 1000 * 60 * 750).toLocaleString(),
      ipAddress: '102.89.10.82',
      device: 'Android Mobile - Chrome (Zaria, NG)',
      complianceLevel: 'Compliant'
    }
  ]);

  // ---------------------------------------------------------------------------
  // SEED DATA: INVESTIGATIONS
  // ---------------------------------------------------------------------------
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([
    {
      id: 'INV-701',
      title: 'Suspicious Multiple Failed Logins on Admin Account',
      assignedTo: 'Babatunde Lawal (Super Admin)',
      status: 'Under Review',
      relatedAuditIds: ['AUD-9010'],
      createdAt: 'Today, 04:30 AM',
      updatedAt: 'Today, 05:10 AM',
      resolutionNotes: 'IP address flagged and placed under temporary 24-hour rate limit barrier.',
      timeline: [
        { date: 'Today, 04:30 AM', note: 'Automated alert opened investigation upon 5 failed logins.', author: 'Security Bot' },
        { date: 'Today, 05:10 AM', note: 'Contacted user to verify password reset status.', author: 'Babatunde Lawal' }
      ]
    },
    {
      id: 'INV-702',
      title: 'Exam Integrity Switch Blur Violation (Student #STU-4821)',
      assignedTo: 'Kemi Adebayo (Support Mgr)',
      status: 'Open',
      relatedAuditIds: ['AUD-9005'],
      createdAt: 'Today, 01:15 AM',
      updatedAt: 'Today, 01:15 AM',
      resolutionNotes: 'Pending review of screen recorder telemetry log.',
      timeline: [
        { date: 'Today, 01:15 AM', note: 'CBT Anti-Cheat engine triggered tab focus loss violation flag.', author: 'CBT Engine' }
      ]
    },
    {
      id: 'INV-700',
      title: 'Unusual Bulk Question Data Export Check',
      assignedTo: 'Babatunde Lawal (Super Admin)',
      status: 'Resolved',
      relatedAuditIds: ['AUD-9007'],
      createdAt: 'Yesterday, 08:00 PM',
      updatedAt: 'Yesterday, 09:30 PM',
      resolutionNotes: 'Export was verified as authorized preparation for printed mock exam booklet.',
      timeline: [
        { date: 'Yesterday, 08:00 PM', note: 'Investigation opened due to export threshold exceeding 1,000 items.', author: 'Audit System' },
        { date: 'Yesterday, 09:30 PM', note: 'Confirmed with Question Manager Emanuel Ojo. Marked resolved.', author: 'Babatunde Lawal' }
      ]
    }
  ]);

  // Modal State for New Investigation
  const [newInvModalOpen, setNewInvModalOpen] = useState(false);
  const [newInvTitle, setNewInvTitle] = useState('');
  const [newInvAssignee, setNewInvAssignee] = useState('Babatunde Lawal (Super Admin)');
  const [newInvAuditId, setNewInvAuditId] = useState('');

  // Selected Investigation for View/Edit
  const [selectedInv, setSelectedInv] = useState<InvestigationItem | null>(null);
  const [invNoteInput, setInvNoteInput] = useState('');

  // Retention Config State
  const [retentionDays, setRetentionDays] = useState('180');
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(true);
  const [archivedRecordsCount, setArchivedRecordsCount] = useState(2410);

  // Live Auto Pulse simulation
  useEffect(() => {
    if (!isLiveUpdating) return;
    const timer = setInterval(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(timer);
  }, [isLiveUpdating]);

  // Filtered Audits Logic
  const filteredRecords = auditRecords.filter(rec => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      rec.id.toLowerCase().includes(term) ||
      rec.user.toLowerCase().includes(term) ||
      rec.description.toLowerCase().includes(term) ||
      rec.eventType.toLowerCase().includes(term) ||
      rec.module.toLowerCase().includes(term) ||
      rec.ipAddress.toLowerCase().includes(term);

    const matchesSeverity = severityFilter === 'all' || rec.severity === severityFilter;
    const matchesEventType = eventTypeFilter === 'all' || rec.eventType.toLowerCase().includes(eventTypeFilter.toLowerCase());
    const matchesModule = moduleFilter === 'all' || rec.module.toLowerCase().includes(moduleFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesCompliance = complianceFilter === 'all' || rec.complianceLevel === complianceFilter;

    return matchesSearch && matchesSeverity && matchesEventType && matchesModule && matchesStatus && matchesCompliance;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const currentRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Statistics Calculation
  const totalAuditRecords = auditRecords.length + archivedRecordsCount;
  const securityEvents = auditRecords.filter(r => r.module === 'Authentication' || r.module === 'Security' || r.eventType.includes('Login') || r.eventType.includes('Permission')).length;
  const criticalEvents = auditRecords.filter(r => r.severity === 'Critical').length;
  const highRiskActivities = auditRecords.filter(r => r.severity === 'High').length;
  const policyViolations = auditRecords.filter(r => r.complianceLevel === 'Non-Compliant').length;
  const failedComplianceChecks = auditRecords.filter(r => r.complianceLevel === 'Warning' || r.complianceLevel === 'Non-Compliant').length;
  const adminActions = auditRecords.filter(r => r.userRole === 'Super Admin' || r.userRole === 'Administrator').length;
  const studentViolations = auditRecords.filter(r => r.userRole === 'Student' && r.complianceLevel !== 'Compliant').length;
  const permissionChanges = auditRecords.filter(r => r.eventType.includes('Permission') || r.eventType.includes('Role')).length;
  const sysConfigChanges = auditRecords.filter(r => r.module.includes('Settings') || r.module.includes('Database') || r.module.includes('System')).length;
  const financialEvents = auditRecords.filter(r => r.module.includes('Financial') || r.eventType.includes('Payment')).length;
  const openInvestigationsCount = investigations.filter(i => i.status === 'Open' || i.status === 'Under Review').length;

  // Handlers
  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAuditIds(currentRecords.map(r => r.id));
    } else {
      setSelectedAuditIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedAuditIds.includes(id)) {
      setSelectedAuditIds(selectedAuditIds.filter(i => i !== id));
    } else {
      setSelectedAuditIds([...selectedAuditIds, id]);
    }
  };

  const handleArchiveSelected = () => {
    if (selectedAuditIds.length === 0) {
      showToast('Please select at least one audit record to archive.', 'error');
      return;
    }
    setAuditRecords(auditRecords.map(r => selectedAuditIds.includes(r.id) ? { ...r, status: 'Archived' } : r));
    setArchivedRecordsCount(prev => prev + selectedAuditIds.length);
    setSelectedAuditIds([]);
    showToast(`${selectedAuditIds.length} audit records securely archived.`, 'success');
  };

  const handleCreateInvestigation = () => {
    if (!newInvTitle) {
      showToast('Please enter an investigation title.', 'error');
      return;
    }
    const newInv: InvestigationItem = {
      id: `INV-${Math.floor(100 + Math.random() * 900)}`,
      title: newInvTitle,
      assignedTo: newInvAssignee,
      status: 'Open',
      relatedAuditIds: newInvAuditId ? [newInvAuditId] : [],
      createdAt: 'Just now',
      updatedAt: 'Just now',
      timeline: [
        { date: 'Just now', note: 'Investigation opened by Super Administrator.', author: 'Super Admin' }
      ]
    };
    setInvestigations([newInv, ...investigations]);
    setNewInvModalOpen(false);
    setNewInvTitle('');
    setNewInvAuditId('');
    showToast(`Investigation ${newInv.id} created successfully.`, 'success');
  };

  const handleAddInvNote = (invId: string) => {
    if (!invNoteInput.trim()) return;
    setInvestigations(investigations.map(inv => {
      if (inv.id === invId) {
        return {
          ...inv,
          updatedAt: 'Just now',
          timeline: [...inv.timeline, { date: 'Just now', note: invNoteInput, author: 'Super Admin' }]
        };
      }
      return inv;
    }));
    setInvNoteInput('');
    showToast('Investigation note appended.', 'success');
  };

  const handleUpdateInvStatus = (invId: string, status: 'Open' | 'Under Review' | 'Resolved' | 'Closed') => {
    setInvestigations(investigations.map(inv => inv.id === invId ? { ...inv, status, updatedAt: 'Just now' } : inv));
    showToast(`Investigation ${invId} marked as ${status}.`, 'info');
  };

  const handleExportData = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(safeStringify({
      reportTitle: 'CBT Master Audit & Compliance Governance Report',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Super Administrator',
      totalRecords: filteredRecords.length,
      records: filteredRecords
    }, 2));

    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `audit_compliance_report_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);

    showToast(`Audit & Compliance Report exported as ${format}.`, 'success');
  };

  return (
    <div className="space-y-6" id="audit-compliance-module-root">
      
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

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">Audit & Compliance Center</h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" />
                Immutable Governance Log
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Super Admin oversight of administrative activities, security policy compliance, risk assessments & investigation workflows.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setIsLiveUpdating(!isLiveUpdating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all ${
              isLiveUpdating
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveUpdating ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLiveUpdating ? 'Live Sync Active' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={() => setNewInvModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Open Investigation</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => handleExportData('CSV')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExportData('PDF')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-indigo-400" />
              <span>Report PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. REAL-TIME AUDIT DASHBOARD STAT CARDS (12 CARDS GRID)                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Audit Records */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setStatusFilter('all'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Total Audit Records</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{totalAuditRecords.toLocaleString()}</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Cloud Firestore Synced</span>
        </div>

        {/* Security Events */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setModuleFilter('Authentication'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-sky-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Security Events</span>
            <ShieldAlert className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-1">{securityEvents}</p>
          <span className="text-[10px] text-sky-400 font-medium mt-1 block">Auth & Access Log</span>
        </div>

        {/* Critical Events */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setSeverityFilter('Critical'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-rose-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Critical Events</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1">{criticalEvents}</p>
          <span className="text-[10px] text-rose-300/80 font-medium mt-1 block">Immediate Review Needed</span>
        </div>

        {/* High Risk Activities */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setSeverityFilter('High'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">High Risk Activities</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">{highRiskActivities}</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">Automated Flagged</span>
        </div>

        {/* Policy Violations */}
        <div
          onClick={() => { setActiveTab('compliance_flags'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-rose-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Policy Violations</span>
            <X className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-300 mt-1">{policyViolations}</p>
          <span className="text-[10px] text-rose-400/80 font-medium mt-1 block">Rule Non-Compliance</span>
        </div>

        {/* Failed Compliance Checks */}
        <div
          onClick={() => { setActiveTab('compliance_flags'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Failed Compliance</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">{failedComplianceChecks}</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">Checks Requiring Action</span>
        </div>

        {/* Administrator Actions */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setEventTypeFilter('Permission'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Administrator Actions</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">{adminActions}</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Admin Activity Log</span>
        </div>

        {/* Student Account Violations */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setModuleFilter('CBT Test Engine'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-sky-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Student Violations</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-1">{studentViolations}</p>
          <span className="text-[10px] text-sky-400/80 font-medium mt-1 block">Exam Integrity Flags</span>
        </div>

        {/* Permission Changes */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setEventTypeFilter('Permission'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Permission Changes</span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">{permissionChanges}</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">Role & Matrix Modifications</span>
        </div>

        {/* System Configuration Changes */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setModuleFilter('Database Settings'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-amber-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">System Config Changes</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">{sysConfigChanges}</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">Settings & Firestore Tweaks</span>
        </div>

        {/* Financial Audit Events */}
        <div
          onClick={() => { setActiveTab('audit_trail'); setModuleFilter('Financial Management'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Financial Audit Events</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-1">{financialEvents}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Payment Approvals & Refunds</span>
        </div>

        {/* Open Investigations */}
        <div
          onClick={() => { setActiveTab('investigations'); }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Open Investigations</span>
            <Search className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-1">{openInvestigationsCount}</p>
          <span className="text-[10px] text-indigo-300/80 font-medium mt-1 block">Active Cases Under Review</span>
        </div>

      </div>

      {/* Sub-Tab Module Selector */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto text-xs">
        {[
          { id: 'dashboard', label: 'Overview & Audit Log', icon: BarChart3 },
          { id: 'audit_trail', label: 'Full Audit Trail', icon: FileText },
          { id: 'compliance_flags', label: 'Compliance Monitoring', icon: ShieldAlert },
          { id: 'investigations', label: 'Investigation Center', icon: Search },
          { id: 'risk_assessment', label: 'Risk Assessment', icon: AlertTriangle },
          { id: 'reports', label: 'Compliance Reports', icon: FileSpreadsheet },
          { id: 'timeline', label: 'Audit Timeline', icon: Clock },
          { id: 'retention', label: 'Retention & Archive', icon: Archive }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
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
      {/* 2 & 3. AUDIT RECORDS TABLE & SEARCH FILTERS                                */}
      {/* ========================================================================= */}
      {(activeTab === 'dashboard' || activeTab === 'audit_trail') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs">
            
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Audit ID, Admin, Student, Event, Keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
                <option value="Archived">Archived</option>
              </select>

              {/* Compliance Filter */}
              <select
                value={complianceFilter}
                onChange={(e) => setComplianceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none"
              >
                <option value="all">All Compliance Levels</option>
                <option value="Compliant">Compliant</option>
                <option value="Warning">Warning</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>

              {/* Batch Action */}
              {selectedAuditIds.length > 0 && (
                <button
                  onClick={handleArchiveSelected}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Selected ({selectedAuditIds.length})</span>
                </button>
              )}

            </div>

          </div>

          {/* Audit Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllRows}
                      checked={selectedAuditIds.length === currentRecords.length && currentRecords.length > 0}
                      className="rounded accent-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">User & Role</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Compliance</th>
                  <th className="p-3">Timestamp & Device</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedAuditIds.includes(rec.id)}
                        onChange={() => handleSelectRow(rec.id)}
                        className="rounded accent-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3 font-mono font-bold text-indigo-400">
                      {rec.id}
                    </td>

                    <td className="p-3 font-bold text-white">
                      {rec.eventType}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-200">{rec.user}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{rec.userRole}</span>
                    </td>

                    <td className="p-3 text-slate-300">
                      {rec.module}
                    </td>

                    <td className="p-3 text-slate-300 max-w-xs truncate" title={rec.description}>
                      {rec.description}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                        rec.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : rec.severity === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : rec.severity === 'Medium'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {rec.severity}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 w-fit ${
                        rec.complianceLevel === 'Compliant'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : rec.complianceLevel === 'Warning'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                      }`}>
                        {rec.complianceLevel === 'Compliant' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{rec.complianceLevel}</span>
                      </span>
                    </td>

                    <td className="p-3 text-[11px]">
                      <div className="text-slate-300 font-mono">{rec.timestamp}</div>
                      <div className="text-slate-500 text-[10px]">{rec.ipAddress} • {rec.device}</div>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedRecordDetail(rec)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-indigo-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Showing <span className="font-bold text-white">{filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="font-bold text-white">{filteredRecords.length}</span> records
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-mono font-bold text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg font-bold text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. COMPLIANCE MONITORING FLAGS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'compliance_flags' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Automated Compliance Rules Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Continuous monitoring against platform governance policies & suspicious behavior indicators.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full">
              8 Compliance Guards Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              { rule: 'Unauthorized Permission Escalation', desc: 'Alerts when administrator permissions are modified without dual-key Super Admin token.', status: 'Enforced', risk: 'Critical Risk' },
              { rule: 'Multiple Failed Admin Login Velocity', desc: 'Triggers lock barrier upon 5 failed attempts in 60s window.', status: 'Enforced', risk: 'High Risk' },
              { rule: 'Excessive Account Mass Deletions', desc: 'Flags any admin session deleting > 5 student records in a single session.', status: 'Enforced', risk: 'Critical Risk' },
              { rule: 'Frequent System Configuration Changes', desc: 'Monitors database and index schema modifications across short intervals.', status: 'Enforced', risk: 'Medium Risk' },
              { rule: 'Suspicious Financial Transactions', desc: 'Monitors manual refund or payment verification over threshold limit.', status: 'Enforced', risk: 'High Risk' },
              { rule: 'Bulk Question Data Export Safeguard', desc: 'Requires reason confirmation for exports exceeding 1,000 questions.', status: 'Enforced', risk: 'Medium Risk' }
            ].map((guard, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{guard.rule}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded text-[10px]">{guard.status}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{guard.desc}</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold rounded-lg text-[10px] shrink-0">
                  {guard.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. INVESTIGATION CENTER                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'investigations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Investigations List */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Active Investigations ({investigations.length})</span>
              </h3>
              <button
                onClick={() => setNewInvModalOpen(true)}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {investigations.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInv(inv)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedInv?.id === inv.id
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono font-bold text-indigo-400 text-xs">{inv.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'Open' ? 'bg-amber-500/20 text-amber-300' : inv.status === 'Under Review' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs mt-1 line-clamp-2">{inv.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>Assigned: {inv.assignedTo.split(' ')[0]}</span>
                    <span>{inv.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigation Detail Workspace */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            {selectedInv ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-indigo-400 text-sm">{selectedInv.id}</span>
                      <h3 className="font-bold text-white text-sm">{selectedInv.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Assigned Investigator: <span className="text-white font-bold">{selectedInv.assignedTo}</span></p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
                    {(['Open', 'Under Review', 'Resolved', 'Closed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateInvStatus(selectedInv.id, st)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                          selectedInv.status === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline Notes */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-xs">Investigation Timeline & Audit Trail</h4>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs max-h-64 overflow-y-auto">
                    {selectedInv.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 border-b border-slate-900/80 pb-2">
                        <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="font-bold text-indigo-300">{item.author}</span>
                            <span className="text-slate-500">• {item.date}</span>
                          </div>
                          <p className="text-slate-200 mt-0.5">{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Append Note Input */}
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-300">Append Resolution Note / Investigation Update</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type note or verification observation..."
                      value={invNoteInput}
                      onChange={(e) => setInvNoteInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleAddInvNote(selectedInv.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      Append Note
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center space-y-3 text-slate-500">
                <Search className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-xs">Select an investigation from the left panel to review or append notes.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. RISK ASSESSMENT MODULE                                                */}
      {/* ========================================================================= */}
      {activeTab === 'risk_assessment' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Automated Platform Risk Assessment Index</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Continuous calculation of security threat levels, risk vectors, and recommended mitigations.</p>
            </div>
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-full">
              Overall Risk Level: LOW
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[
              { id: 'RISK-101', category: 'Authentication & Credential Theft', score: 18, level: 'Low Risk', reason: 'Enforced rate limiting and 2FA OAuth active for Super Administrators.', recommended: 'Maintain current 30-day token rotation schedule.', status: 'Mitigated' },
              { id: 'RISK-102', category: 'Data Loss & Backup Integrity', score: 12, level: 'Low Risk', reason: 'Automated daily snapshot backups stored in multi-region bucket.', recommended: 'Perform quarterly disaster recovery drill.', status: 'Mitigated' },
              { id: 'RISK-103', category: 'CBT Exam Integrity & Tab Switch', score: 45, level: 'Medium Risk', reason: 'High student traffic on slow connections causing occasional reconnection blur flags.', recommended: 'Deploy client-side offline retry buffer.', status: 'In Progress' }
            ].map(risk => (
              <div key={risk.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-400 font-bold">{risk.id}</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                    risk.level.includes('Low') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {risk.level} ({risk.score}/100)
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs">{risk.category}</h4>
                <p className="text-slate-400 text-[11px]">{risk.reason}</p>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-indigo-300 text-[10px]">
                  <strong>Action:</strong> {risk.recommended}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7 & 11. COMPLIANCE REPORTS & EXPORTS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>Dynamic Compliance Report Generator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Generate official audit, financial, administrator activity & system configuration compliance documents.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { title: 'Security Compliance Audit', desc: 'Full log of login security, role modifications & access guards.', icon: ShieldCheck },
              { title: 'Financial Audit Report', desc: 'Detailed log of manual payment approvals, refunds & subscription changes.', icon: DollarSign },
              { title: 'Administrator Activity Audit', desc: 'Comprehensive record of all admin management operations.', icon: UserCheck },
              { title: 'System Configuration Audit', desc: 'Firestore index settings, maintenance logs & database changes.', icon: Server }
            ].map((rep, idx) => {
              const Icon = rep.icon;
              return (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl w-fit">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{rep.title}</h4>
                    <p className="text-slate-400 text-[11px] mt-1">{rep.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => handleExportData('PDF')}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer text-[11px]"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExportData('CSV')}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg cursor-pointer text-[11px]"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. CHRONOLOGICAL AUDIT TIMELINE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Chronological Event Timeline</span>
            </h3>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
              {(['today', 'week', 'month', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDateRangeFilter(f)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer capitalize ${
                    dateRangeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="relative border-l-2 border-indigo-500/30 pl-6 space-y-6 text-xs">
            {auditRecords.map((rec, idx) => (
              <div key={rec.id} className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900" />
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-indigo-400">{rec.id} • {rec.eventType}</span>
                    <span className="text-slate-500">{rec.timestamp}</span>
                  </div>
                  <p className="text-white font-medium">{rec.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>User: <strong className="text-slate-200">{rec.user}</strong></span>
                    <span>Module: <strong className="text-slate-200">{rec.module}</strong></span>
                    <span>IP: <strong className="text-slate-200">{rec.ipAddress}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. RETENTION & ARCHIVE CONTROLS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'retention' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <span>Audit Data Retention & Archiving Policy</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure automated archiving, long-term cold storage & non-deletion enforcement.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="font-bold text-white text-xs">Retention Period Settings</h4>
              <p className="text-slate-400 text-[11px]">Audit logs older than the threshold will be moved to compressed Firestore cold storage.</p>
              
              <div className="space-y-2">
                <label className="text-slate-300 font-bold">Auto-Archive Threshold</label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days (Recommended)</option>
                  <option value="365">365 Days (1 Year)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-bold">Enable Automated Nightly Archiving</span>
                <input
                  type="checkbox"
                  checked={autoArchiveEnabled}
                  onChange={(e) => setAutoArchiveEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-white text-xs">Archived Vault Overview</h4>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Total Records Archived in Vault</span>
                <span className="font-mono font-black text-amber-300 text-sm">{archivedRecordsCount.toLocaleString()}</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Immutable protection active. Regular administrators cannot modify or delete audit records. Only Super Administrator key can archive or restore records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Record Modal */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Audit Record Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Audit ID:</span>
                <span className="font-mono font-bold text-indigo-400">{selectedRecordDetail.id}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Event Type:</span>
                <span className="font-bold text-white">{selectedRecordDetail.eventType}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">User & Role:</span>
                <span className="font-bold text-white">{selectedRecordDetail.user} ({selectedRecordDetail.userRole})</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Description:</span>
                <p className="text-slate-200">{selectedRecordDetail.description}</p>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">IP & Device:</span>
                <span className="font-mono text-slate-300">{selectedRecordDetail.ipAddress} • {selectedRecordDetail.device}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedRecordDetail(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
            >
              Close Inspection Window
            </button>
          </div>
        </div>
      )}

      {/* New Investigation Modal */}
      {newInvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Open Security Investigation</h3>
              <button
                onClick={() => setNewInvModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Investigation Subject / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Unusual Admin Password Attempts"
                  value={newInvTitle}
                  onChange={(e) => setNewInvTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Assigned Administrator</label>
                <select
                  value={newInvAssignee}
                  onChange={(e) => setNewInvAssignee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="Babatunde Lawal (Super Admin)">Babatunde Lawal (Super Admin)</option>
                  <option value="Fatima Yusuf (Finance Mgr)">Fatima Yusuf (Finance Mgr)</option>
                  <option value="Kemi Adebayo (Support Mgr)">Kemi Adebayo (Support Mgr)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Related Audit ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AUD-9010"
                  value={newInvAuditId}
                  onChange={(e) => setNewInvAuditId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setNewInvModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvestigation}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
              >
                Create Case
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
