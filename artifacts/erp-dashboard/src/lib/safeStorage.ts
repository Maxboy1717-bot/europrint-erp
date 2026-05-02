// localStorage xatolaridan himoya: QuotaExceededError va SSR muhitlarini boshqaradi
export const safeStorage = {
  getItem(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },

  setItem(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch { /* QuotaExceededError yoki private browsing */ }
  },

  removeItem(key: string): void {
    try { localStorage.removeItem(key); } catch { /* Xato — e'tiborsiz */ }
  },

  clear(): void {
    try { localStorage.clear(); } catch { /* Tozalash xatosi — e'tiborsiz */ }
  },

  getJson<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(key); return raw !== null ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
  },

  setJson<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Serialize yoki saqlash xatosi */ }
  },
};
