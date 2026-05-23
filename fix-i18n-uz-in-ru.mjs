#!/usr/bin/env node
/**
 * fix-i18n-uz-in-ru.mjs — Replace Uzbek text in ru/*.json with proper Russian.
 */
import fs from 'node:fs';
import path from 'node:path';

const RU_DIR = path.join(process.cwd(), 'artifacts/erp-dashboard/src/locales/ru');

// Explicit translations for the 31 detected entries
const FIXES = {
  // common.json
  'Inter Regular': 'Inter Regular',  // font name, keep
  'AI Predictive Engine': 'AI Predictive Engine',  // product name, keep
  '@europrint_check_bot': '@europrint_check_bot',  // bot handle, keep
  'HR Capital 7-bosqich metodologiyasi · Vakansiya muddatiga asoslangan':
    'Методология HR Capital 7 этапов · На основе срока вакансии',
  '5. Vaqtida kelish (kech qolmaslik)':
    '5. Своевременный приход (без опозданий)',
  '3. Intizom (qoidalarga rioya qilish)':
    '3. Дисциплина (соблюдение правил)',
  'Kechikish (daqiqa)': 'Опоздание (минут)',
  '— sababni tanlang (ixtiyoriy)': '— выберите причину (опционально)',
  'Kimga (masalan: user@example.com)': 'Кому (например: user@example.com)',
  'SMS matni...': 'Текст SMS...',
  'Rahbar va asosiy maosh': 'Руководитель и основная зарплата',
  'Sifatni boshqarish tizimi hujjatlari (ISO 9001:2015)':
    'Документы системы менеджмента качества (ISO 9001:2015)',
  'Muddat (kunlarda)': 'Срок (в днях)',
  'Sifat Dinamikasi (Oxirgi 7 kun)': 'Динамика качества (последние 7 дней)',
  'Ishlab chiq. (dona) *': 'Производство (шт) *',
  'Ish beruvchi pensiya (12%):': 'Пенсия работодателя (12%):',
  '30 kun chiqim': 'Расход за 30 дней',
  '60 kun ichida tugaydi': 'Заканчивается через 60 дней',
  '30 kun ichida tugaydi': 'Заканчивается через 30 дней',
  // design.json
  'Photoshop': 'Photoshop',  // brand
  // finance.json + hr.json
  'Tanlang (ixtiyoriy)': 'Выберите (опционально)',
  'Darajani tanlang (ixtiyoriy)': 'Выберите уровень (опционально)',
  'Asosiy maosh': 'Основная зарплата',
  'Bevosita rahbar': 'Непосредственный руководитель',
  'Topilmadi': 'Не найдено',
  'Rahbarni tozalash': 'Очистить руководителя',
  'Qidiruvni tozalash': 'Очистить поиск',
  'Maosh tarixi': 'История зарплаты',
  'Maxfiy': 'Конфиденциально',
  'Kasalxonada': 'В больнице',
  'Europrint': 'EuroPrint',  // brand, just normalize
};

let count = 0;

function walk(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      if (FIXES[v] !== undefined) {
        obj[k] = FIXES[v];
        count++;
      }
    } else if (typeof v === 'object' && v !== null) {
      walk(v);
    }
  }
}

for (const fname of fs.readdirSync(RU_DIR)) {
  if (!fname.endsWith('.json')) continue;
  const p = path.join(RU_DIR, fname);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  walk(data);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

console.log(`Translated ${count} Uzbek-in-RU entries to Russian.`);
