import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  Building2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  FolderPlus,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FacultyGroup, DEFAULT_FACULTY_DEPARTMENTS } from '../../types';
import { StorageService } from '../../services/storage';

export const DepartmentManagementModule: React.FC = () => {
  const [facultyGroups, setFacultyGroups] = useState<FacultyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({});

  // Feedback Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals State
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState('');

  const [editingFaculty, setEditingFaculty] = useState<FacultyGroup | null>(null);
  const [editFacultyName, setEditFacultyName] = useState('');

  const [addDeptFacultyId, setAddDeptFacultyId] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');

  const [editingDept, setEditingDept] = useState<{ facultyId: string; deptName: string } | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptTargetFacultyId, setEditDeptTargetFacultyId] = useState('');

  const [deletingFaculty, setDeletingFaculty] = useState<FacultyGroup | null>(null);
  const [deletingDept, setDeletingDept] = useState<{ facultyId: string; deptName: string } | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = StorageService.getSignupFacultyGroups();
    setFacultyGroups(data);

    // Expand first 3 faculties by default
    const initialExpanded: Record<string, boolean> = {};
    data.forEach((fac, idx) => {
      initialExpanded[fac.id] = idx < 3;
    });
    setExpandedFaculties(initialExpanded);
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleExpand = (facultyId: string) => {
    setExpandedFaculties((prev) => ({
      ...prev,
      [facultyId]: !prev[facultyId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    facultyGroups.forEach((f) => {
      allExpanded[f.id] = true;
    });
    setExpandedFaculties(allExpanded);
  };

  const collapseAll = () => {
    setExpandedFaculties({});
  };

  // ================= ADD FACULTY =================
  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyName.trim()) return;

    const trimmed = newFacultyName.trim();
    if (facultyGroups.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('A faculty with this name already exists.', 'error');
      return;
    }

    const newFac: FacultyGroup = {
      id: `fac-custom-${Date.now()}`,
      name: trimmed,
      departments: [],
    };

    const updated = [...facultyGroups, newFac];
    setFacultyGroups(updated);
    StorageService.saveSignupFacultyGroups(updated);

    setExpandedFaculties((prev) => ({ ...prev, [newFac.id]: true }));
    setNewFacultyName('');
    setShowAddFacultyModal(false);
    showToast(`Faculty "${trimmed}" added successfully!`);
  };

  // ================= EDIT FACULTY =================
  const handleUpdateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty || !editFacultyName.trim()) return;

    const trimmed = editFacultyName.trim();
    const updated = facultyGroups.map((f) => {
      if (f.id === editingFaculty.id) {
        return { ...f, name: trimmed };
      }
      return f;
    });

    setFacultyGroups(updated);
    StorageService.saveSignupFacultyGroups(updated);

    setEditingFaculty(null);
    showToast(`Faculty renamed to "${trimmed}".`);
  };

  // ================= DELETE FACULTY =================
  const handleConfirmDeleteFaculty = () => {
    if (!deletingFaculty) return;

    const updated = facultyGroups.filter((f) => f.id !== deletingFaculty.id);
    setFacultyGroups(updated);
    StorageService.saveSignupFacultyGroups(updated);

    setDeletingFaculty(null);
    showToast(`Faculty "${deletingFaculty.name}" and all its departments removed.`, 'info');
  };

  // ================= ADD DEPARTMENT =================
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDeptFacultyId || !newDeptName.trim()) return;

    const trimmed = newDeptName.trim();
    const targetFac = facultyGroups.find((f) => f.id === addDeptFacultyId);

    if (targetFac && targetFac.departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      showToast('This department already exists in this faculty.', 'error');
      return;
    }

    const updated = facultyGroups.map((f) => {
      if (f.id === addDeptFacultyId) {
        return {
          ...f,
          departments: [...f.departments, trimmed].sort((a, b) => a.localeCompare(b)),
        };
      }
      return f;
    });

    setFacultyGroups(updated);
    StorageService.saveSignupFacultyGroups(updated);

    setNewDeptName('');
    setAddDeptFacultyId(null);
    showToast(`Department "${trimmed}" added successfully!`);
  };

  // ================= EDIT DEPARTMENT =================
  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName.trim()) return;

    const trimmedName = editDeptName.trim();
    const sourceFacId = editingDept.facultyId;
    const oldDeptName = editingDept.deptName;
    const targetFacId = editDeptTargetFacultyId || sourceFacId;

    let updated = facultyGroups.map((f) => {
      // Remove from source faculty
      if (f.id === sourceFacId) {
        return {
          ...f,
          departments: f.departments.filter((d) => d !== oldDeptName),
        };
      }
      return f;
    });

    // Add to target faculty with new name
    updated = updated.map((f) => {
      if (f.id === targetFacId) {
        const cleanedDepts = f.departments.filter((d) => d.toLowerCase() !== trimmedName.toLowerCase());
        return {
          ...f,
          departments: [...cleanedDepts, trimmedName].sort((a, b) => a.localeCompare(b)),
        };
      }
      return f;
    });

    setFacultyGroups(updated);
    StorageService.saveSignupFacultyGroups(updated);

    setEditingDept(null);
    showToast(`Department updated to "${trimmedName}".`);
  };

  // ================= DELETE DEPARTMENT =================
  const handleConfirmDeleteDept = () => {
    if (!deletingDept) return;

    const updated = facultyGroups.map((f) => {
      if (f.id === deletingDept.facultyId) {
        return {
          ...f,
          departments: f.departments.filter((d) => d !== deletingDept.deptName),
        };
      }
      return f;
    });

    setFacultyGroups(updated);
    StorageService.saveSignupFacultyGroups(updated);

    setDeletingDept(null);
    showToast(`Department "${deletingDept.deptName}" removed.`, 'info');
  };

  // ================= RESET TO DEFAULTS =================
  const handleResetToDefaults = () => {
    const defaults = StorageService.resetSignupFacultyGroups();
    setFacultyGroups(defaults);
    setShowResetConfirmModal(false);
    showToast('Reset to standard 17 faculties & departments catalog!', 'info');
  };

  // Filter logic based on search
  const filteredGroups = facultyGroups
    .map((fac) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return fac;

      const facultyMatches = fac.name.toLowerCase().includes(q);
      const matchingDepts = fac.departments.filter((dept) => dept.toLowerCase().includes(q));

      if (facultyMatches) return fac;
      if (matchingDepts.length > 0) {
        return {
          ...fac,
          departments: matchingDepts,
        };
      }
      return null;
    })
    .filter((f): f is FacultyGroup => f !== null);

  const totalDepartments = facultyGroups.reduce((acc, f) => acc + f.departments.length, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 border-rose-500/40 text-rose-200'
              : 'bg-indigo-950 border-indigo-500/40 text-indigo-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Sign-Up Faculties & Departments Manager
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Manage the exact faculties, courses, and departments presented to students during sign-up. Add new academic faculties, edit course titles, or remove departments in real-time.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 shrink-0">
            <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-center">
              <span className="block text-[10px] text-slate-400 font-medium uppercase">Faculties</span>
              <span className="text-base font-extrabold text-indigo-400">{facultyGroups.length}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <span className="block text-[10px] text-slate-400 font-medium uppercase">Departments</span>
              <span className="text-base font-extrabold text-emerald-400">{totalDepartments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty or department (e.g. Computer Science, Law, Nursing)..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddFacultyModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>

          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset catalog to standard 17 Faculties"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={expandAll}
            className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] rounded-lg border border-slate-800 cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] rounded-lg border border-slate-800 cursor-pointer"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Faculties List Grid */}
      {filteredGroups.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No matching faculties or departments found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query or click "Add Faculty" to introduce new academic departments to the sign-up list.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl hover:bg-indigo-600/30 cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((fac) => {
            const isExpanded = expandedFaculties[fac.id] || Boolean(searchQuery);

            return (
              <div
                key={fac.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-slate-700/80 shadow-md"
              >
                {/* Faculty Card Header */}
                <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(fac.id)}>
                    <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white tracking-wide truncate">
                        {fac.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="w-3 h-3 text-emerald-400" />
                        <span>{fac.departments.length} Departments / Courses</span>
                      </p>
                    </div>
                  </div>

                  {/* Faculty Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setAddDeptFacultyId(fac.id);
                        setNewDeptName('');
                      }}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="Add Department to this faculty"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Dept</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingFaculty(fac);
                        setEditFacultyName(fac.name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent hover:border-indigo-500/20 cursor-pointer"
                      title="Rename Faculty"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingFaculty(fac)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20 cursor-pointer"
                      title="Delete Faculty"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Departments Container */}
                {isExpanded && (
                  <div className="p-4 bg-slate-900/60 space-y-3">
                    {/* Inline Add Dept Form if active for this faculty */}
                    {addDeptFacultyId === fac.id && (
                      <form onSubmit={handleAddDepartment} className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
                        <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder={`Enter new department name for ${fac.name}...`}
                          className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Save Dept
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddDeptFacultyId(null)}
                          className="px-2.5 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </form>
                    )}

                    {fac.departments.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                        <p className="text-xs text-slate-500 italic">No departments under this faculty yet.</p>
                        <button
                          onClick={() => {
                            setAddDeptFacultyId(fac.id);
                            setNewDeptName('');
                          }}
                          className="mt-2 text-xs text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add First Department
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {fac.departments.map((dept) => (
                          <div
                            key={dept}
                            className="bg-slate-950 hover:bg-slate-950/90 border border-slate-800/90 hover:border-indigo-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2 group transition-all"
                          >
                            <span className="text-xs text-slate-200 font-medium truncate" title={dept}>
                              {dept}
                            </span>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingDept({ facultyId: fac.id, deptName: dept });
                                  setEditDeptName(dept);
                                  setEditDeptTargetFacultyId(fac.id);
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-all cursor-pointer"
                                title="Edit Department"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeletingDept({ facultyId: fac.id, deptName: dept })}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                                title="Remove Department"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: ADD FACULTY ================= */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                Add New Faculty
              </h3>
              <button onClick={() => setShowAddFacultyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="e.g. 18. Faculty of Renewable Energy & Solar Technology"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Create Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT FACULTY ================= */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Edit / Rename Faculty
              </h3>
              <button onClick={() => setEditingFaculty(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={editFacultyName}
                  onChange={(e) => setEditFacultyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DEPARTMENT ================= */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Edit / Move Department
              </h3>
              <button onClick={() => setEditingDept(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department / Course Title</label>
                <input
                  type="text"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Faculty</label>
                <select
                  value={editDeptTargetFacultyId}
                  onChange={(e) => setEditDeptTargetFacultyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {facultyGroups.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE FACULTY CONFIRMATION ================= */}
      {deletingFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Faculty?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">"{deletingFaculty.name}"</span>?
              This will also remove all <span className="text-rose-400 font-bold">{deletingFaculty.departments.length} departments</span> categorized under it from the sign-up list.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingFaculty(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFaculty}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
              >
                Yes, Delete Faculty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE DEPARTMENT CONFIRMATION ================= */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Remove Department?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Remove <span className="text-white font-bold">"{deletingDept.deptName}"</span> from the sign-up course options?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDept}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET DEFAULTS CONFIRMATION ================= */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Reset to Default 17 Faculties?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will reset the sign-up course catalog back to the official standard 17 Nigerian University faculties and their default department lists. Any custom faculties or departments added manually will be overwritten.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
              >
                Reset Catalog Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
