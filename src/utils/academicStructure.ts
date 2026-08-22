import {
  Course,
  Department,
  Faculty,
  FacultyGroup,
  University,
  DEFAULT_FACULTY_DEPARTMENTS,
  FUL_DEPARTMENTS,
  FUAHSE_DEPARTMENTS,
} from '../types';

export const ACADEMIC_LEVELS = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  '600 Level',
] as const;

export type AcademicLevel = typeof ACADEMIC_LEVELS[number];

export const ACADEMIC_SEMESTERS = [
  'First Semester',
  'Second Semester',
] as const;

export type AcademicSemester = typeof ACADEMIC_SEMESTERS[number];

export function normalizeLevel(level?: string): string {
  if (!level) return '100 Level';
  const clean = level.toString().trim();
  if (clean.startsWith('100') || clean.toLowerCase().includes('100')) return '100 Level';
  if (clean.startsWith('200') || clean.toLowerCase().includes('200')) return '200 Level';
  if (clean.startsWith('300') || clean.toLowerCase().includes('300')) return '300 Level';
  if (clean.startsWith('400') || clean.toLowerCase().includes('400')) return '400 Level';
  if (clean.startsWith('500') || clean.toLowerCase().includes('500')) return '500 Level';
  if (clean.startsWith('600') || clean.toLowerCase().includes('600')) return '600 Level';
  return '100 Level';
}

export function normalizeSemester(semester?: string): string {
  if (!semester) return 'First Semester';
  const clean = semester.toString().trim().toLowerCase();
  if (
    clean === 'first' ||
    clean === 'first semester' ||
    clean === '1st' ||
    clean.includes('1st') ||
    clean.includes('first')
  ) {
    return 'First Semester';
  }
  if (
    clean === 'second' ||
    clean === 'second semester' ||
    clean === '2nd' ||
    clean.includes('2nd') ||
    clean.includes('second')
  ) {
    return 'Second Semester';
  }
  return 'First Semester';
}

/**
 * Standard Nigerian University Faculties generator for any university.
 */
export function getFacultiesForUniversity(
  universityId?: string,
  registeredFaculties: Faculty[] = []
): Faculty[] {
  if (!universityId || universityId === 'all') {
    // Return all registered faculties or default groups
    if (registeredFaculties.length > 0) return registeredFaculties;
    return DEFAULT_FACULTY_DEPARTMENTS.map((g, idx) => ({
      id: `fac-def-${idx + 1}`,
      universityId: 'all',
      name: g.name.replace(/^\d+\.\s*/, ''),
    }));
  }

  // 1. Check if explicit faculties are registered for this university
  const matchingRegistered = registeredFaculties.filter(
    (f) => f.universityId === universityId
  );
  if (matchingRegistered.length > 0) {
    return matchingRegistered;
  }

  // 2. Specific institutional tailored faculties
  if (universityId === 'uni-fuahse' || universityId.includes('fuahse')) {
    return [
      { id: 'fac-fuahse-1', universityId, name: 'Faculty of Allied Health Sciences' },
      { id: 'fac-fuahse-2', universityId, name: 'Faculty of Clinical Sciences & Medicine' },
      { id: 'fac-fuahse-3', universityId, name: 'Faculty of Basic Medical Sciences' },
      { id: 'fac-fuahse-4', universityId, name: 'Faculty of Dentistry & Oral Health' },
      { id: 'fac-fuahse-5', universityId, name: 'Faculty of Public Health & Health Information' },
    ];
  }

  if (universityId === 'uni-ful' || universityId.includes('ful')) {
    return [
      { id: 'fac-ful-1', universityId, name: 'Faculty of Science & Computing' },
      { id: 'fac-ful-2', universityId, name: 'Faculty of Arts & Humanities' },
      { id: 'fac-ful-3', universityId, name: 'Faculty of Social Sciences' },
      { id: 'fac-ful-4', universityId, name: 'Faculty of Education' },
      { id: 'fac-ful-5', universityId, name: 'Faculty of Agriculture' },
    ];
  }

  if (universityId === 'uni-1' || universityId === 'uni-2') {
    return [
      { id: 'fac-1', universityId, name: 'Faculty of Science' },
      { id: 'fac-2', universityId, name: 'Faculty of Arts' },
      { id: 'fac-3', universityId, name: 'Faculty of Social Sciences' },
      { id: 'fac-4', universityId, name: 'Faculty of Management Sciences' },
      { id: 'fac-5', universityId, name: 'Faculty of Education' },
    ];
  }

  // 3. Return comprehensive standard Nigerian faculties for any chosen institution
  return DEFAULT_FACULTY_DEPARTMENTS.map((group, idx) => {
    const cleanName = group.name.replace(/^\d+\.\s*/, '');
    return {
      id: `fac-${universityId}-${idx + 1}`,
      universityId,
      name: cleanName,
    };
  });
}

