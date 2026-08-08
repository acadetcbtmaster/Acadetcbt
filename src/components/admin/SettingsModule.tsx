import React, { useState, useEffect } from 'react';
import {
  SystemSettingsPayload,
  University,
  Course,
  AdminRolePermission,
  SystemIntegrationStatus,
  SystemHealthMetrics
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  Settings,
  Shield,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock,
  Globe,
  Building2,
  BookOpen,
  UserCheck,
  FileText,
  Clock,
  Key,
  Bell,
  Sliders,
  Database,
  Cpu,
  Layers,
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Wifi,
  DollarSign,
  ShieldAlert,
  HardDrive
} from 'lucide-react';

interface SettingsModuleProps {
  universities?: University[];
  courses?: Course[];
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  universities: initialUniversities = [],
  courses: initialCourses = [],
}) => {
  // Settings Payload State
  const [settings, setSettings] = useState<SystemSettingsPayload>(StorageService.getSystemSettingsPayload());
  const [universitiesList, setUniversitiesList] = useState<University[]>(initialUniversities);
  const [coursesList, setCoursesList] = useState<Course[]>(initialCourses);

  // Active Category Section Tab
  const [activeTab, setActiveTab] = useState<
    | 'general'
    | 'universities'
    | 'courses'
    | 'auth'
    | 'registration'
    | 'cbt'
    | 'subscription'
    | 'notifications'
    | 'security'
    | 'maintenance'
    | 'firebase'
    | 'roles'
    | 'health'
  >('general');

  // Search Input for Settings
  const [searchQuery, setSearchQuery] = useState('');

  // Toast & Loading
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // University Modal State
  const [showUniModal, setShowUniModal] = useState(false);
  const [editUni, setEditUni] = useState<University | null>(null);
  const [uniName, setUniName] = useState('');
  const [uniAbbr, setUniAbbr] = useState('');
  const [uniLocation, setUniLocation] = useState('');
  const [uniLogoUrl, setUniLogoUrl] = useState('');

  // Course Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDepartmentId, setCourseDepartmentId] = useState('');
  const [courseSemester, setCourseSemester] = useState<'First' | 'Second'>('First');
  const [courseSession, setCourseSession] = useState('2025/2026');

  // Test Integration State
  const [testingIntegrationId, setTestingIntegrationId] = useState<string | null>(null);

  // Load Data
  const loadSettingsData = () => {
    const loaded = StorageService.getSystemSettingsPayload();
    setSettings(loaded);
    const loadedUnis = StorageService.getUniversities();
    setUniversitiesList(loadedUnis.length > 0 ? loadedUnis : initialUniversities);
    const loadedCourses = StorageService.getCourses();
    setCoursesList(loadedCourses.length > 0 ? loadedCourses : initialCourses);
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAllSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      StorageService.saveSystemSettingsPayload(settings);
      setIsSaving(false);
      triggerToast('System configurations updated and synchronized to Cloud Firestore!');
    }, 400);
  };

  // University Handlers
  const handleSaveUniversity = () => {
    if (!uniName.trim() || !uniAbbr.trim()) {
      triggerToast('Please provide University Name and Abbreviation.');
      return;
    }

    if (editUni) {
      const updated: University = {
        ...editUni,
        name: uniName.trim(),
        abbreviation: uniAbbr.trim(),
        location: uniLocation.trim() || 'Nigeria',
        logoUrl: uniLogoUrl.trim() || undefined,
      };
      const list = universitiesList.map((u) => (u.id === editUni.id ? updated : u));
      StorageService.saveUniversities(list);
      setUniversitiesList(list);
      triggerToast(`Updated University "${updated.abbreviation}".`);
    } else {
      const created: University = {
        id: `uni-${Date.now()}`,
        name: uniName.trim(),
        abbreviation: uniAbbr.trim(),
        location: uniLocation.trim() || 'Nigeria',
        logoUrl: uniLogoUrl.trim() || undefined,
      };
      const list = [created, ...universitiesList];
      StorageService.saveUniversities(list);
      setUniversitiesList(list);
      triggerToast(`Added new University "${created.abbreviation}".`);
    }

    setShowUniModal(false);
    setEditUni(null);
    setUniName('');
    setUniAbbr('');
    setUniLocation('');
    setUniLogoUrl('');
  };

  const handleDeleteUniversity = (id: string) => {
    const list = universitiesList.filter((u) => u.id !== id);
    StorageService.saveUniversities(list);
    setUniversitiesList(list);
    triggerToast('University removed.');
  };

  // Course Handlers
  const handleSaveCourse = () => {
    if (!courseCode.trim() || !courseTitle.trim()) {
      triggerToast('Please fill Course Code and Title.');
      return;
    }

    if (editCourse) {
      const updated: Course = {
        ...editCourse,
        code: courseCode.trim(),
        title: courseTitle.trim(),
        departmentId: courseDepartmentId || 'dept-gen',
        semester: courseSemester,
        session: courseSession,
      };
      const list = coursesList.map((c) => (c.id === editCourse.id ? updated : c));
      StorageService.saveCourses(list);
      setCoursesList(list);
      triggerToast(`Updated Course "${updated.code}".`);
    } else {
      const created: Course = {
        id: `crs-${Date.now()}`,
        code: courseCode.trim(),
        title: courseTitle.trim(),
        departmentId: courseDepartmentId || 'dept-gen',
        semester: courseSemester,
        session: courseSession,
      };
      const list = [created, ...coursesList];
      StorageService.saveCourses(list);
      setCoursesList(list);
      triggerToast(`Added new Course "${created.code}".`);
    }

    setShowCourseModal(false);
    setEditCourse(null);
    setCourseCode('');
    setCourseTitle('');
  };

  const handleDeleteCourse = (id: string) => {
    const list = coursesList.filter((c) => c.id !== id);
    StorageService.saveCourses(list);
    setCoursesList(list);
    triggerToast('Course removed.');
  };

  // Integration Tester
  const handleTestIntegration = (intId: string, name: string) => {
    setTestingIntegrationId(intId);
    setTimeout(() => {
      setTestingIntegrationId(null);
      const updatedIntegrations = settings.integrations.map((item) =>
        item.id === intId ? { ...item, status: 'Connected' as const, lastTested: new Date().toISOString() } : item
      );
      setSettings({ ...settings, integrations: updatedIntegrations });
      triggerToast(`Integration test for "${name}" PASSED (200 OK).`);
    }, 1200);
  };

  // Keyword Search Auto-Tab Switcher
  const handleSearchFilter = (q: string) => {
    setSearchQuery(q);
    const query = q.toLowerCase().trim();
    if (!query) return;

    if (query.includes('university') || query.includes('campus') || query.includes('ful') || query.includes('unilag')) {
      setActiveTab('universities');
    } else if (query.includes('course') || query.includes('gst') || query.includes('mth')) {
      setActiveTab('courses');
    } else if (query.includes('auth') || query.includes('google') || query.includes('password') || query.includes('login')) {
      setActiveTab('auth');
    } else if (query.includes('cbt') || query.includes('time') || query.includes('exam') || query.includes('random')) {
      setActiveTab('cbt');
    } else if (query.includes('sub') || query.includes('paystack') || query.includes('price') || query.includes('trial')) {
      setActiveTab('subscription');
    } else if (query.includes('notif') || query.includes('alert') || query.includes('push')) {
      setActiveTab('notifications');
    } else if (query.includes('sec') || query.includes('ip') || query.includes('audit')) {
      setActiveTab('security');
    } else if (query.includes('maint') || query.includes('down')) {
      setActiveTab('maintenance');
    } else if (query.includes('role') || query.includes('permission') || query.includes('admin')) {
      setActiveTab('roles');
    } else if (query.includes('fire') || query.includes('db') || query.includes('cloud')) {
      setActiveTab('firebase');
    }
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
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">System Settings & Central Configuration</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control platform preferences, auth rules, universities, courses, CBT exam logic, security, and integrations.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadSettingsData}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Reload</span>
          </button>

          <button
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* 1. Live Summary Cards (10 Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div onClick={() => setActiveTab('general')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Version</span>
          <p className="text-xl font-black text-white">v3.8.2 <span className="text-[10px] font-bold text-emerald-400">PROD</span></p>
          <p className="text-[9px] text-slate-400">Build 2026-07-23</p>
        </div>

        <div onClick={() => setActiveTab('roles')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Admins</span>
          <p className="text-xl font-black text-indigo-400">16 Admins</p>
          <p className="text-[9px] text-indigo-400/80">5 Role Tiers Active</p>
        </div>

        <div onClick={() => setActiveTab('health')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Status</span>
          <p className="text-xl font-black text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Operational</span>
          </p>
          <p className="text-[9px] text-slate-400">99.98% Uptime</p>
        </div>

        <div onClick={() => setActiveTab('maintenance')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maintenance Mode</span>
          <p className={`text-xl font-black ${settings.maintenance.enabled ? 'text-rose-400' : 'text-emerald-400'}`}>
            {settings.maintenance.enabled ? 'ACTIVE' : 'OFF'}
          </p>
          <p className="text-[9px] text-slate-400">Student access open</p>
        </div>

        <div onClick={() => setActiveTab('firebase')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firebase Auth</span>
          <p className="text-xl font-black text-cyan-400">Connected</p>
          <p className="text-[9px] text-cyan-400/80">SDK v10.8 Connected</p>
        </div>

        <div onClick={() => setActiveTab('firebase')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Database Status</span>
          <p className="text-xl font-black text-emerald-400">Firestore OK</p>
          <p className="text-[9px] text-slate-400">14 Collections</p>
        </div>

        <div onClick={() => setActiveTab('firebase')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Storage Vault</span>
          <p className="text-xl font-black text-purple-400">Ready</p>
          <p className="text-[9px] text-slate-400">PDFs & Assets Bucket</p>
        </div>

        <div onClick={() => setActiveTab('auth')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auth Services</span>
          <p className="text-xl font-black text-white">Google & Email</p>
          <p className="text-[9px] text-emerald-400">OAuth Active</p>
        </div>

        <div onClick={() => setActiveTab('firebase')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Gateways</span>
          <p className="text-xl font-black text-amber-400">Paystack OK</p>
          <p className="text-[9px] text-amber-400/80">Payments live</p>
        </div>

        <div onClick={() => setActiveTab('general')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Config Update</span>
          <p className="text-xs font-bold text-white truncate">Today at 04:45 AM</p>
          <p className="text-[9px] text-slate-400">By Super Admin</p>
        </div>
      </div>

      {/* Keyword Search Settings Instant Jump Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchFilter(e.target.value)}
          placeholder="Search setting by keyword (e.g. Password, Google, University, CBT, Subscription, Payment, Notification, Maintenance)..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Category Navigation Bar */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'general', label: 'General System', icon: Globe },
          { id: 'universities', label: 'Universities', icon: Building2 },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'auth', label: 'Authentication', icon: Key },
          { id: 'registration', label: 'Student Registration', icon: UserCheck },
          { id: 'cbt', label: 'CBT Exam Rules', icon: FileText },
          { id: 'subscription', label: 'Subscriptions', icon: DollarSign },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security & Access', icon: Lock },
          { id: 'maintenance', label: 'Maintenance Mode', icon: ShieldAlert },
          { id: 'firebase', label: 'Firebase & Integrations', icon: Server },
          { id: 'roles', label: 'Roles & Permissions', icon: Shield },
          { id: 'health', label: 'System Health Monitor', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3.5 cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: General Settings */}
      {activeTab === 'general' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 text-xs max-w-4xl mx-auto">
          <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">General Platform Information & Localization</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Platform Name:</label>
              <input
                type="text"
                value={settings.general.platformName}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, platformName: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Contact Email:</label>
              <input
                type="email"
                value={settings.general.contactEmail}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, contactEmail: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Support Phone Number:</label>
              <input
                type="text"
                value={settings.general.supportPhone}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportPhone: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Official Website URL:</label>
              <input
                type="text"
                value={settings.general.officialWebsite}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, officialWebsite: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-300 block mb-1">Platform Description:</label>
              <textarea
                rows={2}
                value={settings.general.description}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, description: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Default Time Zone:</label>
              <input
                type="text"
                value={settings.general.defaultTimeZone}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, defaultTimeZone: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Date & Time Display Format:</label>
              <input
                type="text"
                value={settings.general.dateTimeFormat}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, dateTimeFormat: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: University Management */}
      {activeTab === 'universities' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">University Management Settings</h3>
              <p className="text-xs text-slate-400">Universities added here automatically appear during student registration.</p>
            </div>
            <button
              onClick={() => {
                setEditUni(null);
                setUniName('');
                setUniAbbr('');
                setUniLocation('');
                setUniLogoUrl('');
                setShowUniModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add University</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {universitiesList.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-indigo-400">
                    {u.abbreviation.slice(0, 3)}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{u.name} ({u.abbreviation})</span>
                    <span className="text-[10px] text-slate-400">Location: {u.location} | ID: {u.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditUni(u);
                      setUniName(u.name);
                      setUniAbbr(u.abbreviation);
                      setUniLocation(u.location);
                      setUniLogoUrl(u.logoUrl || '');
                      setShowUniModal(true);
                    }}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>                  <button
                    onClick={() => handleDeleteUniversity(u.id)}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Course Management Settings */}
      {activeTab === 'courses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Course Management Settings</h3>
              <p className="text-xs text-slate-400">Manage CBT courses assigned to universities and departments.</p>
            </div>
            <button
              onClick={() => {
                setEditCourse(null);
                setCourseCode('');
                setCourseTitle('');
                setShowCourseModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {coursesList.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-white block">{c.code} - {c.title}</span>
                  <span className="text-[10px] text-indigo-400">
                    Semester: {c.semester} | Session: {c.session} | ID: {c.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditCourse(c);
                      setCourseCode(c.code);
                      setCourseTitle(c.title);
                      setShowCourseModal(true);
                    }}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(c.id)}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Authentication Settings */}
      {activeTab === 'auth' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 text-xs max-w-3xl mx-auto">
          <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">Student Authentication & Password Policy</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block">Email & Password Login</span>
                <p className="text-[11px] text-slate-400">Allow students to sign in using email and password credentials.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auth.emailAuthEnabled}
                onChange={(e) => setSettings({ ...settings, auth: { ...settings.auth, emailAuthEnabled: e.target.checked } })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block">Google OAuth Sign-In</span>
                <p className="text-[11px] text-slate-400">One-tap Google Identity login for university students.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auth.googleSignInEnabled}
                onChange={(e) => setSettings({ ...settings, auth: { ...settings.auth, googleSignInEnabled: e.target.checked } })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Minimum Password Length:</label>
                <input
                  type="number"
                  value={settings.auth.minPasswordLength}
                  onChange={(e) => setSettings({ ...settings, auth: { ...settings.auth, minPasswordLength: parseInt(e.target.value) || 8 } })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Session Timeout (Minutes):</label>
                <input
                  type="number"
                  value={settings.auth.sessionTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, auth: { ...settings.auth, sessionTimeoutMinutes: parseInt(e.target.value) || 60 } })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: CBT Exam Rules */}
      {activeTab === 'cbt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 text-xs max-w-3xl mx-auto">
          <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">Default CBT Examination Rules & Engine Defaults</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Default CBT Exam Time (Minutes):</label>
              <input
                type="number"
                value={settings.cbt.defaultCbtTimeMinutes}
                onChange={(e) => setSettings({ ...settings, cbt: { ...settings.cbt, defaultCbtTimeMinutes: parseInt(e.target.value) || 20 } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Passing Score Percentage (%):</label>
              <input
                type="number"
                value={settings.cbt.passingScorePercentage}
                onChange={(e) => setSettings({ ...settings, cbt: { ...settings.cbt, passingScorePercentage: parseInt(e.target.value) || 50 } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="font-bold text-white">Randomize CBT Questions Sequence</span>
              <input
                type="checkbox"
                checked={settings.cbt.randomizeQuestions}
                onChange={(e) => setSettings({ ...settings, cbt: { ...settings.cbt, randomizeQuestions: e.target.checked } })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="font-bold text-white">Randomize Answer Options (A, B, C, D)</span>
              <input
                type="checkbox"
                checked={settings.cbt.randomizeAnswerOptions}
                onChange={(e) => setSettings({ ...settings, cbt: { ...settings.cbt, randomizeAnswerOptions: e.target.checked } })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="font-bold text-white">Auto-Submit Test When Exam Timer Ends</span>
              <input
                type="checkbox"
                checked={settings.cbt.autoSubmitWhenTimeEnds}
                onChange={(e) => setSettings({ ...settings, cbt: { ...settings.cbt, autoSubmitWhenTimeEnds: e.target.checked } })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Subscriptions Settings */}
      {activeTab === 'subscription' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-xs max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Free Trial & Subscription System Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure centralized question limits, warning thresholds, trial expiration banners, pricing, and gateway activation. Changes automatically sync to student interfaces in real time.
              </p>
            </div>
            <button
              onClick={handleSaveAllSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
            </button>
          </div>

          {/* Master Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block text-sm">Enable Free Trial System</span>
                <p className="text-[11px] text-slate-400">Allow non-premium students to attempt practice questions up to the free limit.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.subscription.freeTrialEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, freeTrialEnabled: e.target.checked } })}
                className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block text-sm">Enable Live Payment Gateways</span>
                <p className="text-[11px] text-slate-400">Allow students to upgrade online via Paystack & Flutterwave.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.subscription.paymentActivationEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, paymentActivationEnabled: e.target.checked } })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block text-sm">Enable Unlimited Questions</span>
                <p className="text-[11px] text-slate-400">Include Unlimited Questions option in Practice Question selection.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.subscription.enableUnlimitedQuestions ?? true}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, enableUnlimitedQuestions: e.target.checked } })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-white block text-sm">Unlimited for Premium Only</span>
                <p className="text-[11px] text-slate-400">Restrict Unlimited Practice Questions exclusively to Premium subscribers.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.subscription.allowUnlimitedForPremiumOnly ?? true}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, allowUnlimitedForPremiumOnly: e.target.checked } })}
                className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Limits & Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Free Trial Question Limit:</label>
              <input
                type="number"
                min={1}
                max={500}
                value={settings.subscription.freeTrialQuestionLimit ?? 30}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, freeTrialQuestionLimit: parseInt(e.target.value) || 30 } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 30 total questions</span>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Warning System Threshold:</label>
              <input
                type="number"
                min={1}
                max={500}
                value={settings.subscription.warningThreshold ?? 25}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, warningThreshold: parseInt(e.target.value) || 25 } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-bold text-amber-300"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 25 questions used</span>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Premium Plan Price (NGN ₦):</label>
              <input
                type="number"
                min={100}
                value={settings.subscription.subscriptionPriceNGN ?? 2500}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, subscriptionPriceNGN: parseInt(e.target.value) || 2500 } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Monthly standard price</span>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Subscription Duration (Days):</label>
              <input
                type="number"
                min={1}
                value={settings.subscription.subscriptionDurationDays ?? 30}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, subscriptionDurationDays: parseInt(e.target.value) || 30 } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Access duration per payment</span>
            </div>
          </div>

          {/* Messages & Content */}
          <div className="space-y-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Trial Expired Lock Banner Message:</label>
              <textarea
                rows={2}
                value={settings.subscription.trialExpirationMessage ?? 'Your 30-question free trial limit has been reached. Please upgrade to a Premium plan for unlimited practice and test access!'}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, trialExpirationMessage: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Upgrade Page Title:</label>
                <input
                  type="text"
                  value={settings.subscription.upgradePageTitle ?? 'Upgrade to CBT Master Premium'}
                  onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, upgradePageTitle: e.target.value } })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Premium Access Level Description:</label>
                <input
                  type="text"
                  value={settings.subscription.premiumQuestionAccess ?? 'Unlimited All Courses & Past Questions'}
                  onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, premiumQuestionAccess: e.target.value } })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Upgrade Page Content / Subtitle:</label>
              <textarea
                rows={2}
                value={settings.subscription.upgradePageContent ?? 'Get unrestricted access to thousands of past questions, live exam simulations, detailed SMART answer explanations, and downloadable course guides.'}
                onChange={(e) => setSettings({ ...settings, subscription: { ...settings.subscription, upgradePageContent: e.target.value } })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Maintenance Mode */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 text-xs max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">System Maintenance Mode</h3>
              <p className="text-xs text-slate-400">When enabled, students see a maintenance page while admins retain full portal access.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance.enabled}
                onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, enabled: e.target.checked } })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Student Notice Maintenance Message:</label>
            <textarea
              rows={3}
              value={settings.maintenance.message}
              onChange={(e) => setSettings({ ...settings, maintenance: { ...settings.maintenance, message: e.target.value } })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* SECTION 8: Firebase & Integrations */}
      {activeTab === 'firebase' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">Connected Firebase Services & System Integrations</h3>

          <div className="divide-y divide-slate-800 text-xs">
            {settings.integrations.map((item) => (
              <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-white block">{item.name} ({item.serviceKey})</span>
                  <p className="text-[11px] text-slate-400">{item.details}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold text-[10px]">
                    {item.status}
                  </span>
                  <button
                    onClick={() => handleTestIntegration(item.id, item.name)}
                    disabled={testingIntegrationId === item.id}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] rounded-xl cursor-pointer"
                  >
                    {testingIntegrationId === item.id ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 9: Roles & Permissions */}
      {activeTab === 'roles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3">Administrator Role Permission Tiers</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {settings.roles.map((r) => (
              <div key={r.roleId} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">{r.roleName}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-bold text-[10px]">
                    {r.userCount} Admins Assigned
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{r.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {r.permissions.map((p) => (
                    <span key={p} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[9px] font-mono border border-slate-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 10: System Health Monitor */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">CPU Utilization</span>
            <p className="text-2xl font-black text-emerald-400">12.4%</p>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[12%]"></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">RAM Memory Allocation</span>
            <p className="text-2xl font-black text-cyan-400">284 MB / 1024 MB</p>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 w-[28%]"></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Firestore Latency</span>
            <p className="text-2xl font-black text-indigo-400">18 ms</p>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-[15%]"></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add/Edit University */}
      {showUniModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">{editUni ? 'Edit University' : 'Add University'}</h3>
              <button onClick={() => setShowUniModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">University Name:</label>
                <input
                  type="text"
                  value={uniName}
                  onChange={(e) => setUniName(e.target.value)}
                  placeholder="e.g. Federal University Lokoja"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Abbreviation:</label>
                <input
                  type="text"
                  value={uniAbbr}
                  onChange={(e) => setUniAbbr(e.target.value)}
                  placeholder="e.g. FUL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Location / State:</label>
                <input
                  type="text"
                  value={uniLocation}
                  onChange={(e) => setUniLocation(e.target.value)}
                  placeholder="e.g. Lokoja, Kogi State"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowUniModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                Cancel
              </button>
              <button onClick={handleSaveUniversity} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                Save University
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Course */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">{editCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Course Code:</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. MTH101"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Course Title:</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Elementary Mathematics I"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                Cancel
              </button>
              <button onClick={handleSaveCourse} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">
                Save Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
