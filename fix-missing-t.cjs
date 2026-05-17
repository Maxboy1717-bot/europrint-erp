/**
 * Fix `Cannot find name 't'` errors by adding a `useTranslation` declaration
 * at the start of each function that uses `t` but doesn't declare it.
 *
 * Algorithm:
 *  - Parse the TS error log to collect, for each file, the set of line numbers
 *    where `t` is missing.
 *  - For each file, locate the function that contains each error line (the
 *    nearest preceding `function`/arrow-function header at column 0 or inside
 *    JSX brackets). Use a simple-brace counter.
 *  - At the function's opening `{`, insert `const { t } = useTranslation("common");`
 *    on a new line. Skip if the function ALREADY declares `t`.
 *  - Ensure the file imports `useTranslation`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';
const LOG = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/ts-after14.txt';

// 1. Group missing-t lines by file
const log = fs.readFileSync(LOG, 'utf8');
const errsByFile = {};
for (const l of log.split('\n')) {
  const m = l.match(/^([^\(]+?)\((\d+),\d+\): error TS2304: Cannot find name 't'\.?\s*$/);
  if (!m) continue;
  const f = m[1].trim();
  errsByFile[f] = errsByFile[f] || new Set();
  errsByFile[f].add(parseInt(m[2]));
}

let totalAdded = 0;
let filesEdited = 0;
const filesWithIssue = [];

for (const [rel, lineSet] of Object.entries(errsByFile)) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log('SKIP missing:', rel); continue; }
  const src = fs.readFileSync(full, 'utf8');
  const lines = src.split('\n');

  // Find all top-level function blocks: starts at `export function NAME(...) {`
  // or `function NAME(...) {`. We track the body span by brace counting.
  // We'll insert `const { t } = useTranslation("common");` right after the
  // function's opening `{`.
  // We use a simpler heuristic: find function/arrow that contains each
  // error line, then check if the immediate body already has `const { t }`.

  // Find ALL function starts: regex over the whole source.
  const funcRe = /^(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{|^(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\(([^)]*)\)[\s\S]*?\{/gm;

  // Simpler: scan lines, when we see `function FOO(...)... {` (possibly multi-line not handled), open a block
  // For this codebase, function signatures are single-line. Good enough.
  const funcStartRe = /^(export\s+)?(default\s+)?function\s+(\w+)\s*\(/;

  // Collect function spans
  const funcs = []; // { name, headerLine (1-based), bodyStartLine (1-based, line of '{'), bodyEndLine }
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (funcStartRe.test(ln)) {
      // Find the line that contains the BODY opening `{` (after the closing `)`).
      let j = i;
      let openIdx = -1;
      // Find ) on line i first
      let parenDepth = 0;
      let closedParen = false;
      let scanLine = i;
      let scanCol = 0;
      while (scanLine < lines.length) {
        const L = lines[scanLine];
        while (scanCol < L.length) {
          const ch = L[scanCol];
          if (ch === '(') parenDepth++;
          else if (ch === ')') {
            parenDepth--;
            if (parenDepth === 0) { closedParen = true; break; }
          }
          scanCol++;
        }
        if (closedParen) break;
        scanLine++; scanCol = 0;
      }
      if (!closedParen) { i++; continue; }
      // Now scan for next `{` after this position
      j = scanLine;
      scanCol = scanCol + 1; // past the ')'
      while (j < lines.length) {
        const L = lines[j];
        const idx = L.indexOf('{', scanCol);
        if (idx !== -1) { openIdx = idx; break; }
        j++; scanCol = 0;
      }
      if (openIdx === -1) { i++; continue; }
      // Body starts on line j, after openIdx (1-based j+1, but content after { is on same line)
      // Now find matching close brace using brace counter starting from j, openIdx+1
      let depth = 1;
      let k = j;
      let col = openIdx + 1;
      while (k < lines.length && depth > 0) {
        const L = lines[k];
        while (col < L.length) {
          const ch = L[col];
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) break;
          }
          col++;
        }
        if (depth === 0) break;
        k++; col = 0;
      }
      funcs.push({ name: ln.match(funcStartRe)[3], headerLine: i+1, bodyStartLine: j+1, bodyEndLine: k+1, indent: (ln.match(/^[ \t]*/) || [''])[0] });
      i = j + 1; // continue scanning inside; nested functions handled
    } else {
      i++;
    }
  }

  // Determine which functions need `t`:
  const fnsNeedingT = new Set();
  for (const errLine of lineSet) {
    // Find smallest function span containing this line
    let best = null;
    for (const fn of funcs) {
      if (errLine >= fn.bodyStartLine && errLine <= fn.bodyEndLine) {
        if (!best || (fn.bodyEndLine - fn.bodyStartLine) < (best.bodyEndLine - best.bodyStartLine)) {
          best = fn;
        }
      }
    }
    if (best) fnsNeedingT.add(best);
    else {
      // No enclosing function: skip (might be at module-level)
    }
  }

  if (fnsNeedingT.size === 0) { continue; }
  filesWithIssue.push(rel);

  // For each function, check if it already has a `t` declaration. Look only
  // inside this function's body span (NOT spilling into the next function).
  let edits = []; // { line (1-based), text }
  for (const fn of fnsNeedingT) {
    const startIdx = fn.bodyStartLine - 1;
    const endIdx = Math.min(fn.bodyEndLine, startIdx + 30);
    const slice = lines.slice(startIdx, endIdx).join('\n');
    if (/\bconst\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation/.test(slice)) continue;
    if (/\bconst\s+t\s*=/.test(slice)) continue;
    // Function param destructures `t`?
    const headerSlice = lines[fn.headerLine - 1] || '';
    if (/\{[^}]*\bt\b[^}]*\}\s*:/.test(headerSlice)) continue;
    if (/,\s*t\s*[,}]/.test(headerSlice) || /\(\s*t\s*[,)]/.test(headerSlice)) continue;
    // Insert after the line that has the `{`
    const decl = `${fn.indent}  const { t } = useTranslation("common");`;
    edits.push({ line: fn.bodyStartLine, text: decl });
  }

  if (edits.length === 0) continue;

  // Apply edits in reverse line order
  edits.sort((a, b) => b.line - a.line);
  for (const ed of edits) {
    lines.splice(ed.line, 0, ed.text);
  }

  let newSrc = lines.join('\n');

  // Ensure file imports useTranslation
  if (!/import\s*\{[^}]*useTranslation[^}]*\}\s*from\s*['"]@\/lib\/i18n['"]/.test(newSrc)) {
    // Add an import line after the first import statement
    const importMatch = newSrc.match(/^(import[^\n]*\n)/m);
    if (importMatch) {
      newSrc = newSrc.replace(importMatch[0], importMatch[0] + `import { useTranslation } from '@/lib/i18n';\n`);
    } else {
      newSrc = `import { useTranslation } from '@/lib/i18n';\n` + newSrc;
    }
  }

  fs.writeFileSync(full, newSrc, 'utf8');
  filesEdited++;
  totalAdded += edits.length;
  console.log(`EDITED ${rel}: added t-decl to ${edits.length} functions`);
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total t-decls added:', totalAdded);
console.log('Files visited:', Object.keys(errsByFile).length);
