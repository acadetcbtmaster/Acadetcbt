export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  try {
    const serialized = JSON.stringify(err);
    return serialized === undefined ? String(err) : serialized;
  } catch {
    return String(err);
  }
}

export function logError(scope: string, err: unknown, context?: Record<string, unknown>): void {
  console.error(`[${scope}] ${describeError(err)}`, context || '');
}

export function logWarning(scope: string, err: unknown, context?: Record<string, unknown>): void {
  console.warn(`[${scope}] ${describeError(err)}`, context || '');
}
