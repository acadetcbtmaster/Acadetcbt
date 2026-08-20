import React, { useMemo, useEffect } from 'react';
import {
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Course, Department, Faculty, University } from '../../types';
import {
  ACADEMIC_LEVELS,
  ACADEMIC_SEMESTERS,
  getFacultiesForUniversity,
  getDepartmentsForFaculty,
  getCoursesForHierarchy,
  normalizeLevel,
  normalizeSemester,
} from '../../utils/academicStructure';

export interface AcademicHierarchyValues {
  universityId: string;
  facultyId: string;
  departmentId: string;
  level: string;
  semester: string;
  courseId: string;
}

export interface AcademicHierarchySelectorProps {
  universities: University[];
  faculties?: Faculty[];
  departments?: Department[];
  courses: Course[];
  values: AcademicHierarchyValues;
  onChange: (updated: AcademicHierarchyValues) => void;
  mode?: 'form' | 'filter'; // 'form' requires specific choices, 'filter' has 'all' options
  layout?: 'grid-2' | 'grid-3' | 'grid-6' | 'stack';
  theme?: 'dark' | 'light';
  disabled?: boolean;
  hideBreadcrumb?: boolean;
  className?: string;
  courseLabel?: string;
}

export const AcademicHierarchySelector: React.FC<AcademicHierarchySelectorProps> = ({
  universities,
  faculties = [],
  departments = [],
  courses,
  values,
  onChange,
  mode = 'form',
  layout = 'grid-3',
  theme = 'dark',
  disabled = false,
  hideBreadcrumb = false,
  className = '',
  courseLabel = '6. Target Course',
}) => {
  const isFilter = mode === 'filter';
  const isDark = theme === 'dark';

  // 1. Available Faculties based on chosen University
  const availableFaculties = useMemo(() => {
    return getFacultiesForUniversity(values.universityId, faculties);
  }, [values.universityId, faculties]);

  // 2. Available Departments based on chosen Faculty & University
  const availableDepartments = useMemo(() => {
    return getDepartmentsForFaculty(
      values.facultyId,
      values.universityId,
      departments,
      availableFaculties
    );
  }, [values.facultyId, values.universityId, departments, availableFaculties]);

  // 3. Available Courses filtered strictly by University -> Faculty -> Department -> Level -> Semester
  const availableCourses = useMemo(() => {
    return getCoursesForHierarchy({
      universityId: values.universityId,
      facultyId: values.facultyId,
      departmentId: values.departmentId,
      level: values.level,
      semester: values.semester,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: !isFilter,
    });
  }, [
    values.universityId,
    values.facultyId,
    values.departmentId,
    values.level,
    values.semester,
    courses,
    universities,
    isFilter,
  ]);

  // Handle auto-correction when parents change in 'form' mode
  useEffect(() => {
    if (isFilter) return;

    let updated = { ...values };
    let changed = false;

    // Validate universityId
    if (!updated.universityId && universities.length > 0) {
      updated.universityId = universities[0].id;
      changed = true;
    }

    // Validate facultyId
    if (
      availableFaculties.length > 0 &&
      (!updated.facultyId || !availableFaculties.some((f) => f.id === updated.facultyId))
    ) {
      updated.facultyId = availableFaculties[0].id;
      changed = true;
    }

    // Validate departmentId
    if (
      availableDepartments.length > 0 &&
      (!updated.departmentId || !availableDepartments.some((d) => d.id === updated.departmentId))
    ) {
      updated.departmentId = availableDepartments[0].id;
      changed = true;
    }

    // Validate level
    if (!updated.level) {
      updated.level = '100 Level';
      changed = true;
    }

    // Validate semester
    if (!updated.semester) {
      updated.semester = 'First Semester';
      changed = true;
    }

    // Validate courseId
    if (
      availableCourses.length > 0 &&
      (!updated.courseId || !availableCourses.some((c) => c.id === updated.courseId))
    ) {
      updated.courseId = availableCourses[0].id;
      changed = true;
    }

    if (changed) {
      onChange(updated);
    }
  }, [
    values.universityId,
    values.facultyId,
    values.departmentId,
    values.level,
    values.semester,
    availableFaculties,
    availableDepartments,
    availableCourses,
    universities,
    isFilter,
  ]);

  // Handler for University change
  const handleUniversityChange = (uniId: string) => {
    const nextFaculties = getFacultiesForUniversity(uniId, faculties);
    const nextFacultyId = isFilter ? (uniId === 'all' ? 'all' : nextFaculties[0]?.id || 'all') : nextFaculties[0]?.id || '';
    
    const nextDepts = getDepartmentsForFaculty(nextFacultyId, uniId, departments, nextFaculties);
    const nextDeptId = isFilter ? (nextFacultyId === 'all' ? 'all' : nextDepts[0]?.id || 'all') : nextDepts[0]?.id || '';

    const nextCourses = getCoursesForHierarchy({
      universityId: uniId,
      facultyId: nextFacultyId,
      departmentId: nextDeptId,
      level: values.level,
      semester: values.semester,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: !isFilter,
    });
    const nextCourseId = isFilter ? 'all' : nextCourses[0]?.id || '';

    onChange({
      ...values,
      universityId: uniId,
      facultyId: nextFacultyId,
      departmentId: nextDeptId,
      courseId: nextCourseId,
    });
  };

  // Handler for Faculty change
  const handleFacultyChange = (facId: string) => {
    const nextDepts = getDepartmentsForFaculty(facId, values.universityId, departments, availableFaculties);
    const nextDeptId = isFilter ? (facId === 'all' ? 'all' : nextDepts[0]?.id || 'all') : nextDepts[0]?.id || '';

    const nextCourses = getCoursesForHierarchy({
      universityId: values.universityId,
      facultyId: facId,
      departmentId: nextDeptId,
      level: values.level,
      semester: values.semester,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: !isFilter,
    });
    const nextCourseId = isFilter ? 'all' : nextCourses[0]?.id || '';

    onChange({
      ...values,
      facultyId: facId,
      departmentId: nextDeptId,
      courseId: nextCourseId,
    });
  };

  // Handler for Department change
  const handleDepartmentChange = (deptId: string) => {
    const nextCourses = getCoursesForHierarchy({
      universityId: values.universityId,
      facultyId: values.facultyId,
      departmentId: deptId,
      level: values.level,
      semester: values.semester,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: !isFilter,
    });
    const nextCourseId = isFilter ? 'all' : nextCourses[0]?.id || (courses[0]?.id || '');

    onChange({
      ...values,
      departmentId: deptId,
      courseId: nextCourseId,
    });
  };

  // Handler for Level change
  const handleLevelChange = (lvl: string) => {
    const nextCourses = getCoursesForHierarchy({
      universityId: values.universityId,
      facultyId: values.facultyId,
      departmentId: values.departmentId,
      level: lvl,
      semester: values.semester,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: !isFilter,
    });
    const nextCourseId = isFilter ? (values.courseId || 'all') : (nextCourses[0]?.id || values.courseId || courses[0]?.id || '');

    onChange({
      ...values,
      level: lvl,
      courseId: nextCourseId,
    });
  };

  // Handler for Semester change
  const handleSemesterChange = (sem: string) => {
    const nextCourses = getCoursesForHierarchy({
      universityId: values.universityId,
      facultyId: values.facultyId,
      departmentId: values.departmentId,
      level: values.level,
      semester: sem,
      allCourses: courses,
      allUniversities: universities,
      includeAllFallback: !isFilter,
    });
    const nextCourseId = isFilter ? (values.courseId || 'all') : (nextCourses[0]?.id || values.courseId || courses[0]?.id || '');

    onChange({
      ...values,
      semester: sem,
      courseId: nextCourseId,
    });
  };

  // Handler for Course change
  const handleCourseChange = (cId: string) => {
    onChange({
      ...values,
      courseId: cId,
    });
  };

  // Selected names for breadcrumb display
  const selectedUni = universities.find((u) => u.id === values.universityId);
  const selectedFaculty = availableFaculties.find((f) => f.id === values.facultyId);
  const selectedDept = availableDepartments.find((d) => d.id === values.departmentId);
  const selectedCourseObj = courses.find((c) => c.id === values.courseId);

  // Styles based on theme
  const selectBg = isDark
    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
    : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';
  const labelClass = isDark
    ? 'text-slate-300'
    : 'text-slate-700';

  const gridColsClass =
    layout === 'grid-6'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'
      : layout === 'grid-3'
      ? 'grid grid-cols-1 md:grid-cols-3 gap-3.5'
      : layout === 'grid-2'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5'
      : 'flex flex-col space-y-3';

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 6-Step Cascading Controls */}
      <div className={gridColsClass}>
        {/* Step 1: University */}
        <div>
          <label className={`text-xs font-bold block mb-1.5 flex items-center gap-1.5 ${labelClass}`}>
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>1. University</span>
          </label>
          <select
            value={values.universityId}
            onChange={(e) => handleUniversityChange(e.target.value)}
            disabled={disabled}
            className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${selectBg}`}
          >
            {isFilter && <option value="all">All Universities</option>}
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.abbreviation ? `${u.abbreviation} - ${u.name}` : u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Faculty */}
        <div>
          <label className={`text-xs font-bold block mb-1.5 flex items-center gap-1.5 ${labelClass}`}>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>2. Faculty</span>
          </label>
          <select
            value={values.facultyId}
            onChange={(e) => handleFacultyChange(e.target.value)}
            disabled={disabled}
            className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${selectBg}`}
          >
            {isFilter && <option value="all">All Faculties</option>}
            {availableFaculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Department */}
        <div>
          <label className={`text-xs font-bold block mb-1.5 flex items-center gap-1.5 ${labelClass}`}>
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>3. Department</span>
          </label>
          <select
            value={values.departmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            disabled={disabled}
            className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${selectBg}`}
          >
            {isFilter && <option value="all">All Departments</option>}
            {availableDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 4: Level */}
        <div>
          <label className={`text-xs font-bold block mb-1.5 flex items-center gap-1.5 ${labelClass}`}>
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>4. Academic Level</span>
          </label>
          <select
            value={values.level}
            onChange={(e) => handleLevelChange(e.target.value)}
            disabled={disabled}
            className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${selectBg}`}
          >
            {isFilter && <option value="all">All Levels</option>}
            {ACADEMIC_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Step 5: Semester */}
        <div>
          <label className={`text-xs font-bold block mb-1.5 flex items-center gap-1.5 ${labelClass}`}>
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>5. Semester</span>
          </label>
          <select
            value={values.semester}
            onChange={(e) => handleSemesterChange(e.target.value)}
            disabled={disabled}
            className={`w-full text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${selectBg}`}
          >
            {isFilter && <option value="all">All Semesters</option>}
            {ACADEMIC_SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Step 6: Target Course */}
        <div>
          <label className={`text-xs font-bold block mb-1.5 flex items-center gap-1.5 ${labelClass}`}>
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{courseLabel}</span>
          </label>
          <select
            value={values.courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            disabled={disabled}
            className={`w-full text-xs font-bold py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${selectBg}`}
          >
            {isFilter && <option value="all">All Courses</option>}
            {availableCourses.length === 0 ? (
              <option value="">No courses registered for this selection</option>
            ) : (
              availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Visual Hierarchy Trail / Breadcrumb */}
      {!hideBreadcrumb && (
        <div
          className={`flex items-center flex-wrap gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium border ${
            isDark
              ? 'bg-slate-950/60 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Hierarchy:
          </span>
          <span>{selectedUni?.abbreviation || selectedUni?.name || (isFilter ? 'All Universities' : 'Select University')}</span>
          <span className="text-slate-600">›</span>
          <span>{selectedFaculty?.name || (isFilter ? 'All Faculties' : 'Select Faculty')}</span>
          <span className="text-slate-600">›</span>
          <span>{selectedDept?.name || (isFilter ? 'All Departments' : 'Select Department')}</span>
          <span className="text-slate-600">›</span>
          <span className="text-purple-400 font-semibold">{values.level || 'All Levels'}</span>
          <span className="text-slate-600">›</span>
          <span className="text-cyan-400 font-semibold">{values.semester || 'All Semesters'}</span>
          <span className="text-slate-600">›</span>
          <span className="text-amber-400 font-bold">
            {selectedCourseObj ? `${selectedCourseObj.code} (${selectedCourseObj.title})` : isFilter ? 'All Courses' : 'Select Course'}
          </span>
        </div>
      )}
    </div>
  );
};
