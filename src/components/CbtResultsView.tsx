import React, { useState } from 'react';
import { TestSessionResult, Question } from '../types';
import { safeStringify } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter
} from 'lucide-react';

interface CbtResultsViewProps {
  result: TestSessionResult;
  questions: Question[];
  onRetake: () => void;
  onBackToDashboard: () => void;
  onNavigate?: (tab: string) => void;
}

export const CbtResultsView: React.FC<CbtResultsViewProps> = ({
  result,
  questions,
  onRetake,
  onBackToDashboard,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [aiAnalysis, setAiAnalysis] = useState<{
    verdict?: string;
    feedback?: string;
    recommendations?: string[];
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const testQuestions = questions.filter((q) => result.questionIds.includes(q.id));

  // Count stats
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  testQuestions.forEach((q) => {
    const userAns = result.userAnswers[q.id];
    if (!userAns) {
      unansweredCount++;
    } else if (userAns === q.correctAnswer) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const minutesSpent = Math.floor(result.timeSpentSeconds / 60);
  const secondsSpent = result.timeSpentSeconds % 60;

  // Filter questions for review
  const filteredQuestions = testQuestions.filter((q) => {
    const userAns = result.userAnswers[q.id];
    if (filter === 'correct') return userAns === q.correctAnswer;
    if (filter === 'incorrect') return userAns && userAns !== q.correctAnswer;
    if (filter === 'unanswered') return !userAns;
    return true;
  });

  // Request SMART Performance Analysis
  const handleFetchAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const data = await ApiClient.analyzePerformance({
        score: result.score,
        totalQuestions: result.totalQuestions,
        courseCode: result.courseCode,
        timeSpentSeconds: result.timeSpentSeconds,
        weakTopics: ['Concord', 'Kinematics'],
        strongTopics: ['Algebra'],
      });
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8" id="cbt-results-container">
      
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Exam Submission Complete
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {result.courseCode}: {result.courseTitle}
            </h1>
            <p className="text-xs text-slate-400">
              {result.universityName} • {new Date(result.date).toLocaleString()}
            </p>
          </div>

          {/* Score Radial Box */}
          <div className="flex items-center space-x-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{result.percentage}%</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Final Grade</p>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{result.score} / {result.totalQuestions}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Total Points</p>
            </div>
          </div>

        </div>

        {/* Detailed Breakdown Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{correctCount}</p>
              <p className="text-[10px] text-slate-400 uppercase">Correct</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{incorrectCount}</p>
              <p className="text-[10px] text-slate-400 uppercase">Incorrect</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{unansweredCount}</p>
              <p className="text-[10px] text-slate-400 uppercase">Unanswered</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold text-white">{minutesSpent}m {secondsSpent}s</p>
              <p className="text-[10px] text-slate-400 uppercase">Time Spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* SMART Performance Analysis Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">SMART Performance Insight</h2>
          </div>
          {!aiAnalysis && (
            <button
              onClick={handleFetchAiAnalysis}
              disabled={loadingAi}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              {loadingAi ? 'Analyzing Result...' : 'Generate SMART Report'}
            </button>
          )}
        </div>

        {aiAnalysis ? (
          <div className="space-y-3 p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl text-xs text-slate-200 animate-in fade-in">
            <p className="font-extrabold text-sm text-purple-300">{aiAnalysis.verdict}</p>
            <p className="leading-relaxed">{aiAnalysis.feedback}</p>
            {aiAnalysis.recommendations && (
              <div className="pt-2 border-t border-purple-500/20">
                <p className="font-bold text-purple-300 mb-1">Recommended Next Steps:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {aiAnalysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Click "Generate SMART Report" to get tailored feedback and study recommendations based on your performance.
          </p>
        )}
      </div>

      {/* Learning Community Recommendation Callout */}
      {onNavigate && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Need Help Understanding Difficult Topics in {result.courseCode}?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Submit a topic request in the <strong className="text-indigo-300">Topic Request Center</strong> or watch step-by-step tutorial videos prepared by Joyce and the video tutorial team in the Learning Community.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('community')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer shrink-0 transition-colors"
          >
            Open Learning Community →
          </button>
        </div>
      )}

      {/* Question Review Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Question-by-Question Review
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({testQuestions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                filter === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                filter === 'incorrect' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incorrect ({incorrectCount})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const userAns = result.userAnswers[q.id];
            const isCorrect = userAns === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl border text-xs space-y-4 ${
                  isCorrect
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : userAns
                    ? 'bg-slate-900/90 border-rose-500/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">Q{idx + 1}.</span>
                    <p className="text-sm font-semibold text-white">{q.question}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    isCorrect
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : userAns
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isCorrect ? 'Correct' : userAns ? 'Incorrect' : 'Unanswered'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const optText = q[`option${opt}` as keyof Question] as string;
                    const isChosen = userAns === opt;
                    const isRightOpt = q.correctAnswer === opt;

                    let optStyle = 'bg-slate-950 border-slate-800 text-slate-400';
                    if (isRightOpt) {
                      optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isChosen && !isRightOpt) {
                      optStyle = 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold';
                    }

                    return (
                      <div key={opt} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}>
                        <span><strong>{opt})</strong> {optText}</span>
                        {isRightOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isChosen && !isRightOpt && <XCircle className="w-4 h-4 text-rose-400" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                  <span className="font-bold text-indigo-400 block mb-0.5">Explanation:</span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onRetake}
          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Mock Exam
        </button>
        <button
          onClick={onBackToDashboard}
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>

    </div>
  );
};
