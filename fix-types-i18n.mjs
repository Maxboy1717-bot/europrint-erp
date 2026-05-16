#!/usr/bin/env node
/**
 * fix-types-i18n.mjs — convert hardcoded `<field>: "<UzText>"` patterns inside
 * source files into `<field>: tLabel('ns.key', "<UzText>")` calls.
 *
 * Improved over v1: applies edits via *absolute* source positions in a
 * single pass right-to-left, so multiple matches on the same line cannot
 * corrupt each other.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const LEAK_REPORT = 'docs/i18n-leakage-baseline.json';
const UZ_DIR = 'artifacts/erp-dashboard/src/locales/uz';
const RU_DIR = 'artifacts/erp-dashboard/src/locales/ru';

const FIELDS = ['label', 'name', 'title', 'description', 'placeholder', 'tooltip'];

function nsFor(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  const m = norm.match(/src\/pages\/([^/]+)\//);
  if (m) {
    const known = new Set([
      'crm', 'sales', 'sd', 'kanban', 'adaptation', 'finance', 'hr',
      'warehouse', 'wms', 'production', 'qc', 'iot', 'mes', 'mm',
      'marketing', 'lms', 'pos', 'security', 'admin', 'design',
      'analytics', 'accountant', 'director', 'integration', 'planning',
    ]);
    if (known.has(m[1])) return m[1];
  }
  if (/Tech|Production|Routing/i.test(filePath)) return 'production';
  if (/Warehouse|Wms/i.test(filePath)) return 'warehouse';
  if (/Hr/i.test(filePath)) return 'hr';
  return 'common';
}

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

// Russian hint table (limited but useful)
const RU_HINTS = new Map(Object.entries({
  'yangi': 'Новый', 'bekor': 'Отмена', 'bekor qilingan': 'Отменено',
  'bekor qilindi': 'Отменено', 'faol': 'Активный', 'nofaol': 'Неактивный',
  'tasdiqlangan': 'Подтверждено', 'tasdiqlanmagan': 'Не подтверждено',
  'yakunlangan': 'Завершено', 'bajarilmoqda': 'Выполняется',
  'kutilmoqda': 'Ожидает', 'ochiq': 'Открыто', 'yopilgan': 'Закрыто',
  'rad etilgan': 'Отклонено', 'rad etildi': 'Отклонено',
  'yuborildi': 'Отправлено', 'qabul qilindi': 'Принято',
  'ko\'rildi': 'Просмотрено', 'to\'landi': 'Оплачено',
  'qisman to\'landi': 'Частично оплачено',
  'lidlar': 'Лиды', 'bitimlar': 'Сделки', 'kontaktlar': 'Контакты',
  'kompaniyalar': 'Компании', 'takliflar': 'Предложения',
  'fakturalar': 'Счета', 'robotlar': 'Роботы',
  'mijozlar': 'Клиенты', 'mahsulotlar': 'Продукты',
  'buyurtmalar': 'Заказы', 'xodimlar': 'Сотрудники',
  'shartnomalar': 'Договоры', 'hujjatlar': 'Документы',
  'hisobotlar': 'Отчёты', 'sozlamalar': 'Настройки',
  'omborlar': 'Склады', 'smenalar': 'Смены',
  'ishda': 'В работе', 'yetkazish': 'Доставка',
  'yetkazish kutilmoqda': 'Ожидание доставки',
  'to\'lov kutilmoqda': 'Ожидание оплаты',
  'ishlov berilmagan': 'Не обработано', 'tahlil qilish': 'Анализ',
  'yakunlash': 'Завершение', 'konvertatsiya': 'Конвертация',
  'yutildi': 'Выиграно', 'yo\'qotildi': 'Проиграно',
  'saqlash': 'Сохранить', 'tahrirlash': 'Редактировать',
  'o\'chirish': 'Удалить', 'qo\'shish': 'Добавить',
  'yangilash': 'Обновить', 'yaratish': 'Создать',
  'yuklash': 'Загрузить', 'yuklab olish': 'Скачать',
  'qidirish': 'Поиск', 'filtrlash': 'Фильтр',
  'yopish': 'Закрыть', 'orqaga': 'Назад', 'keyingi': 'Следующий',
  'oldingi': 'Предыдущий', 'yuborish': 'Отправить',
  'tasdiqlash': 'Подтвердить', 'qaytarish': 'Вернуть',
  'tanlash': 'Выбрать', 'chop': 'Печать',
  'tugatish': 'Завершить', 'boshlash': 'Начать',
}));

function ruHint(uz) {
  const low = uz.toLowerCase().trim();
  if (RU_HINTS.has(low)) return RU_HINTS.get(low);
  // Word-by-word translation for compound phrases
  const words = low.split(/\s+/);
  const translated = words.map(w => RU_HINTS.get(w) ?? null);
  if (translated.every(Boolean)) return translated.join(' ');
  return uz;
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

function hasField(obj, path) {
  const parts = path.split('.');
  let o = obj;
  for (const p of parts) {
    if (!o || typeof o !== 'object' || !(p in o)) return false;
    o = o[p];
  }
  return true;
}

const baseline = JSON.parse(readFileSync(LEAK_REPORT, 'utf-8'));
const byFile = {};
for (const l of baseline.leaks) {
  if (l.kind !== 'OBJECT_LABEL') continue;
  if (l.locale !== 'uz') continue;
  byFile[l.file] = byFile[l.file] || [];
  byFile[l.file].push(l);
}

let filesTouched = 0;
let totalEdits = 0;
let totalKeys = 0;
const localeChanges = new Set();
const fix_keys_global = {}; // { ns: [{ key, uz, ru }] }

for (const [filePath, leaks] of Object.entries(byFile)) {
  const ns = nsFor(filePath);
  const fileBase = basename(filePath, '.ts').replace(/Types$|\.types$/i, '');
  const src = readFileSync(filePath, 'utf-8');

  // Find absolute positions of ALL `<field>: "<text>"` matches in the file,
  // matching every text we want to translate.
  const fieldRegex = new RegExp(
    `\\b(${FIELDS.join('|')})(\\s*:\\s*)(["'])([^"'\\n\\r]{2,})\\3`,
    'g',
  );
  const targetTexts = new Set(leaks.map(l => l.text));
  const edits = [];
  let m;
  while ((m = fieldRegex.exec(src))) {
    const field = m[1];
    const between = m[2];
    const quote = m[3];
    const text = m[4];
    if (!targetTexts.has(text)) continue;
    if (text.includes(`${quote}`)) continue; // safety
    // Skip if already wrapped in tLabel
    const beforeStart = Math.max(0, m.index - 10);
    const before = src.slice(beforeStart, m.index);
    if (before.includes('tLabel(')) continue;
    const keySlug = slug(text);
    const fullKey = `${ns}.${fileBase}.${keySlug}`;
    const ruValue = ruHint(text);
    edits.push({
      start: m.index,
      end: m.index + m[0].length,
      replacement: `${field}${between}tLabel('${fullKey}', ${quote}${text}${quote})`,
      key: fullKey,
      uz: text,
      ru: ruValue,
    });
  }

  if (edits.length === 0) continue;

  // Apply edits right-to-left (so offsets stay valid)
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }

  // Add import (top of file, after last import)
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
  totalEdits += edits.length;

  // Stash keys for JSON write
  for (const e of edits) {
    const uzP = `${UZ_DIR}/${ns}.json`;
    const ruP = `${RU_DIR}/${ns}.json`;
    localeChanges.add(uzP); localeChanges.add(ruP);
    fix_keys_global[ns] = fix_keys_global[ns] || [];
    fix_keys_global[ns].push({ key: e.key.replace(`${ns}.`, ''), uz: e.uz, ru: e.ru });
  }
}

// JSON writing
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
