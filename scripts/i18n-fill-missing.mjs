#!/usr/bin/env node
/**
 * Fill missing keys in uz/ru locale files using an ERP translation dictionary.
 * Run AFTER i18n-full-audit.mjs.
 *
 * For each missing key: derive UZ + RU translation from key name
 * (camelCase decomposition + dict lookup) and write to JSON.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const LOCALES = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');
const AUDIT = path.resolve(ROOT, 'scripts', 'i18n-full-audit.json');

// English → [UZ, RU] dictionary for ERP terminology
const dict = new Map(Object.entries({
  // Common UI actions
  save: ['Saqlash', 'Сохранить'],
  cancel: ['Bekor qilish', 'Отмена'],
  delete: ["O'chirish", 'Удалить'],
  edit: ['Tahrirlash', 'Редактировать'],
  add: ["Qo'shish", 'Добавить'],
  create: ['Yaratish', 'Создать'],
  remove: ["O'chirish", 'Удалить'],
  update: ['Yangilash', 'Обновить'],
  refresh: ['Yangilash', 'Обновить'],
  reset: ['Tiklash', 'Сбросить'],
  apply: ['Qo\'llash', 'Применить'],
  submit: ['Yuborish', 'Отправить'],
  confirm: ['Tasdiqlash', 'Подтвердить'],
  reject: ['Rad etish', 'Отклонить'],
  approve: ['Tasdiqlash', 'Одобрить'],
  approved: ['Tasdiqlangan', 'Одобрено'],
  rejected: ['Rad etilgan', 'Отклонено'],
  pending: ['Kutilmoqda', 'Ожидает'],
  inProgress: ['Jarayonda', 'В процессе'],
  completed: ['Tugatilgan', 'Завершено'],
  archived: ['Arxivlangan', 'Архивировано'],
  draft: ['Qoralama', 'Черновик'],
  finalized: ['Yakunlangan', 'Финализирован'],
  cancelled: ['Bekor qilingan', 'Отменено'],
  scheduled: ['Rejalashtirilgan', 'Запланировано'],

  // Common UI elements
  title: ['Sarlavha', 'Заголовок'],
  description: ['Tavsif', 'Описание'],
  label: ['Yorliq', 'Метка'],
  subtitle: ['Ostki sarlavha', 'Подзаголовок'],
  name: ['Nomi', 'Название'],
  category: ['Toifa', 'Категория'],
  type: ['Turi', 'Тип'],
  status: ['Holat', 'Статус'],
  date: ['Sana', 'Дата'],
  time: ['Vaqt', 'Время'],
  total: ['Jami', 'Всего'],
  totalItems: ['Jami elementlar', 'Всего элементов'],
  totalCount: ['Jami soni', 'Общее количество'],
  empty: ["Bo'sh", 'Пусто'],
  emptyDesc: ["Ma'lumot topilmadi", 'Данные не найдены'],
  loading: ['Yuklanmoqda...', 'Загрузка...'],
  search: ['Qidirish', 'Поиск'],
  filter: ['Filtr', 'Фильтр'],
  sort: ['Saralash', 'Сортировка'],
  actions: ['Amallar', 'Действия'],
  details: ['Tafsilotlar', 'Подробности'],
  more: ["Ko'proq", 'Больше'],
  less: ['Kamroq', 'Меньше'],
  view: ["Ko'rish", 'Просмотр'],
  preview: ['Oldindan ko\'rish', 'Предпросмотр'],
  back: ['Orqaga', 'Назад'],
  next: ['Keyingisi', 'Следующий'],
  previous: ['Oldingi', 'Предыдущий'],
  close: ['Yopish', 'Закрыть'],
  open: ['Ochish', 'Открыть'],
  yes: ['Ha', 'Да'],
  no: ["Yo'q", 'Нет'],
  ok: ['OK', 'OK'],
  error: ['Xato', 'Ошибка'],
  warning: ['Ogohlantirish', 'Предупреждение'],
  success: ['Muvaffaqiyat', 'Успех'],
  info: ["Ma'lumot", 'Информация'],
  selectReport: ['Hisobotni tanlang', 'Выберите отчёт'],
  dateFrom: ['Sanadan', 'Дата с'],
  dateTo: ['Sanagacha', 'Дата по'],

  // Forms / inputs
  email: ['Email', 'Email'],
  password: ['Parol', 'Пароль'],
  username: ['Foydalanuvchi nomi', 'Имя пользователя'],
  phone: ['Telefon', 'Телефон'],
  address: ['Manzil', 'Адрес'],
  notes: ['Izohlar', 'Заметки'],
  note: ['Izoh', 'Заметка'],
  comment: ['Izoh', 'Комментарий'],
  required: ['Majburiy', 'Обязательно'],
  optional: ['Ixtiyoriy', 'Необязательно'],

  // ERP — Production
  production: ['Ishlab chiqarish', 'Производство'],
  productionOrder: ['Ishlab chiqarish buyurtmasi', 'Производственный заказ'],
  order: ['Buyurtma', 'Заказ'],
  orders: ['Buyurtmalar', 'Заказы'],
  orderId: ['Buyurtma ID', 'ID заказа'],
  orderNumber: ['Buyurtma raqami', 'Номер заказа'],
  orderIdLabel: ['Buyurtma raqami', 'Номер заказа'],

  // ERP — Quality / QC
  quality: ['Sifat', 'Качество'],
  defect: ['Defekt', 'Дефект'],
  defects: ['Defektlar', 'Дефекты'],
  defectMgmt: ['Defektlar boshqaruvi', 'Управление дефектами'],
  inspection: ['Tekshiruv', 'Инспекция'],
  measurement: ["O'lchov", 'Измерение'],
  parameter: ['Parametr', 'Параметр'],
  parameters: ['Parametrlar', 'Параметры'],
  paperParameters: ['Qog\'oz parametrlari', 'Параметры бумаги'],
  supplierQuality: ['Yetkazib beruvchi sifati', 'Качество поставщика'],
  qualityTrend: ['Sifat tendensiyasi', 'Тренд качества'],
  qcreview: ['QC ko\'rib chiqish', 'Проверка QC'],

  // ERP — HR
  employee: ['Xodim', 'Сотрудник'],
  employees: ['Xodimlar', 'Сотрудники'],
  salary: ['Ish haqi', 'Зарплата'],
  attendance: ['Davomat', 'Посещаемость'],
  vacation: ["Ta'til", 'Отпуск'],
  position: ['Lavozim', 'Должность'],
  department: ["Bo'lim", 'Отдел'],
  faceEnroll: ['Yuzni ro\'yxatga olish', 'Регистрация лица'],

  // ERP — Sales
  customer: ['Mijoz', 'Клиент'],
  customers: ['Mijozlar', 'Клиенты'],
  contract: ['Shartnoma', 'Договор'],
  price: ['Narx', 'Цена'],
  quote: ['Taklif', 'Предложение'],
  invoice: ['Faktura', 'Счёт'],
  payment: ["To'lov", 'Оплата'],
  funnel: ['Voronka', 'Воронка'],

  // ERP — Warehouse / WMS
  warehouse: ['Ombor', 'Склад'],
  inventory: ['Inventar', 'Инвентарь'],
  inventoryPlan: ['Inventarizatsiya rejasi', 'План инвентаризации'],
  newPlan: ['Yangi reja', 'Новый план'],
  posStock: ['POS ombor', 'POS склад'],
  myInventory: ['Mening inventarim', 'Мой инвентарь'],
  material: ['Material', 'Материал'],
  materials: ['Materiallar', 'Материалы'],
  receipt: ['Qabul', 'Приёмка'],
  movement: ['Harakat', 'Движение'],
  movements: ['Harakatlar', 'Движения'],
  givenQty: ['Berilgan miqdor', 'Выданное количество'],
  returnedQty: ['Qaytarilgan miqdor', 'Возвращённое количество'],
  remainingQty: ['Qolgan miqdor', 'Остаток'],
  returnModal: ['Qaytarish', 'Возврат'],
  returnButton: ['Qaytarish', 'Вернуть'],

  // ERP — Finance
  finance: ['Moliya', 'Финансы'],
  budget: ['Byudjet', 'Бюджет'],
  cashflow: ['Pul oqimi', 'Денежный поток'],
  netCashFlow: ['Sof pul oqimi', 'Чистый денежный поток'],
  inflow: ['Kirim', 'Приток'],
  outflow: ['Chiqim', 'Отток'],
  variance: ["Chetlanish", 'Отклонение'],
  cashFlowManagement: ['Pul oqimini boshqarish', 'Управление денежным потоком'],
  currentBalance: ['Joriy qoldiq', 'Текущий остаток'],
  purchases: ['Xaridlar', 'Закупки'],
  taxes: ['Soliqlar', 'Налоги'],
  loan: ['Kredit', 'Кредит'],
  glPosting: ['GL yozuv', 'Проводка GL'],

  // ERP — MRO
  mro: ['MRO', 'MRO'],
  spare: ['Ehtiyot qism', 'Запчасть'],
  spareParts: ['Ehtiyot qismlar', 'Запчасти'],
  canteen: ['Oshxona', 'Столовая'],
  mealsToday: ['Bugungi ovqatlar', 'Блюда сегодня'],
  utility: ['Kommunal', 'Коммунальные'],
  utilityReadings: ["Kommunal ko'rsatkichlar", 'Показания счётчиков'],

  // ERP — IoT / AI
  iot: ['IoT', 'IoT'],
  ai: ['AI', 'AI'],
  aiAssistant: ['AI yordamchi', 'AI помощник'],
  forecast: ['Prognoz', 'Прогноз'],
  demandForecasting: ['Talab prognozi', 'Прогноз спроса'],
  shift: ['Smena', 'Смена'],
  shifts: ['Smenalar', 'Смены'],
  shiftMgmt: ['Smena boshqaruvi', 'Управление сменами'],
  rushOrder: ['Shoshilinch buyurtma', 'Срочный заказ'],
  tabAttendance: ['Davomat', 'Посещаемость'],
  tabRooms: ['Xonalar', 'Помещения'],
  tabHealth: ['Salomatlik', 'Здоровье'],

  // Pos
  pos: ['POS', 'POS'],
  posSync: ['POS sinxronizatsiya', 'Синхронизация POS'],
  inward: ['Kirim', 'Поступление'],
  outward: ['Chiqim', 'Выдача'],
  scan: ['Skanerlash', 'Сканировать'],
  manualInput: ["Qo'l bilan kiritish", 'Ручной ввод'],
  cameraUnsupported: ['Kamera qo\'llab-quvvatlanmaydi', 'Камера не поддерживается'],

  // Common patterns
  newPlan_short: ['Yangi reja', 'Новый план'],
  scheduledFor: ['Rejalashtirildi', 'Запланировано на'],
  progress: ['Bajarilish', 'Прогресс'],
  targetWarehouse: ['Maqsadli ombor', 'Целевой склад'],
  priority: ['Muhimlik', 'Приоритет'],
  needDate: ['Kerakli sana', 'Дата потребности'],
  previousPageAria: ['Oldingi sahifa', 'Предыдущая страница'],
  nextPageAria: ['Keyingi sahifa', 'Следующая страница'],
  statusGood: ['Yaxshi', 'Хорошо'],
  statusMedium: ["O'rta", 'Средне'],
  statusPoor: ['Yomon', 'Плохо'],
  reviewing: ["Ko'rib chiqilmoqda", 'Рассматривается'],

  // Auth / login
  auth: ['Autentifikatsiya', 'Аутентификация'],
  rememberTerminal: ['Terminalni eslab qolish', 'Запомнить терминал'],

  // Reports
  reports: ['Hisobotlar', 'Отчёты'],
  report: ['Hisobot', 'Отчёт'],

  // Quarantine / GL
  quarantine: ['Karantin', 'Карантин'],

  // Common short
  totals: ['Jami', 'Итого'],
  validate: ['Tekshirish', 'Проверить'],
  stirFailed: ['STIR xato', 'Ошибка STIR'],
  cardFailed: ['Karta xato', 'Ошибка карты'],
  valid: ["To'g'ri", 'Корректно'],
  getPdf: ['PDF olish', 'Получить PDF'],
  scanned: ['Skanerlangan', 'Сосканировано'],
  required_short: ['Kerak', 'Требуется'],
  online: ['Onlayn', 'Онлайн'],
  offline: ['Oflayn', 'Оффлайн'],
  syncing: ['Sinxronizatsiya', 'Синхронизация'],
  synced: ['Sinxronlangan', 'Синхронизировано'],
  banner: ['Banner', 'Баннер'],

  // Misc
  contact: ['Aloqa', 'Контакт'],
  footer: ['Footer', 'Footer'],
  rights: ['Barcha huquqlar himoyalangan', 'Все права защищены'],
  addressValue: ['Toshkent, O\'zbekiston', 'Ташкент, Узбекистан'],
  nav: ['Navigatsiya', 'Навигация'],
  navigation: ['Navigatsiya', 'Навигация'],
  connect: ['Bog\'lanish', 'Соединить'],
  subscribe: ['Obuna bo\'lish', 'Подписаться'],
  length: ['Uzunlik', 'Длина'],
  width: ['Kenglik', 'Ширина'],
  height: ['Balandlik', 'Высота'],
  notifications: ['Bildirishnomalar', 'Уведомления'],
  noItems: ['Elementlar yo\'q', 'Нет элементов'],
  lowstock: ['Past zaxira', 'Низкий запас'],

  // Quotes
  newMovement: ['Yangi harakat', 'Новое движение'],
  items: ['Elementlar', 'Элементы'],
  newHrLink: ['Yangi HR havolasi', 'Новая HR-ссылка'],
  hrContact: ['HR aloqasi', 'HR контакт'],
  hrEmail: ['HR email', 'HR email'],

  // Interview
  startInterview: ['Suhbatni boshlash', 'Начать интервью'],
  finishBtn: ['Yakunlash', 'Завершить'],
  nextBtn: ['Keyingi', 'Далее'],
  submitBtn: ['Yuborish', 'Отправить'],
  submitBtnWait: ['Yuborilmoqda...', 'Отправляется...'],
  aiTyping: ['AI yozmoqda...', 'AI печатает...'],
  typeAnswer: ['Javobni yozing...', 'Введите ответ...'],
  micOn: ['Mikrofon yoqilgan', 'Микрофон включён'],
  micOff: ["Mikrofon o'chirilgan", 'Микрофон выключен'],
  chars: ['belgi', 'симв.'],
  questions: ['Savollar', 'Вопросы'],
  voiceText: ['Ovozli matn', 'Голосовой текст'],
  secure: ['Xavfsiz', 'Защищено'],
  tip1: ['Maslahat 1', 'Совет 1'],
  tip2: ['Maslahat 2', 'Совет 2'],
  tip3: ['Maslahat 3', 'Совет 3'],
  tip4: ['Maslahat 4', 'Совет 4'],
  camera: ['Kamera', 'Камера'],
  mic: ['Mikrofon', 'Микрофон'],
  checkDevices: ['Qurilmalarni tekshirish', 'Проверить устройства'],
  proceed: ['Davom etish', 'Продолжить'],
  invalid: ["Noto'g'ri", 'Недопустимо'],
  invalidDesc: ["Noto'g'ri ma'lumot", 'Неверные данные'],
  completedDesc: ["Suhbat yakunlandi", 'Интервью завершено'],
  expiredDesc: ['Muddati tugadi', 'Срок истёк'],
  connected: ['Ulangan', 'Подключено'],
  ledger: ['Daftar', 'Реестр'],

  // Pure single-word UZ keys (callers passed uz text directly)
  Tayyor: ['Tayyor', 'Готово'],
  Mahsulot: ['Mahsulot', 'Продукт'],
  Materiallar: ['Materiallar', 'Материалы'],
  Brak: ['Brak', 'Брак'],
  Unumdorlik: ['Unumdorlik', 'Производительность'],
  Sifat: ['Sifat', 'Качество'],
  Izoh: ['Izoh', 'Заметка'],
  Qoldi: ['Qoldi', 'Осталось'],
  Uskuna: ['Uskuna', 'Оборудование'],
  Shoshilinch: ['Shoshilinch', 'Срочно'],
  Buyurtma: ['Buyurtma', 'Заказ'],
  Tiraj: ['Tiraj', 'Тираж'],
  Kutilmoqda: ['Kutilmoqda', 'Ожидает'],
  Tayyorlanmoqda: ['Tayyorlanmoqda', 'Готовится'],
  Yetkazildi: ['Yetkazildi', 'Доставлено'],
  Skanlangan: ['Skanlangan', 'Просканировано'],
  Skanerlash: ['Skanerlash', 'Сканировать'],
  Master: ['Usta', 'Мастер'],
  Polmaster: ['Yarim usta', 'Полумастер'],
  Shogird: ['Shogird', 'Ученик'],
  Roklerchi: ['Rolikchi', 'Роликовщик'],
  Ixtiyoriy: ['Ixtiyoriy', 'Необязательно'],
  Tanlanmagan: ['Tanlanmagan', 'Не выбрано'],
  Jamoa: ['Jamoa', 'Команда'],
  Tabel: ['Tabel', 'Табель'],
  Kutilgan: ['Kutilgan', 'Ожидаемый'],
  Haqiqiy: ['Haqiqiy', 'Фактический'],
  Yaxshi: ['Yaxshi', 'Хорошо'],
  Bajarildi: ['Bajarildi', 'Выполнено'],
  Mavjudlik: ['Mavjudlik', 'Доступность'],
  Jamoaviylik: ['Jamoaviylik', 'Командность'],
  Berilgan: ['Berilgan', 'Выдано'],
  Ishlatilgan: ['Ishlatilgan', 'Использовано'],
  Qoliq: ['Qoliq', 'Остаток'],
  Parol: ['Parol', 'Пароль'],
  KIRISH: ['KIRISH', 'ВХОД'],
  Izohlang: ['Izohlang', 'Прокомментируйте'],
  Bekor: ['Bekor', 'Отмена'],
  Saqlash: ['Saqlash', 'Сохранить'],
  Tejash: ['Tejash', 'Экономия'],
  SOS: ['SOS', 'SOS'],
  STOP: ['STOP', 'СТОП'],
  BRAK: ['BRAK', 'БРАК'],
  Yuklanmoqda: ['Yuklanmoqda...', 'Загрузка...'],
  SOZLANMOQDA: ['SOZLANMOQDA', 'НАСТРАИВАЕТСЯ'],
  ISHLAMOQDA: ['ISHLAMOQDA', 'РАБОТАЕТ'],
  Maqsad: ['Maqsad', 'Цель'],
  Operator: ['Operator', 'Оператор'],
  Bajarilish: ['Bajarilish', 'Выполнение'],
  Oddiy: ['Oddiy', 'Обычный'],
  s: ['son', 'шт'],
  d: ['daqiqa', 'мин'],
  daqiqa: ['daqiqa', 'минута'],
  Xatolik: ['Xatolik', 'Ошибка'],
  Yaratish: ['Yaratish', 'Создать'],
  Status: ['Holat', 'Статус'],
  Material: ['Material', 'Материал'],
  Kerakli: ['Kerakli', 'Необходимо'],
  Skanerlangan: ['Skanerlangan', 'Сосканировано'],
  buyurtma: ['buyurtma', 'заказ'],
  komplekt: ['komplekt', 'комплект'],
  tayyor: ['tayyor', 'готово'],
  Yetkazish: ['Yetkazish', 'Доставка'],
  Yopish: ['Yopish', 'Закрыть'],
  Barchasi: ['Barchasi', 'Все'],
  Qidirish: ['Qidirish...', 'Поиск...'],
  Holat: ['Holat', 'Статус'],
  Yaratilgan: ['Yaratilgan', 'Создано'],
  Amallar: ['Amallar', 'Действия'],
  Tayyorlash: ['Tayyorlash', 'Подготовка'],
  Batafsil: ['Batafsil', 'Подробнее'],
  cancelledDesc: ['Bekor qilingan', 'Отменено'],
  description_alt: ['Tavsif', 'Описание'],
  cashFlowManagement_alt: ['Pul oqimi boshqaruvi', 'Управление денежным потоком'],
  netCashFlow_alt: ['Sof pul oqimi', 'Чистый денежный поток'],
  dona: ['dona', 'шт'],
}));

// Decompose camelCase into words
function decompose(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_.]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function translateLeaf(leaf) {
  if (dict.has(leaf)) return dict.get(leaf);
  // camelCase decomposition
  const words = decompose(leaf);
  const uzParts = [], ruParts = [];
  let hadHit = false;
  for (const w of words) {
    if (dict.has(w)) {
      uzParts.push(dict.get(w)[0]);
      ruParts.push(dict.get(w)[1]);
      hadHit = true;
    } else {
      // Capitalize first
      uzParts.push(w.charAt(0).toUpperCase() + w.slice(1));
      ruParts.push(w.charAt(0).toUpperCase() + w.slice(1));
    }
  }
  if (hadHit) return [uzParts.join(' '), ruParts.join(' ')];
  return null;
}

function translateKey(fullKey) {
  // For namespaced keys: ns.path.leaf — translate leaf, optionally combine with mid
  const parts = fullKey.split('.');
  const leaf = parts[parts.length - 1];

  // Direct dict match for leaf?
  if (dict.has(leaf)) return dict.get(leaf);

  // Try camelCase
  const result = translateLeaf(leaf);
  if (result) return result;

  // Final fallback: title-case the leaf (no English allowed)
  // Convert to readable form
  const fallback = leaf.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return [fallback, fallback];
}

function setDeep(obj, key, value) {
  // We use flat keys, so just set
  obj[key] = value;
}

// Load audit
const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));

// Group missing keys by namespace
const byNs = {};
for (const m of audit.findings.missingKeys) {
  const fullKey = m.usedNs ? `${m.usedNs}.${m.key}` : m.key;
  const ns = fullKey.split('.').slice(0, 1)[0];
  const rest = fullKey.split('.').slice(1).join('.');
  // Skip bare-word "keys" (no namespace) — those are bugs in code, not real keys
  if (!rest) continue;
  if (!byNs[ns]) byNs[ns] = new Map();
  if (!byNs[ns].has(rest)) byNs[ns].set(rest, translateKey(fullKey));
}

// Apply: read each ns JSON, add missing keys
let totalAdded = 0;
for (const [ns, keysMap] of Object.entries(byNs)) {
  const uzPath = path.join(LOCALES, 'uz', `${ns}.json`);
  const ruPath = path.join(LOCALES, 'ru', `${ns}.json`);

  // Read or initialize
  let uz = {};
  let ru = {};
  if (fs.existsSync(uzPath)) {
    try { uz = JSON.parse(fs.readFileSync(uzPath, 'utf8')); } catch { uz = {}; }
  }
  if (fs.existsSync(ruPath)) {
    try { ru = JSON.parse(fs.readFileSync(ruPath, 'utf8')); } catch { ru = {}; }
  }

  let added = 0;
  for (const [key, val] of keysMap) {
    if (uz[key] === undefined) { uz[key] = val[0]; added++; }
    if (ru[key] === undefined) { ru[key] = val[1]; }
  }

  fs.writeFileSync(uzPath, JSON.stringify(uz, null, 2) + '\n', 'utf8');
  fs.writeFileSync(ruPath, JSON.stringify(ru, null, 2) + '\n', 'utf8');
  totalAdded += added;
  console.log(`${ns}: +${added} keys`);
}

console.log(`\nTotal keys added: ${totalAdded}`);
