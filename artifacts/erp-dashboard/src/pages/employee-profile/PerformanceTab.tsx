/**
 * @module PerformanceTab
 * @description React page component. Route-level UI.
 * Orchestrates KPI cards, MES section, WMS section, ABC charts, and course stats.
 */

import type { PerformanceTabProps } from "./PerformanceTabTypes";
import {
  KpiSummaryCards,
  MesSection,
  WmsSection,
  AbcChartSection,
  CourseStatsSection,
} from "./PerformanceTabSections";

export function PerformanceTab({
  t,
  tCommon,
  loadingAbc,
  loadingProgress,
  abcData,
  courseProgress,
  metrics,
  attendanceStats,
  getGradeColor,
  mesSummary,
  loadingMes,
  wmsSummary,
  loadingWms,
}: PerformanceTabProps) {
  return (
    <div className="space-y-6">
      {/* HR KPI summary cards */}
      <KpiSummaryCards
        t={t}
        loadingAbc={loadingAbc}
        loadingProgress={loadingProgress}
        abcData={abcData}
        courseProgress={courseProgress}
        attendanceStats={attendanceStats}
        getGradeColor={getGradeColor}
      />

      {/* MES — Ishlab chiqarish bo'limi */}
      <MesSection mesSummary={mesSummary} loadingMes={loadingMes} />

      {/* WMS — Material sarfi va intizom */}
      <WmsSection wmsSummary={wmsSummary} loadingWms={loadingWms} />

      {/* ABC Baholash va oylik natijalar */}
      {!(loadingAbc || loadingProgress) && (
        <AbcChartSection
          tCommon={tCommon}
          abcData={abcData}
          metrics={metrics}
          getGradeColor={getGradeColor}
        />
      )}

      {/* Kurslar statistikasi */}
      {!(loadingAbc || loadingProgress) && (
        <CourseStatsSection courseProgress={courseProgress} />
      )}
    </div>
  );
}
