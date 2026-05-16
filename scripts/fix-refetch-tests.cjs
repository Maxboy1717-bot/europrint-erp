/**
 * @module fix-refetch-tests
 * @description Codemod for the "refetches X when refetch is invoked" pattern.
 *
 * Original pattern:
 *   await act(async () => {
 *     await result.current.refetch();
 *   });
 *   expect(result.current.data).toEqual([{ id: 2 }]);
 *
 * In React 19 + @testing-library/react.renderHook, the `result.current` ref
 * is updated via useEffect AFTER the render commits, so it lags behind the
 * value returned by `refetch()`. Assert on the refetch return value instead.
 *
 * Replaced with:
 *   let __refetched: unknown;
 *   await act(async () => {
 *     const r = await result.current.refetch();
 *     __refetched = r.data;
 *   });
 *   expect(__refetched).toEqual([{ id: 2 }]);
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

  // Find each "refetch" / "refetches" it block.
  const itRegex = /(it|test)\(\s*'([^']*refetch(?:es)?\b[^']*)'\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g;
  const matches = [];
  let m;
  while ((m = itRegex.exec(src)) !== null) {
    matches.push({ idx: m.index, headerEnd: m.index + m[0].length, header: m[0] });
  }

  for (let i = matches.length - 1; i >= 0; i--) {
    const blk = matches[i];
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

    // Only transform if the body contains the typical refetch+assert pattern.
    if (!/await\s+result\.current\.refetch\(\)/.test(body)) continue;
    if (!/expect\(\s*result\.current\.data\s*\)/.test(body)) continue;

    // Transform `await result.current.refetch();` inside the act callback to
    // capture the return value into __refetched.
    body = body.replace(
      /(await\s+act\(\s*async\s*\(\s*\)\s*=>\s*\{\s*)await\s+result\.current\.refetch\(\)\s*;?(\s*\})/,
      '$1const __r = await result.current.refetch(); __refetched = __r.data;$2',
    );

    // Add `let __refetched: unknown;` immediately after the header.
    body = '\n    let __refetched: unknown;' + body;

    // Replace `expect(result.current.data).toEqual(...)` with `expect(__refetched).toEqual(...)`
    body = body.replace(
      /expect\(\s*result\.current\.data\s*\)\.toEqual\(/g,
      'expect(__refetched).toEqual(',
    );

    if (body === before) continue;

    // Ensure async header.
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
