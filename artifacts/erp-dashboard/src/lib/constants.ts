// EuroPrint ERP Dashboard — frontend konstantalari
// Backend: apps/api/src/common/constants/app.constants.ts bilan muvofiq

// ─── Pagination / So'rov chegaralari ──────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const LARGE_LIST_LIMIT = 500;

// ─── Cache / Yangilanish davrlari (millisekund) ───────────────────────────────
export const CACHE_STALE_TIME_MS = 60_000; // 1 daqiqa
export const CACHE_GC_TIME_MS = 5 * 60_000; // 5 daqiqa
export const REFETCH_INTERVAL_MS = 30_000; // 30 sekund

// ─── UI / Ko'rsatish ──────────────────────────────────────────────────────────
export const TOAST_DURATION_MS = 4_000;
export const DEBOUNCE_DELAY_MS = 300;
export const ANIMATION_DURATION_MS = 200;
export const SIDEBAR_WIDTH_PX = 240;
export const TABLE_ROW_HEIGHT_PX = 48;

// ─── Fayl hajmi ───────────────────────────────────────────────────────────────
export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1_024 * 1_024;

// ─── Biznes qoidalari ─────────────────────────────────────────────────────────
export const MIN_SEARCH_CHARS = 2;
export const MAX_ITEMS_PER_EXPORT = 10_000;
export const CURRENCY_DECIMAL_PLACES = 2;
