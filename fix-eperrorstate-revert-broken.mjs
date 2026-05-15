#!/usr/bin/env node
/**
 * fix-eperrorstate-revert-broken.mjs — for files where my previous bulk-fix
 * added `error={error}` to EPErrorState but `error` is not a defined identifier
 * (destructure pattern didn't match), revert the prop addition so the file
 * compiles again. The file still gets the retry handler; it just won't show
 * status-aware error UI on that page (acceptable fallback).
 */
import fs from 'node:fs';

const broken = [
  'artifacts/erp-dashboard/src/camera-ai-modern/pages/CameraAIModernHub.tsx',
  'artifacts/erp-dashboard/src/pages/Analytics.tsx',
  'artifacts/erp-dashboard/src/pages/BarcodeSystem.tsx',
  'artifacts/erp-dashboard/src/pages/BOMManagement.tsx',
  'artifacts/erp-dashboard/src/pages/BudgetManagement.tsx',
  'artifacts/erp-dashboard/src/pages/CapacityPlanning.tsx',
  'artifacts/erp-dashboard/src/pages/CashRegister.tsx',
  'artifacts/erp-dashboard/src/pages/CRMWorkspace.tsx',
  'artifacts/erp-dashboard/src/pages/Discipline.tsx',
  'artifacts/erp-dashboard/src/pages/Employees.tsx',
  'artifacts/erp-dashboard/src/pages/EuroprintControlPage.tsx',
  'artifacts/erp-dashboard/src/pages/FinanceDashboard.tsx',
  'artifacts/erp-dashboard/src/pages/IncomeExpense.tsx',
  'artifacts/erp-dashboard/src/pages/InventoryValuation.tsx',
  'artifacts/erp-dashboard/src/pages/IoTDashboard.tsx',
  'artifacts/erp-dashboard/src/pages/IoTTablet.tsx',
  'artifacts/erp-dashboard/src/pages/KanbanBoard.tsx',
  'artifacts/erp-dashboard/src/pages/MachineStatusPage.tsx',
  'artifacts/erp-dashboard/src/pages/MRODashboard.tsx',
  'artifacts/erp-dashboard/src/pages/OrderCreationWizard.tsx',
  'artifacts/erp-dashboard/src/pages/OrderStatusPage.tsx',
  'artifacts/erp-dashboard/src/pages/PlanningBoard.tsx',
  'artifacts/erp-dashboard/src/pages/RaciCrisisPage.tsx',
  'artifacts/erp-dashboard/src/pages/RoutingConfigurationSections.tsx',
  'artifacts/erp-dashboard/src/pages/ShiftSchedule.tsx',
  'artifacts/erp-dashboard/src/pages/StockReservation.tsx',
];

let fixed = 0;
for (const f of broken) {
  let content;
  try { content = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const before = content;
  // Remove ` error={error}` (the trailing space we inserted)
  content = content.replace(/\s+error=\{error\}(\s*\/>)/g, '$1');
  if (content !== before) {
    fs.writeFileSync(f, content);
    fixed++;
  }
}
console.log(`Reverted error={error} in ${fixed} files.`);
