/**
 * For files in error log with TS2352 (conversion may be a mistake), find each
 * line and convert `as Record<...>` to `as unknown as Record<...>`.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/artifacts/erp-dashboard/';
const LOG = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/ts-after22.txt';

const log = fs.readFileSync(LOG, 'utf8');
const errsByFile = {};
for (const l of log.split('\n')) {
  if (!/TS2352/.test(l)) continue;
  const m = l.match(/^([^\(]+?)\((\d+),(\d+)\):/);
  if (!m) continue;
  const f = m[1].trim();
  errsByFile[f] = errsByFile[f] || new Set();
  errsByFile[f].add(parseInt(m[2]));
}

let total = 0;
let filesEdited = 0;

for (const [rel, lineSet] of Object.entries(errsByFile)) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  let src = fs.readFileSync(full, 'utf8');
  const lines = src.split('\n');
  let count = 0;
  for (const lineNum of lineSet) {
    const idx = lineNum - 1;
    if (idx < 0 || idx >= lines.length) continue;
    let line = lines[idx];
    // Replace `as Record<` or `as {` etc. with `as unknown as`
    // But ONLY if not already `as unknown as`
    const newLine = line.replace(
      /(\)\s*)?\bas\s+(Record<[^>]+>|\{[^}]+\})/g,
      (m, paren, type) => {
        // Check if preceded by "as unknown"
        if (line.slice(Math.max(0, line.indexOf(m) - 10), line.indexOf(m)).includes('as unknown')) return m;
        return `${paren || ''}as unknown as ${type}`;
      }
    );
    if (newLine !== line) {
      lines[idx] = newLine;
      count++;
    }
  }
  if (count > 0) {
    fs.writeFileSync(full, lines.join('\n'), 'utf8');
    filesEdited++;
    total += count;
    console.log(`EDITED ${rel}: ${count} lines`);
  }
}

console.log('---');
console.log('Files edited:', filesEdited);
console.log('Total:', total);
