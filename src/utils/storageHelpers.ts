/**
 * Safe LocalStorage helpers with try/catch encapsulation
 * Prevents fatal errors when cookies/localStorage are disabled (incognito mode, strict sandboxes).
 */

export function safeGetItem(key: string, defaultValue: string | null = null): string | null {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (err) {
    console.warn(`[Storage] Read error for key "${key}":`, err);
    return defaultValue;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[Storage] Write error for key "${key}":`, err);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[Storage] Remove error for key "${key}":`, err);
    return false;
  }
}

export function safeGetJSON<T>(key: string, fallbackValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Storage] JSON parse error for key "${key}":`, err);
    return fallbackValue;
  }
}

export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[Storage] JSON set error for key "${key}":`, err);
    return false;
  }
}
