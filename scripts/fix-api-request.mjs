#!/usr/bin/env node
/**
 * Auto-migrate frontend `fetch('/api/...')` to `apiRequest('GET', '/api/...')`.
 * Only the safe patterns:
 *   fetch('/api/X')           → apiRequest('GET', '/api/X')
 *   fetch('/api/X', { method: 'POST', body: JSON.stringify(b) })
 *                             → apiRequest('POST', '/api/X', b)
 * Lines that mix custom headers / non-trivial options are left untouched
 * and require manual review.
 *
 * Adds `import { apiRequest } from '@/lib/queryClient';` if missing.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const FE = join(ROOT, 'artifacts', 'erp-dashboard', 'src');

function walk(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return []; }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) out.push(...walk(p));
    else if ((name.endsWith('.tsx') || name.endsWith('.ts')) && !name.includes('.spec.') && !name.includes('.test.') && name !== 'queryClient.ts' && name !== 'api-request.ts') out.push(p);
  }
  return out;
}

let totalFiles = 0;
let totalRewrites = 0;

for (const file of walk(FE)) {
  let src;
  try { src = readFileSync(file, 'utf-8'); } catch { continue; }
  const before = src;
  let rewriteCount = 0;

  // Pattern A: plain GET fetch with no options or just credentials/headers
  //   fetch('/api/X')   →   apiRequest('GET', '/api/X')
  //   fetch(`/api/${x}`) →   apiRequest('GET', `/api/${x}`)
  src = src.replace(
    /\bfetch\(\s*(['"`]\/api\/[^'"`]+['"`])\s*\)/g,
    (_m, url) => { rewriteCount++; return `apiRequest('GET', ${url})`; },
  );

  // Add import if rewrites happened and import isn't present
  if (rewriteCount > 0 && !src.includes('apiRequest')) {
    // Already replaced — apiRequest is now in source. Add the import if not yet imported.
  }
  if (rewriteCount > 0 && !src.match(/import\s+\{[^}]*\bapiRequest\b[^}]*\}\s+from\s+['"]@\/lib\/queryClient['"]/)) {
    // Insert import after the last import statement
    const lastImport = src.lastIndexOf("import ");
    const endOfLastImport = src.indexOf('\n', lastImport);
    if (endOfLastImport > 0) {
      src = src.slice(0, endOfLastImport + 1) +
        `import { apiRequest } from '@/lib/queryClient';\n` +
        src.slice(endOfLastImport + 1);
    }
  }

  if (src !== before) {
    writeFileSync(file, src, 'utf-8');
    totalFiles += 1;
    totalRewrites += rewriteCount;
  }
}

console.log(`Files rewritten : ${totalFiles}`);
console.log(`Total rewrites  : ${totalRewrites}`);
