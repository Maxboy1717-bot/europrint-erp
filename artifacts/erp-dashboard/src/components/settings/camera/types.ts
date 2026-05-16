
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module types
 * @description React UI component.
 */

export interface CameraWithPrompt {
  id: string;
  code: string;
  name: string;
  location?: string;
  is_active: boolean;
  ai_prompt?: string;
  ai_categories?: string[];
  ai_sensitivity?: string;
  ai_enabled?: boolean;
}

export interface TriggerRule {
  id: string;
  detectionType: string;
  action: string;
  targetModule: string;
  severity: string;
  enabled: boolean;
  description?: string;
}

export interface CameraSettingsData {
  safetyThreshold: number;
  qualityThreshold: number;
  productivityThreshold: number;
  enableSafetyAlerts: boolean;
  enableQualityAlerts: boolean;
  enableMachineAlerts: boolean;
  enableProductivityAlerts: boolean;
  telegramEnabled: boolean;
  dailyReportTime: string;
  alertCooldown: number;
  autoPenalty: boolean;
  penaltyAmount: number;
}

export const CAMERA_TYPES = [
  { type: "entry", label: "Kirish kamerasi", labelRu: "Камера входа", defaultPrompt: "Yuz tanish va ruxsatsiz kirish aniqlash. Ro'yxatda yo'q shaxslar bo'lsa, darhol xabar ber. Niqobli yoki yuzini yashirgan odamlarni aniqlash." },
  { type: "production", label: "Sex kamerasi", labelRu: "Камера цеха", defaultPrompt: "Operator faolligi va PPE (shlem, ko'zoynak, qo'lqop) nazorati. Ishlamayotgan yoki g'ayrioperativ operatorlarni aniqlash. Xavfsizlik qoidalarini buzishni aniqlash." },
  { type: "machine", label: "Stanoq kamerasi", labelRu: "Камера станка", defaultPrompt: "Mahsulot sifati va xavf nazorati. Brak chiqimlarini vizual aniqlash. Stanoq atrofidagi xavfli holatlarni aniqlash. Tezlik va ritm o'zgarishlarini kuzat." },
  { type: "warehouse", label: "Ombor kamerasi", labelRu: "Камера склада", defaultPrompt: "Material harakati nazorati. Ruxsatsiz kirish va noto'g'ri saqlashni aniqlash. Tartibsiz yoki xavfli saqlash holatlarini xabar ber." },
  { type: "external", label: "Tashqi kamera", labelRu: "Внешняя камера", defaultPrompt: "Transport va mehmon harakati nazorati. Noma'lum transport vositalarini aniqlash. Zavod atrofi xavfsizligini nazorat qil." },
  { type: "canteen", label: "Oshxona kamerasi", labelRu: "Камера столовой", defaultPrompt: "Sanitariya va gigiena nazorati. Qo'l yuvsiz ovqat ulashni aniqlash. Tozalik talablarini buzishni xabar ber." },
];

export const DETECTION_TYPES = [
  { value: "ppe_violation", label: "PPE yo'qligi (shlem, ko'zoynak, qo'lqop)", module: "safety" },
  { value: "quality_defect", label: "Sifat nuqsoni aniqlash", module: "qc" },
  { value: "unauthorized_access", label: tLabel('common..ruxsatsizKirish', "Ruxsatsiz kirish"), module: "safety" },
  { value: "face_not_recognized", label: "Yuz tanilmadi", module: "hr" },
  { value: "fire_smoke", label: "Yong'in / Tutun aniqlash", module: "safety" },
  { value: "operator_idle", label: "Operator ishlamayapti", module: "mes" },
  { value: "material_misplaced", label: "Material noto'g'ri joyda", module: "wms" },
  { value: "machine_anomaly", label: "Stanoq anomaliyasi", module: "mes" },
  { value: "spill_detected", label: "Suyuqlik to'kilishi", module: "safety" },
  { value: "crowd_detected", label: "G'alayonli olomon", module: "safety" },
];

export const ACTION_OPTIONS = [
  { value: "safety_alert", label: tLabel('common..xavfsizlikAlerrtiYaratish', "Xavfsizlik alerrti yaratish") },
  { value: "qc_alert", label: tLabel('common..qcSifatAlertiYaratish', "QC sifat alerti yaratish") },
  { value: "hr_log", label: "HR tizimiga yozish" },
  { value: "mes_alert", label: tLabel('common..mesIshlabChiqarishAlerti', "MES ishlab chiqarish alerti") },
  { value: "wms_alert", label: "WMS ombor alerti" },
  { value: "access_denied_log", label: "Kirish bloklash yozuvi" },
  { value: "supervisor_notify", label: "Supervisor xabardor qilish" },
];

export const MODULE_LABELS: Record<string, string> = {
  safety: "Xavfsizlik",
  qc: "Sifat nazorati",
  hr: "HR",
  mes: "MES",
  wms: "WMS",
  security: "Xavfsizlik",
};

export const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Past", color: "text-[var(--ep-blue)]" },
  medium: { label: "O'rta", color: "text-[var(--ep-yellow)]" },
  high: { label: "Yuqori", color: "text-[var(--ep-primary)]" },
  critical: { label: "Kritik", color: "text-[var(--ep-red)]" },
};
