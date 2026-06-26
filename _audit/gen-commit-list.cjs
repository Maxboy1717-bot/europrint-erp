/* Workflow natijasidan agent-fayllarini commit-list sifatida chiqarish (normalizatsiya + .env chiqarib). */
const fs = require('fs');
const SRC = process.argv[2];
const OUT = process.argv[3] || '_audit/_commit_files.txt';
const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const results = (j.result && j.result.results) || [];
const set = new Set();
const marker = 'EuroPrint-Clean/Uzbek-Language-Module/';
for (const r of results) {
  for (const f of (r.filesChanged || [])) {
    if (!f || f === 'none') continue;
    let p = f.replace(/\\/g, '/');
    const i = p.indexOf(marker);
    if (i >= 0) p = p.slice(i + marker.length);
    if (p.startsWith('Uzbek-Language-Module/')) p = p.slice('Uzbek-Language-Module/'.length);
    // agent ba'zan filename'ga izoh qo'shgan (qavs ichida) — tozalash
    p = p.replace(/\s*\(.*$/, '').trim();
    if (!p || p.includes('.env')) continue;
    set.add(p);
  }
}
fs.writeFileSync(OUT, [...set].join('\n') + '\n');
console.log('Fayllar: ' + set.size + ' -> ' + OUT);