/**
 * Resolves Departments belonging to a specific Faculty and University.
 */
export function getDepartmentsForFaculty(
  facultyId?: string,
  universityId?: string,
  registeredDepartments: Department[] = [],
  registeredFaculties: Faculty[] = []
): Department[] {
  if (!facultyId || facultyId === 'all') {
    if (registeredDepartments.length > 0) return registeredDepartments;
    const list: Department[] = [];
    DEFAULT_FACULTY_DEPARTMENTS.forEach((fg, fIdx) => {
      fg.departments.forEach((deptName, dIdx) => {
        list.push({
          id: `dept-all-${fIdx + 1}-${dIdx + 1}`,
          facultyId: `fac-def-${fIdx + 1}`,
          name: deptName,
        });
      });
    });
    return list;
  }

  // 1. Check registered departments matching facultyId
  const matching = registeredDepartments.filter((d) => d.facultyId === facultyId);
  if (matching.length > 0) {
    return matching;
  }

  // 2. Resolve faculty name
  const facultyObj =
    registeredFaculties.find((f) => f.id === facultyId) ||
    getFacultiesForUniversity(universityId, registeredFaculties).find((f) => f.id === facultyId);

  const facultyName = (facultyObj?.name || '').toLowerCase();

  // 3. Institution-specific quick fallbacks
  if (
    universityId === 'uni-fuahse' ||
    (universityId && universityId.includes('fuahse')) ||
    facultyId === 'fac-fuahse-1' ||
    facultyName.includes('allied') ||
    facultyName.includes('health')
  ) {
    return FUAHSE_DEPARTMENTS.map((name, idx) => ({
      id: `dept-fuahse-${idx + 1}`,
      facultyId: facultyId || 'fac-fuahse-1',
      name,
    }));
  }

  if (
    universityId === 'uni-ful' ||
    (universityId && universityId.includes('ful')) ||
    facultyId?.startsWith('fac-ful')
  ) {
    if (facultyId === 'fac-ful-1' || facultyName.includes('science') || facultyName.includes('computing')) {
      return [
        { id: 'dept-ful-1', facultyId: facultyId || 'fac-ful-1', name: 'General Studies Unit' },
        { id: 'dept-ful-2', facultyId: facultyId || 'fac-ful-1', name: 'Mathematics' },
        { id: 'dept-ful-3', facultyId: facultyId || 'fac-ful-1', name: 'Physics' },
        { id: 'dept-ful-4', facultyId: facultyId || 'fac-ful-1', name: 'Computer Science' },
        { id: 'dept-ful-5', facultyId: facultyId || 'fac-ful-1', name: 'Chemistry' },
        { id: 'dept-ful-sci-6', facultyId: facultyId || 'fac-ful-1', name: 'Biochemistry' },
        { id: 'dept-ful-sci-7', facultyId: facultyId || 'fac-ful-1', name: 'Microbiology' },
        { id: 'dept-ful-sci-8', facultyId: facultyId || 'fac-ful-1', name: 'Geology' },
        { id: 'dept-ful-sci-9', facultyId: facultyId || 'fac-ful-1', name: 'Cyber Security' },
        { id: 'dept-ful-sci-10', facultyId: facultyId || 'fac-ful-1', name: 'Software Engineering' },
      ];
    }
    if (facultyId === 'fac-ful-2' || facultyName.includes('arts') || facultyName.includes('humanities')) {
      return [
        { id: 'dept-ful-6', facultyId: facultyId || 'fac-ful-2', name: 'History and International Studies' },
        { id: 'dept-ful-art-2', facultyId: facultyId || 'fac-ful-2', name: 'English & Literary Studies' },
        { id: 'dept-ful-art-3', facultyId: facultyId || 'fac-ful-2', name: 'Philosophy' },
        { id: 'dept-ful-art-4', facultyId: facultyId || 'fac-ful-2', name: 'Religious Studies' },
      ];
    }
    if (facultyId === 'fac-ful-3' || facultyName.includes('social')) {
      return [
        { id: 'dept-ful-7', facultyId: facultyId || 'fac-ful-3', name: 'Economics' },
        { id: 'dept-ful-8', facultyId: facultyId || 'fac-ful-3', name: 'Sociology' },
        { id: 'dept-ful-soc-3', facultyId: facultyId || 'fac-ful-3', name: 'Political Science' },
        { id: 'dept-ful-soc-4', facultyId: facultyId || 'fac-ful-3', name: 'Accounting' },
      ];
    }
  }

  // 4. UNILAG / UI Standard
  if (facultyId === 'fac-1' || facultyName.includes('science')) {
    return [
      { id: 'dept-1', facultyId, name: 'Computer Science' },
      { id: 'dept-2', facultyId, name: 'General Studies' },
      { id: 'dept-3', facultyId, name: 'Mathematics' },
      { id: 'dept-4', facultyId, name: 'Physics' },
      { id: 'dept-5', facultyId, name: 'Chemistry' },
      { id: 'dept-6', facultyId, name: 'Biochemistry' },
      { id: 'dept-7', facultyId, name: 'Microbiology' },
    ];
  }

  // 5. Match against DEFAULT_FACULTY_DEPARTMENTS groups
  const matchedGroup = DEFAULT_FACULTY_DEPARTMENTS.find((g) => {
    const cleanGName = g.name.toLowerCase();
    const fWords = facultyName.split(/\s+/).filter((w) => w.length > 3 && w !== 'faculty');
    return fWords.some((w) => cleanGName.includes(w));
  });

  if (matchedGroup && matchedGroup.departments.length > 0) {
    return matchedGroup.departments.map((deptName, idx) => ({
      id: `dept-${facultyId}-${idx + 1}`,
      facultyId,
      name: deptName,
    }));
  }

  // 6. Fallback general departments
  return [
    'Computer Science & Information Technology',
    'General & Applied Sciences',
    'Business & Management Studies',
    'Humanities & Social Studies',
    'General Studies Unit (GST)',
  ].map((name, idx) => ({
    id: `dept-gen-${facultyId}-${idx + 1}`,
    facultyId,
    name,
  }));
}

