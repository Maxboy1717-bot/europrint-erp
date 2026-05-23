#!/usr/bin/env node
/**
 * TSX hardcoded UZ string extractor.
 *
 * Usage:
 *   node _audit_out/tsx-hardcoded-extractor.mjs --apply <absolute-path-to-tsx-file>
 *   node _audit_out/tsx-hardcoded-extractor.mjs --dry <absolute-path-to-tsx-file>
 *
 * Transforms each detected hardcoded UZ string into a tLabel(key, fallback)
 * call. Adds the import line if missing.
 *
 *   JSX text:    >Salom dunyo<       →   >{tLabel("common.<File>.<key>", "Salom dunyo")}<
 *   Attr value:  placeholder="Izoh"  →   placeholder={tLabel("...", "Izoh")}
 *
 * Notes:
 *   - Uses static UZ-detection heuristics (Latin O' / G', UZ word list, ...).
 *   - Adds keys to artifacts/erp-dashboard/src/locales/uz/common.json AND ru/common.json
 *   - tLabel imports are inserted after the last import line if missing.
 *   - Idempotent: re-running on the same file does nothing new because
 *     already-wrapped strings (inside tLabel(...)) are not matched.
 *   - Does NOT touch files containing the skip token (see SKIP_TOKENS).
 *
 * Exit codes:
 *   0 — wrote changes (or no changes, but no error)
 *   1 — usage error
 *   2 — file not found / not a .tsx file
 */
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const DRY   = argv.includes('--dry') || !APPLY;
const file  = argv.find(a => !a.startsWith('--'));

if (!file) {
  console.error('Usage: tsx-hardcoded-extractor.mjs --apply <path-to-tsx>');
  process.exit(1);
}
if (!fs.existsSync(file)) { console.error(`Not found: ${file}`); process.exit(2); }
if (!file.endsWith('.tsx')) { console.error(`Not a .tsx file: ${file}`); process.exit(2); }

// ── Locale paths ──
const ROOT     = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SRC      = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src');
const UZ_JSON  = path.resolve(SRC, 'locales', 'uz', 'common.json');
const RU_JSON  = path.resolve(SRC, 'locales', 'ru', 'common.json');

// ── UZ heuristics ──
const UZ_MARKER_LATIN = /['ʻ`]|O['ʻ`]|G['ʻ`]|sh\b|ch\b|qil|lar\b|lik\b|chi\b/;
const UZ_WORDS = new Set([
  "Boshqaruv","Boshqaruvi","Sozlamalar","Sozlama","Holat","Holati","Jurnal","Jurnali",
  "Foydalanuvchi","Operator","Menejer","Xodim","Xodimlar","Mijoz","Mijozlar",
  "Buyurtma","Buyurtmalar","Faktura","Hisobot","Hisobotlar","Hisobot",
  "Profil","Sahifa","Sahifalar","Tarjima","Til","Tillar","Tizim","Tizimlar",
  "Modul","Modullar","Versiya","Hozir","Hozirgi","Yangi","Eski","Joriy",
  "Tugagan","Tugatilgan","Yaratish","Tahrirlash","Qoshish","Saqlash","Bekor",
  "Tasdiqlash","Yopish","Ochish","Tarix","Tarixi","Hamma","Barchasi","Barcha",
  "Faqat","Yoki","Topilmadi","Mavjud","Korish","Yuborish","Yuklab","Yuklash",
  "Tanlang","Tanlash","Kiriting","Tahrirlang","Tugatildi","Bajarildi",
  "Yetkazib","Material","Materiallar","Mahsulot","Mahsulotlar","Sex","Ombor",
  "Omborlar","Sifat","Nazorat","Tekshiruv","Tekshiruvi","Smena","Davomat",
  "Kirish","Chiqish","Karantin","Texnik","Texnologik","Rejalashtirish",
  "Marshrut","Marshrutlar","Stanok","Asbob","Ishlab","Ishchi","Bugun",
  "Kecha","Ertaga","Hafta","Oy","Yil","Sana","Vaqt","Jami","Miqdor","Narx",
  "Birlik","Tafsilot","Tafsilotlar","Qidiruv","Qidirish","Tanlanmagan",
  "Tanlangan","Hujjat","Hujjatlar","Filial","Filiallar","Bolim","Bolimlar",
  "Lavozim","Lavozimlar","Vazifa","Vazifalar","Royxat","Royxati","Reja",
  "Rejasi","Loyiha","Loyihasi","Maslahat","Maslahatlar","Ozbekcha","Bugun",
  "Kompaniya","Kompaniyalar","Boglanish","Bog","Telefon","Pochta","Manzil",
  "Korsatkich","Korsatkichlar","Daromad","Xarajat","Sotuvlar","Sotuv",
  "Xarid","Xaridlar","Mavjudligi","Yo","Yoq","Ha","Yangilandi","Yaratildi",
  "Ortacha","Eng","Past","Yuqori","Oraliq","Boshlangan","Tugagan","Ishlamoqda",
  "Faol","Faolsiz","Notinch","Faolsizlashtirilgan","Faollashtirilgan",
  "Yopildi","Bekor","Ulashish","Eksport","Import","Yangilash","Yaratmoq",
  "Ortacha","Boshqalar","Mas","Masul","Masullik","Bajarish","Yuklanmoqda",
  "Topshiriq","Topshiriqlar","Komanda","Komandalar","Aktiv","Aktivlar"
]);

