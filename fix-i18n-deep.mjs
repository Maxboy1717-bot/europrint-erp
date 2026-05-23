#!/usr/bin/env node
/**
 * fix-i18n-deep.mjs — Fix the issues found by audit-i18n-deep.mjs:
 *   1. Remove key===value broken entries (where key is human text with punct,
 *      and value is identical — broken codemod artifact)
 *   2. Translate hardcoded English words inside values (Lead→Lid, Deal→Bitim, etc.)
 *   3. For brand/tech terms (WhatsApp, EuroPrint, API) — leave as-is (acceptable).
 *
 * Strategy:
 *   - Read each locale JSON, mutate in-place where safe, write back.
 *   - Preserve JSON formatting (2-space indent).
 *   - Keep UZ/RU key parity (delete from both if removing).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const UZ_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/uz');
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');

// English → Uzbek/Russian translation mappings.
// Tech/brand terms are not in this map — they stay as-is.
const TRANS = {
  // Business nouns
  'Lead':       { uz: 'Lid',       ru: 'Лид' },
  'Leads':      { uz: 'Lidlar',    ru: 'Лиды' },
  'Deal':       { uz: 'Bitim',     ru: 'Сделка' },
  'Deals':      { uz: 'Bitimlar',  ru: 'Сделки' },
  'Pipeline':   { uz: 'Voronka',   ru: 'Воронка' },
  'Stage':      { uz: 'Bosqich',   ru: 'Этап' },
  'Quote':      { uz: 'Taklif',    ru: 'Предложение' },
  'Order':      { uz: 'Buyurtma',  ru: 'Заказ' },
  'Customer':   { uz: 'Mijoz',     ru: 'Клиент' },
  'Vendor':     { uz: 'Yetkazib beruvchi', ru: 'Поставщик' },
  'Account':    { uz: 'Hisob',     ru: 'Счёт' },
  'Invoice':    { uz: 'Hisob-faktura', ru: 'Счёт-фактура' },
  'Payment':    { uz: 'Toʻlov',    ru: 'Платёж' },
  'Receipt':    { uz: 'Kvitansiya',ru: 'Квитанция' },
  // UI verbs
  'Save':       { uz: 'Saqlash',   ru: 'Сохранить' },
  'Cancel':     { uz: 'Bekor qilish', ru: 'Отмена' },
  'Delete':     { uz: 'Oʻchirish', ru: 'Удалить' },
  'Edit':       { uz: 'Tahrirlash',ru: 'Редактировать' },
  'Add':        { uz: 'Qoʻshish',  ru: 'Добавить' },
  'Create':     { uz: 'Yaratish',  ru: 'Создать' },
  'Update':     { uz: 'Yangilash', ru: 'Обновить' },
  'Submit':     { uz: 'Yuborish',  ru: 'Отправить' },
  'Reset':      { uz: 'Tiklash',   ru: 'Сбросить' },
  'Close':      { uz: 'Yopish',    ru: 'Закрыть' },
  'Open':       { uz: 'Ochish',    ru: 'Открыть' },
  'Back':       { uz: 'Orqaga',    ru: 'Назад' },
  'Next':       { uz: 'Keyingi',   ru: 'Далее' },
  'Previous':   { uz: 'Oldingi',   ru: 'Предыдущий' },
  'Apply':      { uz: 'Qoʻllash',  ru: 'Применить' },
  // States
  'Status':     { uz: 'Holat',     ru: 'Статус' },
  'Loading':    { uz: 'Yuklanmoqda', ru: 'Загрузка' },
  'Error':      { uz: 'Xatolik',   ru: 'Ошибка' },
  'Success':    { uz: 'Muvaffaqiyat', ru: 'Успех' },
  'Warning':    { uz: 'Ogohlantirish', ru: 'Предупреждение' },
  'Info':       { uz: 'Maʼlumot',  ru: 'Инфо' },
  'Active':     { uz: 'Faol',      ru: 'Активный' },
  'Inactive':   { uz: 'Nofaol',    ru: 'Неактивный' },
  'Pending':    { uz: 'Kutilmoqda',ru: 'В ожидании' },
  'Approved':   { uz: 'Tasdiqlangan', ru: 'Одобрено' },
  'Rejected':   { uz: 'Rad etilgan',  ru: 'Отклонено' },
  // Filters/dashboard
  'Dashboard':  { uz: 'Boshqaruv paneli', ru: 'Панель управления' },
  'Settings':   { uz: 'Sozlamalar',ru: 'Настройки' },
  'Filter':     { uz: 'Filtr',     ru: 'Фильтр' },
  'Search':     { uz: 'Qidirish',  ru: 'Поиск' },
  // Numbers
  'Total':      { uz: 'Jami',      ru: 'Итого' },
  'Subtotal':   { uz: 'Oraliq jami', ru: 'Подытог' },
  'Discount':   { uz: 'Chegirma',  ru: 'Скидка' },
  'Tax':        { uz: 'Soliq',     ru: 'Налог' },
  'Amount':     { uz: 'Miqdor',    ru: 'Сумма' },
  'Price':      { uz: 'Narx',      ru: 'Цена' },
  'Quantity':   { uz: 'Miqdor',    ru: 'Количество' },
  // Time
  'Today':      { uz: 'Bugun',     ru: 'Сегодня' },
  'Yesterday':  { uz: 'Kecha',     ru: 'Вчера' },
  'Tomorrow':   { uz: 'Ertaga',    ru: 'Завтра' },
  'Week':       { uz: 'Hafta',     ru: 'Неделя' },
  'Month':      { uz: 'Oy',        ru: 'Месяц' },
  'Year':       { uz: 'Yil',       ru: 'Год' },
  // Misc
  'Yes':        { uz: 'Ha',        ru: 'Да' },
  'No':         { uz: 'Yoʻq',      ru: 'Нет' },
  'OK':         { uz: 'OK',        ru: 'OK' },
  'Confirm':    { uz: 'Tasdiqlash',ru: 'Подтвердить' },
  // Second-pass additions found by manual review (round 2)
  'History':    { uz: 'Tarix',     ru: 'История' },
  'Tracker':    { uz: 'Kuzatuvchi',ru: 'Трекер' },
  'Milestone':  { uz: 'Bosqich',   ru: 'Этап' },
  'Referral':   { uz: 'Tavsiya',   ru: 'Реферал' },
  'Router':     { uz: 'Yoʻnaltirgich', ru: 'Маршрутизатор' },
  'Desc':       { uz: 'Tavsif',    ru: 'Описание' },
  'Description':{ uz: 'Tavsif',    ru: 'Описание' },
  'Super':      { uz: 'Asosiy',    ru: 'Главный' },
  'Login':      { uz: 'Kirish',    ru: 'Вход' },
  'Logout':     { uz: 'Chiqish',   ru: 'Выход' },
  'Notification': { uz: 'Bildirishnoma', ru: 'Уведомление' },
  'Notifications': { uz: 'Bildirishnomalar', ru: 'Уведомления' },
  'Report':     { uz: 'Hisobot',   ru: 'Отчёт' },
  'Reports':    { uz: 'Hisobotlar',ru: 'Отчёты' },
  'Summary':    { uz: 'Xulosa',    ru: 'Сводка' },
  'Detail':     { uz: 'Tafsilot',  ru: 'Деталь' },
  'Details':    { uz: 'Tafsilotlar', ru: 'Детали' },
  'List':       { uz: 'Roʻyxat',   ru: 'Список' },
  'View':       { uz: 'Koʻrish',   ru: 'Просмотр' },
  'New':        { uz: 'Yangi',     ru: 'Новый' },
  'All':        { uz: 'Barcha',    ru: 'Все' },
  'My':         { uz: 'Mening',    ru: 'Мои' },
  'Add':        { uz: 'Qoʻshish',  ru: 'Добавить' },
  'Print':      { uz: 'Chop etish',ru: 'Печать' },
  'Send':       { uz: 'Yuborish',  ru: 'Отправить' },
  'Receive':    { uz: 'Qabul qilish', ru: 'Получить' },
  'Done':       { uz: 'Bajarildi', ru: 'Готово' },
  'Failed':     { uz: 'Muvaffaqiyatsiz', ru: 'Не удалось' },
  'Completed':  { uz: 'Tugatilgan',ru: 'Завершено' },
  'Cancelled':  { uz: 'Bekor qilingan', ru: 'Отменено' },
  'Draft':      { uz: 'Qoralama',  ru: 'Черновик' },
  'Published':  { uz: 'Eʼlon qilingan', ru: 'Опубликовано' },
  'Archived':   { uz: 'Arxivlangan', ru: 'Архивировано' },
};

const EN_RE = new RegExp(`\\b(${Object.keys(TRANS).join('|')})\\b`, 'g');

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[full] = v;
    else if (typeof v === 'object' && v !== null) flatten(v, full, out);
  }
  return out;
}

function setDeep(obj, dotKey, val) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== 'object') {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}

function delDeep(obj, dotKey) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) return;
    cur = cur[parts[i]];
  }
  delete cur[parts[parts.length - 1]];
}

function loadFile(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function saveFile(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

let stats = {
  removedKeyEqValue: 0,
  translatedEnglish: 0,
  preservedBrand: 0,
};

// Brand/tech keep-as-is patterns (case-sensitive). If the ENTIRE value matches
// one of these, leave it alone. Otherwise, English words inside get translated.
const BRAND_PATTERNS = [
  /^(API|ID|HTTP|HTTPS|URL|CSV|JSON|XML|PDF|HTML|CSS|JS|TS|SQL|REST|GraphQL)$/,
  /^(EuroPrint|WhatsApp|Telegram|Gmail|Outlook|Slack|Notion|Stripe|PayPal)/,
  /^(Gemini|GPT|Claude|OpenAI|Anthropic|Google|Microsoft|Meta|Apple)/,
  /^(EuroPrint ERP|EuroPrint AI|EuroPrint POS)/,
];

function isBrand(value) {
  for (const re of BRAND_PATTERNS) if (re.test(value)) return true;
  return false;
}

for (const ns of fs.readdirSync(UZ_DIR)) {
  if (!ns.endsWith('.json')) continue;
  const nsName = ns.replace(/\.json$/, '');
  const uzPath = path.join(UZ_DIR, ns);
  const ruPath = path.join(RU_DIR, ns);
  if (!fs.existsSync(ruPath)) continue;

  const uz = loadFile(uzPath);
  const ru = loadFile(ruPath);
  const uzFlat = flatten(uz);
  const ruFlat = flatten(ru);

  // 1. Remove key===value broken entries (where key looks like human text,
  //    not a camelCase code identifier)
  for (const [key, val] of Object.entries(uzFlat)) {
    const keyLooksLikeText = /[\s\.\?\!,'’]/.test(key) && !/^[a-z][a-zA-Z0-9_]*$/.test(key.split('.').pop() || '');
    const keyEqValue = key === val || key.toLowerCase() === String(val).toLowerCase();
    if (keyEqValue && keyLooksLikeText && !isBrand(val)) {
      delDeep(uz, key);
      delDeep(ru, key);
      stats.removedKeyEqValue++;
    }
  }

  // 2. Translate English words inside values
  function translateValue(val, lang) {
    if (typeof val !== 'string') return val;
    if (isBrand(val)) {
      return val;  // keep brand names
    }
    return val.replace(EN_RE, (m) => TRANS[m]?.[lang] ?? m);
  }
  function walk(obj, lang) {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        const newV = translateValue(v, lang);
        if (newV !== v) {
          obj[k] = newV;
          stats.translatedEnglish++;
        }
      } else if (typeof v === 'object' && v !== null) {
        walk(v, lang);
      }
    }
  }
  walk(uz, 'uz');
  walk(ru, 'ru');

  saveFile(uzPath, uz);
  saveFile(ruPath, ru);
}

console.log('━━ FIX I18N DEEP ━━');
console.log(`Removed broken key===value entries: ${stats.removedKeyEqValue}`);
console.log(`Translated English words in values: ${stats.translatedEnglish}`);
console.log(`(Brand names preserved by pattern)`);
