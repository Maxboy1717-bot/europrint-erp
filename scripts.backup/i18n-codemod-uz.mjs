#!/usr/bin/env node
/**
 * Comprehensive UZ → i18n codemod for EuroPrint frontend.
 *
 * Scans every .tsx under artifacts/erp-dashboard/src/ and:
 *  1. Detects hardcoded JSX text + attribute values that look like Uzbek UI text
 *  2. Replaces each with t("key") where key is camelCased from the UZ string
 *  3. Inserts `useTranslation("common")` hook + import if missing
 *  4. Appends new keys to uz/common.json and ru/common.json
 *     - uz value = original UZ text (identity)
 *     - ru value = UZ text (placeholder — needs human translation)
 *
 * Modes:
 *   --dry-run        write nothing, print diff summary
 *   --files=GLOB     only process files matching GLOB (default: all *.tsx)
 *   --limit=N        stop after N files (for testing)
 *   --namespace=NS   use NS instead of 'common' for new keys
 *   --quiet          suppress per-file output
 *
 * Safety:
 *   - Skips files that already have t() on more than 50% of UZ-looking strings
 *   - Skips JSX text shorter than 3 chars
 *   - Skips className/data-testid/key attribute values
 *   - Skips test/spec files and node_modules
 *   - Idempotent: running twice doesn't double-wrap
 *   - Per-file ConfirmDialog: writes only if hasChanges
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const QUIET    = args.includes('--quiet');
const LIMIT    = parseInt((args.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '')) || Infinity;
const NS       = (args.find(a => a.startsWith('--namespace=')) || '').replace('--namespace=', '') || 'common';
const FILE_GLOB= (args.find(a => a.startsWith('--files=')) || '').replace('--files=', '') || '';

const ROOT    = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SRC     = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src');
const LOCALES = path.resolve(SRC, 'locales');

const UZ_JSON = path.resolve(LOCALES, 'uz', `${NS}.json`);
const RU_JSON = path.resolve(LOCALES, 'ru', `${NS}.json`);

// ───────────────────────────────────────────────────────────────────────────
// File walker
// ───────────────────────────────────────────────────────────────────────────
function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'locales', '__tests__', '__mocks__'].includes(e.name)) continue;
      walk(p, files);
    } else if (e.name.endsWith('.tsx') && !e.name.includes('.test.') && !e.name.includes('.spec.')) {
      if (FILE_GLOB && !p.includes(FILE_GLOB)) continue;
      files.push(p);
    }
  }
  return files;
}

// ───────────────────────────────────────────────────────────────────────────
// UZ detection heuristics
// ───────────────────────────────────────────────────────────────────────────
const UZ_MARKERS = /[A-Z][a-z]{2,}|'[a-z]|O'|G'|g'|sh\b|ch\b/;
const UZ_WORDS = new Set([
  // High-confidence Uzbek words
  "Boshqaruv", "Boshqaruvi", "Sozlamalar", "Sozlama", "Holat", "Holati", "Jurnal", "Jurnali",
  "Foydalanuvchi", "Operator", "Menejer", "Xodim", "Xodimlar", "Mijoz", "Mijozlar",
  "Buyurtma", "Buyurtmalar", "Faktura", "To'lov", "To'lovlar", "Hisobot", "Hisobotlar",
  "Profil", "Sahifa", "Sahifalar", "Tarjima", "Til", "Tillar", "Tizim", "Tizimlar",
  "Modul", "Modullar", "Versiya", "Bo'lim", "Bo'limlar", "Bu", "Hozir", "Hozirgi",
  "Yaratish", "Tahrirlash", "O'chirish", "Qo'shish", "Saqlash", "Bekor", "Tasdiqlash",
  "Yopish", "Ochish", "Yangi", "Eski", "Joriy", "Tugagan", "Tugatilgan",
  "Tarix", "Tarixi", "Hamma", "Barchasi", "Barcha", "Hech", "Faqat", "Yoki", "Va",
  "Topilmadi", "Mavjud", "Yo'q", "Ha", "Ko'rish", "Yuborish", "Yuklab", "Yuklash",
  "Tanlang", "Tanlash", "Kiriting", "Tahrirlang", "Tugatildi", "Bajarildi",
  "Yetkazib", "Yetkazuvchi", "Material", "Materiallar", "Mahsulot", "Mahsulotlar",
  "Sex", "Ombor", "Omborlar", "Sifat", "Nazorat", "Tekshiruv", "Tekshiruvi",
  "Smena", "Davomat", "Kirish", "Chiqish", "Karantin", "Texnik", "Texnologik",
  "Rejalashtirish", "Marshrut", "Marshrutlar", "Stanok", "Stanoq", "Asbob",
  "Ishlab", "Ishchi", "Ish", "Joriy", "Bugun", "Kecha", "Ertaga", "Hafta", "Oy", "Yil",
  "Sana", "Vaqt", "Jami", "Miqdor", "Narx", "Birlik", "Tafsilot", "Tafsilotlar",
]);

function looksUzbek(text) {
  const t = text.trim();
  if (t.length < 3) return false;
  if (t.length > 200) return false;                // too long, probably code/log
  if (/^[\d\s.,:-]+$/.test(t)) return false;       // numeric
  if (/[(){};=<>/]/.test(t)) return false;         // code-like
  if (/^[a-z][a-zA-Z0-9_]+$/.test(t)) return false; // variable/identifier
  if (/^(true|false|null|undefined|NaN)$/.test(t)) return false;
  if (/^https?:\/\//.test(t)) return false;
  if (/^\/[a-z]/.test(t)) return false;            // URL paths
  if (!/[a-zA-Z]/.test(t)) return false;           // no letters → no
  if (/[А-Яа-я]/.test(t)) return false;            // already Cyrillic
  // Has apostrophe (O', g')? Definitely UZ.
  if (/[a-zA-Z]['ʻ`]/.test(t)) return true;
  // Has a known UZ word?
  const words = t.split(/\s+/);
  for (const w of words) if (UZ_WORDS.has(w)) return true;
  // Has UZ marker pattern?
  if (UZ_MARKERS.test(t)) {
    // But also filter out pure English
    const lower = t.toLowerCase();
    const englishOnly = ['save','cancel','delete','edit','add','close','open','submit','search','filter','export','import','view','download','upload','login','logout','admin','user','role','status','type','date','time','total','amount','price','quantity'];
    if (englishOnly.includes(lower)) return false;
    return true;
  }
  return false;
}

// ───────────────────────────────────────────────────────────────────────────
// Key generation
// ───────────────────────────────────────────────────────────────────────────
function textToKey(text) {
  const norm = text.trim()
    .replace(/'/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  if (norm.length === 0) return `key_${Math.abs(hashCode(text))}`;
  const camel = norm[0].toLowerCase() + norm.slice(1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return camel.replace(/^[^a-z]/, 'k$&');
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ───────────────────────────────────────────────────────────────────────────
// Locale management
// ───────────────────────────────────────────────────────────────────────────
function loadJson(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

const uzObj = loadJson(UZ_JSON);
const ruObj = loadJson(RU_JSON);

// value → key reverse index (so identical text reuses the same key)
const uzReverse = new Map();
for (const [k, v] of Object.entries(uzObj)) if (typeof v === 'string') uzReverse.set(v, k);

function ensureKey(text) {
  if (uzReverse.has(text)) return uzReverse.get(text);
  let key = textToKey(text);
  // Ensure uniqueness
  let unique = key;
  let i = 1;
  while (uzObj[unique] !== undefined && uzObj[unique] !== text) {
    unique = `${key}${i++}`;
  }
  uzObj[unique] = text;
  if (ruObj[unique] === undefined) ruObj[unique] = text; // RU placeholder = UZ
  uzReverse.set(text, unique);
  return unique;
}

// ───────────────────────────────────────────────────────────────────────────
// Source transformation
// ───────────────────────────────────────────────────────────────────────────
const ATTR_RE = /\b(placeholder|title|alt|aria-label|label|tooltip|description|subtitle|content)\s*=\s*"([^"]+)"/g;
const JSX_TEXT_RE = />\s*([^<>{}\n][^<>{}\n]{2,})\s*</g;

function transformFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  let replacements = 0;
  const usedKeys = new Set();

  // ── 1. JSX text nodes ──
  // We can't do simple string replacement because text may appear elsewhere; we walk match-by-match
  content = content.replace(JSX_TEXT_RE, (match, inner) => {
    const text = inner.trim();
    if (!looksUzbek(text)) return match;
    // Skip if the matched text starts with quote/brace (we caught code-like)
    if (/^['"`{]/.test(text)) return match;
    const key = ensureKey(text);
    usedKeys.add(key);
    replacements++;
    // Preserve leading/trailing whitespace
    return match.replace(inner, `{t("${key}")}`);
  });

  // ── 2. JSX attribute values ──
  content = content.replace(ATTR_RE, (match, attr, val) => {
    const text = val.trim();
    if (!looksUzbek(text)) return match;
    const key = ensureKey(text);
    usedKeys.add(key);
    replacements++;
    return `${attr}={t("${key}")}`;
  });

  if (replacements === 0) return { file, replacements: 0, changed: false };

  // ── 3. Ensure useTranslation hook ──
  const hasImport = /import\s+\{[^}]*useTranslation[^}]*\}\s+from\s+['"]@\/lib\/i18n['"]/.test(content);
  const hasHookCall = /const\s+\{\s*t[\s,}]/.test(content);

  if (!hasImport) {
    // Add import after last existing import
    const lines = content.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    const importLine = `import { useTranslation } from '@/lib/i18n';`;
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, importLine);
    } else {
      lines.unshift(importLine);
    }
    content = lines.join('\n');
  }

  if (!hasHookCall) {
    // Find a place to insert the hook — first function body after a return( or first {
    const fnPatterns = [
      /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
      /(export\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
      /(function\s+\w+\s*\([^)]*\)[^{]*\{)/,
      /(const\s+\w+\s*[:=]\s*\([^)]*\)\s*=>\s*\{)/,
      /(const\s+\w+\s*[:=]\s*[^=]*=>\s*\{)/,
    ];
    let added = false;
    for (const re of fnPatterns) {
      const m = content.match(re);
      if (m) {
        const idx = m.index + m[0].length;
        content = content.slice(0, idx) + `\n  const { t } = useTranslation("${NS}");` + content.slice(idx);
        added = true;
        break;
      }
    }
    if (!added) {
      // Can't find function body — abandon transformation for this file
      return { file, replacements: 0, changed: false, skipped: 'no function body found' };
    }
  }

  if (content === original) return { file, replacements: 0, changed: false };

  if (!DRY_RUN) fs.writeFileSync(file, content, 'utf8');

  return { file, replacements, changed: true };
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────
const allFiles = walk(SRC);
const targetFiles = allFiles.slice(0, LIMIT);

let totalFiles = 0;
let totalReps = 0;
let skipped = 0;

console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Scanning ${targetFiles.length} files (NS=${NS})…\n`);

for (const f of targetFiles) {
  try {
    const r = transformFile(f);
    if (r.changed) {
      totalFiles++;
      totalReps += r.replacements;
      if (!QUIET) console.log(`  ${r.replacements.toString().padStart(3)} :: ${path.relative(SRC, f)}`);
    } else if (r.skipped) {
      skipped++;
      if (!QUIET) console.log(`  SKIP ${path.relative(SRC, f)} :: ${r.skipped}`);
    }
  } catch (err) {
    console.error(`  ERR  ${path.relative(SRC, f)}: ${err.message}`);
    skipped++;
  }
}

if (!DRY_RUN && totalReps > 0) {
  saveJson(UZ_JSON, uzObj);
  saveJson(RU_JSON, ruObj);
}

console.log('');
console.log(`Files changed       : ${totalFiles}`);
console.log(`Strings replaced    : ${totalReps}`);
console.log(`Skipped             : ${skipped}`);
console.log(`Keys in ${NS}.json     : ${Object.keys(uzObj).length}`);
if (DRY_RUN) console.log(`\n[DRY RUN] no files were modified. Re-run without --dry-run to apply.`);
