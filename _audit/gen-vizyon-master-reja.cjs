/* 99-agent vizyon-tahlilidan TO'LIQ MASTER REJA yaratish. */
const fs = require('fs');
const SRC = 'C:/Users/AzzA/AppData/Local/Temp/claude/C--Users-AzzA-Downloads-EuroPrint-Clean/f97c851f-6442-4e4c-b253-ea73b7c80ef0/tasks/wc5n4tt5j.output';
const OUT = 'docs/audit/VIZYON-MASTER-REJA-2026-06-25.md';

const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const R = j.result;
const findings = Array.isArray(R.findings) ? R.findings : [];

const AREA_NAME = {
  'org-karta': 'Org-struktura / KARTA-markazlilik', 'hr-xodim': "HR / Xodim / karta-xodim bog'lanish",
  'razryad': "Razryad / malaka / o'sish", 'lms': 'LMS / Darslik (kartaga)', 'ckp': 'CKP / maqsad / KPI',
  'auth-rbac': 'Auth / RBAC / login (karta-gate)', 'sd': 'SD / sotuv-buyurtma', 'pp': 'PP / ishlab-chiqarish reja',
  'mes': 'MES / sex / ish-sessiya', 'qc': 'QC / sifat', 'wms-pos': 'WMS / Ombor + POS Monitor',
  'moliya': 'Moliya / GL / kassa', 'crm': 'CRM', 'ai': 'AI (per-karta + planning)', 'iot': 'IoT / telemetriya',
  'master-data': 'Master-data (mijoz/material/birlik)', 'golden-thread': 'Golden-thread / event / oqim',
  'frontend': 'Frontend / dizayn-tizim / UX', 'xavfsizlik': 'Xavfsizlik / multi-tenancy', 'hisobot': 'Hisobot / dashboard / analitika',
};
const AREA_ORDER = Object.keys(AREA_NAME);
const LENS_NAME = { model: "Asosiy g'oya / Model", toliqlik: "To'liqlik", oqim: 'Oqim / Integratsiya', ux: 'UI / UX', togrilik: "To'g'rilik (ishlaydi != to'g'ri)" };
const LENS_ORDER = ['model', 'toliqlik', 'oqim', 'ux', 'togrilik'];

