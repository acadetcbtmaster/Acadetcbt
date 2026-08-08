import React, { useState, useEffect } from 'react';
import {
  Bot,
  Settings,
  BookOpen,
  History,
  Shield,
  BarChart3,
  Bell,
  Palette,
  Sparkles,
  Lock,
  Star,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  RefreshCw,
  Send,
  Pin,
  Calendar,
  Sliders,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import {
  MenCoreSettings,
  MenCoreKnowledgeItem,
  MenCoreConversationLog,
  MenCoreAnnouncementItem,
  MenCorePermissions,
  MenCoreNavigationTarget
} from '../../types';
import { MenCoreService, DEFAULT_MENCORE_SETTINGS, DEFAULT_MENCORE_KNOWLEDGE_BASE } from '../../services/mencoreService';
import { MenCoreAvatar } from '../MenCoreLogo';

export const MenCoreManagementModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'settings'
    | 'knowledge'
    | 'logs'
    | 'permissions'
    | 'analytics'
    | 'announcements'
    | 'appearance'
    | 'training'
    | 'restricted'
    | 'feedback'
  >('dashboard');

  const [settings, setSettings] = useState<MenCoreSettings>(() => MenCoreService.getSettings());
  const [knowledgeBase, setKnowledgeBase] = useState<MenCoreKnowledgeItem[]>(() => MenCoreService.getKnowledgeBase());
  const [logs, setLogs] = useState<MenCoreConversationLog[]>(() => MenCoreService.getLogs());
  const [announcements, setAnnouncements] = useState<MenCoreAnnouncementItem[]>(() => MenCoreService.getAnnouncements());

  // Knowledge Base Form Modal State
  const [showKbModal, setShowKbModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenCoreKnowledgeItem | null>(null);
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState<MenCoreKnowledgeItem['category']>('CBT & Practice');
  const [kbKeywords, setKbKeywords] = useState('');
  const [kbAnswer, setKbAnswer] = useState('');
  const [kbNavLabel, setKbNavLabel] = useState('');
  const [kbNavView, setKbNavView] = useState('dashboard');
  const [kbIsPinned, setKbIsPinned] = useState(false);
  const [kbSearch, setKbSearch] = useState('');

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logFilterType, setLogFilterType] = useState<string>('ALL');

  // Announcement modal state
  const [showAncModal, setShowAncModal] = useState(false);
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');

  // Sandbox Test Chat State in Training Center
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);

  // Save changes handler
  const handleSaveSettings = (newSettings: MenCoreSettings) => {
    setSettings(newSettings);
    MenCoreService.saveSettings(newSettings);
    alert('MenCore settings updated successfully!');
  };

  // Open Add/Edit KB Modal
  const handleOpenKbModal = (item?: MenCoreKnowledgeItem) => {
    if (item) {
      setEditingItem(item);
      setKbTitle(item.title);
      setKbCategory(item.category);
      setKbKeywords(item.keywords.join(', '));
      setKbAnswer(item.answer);
      setKbNavLabel(item.navigationTarget?.label || '');
      setKbNavView(item.navigationTarget?.view || 'dashboard');
      setKbIsPinned(item.isPinned);
    } else {
      setEditingItem(null);
      setKbTitle('');
      setKbCategory('CBT & Practice');
      setKbKeywords('');
      setKbAnswer('');
      setKbNavLabel('');
      setKbNavView('dashboard');
      setKbIsPinned(false);
    }
    setShowKbModal(true);
  };

  const handleSaveKbItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbAnswer.trim()) {
      alert('Please provide a title and answer for the knowledge base article.');
      return;
    }

    const keywordsArray = kbKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    let navTarget: MenCoreNavigationTarget | undefined = undefined;
    if (kbNavLabel.trim()) {
      navTarget = { label: kbNavLabel.trim(), view: kbNavView || 'dashboard' };
    }

    let updatedKb: MenCoreKnowledgeItem[];
    if (editingItem) {
      updatedKb = knowledgeBase.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: kbTitle.trim(),
              category: kbCategory,
              keywords: keywordsArray.length ? keywordsArray : [kbTitle.toLowerCase()],
              answer: kbAnswer.trim(),
              navigationTarget: navTarget,
              isPinned: kbIsPinned,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
    } else {
      const newItem: MenCoreKnowledgeItem = {
        id: `kb-${Date.now()}`,
        title: kbTitle.trim(),
        category: kbCategory,
        keywords: keywordsArray.length ? keywordsArray : [kbTitle.toLowerCase()],
        answer: kbAnswer.trim(),
        navigationTarget: navTarget,
        isPinned: kbIsPinned,
        updatedAt: new Date().toISOString(),
      };
      updatedKb = [newItem, ...knowledgeBase];
    }

    setKnowledgeBase(updatedKb);
    MenCoreService.saveKnowledgeBase(updatedKb);
    setShowKbModal(false);
    alert('Knowledge Base updated! MenCore has automatically learned the new information.');
  };

  const handleDeleteKbItem = (id: string) => {
    if (!window.confirm('Delete this knowledge base topic?')) return;
    const updated = knowledgeBase.filter((i) => i.id !== id);
    setKnowledgeBase(updated);
    MenCoreService.saveKnowledgeBase(updated);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;
    const newAnc: MenCoreAnnouncementItem = {
      id: `anc-${Date.now()}`,
      title: ancTitle.trim(),
      content: ancContent.trim(),
      createdAt: new Date().toISOString(),
      isActive: true,
      badgeCount: 1,
    };
    const updated = [newAnc, ...announcements];
    setAnnouncements(updated);
    MenCoreService.saveAnnouncements(updated);
    setAncTitle('');
    setAncContent('');
    setShowAncModal(false);
    alert('Announcement broadcasted to MenCore widgets successfully!');
  };

  const handleToggleAnc = (id: string) => {
    const updated = announcements.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
    setAnnouncements(updated);
    MenCoreService.saveAnnouncements(updated);
  };

  const handleDeleteAnc = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    MenCoreService.saveAnnouncements(updated);
  };

  const handleExportLogsCSV = () => {
    if (!logs.length) {
      alert('No conversation logs available to export.');
      return;
    }
    const headers = ['id,userId,userName,userEmail,userRole,question,answer,questionType,wasHelpful,starRating,createdAt'];
    const rows = logs.map((l) =>
      [
        l.id,
        l.userId,
        `"${l.userName}"`,
        l.userEmail,
        l.userRole,
        `"${l.question.replace(/"/g, '""')}"`,
        `"${l.answer.replace(/"/g, '""')}"`,
        l.questionType,
        l.wasHelpful ?? '',
        l.starRating ?? '',
        l.createdAt,
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `mencore_conversation_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredKb = knowledgeBase.filter(
    (item) =>
      item.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(kbSearch.toLowerCase()) ||
      item.keywords.some((k) => k.toLowerCase().includes(kbSearch.toLowerCase()))
  );

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.question.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.answer.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(logSearch.toLowerCase());
    const matchType = logFilterType === 'ALL' || log.questionType === logFilterType;
    return matchSearch && matchType;
  });

  const totalConversations = logs.length;
  const unansweredLogs = logs.filter((l) => l.unanswered);
  const ratedLogs = logs.filter((l) => l.starRating !== undefined);
  const avgSatisfaction = ratedLogs.length
    ? (ratedLogs.reduce((acc, curr) => acc + (curr.starRating || 0), 0) / ratedLogs.length).toFixed(1)
    : '4.9';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ========================================================================= */}
      {/* TOP HEADER & STATUS BAR                                                 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <MenCoreAvatar size="xl" className="w-14 h-14 border-indigo-500/50 shadow-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MenCore Management System
              </h1>
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full">
                Powered by Menmex
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Official intelligent CBT Companion for Acadet CBT Master. Configure knowledge base, navigation rules, permissions, and inspect conversation analytics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* General Knowledge & Outside Questions AI Toggle Button */}
          <button
            onClick={() => {
              const isAllowed = settings.permissions.generalAI || settings.permissions.academicQuestions;
              const updated = {
                ...settings,
                permissions: {
                  ...settings.permissions,
                  generalAI: !isAllowed,
                  academicQuestions: !isAllowed,
                  courseQuestions: !isAllowed,
                  cbtQuestions: !isAllowed,
                  universityQuestions: !isAllowed,
                },
              };
              handleSaveSettings(updated);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all flex items-center gap-2 ${
              (settings.permissions.generalAI || settings.permissions.academicQuestions)
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-200 hover:bg-purple-600/40 shadow-lg shadow-purple-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle whether AI bot answers general questions & external knowledge outside the website"
            id="admin-mencore-general-knowledge-btn"
          >
            <Sparkles className={`w-4 h-4 ${(settings.permissions.generalAI || settings.permissions.academicQuestions) ? 'text-purple-400 fill-purple-400/20' : 'text-slate-400'}`} />
            <span>
              {(settings.permissions.generalAI || settings.permissions.academicQuestions)
                ? 'General AI & External Knowledge: ENABLED'
                : 'General AI & External Knowledge: RESTRICTED'}
            </span>
          </button>

          <button
            onClick={() => {
              const updated = { ...settings, isEnabled: !settings.isEnabled };
              handleSaveSettings(updated);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all flex items-center gap-2 ${
              settings.isEnabled
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
            }`}
          >
            {settings.isEnabled ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>MenCore Enabled</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>MenCore Disabled</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 11-TAB NAVIGATION MENU                                                    */}
      {/* ========================================================================= */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar gap-1 text-xs font-bold bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
        {[
          ['dashboard', 'MenCore Dashboard', Bot],
          ['settings', 'General Settings', Settings],
          ['knowledge', 'Knowledge Base', BookOpen],
          ['logs', 'Conversation Logs', History],
          ['permissions', 'Permissions', Shield],
          ['analytics', 'Analytics', BarChart3],
          ['announcements', 'Announcements', Bell],
          ['appearance', 'Appearance', Palette],
          ['training', 'Training Center', Sparkles],
          ['restricted', 'Restricted Topics', Lock],
          ['feedback', 'Feedback ⭐', Star],
        ].map(([tabKey, label, IconComp]: any) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tabKey
                ? 'bg-indigo-600 text-white shadow font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <IconComp className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MENCORE DASHBOARD (OVERVIEW)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-medium">Total Conversations</span>
              <p className="text-2xl font-black text-white mt-1">{totalConversations}</p>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Live AI Logged</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-medium">Knowledge Base Topics</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{knowledgeBase.length}</p>
              <span className="text-[10px] text-slate-400 font-medium mt-1 block">Official Answers</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-medium">User Satisfaction</span>
              <p className="text-2xl font-black text-amber-400 mt-1">⭐ {avgSatisfaction} / 5</p>
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Student Feedback</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 font-medium">Unanswered Requests</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{unansweredLogs.length}</p>
              <span className="text-[10px] text-rose-400/80 font-medium mt-1 block">Awaiting Admin Answer</span>
            </div>
          </div>

          {/* Smart Suggestions Alert Box (if unanswered questions exist) */}
          {unansweredLogs.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Smart Suggestions • {unansweredLogs.length} users requested answers for unlisted topics!</span>
              </div>
              <p className="text-xs text-slate-300">
                MenCore logged questions that had no exact match in the Knowledge Base. You can review them and add an answer so MenCore automatically learns it.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {unansweredLogs.slice(0, 4).map((log) => (
                  <button
                    key={log.id}
                    onClick={() => {
                      handleOpenKbModal();
                      setKbTitle(log.question);
                    }}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <span>"{log.question}"</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-white text-sm">Quick MenCore Management Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleOpenKbModal()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Knowledge Base Article</span>
              </button>
              <button
                onClick={() => setShowAncModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 border border-slate-700"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Broadcast New Announcement</span>
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 border border-slate-700"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Test MenCore in Live Sandbox</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GENERAL SETTINGS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-extrabold text-white">General MenCore AI Configuration</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Assistant Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Online Status Display</label>
              <select
                value={settings.onlineStatus}
                onChange={(e) => setSettings({ ...settings, onlineStatus: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-bold"
              >
                <option value="online">Online - Active</option>
                <option value="busy">Busy - High Volume</option>
                <option value="offline">Offline - Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Response Speed</label>
              <select
                value={settings.responseSpeed}
                onChange={(e) => setSettings({ ...settings, responseSpeed: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-bold"
              >
                <option value="instant">Instant Response (~400ms)</option>
                <option value="fast">Fast Response (~900ms)</option>
                <option value="natural">Natural Typing (~1.5s)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Welcome Message</label>
            <textarea
              rows={6}
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showOnAuthPages}
                onChange={(e) => setSettings({ ...settings, showOnAuthPages: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950"
              />
              <span className="text-xs text-slate-300 font-medium">
                Enable widget on Login & Signup pages
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950"
              />
              <span className="text-xs text-slate-300 font-medium">
                Maintenance Mode (Temporarily pause MenCore)
              </span>
            </label>
          </div>

          <button
            onClick={() => handleSaveSettings(settings)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow"
          >
            Save General Settings
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KNOWLEDGE BASE                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search knowledge base articles..."
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => handleOpenKbModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Knowledge Article</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold border-b border-slate-800">
                  <th className="p-3.5">Topic Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Keywords / Triggers</th>
                  <th className="p-3.5">Navigation Button</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredKb.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      <div className="flex items-center gap-2">
                        {item.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-full font-bold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
                      {item.keywords.join(', ')}
                    </td>
                    <td className="p-3.5">
                      {item.navigationTarget ? (
                        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded font-bold text-[10px]">
                          {item.navigationTarget.label}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenKbModal(item)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteKbItem(item.id)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold cursor-pointer"
                      >
                        Delete
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
      {/* TAB 4: CONVERSATION LOGS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search logs by question or user..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full sm:w-64 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={logFilterType}
                onChange={(e) => setLogFilterType(e.target.value)}
                className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs text-white font-bold"
              >
                <option value="ALL">All Question Types</option>
                <option value="platform">Platform Assistance</option>
                <option value="navigation">Navigation</option>
                <option value="subscription">Subscription & Payment</option>
                <option value="restricted">Restricted Refusal</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportLogsCSV}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear all conversation logs?')) {
                    MenCoreService.clearLogs();
                    setLogs([]);
                  }
                }}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl cursor-pointer border border-rose-500/30"
              >
                Clear All Logs
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold border-b border-slate-800">
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Question Asked</th>
                  <th className="p-3.5">MenCore Reply Summary</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Helpful?</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <p className="font-bold text-white">{log.userName}</p>
                      <p className="text-[10px] text-slate-400">{log.userEmail}</p>
                    </td>
                    <td className="p-3.5 font-medium text-slate-200 max-w-xs truncate">
                      "{log.question}"
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
                      {log.answer.substring(0, 65)}...
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-bold text-[10px]">
                        {log.questionType.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {log.starRating ? (
                        <span className="text-amber-400 font-bold">⭐ {log.starRating}/5</span>
                      ) : log.wasHelpful !== undefined ? (
                        log.wasHelpful ? (
                          <span className="text-emerald-400 font-bold">✓ Yes</span>
                        ) : (
                          <span className="text-rose-400 font-bold">✗ No</span>
                        )
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[10px]">
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PERMISSIONS & FUTURE ACADEMIC AI                                    */}
      {/* ========================================================================= */}
      {activeTab === 'permissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white">MenCore Scope & Permission Control</h3>
            <p className="text-xs text-slate-400 mt-1">
              By default, MenCore is restricted exclusively to Acadet CBT Master platform assistance. You can enable or disable functional scopes below.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['websiteFeatures', 'Website Features & Guides', 'Explain practice mode, mock CBT, results & dashboard.'],
              ['platformNavigation', 'Platform Navigation Assistant', 'Show clickable action buttons to take users to features.'],
              ['premiumPlans', 'Premium Subscription Plans', 'Explain 14-Day and 30-Day Premium pricing & benefits.'],
              ['payments', 'Bank Transfer & Payment Proof', 'Guide students on how to upload bank transfer receipts.'],
              ['notifications', 'Notifications & Announcements', 'Explain platform notification bell & alerts.'],
              ['studyMaterials', 'Study Materials Library', 'Explain past question PDFs, lecture summaries & notes.'],
              ['community', 'Learning Community & Discussions', 'Explain FUL & FUAHSE student community discussion forum.'],
              ['analytics', 'Performance Analytics & Stats', 'Explain user score progress charts & CBT metrics.'],
            ].map(([key, title, desc]: any) => (
              <div key={key} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={(settings.permissions as any)[key]}
                  onChange={(e) => {
                    const updated = {
                      ...settings,
                      permissions: { ...settings.permissions, [key]: e.target.checked },
                    };
                    setSettings(updated);
                    MenCoreService.saveSettings(updated);
                  }}
                  className="rounded border-slate-700 bg-slate-900 w-4 h-4"
                />
              </div>
            ))}
          </div>

          {/* Future Academic AI Toggle Box (Hidden Module in Spec) */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-extrabold rounded-full">
                  FUTURE ACADEMIC AI MODULE
                </span>
                <h4 className="text-sm font-extrabold text-white mt-2">Academic & Course Assistance Controls</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  When enabled, MenCore can answer approved academic questions (Subjects, Courses, Universities, Question Banks, CBT explanations).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                ['academicQuestions', 'Academic Subject Questions', 'Allow answering approved academic subject questions.'],
                ['courseQuestions', 'Course & Curriculum Assistance', 'Allow answering FUL & FUAHSE course-specific questions.'],
                ['universityQuestions', 'University Admission Information', 'Allow explaining university department admission info.'],
                ['cbtQuestions', 'CBT Question Explanations', 'Allow MenCore to explain correct answers in CBT.'],
              ].map(([key, title, desc]: any) => (
                <div key={key} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-xs">{title}</h5>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(settings.permissions as any)[key]}
                    onChange={(e) => {
                      const updated = {
                        ...settings,
                        permissions: { ...settings.permissions, [key]: e.target.checked },
                      };
                      setSettings(updated);
                      MenCoreService.saveSettings(updated);
                    }}
                    className="rounded border-slate-700 bg-slate-900 w-4 h-4"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ANALYTICS & FEEDBACK STATS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400">Total Conversations</span>
              <p className="text-2xl font-black text-white mt-1">{totalConversations}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400">Average Response Time</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">~120 ms</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400">Average User Rating</span>
              <p className="text-2xl font-black text-amber-400 mt-1">⭐ {avgSatisfaction}/5</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400">Navigation Button Clicks</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">84</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-white">Most Asked Questions</h3>
              <div className="space-y-2 text-xs">
                {[
                  { q: 'How do I subscribe?', count: 42, percent: '35%' },
                  { q: 'How do I start CBT?', count: 38, percent: '31%' },
                  { q: 'Where are study materials?', count: 21, percent: '17%' },
                  { q: 'What are Premium benefits?', count: 15, percent: '12%' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200">{item.q}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded font-bold">{item.count} asks</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-white">Most Used Navigation Shortcuts</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Open Subscription Page', clicks: 36 },
                  { label: 'Open Practice Mode', clicks: 28 },
                  { label: 'Open Study Materials', clicks: 12 },
                  { label: 'Open Community', clicks: 8 },
                ].map((nav, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200">{nav.label}</span>
                    <span className="text-emerald-400 font-extrabold">{nav.clicks} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ANNOUNCEMENTS BROADCAST                                            */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-white">MenCore Broadcast Announcements</h3>
            <button
              onClick={() => setShowAncModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {announcements.map((anc) => (
              <div
                key={anc.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <h4 className="font-extrabold text-white text-sm">{anc.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        anc.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {anc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{anc.content}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAnc(anc.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {anc.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteAnc(anc.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: APPEARANCE & THEME                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-extrabold text-white">MenCore Widget Appearance & Customization</h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-3">Theme Color Accent</label>
            <div className="flex flex-wrap gap-4">
              {[
                ['indigo', 'Indigo Modern', 'bg-indigo-600'],
                ['emerald', 'Emerald Professional', 'bg-emerald-600'],
                ['violet', 'Violet Sleek', 'bg-violet-600'],
                ['amber', 'Amber Warm', 'bg-amber-600'],
                ['blue', 'Blue Classic', 'bg-blue-600'],
              ].map(([colorKey, label, bgClass]: any) => (
                <button
                  key={colorKey}
                  onClick={() => {
                    const updated = { ...settings, themeColor: colorKey };
                    setSettings(updated);
                    MenCoreService.saveSettings(updated);
                  }}
                  className={`px-4 py-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold cursor-pointer transition-all ${
                    settings.themeColor === colorKey
                      ? 'border-white bg-slate-800 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${bgClass}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.glowingAnimation}
                onChange={(e) => {
                  const updated = { ...settings, glowingAnimation: e.target.checked };
                  setSettings(updated);
                  MenCoreService.saveSettings(updated);
                }}
                className="rounded border-slate-700 bg-slate-950 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-200">
                Enable Soft Glowing Pulse Animation around MenCore Avatar
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: TRAINING CENTER & INTERACTIVE SANDBOX                              */}
      {/* ========================================================================= */}
      {activeTab === 'training' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white">MenCore Interactive Training Sandbox</h3>
            <p className="text-xs text-slate-400 mt-1">
              Test how MenCore interprets user queries against the live Knowledge Base and Restricted Topic filters before publishing to students.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a test question (e.g. 'How do I subscribe?' or 'Who is the president?')..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const res = MenCoreService.queryMenCore(testQuery);
                  setTestResult(res);
                }
              }}
              className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white"
            />
            <button
              onClick={() => {
                const res = MenCoreService.queryMenCore(testQuery);
                setTestResult(res);
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Test Reply
            </button>
          </div>

          {testResult && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 font-bold text-xs rounded-full border border-indigo-500/30">
                  Type: {testResult.questionType.toUpperCase()}
                </span>
                {testResult.unanswered && (
                  <span className="text-xs font-bold text-amber-400">⚠️ No direct KB match logged</span>
                )}
              </div>
              <p className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                {testResult.answer}
              </p>
              {testResult.navigationTarget && (
                <div className="pt-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl inline-block">
                    Button Rendered: [{testResult.navigationTarget.label}] → View: {testResult.navigationTarget.view}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: RESTRICTED TOPICS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'restricted' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-white">Restricted Topic Enforcement</h3>
            <p className="text-xs text-slate-400 mt-1">
              MenCore strictly refuses questions outside Acadet CBT Master (e.g. general politics, solving homework, chemistry explanations) until Academic AI is enabled.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Standard Refusal Message</label>
            <textarea
              rows={4}
              value={settings.restrictedReplyMessage}
              onChange={(e) => {
                const updated = { ...settings, restrictedReplyMessage: e.target.value };
                setSettings(updated);
                MenCoreService.saveSettings(updated);
              }}
              className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white font-mono leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: FEEDBACK STATS                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">Student Helpfulness & 5-Star Ratings</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ratings collected after conversations from "Was this helpful? ⭐⭐⭐⭐⭐"
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-amber-400">⭐ {avgSatisfaction} / 5.0</span>
              <span className="block text-xs text-slate-400 mt-0.5">{ratedLogs.length} total ratings</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold border-b border-slate-800">
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Question Asked</th>
                  <th className="p-3.5">Rating ⭐</th>
                  <th className="p-3.5">Helpful Status</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {ratedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-white">{log.userName}</td>
                    <td className="p-3.5 text-slate-200">{log.question}</td>
                    <td className="p-3.5 text-amber-400 font-bold">⭐ {log.starRating}/5</td>
                    <td className="p-3.5">
                      {log.wasHelpful ? (
                        <span className="text-emerald-400 font-bold">✓ Helpful</span>
                      ) : (
                        <span className="text-rose-400 font-bold">✗ Needs Improvement</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[10px]">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT KNOWLEDGE BASE MODAL                                           */}
      {/* ========================================================================= */}
      {showKbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingItem ? 'Edit Knowledge Base Article' : 'Add New Knowledge Base Article'}
              </h3>
              <button
                onClick={() => setShowKbModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKbItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Topic / Question Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How do I start CBT?"
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={kbCategory}
                    onChange={(e) => setKbCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
                  >
                    <option value="CBT & Practice">CBT & Practice</option>
                    <option value="Subscriptions & Payments">Subscriptions & Payments</option>
                    <option value="Account & Profile">Account & Profile</option>
                    <option value="Platform Features">Platform Features</option>
                    <option value="Study Tools & Community">Study Tools & Community</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Pin to Top?</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={kbIsPinned}
                      onChange={(e) => setKbIsPinned(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 w-4 h-4"
                    />
                    <span className="font-bold">Yes, Pin Article</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Trigger Keywords (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. start cbt, take exam, practice test"
                  value={kbKeywords}
                  onChange={(e) => setKbKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">MenCore Official Answer *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide detailed, clear instructions about this platform feature..."
                  value={kbAnswer}
                  onChange={(e) => setKbAnswer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Action Button Label (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Open Subscription Page"
                    value={kbNavLabel}
                    onChange={(e) => setKbNavLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Navigation Target View</label>
                  <select
                    value={kbNavView}
                    onChange={(e) => setKbNavView(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white font-bold"
                  >
                    <option value="dashboard">Dashboard / Practice</option>
                    <option value="study-materials">Study Materials</option>
                    <option value="community">Learning Community</option>
                    <option value="leaderboard">Leaderboard</option>
                    <option value="results">CBT Results</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKbModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BROADCAST ANNOUNCEMENT MODAL                                              */}
      {/* ========================================================================= */}
      {showAncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Broadcast MenCore Announcement</h3>
              <button
                onClick={() => setShowAncModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🔔 New Feature Added!"
                  value={ancTitle}
                  onChange={(e) => setAncTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Announcement Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Practice Mode now supports unlimited questions..."
                  value={ancContent}
                  onChange={(e) => setAncContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAncModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow"
                >
                  Broadcast Immediately
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
