#!/usr/bin/env node
/**
 * v3 — Multi-line fetch transformer.
 *
 * Handles cases where fetch options span multiple lines:
 *   fetch("/api/X", {
 *     method: "POST",
 *     headers: { ... },
 *     body: JSON.stringify(data),
 *   })
 *   → apiRequest('POST', '/api/X', data)
 *
 * Strategy: match `fetch(...)` with balanced parens (small-state-machine),
 * then parse the options to extract method + body.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const FE = join(ROOT, 'artifacts', 'erp-dashboard', 'src');

const SKIP_BASENAMES = new Set([
  'queryClient.ts', 'api-request.ts', 'auth-refresh.ts', 'useAuth.tsx',
  'errorLogger.ts', 'upload.ts', 'webPush.ts',
  'Login.tsx', 'useIoTTabletAuth.ts',
  'useIoTTablet.ts', 'useIoTTabletAlerts.ts', 'useIoTTabletData.ts',
]);

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
      && !SKIP_BASENAMES.has(name)) out.push(p);
  }
  return out;
}

/**
 * Find every `fetch('/api/X', {...})` with balanced-paren parsing across newlines.
 * Returns transformed source.
 */
function transformMultiline(src) {
  let i = 0;
  const out = [];
  let changes = 0;
  while (i < src.length) {
    const j = src.indexOf('fetch(', i);
    if (j < 0) { out.push(src.slice(i)); break; }
    out.push(src.slice(i, j));
    // Find matching closing paren
    let depth = 1;
    let k = j + 6;
    while (k < src.length && depth > 0) {
      const c = src[k];
      if (c === '(' || c === '{' || c === '[') depth++;
      else if (c === ')' || c === '}' || c === ']') depth--;
      if (depth === 0) break;
      // Skip string literals
      if (c === "'" || c === '"' || c === '`') {
        const quote = c;
        k++;
        while (k < src.length && src[k] !== quote) {
          if (src[k] === '\\') k++;
          k++;
        }
      }
      k++;
    }
    if (depth !== 0) { out.push(src.slice(j)); break; }
    const inner = src.slice(j + 6, k);  // contents between fetch( and )
    const after = src.slice(k + 1);

    // Parse: first arg is the URL (string literal or template literal)
    let urlMatch = inner.match(/^\s*(['"`])([^'"`]+)\1/);
    if (!urlMatch || !urlMatch[2].startsWith('/api/')) {
      // Not a /api/ fetch — leave alone
      out.push(src.slice(j, k + 1));
      i = k + 1;
      continue;
    }
    const url = `${urlMatch[1]}${urlMatch[2]}${urlMatch[1]}`;
    const restOfArgs = inner.slice(urlMatch[0].length).replace(/^\s*,\s*/, '');

    // Determine method (default GET) and body
    let method = 'GET';
    const mm = restOfArgs.match(/method:\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]/);
    if (mm) method = mm[1];
    const bm = restOfArgs.match(/body:\s*JSON\.stringify\(\s*([^)]+?)\s*\)/);
    const hasCustomAuth = /Authorization\s*:/.test(restOfArgs);

    if (hasCustomAuth) {
      // Manual override — leave alone
      out.push(src.slice(j, k + 1));
    } else if (method === 'GET' && !bm) {
      out.push(`apiRequest('GET', ${url})`);
      changes++;
    } else if (bm) {
      out.push(`apiRequest('${method}', ${url}, ${bm[1]})`);
      changes++;
    } else {
      out.push(`apiRequest('${method}', ${url})`);
      changes++;
    }
    i = k + 1;
  }
  return { src: out.join(''), changes };
}

let filesChanged = 0;
let totalRewrites = 0;

for (const file of walk(FE)) {
  let src;
  try { src = readFileSync(file, 'utf-8'); } catch { continue; }
  const before = src;
  const { src: newSrc, changes } = transformMultiline(src);
  if (changes > 0 && newSrc !== before) {
    let finalSrc = newSrc;
    if (!finalSrc.match(/import\s+\{[^}]*\bapiRequest\b[^}]*\}\s+from\s+['"]@\/lib\/queryClient['"]/)) {
      const lastImport = finalSrc.lastIndexOf("import ");
      const endOfLastImport = finalSrc.indexOf('\n', lastImport);
      if (endOfLastImport > 0) {
        finalSrc = finalSrc.slice(0, endOfLastImport + 1) +
          `import { apiRequest } from '@/lib/queryClient';\n` +
          finalSrc.slice(endOfLastImport + 1);
      }
    }
    writeFileSync(file, finalSrc, 'utf-8');
    filesChanged++;
    totalRewrites += changes;
  }
}

console.log(`Files rewritten : ${filesChanged}`);
console.log(`Total rewrites  : ${totalRewrites}`);