function looksUzbek(text) {
  const t = text.trim();
  if (t.length < 2) return false;
  if (t.length > 200) return false;
  if (/^[\d\s.,:;%\-+/]+$/.test(t)) return false;
  if (/^[\d\s.,:;%\-+/]+\.?$/.test(t)) return false;
  // Code-like: contains symbols typical to code
  if (/[(){};=<>]/.test(t)) return false;
  if (/^[a-z][a-zA-Z0-9_]*$/.test(t)) return false; // identifier
  if (/^(true|false|null|undefined|NaN)$/.test(t)) return false;
  if (/^https?:\/\//.test(t)) return false;
  if (/^\/[a-z]/.test(t)) return false; // URL paths
  if (!/[a-zA-Z]/.test(t)) return false;
  if (/[А-Яа-я]/.test(t)) return false; // already Cyrillic
  // Skip pure English keywords
  const lower = t.toLowerCase();
  const englishKw = new Set([
    'save','cancel','delete','edit','add','close','open','submit','search','filter',
    'export','import','view','download','upload','login','logout','admin','user','role',
    'status','type','date','time','total','amount','price','quantity','yes','no','ok',
    'true','false','none','all','any','more','less','next','prev','back','home','title',
    'description','name','email','phone','address','city','country','zip','code','id',
  ]);
  if (englishKw.has(lower)) return false;
  // Has UZ apostrophe? Definitely UZ.
  if (/[a-zA-Z]['ʻ`]/.test(t)) return true;
  // Has known UZ word?
  const words = t.split(/[\s,.!?:;()\[\]"]+/).filter(Boolean);
  for (const w of words) {
    if (UZ_WORDS.has(w)) return true;
    // Title-cased UZ-ish word with apostrophe or marker
    if (UZ_WORDS.has(w[0]?.toUpperCase() + w.slice(1).toLowerCase())) return true;
  }
  // UZ marker pattern + Cyrillic-free + not English
  if (UZ_MARKER_LATIN.test(t)) {
    // Filter out pure English phrases like "Search", "User Profile" by checking for non-English structure
    // If all words are common English, skip.
    const isAllEnglish = words.every(w => englishKw.has(w.toLowerCase()));
    if (isAllEnglish) return false;
    return true;
  }
  return false;
}

// ── Key generation ──
function camelize(text) {
  const cleaned = text
    .replace(/[''`ʻ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  if (cleaned.length === 0) return 'untitled';
  const camel = cleaned[0].toLowerCase() + cleaned.slice(1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  // Strip non-leading-alpha
  return camel.replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z0-9]/g, '') || 'untitled';
}

function fileNameKey(file) {
  return path.basename(file, '.tsx');
}

// ── Locale management ──
function loadJson(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
function saveJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const data = JSON.stringify(obj, null, 2) + '\n';
  // Atomic write with retry (Windows file locking workaround)
  const tmp = p + '.tmp-' + process.pid;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(tmp, data, 'utf8');
      fs.renameSync(tmp, p);
      return;
    } catch (e) {
      if (attempt === 4) throw e;
      // Sleep ~50ms via Atomics
      const sab = new SharedArrayBuffer(4);
      const view = new Int32Array(sab);
      Atomics.wait(view, 0, 0, 50);
    }
  }
}

const uzObj = loadJson(UZ_JSON);
const ruObj = loadJson(RU_JSON);

function ensureKey(text, fileName) {
  const baseKey = `common.${fileName}.tsx.${camelize(text)}`;
  // Find an existing slot with the same value
  if (uzObj[baseKey] === text) return baseKey;
  // Find unique key
  let key = baseKey;
  let i = 1;
  while (uzObj[key] !== undefined && uzObj[key] !== text) {
    key = `${baseKey}${i++}`;
  }
  uzObj[key] = text;
  if (ruObj[key] === undefined) ruObj[key] = text; // RU placeholder
  return key;
}

// ── Skip tokens (this file should not be transformed) ──
const SKIP_TOKENS = [
  'tsx-hardcoded-extractor: skip',
  'i18n-skip',
];

// ── Transform ──
function transform(file) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Skip token?
  for (const tok of SKIP_TOKENS) {
    if (content.includes(tok)) return { changed: false, replacements: 0, skipped: 'skip-token' };
  }

  // Skip files where almost-everything is already tLabel()-wrapped or t()-wrapped
  const tLabelCount = (content.match(/tLabel\(/g) || []).length;
  const tCallCount  = (content.match(/\bt\("/g) || []).length;
  // (not a strict cutoff)

  const fileName = fileNameKey(file);
  let replacements = 0;

  // Region 1: JSX text node:  >TEXT<   (but ignore if TEXT has { or })
  // Multiline-safe: text may span newlines.
  const JSX_TEXT_RE = />\s*([^<>{}][^<>{}]*?)\s*</g;
  content = content.replace(JSX_TEXT_RE, (match, inner) => {
    const text = inner.trim();
    if (!text) return match;
    // Avoid double-wrapping
    if (/tLabel\(/.test(text) || /\bt\("/.test(text)) return match;
    if (!looksUzbek(text)) return match;
    const key = ensureKey(text, fileName);
    replacements++;
    return match.replace(inner, `{tLabel(${JSON.stringify(key)}, ${JSON.stringify(text)})}`);
  });

  // Region 2: JSX attribute string values
  const ATTR_RE = /\b(placeholder|title|alt|aria-label|label|tooltip|description|subtitle|content|emptyMessage|message|hint|helpText|errorMessage|noResultsText|loadingText|confirmText|cancelText|submitText|buttonText)\s*=\s*"([^"]+)"/g;
  content = content.replace(ATTR_RE, (match, attr, val) => {
    const text = val.trim();
    if (!text) return match;
    if (/tLabel\(/.test(text) || /\bt\("/.test(text)) return match;
    if (!looksUzbek(text)) return match;
    const key = ensureKey(text, fileName);
    replacements++;
    return `${attr}={tLabel(${JSON.stringify(key)}, ${JSON.stringify(text)})}`;
  });

  if (replacements === 0) return { changed: false, replacements: 0 };

  // Region 3: Ensure tLabel import
  const hasImport = /from\s+['"]@\/lib\/i18n\/tLabel['"]/.test(content);
  if (!hasImport) {
    const lines = content.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\s/.test(lines[i]) || /^\s*}\s*from\s+['"]/.test(lines[i])) lastImport = i;
    }
    const importLine = `import { tLabel } from '@/lib/i18n/tLabel';`;
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, importLine);
    } else {
      lines.unshift(importLine);
    }
    content = lines.join('\n');
  }

  if (content === original) return { changed: false, replacements: 0 };

  if (APPLY) {
    fs.writeFileSync(file, content, 'utf8');
    saveJson(UZ_JSON, uzObj);
    saveJson(RU_JSON, ruObj);
  }

  return { changed: true, replacements };
}

const r = transform(file);
const rel = path.relative(SRC, file).replace(/\\/g, '/');
if (r.skipped) {
  console.log(`SKIP ${rel} (${r.skipped})`);
} else if (r.changed) {
  console.log(`${APPLY ? 'WROTE' : 'DRY  '} ${rel}  +${r.replacements}`);
} else {
  console.log(`OK   ${rel} (no changes)`);
}
process.exit(0);
