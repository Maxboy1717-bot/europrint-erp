
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module GoalsKPITypes
 * @description Interfaces, types, and constants for GoalsKPI.
 */

export const CATEGORIES = [
  { value: "learning", label: tLabel('common.GoalsKPI.oquvTalimOlish', "O'quv (ta'lim olish)") },
  { value: "completion", label: tLabel('common.GoalsKPI.tugatishKurslarniYakunlash', "Tugatish (kurslarni yakunlash)") },
  { value: "engagement", label: "Faollik (ishtirok darajasi)" },
  { value: "performance", label: "Natija (ish samaradorligi)" },
  { value: "retention", label: "Saqlab qolish (xodimlarni ushlab turish)" },
];

export const TARGET_TYPES = [
  { value: "global", label: "Umumiy" },
  { value: "department", label: tLabel('common.GoalsKPI.bolim', "Bo'lim") },
  { value: "position", label: tLabel('common.GoalsKPI.lavozim', "Lavozim") },
  { value: "user", label: tLabel('common.GoalsKPI.xodim', "Xodim") },
];

export const PRIORITIES = [
  { value: "low", label: "Past", color: "bg-blue-500" },
  { value: "medium", label: tLabel('common.GoalsKPI.orta', "O'rta"), color: "bg-yellow-500" },
  { value: "high", label: "Yuqori", color: "bg-orange-500" },
  { value: "critical", label: "Juda muhim", color: "bg-red-500" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: tLabel('common.GoalsKPI.faol', "Faol"), color: "bg-green-500" },
  { value: "completed", label: "Bajarildi", color: "bg-blue-500" },
  { value: "failed", label: "Bajarilmadi", color: "bg-red-500" },
  { value: "cancelled", label: tLabel('common.GoalsKPI.bekorQilindi', "Bekor qilindi"), color: "bg-gray-500" },
];

export function getProgressPercentage(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(((current ?? 0) / target) * 100, 100);
}

export function getPriorityColor(priority: string): string {
  return PRIORITIES.find(p => p.value === priority)?.color || "bg-gray-500";
}

export function getStatusColor(status: string): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || "bg-gray-500";
}
