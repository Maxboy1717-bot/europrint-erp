#!/usr/bin/env node
/**
 * check-endpoint-test.mjs — Q-29 governance guard (WARN, non-blocking).
 *
 * Warns when a STAGED controller adds a new route (@Get/@Post/@Put/@Patch/@Delete) but no
 * *.spec.ts / *.e2e-spec.ts references that controller class — a nudge toward the
 * verify-don't-trust habit of testing new endpoints. Always exits 0 (advisory).
 *
 * A spec staged in the same commit counts (git ls-files includes the index), so adding a
 * controller + its test together is clean.
 *
 * Rule source: CLAUDE.md Q-29 (verify-don't-trust).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let diff = '';
try {
  diff = execSync('git diff --cached --unified=0 -- "*.controller.ts"', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  diff = (e.stdout || '').toString();
}

const ROUTE = /^\+\s*@(?:Get|Post|Put|Patch|Delete)\s*\(/;
const filesWithNew = new Set();
let file = null;
for (const raw of diff.split('\n')) {
  if (raw.startsWith('+++ ')) { file = raw.replace(/^\+\+\+ b\//, '').trim(); continue; }
  if (ROUTE.test(raw) && file) filesWithNew.add(file);
}

if (!filesWithNew.size) {
  console.log('check-endpoint-test: no new controller endpoints staged.');
  process.exit(0);
}

// Build one blob of all spec content (tracked + staged, since git ls-files reads the index).
let specFiles = [];
try {
  specFiles = execSync('git ls-files "*.spec.ts" "*.e2e-spec.ts"', { encoding: 'utf8' }).split('\n').filter(Boolean);
} catch { /* ignore */ }
const specBlob = specFiles.map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');

const warns = [];
for (const f of filesWithNew) {
  let cls = null;
  try {
    const m = readFileSync(f, 'utf8').match(/export\s+class\s+(\w+Controller)/);
    cls = m ? m[1] : null;
  } catch { /* ignore */ }
  if (!cls) continue;
  if (!new RegExp('\\b' + cls + '\\b').test(specBlob)) warns.push({ file: f, cls });
}

if (warns.length) {
  console.warn('\n⚠️  Q-29 check-endpoint-test: new endpoint(s) without a referencing spec:');
  for (const w of warns) console.warn(`   ${w.file}  (${w.cls}) — no *.spec.ts / *.e2e-spec.ts references it.`);
  console.warn("   Reminder: add a test for new endpoints (Q-29 verify-don't-trust).\n");
} else {
  console.log('check-endpoint-test: new endpoints have referencing spec(s).');
}
process.exit(0);
