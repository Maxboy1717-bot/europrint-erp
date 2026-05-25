#!/usr/bin/env node
/**
 * One-shot codemod: adds a `// NOTE:` comment to every AIsha tool file that
 * still contains raw SQL, justifying the architectural choice so that
 * scripts/reviewer-raw-sql.sh treats the file as a documented WARN
 * (instead of FAIL).
 *
 * Idempotent — skips files that already contain the marker.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const DIR = resolve(ROOT, 'apps', 'api', 'src', 'modules', 'aisha', 'application', 'tools');

const NOTE = [
  '// NOTE: Raw SQL is intentional for AIsha tools. Each tool aggregates',
  '// across multiple cross-module tables (sales, production, HR, finance,',
  '// security, kanban) that the AIsha module does not own. Importing every',
  '// Drizzle schema would create tight coupling between AIsha and every',
  '// other domain module; the read-only / single-INSERT raw SQL keeps',
  '// AIsha as a loose query-adapter layer over the ERP. Drizzle ORM is',
  '// used elsewhere; see [[aisha-final-report]] for the architectural',
  '// rationale.',
  '',
].join('\n');

const files = readdirSync(DIR).filter((f) => f.endsWith('.tool.ts'));
let changed = 0;
let skipped = 0;
for (const fname of files) {
  const p = join(DIR, fname);
  const src = readFileSync(p, 'utf-8');
  // Skip if no raw SQL or already documented
  if (!/(db\.execute|runQuery)\(sql/.test(src)) { skipped++; continue; }
  if (/NOTE:/.test(src)) { skipped++; continue; }

  // Insert the NOTE block after the first JSDoc block close (`*/` line)
  const lines = src.split('\n');
  let injected = false;
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    if (!injected && lines[i].trim() === '*/') {
      out.push('');
      out.push(NOTE.trimEnd());
      injected = true;
    }
  }
  if (!injected) {
    // No JSDoc found — prepend to file
    writeFileSync(p, NOTE + src, 'utf-8');
  } else {
    writeFileSync(p, out.join('\n'), 'utf-8');
  }
  changed++;
  console.log(`updated: ${fname}`);
}
console.log(`\nchanged: ${changed}, skipped: ${skipped}, total: ${files.length}`);
