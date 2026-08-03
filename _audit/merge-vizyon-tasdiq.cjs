/* Ikki vizyon-tasdiq natijani birlashtirib bitta combined JSON yozadi (10/13/14/17 ni 2-fayldan oladi). READ-ONLY. */
const fs = require('fs');
const A = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // 16 yaxshi + 4 yupqa
const B = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); // 4 to'liq qayta
const OUT = process.argv[4];
const ra = (A.result || A), rb = (B.result || B);
const override = {};
for (const m of (rb.modules || [])) override[m.module] = m;
const merged = (ra.modules || []).map(m => override[m.module] && (m.items || []).length < (override[m.module].items || []).length ? override[m.module] : m);
// recompute tally
const flat = merged.flatMap(m => (m.items || []));
const tally = {
  bor: flat.filter(i => i.verdict === '✅ bor').length,
  yoq: flat.filter(i => i.verdict === "❌ yo'q").length,
  qisman: flat.filter(i => i.verdict === '🟡 qisman').length,
  egasiData: flat.filter(i => i.verdict === '🔑 egasi-data').length,
};
const visionPctAvg = Math.round(merged.reduce((s, m) => s + (m.visionPct || 0), 0) / (merged.length || 1));
const combined = { result: { totalQuestions: flat.length, tally, visionPctAvg, modules: merged } };
fs.writeFileSync(OUT, JSON.stringify(combined));
console.log('Birlashtirildi: ' + merged.length + ' modul, ' + flat.length + ' savol -> ' + OUT);
console.log('Tally: bor=' + tally.bor + ' qisman=' + tally.qisman + ' yoq=' + tally.yoq + ' egasi-data=' + tally.egasiData + ' | vizyon avg=' + visionPctAvg + '%');
