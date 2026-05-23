#!/usr/bin/env node
/**
 * @module hr-audit
 * @description HR module compliance checker. Ten file-pattern checks that map
 *   to the HR Production-Ready remediation plan
 *   (`docs/HR_PRODUCTION_AGENT_PROMPT.md`).
 *
 *   Each check returns `{ passed: boolean, detail: string, count?: number }`.
 *   The script aggregates results and either prints JSON (default) or a
 *   human-readable summary (`--summary`). With `--fail`, exits 1 if any check
 *   fails — for CI gating.
 *
 *   These are static file scans, not runtime tests. They surface known
 *   anti-patterns quickly; passing here means the file shape is right, not
 *   that behavior is correct. Pair with the e2e suites for actual coverage.
 *
 * Usage:
 *   node scripts/hr-audit.mjs              # JSON report
 *   node scripts/hr-audit.mjs --summary    # human-readable
 *   node scripts/hr-audit.mjs --fail       # exit 1 on any failure
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));

function walk(dir, predicate, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
      walk(p, predicate, out);
    } else if (predicate(entry, p)) {
      out.push(p);
    }
  }
  return out;
}

function readSafe(file) {
  try { return readFileSync(file, 'utf-8'); } catch { return ''; }
}

function rel(p) { return relative(ROOT, p).replace(/\\/g, '/'); }

// ─── Checks ─────────────────────────────────────────────────────────────

function checkUnprotectedHrControllers() {
  const dir = join(ROOT, 'apps', 'api', 'src', 'modules', 'hr');
  const files = walk(dir, n => n.endsWith('.controller.ts'));
  const unprotected = files.filter(f => {
    const src = readSafe(f);
    return src.includes('@Controller(') && !src.includes('@UseGuards');
  }).map(rel);
  return {
    passed: unprotected.length === 0,
    count: unprotected.length,
    detail: unprotected.length === 0
      ? 'All HR controllers declare @UseGuards.'
      : `Unprotected: ${unprotected.join(', ')}`,
  };
}

function checkMissingRolesOnPublicMethods() {
  // Heuristic: controllers with @UseGuards but no @Roles anywhere in the file
  // are wide open to any authenticated user — RolesGuard returns true when
  // no @Roles metadata is present (see roles.guard.ts).
  const dir = join(ROOT, 'apps', 'api', 'src', 'modules', 'hr');
  const files = walk(dir, n => n.endsWith('.controller.ts'));
  const gaps = files.filter(f => {
    const src = readSafe(f);
    return src.includes('@UseGuards') && !src.includes('@Roles(') && !src.includes('@Public()');
  }).map(rel);
  return {
    passed: gaps.length === 0,
    count: gaps.length,
    detail: gaps.length === 0
      ? 'Every guarded HR controller has @Roles or @Public.'
      : `Guarded but no @Roles/@Public: ${gaps.join(', ')}`,
  };
}

function checkAddEmployeeFields() {
  // Task 1.4: the adapter must map shift, salary_type, workshop_zone, age,
  // children_count, marital_status, housing_type, household_members,
  // attestation_date, latitude, longitude.
  const adapterPath = join(
    ROOT, 'apps', 'api', 'src', 'modules', 'compatibility', 'employees-payload.adapter.ts',
  );
  if (!existsSync(adapterPath)) {
    return { passed: false, count: 0, detail: `Adapter not found at ${rel(adapterPath)}` };
  }
  const src = readSafe(adapterPath);
  const required = [
    'shift', 'salaryType', 'workshopZone', 'age', 'childrenCount',
    'maritalStatus', 'housingType', 'householdMembers', 'attestationDate',
    'latitude', 'longitude',
  ];
  const missing = required.filter(field => !new RegExp(`\\b${field}\\b`).test(src));
  return {
    passed: missing.length === 0,
    count: missing.length,
    detail: missing.length === 0
      ? 'All 11 employee personal fields mapped in adapter.'
      : `Missing in adapter: ${missing.join(', ')}`,
  };
}

function checkSalaryMasking() {
  const profilePath = join(
    ROOT, 'artifacts', 'erp-dashboard', 'src', 'pages', 'EmployeeProfile.tsx',
  );
  if (!existsSync(profilePath)) {
    return { passed: false, count: 0, detail: `EmployeeProfile.tsx not found` };
  }
  const src = readSafe(profilePath);
  const hasRoleGate = /RoleGate/.test(src);
  const hasSalaryRef = /salary|baseSalary/i.test(src);
  return {
    passed: !hasSalaryRef || hasRoleGate,
    count: hasRoleGate ? 0 : 1,
    detail: hasRoleGate
      ? 'EmployeeProfile.tsx references RoleGate (presumed wrapping salary/PII).'
      : 'EmployeeProfile.tsx mentions salary but no RoleGate component is used.',
  };
}

function checkPiiEncryption() {
  // Look for EncryptionService and pgcrypto-based encrypt/decrypt
  const svcPath = join(
    ROOT, 'apps', 'api', 'src', 'shared', 'db', 'encryption.service.ts',
  );
  const repoPath = join(
    ROOT, 'apps', 'api', 'src', 'modules', 'hr', 'employees',
    'drizzle-employees.repo.ts',
  );
  const svcExists = existsSync(svcPath);
  const repoUsesEncrypt = existsSync(repoPath)
    && /encrypt|EncryptionService/.test(readSafe(repoPath));
  const passed = svcExists && repoUsesEncrypt;
  return {
    passed,
    count: passed ? 0 : 1,
    detail: passed
      ? 'EncryptionService present and referenced from employees repo.'
      : `Missing: ${[!svcExists && 'encryption.service.ts', !repoUsesEncrypt && 'repo encrypt usage'].filter(Boolean).join(', ')}`,
  };
}

function checkTenantIdCoverage() {
  // Count HR schemas that declare a tenant_id column.
  const schemaDir = join(ROOT, 'lib', 'db', 'src', 'schema');
  if (!existsSync(schemaDir)) {
    return { passed: false, count: 0, detail: 'lib/db/src/schema not found' };
  }
  const hrSchemaNames = [
    'employees', 'payroll', 'salary', 'leave', 'attendance',
    'recruitment', 'discipline', 'candidates', 'vacancies',
  ];
  const files = readdirSync(schemaDir).filter(f =>
    hrSchemaNames.some(n => f.toLowerCase().includes(n)),
  );
  const withTenant = files.filter(f =>
    /tenant_?[Ii]d/.test(readSafe(join(schemaDir, f))),
  );
  return {
    passed: files.length > 0 && withTenant.length === files.length,
    count: files.length - withTenant.length,
    detail: `${withTenant.length}/${files.length} HR schemas declare tenant_id`,
  };
}

function checkKanbanDragDrop() {
  const candidates = [
    join(ROOT, 'artifacts', 'erp-dashboard', 'src', 'pages', 'RecruitingKanban.tsx'),
    join(ROOT, 'artifacts', 'erp-dashboard', 'src', 'pages', 'RecruitingKanbanPage.tsx'),
  ];
  const found = candidates.find(existsSync);
  if (!found) return { passed: false, count: 0, detail: 'No RecruitingKanban page found' };
  const src = readSafe(found);
  const usesDndKit = /@dnd-kit\//.test(src) && /DndContext/.test(src);
  return {
    passed: usesDndKit,
    count: usesDndKit ? 0 : 1,
    detail: usesDndKit
      ? `${rel(found)} imports @dnd-kit/* with DndContext.`
      : `${rel(found)} does not use @dnd-kit (no real drag-drop).`,
  };
}

function checkCycleDetector() {
  const dir = join(ROOT, 'apps', 'api', 'src', 'modules', 'org-structure');
  if (!existsSync(dir)) {
    return { passed: false, count: 0, detail: 'org-structure module not found' };
  }
  const files = walk(dir, n => n.endsWith('.ts'));
  const hasDetector = files.some(f => /CycleDetector|wouldCreateCycle/.test(readSafe(f)));
  return {
    passed: hasDetector,
    count: hasDetector ? 0 : 1,
    detail: hasDetector
      ? 'CycleDetector / wouldCreateCycle referenced in org-structure.'
      : 'No cycle detection logic found in org-structure.',
  };
}

function checkSidebarDuplicates() {
  const candidates = [
    join(ROOT, 'artifacts', 'erp-dashboard', 'src', 'components', 'AppSidebar.tsx'),
    join(ROOT, 'artifacts', 'erp-dashboard', 'src', 'components', 'sidebar'),
  ];
  let combined = '';
  for (const c of candidates) {
    if (!existsSync(c)) continue;
    const st = statSync(c);
    if (st.isDirectory()) {
      walk(c, n => n.endsWith('.tsx') || n.endsWith('.ts')).forEach(f => {
        combined += readSafe(f) + '\n';
      });
    } else {
      combined += readSafe(c) + '\n';
    }
  }
  // The audit names two duplicate pairs. If both sides of either pair appear,
  // we still have a duplicate.
  const dupPairs = [
    ['/hr/succession', '/hr/succession-planning'],
    ['/hr/vacation-sick', '/hr/leave'],
  ];
  const dups = dupPairs.filter(([a, b]) => combined.includes(a) && combined.includes(b));
  return {
    passed: dups.length === 0,
    count: dups.length,
    detail: dups.length === 0
      ? 'No known HR sidebar duplicate pairs detected.'
      : `Duplicate pairs present: ${dups.map(p => p.join(' + ')).join('; ')}`,
  };
}

function checkHrFrontendTests() {
  const dir = join(ROOT, 'artifacts', 'erp-dashboard', 'src');
  const tests = walk(dir, n =>
    (n.endsWith('.test.tsx') || n.endsWith('.test.ts') || n.endsWith('.spec.tsx'))
    && /hr|employee|recruit|payroll|leave|attendance/i.test(n),
  );
  return {
    passed: tests.length >= 20,
    count: tests.length,
    detail: `${tests.length} HR-related frontend test files (target ≥ 20)`,
  };
}

// ─── Runner ─────────────────────────────────────────────────────────────

const CHECKS = {
  'unprotected-hr-controllers': checkUnprotectedHrControllers,
  'guarded-controllers-without-roles': checkMissingRolesOnPublicMethods,
  'addemployee-data-loss': checkAddEmployeeFields,
  'salary-masking': checkSalaryMasking,
  'pii-encryption': checkPiiEncryption,
  'tenant-id-coverage': checkTenantIdCoverage,
  'recruiter-kanban-dnd': checkKanbanDragDrop,
  'orgchart-cycle-detection': checkCycleDetector,
  'sidebar-duplicates': checkSidebarDuplicates,
  'frontend-test-coverage': checkHrFrontendTests,
};

const results = {};
for (const [name, fn] of Object.entries(CHECKS)) {
  try {
    results[name] = fn();
  } catch (e) {
    results[name] = { passed: false, count: 0, detail: `error: ${String(e)}` };
  }
}

const failed = Object.entries(results).filter(([, r]) => !r.passed);
const summary = {
  total: Object.keys(results).length,
  passed: Object.keys(results).length - failed.length,
  failed: failed.length,
};

if (process.argv.includes('--summary')) {
  console.log(`HR audit — ${summary.passed}/${summary.total} passed`);
  for (const [name, r] of Object.entries(results)) {
    const tag = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${tag}] ${name} — ${r.detail}`);
  }
} else {
  console.log(JSON.stringify({ summary, results }, null, 2));
}

if (process.argv.includes('--fail') && failed.length > 0) {
  process.exit(1);
}
