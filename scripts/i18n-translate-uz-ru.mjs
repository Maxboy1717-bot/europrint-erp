#!/usr/bin/env node
/**
 * EuroPrint i18n — UZ → RU mass translator using glossary.
 *
 * For each ru/*.json:
 *   1. Find values that lack Cyrillic (likely Uzbek leftover)
 *   2. Translate via glossary (whole-phrase match first, then word-by-word)
 *   3. Write back; preserve key order
 *
 * For each uz/*.json:
 *   1. Find values that equal the key (stub like "dashboard9")
 *   2. Convert camelCase / snake_case to readable Uzbek phrase
 *
 * Whitelist: certain tokens remain untranslated (API, EuroPrint, brand names).
 *
 * Usage: node scripts/i18n-translate-uz-ru.mjs [--apply]
 *   Without --apply: dry-run, prints stats.
 *   With --apply: writes files in place.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const LOCALES = join(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');

const APPLY = process.argv.includes('--apply');

// ─── Whitelist (never translated) ───────────────────────────────────────────
const WHITELIST = new Set([
  'EuroPrint', 'Telegram', 'WhatsApp', 'PostgreSQL', 'Redis', 'Drizzle',
  'NestJS', 'React', 'API', 'URL', 'JWT', 'OEE', 'RBAC', 'KPI', 'SOS',
  'PDF', 'CSV', 'JSON', 'HTML', 'CSS', 'JS', 'TS', 'IP', 'ID', 'OK',
  'OTP', '2FA', 'SaaS', 'ERP', 'CRM', 'HR', 'FI', 'PP', 'MES', 'QC',
  'WMS', 'SD', 'MRO', 'POS', 'MM', 'LMS', 'Wi-Fi', 'iOS', 'Android',
  'Email', 'SMS', 'IoT', 'AI', 'GL', 'AP', 'AR', 'BOM', 'FIFO', 'FEFO',
  'CFO', 'CEO', 'CTO', 'SQL', 'GPS', 'QR', 'B2B', 'B2C', 'BI', 'CAD',
  'CI', 'CD', 'UX', 'UI', 'CRUD', 'REST', 'SaaS', 'PWA', 'JIT',
  'OK', 'NaN', 'YYYY', 'MM', 'DD', 'HH', 'mm', 'ss',
]);

// ─── Whole-phrase UZ → RU map (deterministic translations) ──────────────────
const PHRASE_MAP = new Map(Object.entries({
  // Common UI verbs
  'Saqlash': 'Сохранить',
  'Saqlash...': 'Сохранение...',
  'Saqlanmoqda...': 'Сохранение...',
  'Saqlandi': 'Сохранено',
  'Bekor qilish': 'Отмена',
  'Bekor qilindi': 'Отменено',
  'Tahrirlash': 'Редактировать',
  "O'chirish": 'Удалить',
  "O'chirildi": 'Удалено',
  "Qo'shish": 'Добавить',
  "Qo'shildi": 'Добавлено',
  'Yangilash': 'Обновить',
  'Yangilandi': 'Обновлено',
  'Yaratish': 'Создать',
  'Yaratildi': 'Создано',
  'Yuklash': 'Загрузить',
  'Yuklanmoqda...': 'Загрузка...',
  'Yuklab olish': 'Скачать',
  'Yuklandi': 'Загружено',
  'Qidirish': 'Поиск',
  'Qidirilmoqda...': 'Поиск...',
  'Topilmadi': 'Не найдено',
  'Filtr': 'Фильтр',
  'Filtrlash': 'Фильтровать',
  'Saralash': 'Сортировка',
  'Eksport': 'Экспорт',
  'Eksport qilish': 'Экспортировать',
  'Import': 'Импорт',
  'Import qilish': 'Импортировать',
  'Yopish': 'Закрыть',
  'Yopildi': 'Закрыто',
  'Orqaga': 'Назад',
  'Keyingi': 'Далее',
  'Oldingi': 'Предыдущий',
  'Yuborish': 'Отправить',
  'Yuborildi': 'Отправлено',
  'Yuborilmoqda...': 'Отправка...',
  'Tasdiqlash': 'Подтвердить',
  'Tasdiqlandi': 'Подтверждено',
  'Tasdiqlanmagan': 'Не подтверждено',
  'Rad etish': 'Отклонить',
  'Rad etildi': 'Отклонено',
  'Tafsilotlar': 'Подробности',
  'Batafsil': 'Подробнее',
  "Ko'rsatish": 'Показать',
  "Ko'rish": 'Просмотр',
  'Yashirish': 'Скрыть',
  'Tanlang': 'Выберите',
  'Tanlandi': 'Выбрано',
  "Qo'llash": 'Применить',
  'Qaytarish': 'Сбросить',
  'Tozalash': 'Очистить',
  'Davom etish': 'Продолжить',
  'Boshlash': 'Начать',
  'Tugatish': 'Завершить',
  'Pauza': 'Пауза',
  // Status & state
  'Harakatlar': 'Действия',
  'Holat': 'Статус',
  'Holati': 'Статус',
  'Faol': 'Активный',
  'Nofaol': 'Неактивный',
  'Faol emas': 'Неактивный',
  'Yangi': 'Новый',
  'Eski': 'Старый',
  'Tasdiqlangan': 'Подтверждённый',
  'Rad etilgan': 'Отклонённый',
  'Kutilmoqda': 'Ожидание',
  'Kutilmoqda...': 'Ожидание...',
  'Bekor qilingan': 'Отменённый',
  'Yakunlangan': 'Завершённый',
  'Tayyor': 'Готово',
  'Yopilgan': 'Закрытый',
  'Ochiq': 'Открыт',
  'Yopiq': 'Закрыт',
  // Fields
  'Sana': 'Дата',
  'Vaqt': 'Время',
  'Sana va vaqt': 'Дата и время',
  'Boshlanish sanasi': 'Дата начала',
  'Tugash sanasi': 'Дата окончания',
  'Nomi': 'Название',
  'Nom': 'Название',
  'Tavsif': 'Описание',
  'Izoh': 'Комментарий',
  'Turi': 'Тип',
  'Tur': 'Тип',
  'Miqdor': 'Количество',
  'Miqdori': 'Количество',
  'Summa': 'Сумма',
  'Summasi': 'Сумма',
  'Narx': 'Цена',
  'Narxi': 'Цена',
  'Jami': 'Всего',
  'Jami summa': 'Итого',
  'Foydalanuvchi': 'Пользователь',
  'Foydalanuvchilar': 'Пользователи',
  'Lavozim': 'Должность',
  'Lavozimi': 'Должность',
  "Bo'lim": 'Отдел',
  "Bo'limlar": 'Отделы',
  'Buyurtma': 'Заказ',
  'Buyurtmalar': 'Заказы',
  'Buyurtma raqami': 'Номер заказа',
  'Hujjat': 'Документ',
  'Hujjatlar': 'Документы',
  'Mijoz': 'Клиент',
  'Mijozlar': 'Клиенты',
  'Yetkazib beruvchi': 'Поставщик',
  'Yetkazib beruvchilar': 'Поставщики',
  'Tovar': 'Товар',
  'Tovarlar': 'Товары',
  'Mahsulot': 'Продукт',
  'Mahsulotlar': 'Продукты',
  'Mahsulot nomi': 'Название продукта',
  'Mahsulot turi': 'Тип продукта',
  'Sklad': 'Склад',
  'Omborxona': 'Склад',
  'Omborxonalar': 'Склады',
  'Xodim': 'Сотрудник',
  'Xodimlar': 'Сотрудники',
  'Ishchi': 'Сотрудник',
  'Ishchilar': 'Сотрудники',
  'Daromad': 'Доход',
  'Xarajat': 'Расход',
  'Xarajatlar': 'Расходы',
  'Hisob-faktura': 'Счёт-фактура',
  'Hisob-fakturalar': 'Счета-фактуры',
  'Ishlab chiqarish': 'Производство',
  'Ishlab chiqarish buyurtmasi': 'Производственный заказ',
  'Smena': 'Смена',
  'Smenalar': 'Смены',
  'Marshrut': 'Маршрут',
  'Rejalashtirish': 'Планирование',
  'Reja': 'План',
  'Avans': 'Аванс',
  'Yetkazib berish': 'Доставка',
  'Hisobot': 'Отчёт',
  'Hisobotlar': 'Отчёты',
  'Boshqaruv paneli': 'Панель управления',
  'Bosh sahifa': 'Главная',
  'Asosiy': 'Основной',
  'Sozlamalar': 'Настройки',
  'Xabarnoma': 'Уведомление',
  'Xabarnomalar': 'Уведомления',
  'Xabar': 'Сообщение',
  'Xabarlar': 'Сообщения',
  'Ruxsat': 'Разрешение',
  'Ruxsatlar': 'Разрешения',
  'Rol': 'Роль',
  'Rollar': 'Роли',
  'Tizimga kirish': 'Вход в систему',
  'Tizimdan chiqish': 'Выход из системы',
  'Kirish': 'Вход',
  'Chiqish': 'Выход',
  'Parol': 'Пароль',
  'Yangi parol': 'Новый пароль',
  'Parolni tasdiqlash': 'Подтвердите пароль',
  'Xatolik': 'Ошибка',
  'Xato': 'Ошибка',
  'Xatolik yuz berdi': 'Произошла ошибка',
  'Muvaffaqiyatli': 'Успешно',
  'Muvaffaqiyat': 'Успех',
  'Ogohlantirish': 'Предупреждение',
  "Ma'lumot": 'Информация',
  "Ma'lumotlar": 'Данные',
  "Ma'lumot yo'q": 'Нет данных',
  "Bo'sh": 'Пусто',
  // Common phrases
  "Hech qanday ma'lumot yo'q": 'Нет данных',
  "Ma'lumot topilmadi": 'Данные не найдены',
  "Iltimos kuting": 'Пожалуйста, подождите',
  'Iltimos kuting...': 'Пожалуйста, подождите...',
  "Iltimos, kuting": 'Пожалуйста, подождите',
  "Iltimos, kiriting": 'Пожалуйста, введите',
  "Iltimos, tanlang": 'Пожалуйста, выберите',
  'Telefon': 'Телефон',
  'Telefon raqami': 'Номер телефона',
  'Manzil': 'Адрес',
  'Shahar': 'Город',
  'Mamlakat': 'Страна',
  'Tug\'ilgan kun': 'День рождения',
  'Tug\'ilgan sana': 'Дата рождения',
  'Ish boshlagan sana': 'Дата начала работы',
  'F.I.SH': 'Ф.И.О.',
  'Ism': 'Имя',
  'Familiya': 'Фамилия',
  'Ota ismi': 'Отчество',
  'Yosh': 'Возраст',
  'Jinsi': 'Пол',
  'Erkak': 'Мужской',
  'Ayol': 'Женский',
  "O'rta": 'Среднее',
  'Oliy': 'Высшее',
  // Time periods
  'Bugun': 'Сегодня',
  'Kecha': 'Вчера',
  'Ertaga': 'Завтра',
  'Hafta': 'Неделя',
  'Oy': 'Месяц',
  'Yil': 'Год',
  'Soat': 'Час',
  'Daqiqa': 'Минута',
  'Soniya': 'Секунда',
  'Kun': 'День',
  'Kunlar': 'Дни',
  'Hozir': 'Сейчас',
  // Operations
  "Yangi qo'shish": 'Добавить новый',
  'Yangi yaratish': 'Создать новый',
  'Yangi xodim': 'Новый сотрудник',
  'Yangi buyurtma': 'Новый заказ',
  'Yangi mijoz': 'Новый клиент',
  'Yangi hujjat': 'Новый документ',
  'Yangi mahsulot': 'Новый продукт',
  'Hammasi': 'Все',
  'Hech narsa': 'Ничего',
  'Ko\'proq': 'Больше',
  'Kamroq': 'Меньше',
  'Belgilang': 'Отметьте',
  'Belgilash': 'Отметить',
  'Belgilangan': 'Отмеченный',
  // Roles & departments
  'Admin': 'Админ',
  'Super admin': 'Супер админ',
  'Super Admin': 'Супер админ',
  'SUPER ADMIN OVERRIDE': 'Прямое подтверждение супер админа',
  'Direktor': 'Директор',
  'Menejer': 'Менеджер',
  'Operator': 'Оператор',
  'Buxgalter': 'Бухгалтер',
  'Texnik': 'Техник',
  'Sotuv': 'Продажи',
  'Marketing': 'Маркетинг',
  'Moliya': 'Финансы',
  'Kadrlar': 'Кадры',
  'Sifat nazorati': 'Контроль качества',
  // Common short
  'Ha': 'Да',
  "Yo'q": 'Нет',
  "Bor": 'Есть',
  "Yo'q ": 'Нет ',
  'Bekor': 'Отменить',
  // Frequently seen
  'Jami narx': 'Общая цена',
  'Jami summa': 'Общая сумма',
  'Eski Dashboard': 'Старая панель',
  'Eski': 'Старая',
  'Yangi versiya': 'Новая версия',
  'Real-time': 'В реальном времени',
  'Real vaqt': 'В реальном времени',
  'Real vaqtli': 'В реальном времени',
  'Real vaqtli KPI': 'KPI в реальном времени',
  'Onlayn': 'Онлайн',
  'Oflayn': 'Офлайн',
  'Onlayn rejim': 'Онлайн режим',
  'Oflayn rejim': 'Офлайн режим',
  'Mavjud': 'Доступно',
  'Mavjud emas': 'Недоступно',
  "Yo'q narsa": 'Ничего',
  // Stat & analytics
  'Statistika': 'Статистика',
  'Analitika': 'Аналитика',
  'Tahlil': 'Анализ',
  'Grafik': 'График',
  'Diagramma': 'Диаграмма',
  'Hisob-kitob': 'Расчёт',
}));

// ─── Word-level UZ → RU dictionary for compound phrases ─────────────────────
const WORD_MAP = new Map(Object.entries({
  // Verbs (conjugated forms also)
  'saqlash': 'сохранение',
  'saqlash...': 'сохранение...',
  'saqlandi': 'сохранено',
  'qo\'shish': 'добавление',
  'qo\'shildi': 'добавлено',
  'tahrirlash': 'редактирование',
  'o\'chirish': 'удаление',
  'o\'chirildi': 'удалено',
  'yaratish': 'создание',
  'yaratildi': 'создано',
  'yangilash': 'обновление',
  'yangilandi': 'обновлено',
  'yuklash': 'загрузка',
  'yuklandi': 'загружено',
  'yuborish': 'отправка',
  'yuborildi': 'отправлено',
  'qidirish': 'поиск',
  'topildi': 'найдено',
  'topilmadi': 'не найдено',
  'tasdiqlash': 'подтверждение',
  'tasdiqlandi': 'подтверждено',
  'rad': 'отказ',
  'tanlash': 'выбор',
  'tanlandi': 'выбрано',
  'boshlash': 'начало',
  'tugatish': 'завершение',
  // Nouns
  'foydalanuvchi': 'пользователь',
  'foydalanuvchilar': 'пользователи',
  'xodim': 'сотрудник',
  'xodimlar': 'сотрудники',
  'buyurtma': 'заказ',
  'buyurtmalar': 'заказы',
  'mijoz': 'клиент',
  'mijozlar': 'клиенты',
  'mahsulot': 'продукт',
  'mahsulotlar': 'продукты',
  'hujjat': 'документ',
  'hujjatlar': 'документы',
  'sklad': 'склад',
  'omborxona': 'склад',
  'sana': 'дата',
  'vaqt': 'время',
  'nomi': 'название',
  'tavsif': 'описание',
  'turi': 'тип',
  'miqdor': 'количество',
  'narx': 'цена',
  'summa': 'сумма',
  'jami': 'всего',
  'rol': 'роль',
  'rollar': 'роли',
  'ruxsat': 'разрешение',
  'lavozim': 'должность',
  'bo\'lim': 'отдел',
  'kompaniya': 'компания',
  'tashkilot': 'организация',
  'guruh': 'группа',
  'kategoriya': 'категория',
  'bo\'limi': 'отдела',
  'kun': 'день',
  'oy': 'месяц',
  'yil': 'год',
  // Adjectives
  'faol': 'активный',
  'nofaol': 'неактивный',
  'yangi': 'новый',
  'eski': 'старый',
  'asosiy': 'основной',
  'umumiy': 'общий',
  'umumiy summa': 'общая сумма',
}));

// ─── Helpers ────────────────────────────────────────────────────────────────
const hasCyrillic = (s) => typeof s === 'string' && /[Ѐ-ӿ]/.test(s);

function isUzLatin(s) {
  if (typeof s !== 'string') return false;
  if (hasCyrillic(s)) return false;
  if (s.length < 2) return false;
  // Heuristic — has Uzbek-specific markers OR is multi-word Latin
  return /[oO]'|[gG]'|sh|ch|q|x'|ya|yo|yu|ki|al|li|ni|or|ar|er/i.test(s) || s.split(/\s+/).length >= 2;
}

function translateUzToRu(text) {
  if (typeof text !== 'string' || hasCyrillic(text)) return text;
  // Whitelist check (token-level)
  const trimmed = text.trim();
  if (WHITELIST.has(trimmed)) return text;

  // Phrase match (whole)
  if (PHRASE_MAP.has(trimmed)) return PHRASE_MAP.get(trimmed);

  // Phrase match (case-insensitive trim)
  for (const [uz, ru] of PHRASE_MAP) {
    if (trimmed.toLowerCase() === uz.toLowerCase()) return ru;
  }

  // Word-by-word for unknown phrases — only when at least 50% words found
  const words = text.split(/(\s+|[.,;:!?()])/);
  let translatedWords = 0;
  let totalWords = 0;
  const result = words.map((w) => {
    if (!/\w/.test(w)) return w;  // whitespace/punct
    totalWords++;
    const lower = w.toLowerCase();
    if (WHITELIST.has(w)) return w;
    if (WORD_MAP.has(lower)) {
      translatedWords++;
      // Preserve case
      const translated = WORD_MAP.get(lower);
      if (w[0] === w[0].toUpperCase()) {
        return translated[0].toUpperCase() + translated.slice(1);
      }
      return translated;
    }
    return w;
  });

  if (totalWords > 0 && translatedWords / totalWords >= 0.5) {
    return result.join('');
  }
  return text;  // not confident enough
}

// ─── Convert camelCase stub key to readable Uzbek phrase ────────────────────
function stubToUzPhrase(key) {
  if (typeof key !== 'string') return key;
  // Remove namespace prefix
  const leaf = key.split('.').pop() || key;

  // Split camelCase / snake_case
  const words = leaf
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([0-9]+)/g, ' $1')
    .toLowerCase()
    .trim();

  if (!words) return key;
  // Capitalize first letter
  return words[0].toUpperCase() + words.slice(1);
}

function isStubValue(key, value) {
  if (typeof value !== 'string') return false;
  const leaf = key.split('.').pop() || key;
  // Exact key match or camelCase identifier alone
  if (value === leaf) return true;
  if (value === key) return true;
  // camelCase / snake_case identifier with no spaces
  if (!/\s/.test(value) && /^[a-z][a-zA-Z0-9_]*[0-9]*$/.test(value)) {
    return true;
  }
  return false;
}

// ─── Tree walk preserving structure ─────────────────────────────────────────
function walkAndTransform(obj, prefix, transformer) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = walkAndTransform(v, fullKey, transformer);
    } else {
      out[k] = transformer(fullKey, v);
    }
  }
  return out;
}

// ─── Main ───────────────────────────────────────────────────────────────────
const uzDir = join(LOCALES, 'uz');
const ruDir = join(LOCALES, 'ru');
const namespaces = readdirSync(uzDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

let uzStubsFixed = 0;
let ruTranslated = 0;
let ruUnchanged = 0;

for (const ns of namespaces) {
  const uzPath = join(uzDir, `${ns}.json`);
  const ruPath = join(ruDir, `${ns}.json`);

  let uz, ru;
  try {
    uz = JSON.parse(readFileSync(uzPath, 'utf-8'));
    ru = JSON.parse(readFileSync(ruPath, 'utf-8'));
  } catch (e) {
    console.error(`Skipping ${ns}: ${e.message}`);
    continue;
  }

  // Pass 1: Fix UZ stubs
  let nsUzFixed = 0;
  const newUz = walkAndTransform(uz, '', (key, value) => {
    if (isStubValue(key, value)) {
      const fixed = stubToUzPhrase(key);
      if (fixed !== value) {
        nsUzFixed++;
        return fixed;
      }
    }
    return value;
  });

  // Pass 2: Translate RU values lacking Cyrillic
  let nsRuTranslated = 0;
  let nsRuUnchanged = 0;
  const newRu = walkAndTransform(ru, '', (key, value) => {
    if (typeof value !== 'string') return value;
    if (hasCyrillic(value)) return value;  // already Russian
    if (WHITELIST.has(value.trim())) return value;
    if (value.length <= 1) return value;

    const translated = translateUzToRu(value);
    if (translated !== value && hasCyrillic(translated)) {
      nsRuTranslated++;
      return translated;
    }
    nsRuUnchanged++;
    return value;
  });

  if (APPLY && (nsUzFixed > 0 || nsRuTranslated > 0)) {
    writeFileSync(uzPath, JSON.stringify(newUz, null, 2) + '\n', 'utf-8');
    writeFileSync(ruPath, JSON.stringify(newRu, null, 2) + '\n', 'utf-8');
  }

  if (nsUzFixed > 0 || nsRuTranslated > 0 || nsRuUnchanged > 0) {
    console.log(`  ${ns.padEnd(20)} UZ-stub-fixed=${String(nsUzFixed).padStart(4)}  RU-translated=${String(nsRuTranslated).padStart(4)}  RU-unchanged=${String(nsRuUnchanged).padStart(4)}`);
  }

  uzStubsFixed += nsUzFixed;
  ruTranslated += nsRuTranslated;
  ruUnchanged += nsRuUnchanged;
}

console.log('');
console.log(`Total UZ stubs fixed:      ${uzStubsFixed}`);
console.log(`Total RU values translated: ${ruTranslated}`);
console.log(`RU values left unchanged:  ${ruUnchanged}`);
console.log(`Mode: ${APPLY ? 'APPLY (files written)' : 'DRY-RUN (use --apply to write)'}`);
