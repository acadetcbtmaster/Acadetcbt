import React from 'react';
import { TestSessionResult } from '../types';
import {
  TrendingUp,
  Award,
  Target,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  AlertCircle,
  ArrowLeft,
  X,
} from 'lucide-react';

interface PerformanceAnalyticsProps {
  results: TestSessionResult[];
  onNavigate: (tab: string) => void;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  results,
  onNavigate,
}) => {
  const totalSessions = results.length;
  const avgScore = totalSessions > 0
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / totalSessions)
    : 82;

  const highestScore = totalSessions > 0
    ? Math.max(...results.map((r) => r.percentage))
    : 92;

  const mockExams = results.filter((r) => r.type === 'mock_cbt');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" id="analytics-container">
      
      {/* Top Header Controls: Back Arrow (Top Left) & Cancel X Button (Top Right) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
          id="performance-top-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="performance-top-cancel-btn"
          title="Cancel / Close Analytics Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Performance & Academic Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your exam readiness, accuracy trends, and subject mastery over time.
          </p>
        </div>

        <button
          onClick={() => onNavigate('mock_cbt')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          Take New CBT Exam
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Exams</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Mock & Practice sessions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Average Accuracy</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-300">{avgScore}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Across all completed tests</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Highest Score</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300">{highestScore}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Personal best score</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Full CBTs Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{mockExams.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Timed simulations</p>
        </div>

      </div>

      {/* Weak & Strong Topics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Areas for Improvement (Weak Topics)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Spend more practice time on these topics before your upcoming exam:
          </p>

          <div className="space-y-3">
            {[
              { topic: 'Subject-Verb Concord', course: 'GST101', accuracy: 55 },
              { topic: 'Kinematics & Vectors', course: 'PHY101', accuracy: 62 },
            ].map((t, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">{t.topic} ({t.course})</span>
                  <span className="text-rose-400 font-bold text-xs">{t.accuracy}% Accuracy</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${t.accuracy}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Mastered Concepts (Strong Topics)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            You consistently score high accuracy in these areas:
          </p>

          <div className="space-y-3">
            {[
              { topic: 'Quadratic Equations & Polynomials', course: 'MTH101', accuracy: 94 },
              { topic: 'Binary Logic & Number Systems', course: 'COS101', accuracy: 88 },
            ].map((t, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">{t.topic} ({t.course})</span>
                  <span className="text-emerald-400 font-bold text-xs">{t.accuracy}% Accuracy</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${t.accuracy}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detailed History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          Complete Exam History Log
        </h3>

        {results.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-950 rounded-xl border border-dashed border-slate-800">
            No exam sessions logged yet. Complete practice sessions or mock CBTs to populate your score record!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Course</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3">Time Spent</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{r.courseCode}: {r.courseTitle}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.type === 'mock_cbt' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {r.type === 'mock_cbt' ? 'Mock CBT' : 'Practice'}
                      </span>
                    </td>
                    <td className="p-3">{r.score}/{r.totalQuestions}</td>
                    <td className="p-3 font-bold text-emerald-400">{r.percentage}%</td>
                    <td className="p-3">{Math.floor(r.timeSpentSeconds / 60)}m {r.timeSpentSeconds % 60}s</td>
                    <td className="p-3 text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
