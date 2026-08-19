import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, Question, University, Course, TestSessionResult, SEED_QUESTIONS } from '../types';
import { selectRandomQuestions } from '../utils/questionRandomizer';
import { ACADEMIC_LEVELS, ACADEMIC_SEMESTERS, normalizeLevel, normalizeSemester } from '../utils/academicStructure';
import { CbtResultsView } from './CbtResultsView';
import {
  Clock,
  BookOpen,
  Calculator,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Crown,
  X,
  ArrowLeft
} from 'lucide-react';

interface MockCbtModeProps {
  user: UserProfile;
  questions: Question[];
  universities: University[];
  courses: Course[];
  onSaveResult: (result: TestSessionResult) => void;
  onOpenSubscribe: () => void;
  onRecordQuestionAttempt: () => void;
  onNavigate: (tab: string) => void;
}

export const MockCbtMode: React.FC<MockCbtModeProps> = ({
  user,
  questions,
  universities,
  courses,
  onSaveResult,
  onOpenSubscribe,
  onRecordQuestionAttempt,
  onNavigate,
}) => {
  // Step: 'config' | 'active' | 'result'
  const [step, setStep] = useState<'config' | 'active' | 'result'>('config');

  // Config options (University -> Level -> Semester -> Course)
  const [selectedUniId, setSelectedUniId] = useState<string>(universities[0]?.id || '');
  const [selectedLevel, setSelectedLevel] = useState<string>('100 Level');
  const [selectedSemester, setSelectedSemester] = useState<string>('First Semester');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [questionCount, setQuestionCount] = useState<number | 'unlimited'>(10);

  // Filter available courses strictly by selected University -> Level -> Semester
  const selectedUni = universities.find((u) => u.id === selectedUniId);
  const availableCourses = React.useMemo(() => {
    return courses.filter((c) => {
      // 1. University match
      const uniMatches = !c.universityId || c.universityId === selectedUniId || 
        (selectedUni && c.universityName && c.universityName.toLowerCase().includes((selectedUni.abbreviation || selectedUni.name).toLowerCase()));
      if (!uniMatches) return false;

      // 2. Level match
      if (c.level) {
        if (normalizeLevel(c.level) !== normalizeLevel(selectedLevel)) return false;
      }

      // 3. Semester match
      if (c.semester) {
        if (normalizeSemester(c.semester) !== normalizeSemester(selectedSemester)) return false;
      }

      return true;
    });
  }, [courses, selectedUniId, selectedUni, selectedLevel, selectedSemester]);

  useEffect(() => {
    if (availableCourses.length > 0) {
      if (!availableCourses.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(availableCourses[0].id);
      }
    } else {
      setSelectedCourseId('');
    }
  }, [selectedUniId, selectedLevel, selectedSemester, availableCourses]);

  // Exam session state
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [showUnlimitedPremiumModal, setShowUnlimitedPremiumModal] = useState<boolean>(false);

  // Completed result storage
  const [latestResult, setLatestResult] = useState<TestSessionResult | null>(null);

  const isPremium = user?.subscription?.isPremium ?? false;
  const questionsAttempted = user?.subscription?.questionsAttemptedCount ?? 0;
  const freeLimit = user?.subscription?.freeLimit ?? 30;

  // Start CBT Exam
  const handleStartExam = () => {
    const isUnlimited = questionCount === 'unlimited';
    const targetCount = isUnlimited ? 'unlimited' : Number(questionCount) || 10;

    const { selected } = selectRandomQuestions(
      questions,
      selectedCourseId || 'all',
      'all',
      'all',
      targetCount,
      user?.seenQuestionIds || []
    );

    let finalQuestions = selected;
    if (!finalQuestions || finalQuestions.length === 0) {
      const fallback = selectRandomQuestions(questions, 'all', 'all', 'all', targetCount, []);
      finalQuestions = fallback.selected.length > 0 ? fallback.selected : SEED_QUESTIONS.slice(0, typeof targetCount === 'number' ? targetCount : 10);
    }

    setExamQuestions(finalQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setMarkedForReview([]);
    setSecondsRemaining(timeLimitMinutes * 60);
    setStep('active');
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (step !== 'active') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Auto submit exam when timer reaches 0
  useEffect(() => {
    if (step === 'active' && secondsRemaining <= 0) {
      handleSubmitExam();
    }
  }, [secondsRemaining, step]);

  // Submit Exam
  const handleSubmitExam = () => {
    if (step !== 'active') return;

    let score = 0;
    examQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const total = examQuestions.length;
    const percentage = Math.round((score / Math.max(1, total)) * 100);
    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const selectedUni = universities.find((u) => u.id === selectedUniId);

    const resultPayload: TestSessionResult = {
      id: `res-${Date.now()}`,
      type: 'mock_cbt',
      courseId: selectedCourseId,
      courseCode: selectedCourse?.code || 'GST101',
      courseTitle: selectedCourse?.title || 'General Studies',
      universityName: selectedUni?.abbreviation || 'UNILAG',
      score,
      totalQuestions: total,
      percentage,
      timeSpentSeconds: timeLimitMinutes * 60 - secondsRemaining,
      timeLimitMinutes,
      date: new Date().toISOString(),
      userAnswers,
      markedForReview,
      questionIds: examQuestions.map((q) => q.id),
    };

    onSaveResult(resultPayload);
    setLatestResult(resultPayload);
    setStep('result');
    setConfirmSubmitOpen(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // Answer Question
  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    const currentQ = examQuestions[currentIndex];
    if (!currentQ) return;

    if (!isPremium && questionsAttempted >= freeLimit) {
      setShowPaywallModal(true);
      onOpenSubscribe();
      return;
    }

    // Record question attempt for free trial
    if (!userAnswers[currentQ.id]) {
      onRecordQuestionAttempt();
    }

    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  // Clear Answer
  const handleClearAnswer = () => {
    const currentQ = examQuestions[currentIndex];
    if (!currentQ) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  // Toggle Mark for Review
  const handleToggleMark = () => {
    const currentQ = examQuestions[currentIndex];
    if (!currentQ) return;
    setMarkedForReview((prev) =>
      prev.includes(currentQ.id) ? prev.filter((id) => id !== currentQ.id) : [...prev, currentQ.id]
    );
  };

  // Calculator Helper
  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === '=') {
      try {
        setCalcDisplay(eval(calcDisplay.replace(/×/g, '*').replace(/÷/g, '/')).toString());
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
    }
  };

  // Format time display (MM:SS)
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeLow = secondsRemaining < 300; // < 5 mins

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" id="mock-cbt-container">
      
      {/* Top Header Controls: Back Arrow (Top Left) & Cancel X Button (Top Right) */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => {
            if (step !== 'config') {
              setStep('config');
            } else if (onNavigate) {
              onNavigate('dashboard');
            }
          }}
          className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
          id="mock-top-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>{step !== 'config' ? 'Back to Exam Setup' : 'Back to Dashboard'}</span>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="mock-top-cancel-btn"
          title="Cancel / Close Exam Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Paywall Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            
            {/* Top Header Navigation Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <button
                onClick={() => setShowPaywallModal(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span>Back</span>
              </button>

              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Trial Limit Reached
              </span>

              <button
                onClick={() => setShowPaywallModal(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-700 shadow-sm"
                title="Cancel / Close"
              >
                <span>Cancel</span>
                <X className="w-4 h-4 text-rose-400" />
              </button>
            </div>
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-white">Free Trial Completed</h3>
            <p className="text-amber-200 text-xs sm:text-sm mt-3 leading-relaxed font-medium bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
              Your free trial limit has been reached. Subscribe to Premium to continue practicing.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Questions Used: {questionsAttempted} / {freeLimit} • Questions Remaining: 0
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => { setShowPaywallModal(false); onOpenSubscribe(); }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="mockcbt-paywall-upgrade-btn"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowPaywallModal(false)}
                className="w-full py-2.5 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                id="mockcbt-paywall-close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Config Launcher */}
      {step === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mock CBT Exam Setup</h1>
              <p className="text-xs text-slate-400">Simulate official computer-based examination conditions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. University Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">1. Select University</label>
              <select
                value={selectedUniId}
                onChange={(e) => setSelectedUniId(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500"
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>

            {/* 2. Level Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">2. Select Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 font-medium"
              >
                {ACADEMIC_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            {/* 3. Semester Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">3. Select Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 font-medium"
              >
                {ACADEMIC_SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>

            {/* 4. Course Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">4. Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 font-medium"
                disabled={availableCourses.length === 0}
              >
                {availableCourses.length === 0 ? (
                  <option value="">No courses available for selected Level & Semester</option>
                ) : (
                  availableCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code}: {c.title}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Exam Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTimeLimitMinutes(m)}
                    className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      timeLimitMinutes === m
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {m} Mins
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Number of Questions</label>
              <select
                value={questionCount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'unlimited') {
                    setQuestionCount('unlimited');
                    if (!isPremium) {
                      setShowUnlimitedPremiumModal(true);
                    }
                  } else {
                    setQuestionCount(Number(val));
                  }
                }}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 font-medium"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Question' : 'Questions'}
                  </option>
                ))}
                <option value="unlimited" className="font-bold text-amber-400">
                  Unlimited Questions (Premium Only)
                </option>
              </select>
            </div>

          </div>

          <button
            onClick={handleStartExam}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            id="start-mock-exam-btn"
          >
            <BookOpen className="w-4 h-4" />
            Launch Timed CBT Exam
          </button>
        </div>
      )}

      {/* Step 2: Active Timed Exam Screen */}
      {step === 'active' && examQuestions[currentIndex] && (
        <div className="space-y-6" id="active-cbt-screen">
          
          {/* Authentic Top Candidate Header Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400 uppercase">Reg No: CBT/2026/{user.id.slice(-5)}</p>
              </div>
            </div>

            {/* Course Code Badge */}
            <div className="hidden sm:block text-center">
              <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                {courses.find((c) => c.id === selectedCourseId)?.code || 'GST101'}
              </span>
            </div>

            {/* Countdown Timer Badge */}
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-black font-mono shadow-md ${
              isTimeLow
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-950 text-emerald-400 border-slate-800'
            }`}>
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>

            {/* Calculator Toggle */}
            <button
              onClick={() => setCalculatorOpen(!calculatorOpen)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              id="cbt-calculator-toggle-btn"
            >
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Calc</span>
            </button>
          </div>

          {/* Calculator Floating Modal */}
          {calculatorOpen && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl w-64 animate-in slide-in-from-bottom-3">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">CBT Scientific Calculator</span>
                <button onClick={() => setCalculatorOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl text-right font-mono text-lg text-emerald-400 border border-slate-800 mb-3 truncate">
                {calcDisplay}
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {['7','8','9','÷','4','5','6','×','1','2','3','-','C','0','=','+'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleCalcClick(btn)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg active:scale-95"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Question & Navigation Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Question Area (3 Cols) */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Question {currentIndex + 1} of {examQuestions.length}
                </span>

                <button
                  onClick={handleToggleMark}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    markedForReview.includes(examQuestions[currentIndex].id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  id="cbt-mark-review-btn"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {markedForReview.includes(examQuestions[currentIndex].id) ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>

              <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {examQuestions[currentIndex].question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                  const optText = examQuestions[currentIndex][`option${optKey}` as keyof Question] as string;
                  const isSelected = userAnswers[examQuestions[currentIndex].id] === optKey;

                  return (
                    <button
                      key={optKey}
                      onClick={() => handleSelectOption(optKey)}
                      className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center space-x-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {optKey}
                      </span>
                      <span>{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>

                  <button
                    onClick={handleClearAnswer}
                    disabled={!userAnswers[examQuestions[currentIndex].id]}
                    className="px-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 text-xs rounded-xl border border-slate-800"
                  >
                    Clear Response
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {currentIndex < examQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmSubmitOpen(true)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      Submit Exam
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Question Grid Palette Side Column */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Question Palette
              </h3>

              {/* Grid Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500"></div>
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-slate-800"></div>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded border border-indigo-500"></div>
                  <span>Current</span>
                </div>
              </div>

              {/* Palette Buttons Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
                {examQuestions.map((q, idx) => {
                  const isAns = !!userAnswers[q.id];
                  const isMarked = markedForReview.includes(q.id);
                  const isCurr = currentIndex === idx;

                  let style = 'bg-slate-950 text-slate-400 border-slate-800';

                  if (isAns) {
                    style = 'bg-emerald-600 text-white font-bold border-emerald-500';
                  } else if (isMarked) {
                    style = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
                  }

                  if (isCurr) {
                    style += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 text-xs rounded-xl border flex items-center justify-center transition-all ${style}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setConfirmSubmitOpen(true)}
                className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 transition-colors mt-4"
                id="cbt-palette-submit-btn"
              >
                Finish & Submit Exam
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Empty Exam Questions Fallback Guard */}
      {step === 'active' && (!examQuestions[currentIndex] || examQuestions.length === 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Exam Questions Available</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            There are currently no active questions matching this course selection. Please choose a different course or adjust your filter.
          </p>
          <button
            onClick={() => setStep('config')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Back to Exam Setup
          </button>
        </div>
      )}

      {/* Confirmation Modal before Submit */}
      {showUnlimitedPremiumModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="cbt-unlimited-questions-modal">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <button
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (questionCount === 'unlimited') setQuestionCount(10);
                }}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Premium Access</span>
              </div>

              <button
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (questionCount === 'unlimited') setQuestionCount(10);
                }}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-700 shadow-sm"
                title="Cancel"
              >
                <span>Cancel</span>
                <X className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            <h3 className="text-lg font-extrabold text-amber-300 tracking-tight">
              Unlimited Questions Restricted
            </h3>

            <p className="text-slate-200 text-xs mt-2 font-medium leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              Unlimited Questions is available only for Premium subscribers. Upgrade to Premium to unlock unlimited practice.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (questionCount === 'unlimited') setQuestionCount(10);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (questionCount === 'unlimited') setQuestionCount(10);
                  onOpenSubscribe();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Upgrade to Premium</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Submit */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-center">
            
            {/* Top Header Navigation Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-700 shadow-sm"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span>Back</span>
              </button>

              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Exam Finalization
              </span>

              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-700 shadow-sm"
                title="Cancel / Close"
              >
                <span>Cancel</span>
                <X className="w-4 h-4 text-rose-400" />
              </button>
            </div>
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Confirm Exam Submission</h3>
            <p className="text-xs text-slate-300">
              You have answered {Object.keys(userAnswers).length} out of {examQuestions.length} questions. Are you sure you want to finalize your exam?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Return to Exam
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Exam Results View */}
      {step === 'result' && latestResult && (
        <CbtResultsView
          result={latestResult}
          questions={questions}
          onRetake={handleStartExam}
          onBackToDashboard={() => onNavigate('dashboard')}
        />
      )}

    </div>
  );
};
