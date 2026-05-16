#!/usr/bin/env node
/**
 * i18n-leak-detector.mjs — universal language-leakage detector for EuroPrint.
 *
 * Two modes:
 *   1. STATIC  (default): scan source code (.tsx/.ts) for hardcoded user-facing
 *      strings that will leak into the rendered DOM. No browser required.
 *   2. DOM    (--mode=dom <html>): take a rendered HTML snapshot and find
 *      mixed-language sentences in the actual text nodes. Used by Playwright.
 *
 * Output: JSON list of { file?, line?, text, leakType, severity }.
 *
 * Vocabulary (Uzbek): apostrophe markers (o', g'), suffixes (-lar, -ning,
 * -da/-dan/-ga), Uzbek-only stems (saqlash, bekor, yo'q, bor, ta, bilan,
 * uchun, kerak, ...).
 *
 * Vocabulary (Russian): Cyrillic block U+0400-U+04FF.
 *
 * Whitelist: brand names + acronyms that legitimately appear in both locales.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ── Brand / acronym whitelist — these appear identically in UZ and RU ──────
const WHITELIST = new Set([
  // Brand names
  'EuroPrint', 'Telegram', 'WhatsApp', 'PostgreSQL', 'Redis', 'Drizzle',
  'NestJS', 'React', 'Anthropic', 'Claude', 'OpenAI', 'Gemini', 'ElevenLabs',
  'GitHub', 'Slack', 'Notion', 'Zoom', 'Cloudflare', 'Sentry', 'Vite',
  'Fastify', 'TanStack', 'TypeScript', 'JavaScript', 'Node.js', 'Python',
  // Acronyms
  'API', 'URL', 'JWT', 'OAuth', 'OTP', '2FA', 'SaaS', 'ERP', 'CRM',
  'HR', 'FI', 'PP', 'MES', 'QC', 'WMS', 'SD', 'MRO', 'POS', 'MM',
  'LMS', 'KPI', 'OEE', 'RBAC', 'SOS', 'SLA', 'SoD', 'GL', 'AP', 'AR',
  'BOM', 'MRP', 'CRP', 'RFM', 'CLV', 'NPS', 'ID', 'IP', 'OK', 'PDF',
  'CSV', 'XLSX', 'JSON', 'HTML', 'CSS', 'JS', 'TS', 'SQL', 'REST',
  'GraphQL', 'WebSocket', 'SSE', 'Wi-Fi', 'iOS', 'Android', 'RCA',
  'FMEA', 'EMA', 'TSB', 'AI', 'ML', 'CI', 'CD', 'PR', 'UI', 'UX',
  'B2B', 'B2C', 'CFO', 'CEO', 'CTO', 'COO', 'GMT', 'UTC',
  'CC', 'BCC', 'CC', 'GR', 'GI', 'TZ', 'INV',
]);

// ── Uzbek-only stems (extend as needed) ─────────────────────────────────────
// NOTE: regex char class `[ʻ'’]` matches any of the three apostrophe
// variants commonly used in Uzbek (ʻ, ', ’). Built as a string to keep this
// list readable; assembled into the regex below.
const APOS = `[ʻ'’\`]`;
const UZBEK_STEMS = [
  // Verbs / actions (apostrophes substituted into the regex)
  'saqlash', 'bekor', 'tahrirlash', `o${APOS}chirish`, `qo${APOS}shish`,
  'yangilash', 'yaratish', 'yuklash', 'yuklab', 'qidirish', 'filtrlash',
  'saralash', 'yopish', 'orqaga', 'keyingi', 'oldingi', 'yuborish',
  'tasdiqlash', `qo${APOS}llash`, 'qaytarish', 'tanlash', `ko${APOS}chirish`,
  'nusxalash', 'yopishtirish', 'yangilamoq', 'tugatish', 'boshlash',
  // Status / state
  'faol', 'nofaol', 'yangi', 'kutilmoqda', 'tasdiqlangan',
  'yakunlangan', 'bajarilmoqda', 'yopilgan', 'ochiq',
  'muvaffaqiyatli', 'ogohlantirish', `ma${APOS}lumot`,
  // Common nouns
  'nomi', 'tavsif', 'turi', 'holat', 'sana', 'miqdor', 'jami',
  'soni', 'birlik', 'manba', 'manzil', 'tafsilotlar',
  'harakatlar', 'sozlamalar', 'filtrlar', 'foydalanuvchi',
  'ruxsat', 'xavfsizlik',
  // Business
  'buyurtma', 'hujjat', 'mijoz', 'yetkazib', 'omborxona',
  'xodim', 'ishchi', 'daromad', 'xarajat', 'foyda', 'zarar',
  'ishlab chiqarish', 'smena', 'marshrut', 'rejalashtirish', 'avans',
  'yetkazish', 'hisobot', 'buxgalteriya', 'lavozim', `bo${APOS}lim`,
  `boshlig${APOS}i`, 'korxona', 'tashkilot',
  // Dashboard / UI
  'boshqaruv', 'paneli', 'dashbord', `ko${APOS}rib`,
  'statistika', `ko${APOS}rsatkichlar`, 'diagrammalar', 'grafiklar', 'xulosa',
  'tendensiya', 'taqqoslash', 'savdo',
  // Particles (these conflict with English/loanwords too — use carefully)
  `yo${APOS}q`, 'bilan', 'uchun', 'lekin', `bo${APOS}yicha`,
  // Specific masquerade words (camelCase pages put these)
  'Bitim', 'Bitimlar', 'Lidlar', 'Avans', 'Daromad',
  'Xarajat', 'Mijoz', 'Smena', 'Buyurtma',
  'Hisobot', 'Lavozim', 'Boshqaruv', 'Meneger', 'Sotuv',
  'Dashbordi',
];
const UZBEK_STEM_RE = new RegExp('\\b(' + UZBEK_STEMS.join('|') + ')\\b', 'gi');
// Apostrophe markers — strong Uzbek signal
const UZ_APOSTROPHE_RE = /\b[a-zA-Z]+[ʻ'`][a-zA-Z]+\b/g;
// Suffix-based detection: -lar/-ning/-da/-dan/-ga (case-insensitive, after
// at least 2 letters to avoid noise like "spa", "tea")
const UZ_SUFFIX_RE = /\b[a-zA-Z]{3,}(lar|ning|nda|dan|nga|ngiz|miz|siz|moqda|moqchi)\b/g;
// Cyrillic block (Russian)
const RU_CYRILLIC_RE = /[А-Яа-яЁё]/;

function stripWhitelist(text) {
  return text.split(/\b/).filter((w) => !WHITELIST.has(w)).join('');
}

/** Test a string for Uzbek leakage. */
export function isUzbekLeak(text) {
  if (!text || text.trim().length < 3) return false;
  const stripped = stripWhitelist(text);
  if (UZ_APOSTROPHE_RE.test(stripped)) { UZ_APOSTROPHE_RE.lastIndex = 0; return true; }
  UZBEK_STEM_RE.lastIndex = 0;
  if (UZBEK_STEM_RE.test(stripped)) return true;
  UZ_SUFFIX_RE.lastIndex = 0;
  if (UZ_SUFFIX_RE.test(stripped)) return true;
  return false;
}

