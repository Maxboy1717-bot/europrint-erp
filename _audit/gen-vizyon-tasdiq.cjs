/* Vizyon-tasdiq workflow natijasidan (348 savol) modul-ma-modul markdown hujjat + jadval yaratish. READ-ONLY. */
const fs = require('fs');
const SRC = process.argv[2];
const OUT = process.argv[3] || 'docs/audit/VIZYON-TASDIQ-INTERVYU-2026-06-27.md';
const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const r = (j.result || j);
function isJunk(it){ if(!it||!it.question) return true; const q=String(it.question).trim(); const p=String(it.proof||'').trim();
  if(/^q\d+$/i.test(q)||/^p\d+$/i.test(p)||/^v\d+$/i.test(String(it.ownerVision||'').trim())) return true;
  if(q.length<8) return true; return false; }
const modules = (Array.isArray(r.modules) ? r.modules.slice() : [])
  .map(m => ({ ...m, items: (Array.isArray(m.items)?m.items:[]).filter(it => !isJunk(it)) }))
  .sort((a, b) => (a.module || '').localeCompare(b.module || ''));
const tally = r.tally || {};

let md = '';
md += '# EUROPRINT ERP — VIZYON-TASDIQ (Egasi intervyu+rejalari, har nuqta SAVOL + jonli javob)\n\n';
md += '> Egasi: "mani intervyularim va rejalarni hammasini qayta savol qilib bering — loyihada shundaymi yo\'qmi".\n';
md += '> Manba = egasining O\'Z javoblari (vision-1000-answers/01..20 + decisions + intervyular). Har javob JONLI tekshirilgan (kod + DB q.cjs, Q-29). Soxta yo\'q (Q-40).\n';
md += '> Sana: 2026-06-27. Jami savol: ' + (r.totalQuestions || '?') + '. O\'rtacha vizyon-moslik: **' + (r.visionPctAvg || '?') + '%**.\n\n';
md += '**Belgilar:** ✅ bor (to\'liq jonli) · 🟡 qisman (struktura bor, data/oqim yetishmaydi) · ❌ yo\'q (umuman yo\'q) · 🔑 egasi-data (kod tayyor, qiymat kutadi)\n\n';
md += '**Yig\'indi:** ✅ ' + (tally.bor || 0) + '  ·  🟡 ' + (tally.qisman || 0) + '  ·  ❌ ' + (tally.yoq || 0) + '  ·  🔑 ' + (tally.egasiData || 0) + '\n\n';
md += '---\n\n## MODUL-JADVAL (umumiy)\n\n';
md += '| # | Modul | Vizyon% | ✅ | 🟡 | ❌ | 🔑 | Savol |\n|---|---|---|---|---|---|---|---|\n';
for (const m of modules) {
  const items = Array.isArray(m.items) ? m.items : [];
  const bor = items.filter(i => i.verdict === '✅ bor').length;
  const qis = items.filter(i => i.verdict === '🟡 qisman').length;
  const yoq = items.filter(i => i.verdict === "❌ yo'q").length;
  const ed = items.filter(i => i.verdict === '🔑 egasi-data').length;
  md += `| ${m.module} | ${m.moduleName} | ${m.visionPct || '?'}% | ${bor} | ${qis} | ${yoq} | ${ed} | ${items.length} |\n`;
}
md += '\n---\n\n';

// Per-module detail
for (const m of modules) {
  const items = Array.isArray(m.items) ? m.items : [];
  md += `## ${m.module} — ${m.moduleName}  (vizyon ${m.visionPct || '?'}%, ${items.length} savol)\n\n`;
  if (m.summary) md += '> ' + String(m.summary).replace(/\n/g, ' ') + '\n\n';
  let n = 1;
  for (const it of items) {
    md += `**${m.module}.${n}  ${it.verdict}**  — ❓ ${it.question}\n`;
    if (it.ownerVision) md += `- Siz: ${it.ownerVision}\n`;
    if (it.proof) md += `- Isbot: ${it.proof}\n`;
    md += '\n';
    n++;
  }
  md += '---\n\n';
}

fs.writeFileSync(OUT, md);

// Print table to stdout for chat
console.log('JAMI savol: ' + (r.totalQuestions || items_count(modules)) + ' | vizyon o\'rtacha: ' + (r.visionPctAvg || '?') + '%');
console.log('Modul | Vizyon% | bor | qisman | yoq | egasi-data | savol');
for (const m of modules) {
  const items = Array.isArray(m.items) ? m.items : [];
  const bor = items.filter(i => i.verdict === '✅ bor').length;
  const qis = items.filter(i => i.verdict === '🟡 qisman').length;
  const yoq = items.filter(i => i.verdict === "❌ yo'q").length;
  const ed = items.filter(i => i.verdict === '🔑 egasi-data').length;
  console.log(`${m.module} ${m.moduleName} | ${m.visionPct || '?'}% | ${bor} | ${qis} | ${yoq} | ${ed} | ${items.length}`);
}
console.log('\nHujjat yozildi -> ' + OUT);
function items_count(ms){return ms.reduce((s,m)=>s+((m.items||[]).length),0);}
