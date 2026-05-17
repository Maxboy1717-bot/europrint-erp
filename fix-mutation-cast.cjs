/**
 * For mutationFn arrows that call `apiRequest(...)` (returns Promise<unknown>)
 * but TS infers the mutation expects a typed result, append `as Promise<unknown>`
 * cast. The mutation's `onSuccess: (data: Type)` then drives the inferred type.
 *
 * Strategy: find lines matching `mutationFn: ARGS => apiRequest(...)` and
 * replace `apiRequest(...)` with `apiRequest(...) as unknown as Promise<any>`.
 *
 * Conservative: only modify lines that match the exact mutationFn pattern.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.cache') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name) && !/\.(test|spec|smoke\.test)\./.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const all = walk(path.join(ROOT, 'src'));
let totalReplacements = 0;
let filesEdited = 0;

for (const f of all) {
  let src = fs.readFileSync(f, 'utf8');
  const original = src;
  let count = 0;

  // Match multi-line mutationFn that returns apiRequest(...) without explicit type
  // mutationFn: (...) =>\n      apiRequest(...)
  src = src.replace(
    /(mutationFn:[^\n]*\n[ \t]*)(apiRequest\([^;]+\))(\s*,)/g,
    (m, p1, p2, p3) => {
      if (/<\w+>/.test(p2.slice(0, p2.indexOf('(')))) return m; // already has type param
      if (/as\s+/.test(p2)) return m;
      count++;
      return `${p1}(${p2}) as Promise<any>${p3}`;
    }
  );
  // Single-line: `mutationFn: (...) => apiRequest(...),`
  src = src.replace(
    /(mutationFn:\s*\([^)]*\)\s*=>\s*)(apiRequest\([^;]+\))(\s*,)/g,
    (m, p1, p2, p3) => {
      if (/<\w+>/.test(p2.slice(0, p2.indexOf('(')))) return m;
      if (/as\s+/.test(p2)) return m;
      count++;
      return `${p1}(${p2}) as Promise<any>${p3}`;
    }
  );

  if (src !== original) {
    fs.writeFileSync(f, src, 'utf8');
    filesEdited++;
    totalReplacements += count;
    console.log(`EDITED ${path.relative(ROOT, f)}: ${count} casts`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total casts:', totalReplacements);
