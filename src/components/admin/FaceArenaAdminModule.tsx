import React, { useState, useEffect } from 'react';
import {
  FaceArenaSettings,
  FaceArenaQuestion,
  FaceArenaParticipant,
  FaceArenaArchive
} from '../../types';
import { StorageService, safeStringify } from '../../services/storage';
import {
  Trophy,
  Play,
  Pause,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Shuffle,
  Users,
  Clock,
  Settings,
  CheckCircle2,
  BarChart3,
  Search,
  FileSpreadsheet,
  RotateCcw,
  Archive,
  Save,
  HelpCircle,
  Sparkles,
  Award,
  FileText,
  Layers,
  Image,
  Calendar,
  Eye,
  Check,
  X
} from 'lucide-react';

export const FaceArenaAdminModule: React.FC = () => {
  // Storage State
  const [settings, setSettings] = useState<FaceArenaSettings>(() => StorageService.getFaceArenaSettings());
  const [questions, setQuestions] = useState<FaceArenaQuestion[]>(() => StorageService.getFaceArenaQuestions());
  const [participants, setParticipants] = useState<FaceArenaParticipant[]>(() => StorageService.getFaceArenaParticipants());
  const [archives, setArchives] = useState<FaceArenaArchive[]>(() => StorageService.getFaceArenaArchives());

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState<'control' | 'questions' | 'settings' | 'participants' | 'leaderboard' | 'weekly' | 'analytics'>('control');

  // Question Management Modals / Inputs
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<FaceArenaQuestion | null>(null);
  const [questionText, setQuestionText] = useState<string>('');
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [optionC, setOptionC] = useState<string>('');
  const [optionD, setOptionD] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [category, setCategory] = useState<string>('General CBT');

  // Search & Filter state for Participants & Questions
  const [participantSearch, setParticipantSearch] = useState<string>('');
  const [participantFilter, setParticipantFilter] = useState<string>('all');
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Weekly Challenge Control Form State
  const [newChallengeTitle, setNewChallengeTitle] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Smart AI Upload State
  const [isSmartUploadOpen, setIsSmartUploadOpen] = useState<boolean>(false);
  const [smartMode, setSmartMode] = useState<'generate_material' | 'format_existing'>('generate_material');
  const [smartCategory, setSmartCategory] = useState<string>('General CBT');
  const [smartRawText, setSmartRawText] = useState<string>('');
  const [smartFile, setSmartFile] = useState<File | null>(null);
  const [smartCount, setSmartCount] = useState<number>(10);
  const [isProcessingSmartUpload, setIsProcessingSmartUpload] = useState<boolean>(false);
  const [previewSmartQuestions, setPreviewSmartQuestions] = useState<FaceArenaQuestion[]>([]);
  const [isSmartPreviewStep, setIsSmartPreviewStep] = useState<boolean>(false);

  const showNotice = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Sync state changes from storage
  const syncFromStorage = () => {
    setSettings(StorageService.getFaceArenaSettings());
    setQuestions(StorageService.getFaceArenaQuestions());
    setParticipants(StorageService.getFaceArenaParticipants());
    setArchives(StorageService.getFaceArenaArchives());
  };

  useEffect(() => {
    syncFromStorage();
    window.addEventListener('cbt_storage_change', syncFromStorage);
    return () => window.removeEventListener('cbt_storage_change', syncFromStorage);
  }, []);

  // Save Settings Handler
  const handleSaveSettings = (updated: FaceArenaSettings) => {
    setSettings(updated);
    StorageService.saveFaceArenaSettings(updated);
    showNotice('Face Arena settings updated & synchronized in real-time.');
  };

  // Toggle Status (Enable / Disable / Lock / Reopen)
  const handleUpdateStatus = (status: 'open' | 'closed' | 'locked') => {
    const updated: FaceArenaSettings = {
      ...settings,
      status,
      updatedAt: new Date().toISOString(),
    };
    handleSaveSettings(updated);
  };

  // Add or Edit Question
  const handleSaveQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      alert('Please fill out all question fields and options.');
      return;
    }

    let updatedQuestions = [...questions];

    if (editingQuestion) {
      updatedQuestions = updatedQuestions.map((q) =>
        q.id === editingQuestion.id
          ? {
              ...q,
              question: questionText,
              optionA,
              optionB,
              optionC,
              optionD,
              correctAnswer,
              category,
            }
          : q
      );
    } else {
      const newQ: FaceArenaQuestion = {
        id: `faq-${Date.now()}`,
        question: questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        category,
      };
      updatedQuestions.unshift(newQ);
    }

    setQuestions(updatedQuestions);
    StorageService.saveFaceArenaQuestions(updatedQuestions);
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    resetQuestionForm();
    showNotice('Question saved successfully.');
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswer('A');
    setCategory('General CBT');
  };

  const handleOpenEditQuestion = (q: FaceArenaQuestion) => {
    setEditingQuestion(q);
    setQuestionText(q.question);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectAnswer(q.correctAnswer);
    setCategory(q.category || 'General CBT');
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const updated = questions.filter((q) => q.id !== qId);
    setQuestions(updated);
    StorageService.deleteFaceArenaQuestion(qId);
    showNotice('Question deleted.');
  };

  const handleShuffleQuestions = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    StorageService.saveFaceArenaQuestions(shuffled);
    showNotice('Questions shuffled randomly.');
  };

  // Export Questions JSON
  const handleExportQuestions = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(safeStringify(questions, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `face_arena_questions_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Questions JSON
  const handleImportQuestions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const merged = [...parsed, ...questions];
            setQuestions(merged);
            StorageService.saveFaceArenaQuestions(merged);
            showNotice(`Successfully imported ${parsed.length} questions.`);
          }
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
    }
  };

  // Handle Smart AI Upload Process
  const handleRunSmartUpload = async () => {
    if (!smartRawText.trim() && !smartFile) {
      alert('Please enter text content or upload a document file (PDF, DOCX, TXT).');
      return;
    }

    setIsProcessingSmartUpload(true);
    try {
      let fileDataStr = '';
      let mimeTypeStr = '';
      let fileNameStr = '';

      if (smartFile) {
        fileNameStr = smartFile.name;
        mimeTypeStr = smartFile.type || 'application/pdf';
        fileDataStr = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(smartFile);
        });
      }

      const response = await fetch('/api/ai/smart-upload-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: smartMode,
          rawText: smartRawText,
          fileData: fileDataStr,
          mimeType: mimeTypeStr,
          fileName: fileNameStr,
          category: smartCategory,
          questionCount: smartCount,
        }),
      });

      const resData = await response.json();
      if (!resData.success || !Array.isArray(resData.questions)) {
        throw new Error(resData.error || 'Failed to process document with AI.');
      }

      const formatted: FaceArenaQuestion[] = resData.questions.map((q: any, i: number) => ({
        id: `faq-ai-${Date.now()}-${i}`,
        question: q.question || 'Processed Question',
        optionA: q.optionA || 'Option A',
        optionB: q.optionB || 'Option B',
        optionC: q.optionC || 'Option C',
        optionD: q.optionD || 'Option D',
        correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer?.toUpperCase()) ? q.correctAnswer.toUpperCase() : 'A') as any,
        category: q.category || smartCategory,
      }));

      setPreviewSmartQuestions(formatted);
      setIsSmartPreviewStep(true);
      showNotice(`AI successfully processed ${formatted.length} questions. Please review below.`);
    } catch (err: any) {
      alert(`Smart Upload Error: ${err.message || 'Failed to process document.'}`);
    } finally {
      setIsProcessingSmartUpload(false);
    }
  };

  const handleConfirmImportSmartQuestions = () => {
    if (previewSmartQuestions.length === 0) return;
    const merged = [...previewSmartQuestions, ...questions];
    setQuestions(merged);
    StorageService.saveFaceArenaQuestions(merged);
    setIsSmartUploadOpen(false);
    setIsSmartPreviewStep(false);
    setPreviewSmartQuestions([]);
    setSmartRawText('');
    setSmartFile(null);
    showNotice(`Successfully added ${previewSmartQuestions.length} questions to Question Bank!`);
  };

  // Export Participant Records CSV
  const handleExportParticipantsCSV = () => {
    let csv = 'Full Name,WhatsApp Number,Date,Time Started,Time Submitted,Time Used (s),Score,Total Questions,Percentage (%),Passed\n';
    participants.forEach((p) => {
      csv += `"${p.fullName}","${p.whatsAppNumber}","${p.date}","${p.timeStarted}","${p.timeSubmitted || ''}",${p.timeUsedSeconds},${p.score},${p.totalQuestions},${p.percentage}%,${p.passed}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `face_arena_participants_${Date.now()}.csv`;
    a.click();
  };

  // Start New Weekly Challenge (Archive current & start fresh)
  const handleStartNewWeeklyChallenge = () => {
    if (!confirm('This will archive the current weekly challenge & leaderboard, and start a fresh weekly challenge. Proceed?')) {
      return;
    }
    const title = newChallengeTitle.trim() || `Face Arena - Week ${archives.length + 2} Challenge`;
    const newSettings = StorageService.startNewWeeklyChallenge(title);
    setSettings(newSettings);
    syncFromStorage();
    setNewChallengeTitle('');
    showNotice(`Started new challenge: ${title}`);
  };

  // Clear / Reset Leaderboard
  const handleResetLeaderboard = () => {
    if (!confirm('Are you sure you want to reset the current weekly leaderboard? This action cannot be undone.')) return;
    const filtered = participants.filter((p) => p.weeklyChallengeId !== settings.weeklyChallengeId);
    setParticipants(filtered);
    StorageService.saveFaceArenaParticipants(filtered);
    showNotice('Weekly leaderboard reset.');
  };

  // Filtered Participants List
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.whatsAppNumber.includes(participantSearch);

    if (participantFilter === 'completed') return matchesSearch && p.status === 'completed';
    if (participantFilter === 'passed') return matchesSearch && p.passed;
    if (participantFilter === 'failed') return matchesSearch && p.status === 'completed' && !p.passed;
    return matchesSearch;
  });

  // Calculate Analytics Metrics
  const completedParticipants = participants.filter(
    (p) => p.weeklyChallengeId === settings.weeklyChallengeId && p.status === 'completed'
  );

  const totalCount = completedParticipants.length;
  const scores = completedParticipants.map((p) => p.percentage);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const numberPassed = completedParticipants.filter((p) => p.passed).length;
  const numberFailed = totalCount - numberPassed;
  const completionRate = participants.length > 0 ? Math.round((totalCount / participants.length) * 100) : 100;

  return (
    <div className="space-y-6" id="face-arena-admin-module">
      
      {/* Top Banner Notice */}
      {notificationMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        </div>
      )}

      {/* Header & Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider border ${
                settings.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : settings.status === 'locked'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                Status: {settings.status.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {settings.weeklyTitle || 'Week 1 Challenge'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              🏆 Face Arena Control Panel
            </h1>
          </div>

          {/* Quick Action Status Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleUpdateStatus('open')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                settings.status === 'open'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Open Challenge
            </button>
            <button
              onClick={() => handleUpdateStatus('closed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                settings.status === 'closed'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              Close Challenge
            </button>
            <button
              onClick={() => handleUpdateStatus('locked')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                settings.status === 'locked'
                  ? 'bg-rose-600 text-white font-black shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Challenge
            </button>
          </div>
        </div>

        {/* Sub-Module Nav Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          {[
            { id: 'control', label: 'Overview & Status', icon: Trophy },
            { id: 'questions', label: `Question Bank (${questions.length})`, icon: HelpCircle },
            { id: 'settings', label: 'Quiz & Timer Settings', icon: Settings },
            { id: 'participants', label: `Participants (${participants.length})`, icon: Users },
            { id: 'leaderboard', label: 'Leaderboard Manager', icon: Award },
            { id: 'weekly', label: 'Weekly Control & Archive', icon: Archive },
            { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW & CONTROL ================= */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Weekly Challenge Overview
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Live Status</span>
                <span className={`text-base font-extrabold uppercase mt-1 block ${
                  settings.status === 'open' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {settings.status}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Timer Duration</span>
                <span className="text-base font-extrabold text-white mt-1 block">
                  {settings.timerDurationSeconds >= 60
                    ? `${Math.round(settings.timerDurationSeconds / 60)} Mins`
                    : `${settings.timerDurationSeconds} Secs`}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Questions</span>
                <span className="text-base font-extrabold text-white mt-1 block">
                  {settings.totalQuestionsCount} Questions
                </span>
              </div>
            </div>

            {/* Challenge Title & Description Edit Panel */}
            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Challenge Details
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Challenge Title</label>
                  <input
                    type="text"
                    value={settings.weeklyTitle || ''}
                    onChange={(e) => handleSaveSettings({ ...settings, weeklyTitle: e.target.value })}
                    placeholder="e.g. Face Arena - Week 1 Challenge"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description / Instructions</label>
                  <textarea
                    rows={2}
                    value={settings.description || ''}
                    onChange={(e) => handleSaveSettings({ ...settings, description: e.target.value })}
                    placeholder="Enter challenge description..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Quick Action Controls
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpdateStatus(settings.status === 'open' ? 'closed' : 'open')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {settings.status === 'open' ? 'Disable Challenge' : 'Enable Challenge'}
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
                >
                  Manage Question Bank
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
                >
                  View Participants
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Live Participation Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Total Participants</span>
                <span className="font-extrabold text-white">{participants.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Completed Quizzes</span>
                <span className="font-extrabold text-emerald-400">{completedParticipants.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Highest Score</span>
                <span className="font-extrabold text-amber-300">{highestScore}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUESTION MANAGEMENT ================= */}
      {activeTab === 'questions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Face Arena Question Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, edit, import, export, or AI-generate questions specifically for the Face Arena challenge.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsSmartUploadOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                id="face-arena-smart-upload-btn"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                Smart Upload (AI)
              </button>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  resetQuestionForm();
                  setIsQuestionModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                id="face-arena-add-q-btn"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
              <button
                onClick={handleShuffleQuestions}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-amber-400" />
                Shuffle
              </button>
              <button
                onClick={handleExportQuestions}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export JSON
              </button>
              <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4 text-indigo-400" />
                Import JSON
                <input type="file" accept=".json" onChange={handleImportQuestions} className="hidden" />
              </label>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              placeholder="Search questions by text or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Question List Table */}
          <div className="space-y-3">
            {questions
              .filter((q) => q.question.toLowerCase().includes(questionSearch.toLowerCase()))
              .map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                      {q.category && (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded">
                          {q.category}
                        </span>
                      )}
                      <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                        Answer: Option {q.correctAnswer}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {q.question}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <span>A: {q.optionA}</span>
                      <span>B: {q.optionB}</span>
                      <span>C: {q.optionC}</span>
                      <span>D: {q.optionD}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg border border-slate-700"
                      title="Edit Question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg border border-slate-700"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: SMART AI QUESTION UPLOAD ================= */}
      {isSmartUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Smart Question Upload (AI Assisted)</h3>
                  <p className="text-xs text-slate-400">Extract, clean, and format questions automatically using Gemini AI.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSmartUploadOpen(false);
                  setIsSmartPreviewStep(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isSmartPreviewStep ? (
              <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
                {/* Mode Selector */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Select Processing Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSmartMode('generate_material')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        smartMode === 'generate_material'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-sm text-indigo-300">Generate from Study Material</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        AI reads documents/notes and generates exam-standard multiple choice questions.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSmartMode('format_existing')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        smartMode === 'format_existing'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-sm text-amber-300">Format Existing Question Document</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        AI extracts raw questions from PDF/DOCX/TXT, fixes typos, verifies answer keys & removes duplicates.
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Category</label>
                    <input
                      type="text"
                      value={smartCategory}
                      onChange={(e) => setSmartCategory(e.target.value)}
                      placeholder="e.g. GST101 General Studies"
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Question Count</label>
                    <input
                      type="number"
                      value={smartCount}
                      onChange={(e) => setSmartCount(Math.max(1, parseInt(e.target.value) || 10))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* File Upload Box */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Upload Document File (PDF, DOCX, TXT, Image)</label>
                  <label className="p-4 bg-slate-950 border border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <FileText className="w-8 h-8 text-indigo-400 mb-1" />
                    <span className="text-xs font-bold text-white">
                      {smartFile ? smartFile.name : 'Click or drop PDF / Word document file here'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Supports PDF, DOCX, TXT, JPG, PNG (Max 10MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files && setSmartFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Raw Text Paste */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Or Paste Raw Text Material / Questions</label>
                  <textarea
                    rows={4}
                    value={smartRawText}
                    onChange={(e) => setSmartRawText(e.target.value)}
                    placeholder="Paste textbook notes, past questions, or raw text here..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSmartUploadOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingSmartUpload}
                    onClick={handleRunSmartUpload}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingSmartUpload ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Processing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Process & Extract Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* PREVIEW STEP */
              <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center justify-between">
                  <span>Found <strong>{previewSmartQuestions.length}</strong> clean questions ready for review.</span>
                  <button
                    onClick={() => setIsSmartPreviewStep(false)}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Re-upload / Change settings
                  </button>
                </div>

                <div className="space-y-3">
                  {previewSmartQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400">Q#{idx + 1} • {q.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                            Correct: Option {q.correctAnswer}
                          </span>
                          <button
                            onClick={() => {
                              setPreviewSmartQuestions((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-rose-400 hover:bg-slate-800 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPreviewSmartQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, question: val } : item))
                          );
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
                      />

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Option A:</span>
                          <input
                            type="text"
                            value={q.optionA}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewSmartQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, optionA: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Option B:</span>
                          <input
                            type="text"
                            value={q.optionB}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewSmartQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, optionB: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Option C:</span>
                          <input
                            type="text"
                            value={q.optionC}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewSmartQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, optionC: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block mb-0.5">Option D:</span>
                          <input
                            type="text"
                            value={q.optionD}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPreviewSmartQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, optionD: val } : item))
                              );
                            }}
                            className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSmartPreviewStep(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImportSmartQuestions}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Save to Question Bank
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT QUESTION ================= */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h3>

            <form onSubmit={handleSaveQuestionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Question Text</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the question text..."
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option A</label>
                  <input
                    type="text"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option B</label>
                  <input
                    type="text"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option C</label>
                  <input
                    type="text"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Option D</label>
                  <input
                    type="text"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correct Answer Option</label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. General CBT"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUIZ & TIMER SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Face Arena Timer & Quiz Configurations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
            {/* Timer Settings */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Timer Settings
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Quiz Duration Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '60 Secs', sec: 60 },
                    { label: '5 Mins', sec: 300 },
                    { label: '30 Mins', sec: 1800 },
                    { label: '1 Hour', sec: 3600 },
                  ].map((p) => (
                    <button
                      key={p.sec}
                      type="button"
                      onClick={() => handleSaveSettings({ ...settings, timerDurationSeconds: p.sec })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        settings.timerDurationSeconds === p.sec
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Custom Duration in Seconds</label>
                <input
                  type="number"
                  value={settings.timerDurationSeconds}
                  onChange={(e) =>
                    handleSaveSettings({ ...settings, timerDurationSeconds: Math.max(10, parseInt(e.target.value) || 60) })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            {/* Quiz Parameters */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Quiz Rules & Parameters
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Number of Questions</label>
                <input
                  type="number"
                  value={settings.totalQuestionsCount}
                  onChange={(e) =>
                    handleSaveSettings({ ...settings, totalQuestionsCount: Math.max(1, parseInt(e.target.value) || 10) })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Passing Score (%)</label>
                <input
                  type="number"
                  value={settings.passingScorePercentage}
                  onChange={(e) =>
                    handleSaveSettings({ ...settings, passingScorePercentage: Math.max(0, parseInt(e.target.value) || 50) })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'randomizeQuestions', label: 'Randomize Questions', desc: 'Shuffle order of questions for every participant' },
              { key: 'allowPreviousQuestion', label: 'Allow Previous Question', desc: 'Permit navigation back to earlier questions' },
              { key: 'autoSubmitOnTimeout', label: 'Auto Submit on Timeout', desc: 'Automatically submit test when timer hits zero' },
              { key: 'showResultsImmediately', label: 'Show Results Immediately', desc: 'Display total score and breakdown right after test' },
            ].map((t) => {
              const val = settings[t.key as keyof FaceArenaSettings] as boolean;

              return (
                <div key={t.key} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{t.label}</span>
                    <span className="text-[11px] text-slate-400">{t.desc}</span>
                  </div>
                  <button
                    onClick={() =>
                      handleSaveSettings({ ...settings, [t.key]: !val })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      val ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        val ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: PARTICIPANT MANAGEMENT ================= */}
      {activeTab === 'participants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Participant Records Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                View detailed logs of every student participant in the weekly challenge.
              </p>
            </div>

            <button
              onClick={handleExportParticipantsCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Participant Records (CSV)
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search participant name or WhatsApp number..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={participantFilter}
              onChange={(e) => setParticipantFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="all">All Participants</option>
              <option value="completed">Completed Quizzes</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">WhatsApp Number</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Time Used</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-bold text-white">{p.fullName}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{p.whatsAppNumber}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{p.score} / {p.totalQuestions}</td>
                    <td className="px-4 py-3 font-bold text-amber-300">{p.percentage}%</td>
                    <td className="px-4 py-3 font-mono">{p.timeUsedSeconds}s</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'completed'
                          ? p.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {p.timeSubmitted ? new Date(p.timeSubmitted).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: LEADERBOARD MANAGEMENT ================= */}
      {activeTab === 'leaderboard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Leaderboard Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect and reset current weekly rankings or clear records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetLeaderboard}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Leaderboard
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-white">Leaderboard Ranking Algorithm:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>1st Priority: Highest score and percentage (%)</li>
              <li>2nd Priority: Least time used (seconds)</li>
              <li>3rd Priority: Earliest submission date & time</li>
            </ul>
          </div>
        </div>
      )}

      {/* ================= TAB 6: WEEKLY CONTROL & ARCHIVE ================= */}
      {activeTab === 'weekly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-400" />
            Weekly Challenge Control & Archiving
          </h2>

          <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Start New Weekly Challenge
            </h3>
            <p className="text-xs text-slate-400">
              Starting a new weekly challenge will automatically archive the current weekly leaderboard and participant scores into history, and reset the competition canvas for a fresh week!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newChallengeTitle}
                onChange={(e) => setNewChallengeTitle(e.target.value)}
                placeholder="e.g. Face Arena - Week 2 Challenge"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
              <button
                onClick={handleStartNewWeeklyChallenge}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Start New Weekly Challenge
              </button>
            </div>
          </div>

          {/* Past Weekly Archives */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Past Archived Challenges ({archives.length})
            </h3>

            {archives.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                No past challenge archives recorded yet.
              </div>
            ) : (
              archives.map((arch) => (
                <div key={arch.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-extrabold text-white">{arch.weeklyTitle}</h4>
                    <span className="text-slate-500">
                      Archived: {new Date(arch.archivedAt).toLocaleDateString()} • {arch.totalParticipants} Participants
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-300 font-bold block">Top Score: {arch.highestScore}%</span>
                    <span className="text-slate-400 text-[11px]">Avg: {arch.averageScore}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 7: ANALYTICS DASHBOARD ================= */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Face Arena Analytics Dashboard
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Participants</span>
              <p className="text-3xl font-black text-white mt-1">{totalCount}</p>
            </div>

            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Highest Score</span>
              <p className="text-3xl font-black text-amber-300 mt-1">{highestScore}%</p>
            </div>

            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Score</span>
              <p className="text-3xl font-black text-indigo-300 mt-1">{averageScore}%</p>
            </div>

            <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Completion Rate</span>
              <p className="text-3xl font-black text-emerald-400 mt-1">{completionRate}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
              <span className="text-xs font-bold text-emerald-300 uppercase block">Passed Challenge</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{numberPassed}</p>
            </div>

            <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
              <span className="text-xs font-bold text-rose-300 uppercase block">Failed Challenge</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{numberFailed}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
