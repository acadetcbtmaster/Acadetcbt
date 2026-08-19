import fs from 'node:fs';
import path from 'node:path';
import {
  adminToRow,
  courseToRow,
  departmentToRow,
  facultyToRow,
  materialToRow,
  paymentToRow,
  planToRow,
  questionToRow,
  resultToRow,
  systemConfigToRow,
  universityToRow,
  userToRow,
} from '../src/lib/dbMappers';

type MapperCase = {
  table: string;
  name: string;
  mapper: (value: any) => Record<string, unknown>;
  sample: any;
};

const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const schema = fs.readFileSync(path.join(root, 'supabase_schema.sql'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase_migration_fix.sql'), 'utf8');
const mapperSource = fs.readFileSync(path.join(root, 'src/lib/dbMappers.ts'), 'utf8');

function parseColumns(sql: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  const tablePattern = /CREATE TABLE IF NOT EXISTS public\.([a-z_]+)\s*\(([\s\S]*?)\n\);/gi;
  for (const match of sql.matchAll(tablePattern)) {
    const columns = new Set<string>();
    for (const line of match[2].split('\n')) {
      const column = line.trim().match(/^([a-z_][a-z0-9_]*)\s+/i)?.[1];
      if (column) columns.add(column);
    }
    tables.set(match[1], columns);
  }
  return tables;
}

const columns = parseColumns(schema);
const migrationAdds = /ALTER TABLE public\.([a-z_]+) ADD COLUMN IF NOT EXISTS ([a-z_]+)/gi;
for (const match of migration.matchAll(migrationAdds)) {
  if (!columns.has(match[1])) columns.set(match[1], new Set());
  columns.get(match[1])!.add(match[2]);
}

const cases: MapperCase[] = [
  {
    table: 'questions',
    name: 'question',
    mapper: questionToRow,
    sample: {
      id: 'q-sample',
      courseId: 'course-sample',
      universityId: 'university-sample',
      departmentId: 'department-sample',
      year: '2025',
      topicName: 'Algebra',
      question: 'What is 2 + 2?',
      optionA: '3',
      optionB: '4',
      optionC: '5',
      optionD: '6',
      correctAnswer: 'B',
      explanation: 'Basic arithmetic',
      diagramUrl: 'https://example.test/diagram.png',
      difficulty: 'Medium',
      status: 'Published',
      level: '100 Level',
      semester: 'First Semester',
      session: '2025/2026',
      source: 'Verification',
      courseCode: 'MAT101',
      questionType: 'MCQ',
      topicId: 'topic-sample',
      createdBy: 'admin-sample',
      versionNumber: 1,
    },
  },
  { table: 'universities', name: 'university', mapper: universityToRow, sample: { id: 'university-sample', name: 'Sample University', abbreviation: 'SU' } },
  { table: 'faculties', name: 'faculty', mapper: facultyToRow, sample: { id: 'faculty-sample', universityId: 'university-sample', name: 'Science' } },
  { table: 'departments', name: 'department', mapper: departmentToRow, sample: { id: 'department-sample', facultyId: 'faculty-sample', universityId: 'university-sample', name: 'Mathematics' } },
  { table: 'courses', name: 'course', mapper: courseToRow, sample: { id: 'course-sample', universityId: 'university-sample', departmentId: 'department-sample', code: 'MAT101', title: 'Mathematics', semester: 'First' } },
  { table: 'materials', name: 'material', mapper: materialToRow, sample: { id: 'material-sample', courseId: 'course-sample', universityId: 'university-sample', title: 'Notes', fileUrl: 'https://example.test/notes.pdf', type: 'PDF' } },
  { table: 'subscription_plans', name: 'plan', mapper: planToRow, sample: { id: 'plan-sample', name: 'Sample', price: 100, durationDays: 30, features: [] } },
  { table: 'users', name: 'user', mapper: userToRow, sample: { id: 'user-sample', name: 'Sample User', email: 'sample@example.test' } },
  { table: 'results', name: 'result', mapper: resultToRow, sample: { id: 'result-sample', userId: 'user-sample', courseId: 'course-sample', score: 4, totalQuestions: 5, percentage: 80 } },
  { table: 'payments', name: 'payment', mapper: paymentToRow, sample: { id: 'payment-sample', reference: 'ref-sample', userId: 'user-sample', userEmail: 'sample@example.test', amount: 100 } },
  { table: 'admins', name: 'admin', mapper: adminToRow, sample: { id: 'admin-sample', fullName: 'Sample Admin', username: 'admin', email: 'admin@example.test', passwordHash: 'hash' } },
  { table: 'system_configs', name: 'system config', mapper: systemConfigToRow, sample: { key: 'sample', data: { enabled: true } } },
];

const errors: string[] = [];
for (const item of cases) {
  const tableColumns = columns.get(item.table);
  if (!tableColumns) {
    errors.push(`${item.name}: table ${item.table} was not found in the SQL schema`);
    continue;
  }

  const row = item.mapper(item.sample);
  const unknown = Object.keys(row).filter((key) => !tableColumns.has(key));
  if (unknown.length > 0) {
    errors.push(`${item.name}: unknown columns: ${unknown.join(', ')}`);
  }

  const tableBlock = schema.match(new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${item.table}\\s*\\(([\\\\s\\\\S]*?)\\n\\);`, 'i'))?.[1] ?? '';
  for (const line of tableBlock.split('\n')) {
    const match = line.trim().match(/^([a-z_][a-z0-9_]*)\s+(.+)$/i);
    if (!match || !/\bNOT NULL\b/i.test(match[2]) || /\bDEFAULT\b/i.test(match[2])) continue;
    if (!(match[1] in row) || row[match[1]] === undefined) {
      errors.push(`${item.name}: required column omitted: ${match[1]}`);
    }
  }
}

const reverseCases: Array<{ table: string; name: string; functionName: string }> = [
  { table: 'questions', name: 'question', functionName: 'questionFromRow' },
  { table: 'universities', name: 'university', functionName: 'universityFromRow' },
  { table: 'faculties', name: 'faculty', functionName: 'facultyFromRow' },
  { table: 'departments', name: 'department', functionName: 'departmentFromRow' },
  { table: 'courses', name: 'course', functionName: 'courseFromRow' },
  { table: 'materials', name: 'material', functionName: 'materialFromRow' },
  { table: 'subscription_plans', name: 'plan', functionName: 'planFromRow' },
  { table: 'users', name: 'user', functionName: 'userFromRow' },
  { table: 'results', name: 'result', functionName: 'resultFromRow' },
  { table: 'payments', name: 'payment', functionName: 'paymentFromRow' },
  { table: 'admins', name: 'admin', functionName: 'adminFromRow' },
  { table: 'system_configs', name: 'system config', functionName: 'systemConfigFromRow' },
];

for (const item of reverseCases) {
  const functionMatch = mapperSource.match(
    new RegExp(`export function ${item.functionName}\\b[\\s\\S]*?\\n\\}`, 'm'),
  );
  if (!functionMatch) {
    errors.push(`${item.name}: ${item.functionName} was not found`);
    continue;
  }
  const body = functionMatch[0];
  const reads = new Set<string>();
  for (const match of body.matchAll(/value\(row,\s*'([a-z][a-z0-9_]*_[a-z0-9_]*)'/gi)) reads.add(match[1]);
  for (const match of body.matchAll(/\brow\.([a-z][a-z0-9_]*_[a-z0-9_]*)\b/gi)) reads.add(match[1]);
  const tableColumns = columns.get(item.table);
  for (const column of reads) {
    if (!tableColumns?.has(column)) {
      errors.push(`${item.name}: fromRow reads unknown column: ${column}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Database mapping verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Database mapping verification passed for ${cases.length} mappers.`);
