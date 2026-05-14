#!/usr/bin/env node
/**
 * Auto-replace hardcoded English text in TSX files with t() calls.
 * Adds missing keys to locale JSONs.
 *
 * Strategy:
 *  A) File uses useTranslation('ns') → use that ns, replace strings, add missing keys
 *  B) pos-monitor file uses usePosI18n → use pos-monitor locale
 *  C) File has no i18n hook → add useTranslation('common') import + hook
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SRC = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src');
const LOCALES = path.resolve(SRC, 'locales');
const POS_I18N = path.resolve(SRC, 'pos-monitor', 'i18n');
const AUDIT = path.resolve(ROOT, 'scripts', 'i18n-full-audit.json');

// ERP UZ→RU dictionary (extended)
const dict = new Map(Object.entries({
  // Status / state
  'Status': ['Holat', 'Статус'],
  'Active': ['Faol', 'Активный'],
  'Inactive': ['Nofaol', 'Неактивный'],
  'Pending': ['Kutilmoqda', 'Ожидает'],
  'Approved': ['Tasdiqlangan', 'Одобрено'],
  'Rejected': ['Rad etilgan', 'Отклонено'],
  'Completed': ['Tugatilgan', 'Завершено'],
  'Draft': ['Qoralama', 'Черновик'],
  'Done': ['Bajarildi', 'Готово'],
  'Open': ['Ochiq', 'Открыто'],
  'Closed': ['Yopilgan', 'Закрыто'],
  'Cancelled': ['Bekor qilingan', 'Отменено'],
  'Online': ['Onlayn', 'Онлайн'],
  'Offline': ['Oflayn', 'Оффлайн'],
  'Loading': ['Yuklanmoqda', 'Загрузка'],

  // Actions
  'Save': ['Saqlash', 'Сохранить'],
  'Cancel': ['Bekor qilish', 'Отмена'],
  'Delete': ["O'chirish", 'Удалить'],
  'Edit': ['Tahrirlash', 'Редактировать'],
  'Add': ["Qo'shish", 'Добавить'],
  'Create': ['Yaratish', 'Создать'],
  'Remove': ["O'chirish", 'Удалить'],
  'Update': ['Yangilash', 'Обновить'],
  'Refresh': ['Yangilash', 'Обновить'],
  'Reset': ['Tiklash', 'Сбросить'],
  'Submit': ['Yuborish', 'Отправить'],
  'Confirm': ['Tasdiqlash', 'Подтвердить'],
  'Reject': ['Rad etish', 'Отклонить'],
  'Approve': ['Tasdiqlash', 'Одобрить'],
  'Login': ['Kirish', 'Вход'],
  'Logout': ['Chiqish', 'Выход'],
  'Search': ['Qidirish', 'Поиск'],
  'Filter': ['Filtr', 'Фильтр'],
  'Sort': ['Saralash', 'Сортировка'],
  'Export': ['Eksport', 'Экспорт'],
  'Import': ['Import', 'Импорт'],
  'Print': ['Chop etish', 'Печать'],
  'Close': ['Yopish', 'Закрыть'],
  'Open': ['Ochish', 'Открыть'],
  'Next': ['Keyingisi', 'Далее'],
  'Previous': ['Oldingi', 'Назад'],
  'Back': ['Orqaga', 'Назад'],
  'Continue': ['Davom etish', 'Продолжить'],
  'View': ["Ko'rish", 'Просмотр'],
  'Preview': ['Oldindan ko\'rish', 'Предпросмотр'],
  'Download': ['Yuklab olish', 'Скачать'],
  'Upload': ['Yuklash', 'Загрузить'],
  'Send': ['Yuborish', 'Отправить'],
  'Show': ["Ko'rsatish", 'Показать'],
  'Hide': ['Yashirish', 'Скрыть'],
  'Apply': ['Qo\'llash', 'Применить'],
  'Manage': ['Boshqarish', 'Управлять'],
  'Manage Budgets': ['Byudjetlarni boshqarish', 'Управление бюджетами'],

  // Fields / labels
  'Email': ['Email', 'Email'],
  'Password': ['Parol', 'Пароль'],
  'Username': ['Foydalanuvchi nomi', 'Имя пользователя'],
  'Name': ['Nomi', 'Название'],
  'Title': ['Sarlavha', 'Заголовок'],
  'Description': ['Tavsif', 'Описание'],
  'Type': ['Turi', 'Тип'],
  'Date': ['Sana', 'Дата'],
  'Time': ['Vaqt', 'Время'],
  'Total': ['Jami', 'Всего'],
  'Amount': ['Miqdor', 'Сумма'],
  'Quantity': ['Miqdor', 'Количество'],
  'Price': ['Narx', 'Цена'],
  'Notes': ['Izohlar', 'Заметки'],
  'Note': ['Izoh', 'Заметка'],
  'Address': ['Manzil', 'Адрес'],
  'Phone': ['Telefon', 'Телефон'],
  'Country': ['Davlat', 'Страна'],
  'City': ['Shahar', 'Город'],
  'Doc No': ['Hujjat raqami', 'Номер документа'],

  // ERP terms
  'Material': ['Material', 'Материал'],
  'Materials': ['Materiallar', 'Материалы'],
  'Material ID': ['Material ID', 'ID материала'],
  'Material ID:': ['Material ID:', 'ID материала:'],
  'Material *': ['Material *', 'Материал *'],
  'Dashboard': ['Boshqaruv paneli', 'Панель управления'],
  'HR Dashboard': ['HR boshqaruv paneli', 'HR панель управления'],
  'Marketing': ['Marketing', 'Маркетинг'],
  'Sales': ['Sotuv', 'Продажи'],
  'Production': ['Ishlab chiqarish', 'Производство'],
  'Trend': ['Tendensiya', 'Тренд'],
  'Operator': ['Operator', 'Оператор'],
  'Manager': ['Menejer', 'Менеджер'],
  'Designer': ['Dizayner', 'Дизайнер'],
  'Admin': ['Administrator', 'Администратор'],
  'Customer': ['Mijoz', 'Клиент'],
  'Supplier': ['Yetkazib beruvchi', 'Поставщик'],
  'Order': ['Buyurtma', 'Заказ'],
  'Invoice': ['Faktura', 'Счёт'],
  'Payment': ["To'lov", 'Оплата'],
  'Report': ['Hisobot', 'Отчёт'],
  'Reports': ['Hisobotlar', 'Отчёты'],
  'Profile': ['Profil', 'Профиль'],
  'Settings': ['Sozlamalar', 'Настройки'],
  'Theme': ['Mavzu', 'Тема'],
  'Account': ['Hisob', 'Учётная запись'],
  'Analytics': ['Analitika', 'Аналитика'],
  'Overview': ['Umumiy ko\'rinish', 'Обзор'],
  'Progress': ['Bajarilish', 'Прогресс'],
  'Quality': ['Sifat', 'Качество'],
  'KPI': ['KPI', 'KPI'],
  'ROI': ['ROI', 'ROI'],
  'AI': ['AI', 'AI'],
  'IQ Test': ['IQ test', 'IQ тест'],
  'TOOL TEST': ['Asbob testi', 'Тест инструмента'],
  'Test': ['Test', 'Тест'],
  'Sub Navigation': ['Pastki navigatsiya', 'Подменю'],
  'Status Pills': ['Holat yorliqlari', 'Метки статуса'],
  'Approval Matrix': ['Tasdiqlash matritsasi', 'Матрица согласования'],
  'Multi-currency': ['Ko\'p valyutali', 'Мультивалютность'],
  'Order Costing': ['Buyurtma tannarxi', 'Себестоимость заказа'],
  'Financial Reports': ['Moliyaviy hisobotlar', 'Финансовые отчёты'],
  'Reservation Panel': ['Bron paneli', 'Панель резервирования'],
  'AI Marketing Assistant': ['AI Marketing yordamchi', 'AI Маркетинг помощник'],
  'AI Supervisor Dashboard': ['AI nazoratchi paneli', 'Панель AI супервизора'],
  'Marketing Funnel': ['Marketing voronkasi', 'Маркетинговая воронка'],
  'Access Token': ['Kirish tokeni', 'Токен доступа'],
  'Product Profitability Analysis': ['Mahsulot rentabelligi tahlili', 'Анализ рентабельности продуктов'],
  'Resume matni': ['Rezyume matni', 'Текст резюме'],
  'Order-to-Cash Workflow': ['Buyurtmadan to\'lovga workflow', 'Workflow от заказа к оплате'],
  'Sidebar': ['Yon panel', 'Боковая панель'],
  'Toggle Sidebar': ['Yon panelni ochib-yopish', 'Переключить боковую панель'],
  'Next slide': ['Keyingi slayd', 'Следующий слайд'],
  'Previous slide': ['Oldingi slayd', 'Предыдущий слайд'],
  'Go to next page': ['Keyingi sahifaga o\'tish', 'На следующую страницу'],
  'Go to previous page': ['Oldingi sahifaga o\'tish', 'На предыдущую страницу'],
  'real-time': ['real-vaqt', 'реальное время'],
  'print': ['Chop etish', 'Печать'],
  'list': ['ro\'yxat', 'список'],
  'training': ['o\'qitish', 'обучение'],
  'machine': ['mashina', 'машина'],
  'Cross-training': ['O\'zaro o\'qitish', 'Кросс-обучение'],
  'Succession planning': ['Vorislikni rejalashtirish', 'Планирование преемственности'],
  'Filter:': ['Filtr:', 'Фильтр:'],
  'Grid:': ['To\'r:', 'Сетка:'],
  'Target: 4x': ['Maqsad: 4x', 'Цель: 4x'],
  'CSV Export': ['CSV eksport', 'CSV экспорт'],
  'Excel Export': ['Excel eksport', 'Excel экспорт'],
  'CREATE': ['YARATISH', 'СОЗДАТЬ'],
  'UPDATE': ['YANGILASH', 'ОБНОВИТЬ'],
  'DELETE': ["O'CHIRISH", 'УДАЛИТЬ'],
  'TASK + SOLUTION': ['VAZIFA + YECHIM', 'ЗАДАЧА + РЕШЕНИЕ'],
  'PRIORITY:': ['MUHIMLIK:', 'ПРИОРИТЕТ:'],
  'OK': ['OK', 'OK'],
  'Status:': ['Holat:', 'Статус:'],
  'Status Tarixi': ['Holat tarixi', 'История статуса'],
  'Status turlari:': ['Holat turlari:', 'Типы статусов:'],
  'Status: APPROVED → COMPLETED': ['Holat: TASDIQLANGAN → BAJARILDI', 'Статус: ОДОБРЕНО → ВЫПОЛНЕНО'],
  'Status: REJECTED': ['Holat: RAD ETILGAN', 'Статус: ОТКЛОНЕНО'],
  'Approved → pending_tech trigger': ['Tasdiqlangan → pending_tech qo\'zg\'ovchi', 'Одобрено → триггер pending_tech'],
  '• Problem description': ['• Muammo tavsifi', '• Описание проблемы'],
  'Order → Invoice → Payment → ...': ['Buyurtma → Faktura → To\'lov → ...', 'Заказ → Счёт → Оплата → ...'],
  '3. Status Pills': ['3. Holat yorliqlari', '3. Метки статуса'],
  '6. Card with Header': ['6. Sarlavhali karta', '6. Карта с заголовком'],
  '10. Sub Navigation': ['10. Pastki navigatsiya', '10. Подменю'],
  'Panel': ['Panel', 'Панель'],
  'Frequency': ['Chastota', 'Частота'],
  'Risk': ['Xavf', 'Риск'],
  'Audit': ['Audit', 'Аудит'],
  'Audit Log': ['Audit jurnali', 'Журнал аудита'],
  'Open': ['Ochiq', 'Открыто'],
  'Video': ['Video', 'Видео'],
  'Milestone': ['Bosqich', 'Этап'],
  'Question in English': ['Inglizcha savol', 'Вопрос на английском'],
  'A/B Test natijalari': ['A/B Test natijalari', 'Результаты A/B-теста'],
  'Resume': ['Rezyume', 'Резюме'],
  'Build': ['Build', 'Build'],
  'Reservation': ['Bron', 'Резерв'],
  'Tour Test': ['Tur testi', 'Тур-тест'],
  'Deal': ['Bitim', 'Сделка'],
  'Website': ['Veb-sayt', 'Веб-сайт'],
  'Telegram Admin': ['Telegram admin', 'Telegram админ'],
  'Login': ['Kirish', 'Вход'],
  'Test ID': ['Test ID', 'ID теста'],
  'Test nomi': ['Test nomi', 'Название теста'],
  'Test turi *': ['Test turi *', 'Тип теста *'],
  'Test sanasi': ['Test sanasi', 'Дата теста'],
  'Test kategoriyalari:': ['Test kategoriyalari:', 'Категории тестов:'],
  'Test Sifati': ['Test sifati', 'Качество тестов'],
  'Test natijalari': ['Test natijalari', 'Результаты тестов'],
  'Test topilmadi': ['Test topilmadi', 'Тест не найден'],
  'Test Yaratish': ['Test yaratish', 'Создать тест'],
  'Test Boshqaruvi': ['Test boshqaruvi', 'Управление тестами'],
  'Test Jurnali': ['Test jurnali', 'Журнал тестов'],
  'Test Savollari': ['Test savollari', 'Вопросы теста'],
  'Test Urinishlari': ['Test urinishlari', 'Попытки теста'],
  '📊 Test Natijalari': ['📊 Test natijalari', '📊 Результаты тестов'],
  'Bu test haqida:': ['Bu test haqida:', 'Об этом тесте:'],
  'Test yuklanmoqda...': ['Test yuklanmoqda...', 'Загрузка теста...'],
  'QC Test ID *': ['QC test ID *', 'ID QC теста *'],
  'Chek-list:': ['Tekshirish ro\'yxati:', 'Чек-лист:'],
  'Resume matni': ['Rezyume matni', 'Текст резюме'],
  'Mas\'ul operator': ['Mas\'ul operator', 'Ответственный оператор'],
  'Operator ID': ['Operator ID', 'ID оператора'],
  'Operator qarzlari': ['Operator qarzlari', 'Долги оператора'],
  'Operator foydalanish': ['Operator foydalanish', 'Использование оператора'],
  'Operator reytingi': ['Operator reytingi', 'Рейтинг оператора'],
  'Operator xatosi': ['Operator xatosi', 'Ошибка оператора'],
  'Operator ismi': ['Operator ismi', 'Имя оператора'],
  'Kiruvchi operator': ['Kiruvchi operator', 'Входящий оператор'],
  '12 oylik trend': ['12 oylik tendensiya', '12-месячный тренд'],
  'LTV (24 oy forecast)': ['LTV (24 oy prognozi)', 'LTV (прогноз 24 мес)'],
  'BOM/Routing': ['BOM/Marshrutlash', 'BOM/Маршрутизация'],
  'Sifat (Quality)': ['Sifat', 'Качество'],
  'Oylik Trend': ['Oylik tendensiya', 'Месячный тренд'],
  'Progress (60% maqsad)': ['Bajarilish (60% maqsad)', 'Прогресс (60% цель)'],
  'Progress Yangilash': ['Bajarilishni yangilash', 'Обновить прогресс'],
  'Progress (%)': ['Bajarilish (%)', 'Прогресс (%)'],
  'Progress qilmoqda': ['Davom etmoqda', 'В процессе'],
  'Umumiy progress': ['Umumiy bajarilish', 'Общий прогресс'],
  'Statistika va trend': ['Statistika va tendensiya', 'Статистика и тренд'],
  'Admin only': ['Faqat administrator', 'Только администратор'],
  'Export Hisobotlar': ['Hisobotlarni eksport', 'Экспорт отчётов'],
  'HR/Admin tanlang': ['HR/Administrator tanlang', 'Выберите HR/Администратор'],
  'Theme': ['Mavzu', 'Тема'],
  'Upload xatosi': ['Yuklash xatosi', 'Ошибка загрузки'],
  'Task sarlavhasi...': ['Vazifa sarlavhasi...', 'Заголовок задачи...'],
  'Task yaratish': ['Vazifa yaratish', 'Создать задачу'],
  'IMZOLAGAN (User ID)': ['IMZOLAGAN (Foydalanuvchi ID)', 'ПОДПИСАЛ (ID пользователя)'],
  'Number(i.quantity)': ['Number(i.quantity)', 'Number(i.quantity)'],
  'Number(s.quantity ?? 0)': ['Number(s.quantity ?? 0)', 'Number(s.quantity ?? 0)'],
  'm.quantity': ['m.quantity', 'm.quantity'],
}));

// Generate fallback translation for an unknown text
function fallbackTranslate(text) {
  // Strip and clean
  const v = text.trim();
  if (dict.has(v)) return dict.get(v);
  // Just keep as-is (probably already non-English or mixed)
  return [v, v];
}

function valueToKey(text) {
  // camelCase short key
  const clean = text.trim()
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  if (clean.length === 0) return 'key' + Date.now();
  const camelCase = clean[0].toLowerCase() + clean.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  return camelCase.replace(/^[0-9]/, 'k$&');
}

// Load locale JSONs
function loadJson(p) {
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

// Flatten for value→key reverse lookup
function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

// Pre-build value→key index for each namespace
const uzNsValueIndex = {};
const ruNsValueIndex = {};
for (const f of fs.readdirSync(path.join(LOCALES, 'uz'))) {
  if (!f.endsWith('.json')) continue;
  const ns = f.replace('.json', '');
  const uzObj = loadJson(path.join(LOCALES, 'uz', f));
  const ruObj = loadJson(path.join(LOCALES, 'ru', f));
  uzNsValueIndex[ns] = flatten(uzObj);
  ruNsValueIndex[ns] = flatten(ruObj);
}

// Find existing key in target namespace by value (UZ or RU)
function findExistingKey(ns, text) {
  const uz = uzNsValueIndex[ns] || {};
  const ru = ruNsValueIndex[ns] || {};
  for (const [k, v] of Object.entries(uz)) if (v === text) return k;
  for (const [k, v] of Object.entries(ru)) if (v === text) return k;
  return null;
}

// Audit findings
const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));

// Group by file
const byFile = {};
for (const f of audit.findings.hardcoded) {
  if (!byFile[f.file]) byFile[f.file] = [];
  byFile[f.file].push(f);
}

let totalReplaced = 0;
let totalKeysAdded = 0;
let filesTouched = 0;
const skipped = [];

const I18N_IMPORT = `import { useTranslation } from '@/lib/i18n';\n`;

for (const [relFile, findings] of Object.entries(byFile)) {
  const full = path.join(SRC, relFile);
  if (!fs.existsSync(full)) continue;
  let content = fs.readFileSync(full, 'utf8');

  // Skip non-component files (no JSX return)
  if (!/\.tsx$/.test(full)) continue;

  // Detect existing namespace
  const nsMatch = content.match(/useTranslation\(\s*['"]([^'"]+)['"]\s*\)/);
  const posMatch = /usePosI18n\b/.test(content);
  const hasUseT = /\buseTranslation\b/.test(content);
  const hasTHook = /\bconst\s*\{\s*t[\s,}].*useTranslation|const\s*\{\s*t[\s,}].*usePosI18n/.test(content);

  let nsName = nsMatch ? nsMatch[1] : null;
  let isPosFile = posMatch;
  let needsImport = false;
  let needsHook = false;

  if (!hasUseT && !posMatch) {
    nsName = 'common';
    needsImport = true;
    needsHook = true;
  }

  // For pos-monitor files, use pos-monitor locale system
  let uzLocaleObj, ruLocaleObj, uzLocalePath, ruLocalePath;
  if (isPosFile) {
    uzLocalePath = path.join(POS_I18N, 'uz.json');
    ruLocalePath = path.join(POS_I18N, 'ru.json');
    uzLocaleObj = loadJson(uzLocalePath);
    ruLocaleObj = loadJson(ruLocalePath);
  } else {
    const ns = nsName || 'common';
    uzLocalePath = path.join(LOCALES, 'uz', `${ns}.json`);
    ruLocalePath = path.join(LOCALES, 'ru', `${ns}.json`);
    uzLocaleObj = loadJson(uzLocalePath);
    ruLocaleObj = loadJson(ruLocalePath);
  }

  // Sort findings by line desc to avoid offset issues during replacement
  findings.sort((a, b) => b.line - a.line);

  let fileChanged = false;
  let keysAddedHere = 0;
  let replacedHere = 0;

  for (const f of findings) {
    const text = f.text;
    if (!text) continue;

    // Skip text that's clearly code-like (Promise<T>, m.quantity, etc.)
    if (/[(){};=]|^Number\(|\bquantity\b/.test(text)) {
      skipped.push({ file: relFile, line: f.line, text, reason: 'code-like' });
      continue;
    }

    // Determine key
    let key = findExistingKey(isPosFile ? 'common' : (nsName || 'common'), text);
    if (!key) {
      // Generate key
      key = valueToKey(text);
      // Ensure uniqueness
      let uniqueKey = key;
      let counter = 1;
      while (uzLocaleObj[uniqueKey] !== undefined && uzLocaleObj[uniqueKey] !== text) {
        uniqueKey = key + counter;
        counter++;
      }
      key = uniqueKey;
      const [uz, ru] = fallbackTranslate(text);
      uzLocaleObj[key] = uz;
      ruLocaleObj[key] = ru;
      keysAddedHere++;
    }

    // Build the t() call
    let tCall;
    if (isPosFile) {
      // pos-monitor: t('common.key') if key is generic else just t('key')
      tCall = `t('common.${key}')`;
      // pos-monitor i18n is nested {common: {save: ...}}. Need to nest in JSON.
      // Convert flat to nested for pos files only
      if (!uzLocaleObj.common) uzLocaleObj.common = {};
      if (!ruLocaleObj.common) ruLocaleObj.common = {};
      uzLocaleObj.common[key] = uzLocaleObj[key];
      ruLocaleObj.common[key] = ruLocaleObj[key];
      delete uzLocaleObj[key];
      delete ruLocaleObj[key];
    } else {
      tCall = `t('${key}')`;
    }

    // Apply replacement based on type
    let oldStr, newStr;
    if (f.type === 'JSX-text') {
      // >TEXT< → >{t('key')}<
      oldStr = `>${text}<`;
      newStr = `>{${tCall}}<`;
    } else if (f.type === 'placeholder' || f.type === 'title' || f.type === 'alt' || f.type === 'aria-label' || f.type === 'label' || f.type === 'tooltip' || f.type === 'description') {
      // attr="TEXT" → attr={t('key')}
      oldStr = `${f.type}="${text}"`;
      newStr = `${f.type}={${tCall}}`;
    } else {
      // Skip unknown types
      skipped.push({ file: relFile, line: f.line, text, reason: 'unknown type ' + f.type });
      continue;
    }

    // Find oldStr in content. Multiple occurrences — replace only one at the target line.
    const lines = content.split('\n');
    if (f.line - 1 >= lines.length) {
      skipped.push({ file: relFile, line: f.line, text, reason: 'line out of range' });
      continue;
    }
    const idxInLine = lines[f.line - 1].indexOf(oldStr);
    if (idxInLine === -1) {
      skipped.push({ file: relFile, line: f.line, text, reason: 'pattern not found on line' });
      continue;
    }
    lines[f.line - 1] = lines[f.line - 1].substring(0, idxInLine) + newStr + lines[f.line - 1].substring(idxInLine + oldStr.length);
    content = lines.join('\n');
    fileChanged = true;
    replacedHere++;
  }

  // Add import + hook if needed and we made changes
  if (fileChanged && needsImport && !hasUseT && !posMatch) {
    // Find a good place to add import — after last existing import
    const importRe = /^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
    let lastImportEnd = 0;
    let m;
    while ((m = importRe.exec(content)) !== null) {
      lastImportEnd = m.index + m[0].length;
    }
    if (lastImportEnd > 0) {
      content = content.substring(0, lastImportEnd) + '\n' + I18N_IMPORT.trimEnd() + content.substring(lastImportEnd);
    } else {
      content = I18N_IMPORT + content;
    }
  }

  if (fileChanged && needsHook && !hasTHook && !posMatch) {
    // Find first component function body and add hook
    // Pattern: export default function X(...) { OR function X(...) { OR const X = (...) => {
    // We add after the opening brace
    const patterns = [
      /export\s+default\s+function\s+\w+[^{]*\{/,
      /export\s+function\s+\w+[^{]*\{/,
      /function\s+\w+\s*\([^)]*\)[^{]*\{/,
      /const\s+\w+\s*[:=]\s*[^=>]*=>\s*\{/,
    ];
    let added = false;
    for (const re of patterns) {
      const m = content.match(re);
      if (m) {
        const idx = m.index + m[0].length;
        const hookLine = "\n  const { t } = useTranslation('common');";
        content = content.substring(0, idx) + hookLine + content.substring(idx);
        added = true;
        break;
      }
    }
    if (!added) {
      // Can't safely add hook — revert
      skipped.push({ file: relFile, line: 0, text: '', reason: 'could not add hook' });
      // Revert by removing import if it was added
      // For safety, just write what we have (component may already have `t` from somewhere)
    }
  }

  if (fileChanged) {
    fs.writeFileSync(full, content, 'utf8');
    filesTouched++;
    totalReplaced += replacedHere;
    totalKeysAdded += keysAddedHere;
  }

  // Save locale if changed
  if (keysAddedHere > 0) {
    saveJson(uzLocalePath, uzLocaleObj);
    saveJson(ruLocalePath, ruLocaleObj);
  }
}

console.log(`Files changed: ${filesTouched}`);
console.log(`Strings replaced: ${totalReplaced}`);
console.log(`Locale keys added: ${totalKeysAdded}`);
console.log(`Skipped: ${skipped.length}`);
fs.writeFileSync(path.join(ROOT, 'scripts', 'i18n-replace-skipped.json'), JSON.stringify(skipped, null, 2));
console.log(`Skipped report: scripts/i18n-replace-skipped.json`);
