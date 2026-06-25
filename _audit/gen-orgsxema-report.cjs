const fs = require('fs');
const SRC = 'C:/Users/AzzA/AppData/Local/Temp/claude/C--Users-AzzA-Downloads-EuroPrint-Clean/f97c851f-6442-4e4c-b253-ea73b7c80ef0/tasks/wec78825u.output';
const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const r = j.result || j;
const s = r.synthesis;
const STMAP = { built: 'Qurilgan', partial: 'Qisman', missing: 'Yoq', owner_data: 'Egasi-data' };
const clean = (x) => String(x == null ? '' : x).replace(/\|/g, '/').replace(/\n/g, ' ');
let m = '# ORG-SCHEMA: Intervyu javoblari vs Hozirgi holat (2026-06-25)\n\n';
m += '> 20-agent jonli tahlil (kod+DB, Q-29). Egasi intervyu-javoblaridan **' + r.totalRequirements + '** org-schema talab topildi, 13 mavzu boyicha tekshirildi.\n\n';
m += '## Umumiy: **' + s.overallPercent + '%** mos\n\n';
m += '| Mavzu | Foiz | Qurilgan | Qisman | Yoq | Egasi-data | Holat |\n|---|---|---|---|---|---|---|\n';
for (const t of (s.byTheme || [])) m += '| ' + t.theme + ' | ' + t.percent + '% | ' + (t.built || 0) + ' | ' + (t.partial || 0) + ' | ' + (t.missing || 0) + ' | ' + (t.ownerData || 0) + ' | ' + clean(t.holat) + ' |\n';
m += '\n## Eng katta boshliqlar\n';
(s.topGaps || []).forEach((x, i) => { m += (i + 1) + '. ' + x + '\n'; });
m += '\n## Tasdiqlangan TAYYOR (jonli)\n';
(s.builtConfirmed || []).forEach((x) => { m += '- ' + x + '\n'; });
m += '\n## Faqat egasi beradigan DATA/kalit\n';
(s.ownerData || []).forEach((x) => { m += '- ' + x + '\n'; });
m += '\n## Keyingi buildable (data talab qilmaydi)\n';
(s.nextBuildable || []).forEach((x, i) => { m += (i + 1) + '. ' + x + '\n'; });
m += '\n## Toliq item-by-item (mavzu boyicha)\n\n';
let itemCount = 0;
for (const c of (r.comparisons || [])) {
  m += '### ' + c.theme + ' — ' + c.themePercent + '%\n\n| ID | Talab | Holat | Dalil |\n|---|---|---|---|\n';
  for (const it of (c.items || [])) {
    itemCount++;
    m += '| ' + clean(it.id).slice(0, 42) + ' | ' + clean(it.requirement).slice(0, 170) + ' | ' + (STMAP[it.status] || it.status) + ' | ' + clean(it.evidence).slice(0, 320) + ' |\n';
  }
  m += '\n';
}
fs.writeFileSync('docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md', m);
console.log('Yozildi: docs/audit/ORGSXEMA-INTERVYU-VS-HOLAT-2026-06-25.md');
console.log('Belgi:', m.length, '| Mavzu:', (s.byTheme || []).length, '| Item:', itemCount);
