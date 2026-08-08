import React, { useState } from 'react';
import { UserProfile, Question } from '../types';
import {
  Bookmark,
  Trash2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Search,
  ArrowLeft,
  X,
} from 'lucide-react';

interface BookmarksViewProps {
  user: UserProfile;
  questions: Question[];
  onUpdateUser: (updatedUser: UserProfile) => void;
  onStartPracticeWithQuestions: (qs: Question[]) => void;
  onNavigate?: (tab: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  user,
  questions,
  onUpdateUser,
  onStartPracticeWithQuestions,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');

  const bookmarkedQuestions = questions.filter((q) => (user?.bookmarks || []).includes(q.id));
  const filtered = bookmarkedQuestions.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    (q.topicName && q.topicName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRemoveBookmark = (qId: string) => {
    const updated = (user?.bookmarks || []).filter((id) => id !== qId);
    onUpdateUser({ ...user, bookmarks: updated });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" id="bookmarks-container">
      
      {/* Top Header Controls: Back Arrow (Top Left) & Cancel X Button (Top Right) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
          id="bookmarks-top-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="bookmarks-top-cancel-btn"
          title="Cancel / Close Bookmarks Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-indigo-400" />
            Saved Bookmarks Vault
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Questions you flagged during practice and mock CBT exams for revision.
          </p>
        </div>

        {bookmarkedQuestions.length > 0 && (
          <button
            onClick={() => onStartPracticeWithQuestions(bookmarkedQuestions)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Practice All Saved ({bookmarkedQuestions.length})
          </button>
        )}
      </div>

      {/* Search Input */}
      {bookmarkedQuestions.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search saved questions or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-indigo-500"
          />
        </div>
      )}

      {/* Bookmarks List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Bookmarked Questions</h3>
          <p className="text-xs text-slate-400">
            When practicing questions or taking CBT exams, click the bookmark icon to save tricky questions here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 mr-2">
                    {q.topicName || 'General Studies'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">{q.difficulty}</span>
                  <p className="text-sm font-semibold text-white mt-2 leading-relaxed">{q.question}</p>
                </div>

                <button
                  onClick={() => handleRemoveBookmark(q.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optText = q[`option${opt}` as keyof Question] as string;
                  const isRightOpt = q.correctAnswer === opt;

                  return (
                    <div
                      key={opt}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isRightOpt
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span><strong>{opt})</strong> {optText}</span>
                      {isRightOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-indigo-400 block mb-0.5">Correct Answer & Explanation:</span>
                {q.explanation}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
