import { MAX_SHORT_TEXT, MAX_TITLE_LENGTH, MAX_SCORE_VALUE } from '@common/constants/app.constants';

// ─── MES: matn uzunligi chegaralari ──────────────────────────────────────────
export const MES_REASON_MAX_LENGTH = MAX_SHORT_TEXT;   // downtime/SOS sabab matni
export const MES_TITLE_MAX_LENGTH = MAX_TITLE_LENGTH;  // texnik xizmat sarlavhasi
export const MES_SCORE_MAX = MAX_SCORE_VALUE;          // smenani baholash bali (0..100)

// ─── MES: so'rov limiti ───────────────────────────────────────────────────────
export const MES_QUERY_LIMIT = 100; // standart so'rov chegarasi
