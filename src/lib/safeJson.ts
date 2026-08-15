/**
 * Safe JSON serialization layer that prevents circular reference errors
 * ('Converting circular structure to JSON' caused by SDK objects like Y2, Ka, UserImpl, DOM nodes, etc.)
 */

function isPrimitive(val: any): boolean {
  return val === null || val === undefined || (typeof val !== 'object' && typeof val !== 'function');
}

/**
 * Deeply strips circular references, DOM nodes, and internal SDK descriptors
 */
export function sanitizeCircular(obj: any, maxDepth = 10): any {
  const seen = new WeakSet();

  function recurse(val: any, depth: number): any {
    if (isPrimitive(val)) return val;
    if (typeof val === 'function' || typeof val === 'symbol') return undefined;

    if (depth > maxDepth) return '[Truncated: Max Depth]';

    if (seen.has(val)) {
      return '[Circular]';
    }

    try {
      seen.add(val);
    } catch {
      // ignore
    }

    // Handle Dates
    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val.toISOString() : null;
    }

    // Handle Errors
    if (val instanceof Error) {
      return {
        name: val.name || 'Error',
        message: val.message,
        stack: val.stack ? String(val.stack).slice(0, 500) : undefined,
      };
    }

    // Handle Arrays
    if (Array.isArray(val)) {
      const arrResult: any[] = [];
      for (let i = 0; i < val.length; i++) {
        try {
          arrResult.push(recurse(val[i], depth + 1));
        } catch {
          arrResult.push(null);
        }
      }
      return arrResult;
    }

    // Inspect constructor / class name
    let cName = '';
    try {
      cName = val.constructor?.name || '';
    } catch {
      cName = '';
    }

    // Filter known circular SDK constructors (e.g. Y2, Ka, internal WebChannel, DOM, Window)
    if (
      cName === 'Y2' ||
      cName === 'Ka' ||
      cName === 'Window' ||
      cName === 'HTMLDocument' ||
      cName === 'Node' ||
      cName === 'Element' ||
      (typeof Window !== 'undefined' && val instanceof Window) ||
      (typeof Node !== 'undefined' && val instanceof Node)
    ) {
      return `[Object: ${cName || 'Internal'}]`;
    }

    // Plain objects / dictionaries
    const out: Record<string, any> = {};
    let keys: string[] = [];
    try {
      keys = Object.keys(val);
    } catch {
      return '[Unaccessible Object]';
    }

    for (const key of keys) {
      // Skip known circular and internal properties
      if (
        key === 'src' ||
        key === 'i' ||
        key === '_delegate' ||
        key === 'stsTokenManager' ||
        key === 'proactiveRefresh' ||
        key === 'reloadUserInfo' ||
        key === 'reloadListener' ||
        key === 'firestore' ||
        key === 'auth' ||
        key === 'app' ||
        key === '_firestore' ||
        key === '_auth' ||
        key === '_app' ||
        key.startsWith('$$')
      ) {
        continue;
      }

      try {
        const child = val[key];
        if (typeof child !== 'function' && typeof child !== 'symbol') {
          const res = recurse(child, depth + 1);
          if (res !== undefined) {
            out[key] = res;
          }
        }
      } catch {
        out[key] = '[Unreadable Property]';
      }
    }

    return out;
  }

  return recurse(obj, 0);
}

/**
 * Creates a circular-safe JSON replacer
 */
export function createSafeReplacer(userReplacer?: (key: string, value: any) => any) {
  const seen = new WeakSet();
  return function (this: any, key: string, value: any) {
    let processedValue = value;
    if (typeof userReplacer === 'function') {
      try {
        processedValue = userReplacer.call(this, key, value);
      } catch {
        // fallback
      }
    }

    if (processedValue !== null && typeof processedValue === 'object') {
      const cName = processedValue?.constructor?.name || '';
      if (
        cName === 'Y2' ||
        cName === 'Ka' ||
        (typeof Window !== 'undefined' && processedValue instanceof Window) ||
        (typeof Node !== 'undefined' && processedValue instanceof Node)
      ) {
        return `[Object: ${cName || 'Internal'}]`;
      }

      if (seen.has(processedValue)) {
        return '[Circular]';
      }
      try {
        seen.add(processedValue);
      } catch {
        // ignore
      }
    }
    return processedValue;
  };
}

// Global protection installer that catches any uncaught JSON.stringify circular errors
export function installSafeJsonStringify(): void {
  if (typeof JSON === 'undefined' || (JSON as any).__hasSafeCircularProtection) {
    return;
  }

  const originalStringify = JSON.stringify;
  (JSON as any).__originalStringify = originalStringify;
  (JSON as any).__hasSafeCircularProtection = true;

  JSON.stringify = function (value: any, replacer?: any, space?: any): string {
    try {
      return originalStringify(value, replacer, space);
    } catch (err: any) {
      if (err && String(err.message || err).toLowerCase().includes('circular')) {
        try {
          const sanitized = sanitizeCircular(value);
          return originalStringify(sanitized, replacer, space);
        } catch {
          return '{}';
        }
      }
      throw err;
    }
  };
}

// Automatically install circular protection
installSafeJsonStringify();

export function safeStringifyGlobal(val: any, indent?: number): string {
  try {
    const sanitized = sanitizeCircular(val);
    return JSON.stringify(sanitized, null, indent);
  } catch {
    return '{}';
  }
}

