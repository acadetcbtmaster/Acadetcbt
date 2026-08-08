import React, { useState, useMemo, useRef } from 'react';
import { StudyMaterial, University, Course } from '../../types';
import { StorageService } from '../../services/storage';
import { ACADEMIC_LEVELS, ACADEMIC_SEMESTERS, normalizeLevel, normalizeSemester } from '../../utils/academicStructure';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Edit3,
  Eye,
  Lock,
  Crown,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Upload,
  HardDrive,
  BarChart2,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface StudyMaterialsModuleProps {
  materials: StudyMaterial[];
  universities: University[];
  courses: Course[];
  onUpdateMaterials: (updated: StudyMaterial[]) => void;
}

export const StudyMaterialsModule: React.FC<StudyMaterialsModuleProps> = ({
  materials,
  universities,
  courses,
  onUpdateMaterials,
}) => {
  // --- Search & Filter States (University -> Level -> Semester -> Course) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAccess, setSelectedAccess] = useState('all');

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- Selection & Bulk Actions ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTier, setBulkTier] = useState<'Free Trial' | 'Premium Only' | ''>('');

  // --- Modal States ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // --- Upload Form States ---
  const [title, setTitle] = useState('');
  const [universityId, setUniversityId] = useState(universities[0]?.id || 'uni-1');
  const [level, setLevel] = useState('100 Level');
  const [semester, setSemester] = useState('First Semester');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'crs-1');
  const [type, setType] = useState<StudyMaterial['type']>('PDF');
  const [accessLevel, setAccessLevel] = useState<'Free Trial' | 'Premium Only'>('Free Trial');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Available courses filtered by selected university in upload modal
  const selectedUniObj = universities.find((u) => u.id === universityId);
  const availableCoursesForSelectedUni = useMemo(() => {
    return courses.filter((c) => {
      if (!c.universityId) return true;
      if (c.universityId === universityId) return true;
      if (selectedUniObj && c.universityName && c.universityName.toLowerCase().includes((selectedUniObj.abbreviation || selectedUniObj.name).toLowerCase())) return true;
      return false;
    });
  }, [courses, universityId, selectedUniObj]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Summary Calculations ---
  const summary = useMemo(() => {
    const total = materials.length;
    const pdfs = materials.filter((m) => m.type === 'PDF').length;
    const notes = materials.filter((m) => m.type === 'Lecture Notes' || m.type === 'Text Document').length;
    const images = materials.filter((m) => m.type === 'Image').length;
    const videos = materials.filter((m) => m.type === 'Video Link').length;
    const premium = materials.filter((m) => m.accessLevel === 'Premium Only').length;
    const free = materials.filter((m) => m.accessLevel === 'Free Trial').length;
    const totalDownloads = materials.reduce((acc, m) => acc + (m.totalDownloads || 0), 0);

    // Approximate total storage
    let totalBytes = 0;
    materials.forEach((m) => {
      if (m.fileSizeBytes) totalBytes += m.fileSizeBytes;
      else if (m.fileSize?.includes('MB')) totalBytes += parseFloat(m.fileSize) * 1024 * 1024;
      else if (m.fileSize?.includes('KB')) totalBytes += parseFloat(m.fileSize) * 1024;
    });
    const storageMb = (totalBytes / (1024 * 1024)).toFixed(1);

    return { total, pdfs, notes, images, videos, premium, free, totalDownloads, storageMb };
  }, [materials]);

  // --- Filtered Materials ---
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchCode = (m.courseCode || '').toLowerCase().includes(q);
        const matchDesc = (m.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchDesc) return false;
      }
      if (selectedUniversity !== 'all' && m.universityId !== selectedUniversity) return false;
      if (selectedLevel !== 'all' && m.level && normalizeLevel(m.level) !== normalizeLevel(selectedLevel)) return false;
      if (selectedSemester !== 'all' && m.semester && normalizeSemester(m.semester) !== normalizeSemester(selectedSemester)) return false;
      if (selectedCourse !== 'all' && m.courseId !== selectedCourse) return false;
      if (selectedType !== 'all' && m.type !== selectedType) return false;
      if (selectedAccess !== 'all' && m.accessLevel !== selectedAccess) return false;

      return true;
    });
  }, [materials, searchQuery, selectedUniversity, selectedCourse, selectedType, selectedAccess]);

  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(start, start + itemsPerPage);
  }, [filteredMaterials, currentPage]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage) || 1;

  // --- Form Reset & Open Handlers ---
  const handleOpenUpload = () => {
    setEditingMaterial(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setUploadedFile(null);
    setType('PDF');
    setAccessLevel('Free Trial');
    setIsUploadModalOpen(true);
  };

  const handleOpenEdit = (m: StudyMaterial) => {
    setEditingMaterial(m);
    setTitle(m.title);
    setUniversityId(m.universityId);
    setCourseId(m.courseId);
    setType(m.type);
    setAccessLevel(m.accessLevel);
    setDescription(m.description || '');
    setVideoUrl(m.videoUrl || '');
    setIsUploadModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsProcessingFile(true);
    try {
      const uniObj = universities.find((u) => u.id === universityId);
      const crsObj = courses.find((c) => c.id === courseId);
      const nowIso = new Date().toISOString().split('T')[0];

      let sizeStr = editingMaterial?.fileSize || '1.5 MB';
      let bytesNum = editingMaterial?.fileSizeBytes || 1572864;
      let fileDataUrl: string | undefined = editingMaterial?.fileUrl;

      if (uploadedFile) {
        bytesNum = uploadedFile.size;
        sizeStr = uploadedFile.size > 1048576
          ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(uploadedFile.size / 1024)} KB`;

        fileDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      } else if (type === 'Video Link') {
        sizeStr = 'Stream Link';
        bytesNum = 0;
        fileDataUrl = videoUrl;
      }

      if (editingMaterial) {
        const updated: StudyMaterial = {
          ...editingMaterial,
          title,
          universityId,
          universityName: uniObj?.abbreviation || uniObj?.name || 'FUL',
          level,
          semester,
          courseId,
          courseCode: crsObj?.code || 'GST101',
          courseTitle: crsObj?.title || 'Use of English',
          type,
          accessLevel,
          description,
          videoUrl,
          fileUrl: fileDataUrl,
          fileSize: sizeStr,
          fileSizeBytes: bytesNum,
        };
        const newList = materials.map((item) => (item.id === updated.id ? updated : item));
        onUpdateMaterials(newList);
        StorageService.saveMaterials(newList);
      } else {
        const newMat: StudyMaterial = {
          id: `mat-${Date.now()}`,
          title,
          universityId,
          universityName: uniObj?.abbreviation || uniObj?.name || 'FUL',
          level,
          semester,
          courseId,
          courseCode: crsObj?.code || 'GST101',
          courseTitle: crsObj?.title || 'Use of English',
          type,
          accessLevel,
          fileSize: sizeStr,
          fileSizeBytes: bytesNum,
          totalDownloads: 0,
          uploadedBy: 'Admin User',
          uploadDate: nowIso,
          status: 'Active',
          description,
          videoUrl,
          fileUrl: fileDataUrl,
          pagesCount: Math.floor(Math.random() * 20) + 5,
        };
        const newList = [newMat, ...materials];
        onUpdateMaterials(newList);
        StorageService.saveMaterials(newList);
      }

      setIsProcessingFile(false);
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error('Error saving uploaded study material:', err);
      setIsProcessingFile(false);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study material? This will update Firestore immediately.')) return;
    const newList = materials.filter((m) => m.id !== id);
    onUpdateMaterials(newList);
    StorageService.saveMaterials(newList);
    if (viewingMaterial?.id === id) setViewingMaterial(null);
  };

  // --- Bulk Tier Action ---
  const handleApplyBulkTier = () => {
    if (selectedIds.length === 0 || !bulkTier) return;
    const newList = materials.map((m) => (selectedIds.includes(m.id) ? { ...m, accessLevel: bulkTier } : m));
    onUpdateMaterials(newList);
    StorageService.saveMaterials(newList);
    setSelectedIds([]);
    setBulkTier('');
    alert(`Updated subscription access tier for ${selectedIds.length} materials.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Study Materials & Lecture Library</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage course summaries, lecture PDFs, formula sheets, diagrams, and video resources.
          </p>
        </div>

        <button
          onClick={handleOpenUpload}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Upload Study Material</span>
        </button>
      </div>

      {/* Live Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Materials</span>
          <p className="text-xl font-black text-white mt-1">{summary.total}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">PDF Documents</span>
          <p className="text-xl font-black text-indigo-400 mt-1">{summary.pdfs}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Lecture Notes</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{summary.notes}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Video Streams</span>
          <p className="text-xl font-black text-purple-400 mt-1">{summary.videos}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Premium Locked</span>
          <p className="text-xl font-black text-amber-400 mt-1">{summary.premium}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Total Downloads</span>
          <p className="text-xl font-black text-cyan-400 mt-1">{summary.totalDownloads.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by title or course code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-amber-400 font-bold py-2 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Universities</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.abbreviation || u.name}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Levels</option>
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Semesters</option>
              {ACADEMIC_SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Resource Types</option>
              <option value="PDF">PDF</option>
              <option value="Lecture Notes">Lecture Notes</option>
              <option value="Video Link">Video Link</option>
              <option value="Image">Image Diagram</option>
            </select>

            <select
              value={selectedAccess}
              onChange={(e) => setSelectedAccess(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Access Tiers</option>
              <option value="Free Trial">Free Trial</option>
              <option value="Premium Only">Premium Only</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-950/40 border border-indigo-500/40 p-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <span className="text-xs font-bold text-indigo-200">{selectedIds.length} materials selected</span>
            <div className="flex items-center gap-2">
              <select
                value={bulkTier}
                onChange={(e) => setBulkTier(e.target.value as any)}
                className="bg-slate-950 border border-indigo-500/50 text-xs text-indigo-100 py-1.5 px-3 rounded-lg focus:outline-none"
              >
                <option value="">Change Tier To...</option>
                <option value="Free Trial">Set Free Trial</option>
                <option value="Premium Only">Set Premium Only</option>
              </select>
              <button
                onClick={handleApplyBulkTier}
                disabled={!bulkTier}
                className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Materials Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedMaterials.length > 0 && paginatedMaterials.every((m) => selectedIds.includes(m.id))}
                    onChange={() => {
                      const pageIds = paginatedMaterials.map((m) => m.id);
                      if (pageIds.every((id) => selectedIds.includes(id))) {
                        setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
                      } else {
                        setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
                      }
                    }}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                  />
                </th>
                <th className="p-4">Material Details</th>
                <th className="p-4">Course & Uni</th>
                <th className="p-4">Type</th>
                <th className="p-4">Access Tier</th>
                <th className="p-4">Downloads</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No study materials found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <tr key={m.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-500/5' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) setSelectedIds(selectedIds.filter((id) => id !== m.id));
                            else setSelectedIds([...selectedIds, m.id]);
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-indigo-400 shrink-0 mt-0.5">
                            {m.type === 'Video Link' ? <Video className="w-5 h-5 text-purple-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
                          </div>
                          <div>
                            <p className="font-bold text-white leading-snug">{m.title}</p>
                            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                              {m.fileSize} {m.pagesCount ? `• ${m.pagesCount} Pages` : ''} • Uploaded {m.uploadDate}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono">
                        <span className="font-extrabold text-amber-400 block">{m.courseCode || 'GST101'}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{m.universityName || 'FUL'}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 font-bold text-[10px] rounded-md">
                          {m.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                          m.accessLevel === 'Premium Only'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {m.accessLevel === 'Premium Only' ? <Crown className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {m.accessLevel}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-white">
                        {(m.totalDownloads || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setViewingMaterial(m)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-900/50 text-indigo-400 rounded-lg text-xs"
                          title="Edit Material"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg text-xs"
                          title="Delete Material"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-800 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- UPLOAD / EDIT MATERIAL MODAL --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingMaterial ? 'Edit Study Material' : 'Upload New Study Material'}
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Material Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MTH101 Calculus Summary Sheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">1. Select University</label>
                  <select
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
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
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
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
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
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
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-medium"
                  >
                    {availableCoursesForSelectedUni.length === 0 ? (
                      <option value="">No courses available for selected university</option>
                    ) : (
                      availableCoursesForSelectedUni.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Material Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Lecture Notes">Lecture Notes</option>
                    <option value="Video Link">Video Link</option>
                    <option value="Image">Image Diagram</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Subscription Access Tier</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-amber-400 font-bold"
                  >
                    <option value="Free Trial">Free Trial Available</option>
                    <option value="Premium Only">Premium Subscription Only</option>
                  </select>
                </div>
              </div>

              {type === 'Video Link' ? (
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Video Stream URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">Select File</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short explanation of topics covered in this material..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessingFile}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isProcessingFile ? 'Processing & Saving...' : editingMaterial ? 'Save Material Updates' : 'Upload Material to Firebase'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW MATERIAL DETAILS MODAL --- */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-sm">{viewingMaterial.title}</h3>
              <button onClick={() => setViewingMaterial(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                <p className="font-bold text-white">{viewingMaterial.courseCode} - {viewingMaterial.courseTitle}</p>
                <p className="text-[11px] text-slate-400">{viewingMaterial.universityName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block">Type</span>
                  <span className="font-bold text-white">{viewingMaterial.type}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block">Access Tier</span>
                  <span className="font-bold text-amber-400">{viewingMaterial.accessLevel}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block">Size</span>
                  <span className="font-bold text-white">{viewingMaterial.fileSize}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-500 block">Total Downloads</span>
                  <span className="font-bold text-emerald-400">{viewingMaterial.totalDownloads}</span>
                </div>
              </div>

              {viewingMaterial.description && (
                <p className="text-xs text-slate-400 leading-relaxed p-3 bg-slate-950 rounded-xl">
                  {viewingMaterial.description}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setViewingMaterial(null);
                  handleOpenEdit(viewingMaterial);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Edit Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
