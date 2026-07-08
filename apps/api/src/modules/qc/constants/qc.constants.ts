/**
 * @module qc.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

import { DefectSeverity } from '../domain/aggregates/defect.aggregate';

// ─── FMEA RPN chegaralari (IEC 60812 / AIAG FMEA standart) ──────────────────
export const FMEA_SOD_MIN = 1;           // S/O/D minimal ball
export const FMEA_SOD_MAX = 10;          // S/O/D maksimal ball

export const FMEA_CRITICAL_RPN = 200;    // RPN > 200 → ishlab chiqarishni to'xtatish
export const FMEA_HIGH_RPN = 100;        // RPN > 100 → tuzatish majburiy
export const FMEA_MEDIUM_RPN = 50;       // RPN > 50  → monitoring kerak

// ─── VISION-3340 #43: nuqson jiddiyligi → FMEA S/O/D profili ────────────────
// Nuqson hisobotida faqat KATEGORIK `severity` (minor/major/critical) bor. FMEA
// RPN = S × O × D uchun uni AIAG 1..10 shkalasidagi vakillik profiliga o'giramiz.
// Jiddiylik o'qi qc-new.repository.ts severityScore (critical > major > minor)
// bilan bir xil tartibda. O va D o'rta bandda ushlab turiladi — natijada FAQAT
// `critical` (S=10) RPN>200 (FMEA_CRITICAL_RPN) to'xtatish chegarasidan o'tadi:
//   critical: 10 × 5 × 5 = 250 > 200 → ishlab chiqarish to'xtatiladi (qc_hold)
//   major:     6 × 5 × 5 = 150 ≤ 200 → tuzatish talab (stop yo'q)
//   minor:     3 × 3 × 3 =  27 ≤ 200 → monitoring
export const FMEA_DEFECT_SOD_PROFILE: Record<
  DefectSeverity,
  { severity: number; occurrence: number; detection: number }
> = {
  [DefectSeverity.CRITICAL]: { severity: 10, occurrence: 5, detection: 5 },
  [DefectSeverity.MAJOR]: { severity: 6, occurrence: 5, detection: 5 },
  [DefectSeverity.MINOR]: { severity: 3, occurrence: 3, detection: 3 },
};

// ─── DPMO + Six Sigma (Motorola metodologiyasi) ───────────────────────────────
export const DPMO_PER_MILLION = 1_000_000;  // million imkoniyatlardagi nuqsonlar
export const MOTOROLA_SIGMA_SHIFT = 1.5;    // Motorola 1.5σ uzoq muddatli siljish
export const DPMO_WORLD_CLASS_MAX = 3.4;    // ≤ 3.4 DPMO = olti-sigma darajasi

// ─── Six Sigma darajalari ─────────────────────────────────────────────────────
export const SIGMA_6_THRESHOLD = 5.5;   // σ ≥ 5.5 → 6σ (world-class)
export const SIGMA_5_THRESHOLD = 4.5;   // σ ≥ 4.5 → 5σ (excellent)
export const SIGMA_4_THRESHOLD = 3.5;   // σ ≥ 3.5 → 4σ (good)
export const SIGMA_3_THRESHOLD = 2.5;   // σ ≥ 2.5 → 3σ (average)

// ─── Delta-E CIEDE2000 baholash chegaralari (ISO 12647, bosma sanoat) ─────────
export const DELTA_E_PASS_MAX = 1.0;    // ΔE < 1.0  → PASS (sezilmas farq)
export const DELTA_E_REVIEW_MAX = 3.0;  // ΔE < 3.0  → REVIEW (sezarli farq)
export const DELTA_E_REWORK_MAX = 5.0;  // ΔE < 5.0  → REWORK; ≥ 5.0 → SCRAP

// Delta-E yaxlitlash koeffitsienti (3 kasr)
export const DELTA_E_ROUND_FACTOR = 1_000;

// ─── Pareto 80/20 tahlili ─────────────────────────────────────────────────────
export const PARETO_VITAL_FEW_PCT = 80.5; // kumulyativ % ≤ 80.5 → "vital few"

// ─── Spoilage (isrof) ─────────────────────────────────────────────────────────
export const SPOILAGE_ALARM_MULTIPLIER = 2; // actual > 2 × standart → alarm
