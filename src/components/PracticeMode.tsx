import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, Question, University, Faculty, Department, Course, Topic, TestSessionResult, SEED_QUESTIONS } from '../types';
import { selectRandomQuestions, shuffleArray } from '../utils/questionRandomizer';
import { safeStringify } from '../services/storage';
import { ApiClient } from '../services/apiClient';
import {
  ACADEMIC_LEVELS,
  ACADEMIC_SEMESTERS,
  getFacultiesForUniversity,
  getDepartmentsForFaculty,
  getCoursesForHierarchy,
  normalizeLevel,
  normalizeSemester,
  formatAcademicBreadcrumb,
} from '../utils/academicStructure';
import { AcademicHierarchySelector, AcademicHierarchyValues } from './common/AcademicHierarchySelector';
import { CbtResultsView } from './CbtResultsView';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
  Sliders,
  Crown,
  ArrowLeft,
  X,
  Clock,
  Calculator,
  Grid,
  BarChart2,
  HelpCircle,
  AlertTriangle,
  Building2,
  Layers,
  GraduationCap,
  Calendar,
} from 'lucide-react';

interface PracticeModeProps {
  user: UserProfile;
  questions: Question[];
  universities: University[];
  faculties?: Faculty[];
  departments?: Department[];
  courses: Course[];
  topics: Topic[];
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenSubscribe: () => void;
  onRecordQuestionAttempt: () => void;
  onNavigate?: (tab: string) => void;
  onSaveResult?: (result: TestSessionResult) => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  user,
  questions,
  universities,
  faculties = [],
  departments = [],
  courses,
  topics,
  onUpdateUser,
  onOpenSubscribe,
  onRecordQuestionAttempt,
  onNavigate,
  onSaveResult,
}) => {
  // Step: 'config' | 'active' | 'completed'
  const [step, setStep] = useState<'config' | 'active' | 'completed'>('config');

  // Academic Hierarchy Flow: University -> Faculty -> Department -> Level -> Semester -> Course
  const initialUniId = universities[0]?.id || 'uni-ful';
  const initialFaculties = getFacultiesForUniversity(initialUniId, faculties);
  const initialFacultyId = initialFaculties[0]?.id || '';
  const initialDepts = getDepartmentsForFaculty(initialFacultyId, initialUniId, departments, initialFaculties);
  const initialDeptId = initialDepts[0]?.id || '';

  const [hierarchyValues, setHierarchyValues] = useState<AcademicHierarchyValues>({
    universityId: initialUniId,
    facultyId: initialFacultyId,
    departmentId: initialDeptId,
    level: '100 Level',
    semester: 'First Semester',
    courseId: courses[0]?.id || '',
  });

  const selectedUniId = hierarchyValues.universityId;
  const selectedFacultyId = hierarchyValues.facultyId;
  const selectedDeptId = hierarchyValues.departmentId;
  const selectedLevel = hierarchyValues.level;
  const selectedSemester = hierarchyValues.semester;
  const selectedCourseId = hierarchyValues.courseId;

  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [questionLimit, setQuestionLimit] = useState<number | 'unlimited'>(10);

  // Engine mode: 'interactive' (Instant feedback & live stats) or 'cbt_simulated' (CBT practice exam simulation)
  const [practiceEngineMode, setPracticeEngineMode] = useState<'interactive' | 'cbt_simulated'>('interactive');
  const [isTimed, setIsTimed] = useState<boolean>(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  // Active session state
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [loadingAiExp, setLoadingAiExp] = useState<boolean>(false);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [showUnlimitedPremiumModal, setShowUnlimitedPremiumModal] = useState<boolean>(false);

  // CBT Practice Engine state
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false);
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState<boolean>(false);

  // Completed result storage for Mock CBT analysis
  const [latestResult, setLatestResult] = useState<TestSessionResult | null>(null);

  // Resolve courses using strict hierarchy
  const availableCourses = useMemo(() => {
    return getCoursesForHierarchy({
      universityId: selectedUniId,
      facultyId: selectedFacultyId,
      departmentId: selectedDeptId,
      level: selectedLevel,
      semester: selectedSemester,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: true,
    });
  }, [selectedUniId, selectedFacultyId, selectedDeptId, selectedLevel, selectedSemester, courses, universities]);

  React.useEffect(() => {
    if (availableCourses.length > 0) {
      if (!availableCourses.some((c) => c.id === selectedCourseId)) {
        setHierarchyValues((prev) => ({ ...prev, courseId: availableCourses[0].id }));
      }
    } else {
      setHierarchyValues((prev) => ({ ...prev, courseId: '' }));
    }
  }, [availableCourses, selectedCourseId]);

  const availableTopics = topics.filter((t) => t.courseId === selectedCourseId);

  const isPremium = user?.subscription?.isPremium ?? false;
  const questionsAttempted = user?.subscription?.questionsAttemptedCount ?? 0;
  const freeLimit = user?.subscription?.freeLimit ?? 30;

  // Timer effect if timed practice mode is enabled
  useEffect(() => {
    if (step !== 'active' || !isTimed) return;

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
  }, [step, isTimed]);

  // Auto finish when timer hits 0
  useEffect(() => {
    if (step === 'active' && isTimed && secondsRemaining <= 0 && activeQuestions.length > 0) {
      handleFinishPractice();
    }
  }, [secondsRemaining, step, isTimed, activeQuestions.length]);

  // Start Practice Session
  const handleStartPractice = async () => {
    const isUnlimited = questionLimit === 'unlimited';

    // Backend / Client Verification
    try {
      await ApiClient.validatePracticeSession({
        userId: user?.id || 'anonymous',
        requestedLimit: questionLimit,
        isPremium: isPremium,
        userRole: user?.role || 'student',
      });
    } catch (e) {
      console.warn('Practice session verification fallback:', e);
    }

    const targetCount = isUnlimited ? 'unlimited' : Number(questionLimit) || 10;

    const { selected } = selectRandomQuestions(
      questions,
      selectedCourseId || 'all',
      selectedTopicId,
      selectedDifficulty,
      targetCount,
      user?.seenQuestionIds || []
    );

    let finalQuestions = selected;
    if (!finalQuestions || finalQuestions.length === 0) {
      const fallback = selectRandomQuestions(questions, 'all', 'all', 'all', targetCount, []);
      finalQuestions = fallback.selected.length > 0 ? fallback.selected : SEED_QUESTIONS.slice(0, typeof targetCount === 'number' ? targetCount : 10);
    }

    // Always shuffle questions each time a user starts practice/CBT mode
    const shuffledQuestions = shuffleArray(finalQuestions);

    setActiveQuestions(shuffledQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setMarkedForReview([]);
    setAiExplanations({});
    setSessionStartTime(Date.now());
    setSecondsRemaining(Math.max(1, timeLimitMinutes) * 60);
    setShowPalette(false);
    setCalculatorOpen(false);
    setConfirmFinishOpen(false);
    setStep('active');
  };

  const currentQ = activeQuestions[currentIndex];
  const selectedAns = currentQ ? userAnswers[currentQ.id] : undefined;
  const isBookmarked = currentQ ? (user?.bookmarks || []).includes(currentQ.id) : false;

  // Answer Question
  const handleSelectAnswer = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQ) return;

    if (!isPremium && questionsAttempted >= freeLimit) {
      setShowPaywallModal(true);
      onOpenSubscribe();
      return;
    }

    if (!userAnswers[currentQ.id]) {
      onRecordQuestionAttempt();
    }

    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  // Clear Answer Response
  const handleClearAnswer = () => {
    if (!currentQ) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  // Toggle Bookmark
  const handleToggleBookmark = () => {
    if (!currentQ) return;
    const exists = user.bookmarks.includes(currentQ.id);
    const updatedBookmarks = exists
      ? user.bookmarks.filter((id) => id !== currentQ.id)
      : [...user.bookmarks, currentQ.id];

    onUpdateUser({ ...user, bookmarks: updatedBookmarks });
  };

  // Toggle Mark for Review
  const handleToggleMarkReview = () => {
    if (!currentQ) return;
    setMarkedForReview((prev) =>
      prev.includes(currentQ.id) ? prev.filter((id) => id !== currentQ.id) : [...prev, currentQ.id]
    );
  };

  // Fetch SMART Detailed Explanation from Server / Gemini Client
  const handleFetchAiExplanation = async () => {
    if (!currentQ) return;
    setLoadingAiExp(true);
    try {
      const data = await ApiClient.explainQuestion({
        question: currentQ.question,
        optionA: currentQ.optionA,
        optionB: currentQ.optionB,
        optionC: currentQ.optionC,
        optionD: currentQ.optionD,
        correctAnswer: currentQ.correctAnswer,
        userAnswer: selectedAns,
      });
      if (data.explanation) {
        setAiExplanations((prev) => ({ ...prev, [currentQ.id]: data.explanation }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAiExp(false);
    }
  };

  // Calculate live practice score stats
  let correctCount = 0;
  let incorrectCount = 0;
  let answeredCount = 0;

  activeQuestions.forEach((q) => {
    const ans = userAnswers[q.id];
    if (ans) {
      answeredCount++;
      if (ans === q.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }
  });

  const unansweredCount = activeQuestions.length - answeredCount;
  const liveAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Complete & Submit Practice Session with Mock CBT Diagnostic Analysis
  const handleFinishPractice = () => {
    const total = activeQuestions.length;
    const percentage = Math.round((correctCount / Math.max(1, total)) * 100);
    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const selectedUni = universities.find((u) => u.id === selectedUniId);
    const timeSpentSeconds = sessionStartTime
      ? Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000))
      : 120;

    const resultPayload: TestSessionResult = {
      id: `res-prac-${Date.now()}`,
      type: 'practice',
      courseId: selectedCourseId,
      courseCode: selectedCourse?.code || 'GST101',
      courseTitle: selectedCourse?.title || 'General Studies',
      universityName: selectedUni?.abbreviation || selectedUni?.name || 'UNILAG',
      score: correctCount,
      totalQuestions: total,
      percentage,
      timeSpentSeconds,
      timeLimitMinutes: isTimed ? timeLimitMinutes : undefined,
      date: new Date().toISOString(),
      userAnswers,
      markedForReview,
      questionIds: activeQuestions.map((q) => q.id),
    };

    if (onSaveResult) {
      onSaveResult(resultPayload);
    }

    setLatestResult(resultPayload);
    setStep('completed');
    setConfirmFinishOpen(false);

    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch {}
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

  // Format timer
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimeLow = isTimed && secondsRemaining < 300;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" id="practice-mode-container">
      
      {/* Top Header Navigation: Back Arrow & Cancel Button */}
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
          id="practice-top-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>{step !== 'config' ? 'Back to Setup' : 'Back to Dashboard'}</span>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
          id="practice-top-cancel-btn"
          title="Cancel / Close Interface"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Free Trial Ended Paywall Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Crown className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              Free Trial Limit Reached
            </span>

            <h3 className="text-2xl font-extrabold text-white mt-3">Free Trial Completed</h3>

            <p className="text-amber-200 text-xs sm:text-sm mt-3 leading-relaxed font-medium bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
              Your free trial limit has been reached. Subscribe to Premium to continue practicing.
            </p>

            <p className="text-slate-400 text-xs mt-2">
              Questions Used: {questionsAttempted} / {freeLimit} • Questions Remaining: 0
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setShowPaywallModal(false);
                  onOpenSubscribe();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="paywall-subscribe-now-btn"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowPaywallModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                id="paywall-maybe-later-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlimited Questions Premium Feature Modal */}
      {showUnlimitedPremiumModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" id="unlimited-questions-modal">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <button
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (questionLimit === 'unlimited') setQuestionLimit(10);
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
                  if (questionLimit === 'unlimited') setQuestionLimit(10);
                }}
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-700 shadow-sm"
                id="unlimited-modal-close-btn"
                title="Cancel / Close"
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

            <div className="mt-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Upgrade your account to enjoy:
              </p>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Practice Questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Mock CBT Practice Engines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SMART Diagnostic Correct & Wrong Analysis</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (onOpenSubscribe) onOpenSubscribe();
                  if (onNavigate) onNavigate('payments');
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="unlimited-upgrade-premium-btn"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                Upgrade to Premium
              </button>

              <button
                onClick={() => {
                  setShowUnlimitedPremiumModal(false);
                  if (questionLimit === 'unlimited') setQuestionLimit(10);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                id="unlimited-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Configuration Screen */}
      {step === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('dashboard');
                }
              }}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
              id="practice-top-back-btn"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>Back to Dashboard</span>
            </button>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('dashboard');
                }
              }}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer shadow-sm"
              id="practice-top-cancel-btn"
              title="Cancel / Close Practice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Practice Mode & CBT Practice Engine</h1>
              <p className="text-xs text-slate-400">Configure parameters and practice mode analysis engine.</p>
            </div>
          </div>

          {/* Practice Mode Engine Mode Selection */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Practice Engine Feature Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPracticeEngineMode('interactive')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  practiceEngineMode === 'interactive'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Interactive Step-by-Step Practice</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Instant right/wrong answer check with immediate educational explanations after each question.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPracticeEngineMode('cbt_simulated')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  practiceEngineMode === 'cbt_simulated'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Mock CBT Practice Engine</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Full exam-simulated engine with live answer status tracker, question palette, and comprehensive CBT diagnostic analysis upon submission.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Academic Hierarchy 6-Step Cascading Flow */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <AcademicHierarchySelector
              universities={universities}
              faculties={faculties}
              departments={departments}
              courses={courses}
              values={hierarchyValues}
              onChange={(newVals) => {
                setHierarchyValues(newVals);
                setSelectedTopicId('all');
              }}
              layout="grid-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Topic Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic Focus</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Topics in Course</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500"
              >
                <option value="all">All Difficulty Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Number of Questions Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" id="number-of-questions-label">
                Number of Questions
              </label>
              <select
                id="number-of-questions-select"
                value={questionLimit}
                onChange={(e) => {
                  const val = e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value, 10);
                  setQuestionLimit(val);
                  if (val === 'unlimited' && !isPremium) {
                    setShowUnlimitedPremiumModal(true);
                  }
                }}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-indigo-500 font-semibold cursor-pointer"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Question' : 'Questions'}
                  </option>
                ))}
                <option value="unlimited" className="font-bold text-amber-400 bg-slate-900">
                  Unlimited Questions
                </option>
              </select>
            </div>

            {/* Timer Option Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Practice Timer</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTimed}
                    onChange={(e) => setIsTimed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {isTimed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={timeLimitMinutes || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTimeLimitMinutes(isNaN(val) ? 1 : Math.max(1, Math.min(300, val)));
                      }}
                      className="w-24 p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white text-center focus:border-indigo-500 focus:outline-none"
                      placeholder="Minutes"
                    />
                    <span className="text-xs text-slate-300 font-semibold">Minutes (Custom Editable)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 30, 45, 60, 90, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTimeLimitMinutes(m)}
                        className={`py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          timeLimitMinutes === m
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  Untimed practice — learn at your own comfortable pace.
                </p>
              )}
            </div>

          </div>

          <button
            onClick={handleStartPractice}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="start-practice-session-btn"
          >
            <BookOpen className="w-4 h-4" />
            Launch Practice Engine Session
          </button>
        </div>
      )}

      {/* Step 2: Active Practice Session View */}
      {step === 'active' && currentQ && (
        <div className="space-y-6">
          
          {/* Header Bar with Live Practice Performance Analysis Engine */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  Q {currentIndex + 1} of {activeQuestions.length}
                </span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  {courses.find((c) => c.id === selectedCourseId)?.code || 'GST101'} • {currentQ.topicName || 'General Practice'}
                </span>
              </div>

              {/* Live Timer or Time Spent */}
              {isTimed ? (
                <div className={`px-3 py-1 rounded-lg border text-xs font-black font-mono flex items-center gap-1.5 ${
                  isTimeLow ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' : 'bg-slate-950 text-emerald-400 border-slate-800'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-mono hidden sm:block">
                  Untimed Practice
                </div>
              )}

              <div className="flex items-center space-x-2">
                {/* Calculator Toggle */}
                <button
                  onClick={() => setCalculatorOpen(!calculatorOpen)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  title="Scientific Calculator"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Calc</span>
                </button>

                {/* Palette Jumper Toggle */}
                <button
                  onClick={() => setShowPalette(!showPalette)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                    showPalette
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Question Jumper Palette"
                >
                  <Grid className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Palette</span>
                </button>

                {/* Bookmark Toggle */}
                <button
                  onClick={handleToggleBookmark}
                  className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  id="bookmark-question-btn"
                >
                  {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={() => setConfirmFinishOpen(true)}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 cursor-pointer"
                >
                  Exit Practice
                </button>
              </div>
            </div>

            {/* LIVE PRACTICE ENGINE CORRECT vs WRONG ANALYSIS BAR */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-extrabold text-emerald-400">{correctCount}</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Correct</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-extrabold text-rose-400">{incorrectCount}</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Wrong</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-300">{unansweredCount}</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Left</span>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-black text-indigo-400">{liveAccuracy}%</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">Accuracy</span>
              </div>
            </div>
          </div>

          {/* Calculator Drawer */}
          {calculatorOpen && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl w-64 animate-in slide-in-from-bottom-3">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">CBT Practice Scientific Calculator</span>
                <button onClick={() => setCalculatorOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
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
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg active:scale-95 cursor-pointer"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Palette Grid Jumper Drawer */}
          {showPalette && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-400" />
                  <span>CBT Question Jumper Palette</span>
                </h3>
                <button onClick={() => setShowPalette(false)} className="text-slate-400 hover:text-white text-xs">
                  Close ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Correct</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> Wrong</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"></span> Review</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-800"></span> Unattempted</span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-1">
                {activeQuestions.map((q, idx) => {
                  const ans = userAnswers[q.id];
                  const isMarked = markedForReview.includes(q.id);
                  const isCurr = currentIndex === idx;

                  let style = 'bg-slate-950 text-slate-400 border-slate-800';

                  if (ans) {
                    if (ans === q.correctAnswer) {
                      style = 'bg-emerald-600 text-white font-bold border-emerald-500';
                    } else {
                      style = 'bg-rose-600 text-white font-bold border-rose-500';
                    }
                  } else if (isMarked) {
                    style = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
                  }

                  if (isCurr) {
                    style += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPalette(false);
                      }}
                      className={`h-9 text-xs rounded-xl border flex items-center justify-center transition-all cursor-pointer ${style}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
            ></div>
          </div>

          {/* Main Question Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex items-start justify-between gap-4">
              <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQ.question}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleToggleMarkReview}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    markedForReview.includes(currentQ.id)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {markedForReview.includes(currentQ.id) ? 'Review Flagged' : 'Flag'}
                </button>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {currentQ.difficulty}
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                const optText = currentQ[`option${optKey}` as keyof Question] as string;
                const isSelected = selectedAns === optKey;

                const btnStyle = isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-bold shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-800/50';

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectAnswer(optKey)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {optKey}
                      </span>
                      <span>{optText}</span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {practiceEngineMode === 'cbt_simulated' && userAnswers[currentQ.id] && (
                  <button
                    onClick={handleClearAnswer}
                    className="px-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-xl border border-slate-800 cursor-pointer"
                  >
                    Clear Answer
                  </button>
                )}
              </div>

              {currentIndex < activeQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinishPractice}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Finish & View Analysis
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Empty Questions Fallback Guard */}
      {step === 'active' && (!currentQ || activeQuestions.length === 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Questions Available</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            There are currently no active questions matching this course selection. Please choose a different course or adjust your filter.
          </p>
          <button
            onClick={() => setStep('config')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Back to Setup
          </button>
        </div>
      )}

      {/* Confirmation Modal before Exit / Submit */}
      {confirmFinishOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Exit Practice Session?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have answered {answeredCount} out of {activeQuestions.length} practice questions. Would you like to finalize and view your full diagnostic CBT performance analysis now?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmFinishOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Continue Practice
              </button>
              <button
                onClick={handleFinishPractice}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                View Full Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Practice Completed — Full CBT Practice Engine Diagnostic Results View */}
      {step === 'completed' && (
        <div className="space-y-6">
          {latestResult ? (
            <CbtResultsView
              result={latestResult}
              questions={questions}
              onRetake={handleStartPractice}
              onBackToDashboard={() => {
                setStep('config');
                if (onNavigate) onNavigate('dashboard');
              }}
              onNavigate={onNavigate}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Practice Completed!</h2>
                <p className="text-xs text-slate-400 mt-1">Great job completing your practice session.</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-around">
                <div>
                  <p className="text-2xl font-extrabold text-indigo-400">{correctCount}/{activeQuestions.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Correct Answers</p>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div>
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {Math.round((correctCount / Math.max(1, activeQuestions.length)) * 100)}%
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">Accuracy</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('config')}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Practice Again
                </button>
                <button
                  onClick={() => setStep('config')}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Back to Setup
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
