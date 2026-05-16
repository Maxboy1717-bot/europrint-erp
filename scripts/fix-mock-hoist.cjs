/**
 * @module fix-mock-hoist
 * @description Codemod: wrap top-level `const apiRequestMock = vi.fn(...)` and
 * `const toastSpy = vi.fn()` declarations in `vi.hoisted()` so they're
 * available inside the hoisted `vi.mock` factories.
 *
 * Before:
 *   const apiRequestMock = vi.fn(async () => ({ ok: true }));
 *   const toastSpy = vi.fn();
 *   vi.mock('@/lib/queryClient', () => ({ apiRequest: apiRequestMock, ... }));
 *
 * After:
 *   const { apiRequestMock, toastSpy } = vi.hoisted(() => ({
 *     apiRequestMock: vi.fn(async () => ({ ok: true })),
 *     toastSpy: vi.fn(),
 *   }));
 *   vi.mock('@/lib/queryClient', () => ({ apiRequest: apiRequestMock, ... }));
 */

const fs = require('fs');
const path = require('path');

const testDir = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/src/components/__tests__';
const entries = fs.readdirSync(testDir);
const files = entries.filter(f => f.endsWith('.test.tsx')).map(f => path.join(testDir, f));

let totalChanges = 0;
for (const fp of files) {
  let src = fs.readFileSync(fp, 'utf8');
  let changesInFile = 0;

  // Skip files that already use vi.hoisted.
  if (/vi\.hoisted\(/.test(src)) continue;

  // Find single-name top-level `const <name> = vi.fn(...)` declarations
  // followed eventually by a `vi.mock` that references that name.
  // Capture names whose value uses `vi.fn(...)`.
  const declRegex = /^const\s+(\w+)\s*=\s*(vi\.fn\([\s\S]*?\));?$/gm;
  const decls = [];
  let m;
  while ((m = declRegex.exec(src)) !== null) {
    decls.push({ name: m[1], value: m[2], start: m.index, end: m.index + m[0].length });
  }
  if (decls.length === 0) continue;

  // Only act on names that are referenced inside a vi.mock factory body.
  const usedInsideMock = new Set();
  const mockBodies = [...src.matchAll(/vi\.mock\([^)]*?,\s*(?:async\s*)?\([^)]*?\)\s*=>\s*[\s\S]*?\)\s*;/g)];
  for (const mb of mockBodies) {
    for (const d of decls) {
      const re = new RegExp('\\b' + d.name + '\\b');
      if (re.test(mb[0])) usedInsideMock.add(d.name);
    }
  }

  const toLift = decls.filter(d => usedInsideMock.has(d.name));
  if (toLift.length === 0) continue;

  // Build the hoisted block.
  const hoistedNames = toLift.map(d => d.name).join(', ');
  const hoistedEntries = toLift
    .map(d => `    ${d.name}: ${d.value.replace(/;$/, '')},`)
    .join('\n');
  const hoistedBlock =
    `const { ${hoistedNames} } = vi.hoisted(() => ({\n${hoistedEntries}\n}));`;

  // Remove the original declarations (walk back-to-front).
  toLift
    .sort((a, b) => b.start - a.start)
    .forEach(d => {
      // Include a trailing newline if present.
      let endIdx = d.end;
      if (src[endIdx] === '\n') endIdx++;
      src = src.slice(0, d.start) + src.slice(endIdx);
    });

  // Insert hoistedBlock after the imports (right before the first `vi.mock` or
  // existing top-level code).
  const insertAt = src.search(/^vi\.mock\(/m);
  if (insertAt > -1) {
    src = src.slice(0, insertAt) + hoistedBlock + '\n\n' + src.slice(insertAt);
  } else {
    // Fall back: append after the last import.
    const importMatches = [...src.matchAll(/^import [\s\S]*?;$/gm)];
    const lastImport = importMatches[importMatches.length - 1];
    if (lastImport) {
      const after = lastImport.index + lastImport[0].length;
      src = src.slice(0, after) + '\n\n' + hoistedBlock + src.slice(after);
    } else {
      src = hoistedBlock + '\n\n' + src;
    }
  }

  changesInFile++;

  if (changesInFile > 0) {
    fs.writeFileSync(fp, src);
    console.log(`fixed ${changesInFile} in ${path.basename(fp)} (lifted: ${toLift.map(d => d.name).join(', ')})`);
    totalChanges += changesInFile;
  }
}

console.log(`\ntotal: ${totalChanges}`);
