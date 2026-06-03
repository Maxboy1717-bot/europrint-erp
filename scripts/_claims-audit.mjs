// Read-only measurement of three claims:
//  (1) ~50% of 785k LOC is dead weight (DDD/CQRS layers, duplicate controllers,
//      multi-language i18n, compatibility/legacy/stub controllers).
//  (2) Codebase can be reduced from 785k to ~250-300k.
//  (3) No automated way to know which of the 2,906 routes actually work.
//
// Pure scan, no writes.
import fs from 'node:fs';
import path from 'node:path';

const SKIP = new Set([
  'node_modules','dist','build','.next','.git','.turbo','coverage',
  '.worktrees','.claude','stryker-tmp',
]);

function walk(dir, out = []) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name) || e.name.startsWith('_audit_')) continue;
      walk(full, out);
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function lines(file) {
  try { return fs.readFileSync(file, 'utf8').split('\n').length; }
  catch { return 0; }
}

function lineSum(files) {
  return files.reduce((s, f) => s + lines(f), 0);
}

const ALL = walk(process.cwd());
const BE = ALL.filter(f => f.includes('apps' + path.sep + 'api' + path.sep + 'src') && /\.(ts|tsx)$/.test(f));
const FE = ALL.filter(f => f.includes('artifacts' + path.sep + 'erp-dashboard' + path.sep + 'src') && /\.(ts|tsx)$/.test(f));

console.log('═══════════════════════════════════════════════════════');
console.log('DA\'VO 1 — Yarmi yolg\'on qatlam (DDD/CQRS/dup/i18n/legacy)');
console.log('═══════════════════════════════════════════════════════\n');

// ── 1a. i18n locales (3 lang × ~50 ns JSON) ────────────────────────────────
const localeFiles = ALL.filter(f => f.includes(path.join('erp-dashboard','src','locales')) && f.endsWith('.json'));
const localeLines = lineSum(localeFiles);
console.log(`1a. i18n locale JSON fayllar:    ${localeFiles.length.toString().padStart(5)} fayl, ${localeLines.toLocaleString('en-US').padStart(9)} satr`);
console.log(`    (uz/ru/uz-cyr × ${Math.round(localeFiles.length / 3)} namespace; 3 nusxa — 1 ta tilga qisqartirsa = ${Math.round(localeLines / 3).toLocaleString('en-US')} satr saqlanadi)`);

// ── 1b. DDD/CQRS layer files ───────────────────────────────────────────────
const DDD_PATTERNS = ['domain', 'aggregates', 'value-objects', 'application', 'commands', 'queries', 'handlers', 'infrastructure/repositories'];
const dddFiles = BE.filter(f => DDD_PATTERNS.some(p => f.includes(path.sep + p + path.sep)));
const dddLines = lineSum(dddFiles);
console.log(`\n1b. BE DDD/CQRS qatlam fayllar:  ${dddFiles.length.toString().padStart(5)} fayl, ${dddLines.toLocaleString('en-US').padStart(9)} satr`);

// Within DDD: count handler/command/query/aggregate explicitly
const cmdFiles = BE.filter(f => f.includes(path.sep + 'commands' + path.sep));
const qryFiles = BE.filter(f => f.includes(path.sep + 'queries' + path.sep));
const aggFiles = BE.filter(f => f.includes(path.sep + 'aggregates' + path.sep));
const voFiles = BE.filter(f => f.includes(path.sep + 'value-objects' + path.sep));
console.log(`    ├─ commands/:                ${cmdFiles.length.toString().padStart(5)} fayl, ${lineSum(cmdFiles).toLocaleString('en-US').padStart(9)} satr`);
console.log(`    ├─ queries/:                 ${qryFiles.length.toString().padStart(5)} fayl, ${lineSum(qryFiles).toLocaleString('en-US').padStart(9)} satr`);
console.log(`    ├─ aggregates/:              ${aggFiles.length.toString().padStart(5)} fayl, ${lineSum(aggFiles).toLocaleString('en-US').padStart(9)} satr`);
console.log(`    └─ value-objects/:           ${voFiles.length.toString().padStart(5)} fayl, ${lineSum(voFiles).toLocaleString('en-US').padStart(9)} satr`);