/** Test a string for Russian leakage (Cyrillic chars). */
export function isRussianLeak(text) {
  if (!text || text.trim().length < 2) return false;
  // Strip whitelisted brand names (brand may contain Cyrillic too? generally no)
  return RU_CYRILLIC_RE.test(text);
}

/** Test for mixed Cyrillic + Uzbek-marker (worst kind, never legitimate). */
export function isMixedLanguage(text) {
  if (!text || text.length < 4) return false;
  const hasCyr = RU_CYRILLIC_RE.test(text);
  if (!hasCyr) return false;
  // Russian text containing Uzbek apostrophe / stem
  if (UZ_APOSTROPHE_RE.test(text)) { UZ_APOSTROPHE_RE.lastIndex = 0; return true; }
  UZBEK_STEM_RE.lastIndex = 0;
  if (UZBEK_STEM_RE.test(text)) return true;
  return false;
}

// ── STATIC MODE — scan source files for hardcoded strings ────────────────
const SCAN_DIRS = [
  'artifacts/erp-dashboard/src/pages',
  'artifacts/erp-dashboard/src/components',
  'artifacts/erp-dashboard/src/routes',
  'artifacts/erp-dashboard/src/camera-ai-modern',
  'artifacts/erp-dashboard/src/pos-monitor',
];
const SKIP_RE = /\.(test|spec|stories)\./;

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && /\.(tsx|ts)$/.test(e.name) && !SKIP_RE.test(e.name)) {
      yield full;
    }
  }
}

// Patterns that indicate "user-facing string":
//   1. JSX text between proper tags:  <Tag>text</Tag>
//   2. JSX prop value: prop="text"     (placeholder, title, label, ...)
//   3. Object literal label:  label: 'text'   (sidebar/route configs)
//   4. Toast / alert call:  toast({ title: 'text' })
//   5. Status map values: STATUS_MAP = { new: 'text', ... }
const RX_JSX_TEXT = /(<[A-Za-z][\w.-]*(?:\s+[^<>{}\n\r]*?)?>)([^<>{}\n\r]{3,}?)(<\/[A-Za-z][\w.-]*>)/g;
const RX_LABEL_PROP = /\b(placeholder|title|label|alt|aria-label|description|tooltip|name)=["']([^"'\n\r]{3,})["']/g;
const RX_OBJ_LABEL = /\b(label|title|name|description|placeholder)\s*:\s*["']([^"'\n\r]{3,})["']/g;

