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

/** BE `generateReport()` (camera-dashboard.service.ts) per-camera aggregate row shape. */
export interface CameraReportRow {
  camera: string | null;
  location: string | null;
  total_events: number;
  violations: number;
  defects: number;
}

interface CameraReportResponse {
  type: "pdf" | "excel";
  generated_at: string;
  period: { from: string; to: string };
  url: string;
  data: CameraReportRow[];
}

/** `period` → `{date_from, date_to}` ISO (YYYY-MM-DD) range expected by ReportGenerateBodySchema. */
function periodToDateRange(period: ReportPeriod): { date_from: string; date_to: string } {
  const to = new Date();
  const from = new Date(to);
  if (period === "daily") from.setDate(from.getDate() - 1);
  else if (period === "weekly") from.setDate(from.getDate() - 7);
  else from.setMonth(from.getMonth() - 1);
  return {
    date_from: from.toISOString().split("T")[0],
    date_to: to.toISOString().split("T")[0],
  };
}

const REPORT_COLUMNS = [
  { header: "Camera", key: "camera" },
  { header: "Location", key: "location" },
  { header: "Total events", key: "total_events" },
  { header: "Violations", key: "violations" },
  { header: "Defects", key: "defects" },
] as const;

export async function downloadReport(
  format: "pdf" | "xlsx",
  period: ReportPeriod,
  apiRequest: <T = unknown>(method: string, url: string, data?: unknown) => Promise<T>
): Promise<void> {
  const endpoint = format === "pdf" ? "generate-pdf" : "generate-excel";
  const { date_from, date_to } = periodToDateRange(period);
  const report = await apiRequest<CameraReportResponse>(
    "POST",
    `/api/camera-reports/${endpoint}`,
    { date_from, date_to }
  );
  const rows = Array.isArray(report?.data) ? report.data : [];
  const filenameBase = `camera-report-${period}-${new Date().toISOString().split("T")[0]}`;

  if (format === "pdf") {
    const { exportToPDF } = await import("@/lib/export-utils");
    await exportToPDF(
      filenameBase,
      rows as unknown as Record<string, unknown>[],
      REPORT_COLUMNS.map((c) => ({ header: c.header, accessor: (row) => row[c.key] as string | number | null }))
    );
  } else {
    const { exportToExcel } = await import("@/lib/export-utils");
    await exportToExcel(
      rows as unknown as Record<string, unknown>[],
      filenameBase,
      REPORT_COLUMNS.map((c) => ({ header: c.header, accessor: (row) => row[c.key] as string | number | null }))
    );
  }
}
