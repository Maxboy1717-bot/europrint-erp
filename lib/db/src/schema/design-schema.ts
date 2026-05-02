// §9 Dizayn + Tayyorlov moduli — status zanjirlari, holat konstantalari
// Task #6: new→ai_generated→designer_review→waiting_customer_approval→revision_requested→approved/rejected/archived

// ─── §9.1 Dizayn buyurtmasi holatlari ───────────────────────────────────────
export const DESIGN_ORDER_STATUSES = [
  "new",
  "ai_generated",
  "designer_review",
  "waiting_customer_approval",
  "revision_requested",
  "approved",
  "rejected",
  "archived",
] as const;
export type DesignOrderStatus = typeof DESIGN_ORDER_STATUSES[number];

export const DESIGN_ORDER_STATUS_LABELS: Record<DesignOrderStatus, string> = {
  new:                       "Yangi",
  ai_generated:              "AI generatsiya qilindi",
  designer_review:           "Dizayner ko'rib chiqmoqda",
  waiting_customer_approval: "Mijoz tasdig'i kutilmoqda",
  revision_requested:        "Tahrirlash so'raldi",
  approved:                  "Tasdiqlangan",
  rejected:                  "Rad etilgan",
  archived:                  "Arxivlangan",
};

export const DESIGN_ORDER_STATUS_COLORS: Record<DesignOrderStatus, string> = {
  new:                       "bg-slate-100 text-slate-700",
  ai_generated:              "bg-purple-100 text-purple-700",
  designer_review:           "bg-blue-100 text-blue-700",
  waiting_customer_approval: "bg-yellow-100 text-yellow-700",
  revision_requested:        "bg-orange-100 text-orange-700",
  approved:                  "bg-green-100 text-green-700",
  rejected:                  "bg-red-100 text-red-700",
  archived:                  "bg-gray-100 text-gray-500",
};

// Ruxsat etilgan status o'tishlar
export const DESIGN_ORDER_TRANSITIONS: Record<DesignOrderStatus, DesignOrderStatus[]> = {
  new:                       ["ai_generated", "archived"],
  ai_generated:              ["designer_review", "revision_requested", "archived"],
  designer_review:           ["waiting_customer_approval", "revision_requested"],
  waiting_customer_approval: ["approved", "revision_requested", "rejected"],
  revision_requested:        ["designer_review", "ai_generated"],
  approved:                  ["archived"],
  rejected:                  ["archived", "new"],
  archived:                  [],
};

// ─── §9.2 Individual dizayn versiya holatlari ────────────────────────────────
export const DESIGN_STATUSES = [
  "pending",
  "designer_review",
  "revision_requested",
  "approved",
  "rejected",
] as const;
export type DesignStatus = typeof DESIGN_STATUSES[number];

export const DESIGN_STATUS_LABELS: Record<DesignStatus, string> = {
  pending:            "Kutilmoqda",
  designer_review:   "Ko'rib chiqilmoqda",
  revision_requested: "Tahrirlash kerak",
  approved:           "Tasdiqlangan",
  rejected:           "Rad etilgan",
};

// ─── §9.3 Bosma asbob / qolip turlari (10 tur) ──────────────────────────────
export const TOOLING_TYPES = [
  "cliche",       // 1. Kleche (flexo bosma)
  "plate",        // 2. Plastina (offset bosma)
  "mold",         // 3. Qolip (termoformovka)
  "die_cut",      // 4. Biglovka qolip (kesish)
  "cylinder",     // 5. Silindr (rotogravür)
  "screen",       // 6. Trubka (serigrafi)
  "flexo",        // 7. Flexo aniloks val
  "gravure",      // 8. Gravür silindr
  "offset",       // 9. Offset plitasi
  "digital",      // 10. Raqamli sablon
] as const;
export type ToolingType = typeof TOOLING_TYPES[number];

export const TOOLING_TYPE_LABELS: Record<ToolingType, string> = {
  cliche:    "Kleche (Flexo)",
  plate:     "Plastina (Offset)",
  mold:      "Qolip (Termoform)",
  die_cut:   "Biglovka qolip",
  cylinder:  "Silindr (Rotogravür)",
  screen:    "Trubka (Serigrafi)",
  flexo:     "Flexo Aniloks val",
  gravure:   "Gravür silindr",
  offset:    "Offset plitasi",
  digital:   "Raqamli sablon",
};

// Har bir tur uchun standart maksimal foydalanish soni
export const TOOLING_MAX_USAGE: Record<ToolingType, number> = {
  cliche:    500_000,
  plate:     1_000_000,
  mold:      200_000,
  die_cut:   300_000,
  cylinder:  2_000_000,
  screen:    50_000,
  flexo:     800_000,
  gravure:   3_000_000,
  offset:    1_500_000,
  digital:   100_000,
};

export const TOOLING_STATUSES = [
  "active",
  "maintenance",
  "worn",
  "retired",
  "ordered",
] as const;
export type ToolingStatus = typeof TOOLING_STATUSES[number];

export const TOOLING_STATUS_LABELS: Record<ToolingStatus, string> = {
  active:      "Faol",
  maintenance: "Ta'mirlashda",
  worn:        "Eskirgan",
  retired:     "Chiqib ketgan",
  ordered:     "Buyurtma berilgan",
};

// ─── §9.4 AI tekshiruv turlari ───────────────────────────────────────────────
export const AI_CHECK_TYPES = [
  "spelling_uz",   // UZ imlosi
  "spelling_ru",   // RU imlosi
  "spelling_en",   // EN imlosi
  "bleed",         // Bleed 3mm
  "cmyk",          // CMYK rang modeli
  "logo_quality",  // Logo sifati (DPI)
  "overall",       // Umumiy tekshiruv
] as const;
export type AiCheckType = typeof AI_CHECK_TYPES[number];

export const AI_CHECK_LABELS: Record<AiCheckType, string> = {
  spelling_uz:  "UZ imlosi",
  spelling_ru:  "RU imlosi",
  spelling_en:  "EN imlosi",
  bleed:        "Bleed maydoni (3mm)",
  cmyk:         "CMYK rang modeli",
  logo_quality: "Logo sifati (DPI)",
  overall:      "Umumiy sifat",
};
