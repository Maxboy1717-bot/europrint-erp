// ─── FMEA RPN chegaralari (IEC 60812 / AIAG FMEA standart) ──────────────────
export const FMEA_SOD_MIN = 1;           // S/O/D minimal ball
export const FMEA_SOD_MAX = 10;          // S/O/D maksimal ball

export const FMEA_CRITICAL_RPN = 200;    // RPN > 200 → ishlab chiqarishni to'xtatish
export const FMEA_HIGH_RPN = 100;        // RPN > 100 → tuzatish majburiy
export const FMEA_MEDIUM_RPN = 50;       // RPN > 50  → monitoring kerak

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
