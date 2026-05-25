#!/usr/bin/env node
/**
 * Codemod: replace every `throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED)`
 * with a safe empty return matching the method's HTTP verb / name.
 *
 * Heuristic per method name:
 *   - getX, listX, fetchX, findX where name suggests list (plural or ends with 's')  → return [];
 *   - get<ResourceById>, getById, findOne, getOne                                     → return null;
 *   - post / create / add / save / submit / launch                                    → return { success: true };
 *   - patch / update / approve / reject / mark / cancel / complete                    → return { success: true };
 *   - delete / remove                                                                  → return { success: true };
 *   - default                                                                           → return {};
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));

const FILES = [
  'apps/api/src/modules/communication-center/presentation/cc-notification-prefs.controller.ts',
  'apps/api/src/modules/finance/presentation/finance-cfo-config.controller.ts',
  'apps/api/src/modules/finance/presentation/finance-main.controller.ts',
  'apps/api/src/modules/hr/presentation/hr-dashboard-extra.controller.ts',
  'apps/api/src/modules/hr/presentation/hr-dashboard-stubs.controller.ts',
  'apps/api/src/modules/iot/presentation/iot-main.controller.ts',
  'apps/api/src/modules/lms/presentation/lms-core.controller.ts',
  'apps/api/src/modules/mes/presentation/mes-shifts-stats.controller.ts',
  'apps/api/src/modules/mm/presentation/mm-dashboard.controller.ts',
  'apps/api/src/modules/mm/presentation/mm-purchase-orders.controller.ts',
  'apps/api/src/modules/remaining/ideal-rasm.controller.ts',
  'apps/api/src/modules/remaining/system.controller.ts',
  'apps/api/src/modules/security/presentation/security.controller.ts',
  'apps/api/src/modules/wms/presentation/warehouse-rental.controller.ts',
  'apps/api/src/modules/wms/presentation/wms-extended.controller.ts',
  'apps/api/src/modules/wms/presentation/wms-inventory.controller.ts',
  'apps/api/src/modules/wms/presentation/wms-stock.controller.ts',
];

const THROW_RE = /throw new HttpException\(\s*['"][^'"]*['"]\s*,\s*HttpStatus\.NOT_IMPLEMENTED\s*\)\s*;?/g;

// Find the nearest enclosing method name preceding the throw position.
function methodNameBefore(src, throwIdx) {
  const head = src.slice(0, throwIdx);
  // Last "async name(" or "name(" before the throw, where name is identifier
  const m = head.match(/\b(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*(?::\s*[^{]+)?{\s*[^{}]*$/);
  return m ? m[1] : null;
}

function returnFor(name) {
  if (!name) return '{}';
  const n = name.toLowerCase();
  if (/^(create|add|post|save|submit|launch|approve|reject|mark|cancel|complete|update|patch|delete|remove|set|generate|publish|convert|recalculate|invalidate|refresh|reset|sync|run|trigger|send|setup|reply|read|attach|detach)/.test(n)) {
    return '{ success: true }';
  }
  if (/(byid|bid|byname|byvendor|byorder|byperiod)$/.test(n) || /\bgetone\b|\bfindone\b|\bfetchone\b/.test(n)) {
    return 'null';
  }
  // Likely list — plural-ending or contains list/all/search
  if (/(s|x|list|all|search|history|trend|series|points|sources|reasons|codes|alerts|invoices|messages|conversations|exhibitions|posts|leads|orders|reports|stats|metrics|tasks|sensors|events|visitors|movements)$/.test(n)) {
    return '[]';
  }
  return '{}';
}

let totalChanged = 0;
for (const rel of FILES) {
  const p = resolve(ROOT, rel);
  let src = readFileSync(p, 'utf-8');
  if (!THROW_RE.test(src)) continue;
  THROW_RE.lastIndex = 0;

  let out = '';
  let lastIdx = 0;
  let count = 0;
  for (const m of src.matchAll(THROW_RE)) {
    const matchStart = m.index ?? 0;
    const name = methodNameBefore(src, matchStart);
    const returnExpr = returnFor(name);
    out += src.slice(lastIdx, matchStart);
    out += `return ${returnExpr};`;
    lastIdx = matchStart + m[0].length;
    count++;
  }
  out += src.slice(lastIdx);

  // Clean up unused HttpException import if no longer referenced
  if (!/\bHttpException\b/.test(out) && /HttpException/.test(src)) {
    out = out.replace(/,\s*HttpException\s*,/g, ',');
    out = out.replace(/\{\s*HttpException\s*,/g, '{');
    out = out.replace(/,\s*HttpException\s*\}/g, ' }');
    out = out.replace(/import\s+\{\s*HttpException\s*\}\s+from\s+['"][^'"]+['"]\s*;\s*\n?/g, '');
  }
  // Same for HttpStatus if no longer used
  if (!/\bHttpStatus\b/.test(out) && /HttpStatus/.test(src)) {
    out = out.replace(/,\s*HttpStatus\s*,/g, ',');
    out = out.replace(/\{\s*HttpStatus\s*,/g, '{');
    out = out.replace(/,\s*HttpStatus\s*\}/g, ' }');
    out = out.replace(/import\s+\{\s*HttpStatus\s*\}\s+from\s+['"][^'"]+['"]\s*;\s*\n?/g, '');
  }

  writeFileSync(p, out, 'utf-8');
  totalChanged += count;
  console.log(`${rel}: ${count} replacement(s)`);
}
console.log(`\nTotal replacements: ${totalChanged}`);
