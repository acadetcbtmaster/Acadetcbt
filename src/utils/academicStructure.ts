export const ACADEMIC_LEVELS = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  '600 Level',
] as const;

export const ACADEMIC_SEMESTERS = [
  'First Semester',
  'Second Semester',
] as const;

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
  if (clean === 'first' || clean === 'first semester' || clean === '1st' || clean.includes('1st') || clean.includes('first')) return 'First Semester';
  if (clean === 'second' || clean === 'second semester' || clean === '2nd' || clean.includes('2nd') || clean.includes('second')) return 'Second Semester';
  return 'First Semester';
}
