#!/usr/bin/env node
/**
 * audit-i18n-uz-in-ru.mjs — Find Uzbek text leaking into ru/*.json
 *   (i.e., entries that should be Russian but are actually Uzbek).
 *
 * Heuristic: a value is "likely Uzbek not Russian" if it contains
 *   Latin letters but NO Cyrillic letters AND has Uzbek morphology markers.
 *
 * Uzbek markers: 'oʻ', 'gʻ', 'sh' (any pos), 'ch' (any pos),
 *   suffixes -lik, -chi, -lar, -dan, -ga, -ning, -ni, -da
 *   common Uzbek words: va, bilan, uchun, yoki, lekin, agar, ham, qanday
 */
import fs from 'node:fs';
import path from 'node:path';

const RU_DIR = path.join(process.cwd(), 'artifacts/erp-dashboard/src/locales/ru');
const UZ_DIR = path.join(process.cwd(), 'artifacts/erp-dashboard/src/locales/uz');

const CYRILLIC = /[Ѐ-ӿ]/;
const LATIN = /[A-Za-z]/;

const UZ_WORDS = [
  'va', 'bilan', 'uchun', 'yoki', 'lekin', 'agar', 'ham', 'qanday',
  'mavjud', 'topilmadi', 'tanlang', 'kiriting', 'yuklash', 'saqlash',
  'tahrirlash', 'qoshish', 'qoʻshish', 'ochirish', 'oʻchirish', 'koʻrish',
  'maosh', 'maoshi', 'maxfiy', 'maxfiylik', 'rahbar', 'rahbari',
  'tozalash', 'qidiruv', 'qidirish', 'tarix', 'tarixi', 'tartibi',
  'haqida', 'orqali', 'davomida', 'natijasida', 'asosida',
  'asosiy', 'qoʻshimcha', 'oxirgi', 'birinchi', 'keyingi',
  'siz', 'biz', 'ular', 'meni', 'sizning', 'bizning',
  'kasalxonada', 'kasalxona', 'shifoxonada', 'ofisda', 'uyda',
  'bevosita', 'bilvosita',
];
const UZ_WORDS_RE = new RegExp(`\\b(${UZ_WORDS.join('|')})\\b`, 'i');
const UZ_MORPHOLOGY = /(oʻ|gʻ|o['ʼ]|g['ʼ]|sh[aeiou]|ch[aeiou]|[a-z]ng[aeiou]|[a-z](lar|chi|ning|dan|ga|da|ni)\b)/i;

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[full] = v;
    else if (typeof v === 'object' && v !== null) flatten(v, full, out);
  }
  return out;
}

// Detect both pure-Uzbek values AND mixed values containing Uzbek fragments.
function isLikelyUzbek(val) {
  if (typeof val !== 'string' || val.length < 2) return false;
  if (!LATIN.test(val)) return false;          // pure Cyrillic or digits — ok
  // Strip leading brand/tech tokens
  // Brand: any value that is *entirely* one of these names → skip
  if (/^[A-Z0-9_.-]+$/.test(val)) return false;
  if (/^(EuroPrint|WhatsApp|Telegram|Gmail|Outlook|Slack|Stripe|PayPal|Excel|Gemini|GPT|Claude|OpenAI|Anthropic|Google|Microsoft|Meta|Apple|Amazon|Instagram|Facebook|LinkedIn|YouTube|TikTok|Pantone|Modbus|Notion|Inter Regular|AI Predictive Engine|Photoshop|@\w+_bot|@europrint_\w+)$/.test(val)) return false;
  // Strong Uzbek morphology or word match anywhere
  if (UZ_WORDS_RE.test(val)) return true;
  if (UZ_MORPHOLOGY.test(val)) return true;
  return false;
}

const issues = [];
let total = 0;

for (const fname of fs.readdirSync(RU_DIR)) {
  if (!fname.endsWith('.json')) continue;
  const ns = fname.replace(/\.json$/, '');
  const data = JSON.parse(fs.readFileSync(path.join(RU_DIR, fname), 'utf8'));
  const flat = flatten(data);
  for (const [key, val] of Object.entries(flat)) {
    total++;
    if (isLikelyUzbek(val)) {
      issues.push({ ns, key, value: val });
    }
  }
}

console.log(`━━ UZBEK-IN-RU AUDIT ━━`);
console.log(`Total RU entries scanned: ${total}`);
console.log(`Suspected Uzbek-in-RU:    ${issues.length}`);
console.log(`\n━━ Sample (top 30) ━━`);
for (const e of issues.slice(0, 30)) {
  console.log(`  [${e.ns}] ${e.key}: "${e.value}"`);
}

fs.writeFileSync('audit-i18n-uz-in-ru.json', JSON.stringify(issues, null, 2));
console.log(`\nFull report: audit-i18n-uz-in-ru.json (${issues.length} entries)`);
