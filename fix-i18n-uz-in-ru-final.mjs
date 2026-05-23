#!/usr/bin/env node
/**
 * fix-i18n-uz-in-ru-final.mjs — Final cleanup pass for the last ~26 stuck entries.
 * Uses exact-string replacement only (no dictionary).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');

// Exact replacements — { ns: { value: replacement } }
const REPLACEMENTS = {
  common: {
    // False positives (already correct) — leave as-is by mapping to self.
    // The audit heuristic flags them but they ARE proper.
    'Gemini Vision': 'Gemini Vision',
    'GPT-4o + Gemini 2.5 Flash с профессиональный дизайны создайте':
      'Создайте профессиональные дизайны с GPT-4o + Gemini 2.5 Flash',
    'Материалы и продукты для разрешено OG\'работы':
      'Разрешённые работы для материалов и продуктов',
    'Транзакция цель или sharh...':
      'Цель транзакции или комментарий...',
    'Важно OG\'работа':
      'Важное отклонение',
    'OG\'работа процент:':
      'Процент отклонения:',
    'Производ chiq.: 3.45 час':
      'Производство: 3.45 ч',
    'Yo\'оставшийся или повреждённый оборудование для зарплата скидка в очередь добавляется.':
      'Для утерянного или повреждённого оборудования автоматически добавляется удержание из зарплаты в очередь.',
    'Sharh добавить':
      'Добавить комментарий',
    'Sharh текст':
      'Текст комментария',
    '— Gemini AI функции для':
      '— для функций Gemini AI',
    'Производ chiq.':
      'Произв-во',
    'Упаковка — распределение по коробкам, yig\'работа, этикетка правильно':
      'Упаковка — распределение по коробкам, сборка, этикетка корректны',
    'Всего qog\'мало расход:':
      'Всего расход бумаги:',
    'Камера AI от buzilishlar при обнаружении это здесь отображается':
      'Когда камера с AI обнаруживает нарушения, они отображаются здесь',
    'GPT-4o Mini':
      'GPT-4o Mini',
    'Панель статистику загружая bo\'lmadi.':
      'Не удалось загрузить статистику панели.',
    'Склады bazada Ещё seed не выполнено — статический шаблон с работает. Миграция когда применится, реальный данные подтянется.':
      'Склады ещё не засеяны в базе — работает со статическим шаблоном. После применения миграции подтянутся реальные данные.',
    'QC tekshiruviga нуждается материалы QC-HOLD на склад проводится.':
      'Материалы, требующие QC-проверки, переводятся на склад QC-HOLD.',
    'Поиск: документ, шт\'minotchi, договор, код...':
      'Поиск: документ, поставщик, договор, код...',
    'Шт\'minotchiga вернуть документ создаётся':
      'Создаётся документ возврата поставщику',
    'Ключ подписи HMAC SHA-256':
      'Ключ подписи HMAC SHA-256',
    'Какие программы должен знать? (Excel, 1C, Photoshop, Python...)':
      'Какие программы должен знать? (Excel, 1C, Photoshop, Python...)',
    'Например: Excel (VLOOKUP), 1C, Английский (B2), Photoshop...':
      'Например: Excel (VLOOKUP), 1C, Английский (B2), Photoshop...',
  },
  production: {
    'Переналадка (Changeover)': 'Переналадка',
  },
  settings: {
    'GPT-4o Mini': 'GPT-4o Mini',
  },
};

function walk(obj, fixes) {
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      if (fixes[v] !== undefined) {
        obj[k] = fixes[v];
        count++;
      }
    } else if (typeof v === 'object' && v !== null) {
      count += walk(v, fixes);
    }
  }
  return count;
}

let total = 0;
for (const [ns, fixes] of Object.entries(REPLACEMENTS)) {
  const fpath = path.join(RU_DIR, `${ns}.json`);
  if (!fs.existsSync(fpath)) continue;
  const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  const count = walk(data, fixes);
  fs.writeFileSync(fpath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  [${ns}] fixed ${count}`);
  total += count;
}
console.log(`\nTotal exact replacements: ${total}`);
