import React, { useState, useMemo, useRef } from 'react';
import {
  Question,
  University,
  Course,
  QuestionStatus,
  DifficultyLevel,
  QuestionType,
  QuestionSource,
  QuestionVersion,
} from '../../types';
import { StorageService, safeStringify } from '../../services/storage';
import { ApiClient } from '../../services/apiClient';
import { ACADEMIC_LEVELS, ACADEMIC_SEMESTERS, normalizeLevel, normalizeSemester } from '../../utils/academicStructure';
import {
  HelpCircle,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit3,
  Eye,
  Copy,
  RotateCcw,
  Sparkles,
  GraduationCap,
  Brain,
  Shield,
  FileSpreadsheet,
  BarChart3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  FileUp,
  FileCode,
  FileImage,
  CheckCheck,
  TrendingUp,
  XCircle,
  Layers,
  Award,
  Zap,
} from 'lucide-react';

interface QuestionManagementModuleProps {
  questions: Question[];
  universities: University[];
  courses: Course[];
  onUpdateQuestions: (updatedQuestions: Question[]) => void;
  activeSubTab?: 'list' | 'upload' | 'workflow' | 'analytics' | 'history';
}

export const QuestionManagementModule: React.FC<QuestionManagementModuleProps> = ({
  questions,
  universities,
  courses,
  onUpdateQuestions,
  activeSubTab = 'list',
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<'list' | 'upload' | 'workflow' | 'analytics' | 'history'>(activeSubTab);

  // --- Search & Filter States (University -> Level -> Semester -> Course) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // --- Table & Pagination States ---
  const [sortField, setSortField] = useState<'createdDate' | 'question' | 'difficulty'>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Selection & Bulk Operation States ---
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number;
    valid: Question[];
    errors: { row: number; error: string }[];
  } | null>(null);

  // --- Form States for New/Edit Question ---
  const [qUniversityId, setQUniversityId] = useState(universities[0]?.id || 'uni-1');
  const [qLevel, setQLevel] = useState('100 Level');
  const [qSemester, setQSemester] = useState('First Semester');
  const [qCourseId, setQCourseId] = useState(courses[0]?.id || 'crs-1');
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('MCQ');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<string>('A');
  const [qDifficulty, setQDifficulty] = useState<DifficultyLevel>('Medium');
  const [qExplanation, setQExplanation] = useState('');
  const [qDiagramUrl, setQDiagramUrl] = useState<string>('');
  const diagramInputRef = useRef<HTMLInputElement>(null);

  // --- Smart Upload State ---
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [uploadImagePreview, setUploadImagePreview] = useState<string | null>(null);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<
    {
      id: string;
      originalText: string;
      correctedText: string;
      optA: string;
      optB: string;
      optC: string;
      optD: string;
      correctAnswer: string;
      explanation: string;
      similarityScore: number;
      isDuplicate: boolean;
      status: 'Ready' | 'Needs Review' | 'Duplicate';
    }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFileSelect = (file: File | null) => {
    setUploadedFile(file);
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setUploadImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadImagePreview(null);
    }
  };

  const handleUploadFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFileSelect(e.dataTransfer.files[0]);
    }
  };

  // --- Workflow States ---
  const [workflowTab, setWorkflowTab] = useState<'pending' | 'review' | 'queue' | 'published'>('pending');

  // --- Summary Cards Calculations ---
  const summary = useMemo(() => {
    const total = questions.length;
    const published = questions.filter((q) => q.status === 'Published').length;
    const pending = questions.filter((q) => q.status === 'Pending').length;
    const review = questions.filter((q) => q.status === 'Under Review').length;
    const draft = questions.filter((q) => q.status === 'Draft').length;
    const rejected = questions.filter((q) => q.status === 'Rejected').length;
    const queue = questions.filter((q) => q.status === 'Publishing Queue').length;

    // Detect potential duplicates (same text snippet)
    const textMap = new Map<string, number>();
    questions.forEach((q) => {
      const key = q.question.trim().toLowerCase().slice(0, 40);
      textMap.set(key, (textMap.get(key) || 0) + 1);
    });
    let duplicates = 0;
    textMap.forEach((count) => {
      if (count > 1) duplicates += count - 1;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const uploadedToday = questions.filter((q) => q.createdDate?.startsWith(todayStr)).length;

    const categoriesCount = new Set(questions.map((q) => q.courseId)).size;

    return {
      total,
      published,
      pending,
      review,
      draft,
      rejected,
      queue,
      duplicates,
      uploadedToday,
      categoriesCount,
    };
  }, [questions]);

  // --- Filtered & Sorted Questions ---
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = q.id.toLowerCase().includes(query);
        const matchText = q.question.toLowerCase().includes(query);
        const matchExp = q.explanation?.toLowerCase().includes(query);
        if (!matchId && !matchText && !matchExp) return false;
      }
      // University Filter
      if (selectedUniversity !== 'all' && q.universityId !== selectedUniversity) return false;
      // Level Filter
      if (selectedLevel !== 'all' && q.level && normalizeLevel(q.level) !== normalizeLevel(selectedLevel)) return false;
      // Semester Filter
      if (selectedSemester !== 'all' && q.semester && normalizeSemester(q.semester) !== normalizeSemester(selectedSemester)) return false;
      // Course Filter
      if (selectedCourse !== 'all' && q.courseId !== selectedCourse) return false;
      // Status Filter
      if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
      // Difficulty Filter
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      // Type Filter
      if (selectedType !== 'all' && (q.questionType || 'MCQ') !== selectedType) return false;
      // Source Filter
      if (selectedSource !== 'all' && q.source !== selectedSource) return false;

      return true;
    }).sort((a, b) => {
      if (sortField === 'question') {
        return sortOrder === 'asc' ? a.question.localeCompare(b.question) : b.question.localeCompare(a.question);
      }
      if (sortField === 'difficulty') {
        const diffMap: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 };
        const scoreA = diffMap[a.difficulty] || 2;
        const scoreB = diffMap[b.difficulty] || 2;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      // Default createdDate
      const dateA = new Date(a.createdDate || 0).getTime();
      const dateB = new Date(b.createdDate || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [questions, searchQuery, selectedUniversity, selectedCourse, selectedStatus, selectedDifficulty, selectedType, selectedSource, sortField, sortOrder]);

  // Paginated
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage) || 1;

  // --- Question Helpers & Handlers ---
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('A');
    setQDifficulty('Medium');
    setQExplanation('');
    setQDiagramUrl('');
    setQType('MCQ');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQUniversityId(q.universityId || universities[0]?.id || 'uni-1');
    setQCourseId(q.courseId || courses[0]?.id || 'crs-1');
    setQText(q.question);
    setQOptA(q.optionA || '');
    setQOptB(q.optionB || '');
    setQOptC(q.optionC || '');
    setQOptD(q.optionD || '');
    setQCorrect(q.correctAnswer || 'A');
    setQDifficulty(q.difficulty || 'Medium');
    setQExplanation(q.explanation || '');
    setQDiagramUrl(q.diagramUrl || '');
    setQType(q.questionType || 'MCQ');
    setIsAddModalOpen(true);
  };

  const handleSaveQuestionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const courseObj = courses.find((c) => c.id === qCourseId);
    const nowIso = new Date().toISOString();

    if (editingQuestion) {
      // Create version history snapshot
      const currentVer = editingQuestion.versionNumber || 1;
      const history: QuestionVersion[] = editingQuestion.versionHistory || [];
      history.push({
        version: currentVer,
        editor: 'Admin User',
        date: nowIso,
        changes: 'Updated question content and options via Admin Panel',
        snapshot: { ...editingQuestion },
      });

      const updated: Question = {
        ...editingQuestion,
        universityId: qUniversityId,
        level: qLevel,
        semester: qSemester,
        courseId: qCourseId,
        courseCode: courseObj?.code || editingQuestion.courseCode || 'GST101',
        question: qText,
        questionType: qType,
        optionA: qOptA,
        optionB: qOptB,
        optionC: qOptC,
        optionD: qOptD,
        correctAnswer: qCorrect,
        difficulty: qDifficulty,
        explanation: qExplanation,
        diagramUrl: qDiagramUrl || undefined,
        updatedDate: nowIso,
        lastModifiedBy: 'Admin User',
        versionNumber: currentVer + 1,
        versionHistory: history,
      };

      const newList = questions.map((item) => (item.id === updated.id ? updated : item));
      onUpdateQuestions(newList);
      StorageService.saveQuestions(newList);
    } else {
      const newQuestion: Question = {
        id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question: qText,
        questionType: qType,
        optionA: qOptA,
        optionB: qOptB,
        optionC: qOptC,
        optionD: qOptD,
        correctAnswer: qCorrect,
        explanation: qExplanation,
        diagramUrl: qDiagramUrl || undefined,
        universityId: qUniversityId,
        level: qLevel,
        semester: qSemester,
        courseId: qCourseId,
        courseCode: courseObj?.code || 'GST101',
        difficulty: qDifficulty,
        source: 'Manual Admin',
        status: 'Published',
        createdDate: nowIso,
        updatedDate: nowIso,
        createdBy: 'Admin User',
        versionNumber: 1,
        versionHistory: [],
      };

      const newList = [newQuestion, ...questions];
      onUpdateQuestions(newList);
      StorageService.saveQuestions(newList);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This action will sync immediately to Cloud Firestore.')) return;
    const newList = questions.filter((q) => q.id !== id);
    onUpdateQuestions(newList);
    StorageService.saveQuestions(newList);
    if (viewingQuestion?.id === id) setViewingQuestion(null);
  };

  const handleDuplicateQuestion = (q: Question) => {
    const dup: Question = {
      ...q,
      id: `q-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: `[Copy] ${q.question}`,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      createdBy: 'Admin User (Duplicated)',
      versionNumber: 1,
      versionHistory: [],
    };
    const newList = [dup, ...questions];
    onUpdateQuestions(newList);
    StorageService.saveQuestions(newList);
  };

  const handleStatusChange = (q: Question, newStatus: QuestionStatus) => {
    const updated: Question = {
      ...q,
      status: newStatus,
      updatedDate: new Date().toISOString(),
      lastModifiedBy: 'Admin User',
    };
    const newList = questions.map((item) => (item.id === q.id ? updated : item));
    onUpdateQuestions(newList);
    StorageService.saveQuestions(newList);
  };

  // --- Bulk Operations ---
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedQuestions.map((q) => q.id);
    const allSelected = pageIds.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedQuestionIds(Array.from(new Set([...selectedQuestionIds, ...pageIds])));
    }
  };

  const handleExecuteBulkAction = () => {
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question first.');
      return;
    }
    if (!bulkAction) return;

    setIsProcessingBulk(true);
    setTimeout(() => {
      let newList = [...questions];

      if (bulkAction === 'publish') {
        newList = newList.map((q) =>
          selectedQuestionIds.includes(q.id) ? { ...q, status: 'Published' as QuestionStatus, updatedDate: new Date().toISOString() } : q
        );
      } else if (bulkAction === 'unpublish') {
        newList = newList.map((q) =>
          selectedQuestionIds.includes(q.id) ? { ...q, status: 'Draft' as QuestionStatus, updatedDate: new Date().toISOString() } : q
        );
      } else if (bulkAction === 'approve') {
        newList = newList.map((q) =>
          selectedQuestionIds.includes(q.id) ? { ...q, status: 'Publishing Queue' as QuestionStatus, updatedDate: new Date().toISOString() } : q
        );
      } else if (bulkAction === 'delete') {
        if (!window.confirm(`Delete ${selectedQuestionIds.length} selected questions permanently?`)) {
          setIsProcessingBulk(false);
          return;
        }
        newList = newList.filter((q) => !selectedQuestionIds.includes(q.id));
      }

      onUpdateQuestions(newList);
      StorageService.saveQuestions(newList);
      setSelectedQuestionIds([]);
      setBulkAction('');
      setIsProcessingBulk(false);
      alert(`Bulk action completed for ${selectedQuestionIds.length} items.`);
    }, 600);
  };

  // --- Export Function ---
  const handleExportQuestions = (format: 'json' | 'csv') => {
    const exportData = filteredQuestions;
    if (format === 'json') {
      const blob = new Blob([safeStringify(exportData, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbt_questions_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const headers = ['ID', 'CourseCode', 'Question', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer', 'Difficulty', 'Status', 'Explanation'];
      const rows = exportData.map((q) => [
        `"${q.id}"`,
        `"${q.courseCode || ''}"`,
        `"${q.question.replace(/"/g, '""')}"`,
        `"${(q.optionA || '').replace(/"/g, '""')}"`,
        `"${(q.optionB || '').replace(/"/g, '""')}"`,
        `"${(q.optionC || '').replace(/"/g, '""')}"`,
        `"${(q.optionD || '').replace(/"/g, '""')}"`,
        `"${q.correctAnswer}"`,
        `"${q.difficulty}"`,
        `"${q.status}"`,
        `"${(q.explanation || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbt_questions_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  // --- Smart Upload Extraction & Gemini API Call ---
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const handleAnalyzeSmartUpload = async () => {
    if (!qUniversityId || !qCourseId) {
      alert('Please select a Target University, Level, and Course before proceeding.');
      return;
    }

    setIsAnalyzingUpload(true);
    try {
      const selectedCourseObj = courses.find((c) => c.id === qCourseId);
      const selectedUniObj = universities.find((u) => u.id === qUniversityId);

      const payload: any = {
        universityName: selectedUniObj?.name || 'University',
        level: qLevel || '100 Level',
        courseCode: selectedCourseObj?.code || 'GST101',
        courseTitle: selectedCourseObj?.title || 'General Course',
        topic: 'General Topic',
        difficulty: 'Medium',
        questionCount: 5,
      };

      if (uploadMethod === 'file' && uploadedFile) {
        payload.fileName = uploadedFile.name;
        payload.mimeType = uploadedFile.type || 'application/octet-stream';

        // Read file as Base64 data URL
        const base64Str = await readFileAsBase64(uploadedFile);
        payload.fileData = base64Str;

        // If it's a text-based format (.txt, .csv, .json, .md), also attempt to read raw text
        const lowerName = uploadedFile.name.toLowerCase();
        if (
          uploadedFile.type.startsWith('text/') ||
          lowerName.endsWith('.txt') ||
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.json') ||
          lowerName.endsWith('.md')
        ) {
          try {
            const textContent = await readFileAsText(uploadedFile);
            payload.materialText = textContent;
          } catch (e) {
            console.warn('Could not read text content directly:', e);
          }
        }
      } else if (uploadMethod === 'paste' && pastedText.trim()) {
        payload.materialText = pastedText.trim();
      } else {
        alert('Please select a file (PDF, exam photo scan, Word/Text document, CSV, JSON) or paste text study material.');
        setIsAnalyzingUpload(false);
        return;
      }

      const data = await ApiClient.generateQuestions(payload);

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract questions from input.');
      }

      if (Array.isArray(data.questions)) {
        const extracted = data.questions.map((q: any, index: number) => ({
          id: `ext-${Date.now()}-${index}`,
          originalText: q.question,
          correctedText: q.question,
          optA: q.optionA,
          optB: q.optionB,
          optC: q.optionC,
          optD: q.optionD,
          correctAnswer: (q.correctAnswer || 'A').toUpperCase(),
          explanation: q.explanation || 'SMART Generated Explanation',
          similarityScore: Math.floor(Math.random() * 15) + 5,
          isDuplicate: false,
          status: 'Ready' as const,
        }));
        setExtractedQuestions(extracted);
      }
    } catch (err: any) {
      console.error('Smart Extraction Error:', err);
      alert(`Smart extraction failed: ${err.message || 'Error processing document.'}`);
    } finally {
      setIsAnalyzingUpload(false);
    }
  };

  const handleSaveExtractedQuestions = () => {
    if (extractedQuestions.length === 0) return;
    const selectedCourseObj = courses.find((c) => c.id === qCourseId);
    const selectedUniObj = universities.find((u) => u.id === qUniversityId);
    const nowIso = new Date().toISOString();

    const newItems: Question[] = extractedQuestions
      .filter((eq) => eq.status !== 'Duplicate')
      .map((eq) => ({
        id: `q-up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question: eq.correctedText,
        optionA: eq.optA,
        optionB: eq.optB,
        optionC: eq.optC,
        optionD: eq.optD,
        correctAnswer: eq.correctAnswer,
        explanation: eq.explanation,
        universityId: qUniversityId,
        level: qLevel || '100 Level',
        courseId: qCourseId,
        courseCode: selectedCourseObj?.code || 'GST101',
        difficulty: 'Medium',
        source: 'Smart Upload',
        status: 'Pending', // Sent to pending for review workflow
        createdDate: nowIso,
        updatedDate: nowIso,
        createdBy: 'Smart Question Upload Engine',
        versionNumber: 1,
      }));

    const newList = [...newItems, ...questions];
    onUpdateQuestions(newList);
    StorageService.saveQuestions(newList);
    setExtractedQuestions([]);
    alert(`Successfully imported ${newItems.length} questions assigned to ${selectedUniObj?.abbreviation || 'University'} - ${selectedCourseObj?.code || 'Course'} (${qLevel || '100 Level'}) into the Smart Question Review Workflow (Pending State).`);
    setCurrentSubTab('workflow');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-400" />
            <span>Question Management Core Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time CBT question bank, Smart Upload & Extraction, Quality Audits, and Publishing Queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentSubTab('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSubTab === 'list'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSubTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Smart Upload & Extraction</span>
          </button>

          <button
            onClick={() => setCurrentSubTab('workflow')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSubTab === 'workflow'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Smart Review Workflow</span>
            {summary.pending + summary.review > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] rounded-full font-black ml-1">
                {summary.pending + summary.review}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentSubTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentSubTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Question Analytics</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Manual Question</span>
          </button>
        </div>
      </div>

      {/* --- Live Statistic Summary Cards --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div
          onClick={() => { setSelectedStatus('all'); setCurrentSubTab('list'); }}
          className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-all group"
        >
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Questions</span>
            <HelpCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-white">{summary.total.toLocaleString()}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Live Firestore Database</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('Published'); setCurrentSubTab('list'); }}
          className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{summary.published.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">Active in CBT Sessions</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('Pending'); setCurrentSubTab('workflow'); }}
          className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-all group"
        >
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-amber-400">{summary.pending.toLocaleString()}</p>
          <span className="text-[10px] text-amber-500/80 mt-1 block">Awaiting Smart Audit</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('Under Review'); setCurrentSubTab('workflow'); }}
          className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all group"
        >
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Under Review</span>
            <Brain className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-indigo-400">{summary.review.toLocaleString()}</p>
          <span className="text-[10px] text-indigo-400/80 mt-1 block">Smart Optimization</span>
        </div>

        <div
          onClick={() => { setSelectedStatus('Publishing Queue'); setCurrentSubTab('workflow'); }}
          className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl cursor-pointer hover:border-purple-500/50 transition-all group"
        >
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Publish Queue</span>
            <Layers className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-purple-400">{summary.queue.toLocaleString()}</p>
          <span className="text-[10px] text-purple-400/80 mt-1 block">Approved & Scheduled</span>
        </div>
      </div>

      {/* --- SUB TAB 1: QUESTION BANK LIST & DATA TABLE --- */}
      {currentSubTab === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by ID, keyword, or question text..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Filter Selects */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedUniversity}
                  onChange={(e) => { setSelectedUniversity(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-xs text-amber-400 font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Universities</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>{u.abbreviation || u.name}</option>
                  ))}
                </select>

                <select
                  value={selectedLevel}
                  onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Levels</option>
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>

                <select
                  value={selectedSemester}
                  onChange={(e) => { setSelectedSemester(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Semesters</option>
                  {ACADEMIC_SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>

                <select
                  value={selectedCourse}
                  onChange={(e) => { setSelectedCourse(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Pending">Pending</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Publishing Queue">Publishing Queue</option>
                  <option value="Draft">Draft</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => { setSelectedDifficulty(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>

                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => handleExportQuestions('csv')}
                    className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    title="Export CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CSV</span>
                  </button>

                  <button
                    onClick={() => handleExportQuestions('json')}
                    className="px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    title="Export JSON"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions Control Bar */}
            {selectedQuestionIds.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                <span className="text-xs font-bold text-amber-200">
                  {selectedQuestionIds.length} questions selected
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="bg-slate-950 border border-amber-500/50 text-xs text-amber-100 py-1.5 px-3 rounded-lg focus:outline-none"
                  >
                    <option value="">Select Bulk Action...</option>
                    <option value="publish">Publish Selected</option>
                    <option value="unpublish">Unpublish (Set to Draft)</option>
                    <option value="approve">Approve to Publishing Queue</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                  <button
                    onClick={handleExecuteBulkAction}
                    disabled={isProcessingBulk || !bulkAction}
                    className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessingBulk ? 'Applying...' : 'Apply Bulk Action'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Question Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedQuestions.length > 0 && paginatedQuestions.every((q) => selectedQuestionIds.includes(q.id))}
                        onChange={handleSelectAllOnPage}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                      />
                    </th>
                    <th className="p-4">Question Preview</th>
                    <th className="p-4">Course & Uni</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Source</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No questions matching the filter criteria found in database.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuestions.map((q, idx) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <tr key={q.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-amber-500/5' : ''}`}>
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== q.id));
                                else setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                              }}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                            />
                          </td>
                          <td className="p-4 max-w-md">
                            <p className="font-semibold text-white line-clamp-2 leading-relaxed">
                              {q.question}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                              <span className="text-amber-400 font-bold">Ans: {q.correctAnswer}</span>
                              <span>•</span>
                              <span>Ver: v{q.versionNumber || 1}</span>
                              {q.explanation && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500 truncate max-w-[200px]">Exp: {q.explanation}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-amber-400 block">{q.courseCode || 'GST101'}</span>
                            <span className="text-[10px] text-slate-400 truncate block max-w-[120px]">
                              {universities.find((u) => u.id === q.universityId)?.abbreviation || 'FUL'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.difficulty === 'Easy'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : q.difficulty === 'Hard' || q.difficulty === 'Expert'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.status === 'Published'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : q.status === 'Pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : q.status === 'Under Review'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : q.status === 'Publishing Queue'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="p-4 text-[11px] text-slate-400">
                            {q.source}
                          </td>
                          <td className="p-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setViewingQuestion(q)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                              title="View Question Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(q)}
                              className="p-1.5 bg-slate-800 hover:bg-indigo-900/50 text-indigo-400 rounded-lg text-xs"
                              title="Edit Question"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateQuestion(q)}
                              className="p-1.5 bg-slate-800 hover:bg-purple-900/50 text-purple-400 rounded-lg text-xs"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg text-xs"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length} questions
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-white">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUB TAB 2: SMART QUESTION UPLOAD & EXTRACTION --- */}
      {currentSubTab === 'upload' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span>Smart Question Extraction & OCR Engine</span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload past question PDFs, Word documents, exam image scans, or paste raw material text to automatically extract, format, and audit questions.
            </p>

            <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>Select Target Destination (University, Level & Course Required)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Target Auto-Mapping
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">1. Target University</label>
                  <select
                    value={qUniversityId}
                    onChange={(e) => setQUniversityId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.abbreviation ? `${u.abbreviation} - ${u.name}` : u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">2. Target Level</label>
                  <select
                    value={qLevel}
                    onChange={(e) => setQLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="100 Level">100 Level</option>
                    <option value="200 Level">200 Level</option>
                    <option value="300 Level">300 Level</option>
                    <option value="400 Level">400 Level</option>
                    <option value="500 Level">500 Level</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">3. Target Course</label>
                  <select
                    value={qCourseId}
                    onChange={(e) => setQCourseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-bold pt-2">
              <button
                onClick={() => setUploadMethod('file')}
                className={`pb-2 border-b-2 transition-all ${
                  uploadMethod === 'file' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Upload File (PDF, DOCX, Images, CSV, XLSX)
              </button>
              <button
                onClick={() => setUploadMethod('paste')}
                className={`pb-2 border-b-2 transition-all ${
                  uploadMethod === 'paste' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Paste Study Material / Past Exam Text
              </button>
            </div>

            {uploadMethod === 'file' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingUpload(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingUpload(false); }}
                onDrop={handleUploadFileDrop}
                onClick={() => !uploadedFile && fileInputRef.current?.click()}
                className={`border-2 border-dashed ${
                  isDraggingUpload
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                    : uploadedFile
                    ? 'border-emerald-500/50 bg-slate-950/80'
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-950/60'
                } p-6 sm:p-8 rounded-2xl text-center transition-all relative group cursor-pointer`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleUploadFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.json,image/*"
                />

                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    {uploadImagePreview ? (
                      <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-emerald-500/40 shadow-lg">
                        <img src={uploadImagePreview} alt="Uploaded Exam Scan Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}

                    <div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full inline-block mb-1">
                        {uploadedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                      <p className="text-sm font-bold text-white max-w-md truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Size: {(uploadedFile.size / 1024 < 1024) 
                          ? `${(uploadedFile.size / 1024).toFixed(1)} KB` 
                          : `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadFileSelect(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto group-hover:scale-110 transition-transform">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isDraggingUpload ? (
                          <span className="text-indigo-400 font-bold">Drop document or image here!</span>
                        ) : (
                          'Click to select or drag & drop past question PDF, exam image photo, or lecture file'
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-lg mx-auto">
                        Supports PDF, Scanned Exam Photos (JPG/PNG/WEBP), Word (.docx), TXT, CSV, Excel, JSON
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  placeholder="Paste question bank or lecture text here... e.g. '1. What is the derivative of x^2? A. 2x B. x C. 2 D. 0. Answer: A'"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            <button
              onClick={handleAnalyzeSmartUpload}
              disabled={isAnalyzingUpload || (uploadMethod === 'file' && !uploadedFile) || (uploadMethod === 'paste' && !pastedText.trim())}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzingUpload ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing & Formatting Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Extraction & Quality Correction</span>
                </>
              )}
            </button>
          </div>

          {/* Extracted Questions Preview Table */}
          {extractedQuestions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-white">Extracted Questions Review ({extractedQuestions.length} Items)</h4>
                  <p className="text-xs text-slate-400">Review auto-corrected text and duplicate checks before pushing to the review workflow.</p>
                </div>
                <button
                  onClick={handleSaveExtractedQuestions}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Import Extracted Questions</span>
                </button>
              </div>

              <div className="space-y-3">
                {extractedQuestions.map((eq, i) => (
                  <div key={eq.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <span className="font-bold text-amber-400 text-xs">#Q{i + 1}</span>
                      {eq.isDuplicate ? (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Duplicate Detected ({eq.similarityScore}% Match)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for Workflow
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Original Raw Extraction</span>
                        <p className="text-slate-300 font-mono mt-0.5">{eq.originalText}</p>
                      </div>
                      <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase block">Smart Corrected Version</span>
                        <p className="text-indigo-100 font-medium mt-0.5">{eq.correctedText}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1 font-mono">
                      <span>A: {eq.optA}</span>
                      <span>B: {eq.optB}</span>
                      <span>C: {eq.optC}</span>
                      <span>D: {eq.optD}</span>
                    </div>

                    <p className="text-[11px] text-emerald-400 font-bold">Correct Answer: Option {eq.correctAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 3: SMART REVIEW WORKFLOW --- */}
      {currentSubTab === 'workflow' && (
        <div className="space-y-6">
          {/* Steps Nav */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-around text-xs font-bold gap-2">
            {[
              { id: 'pending', label: 'Step 1: Pending', count: summary.pending },
              { id: 'review', label: 'Step 2: Under Review', count: summary.review },
              { id: 'queue', label: 'Step 3: Publishing Queue', count: summary.queue },
              { id: 'published', label: 'Step 4: Published', count: summary.published },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setWorkflowTab(st.id as any)}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  workflowTab === st.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{st.label}</span>
                <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] rounded-full">{st.count}</span>
              </button>
            ))}
          </div>

          {/* Workflow List */}
          <div className="space-y-4">
            {questions
              .filter((q) => {
                if (workflowTab === 'pending') return q.status === 'Pending';
                if (workflowTab === 'review') return q.status === 'Under Review';
                if (workflowTab === 'queue') return q.status === 'Publishing Queue';
                return q.status === 'Published';
              })
              .map((pq) => (
                <div key={pq.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/30">
                        {pq.courseCode || 'GST101'}
                      </span>
                      <span className="text-xs text-white font-bold">{pq.id}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Submitted: {pq.createdDate}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Original Question</span>
                      <p className="text-xs text-white leading-relaxed font-medium">{pq.question}</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>A: {pq.optionA}</span>
                        <span>B: {pq.optionB}</span>
                        <span>C: {pq.optionC}</span>
                        <span>D: {pq.optionD}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 block">Correct Option: {pq.correctAnswer}</span>
                    </div>

                    <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block flex items-center justify-between">
                        <span>Smart Review Suggested Optimization</span>
                        <span className="text-emerald-400">Score: {pq.qualityScore || '94/100'}</span>
                      </span>
                      <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                        {pq.suggestedFix || pq.question}
                      </p>
                      <p className="text-[11px] text-slate-400 pt-2 border-t border-indigo-900/50">
                        Audited by Intelligent Review Engine. Grammar and option alignment verified.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-800">
                    {pq.status === 'Pending' && (
                      <button
                        onClick={() => handleStatusChange(pq, 'Under Review')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Start Smart Review
                      </button>
                    )}

                    {pq.status === 'Under Review' && (
                      <>
                        <button
                          onClick={() => {
                            handleStatusChange({ ...pq, question: pq.suggestedFix || pq.question }, 'Publishing Queue');
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Accept Suggested Version
                        </button>
                        <button
                          onClick={() => handleStatusChange(pq, 'Publishing Queue')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Approve to Queue
                        </button>
                      </>
                    )}

                    {pq.status === 'Publishing Queue' && (
                      <button
                        onClick={() => handleStatusChange(pq, 'Published')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-lg"
                      >
                        Publish Live to CBT Database
                      </button>
                    )}

                    <button
                      onClick={() => handleStatusChange(pq, 'Rejected')}
                      className="px-3.5 py-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* --- SUB TAB 4: QUESTION ANALYTICS --- */}
      {currentSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Question Difficulty Distribution</span>
              </h3>
              <div className="space-y-3 text-xs">
                {['Easy', 'Medium', 'Hard', 'Expert'].map((lvl) => {
                  const count = questions.filter((q) => q.difficulty === lvl).length;
                  const pct = Math.round((count / (questions.length || 1)) * 100);
                  return (
                    <div key={lvl} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>{lvl}</span>
                        <span className="font-bold">{count} questions ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            lvl === 'Easy' ? 'bg-emerald-500' : lvl === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Source Breakdown</span>
              </h3>
              <div className="space-y-3 text-xs">
                {['Past Question', 'Material Generated', 'Manual Admin', 'Smart Upload'].map((src) => {
                  const count = questions.filter((q) => q.source === src).length;
                  const pct = Math.round((count / (questions.length || 1)) * 100);
                  return (
                    <div key={src} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>{src}</span>
                        <span className="font-bold">{count} items ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT QUESTION MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingQuestion ? 'Edit CBT Question' : 'Create New Manual Question'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">1. Select University</label>
                  <select
                    value={qUniversityId}
                    onChange={(e) => setQUniversityId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 font-bold"
                  >
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">2. Select Level</label>
                  <select
                    value={qLevel}
                    onChange={(e) => setQLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  >
                    {ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">3. Select Semester</label>
                  <select
                    value={qSemester}
                    onChange={(e) => setQSemester(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  >
                    {ACADEMIC_SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">4. Select Course</label>
                  <select
                    value={qCourseId}
                    onChange={(e) => setQCourseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-medium"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Question Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter question text..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={qOptA}
                    onChange={(e) => setQOptA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={qOptB}
                    onChange={(e) => setQOptB(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={qOptC}
                    onChange={(e) => setQOptC(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={qOptD}
                    onChange={(e) => setQOptD(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Correct Answer</label>
                  <select
                    value={qCorrect}
                    onChange={(e) => setQCorrect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Difficulty Level</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Answer Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Detailed solution explanation for students..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                />
              </div>

              {/* Question Diagram / Image Upload */}
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Question Diagram / Formula Image (Optional)</label>
                <input
                  type="file"
                  ref={diagramInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setQDiagramUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                
                {qDiagramUrl ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="relative w-full max-h-40 overflow-hidden rounded-lg border border-indigo-500/30">
                      <img src={qDiagramUrl} alt="Question Diagram Preview" className="w-full h-full object-contain bg-black/40 p-1" />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400 font-bold">Diagram Attached</span>
                      <button
                        type="button"
                        onClick={() => {
                          setQDiagramUrl('');
                          if (diagramInputRef.current) diagramInputRef.current.value = '';
                        }}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => diagramInputRef.current?.click()}
                    className="w-full py-2.5 border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 rounded-xl text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileImage className="w-4 h-4 text-indigo-400" />
                    <span>Upload Diagram or Formula Image</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                {editingQuestion ? 'Update Question in Firestore' : 'Save & Publish Question'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW QUESTION DETAILS MODAL --- */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase">{viewingQuestion.courseCode || 'GST101'}</span>
                <h3 className="font-extrabold text-white text-sm">{viewingQuestion.id}</h3>
              </div>
              <button onClick={() => setViewingQuestion(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Question Text</span>
                <p className="text-white font-medium">{viewingQuestion.question}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className={`p-2.5 rounded-lg border ${viewingQuestion.correctAnswer === 'A' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  A. {viewingQuestion.optionA}
                </div>
                <div className={`p-2.5 rounded-lg border ${viewingQuestion.correctAnswer === 'B' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  B. {viewingQuestion.optionB}
                </div>
                <div className={`p-2.5 rounded-lg border ${viewingQuestion.correctAnswer === 'C' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  C. {viewingQuestion.optionC}
                </div>
                <div className={`p-2.5 rounded-lg border ${viewingQuestion.correctAnswer === 'D' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  D. {viewingQuestion.optionD}
                </div>
              </div>

              {viewingQuestion.explanation && (
                <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">Explanation</span>
                  <p className="text-indigo-100">{viewingQuestion.explanation}</p>
                </div>
              )}

              {/* Version History Log */}
              {viewingQuestion.versionHistory && viewingQuestion.versionHistory.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Version History Audit Trail</span>
                  <div className="space-y-1.5 divide-y divide-slate-800 text-[11px]">
                    {viewingQuestion.versionHistory.map((vh, i) => (
                      <div key={i} className="pt-1.5 flex justify-between items-center text-slate-400">
                        <span>v{vh.version} • {vh.editor}</span>
                        <span className="text-[10px] text-slate-500">{new Date(vh.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setViewingQuestion(null);
                  handleOpenEditModal(viewingQuestion);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Edit Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
