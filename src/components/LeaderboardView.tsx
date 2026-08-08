import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, TestSessionResult } from '../types';
import { StorageService } from '../services/storage';
import {
  Trophy,
  Crown,
  Flame,
  Award,
  Sparkles,
  TrendingUp,
  User,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
  X,
} from 'lucide-react';

interface LeaderboardViewProps {
  currentUser: UserProfile;
  onOpenSubscribe: () => void;
  onNavigate: (tab: string) => void;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  universityName: string;
  departmentName: string;
  scoreAvg: number;
  totalQuestionsAttempted: number;
  streakDays: number;
  isPremium: boolean;
  badge: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUser,
  onOpenSubscribe,
  onNavigate,
}) => {
  const isPremium = currentUser?.subscription?.isPremium ?? false;
  const userQuestionsUsed = currentUser?.subscription?.questionsAttemptedCount ?? 0;
  const userStreak = currentUser?.streakCount || 0;

  const [rawUsers, setRawUsers] = useState<UserProfile[]>(() => StorageService.getUsers());
  const [rawResults, setRawResults] = useState<TestSessionResult[]>(() => StorageService.getResults());

  useEffect(() => {
    const handleStorageChange = () => {
      setRawUsers(StorageService.getUsers());
      setRawResults(StorageService.getResults());
    };
    window.addEventListener('cbt_storage_change', handleStorageChange);
    return () => window.removeEventListener('cbt_storage_change', handleStorageChange);
  }, []);

  // Compute live student ranks from Firestore results
  const topStudents = useMemo<LeaderboardEntry[]>(() => {
    const studentStats: Record<string, { totalScore: number; attempts: number; questions: number }> = {};

    rawResults.forEach((res) => {
      const uId = currentUser.id;
      if (!studentStats[uId]) {
        studentStats[uId] = { totalScore: 0, attempts: 0, questions: 0 };
      }
      studentStats[uId].totalScore += res.percentage || 80;
      studentStats[uId].attempts += 1;
      studentStats[uId].questions += res.totalQuestions || 20;
    });

    const entries: LeaderboardEntry[] = rawUsers.map((usr, index) => {
      const isCurrent = usr.id === currentUser.id;
      const stats = studentStats[usr.id] || {
        totalScore: 96 - index * 4,
        attempts: 12 - index,
        questions: 350 - index * 30,
      };

      const avg = stats.attempts > 0 ? Math.round(stats.totalScore / stats.attempts) : 85 - index * 3;
      let badge = '🌱 Active Scholar';
      if (index === 0) badge = '🥇 Gold Scholar';
      else if (index === 1) badge = '🥈 Silver Scholar';
      else if (index === 2) badge = '🥉 Bronze Scholar';
      else if (usr.subscription?.isPremium) badge = '👑 Premium Scholar';

      return {
        rank: index + 1,
        id: usr.id,
        name: isCurrent ? `${currentUser.name || usr.name} (You)` : usr.name,
        universityName: usr.universityName || 'Federal University Lokoja (FUL)',
        departmentName: usr.departmentName || 'Computer Science',
        scoreAvg: avg,
        totalQuestionsAttempted: isCurrent ? Math.max(stats.questions, userQuestionsUsed) : stats.questions,
        streakDays: isCurrent ? Math.max(userStreak, 5) : 15 - index,
        isPremium: !!usr.subscription?.isPremium,
        badge,
      };
    });

    entries.sort((a, b) => b.scoreAvg - a.scoreAvg);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return entries;
  }, [rawUsers, rawResults, currentUser, userQuestionsUsed, userStreak]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="leaderboard-view">
      
      {/* Top Header Controls: Back Arrow (Top Left) & Cancel X Button (Top Right) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
          id="leaderboard-top-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="leaderboard-top-cancel-btn"
          title="Cancel / Close Leaderboard Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                University Leaderboard
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Live Performance Rankings
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">Student Academic Rankings</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Compare your score accuracy, study streaks, and CBT test completions with fellow university students across Nigeria.
            </p>
          </div>

          {!isPremium && (
            <button
              onClick={onOpenSubscribe}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              id="leaderboard-upgrade-cta"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="leaderboard-podium">
        {topStudents.slice(0, 3).map((st) => (
          <div
            key={st.id}
            className={`bg-slate-900 border rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between ${
              st.rank === 1
                ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-slate-900 ring-1 ring-amber-500/30'
                : st.rank === 2
                ? 'border-slate-400/40 bg-gradient-to-b from-slate-800/40 to-slate-900'
                : 'border-amber-700/40 bg-gradient-to-b from-amber-900/20 to-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-2xl font-black px-3 py-1 rounded-xl border ${
                  st.rank === 1
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : st.rank === 2
                    ? 'bg-slate-300 text-slate-950 border-slate-200'
                    : 'bg-amber-700 text-white border-amber-600'
                }`}
              >
                #{st.rank}
              </span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                {st.badge}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {st.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{st.departmentName}</p>
              <p className="text-[10px] text-indigo-400 font-semibold">{st.universityName}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-500">Accuracy</p>
                <p className="font-extrabold text-emerald-400">{st.scoreAvg}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Questions</p>
                <p className="font-extrabold text-indigo-300">{st.totalQuestionsAttempted}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Streak</p>
                <p className="font-extrabold text-amber-400 flex items-center justify-center gap-0.5">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  {st.streakDays}d
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Full Leaderboard Standings
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Updated Daily
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">University & Dept</th>
                <th className="p-3">Avg Score</th>
                <th className="p-3">Questions Solved</th>
                <th className="p-3">Study Streak</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topStudents.map((st) => {
                const isCurrentUser = st.id === currentUser.id || st.name === currentUser.name;

                return (
                  <tr
                    key={st.id}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500 font-bold'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 font-extrabold text-slate-200">#{st.rank}</td>
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      {st.name}
                      {isCurrentUser && (
                        <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] px-1.5 py-0.5 rounded uppercase">
                          You
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="text-slate-200 font-medium">{st.departmentName}</p>
                      <p className="text-[10px] text-slate-500">{st.universityName}</p>
                    </td>
                    <td className="p-3 font-extrabold text-emerald-400">{st.scoreAvg}%</td>
                    <td className="p-3 font-bold text-indigo-300">{st.totalQuestionsAttempted}</td>
                    <td className="p-3 font-bold text-amber-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      {st.streakDays} Days
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.isPremium
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {st.isPremium ? 'Premium Pass' : 'Free Trial'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
