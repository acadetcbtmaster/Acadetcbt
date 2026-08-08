import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Shield,
  ShieldAlert,
  Zap,
  HardDrive,
  Cpu,
  Radio,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  Users,
  Lock,
  FileText,
  FileSpreadsheet,
  AlertOctagon,
  Globe,
  Sliders,
  Check,
  X,
  Wrench,
  Play,
  Square,
  Calendar,
  Terminal,
  HelpCircle,
  Eye
} from 'lucide-react';
import { StorageService, safeStringify } from '../../services/storage';

export interface SystemErrorItem {
  id: string;
  type: 'Firebase' | 'Database' | 'Authentication' | 'Network' | 'Upload' | 'Payment' | 'CBT Engine' | 'System';
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  module: string;
  status: 'Active' | 'Resolved' | 'Assigned';
  assignedTo?: string;
}

export interface SystemLogItem {
  id: string;
  level: 'Error' | 'Warning' | 'Info' | 'Debug';
  category: 'Firebase' | 'Performance' | 'Maintenance' | 'Service' | 'Security';
  message: string;
  timestamp: string;
  source: string;
}

export const SystemHealthModule: React.FC = () => {
  // Live Timeframe Toggle
  const [timeframe, setTimeframe] = useState<'Live' | 'Hourly' | 'Daily' | 'Weekly' | 'Monthly'>('Live');

  // Auto Refreshing Metrics Simulator
  const [cpuUsage, setCpuUsage] = useState(24);
  const [memoryUsage, setMemoryUsage] = useState(42);
  const [diskUsage, setDiskUsage] = useState(31);
  const [networkUsage, setNetworkUsage] = useState(18);
  const [dbResponseTime, setDbResponseTime] = useState(14);
  const [serverResponseTime, setServerResponseTime] = useState(24);
  const [activeConnections, setActiveConnections] = useState(184);

  // Active Tab View: 'dashboard' | 'performance' | 'firebase' | 'database' | 'errors' | 'security' | 'insights' | 'maintenance' | 'logs'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'performance' | 'firebase' | 'database' | 'errors' | 'security' | 'insights' | 'maintenance' | 'logs'>('dashboard');

  // Search & Filters for Error & System Logs
  const [errorSearch, setErrorSearch] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState('all');
  const [errorSeverityFilter, setErrorSeverityFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  // Maintenance State
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Scheduled system database optimization and index re-building in progress.');
  const [scheduledWindow, setScheduledWindow] = useState('Sunday, 02:00 AM - 04:00 AM UTC');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Error Log State
  const [errorsList, setErrorsList] = useState<SystemErrorItem[]>([
    {
      id: 'ERR-8801',
      type: 'Firebase',
      description: 'Firestore quota warning threshold (85% reads/sec reached during peak exam session)',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(),
      module: 'Firestore Sync',
      status: 'Active'
    },
    {
      id: 'ERR-8802',
      type: 'Payment',
      description: 'Paystack webhook timeout retry attempt #2 for transaction REF-77182',
      severity: 'Low',
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toLocaleTimeString(),
      module: 'Payment Gateway',
      status: 'Resolved',
      assignedTo: 'Finance Manager'
    },
    {
      id: 'ERR-8803',
      type: 'CBT Engine',
      description: 'Timer clock latency drift detected (+1.2s) on slow 2G mobile client connection',
      severity: 'Low',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString(),
      module: 'CBT Test Engine',
      status: 'Active'
    }
  ]);

  // System Logs Stream
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>([
    { id: 'LOG-101', level: 'Info', category: 'Firebase', message: 'Firestore snapshot connection synchronized successfully across 184 clients.', timestamp: 'Just now', source: 'Firestore Provider' },
    { id: 'LOG-102', level: 'Warning', category: 'Performance', message: 'Memory spike detected on worker node #2 (42% utilization peak).', timestamp: '2 mins ago', source: 'Cluster Monitor' },
    { id: 'LOG-103', level: 'Info', category: 'Security', message: 'RBAC permissions matrix verified for 5 active administrators.', timestamp: '5 mins ago', source: 'Auth Guard' },
    { id: 'LOG-104', level: 'Error', category: 'Performance', message: 'Index scan latency on questions_collection exceeded 45ms threshold.', timestamp: '12 mins ago', source: 'Query Analyzer' },
    { id: 'LOG-105', level: 'Info', category: 'Service', message: 'Smart Question Generator model endpoint health check passed (12ms ping).', timestamp: '18 mins ago', source: 'SMART Bridge' }
  ]);

  // Periodic Pulse simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.min(Math.max(prev + (Math.floor(Math.random() * 5) - 2), 12), 65));
      setMemoryUsage(prev => Math.min(Math.max(prev + (Math.floor(Math.random() * 3) - 1), 35), 58));
      setDbResponseTime(prev => Math.min(Math.max(prev + (Math.floor(Math.random() * 3) - 1), 8), 32));
      setServerResponseTime(prev => Math.min(Math.max(prev + (Math.floor(Math.random() * 4) - 2), 16), 45));
      setActiveConnections(prev => Math.min(Math.max(prev + (Math.floor(Math.random() * 7) - 3), 150), 240));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleToggleMaintenance = () => {
    const nextState = !isMaintenanceActive;
    setIsMaintenanceActive(nextState);
    StorageService.addActivityLog(
      `${nextState ? 'Started' : 'Ended'} Emergency System Maintenance Mode`,
      'Super Administrator',
      'MAINTENANCE_TOGGLED'
    );
    showToast(`System Maintenance Mode ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}.`, nextState ? 'info' : 'success');
  };

  const handleResolveError = (id: string) => {
    setErrorsList(errorsList.map(e => e.id === id ? { ...e, status: 'Resolved' } : e));
    showToast(`Error ${id} marked as resolved.`, 'success');
  };

  const handleExportReport = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(safeStringify({
      systemHealthScore: 98,
      uptime: '99.98%',
      cpuUsage: `${cpuUsage}%`,
      memoryUsage: `${memoryUsage}%`,
      dbLatency: `${dbResponseTime}ms`,
      activeErrors: errorsList.filter(e => e.status === 'Active').length,
      exportedAt: new Date().toISOString()
    }, 2));

    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `system_health_report_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);

    showToast(`System Monitoring Diagnostic Report exported as ${format}.`);
  };

  // Filtered Errors
  const filteredErrors = errorsList.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(errorSearch.toLowerCase()) || e.id.toLowerCase().includes(errorSearch.toLowerCase());
    const matchesType = errorTypeFilter === 'all' || e.type === errorTypeFilter;
    const matchesSeverity = errorSeverityFilter === 'all' || e.severity === errorSeverityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  return (
    <div className="space-y-6" id="system-health-module-root">
      
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
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">System Monitoring & Health Center</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Monitoring Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Continuous operational overview of Cloud Firestore, server response times, active connections, security threats & Smart Health Analysis.
            </p>
          </div>
        </div>

        {/* Timeframe & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs">
            {(['Live', 'Hourly', 'Daily', 'Weekly', 'Monthly'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => handleExportReport('CSV')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExportReport('PDF')}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-indigo-400" />
              <span>Report PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Maintenance Mode Emergency Alert Banner (If Active) */}
      {isMaintenanceActive && (
        <div className="bg-amber-950/80 border border-amber-500/50 p-4 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-extrabold text-amber-200 text-xs uppercase tracking-wider">System Maintenance Mode Active</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">{maintenanceMessage}</p>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer shrink-0"
          >
            End Maintenance Mode
          </button>
        </div>
      )}

      {/* 1. Real-Time System Health Cards (12 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Overall System Health */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Overall System Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">99.8%</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">Optimal Operational</span>
        </div>

        {/* Firebase Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Firebase Services</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-2xl font-black text-white mt-1">Online</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Authentication & SDK</span>
        </div>

        {/* Firestore Database */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Firestore Status</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">Connected</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">24 Collections Sync</span>
        </div>

        {/* Firebase Auth Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Firebase Auth</span>
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-1">Active</p>
          <span className="text-[10px] text-sky-400/80 font-medium mt-1 block">OAuth & Tokens OK</span>
        </div>

        {/* Firebase Storage Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Firebase Storage</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">Normal</p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">28% Quota Used</span>
        </div>

        {/* Hosting Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Cloud Hosting</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">Operational</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">SSL Validated</span>
        </div>

        {/* Database Response Time */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">DB Latency</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">{dbResponseTime} ms</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Fast Query Time</span>
        </div>

        {/* Server Response Time */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Server Latency</span>
            <Server className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-1">{serverResponseTime} ms</p>
          <span className="text-[10px] text-sky-400/80 font-medium mt-1 block">API Ping Speed</span>
        </div>

        {/* Active Connections */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Active Sockets</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">{activeConnections}</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">Connected Users</span>
        </div>

        {/* System Uptime */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">System Uptime</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">99.98%</p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 block">30-Day SLA</span>
        </div>

        {/* Error Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Error Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">0.02%</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Well Below Limit</span>
        </div>

        {/* Active Background Processes */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[11px] text-slate-400 font-medium">Background Tasks</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-1">6 Jobs</p>
          <span className="text-[10px] text-indigo-400 font-medium mt-1 block">Workers Active</span>
        </div>

      </div>

      {/* Sub-Tab Module Selector */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto text-xs">
        {[
          { id: 'dashboard', label: 'Overview & Hardware', icon: BarChart3 },
          { id: 'performance', label: 'Server Performance', icon: Cpu },
          { id: 'firebase', label: 'Firebase Services', icon: Database },
          { id: 'database', label: 'Firestore Collections', icon: Layers },
          { id: 'errors', label: 'Error Tracker', icon: AlertTriangle },
          { id: 'security', label: 'Security Threats', icon: ShieldAlert },
          { id: 'insights', label: 'Smart Health Analysis', icon: Sparkles },
          { id: 'maintenance', label: 'Maintenance Window', icon: Wrench },
          { id: 'logs', label: 'System Logs Stream', icon: Terminal }
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
      {/* MODULE TAB 1: SERVER PERFORMANCE MONITORS                                 */}
      {/* ========================================================================= */}
      {(activeTab === 'dashboard' || activeTab === 'performance') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CPU Usage Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>CPU Load Utilization</span>
              </span>
              <span className="text-xs font-mono font-black text-indigo-300">{cpuUsage}%</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">8 vCPU Cores allocated across Cloud container nodes.</p>
          </div>

          {/* Memory Usage Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>RAM Memory Usage</span>
              </span>
              <span className="text-xs font-mono font-black text-emerald-400">{memoryUsage}%</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${memoryUsage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">6.7 GB used out of 16 GB total RAM buffer.</p>
          </div>

          {/* Disk Usage Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <span>Disk Storage Space</span>
              </span>
              <span className="text-xs font-mono font-black text-sky-300">{diskUsage}%</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${diskUsage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">155 GB used out of 500 GB NVMe Storage.</p>
          </div>

          {/* Network Throughput */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Network Traffic Rate</span>
              </span>
              <span className="text-xs font-mono font-black text-amber-300">{networkUsage}%</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${networkUsage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">18.4 MB/s Rx / Tx bandwidth throughput.</p>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE TAB 2: SMART HEALTH ANALYSIS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'insights' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Smart Health Analysis & Performance Insights</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Automated system evaluation, database optimization suggestions & health scores.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-full">
              System Score: 98/100
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-medium">System Health</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">98/100</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Performance Score</span>
              <p className="text-2xl font-black text-indigo-300 mt-1">96/100</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Database Health</span>
              <p className="text-2xl font-black text-sky-400 mt-1">99/100</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Security Score</span>
              <p className="text-2xl font-black text-amber-300 mt-1">100/100</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 font-medium">Storage Health</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">94/100</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recommended System Improvements</span>
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Configure compound index for <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">questions_collection(courseCode, year)</code> to speed up CBT random generator.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Enable client-side caching for University & Department metadata schemas to save 12% daily Firestore read operations.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Resource Usage Forecast</span>
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Based on student growth trends (+12% this month), Firestore reads are projected to reach 45,000/day during upcoming semester examination week. Current quota settings are well sufficient.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE TAB 3: ERROR MONITORING HUB                                       */}
      {/* ========================================================================= */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Automated System Error Monitoring Hub</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Live detection across Firebase, Database, Authentication, Network & CBT exam runner.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search errors..."
                  value={errorSearch}
                  onChange={(e) => setErrorSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                />
                <select
                  value={errorTypeFilter}
                  onChange={(e) => setErrorTypeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="all">All Modules</option>
                  <option value="Firebase">Firebase</option>
                  <option value="Payment">Payment</option>
                  <option value="CBT Engine">CBT Engine</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredErrors.map(err => (
                <div key={err.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] shrink-0 ${
                      err.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {err.severity}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{err.id}</span>
                        <span className="font-bold text-white">{err.type}</span>
                        <span className="text-slate-500">[{err.module}]</span>
                        <span className="text-slate-500 text-[10px]">{err.timestamp}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{err.description}</p>
                    </div>
                  </div>

                  {err.status === 'Active' ? (
                    <button
                      onClick={() => handleResolveError(err.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shrink-0"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg text-[10px]">
                      Resolved
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE TAB 4: MAINTENANCE CONTROLS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>Maintenance Monitoring & Controls</span>
              </h3>
              <p className="text-slate-400 mt-1">Schedule system windows, enable emergency maintenance banners or inspect history.</p>
            </div>

            <button
              onClick={handleToggleMaintenance}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
                isMaintenanceActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>{isMaintenanceActive ? 'End Maintenance Mode' : 'Start Emergency Maintenance'}</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-white">Scheduled Maintenance Window</h4>
            <p className="text-slate-400">Regular automated optimization is scheduled for off-peak hours.</p>
            <div className="flex items-center gap-2 text-indigo-300 font-mono font-bold bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{scheduledWindow}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE TAB 5: SYSTEM LOGS STREAM                                         */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Diagnostic System Logs Stream</span>
            </h3>
            <span className="font-mono text-emerald-400 font-bold">{systemLogs.length} Events Logged</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono space-y-2 text-[11px] text-slate-300 max-h-96 overflow-y-auto">
            {systemLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2 border-b border-slate-900/80 pb-1.5">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span className={`font-bold ${
                  log.level === 'Error' ? 'text-rose-400' : log.level === 'Warning' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  [{log.level}]
                </span>
                <span className="text-indigo-400">[{log.source}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
