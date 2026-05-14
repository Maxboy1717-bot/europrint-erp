#!/usr/bin/env node
// Add bare-word missing keys to common.json
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const LOCALES = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src', 'locales');
const AUDIT = path.resolve(ROOT, 'scripts', 'i18n-full-audit.json');

const dict = new Map(Object.entries({
  dona: ['dona', 'шт'],
  cancelledDesc: ['Bekor qilingan', 'Отменено'],
  Tayyor: ['Tayyor', 'Готово'],
  Mahsulot: ['Mahsulot', 'Продукт'],
  hrEmail: ['HR email', 'HR email'],
  cashFlowManagement: ['Pul oqimi boshqaruvi', 'Управление денежным потоком'],
  currentBalance: ['Joriy qoldiq', 'Текущий баланс'],
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
  submitBtnWait: ['Yuborilmoqda...', 'Отправляется...'],
  submitBtn: ['Yuborish', 'Отправить'],
  connected: ['Ulangan', 'Подключено'],
  aiTyping: ['AI yozmoqda...', 'AI печатает...'],
  typeAnswer: ['Javobni yozing...', 'Введите ответ...'],
  micOff: ["Mikrofon o'chirilgan", 'Микрофон выключен'],
  micOn: ['Mikrofon yoqilgan', 'Микрофон включён'],
  chars: ['belgi', 'симв.'],
  finishBtn: ['Yakunlash', 'Завершить'],
  nextBtn: ['Keyingi', 'Далее'],
  expiredDesc: ['Muddati tugadi', 'Срок истёк'],
  invalid: ["Noto'g'ri", 'Недопустимо'],
  invalidDesc: ["Noto'g'ri ma'lumot", 'Неверные данные'],
  newHrLink: ['Yangi HR havolasi', 'Новая HR-ссылка'],
  completedDesc: ['Suhbat yakunlandi', 'Интервью завершено'],
  hrContact: ['HR aloqasi', 'HR контакт'],
  camera: ['Kamera', 'Камера'],
  mic: ['Mikrofon', 'Микрофон'],
  checkDevices: ['Qurilmalarni tekshirish', 'Проверить устройства'],
  proceed: ['Davom etish', 'Продолжить'],
  questions: ['Savollar', 'Вопросы'],
  voiceText: ['Ovozli matn', 'Голосовой текст'],
  secure: ['Xavfsiz', 'Защищено'],
  tip1: ['Toza fonda turing', 'Используйте чистый фон'],
  tip2: ['Yorug\'lik yaxshi bo\'lsin', 'Хорошее освещение'],
  tip3: ['Yaqindan turing', 'Подойдите ближе'],
  tip4: ['Ovozli javob bering', 'Отвечайте голосом'],
  startInterview: ['Suhbatni boshlash', 'Начать интервью'],
  purchases: ['Xaridlar', 'Закупки'],
  taxes: ['Soliqlar', 'Налоги'],
  loan: ['Kredit', 'Кредит'],
  netCashFlow: ['Sof pul oqimi', 'Чистый денежный поток'],
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
  Bekor: ['Bekor', 'Отмена'],
  Saqlash: ['Saqlash', 'Сохранить'],
  Tejash: ['Tejash', 'Экономия'],
  SOS: ['SOS', 'SOS'],
  STOP: ['STOP', 'СТОП'],
  BRAK: ['BRAK', 'БРАК'],
  SOZLANMOQDA: ['SOZLANMOQDA', 'НАСТРАИВАЕТСЯ'],
  ISHLAMOQDA: ['ISHLAMOQDA', 'РАБОТАЕТ'],
  Maqsad: ['Maqsad', 'Цель'],
  Operator: ['Operator', 'Оператор'],
  Bajarilish: ['Bajarilish', 'Выполнение'],
  Oddiy: ['Oddiy', 'Обычный'],
  s: ['s', 'с'],
  d: ['d', 'д'],
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
  Holat: ['Holat', 'Статус'],
  Yaratilgan: ['Yaratilgan', 'Создано'],
  Amallar: ['Amallar', 'Действия'],
  Tayyorlash: ['Tayyorlash', 'Подготовка'],
  Batafsil: ['Batafsil', 'Подробнее'],
  Izohlang: ['Izohlang', 'Прокомментируйте'],
  Yuklanmoqda: ['Yuklanmoqda', 'Загрузка'],
  Qidirish: ['Qidirish', 'Поиск'],
}));

const audit = JSON.parse(fs.readFileSync(AUDIT, 'utf8'));

const uzCommon = JSON.parse(fs.readFileSync(path.join(LOCALES, 'uz', 'common.json'), 'utf8'));
const ruCommon = JSON.parse(fs.readFileSync(path.join(LOCALES, 'ru', 'common.json'), 'utf8'));

let added = 0;
for (const m of audit.findings.missingKeys) {
  const fullKey = m.usedNs ? `${m.usedNs}.${m.key}` : m.key;
  if (fullKey.includes('.')) continue; // namespaced — handled by previous script

  // Strip trailing ellipsis/dots and common punctuation for lookup
  const cleaned = fullKey.replace(/[.…!?]+$/, '');
  if (!dict.has(cleaned) && !dict.has(fullKey)) continue;

  const tr = dict.get(cleaned) || dict.get(fullKey);
  if (uzCommon[fullKey] === undefined) { uzCommon[fullKey] = tr[0]; added++; }
  if (ruCommon[fullKey] === undefined) { ruCommon[fullKey] = tr[1]; }
}

fs.writeFileSync(path.join(LOCALES, 'uz', 'common.json'), JSON.stringify(uzCommon, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(LOCALES, 'ru', 'common.json'), JSON.stringify(ruCommon, null, 2) + '\n', 'utf8');
console.log(`Added ${added} bare-word keys to common.json`);
