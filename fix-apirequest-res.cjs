/**
 * Fix the systematic `const res = await apiRequest(...); res.json() / res.ok` bug.
 *
 * Background: `apiRequest` already returns parsed JSON, not a Response, AND
 * already throws on non-OK status. Calls like `res.json()` and `if (!res.ok)`
 * are dead/broken code that also cause TS18046 (res is unknown).
 *
 * This script does NARROW, RECOGNIZABLE pattern replacements only. If a snippet
 * does not match exactly, it's left alone.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';

// Find all .ts/.tsx files containing `const res = await apiRequest`
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

const files = walk(path.join(ROOT, 'src')).filter(f => {
  const c = fs.readFileSync(f, 'utf8');
  return /const\s+res\s*=\s*await\s+apiRequest/.test(c);
});

console.log('Files to scan:', files.length);

let totalReplacements = 0;
let filesEdited = 0;

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const original = src;
  let count = 0;

  // PATTERN A — simple: `const res = await apiRequest(METHOD, URL [, body]);\n RET return res.json();`
  // Replace with: `return await apiRequest(METHOD, URL [, body]);`
  // We allow optional `await` before `res.json()`.
  src = src.replace(
    /^(?<indent>[ \t]*)const\s+res\s*=\s*await\s+apiRequest\((?<args>[^;]+)\);\r?\n[ \t]*return\s+(?:await\s+)?res\.json\(\);/gm,
    (m, ...rest) => {
      const groups = rest.at(-1);
      count++;
      return `${groups.indent}return await apiRequest(${groups.args});`;
    }
  );

  // PATTERN B — single-line check that throws, then return res.json():
  // `const res = await apiRequest(...);\n if (!res.ok) throw new Error(...);\n return res.json();`
  src = src.replace(
    /^(?<indent>[ \t]*)const\s+res\s*=\s*await\s+apiRequest\((?<args>[^;]+)\);\r?\n[ \t]*if\s*\(\s*!\s*res\.ok\s*\)\s*throw new Error\([^;]*\);\r?\n[ \t]*return\s+(?:await\s+)?res\.json\(\);/gm,
    (m, ...rest) => {
      const groups = rest.at(-1);
      count++;
      return `${groups.indent}return await apiRequest(${groups.args});`;
    }
  );

  // PATTERN C — block-form check that throws, then return res.json():
  // `const res = await apiRequest(...);\n if (!res.ok) { ... throw ... } \n return res.json();`
  src = src.replace(
    /^(?<indent>[ \t]*)const\s+res\s*=\s*await\s+apiRequest\((?<args>[^;]+)\);\r?\n[ \t]*if\s*\(\s*!\s*res\.ok\s*\)\s*\{[^{}]*?throw[^{}]*?\}\r?\n[ \t]*return\s+(?:await\s+)?res\.json\(\);/gm,
    (m, ...rest) => {
      const groups = rest.at(-1);
      count++;
      return `${groups.indent}return await apiRequest(${groups.args});`;
    }
  );

  // PATTERN D — block-form check that throws, then NO return (void mutation):
  // `const res = await apiRequest(...);\n if (!res.ok) { ... throw ... }`
  // Replace with: `await apiRequest(...);`
  src = src.replace(
    /^(?<indent>[ \t]*)const\s+res\s*=\s*await\s+apiRequest\((?<args>[^;]+)\);\r?\n[ \t]*if\s*\(\s*!\s*res\.ok\s*\)\s*\{[^{}]*?throw[^{}]*?\}(?!\s*\r?\n[ \t]*(?:return|const|let|var)\s)/gm,
    (m, ...rest) => {
      const groups = rest.at(-1);
      count++;
      return `${groups.indent}await apiRequest(${groups.args});`;
    }
  );

  // PATTERN E — `const data = await res.json();` after a successful apiRequest where res is unused.
  // `const res = await apiRequest(...);\n const data = await res.json();`
  // → `const data = await apiRequest(...);`
  src = src.replace(
    /^(?<indent>[ \t]*)const\s+res\s*=\s*await\s+apiRequest\((?<args>[^;]+)\);\r?\n[ \t]*const\s+(?<varName>\w+)\s*=\s*await\s+res\.json\(\);/gm,
    (m, ...rest) => {
      const groups = rest.at(-1);
      count++;
      return `${groups.indent}const ${groups.varName} = (await apiRequest(${groups.args})) as { [key: string]: unknown };`;
    }
  );

  if (src !== original) {
    fs.writeFileSync(f, src, 'utf8');
    filesEdited++;
    totalReplacements += count;
    console.log(`EDITED ${path.relative(ROOT, f)}: ${count} replacements`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total replacements:', totalReplacements);
