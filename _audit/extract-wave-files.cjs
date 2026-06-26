/* Workflow natijasidan agent-fayllarini ajratib chiqarish (commit uchun). */
const fs = require('fs');
const SRC = process.argv[2];
const ROOT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/';
const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const R = j.result.results || [];
const set = new Set();
for (const r of R) {
  for (const f of (r.filesChanged || [])) {
    if (!f || f === 'none') continue;
    let p = f.split('\\').join('/').replace(ROOT, '');
    set.add(p);
  }
}
console.log('=== STATUS ===');
for (const r of R) console.log(r.agentId + ' [' + r.status + '] ' + (r.filesChanged || []).map(x => x.split(/[\\/]/).pop()).join(', '));
console.log('');
console.log('=== AGENT FAYLLAR (relative) ===');
[...set].sort().forEach(f => console.log(f));
