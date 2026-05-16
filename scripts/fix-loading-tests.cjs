/**
 * @module fix-loading-tests
 * @description One-off codemod for hook test files.
 *
 * The "exposes/reports loading state while ... fetch is pending" tests use a
 * never-resolving Promise to keep `isLoading: true`. Under Vitest 4 +
 * React 19 + jsdom this leaves a dangling React tree that times out the
 * next describe's beforeEach hook (15s).
 *
 * Fix per matched it/test block:
 *   - Capture the Promise resolver in `__resolveFetch`.
 *   - Make the it callback async, destructure `unmount`, then resolve +
 *     unmount + `await Promise.resolve()` at the end so React settles.
 */

const fs = require('fs');
const path = require('path');

const base = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';
const files = [
  'src/hooks/use-safety.test.ts',
  'src/hooks/use-lms.test.ts',
  'src/hooks/use-hr-assessment.test.ts',
  'src/hooks/use-hr-adaptation.test.ts',
  'src/hooks/use-hr-recruitment.test.ts',
  'src/hooks/use-hr-skills.test.ts',
  'src/hooks/use-hr-shifts.test.ts',
  'src/hooks/use-hr-discipline.test.ts',
  'src/hooks/useAgentAlerts.test.ts',
  'src/hooks/use-hr-kpi.test.ts',
  'src/hooks/use-hr-payroll.test.ts',
  'src/hooks/use-hr-leave.test.ts',
  'src/hooks/use-hr-attendance.test.ts',
  'src/hooks/use-hr-employees.test.ts',
  'src/hooks/use-sd.test.ts',
  'src/hooks/use-qc.test.ts',
  'src/hooks/use-mm.test.ts',
  'src/hooks/use-mes.test.ts',
  'src/hooks/use-kanban.test.ts',
  'src/hooks/use-iot.test.ts',
  'src/hooks/use-hr-departments.test.ts',
  'src/hooks/use-finance.test.ts',
  'src/hooks/use-crm.test.ts',
];

let totalChanges = 0;
for (const rel of files) {
  const fp = path.join(base, rel);
  let src = fs.readFileSync(fp, 'utf8');
  let changesInFile = 0;

  // Pre-pass: ensure makeWrapper's QueryClient sets `gcTime: 0` so leftover
  // queries from a pending-Promise test are immediately collected and the
  // forever-pending promise is cancelled before the next test runs.
  if (!/gcTime:\s*0/.test(src)) {
    const beforeGc = src;
    src = src.replace(
      /queries:\s*\{(\s*retry:\s*false,?)/,
      'queries: { gcTime: 0, $1',
    );
    if (src !== beforeGc) changesInFile++;
  }

  // Find each "loading state" it/test block (sync OR async).
  const itRegex = /(it|test)\(\s*'([^']*loading state[^']*)'\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g;
  const matches = [];
  let m;
  while ((m = itRegex.exec(src)) !== null) {
    matches.push({ idx: m.index, headerEnd: m.index + m[0].length, header: m[0] });
  }

  // Walk back-to-front so indices stay valid as we replace.
  for (let i = matches.length - 1; i >= 0; i--) {
    const blk = matches[i];
    // Find matching closing `}` for this it block by counting braces.
    let depth = 1;
    let j = blk.headerEnd;
    while (j < src.length && depth > 0) {
      const ch = src[j];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) break;
      j++;
    }
    if (depth !== 0) continue;
    const bodyEnd = j;
    let body = src.slice(blk.headerEnd, bodyEnd);

    const before = body;
    // Pattern 1: original never-resolving Promise pattern.
    body = body.replace(
      /mockImplementation(Once)?\(\s*\(\s*\)\s*=>\s*new Promise\(\s*\(\s*\)\s*=>\s*undefined\s*\)\s*\)/g,
      "mockImplementation$1(() => new Promise(r => { setTimeout(() => r({}), 100); }))",
    );
    // Pattern 2: the codemod's first-pass output (__resolveFetch capture).
    body = body.replace(
      /let __resolveFetch:.*?\n\s*/,
      '',
    );
    body = body.replace(
      /mockImplementation(Once)?\(\s*\(\s*\)\s*=>\s*new Promise\(__r =>\s*\{\s*__resolveFetch\s*=\s*__r;?\s*\}\)\)/g,
      "mockImplementation$1(() => new Promise(r => { setTimeout(() => r({}), 100); }))",
    );
    // Drop the __resolveFetch resolve + extra await Promise.resolve() lines.
    body = body.replace(/\n\s*__resolveFetch\?\.\(\{\}\);[ \t]*\n/g, '\n');
    body = body.replace(/\n\s*await Promise\.resolve\(\);[ \t]*\n/g, '\n');

    if (body === before) continue;

    body = body.replace(
      /const\s*\{\s*result\s*\}\s*=\s*renderHook\(/,
      'const { result, unmount } = renderHook(',
    );

    // Add unmount() before the closing brace if not present.
    if (!/unmount\(\)/.test(body)) {
      body = body.replace(/\s*$/, '\n    unmount();\n  ');
    }

    // If header is already async, keep it; otherwise force async.
    let newHeader = blk.header;
    if (!/async\s*\(/.test(newHeader)) {
      newHeader = blk.header.replace(/\(\s*\)\s*=>\s*\{$/, 'async () => {');
    }

    src = src.slice(0, blk.idx) + newHeader + body + src.slice(bodyEnd);
    changesInFile++;
  }

  if (changesInFile > 0) {
    fs.writeFileSync(fp, src);
    console.log(`fixed ${changesInFile} in ${rel}`);
    totalChanges += changesInFile;
  } else {
    console.log(`(unchanged) ${rel}`);
  }
}

console.log(`\ntotal: ${totalChanges}`);
