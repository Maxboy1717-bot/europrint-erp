#!/usr/bin/env node
/**
 * Aggressive fetch→apiRequest auto-migration (v2).
 * Patterns handled:
 *   GET    fetch('/api/X')                                   → apiRequest('GET', '/api/X')
 *   GET    fetch('/api/X', { credentials: 'include' })       → apiRequest('GET', '/api/X')
 *   GET    fetch('/api/X', { method: 'GET', ... })           → apiRequest('GET', '/api/X')
 *   POST   fetch('/api/X', { method: 'POST', body: JSON.stringify(b) })
 *                                                            → apiRequest('POST', '/api/X', b)
 *   POST   fetch('/api/X', { method: 'POST', body: JSON.stringify(b), headers: {...} })
 *                                                            → apiRequest('POST', '/api/X', b)
 *   DELETE fetch('/api/X', { method: 'DELETE' })             → apiRequest('DELETE', '/api/X')
 *
 * Inserts `import { apiRequest } from '@/lib/queryClient'` if missing.
 * Skips files where fetch is called with auth-header-customizing options
 * that the transform would lose (heuristic: presence of `Authorization` in
 * the options object).
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
    else if ((name.endsWith('.tsx') || name.endsWith('.ts'))
      && !name.includes('.spec.')
      && !name.includes('.test.')
      && name !== 'queryClient.ts'
      && name !== 'api-request.ts'
      && name !== 'auth-refresh.ts') out.push(p);
  }
  return out;
}

let filesChanged = 0;
let rewrites = 0;

for (const file of walk(FE)) {
  let src;
  try { src = readFileSync(file, 'utf-8'); } catch { continue; }
  const before = src;

  // Pattern A: bare GET fetch — no options
  src = src.replace(
    /\bfetch\(\s*(['"`]\/api\/[^'"`]+['"`])\s*\)/g,
    (_m, url) => { rewrites++; return `apiRequest('GET', ${url})`; },
  );

  // Pattern B: GET fetch with simple options object containing only method/credentials/headers (no body)
  // fetch('/api/X', { credentials: 'include', headers: getAuthHeaders() })
  src = src.replace(
    /\bfetch\(\s*(['"`]\/api\/[^'"`]+['"`])\s*,\s*\{\s*(?:method:\s*['"`]GET['"`]\s*,\s*)?(?:credentials:\s*['"`][^'"`]+['"`]\s*,?\s*)?(?:headers:\s*[^}]+)?\s*\}\s*\)/g,
    (m, url) => {
      // Skip if Authorization is being set inline (preserves manual override)
      if (m.includes('Authorization')) return m;
      rewrites++;
      return `apiRequest('GET', ${url})`;
    },
  );

  // Pattern C: fetch with method+body — POST/PUT/PATCH/DELETE
  // fetch('/api/X', { method: 'POST', body: JSON.stringify(body) })
  // fetch('/api/X', { method: 'POST', body: JSON.stringify(body), headers: {...} })
  // fetch('/api/X', { method: 'POST', headers: {...}, body: JSON.stringify(body) })
  src = src.replace(
    /\bfetch\(\s*(['"`]\/api\/[^'"`]+['"`])\s*,\s*\{\s*method:\s*['"`](POST|PUT|PATCH|DELETE)['"`]([^}]*?)\}\s*\)/g,
    (m, url, method, rest) => {
      if (m.includes('Authorization')) return m;
      // Extract body if present: JSON.stringify(EXPR)
      const bodyMatch = rest.match(/body:\s*JSON\.stringify\(([^)]+)\)/);
      rewrites++;
      if (bodyMatch) {
        return `apiRequest('${method}', ${url}, ${bodyMatch[1]})`;
      }
      return `apiRequest('${method}', ${url})`;
    },
  );

  if (src !== before) {
    if (!src.match(/import\s+\{[^}]*\bapiRequest\b[^}]*\}\s+from\s+['"]@\/lib\/queryClient['"]/)) {
      const lastImport = src.lastIndexOf("import ");
      const endOfLastImport = src.indexOf('\n', lastImport);
      if (endOfLastImport > 0) {
        src = src.slice(0, endOfLastImport + 1) +
          `import { apiRequest } from '@/lib/queryClient';\n` +
          src.slice(endOfLastImport + 1);
      }
    }
    writeFileSync(file, src, 'utf-8');
    filesChanged += 1;
  }
}

console.log(`Files rewritten : ${filesChanged}`);
console.log(`Total rewrites  : ${rewrites}`);
