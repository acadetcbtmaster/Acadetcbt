import React from 'react';
import { UserProfile, TestSessionResult, Question, Course } from '../types';
import {
  Sparkles,
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Crown,
  History,
  Target,
  Flame,
  Check,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { getEffectiveStreak, getLast7DaysStreakStatus } from '../utils/streak';

interface StudentDashboardProps {
  user: UserProfile;
  results: TestSessionResult[];
  questions?: Question[];
  courses?: Course[];
  onNavigate: (tab: string) => void;
  onOpenSubscribe: () => void;
  onOpenEditProfile?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  results,
  onNavigate,
  onOpenSubscribe,
  onOpenEditProfile,
}) => {
  const isPremium = user?.subscription?.isPremium ?? false;
  const questionsUsed = user?.subscription?.questionsAttemptedCount ?? 0;
  const freeLimit = user?.subscription?.freeLimit ?? 30;
  const freeRemaining = Math.max(0, freeLimit - questionsUsed);

  // Streak calculations
  const streakInfo = getEffectiveStreak(user);
  const weekDays = getLast7DaysStreakStatus(user);

  // Calculate metrics
  const totalCompleted = results.reduce((acc, r) => acc + r.totalQuestions, 0) + questionsUsed;
  const mockCbtsCount = results.filter((r) => r.type === 'mock_cbt').length;
  
  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
    : 78;

  const highestScore = results.length > 0
    ? Math.max(...results.map((r) => r.percentage))
    : 90;

  const recentSessions = results.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="student-dashboard">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                ⚡ Unlimited Free Access
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, {user.name}! 👋
              </h1>
              {onOpenEditProfile && (
                <button
                  onClick={onOpenEditProfile}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  title="Edit Profile"
                  id="dashboard-edit-profile-btn"
                >
                  Edit Profile
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Ready to practice today? Test your knowledge with past questions or simulate a full timed CBT exam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isPremium ? (
              <button
                onClick={onOpenSubscribe}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 animate-pulse"
                id="dashboard-upgrade-btn"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                Upgrade to Premium
              </button>
            ) : (
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium">
                Unlimited CBT Access Unlocked
              </div>
            )}
            <button
              onClick={() => onNavigate('practice')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              id="dashboard-quick-practice-btn"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              Start Practice
            </button>
          </div>
        </div>

        {/* Free Trial Usage Card */}
        {!isPremium && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Free Trial Progress</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${
                  questionsUsed >= freeLimit
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : questionsUsed >= Math.floor(freeLimit * 0.8)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {freeRemaining} Questions Remaining
                </span>
              </div>
              <span className="text-slate-400">
                Limit: <strong className="text-white">{freeLimit} Questions</strong> • Used: <strong className={questionsUsed >= freeLimit ? 'text-rose-400' : 'text-amber-400'}>{questionsUsed}</strong>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  questionsUsed >= freeLimit
                    ? 'bg-rose-500'
                    : questionsUsed >= Math.floor(freeLimit * 0.8)
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (questionsUsed / freeLimit) * 100)}%` }}
              ></div>
            </div>

            {/* 80% Threshold Alert Banner */}
            {questionsUsed >= Math.floor(freeLimit * 0.8) && questionsUsed < freeLimit && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Free Trial Warning: 80% Reached
                    </span>
                    <p className="text-slate-200 font-medium mt-1">
                      You have completed <strong>{questionsUsed} of {freeLimit}</strong> free questions (80% used). Only <strong>{freeRemaining} questions remaining</strong>!
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenSubscribe}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shrink-0 cursor-pointer flex items-center gap-1.5"
                  id="dashboard-80-alert-upgrade-btn"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Upgrade to Premium
                </button>
              </div>
            )}

            {/* 100% Threshold Alert Banner */}
            {questionsUsed >= freeLimit && (
              <div className="p-4 bg-rose-950/50 border border-rose-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                    <AlertCircle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <span className="font-extrabold text-rose-300 uppercase tracking-wider text-[10px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      Free Trial Expired: 100% Limit Reached
                    </span>
                    <p className="text-rose-100 font-medium mt-1">
                      Your free trial limit has been reached ({questionsUsed}/{freeLimit} questions). Subscribe to Premium to continue practicing.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onOpenSubscribe}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shrink-0 cursor-pointer flex items-center gap-1.5"
                  id="dashboard-100-alert-upgrade-btn"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily Study Streak Banner */}
      <div
        className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        id="daily-study-streak-card"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Streak Counter Badge & Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  streakInfo.practicedToday
                    ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-amber-500/30'
                    : streakInfo.streak > 0
                    ? 'bg-gradient-to-br from-amber-600/30 to-slate-800 text-amber-400 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                <Flame
                  className={`w-9 h-9 sm:w-11 sm:h-11 ${
                    streakInfo.practicedToday
                      ? 'animate-bounce text-amber-200 fill-amber-200'
                      : streakInfo.streak > 0
                      ? 'text-amber-400 fill-amber-400/30'
                      : 'text-slate-500'
                  }`}
                />
              </div>
              {streakInfo.practicedToday && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-black p-1 rounded-full border-2 border-slate-900">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Daily Study Streak
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    streakInfo.practicedToday
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {streakInfo.practicedToday ? 'Streak Saved Today' : 'Pending Today'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {streakInfo.streak} {streakInfo.streak === 1 ? 'Day' : 'Days'}
                </h2>
                <span className="text-xs text-slate-400 font-medium">in a row!</span>
              </div>

              <p className="text-xs text-slate-300 max-w-md">
                {streakInfo.practicedToday
                  ? "🔥 Fantastic work! You've practiced today and kept your streak alive. Keep building momentum!"
                  : streakInfo.streak > 0
                  ? '⚡ Practice at least 1 question today to keep your streak going!'
                  : '🚀 Start practicing today to trigger your 1-day study streak!'}
              </p>
            </div>
          </div>

          {/* Right: 7-Day Activity Matrix */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 shrink-0">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Last 7 Days
              </span>
              <div className="flex items-center gap-2">
                {weekDays.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        day.isPracticed
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : day.isToday
                          ? 'bg-slate-900 border-2 border-dashed border-amber-400 text-amber-400 animate-pulse'
                          : 'bg-slate-900 border border-slate-800 text-slate-600'
                      }`}
                      title={`${day.dateStr} - ${day.isPracticed ? 'Practiced' : 'No Practice'}`}
                    >
                      {day.isPracticed ? (
                        <Flame className="w-4 h-4 fill-slate-950" />
                      ) : (
                        <span className="text-[10px]">{day.dayNum}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        day.isToday ? 'text-amber-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!streakInfo.practicedToday && (
              <button
                onClick={() => onNavigate('practice')}
                className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                id="extend-streak-btn"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>Extend Streak</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="kpi-metrics-grid">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Solved</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{totalCompleted}</p>
          <p className="text-[11px] text-slate-500 mt-1">Questions answered</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Mock Exams</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{mockCbtsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Full CBTs completed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-300">{avgScore}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Across all sessions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Highest Score</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300">{highestScore}%</p>
          <p className="text-[11px] text-slate-500 mt-1">Best performance</p>
        </div>

      </div>

      {/* Main Grid: Actions & Recommended */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Launch Modules */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            Practice & Test Center
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 🏆 Face Arena Weekly Quiz Challenge Featured Card */}
            <div
              onClick={() => onNavigate('face_arena')}
              className="sm:col-span-2 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border-2 border-amber-500/40 hover:border-amber-400 p-6 rounded-2xl cursor-pointer transition-all group hover:-translate-y-1 shadow-xl shadow-amber-500/10 relative overflow-hidden"
              id="dashboard-face-arena-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <Award className="w-8 h-8 text-amber-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider">
                        Weekly Competition
                      </span>
                      <span className="text-[11px] text-amber-300 font-bold">
                        Live Timed Challenge
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-amber-200 transition-colors">
                      🏆 Face Arena Weekly Quiz Challenge
                    </h3>
                    <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                      Compete in our weekly timed CBT quiz challenge! Register your WhatsApp number, answer questions under pressure, and battle for top leaderboard positions.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0">
                  <span className="px-5 py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 group-hover:gap-3 transition-all">
                    <span>Enter Face Arena</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Practice Mode Launcher */}
            <div
              onClick={() => onNavigate('practice')}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500 p-6 rounded-2xl cursor-pointer transition-all group hover:-translate-y-1 shadow-lg"
              id="dashboard-practice-card"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                Practice Mode
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Filter by University, Course, Topic, and Difficulty. Immediate answer feedback with full detailed explanations.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-400">
                <span>Start Practice</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Mock CBT Launcher */}
            <div
              onClick={() => onNavigate('mock_cbt')}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500 p-6 rounded-2xl cursor-pointer transition-all group hover:-translate-y-1 shadow-lg"
              id="dashboard-mockcbt-card"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Mock CBT Practice Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Full-scale exam conditions with countdown timer, question palette, randomized questions, and detailed results.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <span>Take Mock Exam</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Study Materials Launcher */}
            <div
              onClick={() => onNavigate('materials')}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-6 rounded-2xl cursor-pointer transition-all group hover:-translate-y-1 shadow-lg"
              id="dashboard-materials-card"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Study Materials & Notes
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Access free sample summaries, formula cheat sheets, and past question solutions.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-400">
                <span>Explore Resources</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Leaderboard Launcher */}
            <div
              onClick={() => onNavigate('leaderboard')}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500 p-6 rounded-2xl cursor-pointer transition-all group hover:-translate-y-1 shadow-lg"
              id="dashboard-leaderboard-card"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                Student Leaderboard
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                View top scores, student accuracy rankings, and daily streak awards across universities.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-400">
                <span>View Rankings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

          {/* Recent Exam History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Recent Test History
              </h3>
              <button
                onClick={() => onNavigate('performance')}
                className="text-xs font-semibold text-indigo-400 hover:underline"
              >
                View Full Analytics
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                No exam history yet. Complete your first practice or CBT test to see scores!
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{session.courseCode}: {session.courseTitle}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {session.type === 'mock_cbt' ? 'Mock CBT Exam' : 'Practice Session'} • {session.totalQuestions} questions • {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        session.percentage >= 70
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : session.percentage >= 50
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {session.score}/{session.totalQuestions} ({session.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Recommendations & Bookmarks */}
        <div className="space-y-6">
          
          {/* Saved Bookmarks Shortcut */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                Saved Bookmarks
              </h3>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                {user.bookmarks.length} Saved
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Review questions you saved during practice or mock exams.
            </p>
            <button
              onClick={() => onNavigate('bookmarks')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              Review Bookmarked Questions
            </button>
          </div>

          {/* Recommended Practice Topics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Recommended Study Topics</h3>
            <p className="text-xs text-slate-400 mb-4">
              High-frequency exam topics based on official university general studies:
            </p>
            
            <div className="space-y-2.5">
              {[
                { code: 'GST101', name: 'Subject-Verb Concord', diff: 'Medium' },
                { code: 'MTH101', name: 'Quadratic Equations & Polynomials', diff: 'Easy' },
                { code: 'PHY101', name: 'Newton Laws & Vectors', diff: 'Hard' },
                { code: 'COS101', name: 'Binary Conversions & Logic Gates', diff: 'Medium' },
              ].map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('practice')}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-indigo-400 text-[10px] uppercase">{t.code}</span>
                    <p className="font-medium text-slate-200 mt-0.5">{t.name}</p>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                    {t.diff}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
