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
      { id: `fac-${universityId}-1`, universityId, name: 'Faculty of Allied Health Sciences' },
      { id: `fac-${universityId}-2`, universityId, name: 'Faculty of Clinical Sciences & Medicine' },
      { id: `fac-${universityId}-3`, universityId, name: 'Faculty of Basic Medical Sciences' },
      { id: `fac-${universityId}-4`, universityId, name: 'Faculty of Dentistry & Oral Health' },
      { id: `fac-${universityId}-5`, universityId, name: 'Faculty of Public Health & Health Information' },
    ];
  }

  if (universityId === 'uni-ful' || universityId.includes('ful')) {
    return [
      { id: `fac-${universityId}-1`, universityId, name: 'Faculty of Science & Computing' },
      { id: `fac-${universityId}-2`, universityId, name: 'Faculty of Arts & Humanities' },
      { id: `fac-${universityId}-3`, universityId, name: 'Faculty of Social & Management Sciences' },
      { id: `fac-${universityId}-4`, universityId, name: 'Faculty of Education' },
      { id: `fac-${universityId}-5`, universityId, name: 'Faculty of Agriculture' },
    ];
  }

  // 3. Return comprehensive standard Nigerian faculties for any chosen institution
  return DEFAULT_FACULTY_DEPARTMENTS.map((group, idx) => {
    // Clean leading numbers like "1. Faculty of..." -> "Faculty of..."
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
    // Flatten default departments
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
  if (universityId === 'uni-fuahse' || (universityId && universityId.includes('fuahse'))) {
    if (facultyName.includes('allied') || facultyName.includes('health')) {
      return FUAHSE_DEPARTMENTS.slice(0, 10).map((name, idx) => ({
        id: `dept-fuahse-ah-${idx + 1}`,
        facultyId,
        name,
      }));
    }
    return FUAHSE_DEPARTMENTS.map((name, idx) => ({
      id: `dept-fuahse-${idx + 1}`,
      facultyId,
      name,
    }));
  }

  if (universityId === 'uni-ful' || (universityId && universityId.includes('ful'))) {
    if (facultyName.includes('science') || facultyName.includes('computing')) {
      return [
        'Computer Science',
        'Cyber Security',
        'Software Engineering',
        'Information Technology',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biochemistry',
        'Biology',
        'Microbiology',
        'Geology',
        'Statistics',
      ].map((name, idx) => ({
        id: `dept-ful-sci-${idx + 1}`,
        facultyId,
        name,
      }));
    }
    if (facultyName.includes('social') || facultyName.includes('management')) {
      return [
        'Economics',
        'Accounting',
        'Business Administration',
        'Political Science',
        'Sociology',
        'Geography',
      ].map((name, idx) => ({
        id: `dept-ful-soc-${idx + 1}`,
        facultyId,
        name,
      }));
    }
    if (facultyName.includes('arts') || facultyName.includes('humanities')) {
      return [
        'English',
        'History and International Studies',
        'Library and Information Science',
        'Philosophy',
        'Religious Studies',
      ].map((name, idx) => ({
        id: `dept-ful-art-${idx + 1}`,
        facultyId,
        name,
      }));
    }
  }

  // 4. Match against DEFAULT_FACULTY_DEPARTMENTS groups
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

  // 5. Fallback general departments
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

  // 1. Strict Filter
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
      if (c.facultyId && c.facultyId !== facultyId) {
        return false;
      }
    }

    // Department match
    if (departmentId && departmentId !== 'all') {
      if (c.departmentId && c.departmentId !== departmentId) {
        return false;
      }
    }

    // Level match
    if (level && level !== 'all') {
      if (c.level && normalizeLevel(c.level) !== normalizeLevel(level)) {
        return false;
      }
    }

    // Semester match
    if (semester && semester !== 'all') {
      if (c.semester && normalizeSemester(c.semester) !== normalizeSemester(semester)) {
        return false;
      }
    }

    return true;
  });

  if (filtered.length > 0) return filtered;

  // 2. Graceful Fallback: If strict matching yields 0, return all university courses matching level/semester or all university courses
  if (includeAllFallback && universityId && universityId !== 'all') {
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