function scanFile(filePath) {
  const src = readFileSync(filePath, 'utf-8');
  const findings = [];

  // Heuristic: if the file is a sidebar / route config that gets passed
  // through getTranslatedMenuGroups (which translates every `title:` field),
  // OBJECT_LABEL findings are NOT leaks — they're i18n keys.
  const isSidebarConstants = /\/sidebar\/constants-/.test(filePath.replace(/\\/g, '/'));
  // Whether the file uses i18n at all (useTranslation OR getTranslatedMenuGroups).
  const usesI18n = /\b(useTranslation|getTranslatedMenuGroups|i18n\.t|i18next)\b/.test(src);

  const addFinding = (start, raw, kind, locale) => {
    const text = raw.trim();
    if (text.length < 3) return;
    if (/[<>{}$`]/.test(text)) return;
    if (/^[a-z][a-zA-Z0-9_-]*$/.test(text) && text.length < 12) return; // identifier
    if (/^\d/.test(text) && text.length < 6) return;
    const line = src.slice(0, start).split('\n').length;
    findings.push({ file: filePath, line, text, kind, locale });
  };

  // JSX text
  RX_JSX_TEXT.lastIndex = 0;
  let m;
  while ((m = RX_JSX_TEXT.exec(src))) {
    const innerStart = m.index + m[1].length;
    const raw = m[2];
    if (isUzbekLeak(raw)) addFinding(innerStart, raw, 'JSX_TEXT', 'uz');
    else if (isRussianLeak(raw)) addFinding(innerStart, raw, 'JSX_TEXT', 'ru');
  }

  // Prop values
  for (const re of [RX_LABEL_PROP, RX_OBJ_LABEL]) {
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      const raw = m[2];
      const kind = re === RX_LABEL_PROP ? 'PROP' : 'OBJECT_LABEL';
      // Skip object-label leaks when the file already uses i18n. In those
      // files (sidebar constants, TopNavigation, page-types) the hardcoded
      // values are typically i18n keys consumed by `t(...)` at render. False
      // positives swamp real findings otherwise.
      if (kind === 'OBJECT_LABEL' && (isSidebarConstants || usesI18n)) continue;
      if (isUzbekLeak(raw)) addFinding(m.index, raw, kind, 'uz');
      else if (isRussianLeak(raw)) addFinding(m.index, raw, kind, 'ru');
    }
  }

  return findings;
}

// ── DOM MODE — read HTML, walk text nodes, detect leaks ───────────────────
async function domMode(htmlPath, locale) {
  // jsdom would be nicer; we use a regex parser to avoid the dep on a fresh
  // checkout. Good enough for text-node extraction in compiled HTML.
  const html = readFileSync(htmlPath, 'utf-8');
  // Strip <script>…</script> + <style>…</style>
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ');
  // Extract text between tags
  const textRe = />([^<]+)</g;
  const leaks = [];
  let m;
  while ((m = textRe.exec(cleaned))) {
    const text = m[1].trim();
    if (text.length < 3) continue;
    if (locale === 'ru' && isUzbekLeak(text))     leaks.push({ text, kind: 'UZ_IN_RU' });
    if (locale === 'uz' && isRussianLeak(text))   leaks.push({ text, kind: 'RU_IN_UZ' });
    if (isMixedLanguage(text))                    leaks.push({ text, kind: 'MIXED' });
  }
  return leaks;
}

// ── CLI ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
}

const mode = arg('mode') ?? 'static';

if (mode === 'dom') {
  const html = arg('html');
  const locale = arg('locale') ?? 'ru';
  if (!html) {
    console.error('Usage: --mode=dom --html <path> --locale ru|uz');
    process.exit(1);
  }
  const leaks = await domMode(html, locale);
  console.log(JSON.stringify({ leaks }, null, 2));
} else if (mode === 'static') {
  const target = arg('out') ?? 'docs/i18n-leakage-baseline.json';
  const all = [];
  for (const dir of SCAN_DIRS) {
    try { statSync(dir); } catch { continue; }
    for (const f of walk(dir)) {
      const fs = scanFile(f);
      all.push(...fs);
    }
  }
  // Aggregate by file
  const byFile = {};
  for (const f of all) {
    byFile[f.file] = byFile[f.file] || [];
    byFile[f.file].push(f);
  }
  const sorted = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);
  const summary = {
    totalLeaks: all.length,
    filesWithLeaks: Object.keys(byFile).length,
    byKind: all.reduce((o, f) => { o[f.kind] = (o[f.kind] || 0) + 1; return o; }, {}),
    byLocale: all.reduce((o, f) => { o[f.locale] = (o[f.locale] || 0) + 1; return o; }, {}),
    topFiles: sorted.slice(0, 30).map(([f, arr]) => ({ file: f.replace(/^artifacts\/erp-dashboard\/src\//, ''), count: arr.length })),
  };
  writeFileSync(target, JSON.stringify({ summary, leaks: all }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nFull report: ${target}`);
} else {
  console.error(`Unknown mode: ${mode}. Use --mode=static or --mode=dom`);
  process.exit(1);
}
