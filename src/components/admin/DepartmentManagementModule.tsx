import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  MoveRight,
  School,
  ArrowRight,
  Info,
  ListPlus,
  RefreshCw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Faculty,
  Department,
  University,
  Course,
  FacultyGroup,
  DEFAULT_FACULTY_DEPARTMENTS,
  FUL_DEPARTMENTS,
  FUAHSE_DEPARTMENTS,
} from '../../types';
import { StorageService } from '../../services/storage';
import { getFacultiesForUniversity, getDepartmentsForFaculty } from '../../utils/academicStructure';

interface DepartmentManagementModuleProps {
  universities?: University[];
  faculties?: Faculty[];
  departments?: Department[];
  courses?: Course[];
  onUpdateUniversities?: (unis: University[]) => void;
  onUpdateFaculties?: (facs: Faculty[]) => void;
  onUpdateDepartments?: (depts: Department[]) => void;
}

export const DepartmentManagementModule: React.FC<DepartmentManagementModuleProps> = ({
  universities = [],
  faculties: propFaculties,
  departments: propDepartments,
  courses = [],
  onUpdateFaculties,
  onUpdateDepartments,
}) => {
  // Navigation sub-tab: 'academic_hierarchy' vs 'signup_groups'
  const [activeTab, setActiveTab] = useState<'academic_hierarchy' | 'signup_groups'>('academic_hierarchy');

  // Academic Faculties & Departments State
  const [facultiesList, setFacultiesList] = useState<Faculty[]>(() => {
    return propFaculties && propFaculties.length > 0 ? propFaculties : StorageService.getFaculties();
  });
  const [departmentsList, setDepartmentsList] = useState<Department[]>(() => {
    return propDepartments && propDepartments.length > 0 ? propDepartments : StorageService.getDepartments();
  });

  // Universities list from props or storage
  const [allUniversities, setAllUniversities] = useState<University[]>(() => {
    return universities.length > 0 ? universities : StorageService.getUniversities();
  });

  // Sign-Up Faculty Groups State
  const [signupFacultyGroups, setSignupFacultyGroups] = useState<FacultyGroup[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>({});

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals State
  // 1. Add Faculty Modal
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyCode, setNewFacultyCode] = useState('');
  const [newFacultyUniId, setNewFacultyUniId] = useState('all');
  const [newFacultyDean, setNewFacultyDean] = useState('');
  const [newFacultyDescription, setNewFacultyDescription] = useState('');

  // 2. Edit Faculty Modal
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editFacultyName, setEditFacultyName] = useState('');
  const [editFacultyCode, setEditFacultyCode] = useState('');
  const [editFacultyUniId, setEditFacultyUniId] = useState('all');
  const [editFacultyDean, setEditFacultyDean] = useState('');
  const [editFacultyDescription, setEditFacultyDescription] = useState('');
  const [editFacultyStatus, setEditFacultyStatus] = useState<'Active' | 'Disabled'>('Active');

  // 3. Add Department Modal (Single)
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptFacultyId, setNewDeptFacultyId] = useState('');
  const [newDeptUniId, setNewDeptUniId] = useState('all');
  const [newDeptDuration, setNewDeptDuration] = useState<number>(4);
  const [newDeptHOD, setNewDeptHOD] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');
  const [syncNewDeptToSignup, setSyncNewDeptToSignup] = useState(true);

  // 4. Batch Add Departments Modal
  const [showBatchDeptModal, setShowBatchDeptModal] = useState(false);
  const [batchDeptFacultyId, setBatchDeptFacultyId] = useState('');
  const [batchDeptUniId, setBatchDeptUniId] = useState('all');
  const [batchDeptRawText, setBatchDeptRawText] = useState('');
  const [syncBatchToSignup, setSyncBatchToSignup] = useState(true);

  // 5. Edit Department Modal
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editDeptFacultyId, setEditDeptFacultyId] = useState('');
  const [editDeptUniId, setEditDeptUniId] = useState('all');
  const [editDeptDuration, setEditDeptDuration] = useState<number>(4);
  const [editDeptHOD, setEditDeptHOD] = useState('');
  const [editDeptDescription, setEditDeptDescription] = useState('');
  const [editDeptStatus, setEditDeptStatus] = useState<'Active' | 'Disabled'>('Active');

  // 6. Delete Confirmation Modals
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // 7. Seed / Populate Modals
  const [showSeedConfirmModal, setShowSeedConfirmModal] = useState(false);
  const [seedTargetUniId, setSeedTargetUniId] = useState('all');
  const [showResetSignupModal, setShowResetSignupModal] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Synchronize when prop changes
  useEffect(() => {
    if (propFaculties && propFaculties.length > 0) {
      setFacultiesList(propFaculties);
    }
  }, [propFaculties]);

  useEffect(() => {
    if (propDepartments && propDepartments.length > 0) {
      setDepartmentsList(propDepartments);
    }
  }, [propDepartments]);

  useEffect(() => {
    if (universities.length > 0) {
      setAllUniversities(universities);
    }
  }, [universities]);

  const loadAllData = () => {
    const loadedFacs = StorageService.getFaculties();
    const loadedDepts = StorageService.getDepartments();
    const loadedUnis = StorageService.getUniversities();
    const loadedSignupGroups = StorageService.getSignupFacultyGroups();

    setFacultiesList(loadedFacs);
    setDepartmentsList(loadedDepts);
    setAllUniversities(loadedUnis);
    setSignupFacultyGroups(loadedSignupGroups);

    // Expand all faculties by default for instant visibility
    const initialExpanded: Record<string, boolean> = {};
    loadedFacs.forEach((fac) => {
      initialExpanded[fac.id] = true;
    });
    setExpandedFaculties(initialExpanded);
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const toggleExpand = (facultyId: string) => {
    setExpandedFaculties((prev) => ({
      ...prev,
      [facultyId]: !prev[facultyId],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    facultiesList.forEach((f) => {
      allExp[f.id] = true;
    });
    setExpandedFaculties(allExp);
  };

  const collapseAll = () => {
    setExpandedFaculties({});
  };

  // Generate a clean acronym code from a name
  const generateCodeFromName = (name: string): string => {
    if (!name) return '';
    const cleaned = name
      .replace(/faculty of/gi, '')
      .replace(/department of/gi, '')
      .replace(/and/gi, '')
      .replace(/&/g, '')
      .trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase();
    }
    return words
      .map((w) => w[0])
      .join('')
      .substring(0, 5)
      .toUpperCase();
  };

  // =========================================================================
  // FACULTY ACTIONS (MANUAL INPUT)
  // =========================================================================

  const handleOpenAddFacultyModal = (presetUniId?: string) => {
    setNewFacultyName('');
    setNewFacultyCode('');
    setNewFacultyUniId(presetUniId || (selectedUniversityFilter !== 'all' ? selectedUniversityFilter : 'all'));
    setNewFacultyDean('');
    setNewFacultyDescription('');
    setShowAddFacultyModal(true);
  };

  const handleAddFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyName.trim()) {
      showToast('Please enter a valid Faculty name.', 'error');
      return;
    }

    const trimmedName = newFacultyName.trim();
    const uniId = newFacultyUniId || 'all';

    // Duplicate check for same university
    const exists = facultiesList.some(
      (f) =>
        f.universityId === uniId &&
        f.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      showToast(`A faculty with the name "${trimmedName}" already exists for this university.`, 'error');
      return;
    }

    const code = newFacultyCode.trim().toUpperCase() || generateCodeFromName(trimmedName) || 'FAC';
    const newFac: Faculty = {
      id: `fac-${uniId === 'all' ? 'gen' : uniId}-${Date.now()}`,
      universityId: uniId,
      name: trimmedName,
      code,
      deanName: newFacultyDean.trim() || undefined,
      description: newFacultyDescription.trim() || undefined,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const updatedFaculties = [...facultiesList, newFac];
    setFacultiesList(updatedFaculties);
    if (onUpdateFaculties) onUpdateFaculties(updatedFaculties);

    // Persist
    const saveResult = await StorageService.saveFaculties(updatedFaculties);
    if (!saveResult.success) {
      showToast(`Faculty saved locally, but cloud write encountered: ${saveResult.error}`, 'info');
    } else {
      showToast(`Faculty "${trimmedName}" created successfully!`);
    }

    // Auto-expand the new faculty
    setExpandedFaculties((prev) => ({ ...prev, [newFac.id]: true }));
    setShowAddFacultyModal(false);
  };

  const handleOpenEditFacultyModal = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setEditFacultyName(faculty.name);
    setEditFacultyCode(faculty.code || generateCodeFromName(faculty.name));
    setEditFacultyUniId(faculty.universityId || 'all');
    setEditFacultyDean(faculty.deanName || '');
    setEditFacultyDescription(faculty.description || '');
    setEditFacultyStatus(faculty.status || 'Active');
  };

  const handleUpdateFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty || !editFacultyName.trim()) return;

    const trimmedName = editFacultyName.trim();
    const code = editFacultyCode.trim().toUpperCase() || generateCodeFromName(trimmedName) || 'FAC';

    const updatedFaculties = facultiesList.map((f) => {
      if (f.id === editingFaculty.id) {
        return {
          ...f,
          name: trimmedName,
          code,
          universityId: editFacultyUniId,
          deanName: editFacultyDean.trim() || undefined,
          description: editFacultyDescription.trim() || undefined,
          status: editFacultyStatus,
        };
      }
      return f;
    });

    setFacultiesList(updatedFaculties);
    if (onUpdateFaculties) onUpdateFaculties(updatedFaculties);

    const saveResult = await StorageService.saveFaculties(updatedFaculties);
    if (!saveResult.success) {
      showToast(`Faculty updated locally: ${saveResult.error}`, 'info');
    } else {
      showToast(`Faculty "${trimmedName}" updated successfully!`);
    }

    setEditingFaculty(null);
  };

  const handleConfirmDeleteFaculty = async () => {
    if (!deletingFaculty) return;

    const facId = deletingFaculty.id;
    // Check if courses are attached to departments under this faculty
    const linkedDepts = departmentsList.filter((d) => d.facultyId === facId);
    const linkedDeptIds = new Set(linkedDepts.map((d) => d.id));
    const attachedCourses = courses.filter((c) => linkedDeptIds.has(c.departmentId));

    if (attachedCourses.length > 0) {
      showToast(
        `Cannot delete faculty: ${attachedCourses.length} active courses are linked to its departments. Please reassign or delete the courses first.`,
        'error'
      );
      setDeletingFaculty(null);
      return;
    }

    // Filter out faculty and its departments
    const updatedFaculties = facultiesList.filter((f) => f.id !== facId);
    const updatedDepts = departmentsList.filter((d) => d.facultyId !== facId);

    setFacultiesList(updatedFaculties);
    setDepartmentsList(updatedDepts);

    if (onUpdateFaculties) onUpdateFaculties(updatedFaculties);
    if (onUpdateDepartments) onUpdateDepartments(updatedDepts);

    await StorageService.deleteFaculty(facId);
    await StorageService.saveDepartments(updatedDepts);

    showToast(`Faculty "${deletingFaculty.name}" and its departments were removed.`, 'info');
    setDeletingFaculty(null);
  };

  const handleToggleFacultyStatus = async (faculty: Faculty) => {
    const newStatus = faculty.status === 'Disabled' ? 'Active' : 'Disabled';
    const updated = facultiesList.map((f) => (f.id === faculty.id ? { ...f, status: newStatus as 'Active' | 'Disabled' } : f));
    setFacultiesList(updated);
    if (onUpdateFaculties) onUpdateFaculties(updated);
    await StorageService.saveFaculties(updated);
    showToast(`Faculty status changed to ${newStatus}.`);
  };

  // =========================================================================
  // DEPARTMENT ACTIONS (MANUAL INPUT)
  // =========================================================================

  const handleOpenAddDeptModal = (presetFacultyId?: string, presetUniId?: string) => {
    const targetFac = facultiesList.find((f) => f.id === presetFacultyId) || facultiesList[0];
    setNewDeptName('');
    setNewDeptCode('');
    setNewDeptFacultyId(presetFacultyId || (targetFac ? targetFac.id : ''));
    setNewDeptUniId(presetUniId || (targetFac ? targetFac.universityId : 'all'));
    setNewDeptDuration(4);
    setNewDeptHOD('');
    setNewDeptDescription('');
    setSyncNewDeptToSignup(true);
    setShowAddDeptModal(true);
  };

  const handleAddDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptFacultyId) {
      showToast('Please specify a Department Name and Parent Faculty.', 'error');
      return;
    }

    const trimmedName = newDeptName.trim();
    const parentFac = facultiesList.find((f) => f.id === newDeptFacultyId);
    const uniId = newDeptUniId || (parentFac ? parentFac.universityId : 'all');

    // Duplicate check
    const exists = departmentsList.some(
      (d) =>
        d.facultyId === newDeptFacultyId &&
        d.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      showToast(`Department "${trimmedName}" already exists under this faculty.`, 'error');
      return;
    }

    const code = newDeptCode.trim().toUpperCase() || generateCodeFromName(trimmedName) || 'DPT';
    const newDept: Department = {
      id: `dept-${uniId === 'all' ? 'gen' : uniId}-${Date.now()}`,
      facultyId: newDeptFacultyId,
      universityId: uniId,
      name: trimmedName,
      code,
      durationYears: Number(newDeptDuration) || 4,
      headOfDepartment: newDeptHOD.trim() || undefined,
      description: newDeptDescription.trim() || undefined,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const updatedDepts = [...departmentsList, newDept];
    setDepartmentsList(updatedDepts);
    if (onUpdateDepartments) onUpdateDepartments(updatedDepts);

    const saveResult = await StorageService.saveDepartments(updatedDepts);
    if (!saveResult.success) {
      showToast(`Department saved locally: ${saveResult.error}`, 'info');
    } else {
      showToast(`Department "${trimmedName}" (${code}) added successfully!`);
    }

    // Optionally sync to signup registration catalog
    if (syncNewDeptToSignup && parentFac) {
      syncDepartmentToSignupCatalog(parentFac.name, trimmedName);
    }

    setShowAddDeptModal(false);
  };

  // Batch Department Addition
  const handleOpenBatchDeptModal = (presetFacultyId?: string) => {
    const targetFac = facultiesList.find((f) => f.id === presetFacultyId) || facultiesList[0];
    setBatchDeptFacultyId(presetFacultyId || (targetFac ? targetFac.id : ''));
    setBatchDeptUniId(targetFac ? targetFac.universityId : 'all');
    setBatchDeptRawText('');
    setSyncBatchToSignup(true);
    setShowBatchDeptModal(true);
  };

  const handleBatchAddDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchDeptFacultyId || !batchDeptRawText.trim()) {
      showToast('Please provide department names and select a faculty.', 'error');
      return;
    }

    const parentFac = facultiesList.find((f) => f.id === batchDeptFacultyId);
    const uniId = batchDeptUniId || (parentFac ? parentFac.universityId : 'all');

    // Parse department lines / commas
    const rawLines = batchDeptRawText
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rawLines.length === 0) {
      showToast('No valid department names detected.', 'error');
      return;
    }

    const newCreatedDepts: Department[] = [];
    const existingNames = new Set(
      departmentsList
        .filter((d) => d.facultyId === batchDeptFacultyId)
        .map((d) => d.name.toLowerCase())
    );

    let skippedCount = 0;
    rawLines.forEach((rawName, index) => {
      // Remove any leading numbers like "1. Computer Science"
      const cleanName = rawName.replace(/^\d+[\.\-\)]\s*/, '').trim();
      if (!cleanName || existingNames.has(cleanName.toLowerCase())) {
        skippedCount++;
        return;
      }

      existingNames.add(cleanName.toLowerCase());
      const code = generateCodeFromName(cleanName) || `DPT${index + 1}`;
      newCreatedDepts.push({
        id: `dept-${uniId === 'all' ? 'gen' : uniId}-${Date.now()}-${index}`,
        facultyId: batchDeptFacultyId,
        universityId: uniId,
        name: cleanName,
        code,
        durationYears: 4,
        status: 'Active',
        createdAt: new Date().toISOString(),
      });
    });

    if (newCreatedDepts.length === 0) {
      showToast('All entered departments already exist under this faculty.', 'info');
      return;
    }

    const updatedDepts = [...departmentsList, ...newCreatedDepts];
    setDepartmentsList(updatedDepts);
    if (onUpdateDepartments) onUpdateDepartments(updatedDepts);

    await StorageService.saveDepartments(updatedDepts);

    // Sync to signup catalog if requested
    if (syncBatchToSignup && parentFac) {
      newCreatedDepts.forEach((d) => {
        syncDepartmentToSignupCatalog(parentFac.name, d.name);
      });
    }

    showToast(
      `Batch completed: ${newCreatedDepts.length} departments added successfully! ${
        skippedCount > 0 ? `(${skippedCount} skipped as duplicates)` : ''
      }`
    );
    setShowBatchDeptModal(false);
  };

  const handleOpenEditDeptModal = (department: Department) => {
    setEditingDept(department);
    setEditDeptName(department.name);
    setEditDeptCode(department.code || generateCodeFromName(department.name));
    setEditDeptFacultyId(department.facultyId);
    setEditDeptUniId(department.universityId || 'all');
    setEditDeptDuration(department.durationYears || 4);
    setEditDeptHOD(department.headOfDepartment || '');
    setEditDeptDescription(department.description || '');
    setEditDeptStatus(department.status || 'Active');
  };

  const handleUpdateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName.trim() || !editDeptFacultyId) return;

    const trimmedName = editDeptName.trim();
    const code = editDeptCode.trim().toUpperCase() || generateCodeFromName(trimmedName) || 'DPT';

    const updatedDepts = departmentsList.map((d) => {
      if (d.id === editingDept.id) {
        return {
          ...d,
          name: trimmedName,
          code,
          facultyId: editDeptFacultyId,
          universityId: editDeptUniId,
          durationYears: Number(editDeptDuration) || 4,
          headOfDepartment: editDeptHOD.trim() || undefined,
          description: editDeptDescription.trim() || undefined,
          status: editDeptStatus,
        };
      }
      return d;
    });

    setDepartmentsList(updatedDepts);
    if (onUpdateDepartments) onUpdateDepartments(updatedDepts);

    const saveResult = await StorageService.saveDepartments(updatedDepts);
    if (!saveResult.success) {
      showToast(`Department updated locally: ${saveResult.error}`, 'info');
    } else {
      showToast(`Department "${trimmedName}" updated successfully!`);
    }

    setEditingDept(null);
  };

  const handleConfirmDeleteDept = async () => {
    if (!deletingDept) return;

    const deptId = deletingDept.id;
    // Check if courses are attached
    const attachedCourses = courses.filter((c) => c.departmentId === deptId);
    if (attachedCourses.length > 0) {
      showToast(
        `Cannot delete department: ${attachedCourses.length} active courses belong to "${deletingDept.name}". Reassign or delete those courses first.`,
        'error'
      );
      setDeletingDept(null);
      return;
    }

    const updatedDepts = departmentsList.filter((d) => d.id !== deptId);
    setDepartmentsList(updatedDepts);
    if (onUpdateDepartments) onUpdateDepartments(updatedDepts);

    await StorageService.deleteDepartment(deptId);
    showToast(`Department "${deletingDept.name}" removed successfully.`, 'info');
    setDeletingDept(null);
  };

  // Helper to sync to Signup Faculty Groups
  const syncDepartmentToSignupCatalog = (facultyName: string, deptName: string) => {
    try {
      const groups = StorageService.getSignupFacultyGroups();
      const cleanFac = facultyName.replace(/^\d+[\.\-\)]\s*/, '').trim().toLowerCase();

      let matched = false;
      const updated = groups.map((g) => {
        const gNameClean = g.name.replace(/^\d+[\.\-\)]\s*/, '').trim().toLowerCase();
        if (gNameClean.includes(cleanFac) || cleanFac.includes(gNameClean)) {
          matched = true;
          if (!g.departments.some((d) => d.toLowerCase() === deptName.toLowerCase())) {
            return {
              ...g,
              departments: [...g.departments, deptName].sort((a, b) => a.localeCompare(b)),
            };
          }
        }
        return g;
      });

      if (!matched) {
        // Create new signup group
        updated.push({
          id: `fac-custom-${Date.now()}`,
          name: facultyName,
          departments: [deptName],
        });
      }

      setSignupFacultyGroups(updated);
      StorageService.saveSignupFacultyGroups(updated);
    } catch (e) {
      console.warn('Signup catalog sync note:', e);
    }
  };

  // =========================================================================
  // POPULATE NUC STANDARD FACULTIES & DEPARTMENTS SEED
  // =========================================================================
  const handlePopulateStandardCatalog = async () => {
    const targetUni = seedTargetUniId;
    const standardFacs = getFacultiesForUniversity(targetUni, []);
    const newFacsToAdd: Faculty[] = [];
    const newDeptsToAdd: Department[] = [];

    standardFacs.forEach((stdFac, fIdx) => {
      const facId = `fac-${targetUni === 'all' ? 'std' : targetUni}-${fIdx + 1}`;
      const facCode = generateCodeFromName(stdFac.name);

      newFacsToAdd.push({
        id: facId,
        universityId: targetUni,
        name: stdFac.name,
        code: facCode,
        status: 'Active',
        createdAt: new Date().toISOString(),
      });

      // Get standard departments
      const standardDepts = getDepartmentsForFaculty(stdFac.id, targetUni, [], [stdFac]);
      standardDepts.forEach((stdDept, dIdx) => {
        newDeptsToAdd.push({
          id: `dept-${targetUni === 'all' ? 'std' : targetUni}-${fIdx + 1}-${dIdx + 1}`,
          facultyId: facId,
          universityId: targetUni,
          name: stdDept.name,
          code: generateCodeFromName(stdDept.name) || `DPT${dIdx + 1}`,
          durationYears: 4,
          status: 'Active',
          createdAt: new Date().toISOString(),
        });
      });
    });

    // Merge or replace
    const combinedFacs = [
      ...facultiesList.filter((f) => f.universityId !== targetUni),
      ...newFacsToAdd,
    ];
    const combinedDepts = [
      ...departmentsList.filter((d) => d.universityId !== targetUni),
      ...newDeptsToAdd,
    ];

    setFacultiesList(combinedFacs);
    setDepartmentsList(combinedDepts);

    if (onUpdateFaculties) onUpdateFaculties(combinedFacs);
    if (onUpdateDepartments) onUpdateDepartments(combinedDepts);

    await StorageService.saveFaculties(combinedFacs);
    await StorageService.saveDepartments(combinedDepts);

    const uniName =
      targetUni === 'all'
        ? 'All General Institutions'
        : allUniversities.find((u) => u.id === targetUni)?.name || targetUni;

    showToast(`Successfully populated standard NUC faculties & departments for ${uniName}!`);
    setShowSeedConfirmModal(false);

    // Expand all newly populated faculties
    const allExp: Record<string, boolean> = { ...expandedFaculties };
    newFacsToAdd.forEach((f) => {
      allExp[f.id] = true;
    });
    setExpandedFaculties(allExp);
  };

  // =========================================================================
  // EXPORT TO CSV
  // =========================================================================
  const handleExportCSV = () => {
    const rows = [
      ['University Code', 'University Name', 'Faculty Code', 'Faculty Name', 'Department Code', 'Department Name', 'Duration (Years)', 'Status'],
    ];

    facultiesList.forEach((fac) => {
      const uni = allUniversities.find((u) => u.id === fac.universityId);
      const uniCode = uni ? uni.abbreviation : fac.universityId === 'all' ? 'ALL' : fac.universityId;
      const uniName = uni ? uni.name : fac.universityId === 'all' ? 'All Universities' : fac.universityId;
      const depts = departmentsList.filter((d) => d.facultyId === fac.id);

      if (depts.length === 0) {
        rows.push([uniCode, uniName, fac.code || '', fac.name, '', '(No Departments)', '', fac.status || 'Active']);
      } else {
        depts.forEach((dept) => {
          rows.push([
            uniCode,
            uniName,
            fac.code || '',
            fac.name,
            dept.code || '',
            dept.name,
            String(dept.durationYears || 4),
            dept.status || 'Active',
          ]);
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CBT_Master_Faculties_And_Departments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Academic Catalog CSV successfully!');
  };

  // =========================================================================
  // FILTERING & DERIVED DATA
  // =========================================================================

  const filteredFaculties = useMemo(() => {
    return facultiesList.filter((fac) => {
      // University filter
      if (selectedUniversityFilter !== 'all') {
        if (fac.universityId !== 'all' && fac.universityId !== selectedUniversityFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'active' && fac.status === 'Disabled') return false;
      if (statusFilter === 'disabled' && fac.status !== 'Disabled') return false;

      // Search Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const facMatches =
        fac.name.toLowerCase().includes(q) ||
        (fac.code && fac.code.toLowerCase().includes(q)) ||
        (fac.deanName && fac.deanName.toLowerCase().includes(q));

      if (facMatches) return true;

      // Check if any child departments match
      const childDepts = departmentsList.filter((d) => d.facultyId === fac.id);
      return childDepts.some(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.code && d.code.toLowerCase().includes(q)) ||
          (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(q))
      );
    });
  }, [facultiesList, departmentsList, selectedUniversityFilter, statusFilter, searchQuery]);

  // Total stats
  const totalFacultiesCount = facultiesList.length;
  const totalDepartmentsCount = departmentsList.length;
  const activeFacultiesCount = facultiesList.filter((f) => f.status !== 'Disabled').length;
  const universitiesWithFaculties = new Set(facultiesList.map((f) => f.universityId)).size;

  return (
    <div className="space-y-6" id="faculties-departments-module">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-sky-950/95 border-sky-500/50 text-sky-200'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toastMessage.type === 'info' ? (
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold leading-relaxed">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Live Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Faculties</span>
              <p className="text-2xl font-black text-white mt-1">{totalFacultiesCount}</p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                {activeFacultiesCount} Active ({facultiesList.length - activeFacultiesCount} Disabled)
              </span>
            </div>
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Departments</span>
              <p className="text-2xl font-black text-white mt-1">{totalDepartmentsCount}</p>
              <span className="text-[10px] text-indigo-400 font-semibold mt-0.5 block">
                ~{totalFacultiesCount > 0 ? (totalDepartmentsCount / totalFacultiesCount).toFixed(1) : 0} Depts per Faculty
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Universities Covered</span>
              <p className="text-2xl font-black text-white mt-1">{universitiesWithFaculties}</p>
              <span className="text-[10px] text-amber-400 font-semibold mt-0.5 block">
                Across {allUniversities.length} Institutions
              </span>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Connected Courses</span>
              <p className="text-2xl font-black text-white mt-1">{courses.length}</p>
              <span className="text-[10px] text-sky-400 font-semibold mt-0.5 block">Live in CBT Engine</span>
            </div>
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation & Operational Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        {/* Upper Action Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('academic_hierarchy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'academic_hierarchy'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Academic Hierarchy & Manual Entry</span>
            </button>

            <button
              onClick={() => setActiveTab('signup_groups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'signup_groups'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Sign-Up Registration Catalog ({signupFacultyGroups.length || 17})</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAddFacultyModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
              id="btn-add-faculty-manual"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Faculty Manually</span>
            </button>

            <button
              onClick={() => handleOpenAddDeptModal()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
              id="btn-add-dept-manual"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Input Department Manually</span>
            </button>

            <button
              onClick={() => handleOpenBatchDeptModal()}
              className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Bulk paste multiple department names at once"
            >
              <ListPlus className="w-4 h-4" />
              <span>Batch Input</span>
            </button>

            <button
              onClick={() => setShowSeedConfirmModal(true)}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
              title="Populate Standard NUC accredited faculties and departments catalog"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>NUC Standards</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              title="Export all faculties and departments to CSV spreadsheet"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lower Search & Filtering Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculties, departments, codes (e.g. Science, FSC, Computer Science, CSC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* University Selector Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedUniversityFilter}
              onChange={(e) => setSelectedUniversityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Universities ({allUniversities.length})</option>
              {allUniversities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.abbreviation})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>

          {/* Expand/Collapse All Buttons */}
          <div className="sm:col-span-1 flex justify-end gap-1">
            <button
              onClick={expandAll}
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-[11px] font-bold"
              title="Expand All Faculties"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={collapseAll}
              className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 text-[11px] font-bold"
              title="Collapse All Faculties"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content: ACADEMIC HIERARCHY VIEW */}
      {activeTab === 'academic_hierarchy' && (
        <div className="space-y-4">
          {filteredFaculties.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">No Faculties Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {searchQuery
                    ? `No faculties or departments matching query "${searchQuery}".`
                    : 'No faculties are registered yet for the selected university filter.'}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => handleOpenAddFacultyModal()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input First Faculty Manually</span>
                </button>
                <button
                  onClick={() => setShowSeedConfirmModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Populate Standard NUC Tree</span>
                </button>
              </div>
            </div>
          ) : (
            filteredFaculties.map((fac) => {
              const isExpanded = !!expandedFaculties[fac.id];
              const facDepts = departmentsList.filter((d) => d.facultyId === fac.id);
              const uni = allUniversities.find((u) => u.id === fac.universityId);
              const uniLabel = uni ? `${uni.name} (${uni.abbreviation})` : fac.universityId === 'all' ? 'All General Universities' : fac.universityId;

              // Total courses under this faculty
              const facDeptIds = new Set(facDepts.map((d) => d.id));
              const facCoursesCount = courses.filter((c) => facDeptIds.has(c.departmentId)).length;

              return (
                <div
                  key={fac.id}
                  className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 shadow-xl ${
                    fac.status === 'Disabled'
                      ? 'border-slate-800 opacity-75'
                      : isExpanded
                      ? 'border-indigo-500/50 ring-1 ring-indigo-500/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Faculty Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60">
                    <div className="flex items-start gap-3.5 flex-1 cursor-pointer" onClick={() => toggleExpand(fac.id)}>
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-white text-sm sm:text-base hover:text-indigo-300 transition-colors">
                            {fac.name}
                          </h3>
                          {fac.code && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono font-bold text-[10px] rounded-lg border border-amber-500/30">
                              {fac.code}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                              fac.status !== 'Disabled'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {fac.status !== 'Disabled' ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <School className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{uniLabel}</span>
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-300">
                            {facDepts.length} {facDepts.length === 1 ? 'Department' : 'Departments'}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-300">
                            {facCoursesCount} {facCoursesCount === 1 ? 'Linked Course' : 'Linked Courses'}
                          </span>
                          {fac.deanName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 font-medium">Dean: {fac.deanName}</span>
                            </>
                          )}
                        </div>

                        {fac.description && (
                          <p className="text-[11px] text-slate-400 italic line-clamp-1">{fac.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Faculty Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <button
                        onClick={() => handleOpenAddDeptModal(fac.id, fac.universityId)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Add department under this faculty"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Dept</span>
                      </button>

                      <button
                        onClick={() => handleOpenBatchDeptModal(fac.id)}
                        className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Batch paste departments"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>Batch</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditFacultyModal(fac)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs cursor-pointer"
                        title="Edit Faculty Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleFacultyStatus(fac)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border cursor-pointer ${
                          fac.status !== 'Disabled'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title={fac.status !== 'Disabled' ? 'Disable Faculty' : 'Enable Faculty'}
                      >
                        {fac.status !== 'Disabled' ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        onClick={() => setDeletingFaculty(fac)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs cursor-pointer"
                        title="Delete Faculty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleExpand(fac.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Department List Container */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 space-y-3">
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-emerald-400" />
                          <span>
                            Departments under {fac.name} ({facDepts.length})
                          </span>
                        </span>

                        <button
                          onClick={() => handleOpenAddDeptModal(fac.id, fac.universityId)}
                          className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Manual Add Dept</span>
                        </button>
                      </div>

                      {facDepts.length === 0 ? (
                        <div className="bg-slate-950 p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
                          <p className="text-xs text-slate-400 font-medium">
                            No departments registered in this faculty yet.
                          </p>
                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              onClick={() => handleOpenAddDeptModal(fac.id, fac.universityId)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
                            >
                              + Input Department Manually
                            </button>
                            <button
                              onClick={() => handleOpenBatchDeptModal(fac.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg"
                            >
                              ⚡ Batch Paste
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {facDepts.map((dept) => {
                            const deptCourses = courses.filter((c) => c.departmentId === dept.id);
                            return (
                              <div
                                key={dept.id}
                                className={`p-3 bg-slate-950 border rounded-xl flex items-center justify-between gap-2 hover:border-slate-700 transition-all ${
                                  dept.status === 'Disabled' ? 'opacity-60 border-slate-800' : 'border-slate-800/80'
                                }`}
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-white text-xs truncate" title={dept.name}>
                                      {dept.name}
                                    </p>
                                    {dept.code && (
                                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 font-mono font-bold text-[9px] rounded border border-indigo-500/30 shrink-0">
                                        {dept.code}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>{dept.durationYears || 4}-Year Program</span>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-semibold">{deptCourses.length} Courses</span>
                                    {dept.headOfDepartment && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-[90px]" title={dept.headOfDepartment}>
                                          HOD: {dept.headOfDepartment}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenEditDeptModal(dept)}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer"
                                    title="Edit Department"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setDeletingDept(dept)}
                                    className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs cursor-pointer"
                                    title="Delete Department"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Secondary View: SIGN-UP REGISTRATION CATALOG VIEW */}
      {activeTab === 'signup_groups' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Student Registration Sign-Up Catalog</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These {signupFacultyGroups.length} faculty groups & department lists appear directly in the student registration modal dropdown.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetSignupModal(true)}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Standard 17 Groups</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signupFacultyGroups.map((group) => (
              <div key={group.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-xs sm:text-sm text-indigo-300">{group.name}</h4>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/30">
                    {group.departments.length} Depts
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {group.departments.map((deptName, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg"
                    >
                      {deptName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD FACULTY (MANUAL INPUT)                                      */}
      {/* ========================================================================= */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Input New Faculty Manually</h3>
                  <p className="text-xs text-slate-400">Add an academic faculty to the institution hierarchy</p>
                </div>
              </div>
              <button onClick={() => setShowAddFacultyModal(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFacultySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Target University <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={newFacultyUniId}
                  onChange={(e) => setNewFacultyUniId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All General Universities (Global Faculty)</option>
                  {allUniversities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Faculty Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Faculty of Engineering and Technology"
                  value={newFacultyName}
                  onChange={(e) => {
                    setNewFacultyName(e.target.value);
                    if (!newFacultyCode) {
                      setNewFacultyCode(generateCodeFromName(e.target.value));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Faculty Code (Abbreviation)</label>
                  <input
                    type="text"
                    placeholder="e.g. FET"
                    value={newFacultyCode}
                    onChange={(e) => setNewFacultyCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Dean / Faculty Head (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. O. B. Adeyemi"
                    value={newFacultyDean}
                    onChange={(e) => setNewFacultyDean(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description / Overview (Optional)</label>
                <textarea
                  placeholder="e.g. Encompasses engineering disciplines including Civil, Electrical, and Mechanical."
                  value={newFacultyDescription}
                  onChange={(e) => setNewFacultyDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFacultyModal(false)}
                  className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Faculty Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT FACULTY                                                    */}
      {/* ========================================================================= */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Edit Faculty Record</h3>
                  <p className="text-xs text-slate-400">Update faculty name, code, or assigned university</p>
                </div>
              </div>
              <button onClick={() => setEditingFaculty(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateFacultySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={editFacultyName}
                  onChange={(e) => setEditFacultyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Faculty Code</label>
                  <input
                    type="text"
                    value={editFacultyCode}
                    onChange={(e) => setEditFacultyCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={editFacultyStatus}
                    onChange={(e) => setEditFacultyStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned University</label>
                <select
                  value={editFacultyUniId}
                  onChange={(e) => setEditFacultyUniId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All General Universities</option>
                  {allUniversities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Dean Name (Optional)</label>
                <input
                  type="text"
                  value={editFacultyDean}
                  onChange={(e) => setEditFacultyDean(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description (Optional)</label>
                <textarea
                  value={editFacultyDescription}
                  onChange={(e) => setEditFacultyDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Faculty Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD DEPARTMENT (SINGLE MANUAL INPUT)                              */}
      {/* ========================================================================= */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Input New Department Manually</h3>
                  <p className="text-xs text-slate-400">Add an academic department under a parent faculty</p>
                </div>
              </div>
              <button onClick={() => setShowAddDeptModal(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeptSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Parent Faculty <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={newDeptFacultyId}
                    onChange={(e) => {
                      setNewDeptFacultyId(e.target.value);
                      const f = facultiesList.find((fac) => fac.id === e.target.value);
                      if (f) setNewDeptUniId(f.universityId);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="">Select Faculty...</option>
                    {facultiesList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.code ? `(${f.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">University Assignment</label>
                  <select
                    value={newDeptUniId}
                    onChange={(e) => setNewDeptUniId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">All Universities</option>
                    {allUniversities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Department Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & Software Engineering"
                  value={newDeptName}
                  onChange={(e) => {
                    setNewDeptName(e.target.value);
                    if (!newDeptCode) {
                      setNewDeptCode(generateCodeFromName(e.target.value));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Department Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CSC"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Program Duration (Years)</label>
                  <select
                    value={newDeptDuration}
                    onChange={(e) => setNewDeptDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={4}>4-Year Bachelor's Degree</option>
                    <option value={5}>5-Year Degree (Engineering, Law, Pharmacy)</option>
                    <option value={6}>6-Year Degree (Medicine / Surgery)</option>
                    <option value={3}>3-Year Diploma / Direct Entry</option>
                    <option value={2}>2-Year Master's / Postgraduate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Head of Department (HOD) (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. K. Mohammed"
                  value={newDeptHOD}
                  onChange={(e) => setNewDeptHOD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Core curriculum covering algorithms, network architectures, and software design."
                  value={newDeptDescription}
                  onChange={(e) => setNewDeptDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sync-signup-check"
                  checked={syncNewDeptToSignup}
                  onChange={(e) => setSyncNewDeptToSignup(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sync-signup-check" className="text-xs text-slate-300 cursor-pointer">
                  Also add to Student Registration Sign-Up dropdown catalog
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Department Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BATCH ADD DEPARTMENTS                                           */}
      {/* ========================================================================= */}
      {showBatchDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 w-full max-w-xl rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Batch Input Multiple Departments</h3>
                  <p className="text-xs text-slate-400">Quickly paste or type multiple department names</p>
                </div>
              </div>
              <button onClick={() => setShowBatchDeptModal(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchAddDeptSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Select Target Faculty <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={batchDeptFacultyId}
                    onChange={(e) => setBatchDeptFacultyId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                    required
                  >
                    <option value="">Choose Faculty...</option>
                    {facultiesList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.code ? `(${f.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">University</label>
                  <select
                    value={batchDeptUniId}
                    onChange={(e) => setBatchDeptUniId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">All Universities</option>
                    {allUniversities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Department Names (One per line or comma-separated) <span className="text-purple-400">*</span>
                </label>
                <textarea
                  placeholder={`Computer Science\nSoftware Engineering\nCybersecurity\nInformation Technology\nArtificial Intelligence & Data Science`}
                  value={batchDeptRawText}
                  onChange={(e) => setBatchDeptRawText(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Department codes will be automatically generated from initials. Duplicates under the same faculty are skipped.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sync-batch-signup"
                  checked={syncBatchToSignup}
                  onChange={(e) => setSyncBatchToSignup(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sync-batch-signup" className="text-xs text-slate-300 cursor-pointer">
                  Sync all added departments to Student Sign-up catalog
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeptModal(false)}
                  className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Create All Departments</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT DEPARTMENT                                                 */}
      {/* ========================================================================= */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Edit Department Record</h3>
                  <p className="text-xs text-slate-400">Update department details or reassign parent faculty</p>
                </div>
              </div>
              <button onClick={() => setEditingDept(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDeptSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Department Name</label>
                <input
                  type="text"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Department Code</label>
                  <input
                    type="text"
                    value={editDeptCode}
                    onChange={(e) => setEditDeptCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={editDeptStatus}
                    onChange={(e) => setEditDeptStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Parent Faculty</label>
                  <select
                    value={editDeptFacultyId}
                    onChange={(e) => setEditDeptFacultyId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  >
                    {facultiesList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Duration (Years)</label>
                  <select
                    value={editDeptDuration}
                    onChange={(e) => setEditDeptDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={4}>4-Year Program</option>
                    <option value={5}>5-Year Program</option>
                    <option value={6}>6-Year Program</option>
                    <option value={3}>3-Year Program</option>
                    <option value={2}>2-Year Program</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">HOD Name (Optional)</label>
                <input
                  type="text"
                  value={editDeptHOD}
                  onChange={(e) => setEditDeptHOD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description (Optional)</label>
                <textarea
                  value={editDeptDescription}
                  onChange={(e) => setEditDeptDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE FACULTY CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {deletingFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Delete Faculty?</h3>
                <p className="text-xs text-rose-300 font-semibold mt-0.5">{deletingFaculty.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Deleting this faculty will remove it and all of its associated departments from both local cache and Cloud Firestore.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingFaculty(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteFaculty}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: DELETE DEPARTMENT CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Delete Department?</h3>
                <p className="text-xs text-rose-300 font-semibold mt-0.5">{deletingDept.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Are you sure you want to delete this department? This operation cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteDept}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Department</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: POPULATE NUC STANDARD FACULTIES SEED CONFIRMATION                */}
      {/* ========================================================================= */}
      {showSeedConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Populate NUC Standard Catalog</h3>
                  <p className="text-xs text-slate-400">Inject verified Nigerian standard faculties & departments</p>
                </div>
              </div>
              <button onClick={() => setShowSeedConfirmModal(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed font-medium">
                Select the institution you would like to populate standard accredited faculties and departments for:
              </p>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Target University</label>
                <select
                  value={seedTargetUniId}
                  onChange={(e) => setSeedTargetUniId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All General Institutions (Global Template)</option>
                  {allUniversities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] leading-relaxed">
                ℹ️ Standard NUC faculties include: Faculty of Science, Allied Health Sciences, Computing & IT, Engineering, Arts, Social Sciences, Basic Medical Sciences, Education, Agriculture, and Management.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSeedConfirmModal(false)}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePopulateStandardCatalog}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-lg shadow-amber-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Populate Standard Tree</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: RESET SIGNUP REGISTRATION CATALOG CONFIRMATION                   */}
      {/* ========================================================================= */}
      {showResetSignupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Reset Sign-Up Catalog?</h3>
                <p className="text-xs text-rose-300 font-semibold mt-0.5">Restore standard 17 Faculty Groups</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              This will reset the student sign-up dropdown catalog back to the factory 17 Nigerian university faculty groups and department lists.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetSignupModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const defaults = StorageService.resetSignupFacultyGroups();
                  setSignupFacultyGroups(defaults);
                  setShowResetSignupModal(false);
                  showToast('Restored 17 standard faculty groups to registration catalog.');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
