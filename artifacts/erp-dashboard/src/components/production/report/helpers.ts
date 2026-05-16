
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module helpers
 * @description React UI component.
 */

export const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  created:     { label: "Yaratildi",    variant: "secondary" },
  released:    { label: "Chiqarildi",   variant: "default" },
  in_progress: { label: tLabel('production.helpers.jarayonda', "Jarayonda"),   variant: "default" },
  completed:   { label: "Bajarildi",   variant: "default" },
  closed:      { label: "Yopildi",     variant: "secondary" },
  qc_hold:     { label: "QC To'xtatdi", variant: "destructive" },
};

export const SHIFT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  in_progress: { label: tLabel('production.helpers.jarayonda', "Jarayonda"),   variant: "default" },
  draft:       { label: "Qoralama",    variant: "secondary" },
  approved:    { label: "Tasdiqlandi", variant: "default" },
  rejected:    { label: "Rad etildi",  variant: "destructive" },
};

export const DEPARTMENTS = ["Flexo", "Gofra", "Flotto", "Rezka", "Offset", "Digital", "Laminatsiya"];

export const DOWNTIME_REASONS = [
  { value: "machine_failure", label: "Mashina nosozligi" },
  { value: "material_shortage", label: "Material kelmadi" },
  { value: "color_setup", label: "Rang sozlash" },
  { value: "planned_maintenance", label: "Rejalashtirilgan texnik ko'rik" },
  { value: "operator_break", label: "Operator tanaffusi" },
  { value: "quality_issue", label: "Sifat muammosi" },
  { value: "other", label: "Boshqa" },
];

export const PRIORITY_COLORS: Record<number, string> = {
  1: "text-[var(--ep-red)] font-bold",
  2: "text-[var(--ep-primary)] font-semibold",
  3: "text-muted-foreground",
  4: "text-muted-foreground",
  5: "text-muted-foreground",
};

export const TYPE_LABELS: Record<string, string> = {
  "box": "Quti",
  "sheet": "List",
  "roll": "Rulon",
  "other": "Boshqa",
};

export function formatNum(n: number | null | undefined, decimals = 0) {
  if (n == null) return "—";
  return Number(n).toLocaleString("uz-UZ", { maximumFractionDigits: decimals });
}

export function formatMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return Number(n).toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " so'm";
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return d; }
}

export function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

export function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}

export function getWeekRange(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay() || 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().split("T")[0],
    end: sun.toISOString().split("T")[0],
    label: `${mon.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" })} – ${sun.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" })}`,
  };
}

export function oeeColor(v: number) {
  if (v >= 85) return "text-[var(--ep-green)] font-bold";
  if (v >= 65) return "text-[var(--ep-yellow)] font-semibold";
  return "text-[var(--ep-red)] font-semibold";
}