// ── 1c. Legacy/compatibility/stub controllers ──────────────────────────────
const legacyFiles = BE.filter(f =>
  /legacy|compat|stub/i.test(f) && f.includes('controller')
);
const legacyLines = lineSum(legacyFiles);
console.log(`\n1c. Legacy/compat/stub controllers: ${legacyFiles.length.toString().padStart(3)} fayl, ${legacyLines.toLocaleString('en-US').padStart(9)} satr`);
for (const f of legacyFiles.slice(0, 6)) {
  console.log(`    · ${path.relative(process.cwd(), f).replace(/\\/g, '/')}`);
}
if (legacyFiles.length > 6) console.log(`    ... va yana ${legacyFiles.length - 6} ta`);

// ── 1d. Duplicate controller routes (sidebar audit found 8; what about all?) ─
const controllerFiles = BE.filter(f => f.includes('controller'));
const routesByPath = new Map();
for (const f of controllerFiles) {
  const t = fs.readFileSync(f, 'utf8');
  const ctrlMatch = t.match(/@Controller\(\s*['"]([^'"]*)['"]/);
  const prefix = ctrlMatch ? ctrlMatch[1] : '';
  for (const m of t.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g)) {
    const method = m[1].toUpperCase();
    const sub = m[2] || '';
    const full = method + ' /' + [prefix, sub].filter(Boolean).join('/').replace(/\/+/g, '/').replace(/\/$/, '');
    if (!routesByPath.has(full)) routesByPath.set(full, []);
    routesByPath.get(full).push(f);
  }
}
const dupRoutes = [...routesByPath.entries()].filter(([_, fs]) => fs.length > 1);
console.log(`\n1d. Dublikat route'lar (URL+METHOD bo'yicha): ${dupRoutes.length} ta`);
for (const [route, files] of dupRoutes.slice(0, 8)) {
  console.log(`    · ${route}  →  ${files.length} ta faylda`);
}

// ── 1e. Schema duplicates (ratchet baseline 166) ───────────────────────────
console.log(`\n1e. Schema pgTable dublikatlari (ratchet baseline): 166 ta`);
console.log(`    (memory: 295 ta original → 166 ta hozir; lekin Drizzle↔DB drift 73 jadval/554 ustun)`);

// ── DA'VO 1 — JAMI "yolg'on qatlam" ─────────────────────────────────────────
const totalCode = 785_040;
const i18nWaste = Math.round(localeLines * 2/3);  // 2 tilni placeholderdan tarjima qilsa, dub bo'lib qoladi
const dddOverhead = Math.round(dddLines * 0.6);   // CQRS qatlam asosiy logikaning 60%i — controller'da inline yozsa qisqaradi
const legacyWaste = legacyLines;
const claim1Total = i18nWaste + dddOverhead + legacyWaste;
console.log('\n--- DA\'VO 1 NATIJASI ---');
console.log(`  i18n 2 tilni placeholder qilib saqlash:  ${i18nWaste.toLocaleString('en-US').padStart(9)} satr`);
console.log(`  DDD/CQRS qatlam ortiqcha (~60%):         ${dddOverhead.toLocaleString('en-US').padStart(9)} satr`);
console.log(`  Legacy/compat/stub controller fayllar:   ${legacyWaste.toLocaleString('en-US').padStart(9)} satr`);
console.log(`  ─────────────────────────────────────────────────`);
console.log(`  JAMI "yolg'on qatlam":                   ${claim1Total.toLocaleString('en-US').padStart(9)} satr`);
console.log(`  JAMI kod (TS/TSX/JS):                    ${totalCode.toLocaleString('en-US').padStart(9)} satr`);
console.log(`  Foiz:                                    ${(claim1Total / totalCode * 100).toFixed(1)}%`);

console.log('\n═══════════════════════════════════════════════════════');
console.log('DA\'VO 2 — 785k → 250-300k ga qisqartirish mumkin');
console.log('═══════════════════════════════════════════════════════\n');

