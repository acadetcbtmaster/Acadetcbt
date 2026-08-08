import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, ReferralLeaderboardConfig } from '../types';
import { StorageService } from '../services/storage';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getReferralLink } from '../utils/referrals';
import {
  Trophy,
  Share2,
  Users,
  Search,
  Sparkles,
  UserCheck,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Crown,
  Award,
  Link as LinkIcon,
} from 'lucide-react';

interface ReferralLeaderboardProps {
  currentUser?: UserProfile | null;
  title?: string;
  showSharePrompt?: boolean;
  onNavigate?: (tab: string) => void;
  idPrefix?: string;
}

export const ReferralLeaderboard: React.FC<ReferralLeaderboardProps> = ({
  currentUser,
  title = 'Real-Time Referral Leaderboard',
  showSharePrompt = true,
  onNavigate,
  idPrefix = 'referral-lb',
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [config, setConfig] = useState<ReferralLeaderboardConfig>(() =>
    StorageService.getReferralLeaderboardConfig()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const itemsPerPage = 10;

  // Real-time Firestore & Storage listeners
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    // 1. Direct Firestore onSnapshot query for real-time live sync across all clients
    try {
      const q = query(collection(db, 'users'));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetchedUsers: UserProfile[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              fetchedUsers.push({
                id: docSnap.id,
                name: d.fullName || d.name || 'Student',
                username: d.username || d.email?.split('@')[0] || 'student',
                email: d.email || '',
                role: d.role || 'student',
                universityName: d.universityName || '',
                departmentName: d.departmentName || '',
                subscription: d.subscription,
                createdDate: d.createdDate || new Date().toISOString(),
                referralCode: d.referralCode,
                successfulReferrals: d.successfulReferrals || 0,
                completedReferrals: d.completedReferrals ?? d.successfulReferrals ?? 0,
                ...d,
              } as UserProfile);
            });
            setUsers(fetchedUsers);
          } else {
            setUsers(StorageService.getUsers());
          }
        },
        (err) => {
          console.warn('Leaderboard Firestore listener fallback:', err);
          setUsers(StorageService.getUsers());
        }
      );
    } catch (err) {
      console.warn('Leaderboard snapshot query failed:', err);
      setUsers(StorageService.getUsers());
    }

    // 2. Local storage event listener fallback
    const updateFromStorage = () => {
      setUsers(StorageService.getUsers());
      setConfig(StorageService.getReferralLeaderboardConfig());
    };

    window.addEventListener('cbt_storage_change', updateFromStorage);
    window.addEventListener('storage', updateFromStorage);

    return () => {
      if (unsubFirestore) unsubFirestore();
      window.removeEventListener('cbt_storage_change', updateFromStorage);
      window.removeEventListener('storage', updateFromStorage);
    };
  }, []);

  // Filter & Sort Users
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const countA = a.completedReferrals ?? a.successfulReferrals ?? 0;
      const countB = b.completedReferrals ?? b.successfulReferrals ?? 0;
      if (countB !== countA) return countB - countA;
      // Secondary sort: join date or name
      return a.name.localeCompare(b.name);
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedUsers;
    return sortedUsers.filter((u) => {
      const name = u.name?.toLowerCase() || '';
      const username = (u.username || u.email?.split('@')[0] || '').toLowerCase();
      const email = u.email?.toLowerCase() || '';
      const code = u.referralCode?.toLowerCase() || '';
      return (
        name.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        code.includes(q)
      );
    });
  }, [sortedUsers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Total completed referrals count across all users
  const totalCompletedReferrals = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.completedReferrals ?? u.successfulReferrals ?? 0), 0);
  }, [users]);

  // Current logged in user's rank & stats
  const currentUserRankIndex = useMemo(() => {
    if (!currentUser) return -1;
    return sortedUsers.findIndex((u) => u.id === currentUser.id);
  }, [sortedUsers, currentUser]);

  const currentUserReferrals = currentUser
    ? currentUser.completedReferrals ?? currentUser.successfulReferrals ?? 0
    : 0;

  // Copy Referral Code & Link handlers
  const userCode = currentUser?.referralCode || 'CBT8XK92';
  const userLink = getReferralLink(userCode);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(userLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore
    }
  };

  if (!config.enabled) {
    return null; // Admin has disabled referral leaderboard globally
  }

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      id={`${idPrefix}-container`}
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Leaderboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Top students bringing their peers to Acadet CBT Master. Updated in real time!
            </p>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 shrink-0">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
              Total Referrals
            </span>
            <span className="text-base font-extrabold text-white">
              {totalCompletedReferrals} <span className="text-xs text-slate-400 font-normal">Completed</span>
            </span>
          </div>
        </div>
      </div>

      {/* Current User Rank Highlight Card (if logged in) */}
      {currentUser && (
        <div
          className="bg-gradient-to-r from-indigo-950/80 via-slate-950 to-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg relative z-10"
          id={`${idPrefix}-user-rank-banner`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 flex items-center justify-center font-extrabold text-base shrink-0">
              {currentUserRankIndex >= 0 ? `#${currentUserRankIndex + 1}` : 'N/A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm sm:text-base">
                  {currentUser.name}
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-500/40">
                  You
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUserReferrals > 0
                  ? `You have ${currentUserReferrals} completed referral${currentUserReferrals > 1 ? 's' : ''}! Keep inviting to rank higher.`
                  : 'Invite friends using your code to get your name on the leaderboard!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
              id={`${idPrefix}-user-copy-link-btn`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by student or username..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            id={`${idPrefix}-search-input`}
          />
        </div>

        <div className="text-xs text-slate-400 text-right w-full sm:w-auto">
          Showing <span className="text-white font-bold">{paginatedUsers.length}</span> of{' '}
          <span className="text-white font-bold">{filteredUsers.length}</span> ranked students
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-inner relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4 text-center">Completed Referrals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 || totalCompletedReferrals === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 px-4 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300 max-w-md mx-auto">
                      No referral rankings yet. Start inviting friends to become the first on the leaderboard!
                    </p>
                    {currentUser && showSharePrompt && (
                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Invite Friends & Take #1 Spot</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const globalRank = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isCurrent = currentUser?.id === u.id;
                  const completedCount = u.completedReferrals ?? u.successfulReferrals ?? 0;
                  const displayUsername = u.username
                    ? `@${u.username.replace(/^@/, '')}`
                    : u.email
                    ? `@${u.email.split('@')[0]}`
                    : '@student';

                  return (
                    <tr
                      key={u.id}
                      className={`transition-all ${
                        isCurrent
                          ? 'bg-indigo-950/50 border-l-4 border-l-indigo-500 font-medium text-white'
                          : 'hover:bg-slate-800/40'
                      }`}
                      id={`${idPrefix}-row-${u.id}`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center">
                        {globalRank === 1 ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 border border-amber-500/50 font-black text-xs shadow-md">
                            🥇 1
                          </span>
                        ) : globalRank === 2 ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-slate-300/30 to-slate-400/30 text-slate-200 border border-slate-300/50 font-black text-xs shadow-md">
                            🥈 2
                          </span>
                        ) : globalRank === 3 ? (
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-700/30 to-amber-800/30 text-amber-400 border border-amber-700/50 font-black text-xs shadow-md">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono font-bold text-xs">
                            #{globalRank}
                          </span>
                        )}
                      </td>

                      {/* Full Name Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isCurrent ? 'text-indigo-300' : 'text-white'}`}>
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span className="bg-indigo-600 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-full shadow-sm">
                              You
                            </span>
                          )}
                        </div>
                        {u.universityName && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            {u.universityName}
                          </span>
                        )}
                      </td>

                      {/* Username Column */}
                      <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold text-xs">
                        {displayUsername}
                      </td>

                      {/* Completed Referrals Column */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs ${
                            completedCount > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{completedCount}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs text-slate-400 font-medium">
              Page <span className="text-white font-bold">{currentPage}</span> of{' '}
              <span className="text-white font-bold">{totalPages}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