// Agentlar area/lens'ni erkin yozgan -> kalit-so'z bilan kanonik sohaga klassifikatsiya (hech narsa yo'qolmasin).
function classifyArea(raw) {
  const s = String(raw || '').toLowerCase();
  if (/razryad|malaka|qualif/.test(s)) return 'razryad';
  if (/lms|darslik|course|o'quv|oquv/.test(s)) return 'lms';
  if (/ckp|цкп|gsd/.test(s)) return 'ckp';
  if (/crm|voronka|funnel|lead/.test(s)) return 'crm';
  if (/iot|telemetr|sensor|predictive/.test(s)) return 'iot';
  if (/\bqc\b|sifat|quality/.test(s)) return 'qc';
  if (/\bmes\b|operator.*tablet|ish-sessiya|\bsession\b/.test(s)) return 'mes';
  if (/\bpp\b|rejalash|production planning|ishlab-chiqarish reja|\bmrp\b|\bmps\b/.test(s)) return 'pp';
  if (/wms|ombor|\bpos\b|warehouse/.test(s)) return 'wms-pos';
  if (/moliya|finance|\bgl\b|kassa|kassir|ledger/.test(s)) return 'moliya';
  if (/auth|rbac|login/.test(s)) return 'auth-rbac';
  if (/master-data|master data|kanonik/.test(s)) return 'master-data';
  if (/golden|oltin.?ip|yagona zanjir/.test(s)) return 'golden-thread';
  if (/frontend|dizayn|design/.test(s)) return 'frontend';
  if (/xavfsizlik|security|tenant|tenancy/.test(s)) return 'xavfsizlik';
  if (/hisobot|director|report|dashboard|analitika|rpt_/.test(s)) return 'hisobot';
  if (/aisha|\bai\b|sun'iy/.test(s)) return 'ai';
  if (/\bhr\b|xodim|employee|salary/.test(s)) return 'hr-xodim';
  if (/\bsd\b|sotuv|sales/.test(s)) return 'sd';
  if (/org|karta-markaz|struktura|sxema/.test(s)) return 'org-karta';
  return 'boshqa';
}
function classifyLens(raw) {
  const s = String(raw || '').toLowerCase().slice(0, 45);
  if (/asosiy|model|arxitektura/.test(s)) return 'model';
  if (/liqlik|completeness|complete|qamrab/.test(s)) return 'toliqlik';
  if (/oqim|flow|integrat/.test(s)) return 'oqim';
  if (/ui\/ux|ui ?\/|\bux\b|\bui\b|foydalanuvchi|interfeys/.test(s)) return 'ux';
  if (/rilik|correct|mazmunan|ishlaydi/.test(s)) return 'togrilik';
  return 'model';
}
for (const f of findings) { f._area = classifyArea(f.area); f._lens = classifyLens(f.lens); }
AREA_NAME['boshqa'] = 'Boshqa (klassifikatsiyalanmagan)';

const byArea = {};
for (const f of findings) { (byArea[f._area] = byArea[f._area] || []).push(f); }
const areaAvg = (a) => { const x = byArea[a] || []; return x.length ? Math.round(x.reduce((s, f) => s + (Number(f.matchPct) || 0), 0) / x.length) : 0; };
const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');

let m = '';
m += '# EUROPRINT ERP - VIZYON MASTER REJA (99-AGENT TAHLIL ASOSIDA)\n\n';
m += '> Sana: 2026-06-25 - Manba: 100-agent jonli tahlil (5 tadan, ' + findings.length + ' natija) - Olchov = EGASI VIZYONI (Q-40), "ishlaydi" emas.\n';
m += '> Har davo jonli tasdiqlangan (kod fayl:satr + DB `_audit/q.cjs`). Umumiy vizyon-moslik: **' + R.avgPct + '%**.\n\n';
m += "**Bu hujjat 3 qism:** (0) Sintez-xulosa - (1) TO'LIQ 99-agent tahlil (20 soha x 5 nuqtai-nazar) - (2) Master reja fazalar.\n\n";
m += '---\n\n# 0-QISM: SINTEZ XULOSA\n\n';
m += (R.report || '(sintez yoq)') + '\n\n';

m += "---\n\n# 1-QISM: TO'LIQ 99-AGENT TAHLIL\n\n";
m += '_Har soha 5 nuqtai-nazardan: vizyon nimani kutadi / nima qurilgan / chetlashishlar / jonli isbot._\n\n';

const sortedAreas = Object.keys(byArea).sort((a, b) => areaAvg(a) - areaAvg(b));
let idx = 0;
for (const a of sortedAreas) {
  idx++;
  const x = (byArea[a] || []).slice().sort((p, q) => LENS_ORDER.indexOf(p._lens) - LENS_ORDER.indexOf(q._lens));
  m += '## ' + idx + '. ' + (AREA_NAME[a] || a) + " - o'rtacha " + areaAvg(a) + '% (' + x.length + ' tahlil)\n\n';
  for (const f of x) {
    const lens = LENS_NAME[f._lens] || f.lens;
    m += '### ' + lens + ' - `' + (f.matchVerdict || '?') + '` ' + (f.matchPct != null ? f.matchPct + '%' : '') + '\n';
    if (f.visionExpectation) m += '- **Vizyon kutadi:** ' + f.visionExpectation + '\n';
    if (f.builtReality) m += '- **Qurilgan:** ' + f.builtReality + '\n';
    const divs = Array.isArray(f.divergences) ? f.divergences : [];
    if (divs.length) {
      m += '- **Chetlashishlar:**\n';
      for (const d of divs) m += '  - **[' + (d.severity || '?') + ']** ' + (d.gap || '') + (d.visionWants ? ' - _vizyon:_ ' + d.visionWants : '') + (d.builtHas ? ' _/ build:_ ' + d.builtHas : '') + '\n';
    }
    const ev = Array.isArray(f.evidence) ? f.evidence : [];
    if (ev.length) m += '- **Isbot:** ' + ev.slice(0, 4).map((e) => '`' + String(e).replace(/`/g, '') + '`').join(' - ') + '\n';
    m += '\n';
  }
  m += '\n';
}

const allDiv = [];
for (const f of findings) for (const d of (f.divergences || [])) allDiv.push(Object.assign({ area: f._area, lens: f._lens }, d));
const p0 = allDiv.filter((d) => d.severity === 'P0');
const p1 = allDiv.filter((d) => d.severity === 'P1');
const p2 = allDiv.filter((d) => d.severity === 'P2');

m += '---\n\n# 2-QISM: MASTER REJA - FAZALAR\n\n';
m += '> Jami chetlashish: **P0=' + p0.length + ' / P1=' + p1.length + ' / P2=' + p2.length + '**. Strategiya: har modulni alohida "toldirish" emas - AVVAL bitta vertikal ip (1 karta -> login -> oylik -> CKP -> 1 buyurtma SD->PP->MES->QC->WMS->FIN->GL) uchma-uch JONLI ishlatish, keyin shablonni kengaytirish.\n\n';

m += '## FAZA 0 - EGASI-DATA (muhandislik kuta olmaydi)\n';
m += 'Bularsiz hech bir karta-yadro ishlamaydi (fabrikatsiya TAQIQ - Q-40):\n';
m += '1. **Bitta daraxt:** 19 root -> 1 Egasi-ildiz + 7 otdeleniye (kim-kimni-boshqaradi). `head_user_id` 126 NULL toldirilsin.\n';
m += '2. **Razryad qiymatlari:** har razryad - salary band (dan-gacha), `exam_pass_threshold`, `min_months` (>=3).\n';
m += '3. **CKP:** norma + deadline (16 soat / 3 soat ZIDDIYATINI hal qil), kurs<->karta biriktirish.\n';
m += '4. **RBAC tier** (har karta) + **AI-kalit** (OpenAI/Gemini).\n\n';

const phaseBlock = (title, sub, divs) => {
  let s = '## ' + title + '\n' + sub + '\n\n';
  if (divs.length) {
    s += '| Soha | Chetlashish | Vizyon kutadi | Build hozir |\n|---|---|---|---|\n';
    for (const d of divs) s += '| ' + (AREA_NAME[d.area] || d.area) + ' | ' + esc(d.gap) + ' | ' + esc(d.visionWants).slice(0, 160) + ' | ' + esc(d.builtHas).slice(0, 160) + ' |\n';
  } else s += '_(bu fazada P0/P1 chetlashish topilmadi)_\n';
  return s + '\n';
};

const coreAreas = ['org-karta', 'hr-xodim', 'auth-rbac', 'razryad'];
m += phaseBlock('FAZA 1 - KARTA-MARKAZLI YADRO (vizyonning "miyasi")',
  '`users.card_id` ustuni; payroll -> karta-salary + razryad-koeff; RBAC position_id->card; 1-karta=1-seat unique guard; login-gate yoqishga tayyorlash. Eng birinchi - qolgani shunga osiladi.',
  p0.filter((d) => coreAreas.includes(d.area)));

const gtAreas = ['golden-thread', 'sd', 'pp', 'mes', 'qc', 'wms-pos', 'crm'];
m += phaseBlock('FAZA 2 - GOLDEN-THREAD OQIMI (oltin ip)',
  'Outbox pattern (`domain_events`ga atomik yozish) + relay; CRM deal->SO avto; 12 orphan SD->PP ulash; PP->MES->QC->WMS->FIN listenerlar jonli; har bosqich real DB-proof.',
  p0.concat(p1).filter((d) => gtAreas.includes(d.area)));

const gateAreas = ['ckp', 'lms', 'ai', 'iot'];
m += phaseBlock('FAZA 3 - CKP + GATE-LAR + AI + LMS',
  'MES/IoT->CKP feed listener; AI kunlik chatbot (mashinasiz xodim hisoboti); oylik-gate (CKP+darslik); kurs avto-enroll; AI per-karta fit. Data kelgach yoqiladi.',
  p0.concat(p1).filter((d) => gateAreas.includes(d.area)));

const restAreas = ['moliya', 'master-data', 'xavfsizlik', 'frontend', 'hisobot'];
m += phaseBlock('FAZA 4 - YETUKLASHTIRISH (moliya/master-data/xavfsizlik/dizayn/hisobot)',
  'Kassir UI togrilash + cashier_movements; master-data kanoniklik + unit seed; multi-tenancy tenant_id rollout; FE EP-token tozalash; Director 5-korsatkich holat-formula.',
  p1.concat(p2).filter((d) => restAreas.includes(d.area)).slice(0, 50));

m += '---\n\n## QABUL MEZONI (har faza)\n';
m += "- Har ozgarish: tsc GREEN (oz fayllarda) + rollback-tx JONLI DB-proof (kirit->oqdi->korindi) + commit.\n";
m += '- Faza tugadi deyiladi FAQAT: vizyon-talab jonli korsatilganda (Q-40 - "ishlaydi" != "togri").\n';
m += '- Egasi-DATA yoq joyda: STRUKTURA + gate quriladi, SOXTA qiymat YOZILMAYDI, egasi-DATA royxatiga qoshiladi.\n';

fs.writeFileSync(OUT, m, 'utf8');
console.log('YOZILDI: ' + OUT);
console.log('Hajm: ' + m.split('\n').length + ' qator, ' + Math.round(m.length / 1024) + ' KB');
console.log('Chetlashish: P0=' + p0.length + ' P1=' + p1.length + ' P2=' + p2.length + ' | sohalar=' + Object.keys(byArea).length);