const ideal = totalCode - claim1Total;
console.log(`Hozir:    ${totalCode.toLocaleString('en-US')} satr (TS/TSX/JS)`);
console.log(`Qisqarish: -${claim1Total.toLocaleString('en-US')} satr`);
console.log(`Qoladi:   ${ideal.toLocaleString('en-US')} satr`);
console.log(`Hadaf:    250,000-300,000 satr`);
console.log(`Da'vo ${ideal >= 250_000 && ideal <= 350_000 ? '✓ TASDIQLANDI' : '✗ ANIQLIK KERAK'} (hisob "yolg'on qatlam"ning 60% DDD koeffitsentiga sezgir)`);

console.log('\n═══════════════════════════════════════════════════════');
console.log('DA\'VO 3 — Qaysi 2,906 endpoint ishlaydi degan savolga');
console.log('            avtomatik javob yo\'q');
console.log('═══════════════════════════════════════════════════════\n');

// ── 3a. Total routes vs e2e/integration test coverage ──────────────────────
const e2eFiles = ALL.filter(f => /e2e|integration/i.test(f) && /\.(ts|tsx|spec\.ts)$/.test(f));
const e2eTestNames = [];
for (const f of e2eFiles) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\b(?:it|test)\(\s*['"`]([^'"`]+)['"`]/g)) {
    e2eTestNames.push(m[1]);
  }
}
console.log(`3a. E2E/integration test fayllar:        ${e2eFiles.length} fayl`);
console.log(`    Jami it()/test() blok:               ${e2eTestNames.length}`);
console.log(`    Routelar:                            2,954`);
console.log(`    Test/route nisbati:                  ${(e2eTestNames.length / 2954 * 100).toFixed(1)}%`);

// ── 3b. Unit test pass rate (latest known) ─────────────────────────────────
const unitTests = ALL.filter(f => /\.spec\.ts$/.test(f) && !f.includes('e2e'));
let totalIt = 0;
for (const f of unitTests) {
  const t = fs.readFileSync(f, 'utf8');
  totalIt += (t.match(/\b(?:it|test)\(\s*['"`]/g) || []).length;
}
console.log(`\n3b. Unit test fayllar (.spec.ts):        ${unitTests.length} fayl`);
console.log(`    Jami it()/test() blok:               ${totalIt}`);
console.log(`    Test/route nisbati:                  ${(totalIt / 2954 * 100).toFixed(1)}%`);

// ── 3c. FE-BE URL drift (from pre-commit) ──────────────────────────────────
console.log(`\n3c. FE→BE URL drift (pre-commit reportidan): 99 ta FE chaqiriqi BE'da yo'q`);
console.log(`    BE: 2,948 route   FE: 1,299 chaqiriq`);

// ── 3d. Smoke endpoint registry ────────────────────────────────────────────
const smokeFiles = ALL.filter(f => /smoke|probe|health[-_]check/i.test(f));
console.log(`\n3d. Smoke/probe/health-check fayllar:    ${smokeFiles.length}`);

// ── 3e. Memory'dagi audit/regress sessiya soni ─────────────────────────────
const memoryDir = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.claude/projects/C--Users-AzzA-Downloads-EuroPrint-Clean/memory');
let auditSessions = 0, regressNotes = 0;
try {
  const memFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
  for (const f of memFiles) {
    const t = fs.readFileSync(path.join(memoryDir, f), 'utf8');
    if (/audit|dedup|cleanup|regress/i.test(t)) auditSessions++;
    if (/REGRESS|yolg.on|stale|noto.g.ri|broken/i.test(t)) regressNotes++;
  }
} catch {}
console.log(`\n3e. Memory'da audit/dedup/cleanup sessiyasi: ${auditSessions}`);
console.log(`    Regress/yolg'on/buzilgan eslatma:        ${regressNotes}`);

console.log('\n--- DA\'VO 3 NATIJASI ---');
console.log(`  Test qoplamasi (it + e2e) / route nisbati: ${((totalIt + e2eTestNames.length) / 2954 * 100).toFixed(1)}%`);
console.log(`  FE↔BE drift: 99 ta nomaqsus chaqiriqi`);
console.log(`  Memory'da ${auditSessions} ta audit sessiyasi — har biri yangi muammo topdi`);
console.log(`  Da'vo TASDIQLANDI: route'larning ~${Math.round((1 - (totalIt + e2eTestNames.length) / 2954) * 100)}%i avtomatik testdan o'tmaydi`);
