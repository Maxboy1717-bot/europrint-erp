/**
 * Remove the injected `useTranslation`/`const { t } = useTranslation(...)` pairs
 * that collide with each file's existing `t` declaration.
 *
 * Strategy:
 *  1. For each target file, find every `const { t } = useTranslation(...)` line.
 *  2. If there is more than one declaration of `t` in the file, remove
 *     the injected ones (line of the form `const { t } = useTranslation(`).
 *  3. If after removal no `useTranslation` references remain, remove the
 *     `import { useTranslation } from '@/lib/i18n';` line as well.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';

const files = `src/pages/AIInterviewPublicPage.tsx
src/pages/AIInterviewPublicPageInterview.tsx
src/pages/CRMActivitiesSections.tsx
src/pages/CapacityPlanningSections.tsx
src/pages/CapacityPlanningTabs.tsx
src/pages/CashFlowManagementSections.tsx
src/pages/DisciplineDialogs.tsx
src/pages/DisciplineSections.tsx
src/pages/DocumentWorkflowPageDetail.tsx
src/pages/DocumentWorkflowPageSections.tsx
src/pages/GoodsReceiving.tsx
src/pages/InventoryCount.tsx
src/pages/IotOeeAlertsTab.tsx
src/pages/IotSensorsReadingsTab.tsx
src/pages/KanbanBoardSections.tsx
src/pages/PapkaOrdersDialogs.tsx
src/pages/PapkaOrdersSections.tsx
src/pages/PlanningBoardSections.tsx
src/pages/WarehouseDailyView.tsx
src/pages/WarehouseDailyViewDialogs.tsx
src/pages/WarehouseDailyViewSections.tsx
src/pages/WarehouseMaterialKits.tsx
src/pages/WarehouseMaterialKitsDialogs.tsx
src/pages/WarehouseMaterialKitsSections.tsx
src/pages/WmsAnalyticsSections.tsx
src/pages/barcode/LabelPrintDialog.tsx
src/pages/camera-dashboard-feeds.tsx
src/pages/camera-dashboard-panels.tsx
src/pages/camera-employee-ratings.tsx
src/pages/camera-employees.tsx
src/pages/camera-heatmap.tsx
src/pages/camera-machines.tsx
src/pages/camera-quality.tsx
src/pages/camera-reports.tsx
src/pages/camera-safety.tsx
src/pages/camera-settings.tsx
src/pages/cameras-management-sections.tsx
src/pages/cameras-management.tsx
src/pages/employee-profile/AttendanceTab.tsx
src/pages/employee-profile/LeaveTabSections.tsx
src/pages/employee-profile/PerformanceTabSections.tsx
src/pages/employee-profile/WorkTabSections.tsx
src/pages/employee-profile/WorkTabTables.tsx
src/pages/iot/IoTChecklistModal.tsx
src/pages/iot/IoTCompletionReport.tsx
src/pages/iot/IoTCompletionReportSections.tsx
src/pages/iot/IoTCompletionReportSteps.tsx
src/pages/iot/IoTLoginPanel.tsx
src/pages/iot/IoTProductionDashboard.tsx
src/pages/iot/IoTProductionDashboardDialogs.tsx
src/pages/iot/IoTProductionDashboardSections.tsx
src/pages/iot/IoTSchedulePanel.tsx
src/pages/kanban/CalendarView.tsx
src/pages/kanban/FlowsDialog.tsx
src/pages/kanban/GanttView.tsx
src/pages/kanban/MyPlanView.tsx
src/pages/kanban/NotificationsPanel.tsx
src/pages/kanban/RobotsDialog.tsx
src/pages/kanban/TaskDetailSheetActions.tsx
src/pages/kanban/detail/ChatPanel.tsx
src/pages/warehouse/BinsTabDialogs.tsx
src/pages/warehouse/BinsTabSections.tsx`.split('\n');

let totalRemoved = 0;
let filesEdited = 0;

for (const rel of files) {
  const full = path.join(ROOT, rel);
  let src;
  try {
    src = fs.readFileSync(full, 'utf8');
  } catch (e) {
    console.log('SKIP (missing):', rel);
    continue;
  }

  const original = src;

  // 1) Remove every `const { t } = useTranslation(...)` line (with trailing ;\n).
  // Pattern: starts at beginning of line (after whitespace), const { t } = useTranslation("common"); or similar
  const declRe = /^[ \t]*const \{ t \} = useTranslation\([^)]*\);?[ \t]*\r?\n/gm;
  let removeCount = (src.match(declRe) || []).length;
  src = src.replace(declRe, '');

  // 2) Also remove any standalone import line  import { useTranslation } from '@/lib/i18n';
  // but ONLY if `useTranslation` is no longer referenced anywhere else.
  if (!/useTranslation\s*\(/.test(src) && !/useTranslation[,}\s]/.test(src.split('import')[0] + '')) {
    // Safer: count references after removal
    const stillRef = /useTranslation/.test(src.replace(/import\s*\{[^}]*useTranslation[^}]*\}\s*from\s*['"]@\/lib\/i18n['"];?[ \t]*\r?\n/g, ''));
    if (!stillRef) {
      src = src.replace(/^import\s*\{\s*useTranslation\s*\}\s*from\s*['"]@\/lib\/i18n['"];?[ \t]*\r?\n/gm, '');
      // Also handle when useTranslation is part of a bigger import: `import { foo, useTranslation } from '@/lib/i18n';`
      src = src.replace(/(import\s*\{[^}]*),\s*useTranslation(\s*\})/g, '$1$2');
      src = src.replace(/(import\s*\{\s*)useTranslation\s*,\s*([^}]*\})/g, '$1$2');
    }
  }

  if (src !== original) {
    fs.writeFileSync(full, src, 'utf8');
    filesEdited++;
    totalRemoved += removeCount;
    console.log(`EDITED ${rel}: removed ${removeCount} declarations`);
  } else {
    console.log(`NOCHANGE ${rel}`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Declarations removed:', totalRemoved);
