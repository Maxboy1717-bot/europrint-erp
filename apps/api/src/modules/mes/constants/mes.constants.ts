/**
 * @module mes.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

import { MAX_SHORT_TEXT, MAX_TITLE_LENGTH, MAX_SCORE_VALUE } from '@common/constants/app.constants';

// ─── MES: matn uzunligi chegaralari ──────────────────────────────────────────
export const MES_REASON_MAX_LENGTH = MAX_SHORT_TEXT;   // downtime/SOS sabab matni
export const MES_TITLE_MAX_LENGTH = MAX_TITLE_LENGTH;  // texnik xizmat sarlavhasi
export const MES_SCORE_MAX = MAX_SCORE_VALUE;          // smenani baholash bali (0..100)

// ─── MES: so'rov limiti ───────────────────────────────────────────────────────
export const MES_QUERY_LIMIT = 100; // standart so'rov chegarasi

// ─── MES: OEE (jahon-standart formula — egasi-koeffitsiyenti EMAS) ────────────
// OEE = Availability × Performance × Quality, har omil [0..100] foizda.
//   Availability = run / (run + stop + qayd-etilgan downtime)
//   Performance  = actual / target  (100% bilan cheklanadi — target = rejalashtirilgan chiqim)
//   Quality      = (actual − defect) / actual
// Bu omillar production_sessions ning REAL ustunlaridan hisoblanadi (oldindan
// saqlangan oee/availability/... ustunlari ECHO qilinmaydi). Jahon-standart.
export const OEE_PERCENT_SCALE = 100;        // foiz shkalasi (0..100)
export const OEE_PERFORMANCE_CAP = 100;      // Performance 100% dan oshmaydi (over-production tekislanadi)
export const SECONDS_PER_MINUTE_OEE = 60;    // downtime daqiqa→sekund konversiyasi
export const OEE_ROUND_FACTOR = 10;          // 0.1 foiz aniqlik uchun yaxlitlash koeffitsiyenti
