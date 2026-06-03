#!/usr/bin/env node
/**
 * check-form-has-save.mjs — Q-43 governance guard (WARN, non-blocking).
 *
 * Diff-aware ratchet: scans STAGED frontend page files (artifacts/erp-dashboard/src/**.tsx).
 * If a file renders a FORM (inputs + a save/submit button) but has NO real save path
 * (no useMutation, no `.mutate(...)`, no `apiRequest('POST'|'PUT'|'PATCH', ...)`, no
 * `fetch(... method: 'POST'|'PUT'|'PATCH')`), it WARNS — the form likely only mutates
 * local state (fake-save), which violates Q-43 ("forma saqlash majburiy").
 *
 * Escape: add `// no-save-form` anywhere in the file (genuinely read-only form / display-only).
 *
 * Always exits 0 (advisory). Pre-commit wires it with `|| true`.
 * Self-test:  node scripts/check-form-has-save.mjs --selftest
 *
 * Rule source: CLAUDE.md Q-43 (every form does a real POST/PUT -> INSERT/UPDATE -> DB).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SKIP = [/\.spec\./i, /\.test\./i, /__tests__/i, /[\\/]fixtures[\\/]/i, /StubPage/i];

// A form should save when it has form inputs AND a save/submit affordance.
const INPUT = /<(input|textarea|select)\b|<Input\b|<Textarea\b|<Select\b|useForm\s*\(|<form\b/i;
const SAVE_BTN =
  /type=["']submit["']|onSubmit=|\b(Saqlash|Saqla|Save|Сохранить|Yangilash|Update|Qo'?shish|Yarat(ish)?|Submit|Yuborish|Jo'?nat(ish)?)\b/i;
// A real save path: a mutation or a write-method API call.
const SAVE_CALL =
  /useMutation\s*[(<]|\.mutate(Async)?\s*\(|apiRequest\s*\(\s*["'](POST|PUT|PATCH)["']|fetch\s*\([^)]*method\s*:\s*["'](POST|PUT|PATCH)["']/i;
const ESCAPE = /\/\/\s*no-save-form/;

/** Pure analysis used by both the live scan and the self-test. */
export function analyze(content) {
  return {
    isForm: INPUT.test(content) && SAVE_BTN.test(content),
    hasSave: SAVE_CALL.test(content),
    hasEscape: ESCAPE.test(content),
  };
}

function shouldWarn(content) {
  const a = analyze(content);
  return a.isForm && !a.hasSave && !a.hasEscape;
}

function selftest() {
  const saving = `
    import { useMutation } from '@tanstack/react-query';
    export default function F() {
      const m = useMutation({ mutationFn: (d) => apiRequest('POST', '/api/x', d) });
      return <form onSubmit={m.mutate}><Input/><button type="submit">Saqlash</button></form>;
    }`;
  const localOnly = `
    import { useState } from 'react';
    export default function F() {
      const [v, setV] = useState('');
      return <form><Input value={v} onChange={e => setV(e.target.value)}/><button>Saqlash</button></form>;
    }`;
  const escaped = localOnly + '\n// no-save-form\n';

  const cases = [
    ['saving form (real mutation)', saving, false],
    ['local-only form (fake save)', localOnly, true],
    ['escaped read-only form', escaped, false],
  ];
  let ok = true;
  for (const [name, src, expectWarn] of cases) {
    const got = shouldWarn(src);
    const pass = got === expectWarn;
    ok = ok && pass;
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name} → warn=${got} (expected ${expectWarn})`);
  }
  console.log(ok ? '✅ check-form-has-save selftest PASS' : '❌ check-form-has-save selftest FAIL');
  process.exit(ok ? 0 : 1);
}

function main() {
  if (process.argv.includes('--selftest')) selftest();

  const FE = /artifacts[\\/]erp-dashboard[\\/]src[\\/].*\.tsx$/i;

  let files = [];
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    files = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    files = (e.stdout || '').toString().split('\n').map((s) => s.trim()).filter(Boolean);
  }

  const targets = files.filter((f) => FE.test(f) && !SKIP.some((re) => re.test(f)));
  const warns = [];
  for (const f of targets) {
    let content = '';
    try {
      content = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    if (shouldWarn(content)) warns.push(f);
  }

  if (!targets.length) {
    console.log('check-form-has-save: no staged FE page files.');
  } else if (warns.length) {
    console.warn('\n⚠️  Q-43 check-form-has-save: form(s) with no real save path (POST/PUT/PATCH or mutation):');
    for (const f of warns) console.warn(`   ${f} — wire a useMutation / apiRequest('POST'|'PUT', ...) so the form saves to the DB.`);
    console.warn("   A form must save for real (Q-43). Read-only form? add `// no-save-form`.\n");
  } else {
    console.log(`check-form-has-save: ${targets.length} staged FE file(s) scanned, all forms have a save path.`);
  }
  process.exit(0);
}

// Only run the live scan when invoked directly (not when imported for self-test/reuse).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();