/**
 * Discipline code prefix map for intelligent department matching
 */
const DISCIPLINE_PREFIX_MAP: Record<string, string[]> = {
  'Medicine and Surgery': ['MED', 'SUR', 'CLN'],
  'Nursing Science': ['NUR', 'NSC'],
  'Radiography and Radiation Science': ['RAD', 'RSC'],
  'Physiotherapy': ['PHT', 'PST'],
  'Medical Laboratory Science': ['MLS', 'MLB'],
  'Human Anatomy': ['ANA', 'ANT'],
  'Human Physiology': ['PIO', 'PHS', 'PHYSIO'],
  'Human Nutrition and Dietetics': ['NUT', 'HND'],
  'Public Health': ['PBH', 'PUH', 'EHS'],
  'Health Information Management': ['HIM', 'HIT'],
  'Biomedical Engineering': ['BME', 'BIE'],
  'General Studies Unit': ['GST', 'GES', 'GNS', 'GSE'],
  'General Studies': ['GST', 'GES', 'GNS', 'GSE'],
  'Mathematics': ['MTH', 'MAT'],
  'Physics': ['PHY'],
  'Computer Science': ['COS', 'CSC', 'CMP', 'CPT'],
  'Chemistry': ['CHM', 'CHE'],
  'History and International Studies': ['HIS'],
  'Economics': ['ECO', 'ECN'],
  'Sociology': ['SOC'],
  'Biochemistry': ['BCH', 'BIO'],
  'Microbiology': ['MCB', 'MIC'],
  'Geology': ['GLY', 'GEO'],
};

