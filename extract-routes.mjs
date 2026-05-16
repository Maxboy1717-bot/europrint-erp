#!/usr/bin/env node
/** Walk routes/ files and extract every '/abc' string literal. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'artifacts/erp-dashboard/src/routes';
const re = /['"](\/[a-zA-Z][a-zA-Z0-9_/-]*)['"]/g;
const routes = new Set();

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue;
  const src = readFileSync(join(dir, f), 'utf-8');
  let m;
  while ((m = re.exec(src))) {
    const r = m[1];
    if (r.includes('://')) continue;
    if (r.startsWith('/api/')) continue; // API URLs, not frontend routes
    if (r.length < 2) continue;
    routes.add(r);
  }
}

const sorted = [...routes].sort();
writeFileSync('artifacts/erp-dashboard/e2e/i18n-routes.json',
  JSON.stringify({ routes: sorted }, null, 2));
console.log('Wrote', sorted.length, 'routes to e2e/i18n-routes.json');
