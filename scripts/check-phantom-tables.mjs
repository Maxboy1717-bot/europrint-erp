#!/usr/bin/env node
/**
 * check-phantom-tables.mjs
 *
 * Staged .ts fayllarga QO'SHILGAN qatorlarda `FROM|JOIN|INTO|UPDATE <jadval>` murojaatlarini
 * topadi va ularni `scripts/db-tables.snapshot.json` bilan solishtiradi. Snapshotda yo'q
 * jadvalga murojaat qilinsa — commit BLOKLANADI.
 *
 * NIMA UCHUN BU KERAK (audit 2026-08-07)
 *   Bir martalik tekshiruvda kod **21 ta jonli so'rov yo'lida** bazada umuman mavjud bo'lmagan
 *   jadvalga murojaat qilayotgani aniqlandi (`docs/audit/FANTOM-JADVALLAR-2026-08-07.md`).
 *   Hech biri xato bermasdi, chunki chaqiruv naqshlari xatoni yutadi:
 *     - `execSql(sql\`...\`, fallback)` -> fallback qaytadi
 *     - `.catch(() => ({ rows: [] }))` -> bo'sh ro'yxat
 *     - `Result` ichida `Err` -> chaqiruvchi "topilmadi" deb talqin qiladi
 *   Natijada Telegram boti past qoldiq bo'lsa ham "Barcha materiallar yetarli" derdi, xavfsizlik
 *   agenti hech qachon signal bermasdi, AIsha moliyaviy xulosani 0/0/0 deb aytardi. Bu Q-40 ning
 *   eng zararli shakli: yashil, lekin yolg'on.
 *
 * SNAPSHOTNI YANGILASH
 *   Yangi jadval qo'shilgach (migratsiya qo'llanilgandan KEYIN):
 *     node _audit/q.cjs "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
 *   natijasini `scripts/db-tables.snapshot.json` ga yozing. Snapshot ataylab qo'lda yangilanadi —
 *   shunda "jadval qo'shdim" qadami commit tarixida ko'rinadi.
 *
 * CHEKLOV
 *   Bu statik matn tekshiruvi: CTE nomlari, PL/pgSQL o'zgaruvchilari va PG katalog obyektlari
 *   quyidagi ro'yxatlar bilan chiqarib tashlanadi. Noto'g'ri ushlab qolsa — `ALLOWLIST` ga
 *   sabab bilan qo'shing, tekshiruvni o'chirmang.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SNAPSHOT = 'scripts/db-tables.snapshot.json';

/** SQL kalit so'zlari va katalog obyektlari — jadval nomi emas. */
const SQL_NOISE = new Set([
  'select', 'where', 'group', 'order', 'limit', 'offset', 'values', 'when', 'then', 'else', 'end',
  'null', 'true', 'false', 'left', 'right', 'inner', 'outer', 'cross', 'lateral', 'using',
  'distinct', 'only', 'set', 'returning', 'conflict', 'nothing', 'exists', 'lock', 'share',
  'unnest', 'generate_series', 'jsonb_array_elements', 'jsonb_array_elements_text',
  'jsonb_to_recordset', 'json_array_elements', 'regexp_split_to_table', 'string_to_table',
  'information_schema', 'dual',
]);

/**
 * Ataylab ruxsat etilgan istisnolar. Har biri SABAB bilan.
 * Format: [nom, sabab]
 */
const ALLOWLIST = new Map([
  // Migratsiya/DDL fayllari o'z jadvalini yaratishdan oldin murojaat qilishi normal.
  ['__ddl__', 'joy egallovchi — hozircha istisno yo\'q'],
]);

/** Fayl yo'li bo'yicha chiqarib tashlanadiganlar — DDL/migratsiya/seed kontekstlari. */
const SKIP_PATH = /(migrations?|invariants|\.sql\.ts$|\.spec\.ts$|\.test\.ts$|scripts\/)/i;

let snapshot;
try {
  snapshot = new Set(JSON.parse(readFileSync(SNAPSHOT, 'utf8')).tables);
} catch {
  // Snapshot yo'q/buzuq bo'lsa commitni bloklamaymiz — tekshiruv shunchaki o'tkazib yuboriladi.
  console.log('check-phantom-tables: snapshot topilmadi — o\'tkazib yuborildi.');
  process.exit(0);
}

let diff;
try {
  diff = execSync('git diff --cached --unified=0 -- "*.ts"', { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
} catch {
  process.exit(0);
}

// Bir diffdagi CTE nomlarini yig'amiz — ular jadval emas.
const ctes = new Set();
for (const m of diff.matchAll(/\b(?:WITH|,)\s+([a-z_][a-z0-9_]*)\s+AS\s*\(/gi)) ctes.add(m[1].toLowerCase());
// `AS alias` shaklidagi taxalluslar ham jadval emas.
for (const m of diff.matchAll(/\)\s+(?:AS\s+)?([a-z_][a-z0-9_]*)\s+ON\b/gi)) ctes.add(m[1].toLowerCase());

const REF = /\b(?:FROM|JOIN|INTO|UPDATE)\s+(?:ONLY\s+)?([a-z_][a-z0-9_]*)\b/gi;

let file = '';
const violations = [];

for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) { file = line.slice(6); continue; }
  if (!line.startsWith('+') || line.startsWith('+++')) continue;
  if (SKIP_PATH.test(file)) continue;

  // To'liq izoh qatorlari (SQL `--`, JS `//`, JSDoc `*`) va qator oxiridagi izohlar
  // tashlanadi — izohda jadval nomi eslatilishi normal (masalan "ilgari FROM pos_batches edi").
  const body = line.slice(1).replace(/\s(?:--|\/\/).*$/, '');
  if (/^\s*(--|\/\/|\*)/.test(body)) continue;

  for (const m of body.matchAll(REF)) {
    const name = m[1].toLowerCase();
    if (SQL_NOISE.has(name) || ctes.has(name) || ALLOWLIST.has(name)) continue;
    if (name.startsWith('pg_') || name.startsWith('v_')) continue;
    // Faqat jadvalga o'xshaydiganlar: pastki chiziq bor yoki snapshotda mavjud nomga yaqin.
    if (!name.includes('_') && !snapshot.has(name)) continue;
    if (snapshot.has(name)) continue;
    violations.push({ file, name, body: body.trim().slice(0, 120) });
  }
}

if (violations.length > 0) {
  console.error('\n❌ Fantom jadval: kod bazada mavjud bo\'lmagan jadvalga murojaat qilyapti\n');
  for (const v of violations) {
    console.error(`  📄 ${v.file}`);
    console.error(`     jadval: ${v.name}`);
    console.error(`     ${v.body}\n`);
  }
  console.error('  Nima qilish kerak:');
  console.error('   1) Kanonik jadval nomini toping (docs/DB_ERD.md, STANDARTLAR.md §kanonik jadvallar);');
  console.error('   2) Jadval haqiqatan yangi bo\'lsa — migratsiya qo\'llang, so\'ng snapshotni yangilang:');
  console.error(`      ${SNAPSHOT} (usuli skript sarlavhasida);`);
  console.error('   3) Noto\'g\'ri ushlangan bo\'lsa — skriptdagi ALLOWLIST ga SABAB bilan qo\'shing.\n');
  console.error('  Kontekst: docs/audit/FANTOM-JADVALLAR-2026-08-07.md\n');
  process.exit(1);
}

console.log('✅ check-phantom-tables: yangi fantom jadval murojaati yo\'q.');
