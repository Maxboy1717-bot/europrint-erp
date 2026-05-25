#!/usr/bin/env node
/**
 * audit-i18n-strict.mjs — find TRULY untranslated English values in UZ/RU locales.
 *
 * The existing audit-i18n.mjs detector marks any 4+ char ASCII string without
 * "sh/o'/g'/qish/chiq" as English. This false-positives nearly every Uzbek
 * value because Uzbek uses MANY other markers (ch, ng, lik, chi, siz, …).
 *
 * Strict detector logic (whitelist approach):
 *   - skip pure numbers, very short strings, dates, urls, codes
 *   - if value contains any Cyrillic → skip (it's Russian)
 *   - if value contains uppercase-only words like "API", "ID", "HR", "PDF",
 *     "URL", "QR", "SMS", "VAT", "IP" → these are loanwords, accepted
 *   - if value contains apostrophes (o') or Uzbek-specific letters → Uzbek
 *   - if value uses words ending in -lik, -chi, -siz, -lar, -ning, -dan,
 *     -ga, -da, -ni, -mi, -gan, -gan, -ish, -ush → Uzbek morphology
 *   - if value uses common Uzbek words (men, siz, biz, bu, shu, bor, yo'q,
 *     edi, ekan, kerak, mumkin, qil-, ko'r-, ber-, ol-, …) → Uzbek
 *   - what remains: pure-English text with no Uzbek/loanword/code character
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const UZ_DIR = 'artifacts/erp-dashboard/src/locales/uz';
const RU_DIR = 'artifacts/erp-dashboard/src/locales/ru';

function flatten(o, p = '') {
  const out = {};
  for (const [k, v] of Object.entries(o ?? {})) {
    const kk = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, kk));
    else out[kk] = v;
  }
  return out;
}

// Common Uzbek words (any one match → value is Uzbek).
const UZ_WORDS = /\b(va|yoki|ham|bu|shu|men|sen|siz|biz|ular|bor|yoq|edi|ekan|kerak|mumkin|hech|har|bir|ikki|uch|kim|nima|qachon|qayer|nega|qanday|haqida|uchun|bilan|orqali|so[ʻ'`]m|ming|million|natija|topilmadi|saqlandi|saqlangan|bekor|qilingan|tayyor|yangi|eski|kichik|katta|toza|to[ʻ'`]liq|bo[ʻ'`]sh|emas|kerakli|chiqarish|kiritish|qaytadan|amal|qator|qatori|sahifa|jami|umumiy|barcha|hammasi|holat|natija|jarayon|tugagan|boshlash|davom|qo[ʻ'`]shish|tashlash|tahrir|tekshir|tasdiqla|joriy|keyingi|oldingi|birinchi|oxirgi|haftalik|kunlik|oylik|yillik|talab|etiladi|amalga|oshirildi|qabul|berildi|olindi|berib|olib|ko[ʻ'`]r|qil|ber|ol|chaq|yur|tur|kel|ket|ish|chiq|kirit|son|raqam|sana|vaqt|kun|oy|yil|hafta|smena|nazorat|tahlil|hisobot|hujjat|fayl|jadval|grafik|diagramma|maqsad|natija|sabab|usul|ish|xodim|xodimlar|mijoz|buyurtma|mahsulot|material|ombor|sotuv|xarid|to[ʻ'`]lov|hisob|nazariy|amaliy|sifat|miqdor|narx|qiymat|jami|umumiy|farq|nisbat|foiz|jami|smena|guruh|bo[ʻ'`]lim|tasdiqlash|rad|etish)\b/i;
// Uzbek-specific morphology — Uzbek often ends words with these. The match
// is anywhere in the value (not just word boundary), since "lik/chi/siz/larr"
// commonly appear as suffixes inside words.
const UZ_MORPH = /(o['ʻ`]|g['ʻ`]|sh\w|ch\w|ng\w|\w(lik|chi|siz|lar|ning|dan|ga|da|ni|mi|gan|kan|ish|ush|moq|chilik|gan|qan)\b)/i;
// Strong English indicators
const EN_SUFFIX = /\b\w+(tion|sion|ment|ness|able|ible|ing|ous|ity|ence|ance|less)\b/i;
// Loanword / abbreviation tokens (no penalty)
const LOAN = /\b(API|ID|HR|PDF|URL|QR|SMS|VAT|IP|UI|UX|AI|ML|KPI|OEE|MES|WMS|MRO|CRM|ERP|BOM|MRP|TZ|IT|TV|FM|GPS|GIS|GMT|GMT|UZ|RU|EN|RGB|JSON|XML|CSV|XLS|XLSX|DOC|DOCX|PNG|JPG|JPEG|GIF|MP3|MP4|HTML|CSS|JS|TS|REST|HTTP|HTTPS|TCP|FTP|SSH|SSL|TLS|JWT|OAuth|OTP|MFA|2FA|DB|SQL|NoSQL|OEM|ODM|R&D|B2B|B2C|VIP|HD|UHD|4K|8K|GPS|IoT|MES|WMS|OEE|GL|GR|GI|MM|FI|HR|SD|PP|PM|QC|QA|QM|QS|RU|UZ)\b/g;

function isReallyEnglish(v) {
  if (typeof v !== 'string') return false;
  if (v.trim().length === 0 || v.length < 4) return false;
  // Has Cyrillic → Russian, skip
  if (/[Ѐ-ӿ]/.test(v)) return false;
  // Has non-ASCII letters typical for Uzbek (turkic chars) → Uzbek
  if (/[ʻʼ‘’]/.test(v)) return false;
  // Strip loanwords/abbreviations
  const stripped = v.replace(LOAN, '').trim();
  if (stripped.length < 4) return false;
  // Uzbek morphology in surviving text → Uzbek
  if (UZ_MORPH.test(stripped)) return false;
  // Uzbek common words → Uzbek
  if (UZ_WORDS.test(stripped)) return false;
  // Apostrophe usage (o' / g') → Uzbek
  if (/['`]/.test(stripped)) return false;
  // Strong English suffix → English
  if (EN_SUFFIX.test(stripped)) return true;
  // Must contain at least one English connective or be a clearly English word
  const EN_WORDS = /\b(the|and|or|of|for|with|new|edit|create|delete|please|enter|select|loading|cancel|save|continue|back|next|done|close|open|view|show|hide|toggle|copy|paste|search|filter|sort|order|action|status|name|password|user|users|profile|settings|dashboard|admin|manager|owner|customer|product|invoice|payment|report|reports|export|import|preview|details|description|comment|message|count|total|page|pages|today|yesterday|tomorrow|week|month|year|recent|completed|pending|approved|rejected|active|inactive|disabled|enabled|read|unread|sent|received|all|none|other|any|some|each|every|few|many|much|little|less|more|most|least|create|update|delete|read|write|click|tap|hover|drag|drop|select|deselect|check|uncheck|mark|unmark|expand|collapse|maximize|minimize|fullscreen|zoom|scroll|tab|window|panel|widget|button|link|input|field|form|card|table|chart|graph|plot|axis|series|filter|range|date|time|datetime|currency|number|integer|decimal|percent|ratio)\b/i;
  if (EN_WORDS.test(stripped)) return true;
  // Otherwise: at least 3 words AND no Uzbek markers anywhere → English
  if (stripped.split(/\s+/).length >= 3) return true;
  return false;
}

const results = { uz: {}, ru: {} };

for (const f of readdirSync(UZ_DIR).filter((x) => x.endsWith('.json'))) {
  const ns = f.replace(/\.json$/, '');
  const obj = JSON.parse(readFileSync(join(UZ_DIR, f), 'utf-8'));
  const bad = Object.entries(flatten(obj)).filter(([, v]) => isReallyEnglish(v));
  if (bad.length > 0) results.uz[ns] = bad;
}

for (const f of readdirSync(RU_DIR).filter((x) => x.endsWith('.json'))) {
  const ns = f.replace(/\.json$/, '');
  const obj = JSON.parse(readFileSync(join(RU_DIR, f), 'utf-8'));
  const bad = Object.entries(flatten(obj)).filter(([, v]) => isReallyEnglish(v));
  if (bad.length > 0) results.ru[ns] = bad;
}

const uzTotal = Object.values(results.uz).reduce((s, a) => s + a.length, 0);
const ruTotal = Object.values(results.ru).reduce((s, a) => s + a.length, 0);

console.log(`Strict English-in-UZ count: ${uzTotal}`);
console.log(`Strict English-in-RU count: ${ruTotal}`);
console.log();
console.log('━━ UZ per-namespace ━━');
for (const [ns, items] of Object.entries(results.uz).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${ns.padEnd(18)} ${items.length}`);
}
console.log();
console.log('━━ Sample (top 30 UZ) ━━');
const allUz = Object.entries(results.uz).flatMap(([ns, arr]) => arr.map(([k, v]) => [`${ns}/${k}`, v]));
for (const [k, v] of allUz.slice(0, 30)) console.log(`  ${k.padEnd(50)} = ${JSON.stringify(v)}`);

writeFileSync('audit-i18n-strict-report.json', JSON.stringify(results, null, 2));
console.log('\nReport saved: audit-i18n-strict-report.json');
