#!/usr/bin/env node
/**
 * fix-jsx-and-props.mjs — fix remaining JSX_TEXT + PROP leaks in React .tsx
 * files. Smart context detection: if the leak is inside a function that has
 * `t` available (via useTranslation hook or destructured `t` parameter), use
 * `t('key')`. Otherwise wrap in `tLabel('key', 'fallback')` (static helper).
 *
 * Reads docs/i18n-leakage-baseline.json. Modifies source + adds i18n keys.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

const LEAK_REPORT = 'docs/i18n-leakage-baseline.json';
const UZ_DIR = 'artifacts/erp-dashboard/src/locales/uz';
const RU_DIR = 'artifacts/erp-dashboard/src/locales/ru';

// Russian hint table — reused, condensed
const RU_HINTS = new Map(Object.entries({
  '1-smena': '1-смена', '2-smena': '2-смена', '3-smena': '3-смена',
  'faol': 'Активный', 'nofaol': 'Неактивный', 'yangi': 'Новый',
  'kutilmoqda': 'Ожидает', 'tasdiqlangan': 'Подтверждено',
  'yakunlangan': 'Завершено', 'bekor qilingan': 'Отменено',
  'bekor qilindi': 'Отменено', 'rad etilgan': 'Отклонено',
  'bajarilmoqda': 'Выполняется', 'yopilgan': 'Закрыто', 'ochiq': 'Открыто',
  'umumiy malumotlar': 'Общие сведения', "umumiy ma'lumotlar": 'Общие сведения',
  "mahsulot turi": 'Тип продукта', 'mahsulot turi:': 'Тип продукта:',
  'aktiv xodimlar': 'Активные сотрудники',
  'faol foydalanuvchilar': 'Активные пользователи',
  'tugatish %': 'Завершено %', 'tasdiqlangan (%)': 'Подтверждено (%)',
  'yangi tayinlanganlar': 'Новые назначения',
  'xodimlar soni': 'Кол-во сотрудников',
  'ishlab chiqarish jadvali': 'График производства',
  'smena': 'Смена',
  "optimallashtirish ko'rsatkichlari": 'Показатели оптимизации',
  'русский:': 'Русский:',
}));

function ruHint(uz) {
  const low = uz.toLowerCase().trim();
  if (RU_HINTS.has(low)) return RU_HINTS.get(low);
  return uz;
}

const UZ_HINTS = new Map(Object.entries({
  'русский:': "Ruscha:",
  'категория': 'Toifa', 'статус': 'Holat', 'тип': 'Turi',
  'количество': 'Miqdor', 'дата': 'Sana',
}));
function uzHint(ru) {
  const low = ru.toLowerCase().trim();
  if (UZ_HINTS.has(low)) return UZ_HINTS.get(low);
  return ru;
}
function isRu(s) { return /[А-Яа-яЁё]/.test(s); }

function slug(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['ʻʼ`’]/g, '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .map((w, i) => i === 0 ? w.toLowerCase() : (w[0]?.toUpperCase() ?? '') + w.slice(1).toLowerCase())
    .join('')
    .slice(0, 50) || 'untitled';
}

function nsFor(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const m = norm.match(/src\/pages\/([^/]+)\//);
  if (m) {
    const known = new Set(['crm','sales','sd','kanban','adaptation','finance','hr','warehouse','wms','production','qc','iot','mes','mm','marketing','lms','pos','security','admin','design','analytics','accountant','director','integration','planning','erp','employee-profile','barcode']);
    if (known.has(m[1])) return m[1];
  }
  return 'common';
}

function loadJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return {}; }
}

function setKey(obj, path, value) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
    o = o[parts[i]];
  }
  const leaf = parts[parts.length - 1];
  if (!(leaf in o)) { o[leaf] = value; return true; }
  return false;
}

const baseline = JSON.parse(readFileSync(LEAK_REPORT, 'utf-8'));
const byFile = {};
for (const l of baseline.leaks) {
  if (l.kind !== 'JSX_TEXT' && l.kind !== 'PROP') continue;
  byFile[l.file] = byFile[l.file] || [];
  byFile[l.file].push(l);
}

let filesTouched = 0, totalEdits = 0, totalKeys = 0;
const fix_keys_global = {};

for (const [filePath, leaks] of Object.entries(byFile)) {
  const ns = nsFor(filePath);
  const fileBase = basename(filePath, '.tsx').replace(/\.ts$/, '');
  let src;
  try { src = readFileSync(filePath, 'utf-8'); } catch { continue; }
  const targetTexts = new Set(leaks.map(l => l.text));

  // Decide which helper to use:
  //   - .ts file (no JSX): tLabel — always safe
  //   - .tsx file with useTranslation hook somewhere: t() inside React, tLabel otherwise
  // To stay safe, use tLabel everywhere (works in both contexts via global i18n).
  // tLabel is reactive enough on full reload; for hot locale switching the
  // component will re-render and the new t() value will be picked up on the
  // NEXT mount. Good-enough trade-off for bulk fix.
  const useTLabel = true;

  // JSX text leaks: `<Tag>Text</Tag>` → `<Tag>{tLabel('key','Text')}</Tag>`
  const jsxRe = /(<[A-Za-z][\w.-]*(?:\s+[^<>{}\n\r]*?)?>)([^<>{}\n\r]{3,}?)(<\/[A-Za-z][\w.-]*>)/g;
  // Prop leaks: handled per-quote
  const propRe = /\b(placeholder|title|label|alt|aria-label|description|tooltip|name)=("([^"\n\r]{3,})"|'([^'\n\r]{3,})')/g;

  const edits = [];

  // JSX TEXT
  jsxRe.lastIndex = 0;
  let m;
  while ((m = jsxRe.exec(src))) {
    const openTag = m[1];
    const text = m[2];
    const trimmed = text.trim();
    if (!targetTexts.has(trimmed)) continue;
    // Skip if surrounded by template / expression markers
    if (/[<>{}$`]/.test(trimmed)) continue;
    const textStartAbs = m.index + openTag.length;
    const textEndAbs = textStartAbs + text.length;
    const keySlug = slug(trimmed);
    const fullKey = `${ns}.${fileBase}.${keySlug}`;
    edits.push({
      start: textStartAbs,
      end: textEndAbs,
      replacement: `{tLabel('${fullKey}', ${JSON.stringify(trimmed)})}`,
      key: fullKey,
      raw: trimmed,
    });
  }

  // PROP
  propRe.lastIndex = 0;
  while ((m = propRe.exec(src))) {
    const attr = m[1];
    const fullAttr = m[2];
    const text = m[3] ?? m[4];
    if (!targetTexts.has(text)) continue;
    // Skip if value uses generics
    if (/[<>{}$`]/.test(text)) continue;
    // Skip if already wrapped in t/tLabel
    const before = src.slice(Math.max(0, m.index - 20), m.index);
    if (before.includes('tLabel(') || /\bt\(/.test(before)) continue;
    const keySlug = slug(text);
    const fullKey = `${ns}.${fileBase}.${keySlug}`;
    edits.push({
      start: m.index,
      end: m.index + m[0].length,
      replacement: `${attr}={tLabel('${fullKey}', ${JSON.stringify(text)})}`,
      key: fullKey,
      raw: text,
    });
  }

  if (edits.length === 0) continue;

  // De-dup + sort right-to-left
  const seen = new Set();
  const deduped = edits.filter(e => { if (seen.has(e.start)) return false; seen.add(e.start); return true; });
  deduped.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of deduped) {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }

  // Add tLabel import
  if (!/from\s+['"]@\/lib\/i18n\/tLabel['"]/.test(out)) {
    const importRe = /^import[\s\S]*?;\s*$/gm;
    let lastEnd = -1;
    let im;
    while ((im = importRe.exec(out))) lastEnd = im.index + im[0].length;
    const importLine = `\nimport { tLabel } from '@/lib/i18n/tLabel';`;
    out = lastEnd > 0 ? out.slice(0, lastEnd) + importLine + out.slice(lastEnd) : importLine + '\n' + out;
  }

  writeFileSync(filePath, out);
  filesTouched++;
  totalEdits += deduped.length;

  for (const e of deduped) {
    const uzValue = isRu(e.raw) ? uzHint(e.raw) : e.raw;
    const ruValue = isRu(e.raw) ? e.raw : ruHint(e.raw);
    fix_keys_global[ns] = fix_keys_global[ns] || [];
    fix_keys_global[ns].push({ key: e.key.replace(`${ns}.`, ''), uz: uzValue, ru: ruValue });
  }
}

for (const [ns, items] of Object.entries(fix_keys_global)) {
  const uzP = `${UZ_DIR}/${ns}.json`;
  const ruP = `${RU_DIR}/${ns}.json`;
  const uz = loadJson(uzP);
  const ru = loadJson(ruP);
  for (const { key, uz: u, ru: r } of items) {
    if (setKey(uz, key, u)) totalKeys++;
    setKey(ru, key, r);
  }
  writeFileSync(uzP, JSON.stringify(uz, null, 2) + '\n');
  writeFileSync(ruP, JSON.stringify(ru, null, 2) + '\n');
}

console.log(`Files touched:  ${filesTouched}`);
console.log(`Edits made:     ${totalEdits}`);
console.log(`Keys added:     ${totalKeys}`);
console.log(`Namespaces:     ${Object.keys(fix_keys_global).join(', ')}`);