/**
 * Filter courses with hierarchical precision:
 * University -> Faculty -> Department -> Level -> Semester -> Course
 */
export function getCoursesForHierarchy({
  universityId,
  facultyId,
  departmentId,
  level,
  semester,
  allCourses,
  allUniversities = [],
  includeAllFallback = false,
}: {
  universityId?: string;
  facultyId?: string;
  departmentId?: string;
  level?: string;
  semester?: string;
  allCourses: Course[];
  allUniversities?: University[];
  includeAllFallback?: boolean;
}): Course[] {
  if (!allCourses || allCourses.length === 0) return [];

  const selectedUniObj = allUniversities.find((u) => u.id === universityId);
  const targetLevel = level && level !== 'all' ? normalizeLevel(level) : null;
  const targetSemester = semester && semester !== 'all' ? normalizeSemester(semester) : null;

  // Resolve department details if available
  let selectedDeptName = '';
  if (departmentId && departmentId !== 'all') {
    const allDepts = getDepartmentsForFaculty(facultyId, universityId);
    const foundDept = allDepts.find((d) => d.id === departmentId);
    if (foundDept) {
      selectedDeptName = foundDept.name;
    }
  }

  // 1. Strict Filter across complete hierarchy
  const filtered = allCourses.filter((c) => {
    // University match
    if (universityId && universityId !== 'all') {
      const uniMatch =
        !c.universityId ||
        c.universityId === universityId ||
        (selectedUniObj &&
          c.universityName &&
          (c.universityName.toLowerCase().includes((selectedUniObj.abbreviation || '').toLowerCase()) ||
            c.universityName.toLowerCase().includes((selectedUniObj.name || '').toLowerCase())));
      if (!uniMatch) return false;
    }

    // Faculty match
    if (facultyId && facultyId !== 'all') {
      if (c.facultyId && c.facultyId === facultyId) {
        // Direct match
      } else if (c.facultyId && c.facultyId !== facultyId) {
        // Check if course belongs to the selected university or department
        if (!selectedDeptName || (c.departmentName && c.departmentName !== selectedDeptName)) {
          return false;
        }
      }
    }

    // Department match
    if (departmentId && departmentId !== 'all') {
      const isDirectDeptIdMatch = c.departmentId === departmentId;
      const isDeptNameMatch =
        selectedDeptName &&
        c.departmentName &&
        (c.departmentName.toLowerCase().includes(selectedDeptName.toLowerCase()) ||
          selectedDeptName.toLowerCase().includes(c.departmentName.toLowerCase()));

      let isCodePrefixMatch = false;
      if (selectedDeptName && c.code) {
        const expectedPrefixes = DISCIPLINE_PREFIX_MAP[selectedDeptName] || [];
        const cleanCode = c.code.toUpperCase();
        isCodePrefixMatch = expectedPrefixes.some((p) => cleanCode.startsWith(p));
      }

      if (!isDirectDeptIdMatch && !isDeptNameMatch && !isCodePrefixMatch) {
        return false;
      }
    }

    // Level match
    if (targetLevel) {
      if (c.level && normalizeLevel(c.level) !== targetLevel) {
        return false;
      }
    }

    // Semester match
    if (targetSemester) {
      if (c.semester && normalizeSemester(c.semester) !== targetSemester) {
        return false;
      }
    }

    return true;
  });

  if (filtered.length > 0) return filtered;

  // 2. Department & Semester Level Relaxed Filter (matches department and semester across university)
  if (departmentId && departmentId !== 'all') {
    const deptRelaxed = allCourses.filter((c) => {
      // University match
      if (universityId && universityId !== 'all') {
        const uniMatch =
          !c.universityId ||
          c.universityId === universityId ||
          (selectedUniObj &&
            c.universityName &&
            (c.universityName.toLowerCase().includes((selectedUniObj.abbreviation || '').toLowerCase()) ||
              c.universityName.toLowerCase().includes((selectedUniObj.name || '').toLowerCase())));
        if (!uniMatch) return false;
      }

      // Department name or code prefix match
      const isDirectDeptIdMatch = c.departmentId === departmentId;
      const isDeptNameMatch =
        selectedDeptName &&
        c.departmentName &&
        (c.departmentName.toLowerCase().includes(selectedDeptName.toLowerCase()) ||
          selectedDeptName.toLowerCase().includes(c.departmentName.toLowerCase()));

      let isCodePrefixMatch = false;
      if (selectedDeptName && c.code) {
        const expectedPrefixes = DISCIPLINE_PREFIX_MAP[selectedDeptName] || [];
        const cleanCode = c.code.toUpperCase();
        isCodePrefixMatch = expectedPrefixes.some((p) => cleanCode.startsWith(p));
      }

      if (!isDirectDeptIdMatch && !isDeptNameMatch && !isCodePrefixMatch) return false;

      // Check semester if specified
      if (targetSemester && c.semester && normalizeSemester(c.semester) !== targetSemester) {
        return false;
      }

      return true;
    });

    if (deptRelaxed.length > 0) return deptRelaxed;
  }

  // 3. Graceful Fallback: If strict matching yields 0 and fallback is enabled, return university courses matching semester/level
  if (includeAllFallback && universityId && universityId !== 'all') {
    const uniSemesterCourses = allCourses.filter((c) => {
      const uniMatch =
        !c.universityId ||
        c.universityId === universityId ||
        (selectedUniObj &&
          c.universityName &&
          c.universityName.toLowerCase().includes((selectedUniObj.abbreviation || selectedUniObj.name).toLowerCase()));
      if (!uniMatch) return false;
      if (targetSemester && c.semester && normalizeSemester(c.semester) !== targetSemester) return false;
      return true;
    });

    if (uniSemesterCourses.length > 0) return uniSemesterCourses;

    const uniCourses = allCourses.filter((c) => {
      return (
        !c.universityId ||
        c.universityId === universityId ||
        (selectedUniObj &&
          c.universityName &&
          c.universityName.toLowerCase().includes((selectedUniObj.abbreviation || selectedUniObj.name).toLowerCase()))
      );
    });
    if (uniCourses.length > 0) return uniCourses;
  }

  return filtered;
}

/**
 * Returns human-readable academic breadcrumb string
 */
export function formatAcademicBreadcrumb({
  universityName,
  facultyName,
  departmentName,
  level,
  semester,
  courseCode,
}: {
  universityName?: string;
  facultyName?: string;
  departmentName?: string;
  level?: string;
  semester?: string;
  courseCode?: string;
}): string {
  const parts: string[] = [];
  if (universityName) parts.push(universityName);
  if (facultyName) parts.push(facultyName);
  if (departmentName) parts.push(departmentName);
  if (level) parts.push(level);
  if (semester) parts.push(semester);
  if (courseCode) parts.push(courseCode);
  return parts.join(' › ');
}
