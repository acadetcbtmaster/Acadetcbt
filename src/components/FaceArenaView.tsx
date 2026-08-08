import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  FaceArenaSettings,
  FaceArenaQuestion,
  FaceArenaParticipant,
  FaceArenaArchive
} from '../types';
import { StorageService } from '../services/storage';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  Award,
  Sparkles,
  Phone,
  User,
  ShieldCheck,
  RotateCcw,
  Search,
  Lock,
  ListOrdered,
  BarChart3,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface FaceArenaViewProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

export const FaceArenaView: React.FC<FaceArenaViewProps> = ({ user, onNavigate }) => {
  // Storage state
  const [settings, setSettings] = useState<FaceArenaSettings>(() => StorageService.getFaceArenaSettings());
  const [questions, setQuestions] = useState<FaceArenaQuestion[]>(() => StorageService.getFaceArenaQuestions());
  const [participants, setParticipants] = useState<FaceArenaParticipant[]>(() => StorageService.getFaceArenaParticipants());
  const [archives, setArchives] = useState<FaceArenaArchive[]>(() => StorageService.getFaceArenaArchives());

  // Active view step inside Face Arena
  // 'closed' | 'register' | 'ready' | 'quiz' | 'result' | 'leaderboard'
  const [activeStep, setActiveStep] = useState<string>('register');

  // Registration Form State
  const [fullName, setFullName] = useState<string>(user.name || '');
  const [whatsAppNumber, setWhatsAppNumber] = useState<string>(user.phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Active Participant Session State
  const [currentParticipant, setCurrentParticipant] = useState<FaceArenaParticipant | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<FaceArenaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  
  // Quiz Timer State
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Leaderboard search filter
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>('');
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>('current');

  // Real-time synchronization with StorageService
  useEffect(() => {
    const syncFaceArenaData = () => {
      const s = StorageService.getFaceArenaSettings();
      setSettings(s);
      setQuestions(StorageService.getFaceArenaQuestions());
      const pList = StorageService.getFaceArenaParticipants();
      setParticipants(pList);
      setArchives(StorageService.getFaceArenaArchives());
    };

    syncFaceArenaData();
    window.addEventListener('cbt_storage_change', syncFaceArenaData);
    return () => window.removeEventListener('cbt_storage_change', syncFaceArenaData);
  }, []);

  // Determine initial step based on settings & participant history
  useEffect(() => {
    const freshSettings = StorageService.getFaceArenaSettings();
    const pList = StorageService.getFaceArenaParticipants();
    
    // Check if user already submitted this week's challenge
    const existing = pList.find(
      (p) => p.userId === user.id && p.weeklyChallengeId === freshSettings.weeklyChallengeId
    );

    if (existing) {
      setCurrentParticipant(existing);
      setUserAnswers(existing.answers || {});
      if (existing.status === 'completed') {
        setActiveStep('result');
        return;
      } else if (existing.status === 'in_progress') {
        // Resume quiz if already started
        setActiveStep('quiz');
        return;
      }
    }

    if (freshSettings.status !== 'open') {
      setActiveStep('closed');
    } else if (!existing) {
      setActiveStep('register');
    }
  }, [user.id, settings.weeklyChallengeId, settings.status]);

  // Setup active quiz questions when starting
  const prepareQuizQuestions = () => {
    let list = [...questions];
    if (list.length === 0) return [];
    
    if (settings.randomizeQuestions) {
      list = [...list].sort(() => Math.random() - 0.5);
    }
    
    const count = Math.min(settings.totalQuestionsCount || 10, list.length);
    return list.slice(0, count);
  };

  // Handle Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const trimmedName = fullName.trim();
    const trimmedPhone = whatsAppNumber.trim();

    if (!trimmedName) {
      setPhoneError('Please enter your full name.');
      return;
    }

    // Phone validation regex (at least 10 digits)
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setPhoneError('Please enter a valid WhatsApp phone number (minimum 10 digits).');
      return;
    }

    // Create or update participant registration
    const newParticipant: FaceArenaParticipant = {
      id: `part-${user.id}-${settings.weeklyChallengeId}`,
      weeklyChallengeId: settings.weeklyChallengeId,
      userId: user.id,
      fullName: trimmedName,
      whatsAppNumber: trimmedPhone,
      date: new Date().toISOString(),
      timeStarted: '',
      timeSubmitted: null,
      timeUsedSeconds: 0,
      questionsAttempted: 0,
      totalQuestions: settings.totalQuestionsCount,
      correctAnswers: 0,
      wrongAnswers: 0,
      score: 0,
      percentage: 0,
      passed: false,
      answers: {},
      status: 'registered',
    };

    setCurrentParticipant(newParticipant);
    StorageService.saveFaceArenaParticipant(newParticipant);
    setActiveStep('ready');
  };

  // Handle Click "Start Quiz"
  const handleStartQuiz = () => {
    const qList = prepareQuizQuestions();
    setActiveQuestions(qList);
    
    const startTime = new Date().toISOString();
    const duration = settings.timerDurationSeconds || 60;
    setTimeRemaining(duration);

    if (currentParticipant) {
      const updatedP: FaceArenaParticipant = {
        ...currentParticipant,
        timeStarted: startTime,
        status: 'in_progress',
        totalQuestions: qList.length,
      };
      setCurrentParticipant(updatedP);
      StorageService.saveFaceArenaParticipant(updatedP);
    }

    setActiveStep('quiz');
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (activeStep === 'quiz') {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeStep]);

  // Handle Option Selection
  const handleSelectOption = (questionIdx: number, option: 'A' | 'B' | 'C' | 'D') => {
    if (activeStep !== 'quiz') return;

    const newAnswers = { ...userAnswers, [questionIdx]: option };
    setUserAnswers(newAnswers);

    // Auto update participant draft in storage
    if (currentParticipant) {
      const updatedP: FaceArenaParticipant = {
        ...currentParticipant,
        answers: newAnswers,
        questionsAttempted: Object.keys(newAnswers).length,
      };
      setCurrentParticipant(updatedP);
      StorageService.saveFaceArenaParticipant(updatedP);
    }
  };

  // Submit Quiz Calculation
  const finalizeSubmission = (isTimeout = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const total = activeQuestions.length > 0 ? activeQuestions.length : (settings.totalQuestionsCount || 10);
    let correctCount = 0;
    
    activeQuestions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      if (selected && selected.toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount++;
      }
    });

    const attemptedCount = Object.keys(userAnswers).length;
    const wrongCount = attemptedCount - correctCount;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = percentage >= (settings.passingScorePercentage || 50);

    const durationTotal = settings.timerDurationSeconds || 60;
    const timeUsed = Math.max(0, durationTotal - timeRemaining);

    const submitTime = new Date().toISOString();

    if (currentParticipant) {
      const completedP: FaceArenaParticipant = {
        ...currentParticipant,
        timeSubmitted: submitTime,
        timeUsedSeconds: timeUsed,
        questionsAttempted: attemptedCount,
        totalQuestions: total,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        score: correctCount,
        percentage,
        passed,
        answers: userAnswers,
        status: 'completed',
      };

      setCurrentParticipant(completedP);
      StorageService.saveFaceArenaParticipant(completedP);
      setParticipants(StorageService.getFaceArenaParticipants());
    }

    setIsSubmitting(false);
    setActiveStep('result');
  };

  const handleAutoSubmitOnTimeout = () => {
    finalizeSubmission(true);
  };

  // Calculate position in current week's leaderboard
  const getParticipantPosition = (pId: string) => {
    const currentWeekParticipants = participants.filter(
      (p) => p.weeklyChallengeId === settings.weeklyChallengeId && p.status === 'completed'
    );

    // Sort: 1) Highest score/percentage, 2) Least time used, 3) Earliest submission
    const sorted = [...currentWeekParticipants].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (a.timeUsedSeconds !== b.timeUsedSeconds) return a.timeUsedSeconds - b.timeUsedSeconds;
      return new Date(a.timeSubmitted || 0).getTime() - new Date(b.timeSubmitted || 0).getTime();
    });

    const index = sorted.findIndex((p) => p.id === pId || p.userId === user.id);
    return index >= 0 ? index + 1 : sorted.length + 1;
  };

  // Format Timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered Leaderboard Data
  const getLeaderboardList = () => {
    let sourceList: FaceArenaParticipant[] = [];

    if (selectedArchiveId === 'current') {
      sourceList = participants.filter(
        (p) => p.weeklyChallengeId === settings.weeklyChallengeId && p.status === 'completed'
      );
    } else {
      const arch = archives.find((a) => a.id === selectedArchiveId);
      sourceList = arch ? arch.participants : [];
    }

    const sorted = [...sourceList].sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (a.timeUsedSeconds !== b.timeUsedSeconds) return a.timeUsedSeconds - b.timeUsedSeconds;
      return new Date(a.timeSubmitted || 0).getTime() - new Date(b.timeSubmitted || 0).getTime();
    });

    if (!leaderboardSearch.trim()) return sorted;

    return sorted.filter((p) =>
      p.fullName.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
      p.whatsAppNumber.includes(leaderboardSearch)
    );
  };

  const currentLeaderboard = getLeaderboardList();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6" id="face-arena-view-container">
      
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Back to Dashboard"
            id="face-arena-back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                {settings.weeklyTitle || 'Weekly Challenge'}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                settings.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {settings.status === 'open' ? 'Live Challenge' : 'Closed'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-1">
              🏆 Face Arena Weekly Quiz Challenge
            </h1>
          </div>
        </div>

        {/* View Switching Navigation Tabs */}
        <div className="flex items-center gap-2">
          {activeStep !== 'quiz' && (
            <button
              onClick={() => setActiveStep(settings.status === 'open' ? (currentParticipant?.status === 'completed' ? 'result' : 'register') : 'closed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeStep !== 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Challenge
            </button>
          )}
          {activeStep !== 'quiz' && (
            <button
              onClick={() => setActiveStep('leaderboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeStep === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              id="face-arena-leaderboard-tab-btn"
            >
              <Award className="w-3.5 h-3.5" />
              Leaderboard
            </button>
          )}
        </div>
      </div>

      {/* ================= STEP 1: CLOSED / LOCKED STATE ================= */}
      {activeStep === 'closed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden" id="face-arena-closed-screen">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-center mx-auto text-rose-400 shadow-xl">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <h2 className="text-2xl font-black text-white">
              Challenge Currently Closed
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              « The Face Arena Weekly Quiz Challenge is currently closed. Please check back when the next challenge opens. »
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveStep('leaderboard')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              View Past Leaderboards
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: REGISTRATION FORM ================= */}
      {activeStep === 'register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="face-arena-register-screen">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
                <Trophy className="w-7 h-7 text-amber-200" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Face Arena Weekly Quiz Challenge
              </h2>
              <p className="text-xs text-slate-400">
                Please confirm your registration details to enter this week's timed CBT competition.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80">
              {phoneError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{phoneError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chidiebere Emmanuel"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  WhatsApp Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  placeholder="e.g. 08012345678 or +2348012345678"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <span className="text-[11px] text-slate-500 block">
                  Required for official winner announcements and prize verification.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="face-arena-register-submit-btn"
                >
                  <Send className="w-4 h-4" />
                  Submit Registration
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Competition
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" />
                Timed CBT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: READY SCREEN ================= */}
      {activeStep === 'ready' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden" id="face-arena-ready-screen">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-3xl flex items-center justify-center mx-auto text-amber-300 shadow-xl animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Face Arena Weekly Quiz Challenge
            </h2>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-sm font-semibold leading-relaxed">
              « Get Ready! You are about to begin the weekly challenge. Once you start, the timer begins immediately. »
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto text-left text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Timer Duration</span>
              <span className="font-extrabold text-white text-sm">
                {settings.timerDurationSeconds >= 60
                  ? `${Math.round(settings.timerDurationSeconds / 60)} Mins`
                  : `${settings.timerDurationSeconds} Secs`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Questions</span>
              <span className="font-extrabold text-white text-sm">{settings.totalQuestionsCount || 10} Qs</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Passing Score</span>
              <span className="font-extrabold text-emerald-400 text-sm">{settings.passingScorePercentage || 50}%</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartQuiz}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
              id="face-arena-start-quiz-btn"
            >
              <Trophy className="w-5 h-5 text-amber-300" />
              Start Quiz Now
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: QUIZ INTERFACE ================= */}
      {activeStep === 'quiz' && activeQuestions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6" id="face-arena-quiz-interface">
          
          {/* Quiz Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl">
                Question {currentQuestionIndex + 1} of {activeQuestions.length}
              </span>
              <span className="text-xs text-slate-400">
                Attempted: {Object.keys(userAnswers).length} / {activeQuestions.length}
              </span>
            </div>

            {/* Timer Badge */}
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-mono font-extrabold text-sm transition-all ${
              timeRemaining <= 10
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : timeRemaining <= 30
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              <Clock className="w-4 h-4" />
              <span>Timer: {formatTimer(timeRemaining)}</span>
            </div>

            <button
              onClick={() => finalizeSubmission(false)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              id="face-arena-quiz-submit-btn"
            >
              Submit Challenge
            </button>
          </div>

          {/* Current Question Display */}
          {activeQuestions[currentQuestionIndex] && (
            <div className="space-y-6 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
              <div className="space-y-2">
                {activeQuestions[currentQuestionIndex].category && (
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {activeQuestions[currentQuestionIndex].category}
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQuestionIndex + 1}. {activeQuestions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* 4 Answer Options */}
              <div className="grid grid-cols-1 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optionKey = `option${opt}` as keyof FaceArenaQuestion;
                  const optionText = activeQuestions[currentQuestionIndex][optionKey];
                  const isSelected = userAnswers[currentQuestionIndex] === opt;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(currentQuestionIndex, opt)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {opt}
                        </span>
                        <span className="text-xs sm:text-sm font-medium">{optionText}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Palette & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              {settings.allowPreviousQuestion && (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === activeQuestions.length - 1}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Palette Circles */}
            <div className="flex flex-wrap items-center gap-1.5 max-w-xs justify-end">
              {activeQuestions.map((_, qIdx) => {
                const isAnswered = userAnswers[qIdx] !== undefined;
                const isCurrent = qIdx === currentQuestionIndex;

                return (
                  <button
                    key={qIdx}
                    onClick={() => setCurrentQuestionIndex(qIdx)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold border transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 5: RESULT PAGE ================= */}
      {activeStep === 'result' && currentParticipant && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6" id="face-arena-result-screen">
          
          <div className="text-center space-y-3">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl ${
              currentParticipant.passed ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-amber-500 shadow-amber-500/30'
            }`}>
              {currentParticipant.passed ? <Trophy className="w-8 h-8 text-amber-200" /> : <Award className="w-8 h-8 text-white" />}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Quiz Challenge Results
            </h2>
            <p className="text-xs text-slate-400">
              Participant: <strong className="text-white">{currentParticipant.fullName}</strong> ({currentParticipant.whatsAppNumber})
            </p>
          </div>

          {/* Results Summary Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Score / Percentage</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {currentParticipant.score} / {currentParticipant.totalQuestions}
              </p>
              <span className="text-xs font-bold text-emerald-300">{currentParticipant.percentage}%</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Questions Attempted</span>
              <p className="text-2xl font-black text-white mt-1">
                {currentParticipant.questionsAttempted}
              </p>
              <span className="text-xs text-slate-400">Out of {currentParticipant.totalQuestions}</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Correct / Wrong</span>
              <p className="text-2xl font-black text-indigo-300 mt-1">
                {currentParticipant.correctAnswers} <span className="text-slate-500 text-base font-medium">/ {currentParticipant.wrongAnswers}</span>
              </p>
              <span className="text-xs text-slate-400">Correct answers</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Completion Time</span>
              <p className="text-2xl font-black text-amber-300 mt-1">
                {currentParticipant.timeUsedSeconds}s
              </p>
              <span className="text-xs text-slate-400">Time spent</span>
            </div>
          </div>

          {/* Leaderboard Position Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-950 to-indigo-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase block">Weekly Leaderboard Position</span>
                <span className="text-sm font-extrabold text-white">
                  Rank #{getParticipantPosition(currentParticipant.id)} on the official leaderboard
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveStep('leaderboard')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              View Full Leaderboard
            </button>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 6: LEADERBOARD VIEW ================= */}
      {activeStep === 'leaderboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6" id="face-arena-leaderboard-screen">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Face Arena Challenge Leaderboard
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rankings sorted by highest score, least time used, and earliest submission.
              </p>
            </div>

            {/* Archive / Current Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedArchiveId}
                onChange={(e) => setSelectedArchiveId(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              >
                <option value="current">Current Challenge ({settings.weeklyTitle || 'Week 1'})</option>
                {archives.map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    {arch.weeklyTitle} (Archived {new Date(arch.archivedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={leaderboardSearch}
              onChange={(e) => setLeaderboardSearch(e.target.value)}
              placeholder="Search participant by name or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Leaderboard Table */}
          {currentLeaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              No participant records found for this weekly challenge yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Participant Name</th>
                    <th className="px-4 py-3">WhatsApp Number</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Percentage</th>
                    <th className="px-4 py-3">Time Used</th>
                    <th className="px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {currentLeaderboard.map((p, idx) => {
                    const rank = idx + 1;
                    const isCurrentUser = p.userId === user.id;

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isCurrentUser
                            ? 'bg-indigo-600/20 font-bold text-white border-l-4 border-indigo-500'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          {rank === 1 ? (
                            <span className="px-2 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 w-fit shadow-md">
                              🏆 1st
                            </span>
                          ) : rank === 2 ? (
                            <span className="px-2 py-1 bg-slate-300 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 w-fit">
                              🥈 2nd
                            </span>
                          ) : rank === 3 ? (
                            <span className="px-2 py-1 bg-amber-700 text-amber-100 font-black rounded-lg text-[10px] flex items-center gap-1 w-fit">
                              🥉 3rd
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 font-bold">#{rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          {p.fullName} {isCurrentUser && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded ml-1">(You)</span>}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono">
                          {p.whatsAppNumber}
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-emerald-400">
                          {p.score} / {p.totalQuestions}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-amber-300">
                          {p.percentage}%
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 font-mono">
                          {p.timeUsedSeconds}s
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {p.timeSubmitted ? new Date(p.timeSubmitted).toLocaleTimeString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
