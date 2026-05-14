#!/usr/bin/env node
/**
 * Fix files where my replacement added t() calls but no hook in scope.
 * Adds `const { t } = useTranslation('common');` to each component function
 * that uses t() but lacks the hook.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SRC = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src');

const files = [
  'components/chat/page/ChatLayoutMessages.tsx',
  'components/ui/breadcrumb.tsx',
  'components/ui/dialog.tsx',
  'components/ui/pagination.tsx',
  'components/ui/sheet.tsx',
  'components/ui/sidebar.tsx',
  'pages/AIInterviewPageSections.tsx',
  'pages/AIProductionPlanningDialogs.tsx',
  'pages/ApplicationsTable.tsx',
  'pages/CandidateReportDialogSections.tsx',
  'pages/DirectorExtendedSections.tsx',
  'pages/GoalsKPISections.tsx',
  'pages/HRDashboard.tsx',
  'pages/KaizenPageSections.tsx',
  'pages/LessonPlayerSectionsA.tsx',
  'pages/MMExtendedTabs.tsx',
  'pages/MMVendorsSections.tsx',
  'pages/MarketingCampaigns.tsx',
  'pages/MarketingExtendedSections.tsx',
  'pages/MarketingLeadsDialogs.tsx',
  'pages/MarketingSocialInboxSections.tsx',
  'pages/MaterialBalanceTables.tsx',
  'pages/MaterialsAccountingPanels.tsx',
  'pages/MaterialsAccountingSections.tsx',
  'pages/OrderCostingSections.tsx',
  'pages/OrdersRegistryDialogs.tsx',
  'pages/OrdersRegistrySections.tsx',
  'pages/PeriodClosing.tsx',
  'pages/PosWarehousePageSections.tsx',
  'pages/QCDashboardSections.tsx',
  'pages/SaaSExtendedSectionsA.tsx',
  'pages/SuperAdminPanelSections.tsx',
  'pages/TechCardsDialogs.tsx',
  'pages/TechPPExtendedSections.tsx',
  'pages/UsersPageDialogs.tsx',
  'pages/WMSDashboardDialogs.tsx',
  'pages/WMSExtendedDialogs.tsx',
  'pages/WMSExtendedSections.tsx',
  'pages/WMSExtendedSections2.tsx',
  'pages/WarehouseKirimWizardSteps.tsx',
  'pages/accountant/AuditConsoleSections.tsx',
  'pages/crm/ExtendedAIPanelSections.tsx',
  'pages/employee-profile/PerformanceTabWmsSections.tsx',
  'pos-monitor/components/PosAdminSections.tsx',
  'pos-monitor/pages/PosMovementKirimSteps.tsx',
  'pos-monitor/pages/PosWarehouses.tsx',
];

const I18N_IMPORT = "import { useTranslation } from '@/lib/i18n';";

function findFunctionStarts(content) {
  // Returns array of {pos, type} for each function/component definition start
  const positions = [];
  const lines = content.split('\n');
  let charPos = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match function declarations
    if (/^\s*(export\s+(default\s+)?)?function\s+[A-Z]\w*\s*[<(]/.test(line) ||
        /^\s*(export\s+)?const\s+[A-Z]\w*\s*[:=]/.test(line) ||
        /^\s*function\s+[A-Z]\w*\s*\(/.test(line)) {
      positions.push({ line: i, content: line });
    }
    charPos += line.length + 1;
  }
  return positions;
}

function fixFile(relPath) {
  const full = path.join(SRC, relPath);
  if (!fs.existsSync(full)) { console.log('Missing:', relPath); return; }
  let content = fs.readFileSync(full, 'utf8');

  // Ensure useTranslation is imported
  if (!/from\s+['"](@\/lib\/i18n|usePosI18n)['"]/.test(content)) {
    // Add import after last import
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImportIdx = i;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, I18N_IMPORT);
      content = lines.join('\n');
    }
  }

  // Walk through file and find function/component definitions
  // For each, if body uses t( without `const { t }` defined, inject hook
  const lines = content.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    out.push(line);
    // Detect a function body opening: balanced parens then `{` at end of line or next
    // Patterns:
    //   `function X(...) {` or `export function X(...) {`
    //   `export default function X(...) {`
    //   `const X = (...) => {`  or  `const X: FC<...> = (...) => {`
    //   `function X(...): RetType {`
    const fnMatch = line.match(/^(\s*)(?:export\s+(?:default\s+)?)?function\s+[A-Z]\w*[^{]*\{$/);
    const arrowMatch = line.match(/^(\s*)(?:export\s+)?const\s+[A-Z]\w*[^=]*=\s*[^=]*=>\s*\{$/);
    const m = fnMatch || arrowMatch;
    if (m) {
      // Find the function's body — collect until matching closing brace
      let depth = 1;
      let bodyEnd = i;
      const bodyLines = [];
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        bodyLines.push(l);
        if (depth === 0) { bodyEnd = j; break; }
      }
      const bodyText = bodyLines.join('\n');
      const usesT = /\bt\(\s*['"`][a-zA-Z]/.test(bodyText);
      const hasHook = /const\s*\{\s*t[\s,}]/.test(bodyText.slice(0, 500));
      const tInParams = /\bt\s*:/.test(line) || /,\s*t[,\s)}]/.test(line);
      if (usesT && !hasHook && !tInParams) {
        const indent = m[1] + '  ';
        out.push(`${indent}const { t } = useTranslation('common');`);
      }
    }
    i++;
  }

  const newContent = out.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(full, newContent, 'utf8');
    return true;
  }
  return false;
}

let fixed = 0;
for (const f of files) {
  if (fixFile(f)) fixed++;
}
console.log(`Fixed ${fixed}/${files.length} files`);
