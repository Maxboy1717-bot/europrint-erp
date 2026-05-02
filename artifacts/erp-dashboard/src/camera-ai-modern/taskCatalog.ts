/**
 * Har bir kamera uchun tanlanadigan AI topshiriqlar (ai_categories JSONB ga yoziladi).
 * Davlat / korporativ xavfsizlik kabi aniq nomlanishlar.
 */

export type AiTaskGroup = "perimeter" | "personnel" | "production" | "integrity";

export interface AiTaskDefinition {
  id: string;
  labelUz: string;
  labelRu: string;
  group: AiTaskGroup;
  /** Qisqa texnik izoh (operator uchun) */
  hintUz: string;
}

export const AI_TASK_GROUPS: Record<AiTaskGroup, { uz: string; ru: string }> = {
  perimeter: { uz: "Perimetr va obyekt", ru: "Периметр и объект" },
  personnel: { uz: "Shaxs va davomat", ru: "Личности и учёт" },
  production: { uz: "Ishlab chiqarish", ru: "Производство" },
  integrity: { uz: "Tizim ishonchliligi", ru: "Целостность системы" },
};

/** Standart vazifa ro‘yxati — backend aiCategories massividagi qiymatlar */
export const AI_TASK_CATALOG: AiTaskDefinition[] = [
  {
    id: "perimeter_line",
    labelUz: "Chiziq va zona nazorati",
    labelRu: "Контроль линии и зоны",
    group: "perimeter",
    hintUz: "Ruxsatsiz kirish, chegara bosib o‘tish",
  },
  {
    id: "access_control_visual",
    labelUz: "Kirish punkti vizual tekshiruv",
    labelRu: "Визуальный контроль КПП",
    group: "perimeter",
    hintUz: "Turniket / eshik zonasi",
  },
  {
    id: "safety_ppe",
    labelUz: "JSH va maxsus kiyim (PPE)",
    labelRu: "СИЗ и спецодежда",
    group: "personnel",
    hintUz: "Kaska, ko‘zoynak, qo‘lqop",
  },
  {
    id: "face_attendance",
    labelUz: "Yuz orqali davomat",
    labelRu: "Учёт по лицу",
    group: "personnel",
    hintUz: "Ruxsatli ro‘yxat bilan solishtirish",
  },
  {
    id: "behavior_anomaly",
    labelUz: "Shubhali harakat / loitering",
    labelRu: "Подозрительное поведение",
    group: "personnel",
    hintUz: "Uzoq turish, yugurish, to‘planish",
  },
  {
    id: "quality_visual",
    labelUz: "Vizual sifat nazorati",
    labelRu: "Визуальный контроль качества",
    group: "production",
    hintUz: "Nuqson, noto‘g‘ri qatlam",
  },
  {
    id: "productivity_line",
    labelUz: "Liniya faolligi",
    labelRu: "Активность линии",
    group: "production",
    hintUz: "Bo‘sh turish, telefon",
  },
  {
    id: "machine_state_visual",
    labelUz: "Mashina holati (vizual)",
    labelRu: "Состояние оборудования",
    group: "production",
    hintUz: "Ishlamoqda / to‘xtagan",
  },
  {
    id: "tamper_camera",
    labelUz: "Kamera buzilish / qayta yo‘naltirish",
    labelRu: "Вмешательство в камеру",
    group: "integrity",
    hintUz: "Qalqib tushish, qoplash",
  },
  {
    id: "crowd_density",
    labelUz: "Odam zichligi",
    labelRu: "Плотность людей",
    group: "integrity",
    hintUz: "Tirbandlik va xavf",
  },
];

export function normalizeCategories(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  return [];
}
