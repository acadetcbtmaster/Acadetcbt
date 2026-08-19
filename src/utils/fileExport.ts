import { safeStringify } from '../services/storage';

export type CsvValue = string | number | boolean | null | undefined;

/** Current date as `YYYY-MM-DD`, used for timestamped export filenames. */
export function dateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Quotes and escapes a single CSV field so commas, quotes and newlines survive. */
export function csvCell(value: CsvValue): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: CsvValue[], rows: CsvValue[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8;'): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

export function downloadCsv(filename: string, headers: CsvValue[], rows: CsvValue[][]): void {
  downloadTextFile(buildCsv(headers, rows), filename, 'text/csv;charset=utf-8;');
}

/** Flattens an arbitrary field value into a printable CSV cell value. */
function toCsvValue(value: unknown): CsvValue {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return safeStringify(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

/** Derives headers from the keys of the first record, then exports every record as a row. */
export function downloadCsvFromRecords<T extends object>(filename: string, records: readonly T[]): void {
  if (!records.length) return;
  const keys = Object.keys(records[0]) as (keyof T & string)[];
  downloadCsv(
    filename,
    keys,
    records.map((record) => keys.map((key) => toCsvValue(record[key])))
  );
}

export function downloadJson(filename: string, data: unknown): void {
  downloadTextFile(safeStringify(data, 2), filename, 'application/json;charset=utf-8;');
}
