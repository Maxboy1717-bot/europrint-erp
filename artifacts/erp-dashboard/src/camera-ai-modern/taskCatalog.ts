/**
 * Har bir kamera uchun tanlanadigan AI topshiriqlar (ai_categories JSONB ga yoziladi).
 * Davlat / korporativ xavfsizlik kabi aniq nomlanishlar.
 */

export type AiTaskGroup = "perimeter" | "personnel" | "production" | "integrity";

export interface AiTaskDefinition {
  id: string;
  /** i18n kalit — security.json "CameraAI.task.<id>" ostida */
  labelKey: string;
  group: AiTaskGroup;
  /** Qisqa texnik izoh (operator uchun) */
  hintUz: string;
}

/** i18n kalit — security.json "CameraAI.taskGroup.<group>" ostida */
export const AI_TASK_GROUPS: Record<AiTaskGroup, { labelKey: string }> = {
  perimeter: { labelKey: "CameraAI.taskGroup.perimeter" },
  personnel: { labelKey: "CameraAI.taskGroup.personnel" },
  production: { labelKey: "CameraAI.taskGroup.production" },
  integrity: { labelKey: "CameraAI.taskGroup.integrity" },
};

/** Standart vazifa ro‘yxati — backend aiCategories massividagi qiymatlar */
export const AI_TASK_CATALOG: AiTaskDefinition[] = [
  {
    id: "perimeter_line",
    labelKey: "CameraAI.task.perimeter_line",
    group: "perimeter",
    hintUz: "Ruxsatsiz kirish, chegara bosib o‘tish",
  },
  {
    id: "access_control_visual",
    labelKey: "CameraAI.task.access_control_visual",
    group: "perimeter",
    hintUz: "Turniket / eshik zonasi",
  },
  {
    id: "safety_ppe",
    labelKey: "CameraAI.task.safety_ppe",
    group: "personnel",
    hintUz: "Kaska, ko‘zoynak, qo‘lqop",
  },
  {
    id: "face_attendance",
    labelKey: "CameraAI.task.face_attendance",
    group: "personnel",
    hintUz: "Ruxsatli ro‘yxat bilan solishtirish",
  },
  {
    id: "behavior_anomaly",
    labelKey: "CameraAI.task.behavior_anomaly",
    group: "personnel",
    hintUz: "Uzoq turish, yugurish, to‘planish",
  },
  {
    id: "quality_visual",
    labelKey: "CameraAI.task.quality_visual",
    group: "production",
    hintUz: "Nuqson, noto‘g‘ri qatlam",
  },
  {
    id: "productivity_line",
    labelKey: "CameraAI.task.productivity_line",
    group: "production",
    hintUz: "Bo‘sh turish, telefon",
  },
  {
    id: "machine_state_visual",
    labelKey: "CameraAI.task.machine_state_visual",
    group: "production",
    hintUz: "Ishlamoqda / to‘xtagan",
  },
  {
    id: "tamper_camera",
    labelKey: "CameraAI.task.tamper_camera",
    group: "integrity",
    hintUz: "Qalqib tushish, qoplash",
  },
  {
    id: "crowd_density",
    labelKey: "CameraAI.task.crowd_density",
    group: "integrity",
    hintUz: "Tirbandlik va xavf",
  },
];

export function normalizeCategories(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  return [];
}
