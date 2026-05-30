/**
 * @module camera-reports-types
 * @description Types, translation labels and constants for the camera-reports
 *   page. Split out so the page composition stays under 300 lines.
 */

export const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export interface SafetyStat {
  violationType: string;
  count: number;
}

export interface QualityStat {
  defectType: string;
  count: number;
}

export interface TopEmployee {
  id: string | number;
  userId: string;
  shift: string;
  activeTime: number;
  overallScore: number;
}

export type ReportLanguage = "uz" | "ru";
export type ReportPeriod = "daily" | "weekly" | "monthly";

export interface ReportLabels {
  title: string;
  subtitle: string;
  back: string;
  daily: string;
  weekly: string;
  monthly: string;
  safety: string;
  quality: string;
  productivity: string;
  machines: string;
  downloadPDF: string;
  downloadExcel: string;
  generating: string;
  summary: string;
  violations: string;
  defects: string;
  topEmployees: string;
  trend: string;
  noData: string;
}

export function buildLabels(language: ReportLanguage): ReportLabels {
  const isUz = language === "uz";
  return {
    title: isUz ? "AI Kamera Hisobotlari" : "Отчеты AI Камер",
    subtitle: isUz ? "Kunlik, haftalik va oylik hisobotlar" : "Ежедневные, еженедельные и ежемесячные отчеты",
    back: isUz ? "Orqaga" : "Назад",
    daily: isUz ? "Kunlik" : "Ежедневно",
    weekly: isUz ? "Haftalik" : "Еженедельно",
    monthly: isUz ? "Oylik" : "Ежемесячно",
    safety: isUz ? "Xavfsizlik" : "Безопасность",
    quality: isUz ? "Sifat" : "Качество",
    productivity: isUz ? "Samaradorlik" : "Производительность",
    machines: isUz ? "Mashinalar" : "Машины",
    downloadPDF: isUz ? "PDF yuklab olish" : "Скачать PDF",
    downloadExcel: isUz ? "Excel yuklab olish" : "Скачать Excel",
    generating: isUz ? "Yaratilmoqda..." : "Создание...",
    summary: isUz ? "Umumiy ko'rsatkichlar" : "Общие показатели",
    violations: isUz ? "Buzilishlar" : "Нарушения",
    defects: isUz ? "Nuqsonlar" : "Дефекты",
    topEmployees: isUz ? "Eng yaxshi xodimlar" : "Лучшие сотрудники",
    trend: isUz ? "Trend tahlili" : "Анализ тенденций",
    noData: isUz ? "Ma'lumot yo'q" : "Нет данных",
  };
}

export async function downloadReport(
  format: "pdf" | "xlsx",
  period: ReportPeriod,
  apiRequest: (method: string, url: string) => Promise<unknown>
): Promise<void> {
  void apiRequest; // unused; raw fetch is needed for binary blob
  const endpoint = format === "pdf" ? "generate-pdf" : "generate-excel";
  // eslint-disable-next-line no-restricted-globals -- binary blob (PDF/Excel); apiRequest() unwraps JSON and can't return Blob
  const response = await fetch(`/api/camera-reports/${endpoint}?period=${period}`, { credentials: "include" });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `camera-report-${period}-${new Date().toISOString().split("T")[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
