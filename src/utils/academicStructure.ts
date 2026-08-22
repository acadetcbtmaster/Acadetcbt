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
 * Filter courses with strict hierarchical precision:
 * FACULTY -> DEPARTMENT -> LEVEL -> SEMESTER -> COURSE
 *
 * Rules:
 * - A course from another department or faculty must NEVER appear.
 * - First Semester and Second Semester courses must NEVER be mixed.
 * - 'All' respects the parent scope (e.g. All Departments in Faculty of Science only returns Science courses).
 * - No loose cross-department fallback matching.
 */
export function getCoursesForHierarchy({
  universityId,
  facultyId,
  departmentId,
  level,
  semester,
  allCourses = [],
  faculties = [],
  departments = [],
}: {
  universityId?: string;
  facultyId?: string;
  departmentId?: string;
  level?: string;
  semester?: string;
  allCourses: Course[];
  allUniversities?: University[];
  faculties?: Faculty[];
  departments?: Department[];
  includeAllFallback?: boolean;
}): Course[] {
  if (!Array.isArray(allCourses) || allCourses.length === 0) return [];

  // Determine allowed department IDs for the selected faculty if department is 'all'
  let facultyDepartmentIds: Set<string> | null = null;
  if (facultyId && facultyId !== 'all' && (!departmentId || departmentId === 'all') && Array.isArray(departments) && departments.length > 0) {
    const matchingDepts = departments.filter((d) => d.facultyId === facultyId);
    if (matchingDepts.length > 0) {
      facultyDepartmentIds = new Set(matchingDepts.map((d) => d.id));
    }
  }

  const targetLevel = level && level !== 'all' ? normalizeLevel(level) : null;
  const targetSemester = semester && semester !== 'all' ? normalizeSemester(semester) : null;

  return allCourses.filter((c) => {
    // 1. University Filter (if scoped)
    if (universityId && universityId !== 'all') {
      if (c.universityId && c.universityId !== universityId) {
        return false;
      }
    }

    // 2. Faculty Filter (Step 1)
    if (facultyId && facultyId !== 'all') {
      if (c.facultyId) {
        if (c.facultyId !== facultyId) return false;
      } else if (facultyDepartmentIds && c.departmentId) {
        if (!facultyDepartmentIds.has(c.departmentId)) return false;
      }
    }

    // 3. Department Filter (Step 2)
    if (departmentId && departmentId !== 'all') {
      if (c.departmentId && c.departmentId !== departmentId) {
        return false;
      }
    }

    // 4. Level Filter (Step 3)
    if (targetLevel) {
      if (c.level && normalizeLevel(c.level) !== targetLevel) {
        return false;
      }
    }

    // 5. Semester Filter (Step 4) - Strictly isolated: 1st and 2nd semester NEVER mix
    if (targetSemester) {
      if (c.semester && normalizeSemester(c.semester) !== targetSemester) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filter questions with strict hierarchical precision:
 * FACULTY -> DEPARTMENT -> LEVEL -> SEMESTER -> COURSE -> QUESTIONS
 */
export function getQuestionsForHierarchy({
  universityId,
  facultyId,
  departmentId,
  level,
  semester,
  courseId,
  questions = [],
  courses = [],
  departments = [],
}: {
  universityId?: string;
  facultyId?: string;
  departmentId?: string;
  level?: string;
  semester?: string;
  courseId?: string;
  questions?: any[];
  courses?: Course[];
  faculties?: Faculty[];
  departments?: Department[];
}): any[] {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  // Build course lookup for fast hierarchical resolution
  const courseMap = new Map<string, Course>();
  courses.forEach((c) => courseMap.set(c.id, c));

  let facultyDepartmentIds: Set<string> | null = null;
  if (facultyId && facultyId !== 'all' && (!departmentId || departmentId === 'all') && Array.isArray(departments) && departments.length > 0) {
    const matchingDepts = departments.filter((d) => d.facultyId === facultyId);
    if (matchingDepts.length > 0) {
      facultyDepartmentIds = new Set(matchingDepts.map((d) => d.id));
    }
  }

  const targetLevel = level && level !== 'all' ? normalizeLevel(level) : null;
  const targetSemester = semester && semester !== 'all' ? normalizeSemester(semester) : null;

  return questions.filter((q) => {
    const courseObj = q.courseId ? courseMap.get(q.courseId) : undefined;
    const qFacultyId = q.facultyId || courseObj?.facultyId;
    const qDeptId = q.departmentId || courseObj?.departmentId;
    const qLevel = q.level || courseObj?.level;
    const qSemester = q.semester || courseObj?.semester;
    const qUniId = q.universityId || courseObj?.universityId;

    // 1. University filter
    if (universityId && universityId !== 'all') {
      if (qUniId && qUniId !== universityId) return false;
    }

    // 2. Faculty filter
    if (facultyId && facultyId !== 'all') {
      if (qFacultyId) {
        if (qFacultyId !== facultyId) return false;
      } else if (facultyDepartmentIds && qDeptId) {
        if (!facultyDepartmentIds.has(qDeptId)) return false;
      }
    }

    // 3. Department filter
    if (departmentId && departmentId !== 'all') {
      if (qDeptId && qDeptId !== departmentId) return false;
    }

    // 4. Level filter
    if (targetLevel) {
      if (qLevel && normalizeLevel(qLevel) !== targetLevel) return false;
    }

    // 5. Semester filter
    if (targetSemester) {
      if (qSemester && normalizeSemester(qSemester) !== targetSemester) return false;
    }

    // 6. Course filter
    if (courseId && courseId !== 'all') {
      if (q.courseId && q.courseId !== courseId) return false;
    }

    return true;
  });
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
