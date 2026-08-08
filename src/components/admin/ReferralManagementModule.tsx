import React, { useState, useEffect } from 'react';
import { UserProfile, ReferralLeaderboardConfig } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Share2,
  Users,
  Search,
  Trophy,
  UserCheck,
  Calendar,
  Building2,
  BookOpen,
  Eye,
  X,
  Sparkles,
  Link as LinkIcon,
  Filter,
  CheckCircle2,
  HelpCircle,
  Download,
  RotateCcw,
  Settings,
  AlertTriangle,
  Check,
  Sliders,
  Power,
  Save,
} from 'lucide-react';

export const ReferralManagementModule: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [config, setConfig] = useState<ReferralLeaderboardConfig>(() =>
    StorageService.getReferralLeaderboardConfig()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [minFilter, setMinFilter] = useState<'all' | 'active'>('all');
  const [selectedReferrer, setSelectedReferrer] = useState<UserProfile | null>(null);

  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load and subscribe to real-time users list & config
  useEffect(() => {
    const loadData = () => {
      setUsers(StorageService.getUsers());
      setConfig(StorageService.getReferralLeaderboardConfig());
    };

    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('cbt_storage_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(loadData, 3000);

    return () => {
      window.removeEventListener('cbt_storage_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute Metrics
  const totalCompletedReferrals = users.reduce(
    (sum, u) => sum + (u.completedReferrals ?? u.successfulReferrals ?? 0),
    0
  );
  const usersWithCodeCount = users.filter((u) => Boolean(u.referralCode)).length;
  const activeReferrers = users.filter(
    (u) => (u.completedReferrals ?? u.successfulReferrals ?? 0) > 0
  );
  const activeReferrersCount = activeReferrers.length;

  // Sorted Leaderboard (highest completedReferrals first)
  const sortedLeaderboard = [...users].sort((a, b) => {
    const cA = a.completedReferrals ?? a.successfulReferrals ?? 0;
    const cB = b.completedReferrals ?? b.successfulReferrals ?? 0;
    return cB - cA;
  });

  // Filtered List
  const filteredUsers = sortedLeaderboard.filter((u) => {
    const count = u.completedReferrals ?? u.successfulReferrals ?? 0;
    const matchesMin = minFilter === 'active' ? count > 0 : true;
    const q = searchQuery.toLowerCase().trim();
    const username = u.username || u.email?.split('@')[0] || '';
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(q)) ||
      (u.universityName && u.universityName.toLowerCase().includes(q));
    return matchesMin && matchesSearch;
  });

  // Referred users for modal view
  const referredUsersList = selectedReferrer
    ? users.filter((u) => u.referredBy === selectedReferrer.id)
    : [];

  // Save Settings handler
  const handleSaveConfig = () => {
    StorageService.saveReferralLeaderboardConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    showToast('✅ Referral Leaderboard configuration saved successfully!');
  };

  // Reset Rankings handler
  const handleConfirmReset = () => {
    StorageService.resetReferralRankings();
    setShowResetModal(false);
    setUsers(StorageService.getUsers());
    showToast('⚠️ Referral Leaderboard rankings have been reset to 0 across all accounts.');
  };

  // Export Leaderboard to CSV
  const handleExportCSV = () => {
    if (sortedLeaderboard.length === 0) {
      showToast('No user data available to export.');
      return;
    }

    const headers = [
      'Rank',
      'Full Name',
      'Username',
      'Email',
      'University',
      'Department',
      'Referral Code',
      'Completed Referrals',
      'Joined Date',
    ];

    const rows = sortedLeaderboard.map((u, idx) => {
      const completed = u.completedReferrals ?? u.successfulReferrals ?? 0;
      const username = u.username || u.email?.split('@')[0] || 'student';
      return [
        idx + 1,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${username.replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${(u.universityName || 'N/A').replace(/"/g, '""')}"`,
        `"${(u.departmentName || 'N/A').replace(/"/g, '""')}"`,
        `"${u.referralCode || ''}"`,
        completed,
        `"${new Date(u.createdDate).toLocaleDateString()}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Acadet_CBT_Referral_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('📥 Referral Leaderboard exported to CSV successfully!');
  };

  return (
    <div className="space-y-6" id="admin-referral-management-module">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shrink-0">
              <Share2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Referral Management & Leaderboard Control
                </h2>
                <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Control the student Referral Leaderboard, toggle visibility across Home Page and User Dashboard, monitor real-time referral signups, export data, or execute cycle resets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-md cursor-pointer"
              id="admin-export-referral-csv-btn"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
              id="admin-reset-referrals-btn"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset Rankings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Completed Referrals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed Referrals
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{totalCompletedReferrals}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total completed student sign-ups</p>
        </div>

        {/* Active Referrers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Referrers
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-300 tracking-tight">{activeReferrersCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Students with ≥1 completed referral</p>
        </div>

        {/* Assigned Codes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assigned Codes
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-300 tracking-tight">{usersWithCodeCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Permanent unique codes generated</p>
        </div>

        {/* Top Referrer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top Referrer
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-amber-300 truncate">
            {sortedLeaderboard[0] &&
            (sortedLeaderboard[0].completedReferrals ?? sortedLeaderboard[0].successfulReferrals ?? 0) > 0
              ? sortedLeaderboard[0].name
              : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {sortedLeaderboard[0] &&
            (sortedLeaderboard[0].completedReferrals ?? sortedLeaderboard[0].successfulReferrals ?? 0) > 0
              ? `${sortedLeaderboard[0].completedReferrals ?? sortedLeaderboard[0].successfulReferrals} Completed Referrals`
              : 'No referrals recorded yet'}
          </p>
        </div>
      </div>

      {/* Leaderboard Settings & Visibility Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Leaderboard Visibility & System Settings</h3>
              <p className="text-xs text-slate-400">Manage where the Referral Leaderboard appears across the application.</p>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
            }`}
            id="admin-save-referral-config-btn"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Global Enable Switch */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Enable Leaderboard System</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Global on/off toggle</span>
            </div>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.enabled ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.enabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Homepage Visibility Switch */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Display on Home Page</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Show section on homepage</span>
            </div>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, showOnHomepage: !prev.showOnHomepage }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.showOnHomepage ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.showOnHomepage ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* User Dashboard Visibility Switch */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Display on User Dashboard</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Show card on student dashboard</span>
            </div>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, showOnDashboard: !prev.showOnDashboard }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.showOnDashboard ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.showOnDashboard ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, username, email, code..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            id="admin-referral-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => setMinFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              minFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setMinFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              minFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active Referrers ({activeReferrersCount})
          </button>
        </div>
      </div>

      {/* Referral Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Referral Leaderboard Standings</h3>
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredUsers.length} of {users.length} registered accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Student Info</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Referral Code</th>
                <th className="py-3.5 px-4 text-center">Completed Referrals</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching referral records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const referrals = u.completedReferrals ?? u.successfulReferrals ?? 0;
                  const rank = index + 1;
                  const displayUsername = u.username
                    ? `@${u.username.replace(/^@/, '')}`
                    : u.email
                    ? `@${u.email.split('@')[0]}`
                    : '@student';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black">
                            🥇 1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-slate-300/20 text-slate-200 border border-slate-300/40 font-black">
                            🥈 2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-amber-700/20 text-amber-400 border border-amber-700/40 font-black">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono font-bold">#{rank}</span>
                        )}
                      </td>

                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {u.email}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-4 px-4 font-mono text-indigo-400 font-semibold">
                        {displayUsername}
                      </td>

                      {/* Referral Code */}
                      <td className="py-4 px-4 font-mono font-bold text-indigo-300 tracking-wider">
                        <span className="bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          {u.referralCode || 'CBT8XK92'}
                        </span>
                      </td>

                      {/* Completed Referrals */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-xs ${
                            referrals > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {referrals}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedReferrer(u)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                          title="View Referred Users"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Referral Leaderboard?</h3>
                <span className="text-xs text-rose-300">Action cannot be undone</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to reset all referral standings? This will set all user referral counts (`completedReferrals`) back to 0 across all student accounts.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Yes, Reset All Standings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referred Users Modal / Detail Drawer */}
      {selectedReferrer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Referral Breakdown: {selectedReferrer.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Code: <span className="text-indigo-400 font-bold">{selectedReferrer.referralCode}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReferrer(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Referrer Stats Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500 block">Referrer Email</span>
                <p className="text-xs font-medium text-slate-200 mt-0.5 truncate">{selectedReferrer.email}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500 block">Completed Referrals</span>
                <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  {selectedReferrer.completedReferrals ?? selectedReferrer.successfulReferrals ?? 0} Users
                </p>
              </div>
            </div>

            {/* List of Referred Accounts */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Referred Accounts ({referredUsersList.length})
              </h4>

              {referredUsersList.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-500 space-y-1">
                  <p>
                    No student accounts recorded with code{' '}
                    <span className="font-mono text-indigo-400">{selectedReferrer.referralCode}</span> yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referredUsersList.map((refUser) => (
                    <div
                      key={refUser.id}
                      className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{refUser.name}</div>
                        <div className="text-[11px] text-slate-400">{refUser.email}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 block">
                          {refUser.universityName || 'CBT Student'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Joined {new Date(refUser.createdDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReferrer(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
