#!/usr/bin/env node
/**
 * i18n-fix-console-gaps.mjs
 *
 * Adds the i18n keys that fire "[i18n] Missing key …" warnings in the browser
 * console (MobileSidebar, CRM, HR, Sales, Kanban, recruiting, etc.).
 *
 * Design notes:
 *   - The custom loader (src/lib/i18n/loader.ts) does a FLAT lookup
 *     `moduleData[key]`. tLabel('ns.A.b', fb) splits at the FIRST dot, so the
 *     real key is everything after it — often a dotted/odd string like
 *     "CompanyStateWidget.foydaMaqsad" or ".qongiroq". We therefore set the
 *     EXACT flat key string (NO nesting). This matches what the console logged.
 *   - ADD-ONLY: an existing key in any locale file is never overwritten.
 *   - uz + ru are authored here; uz-cyr is derived deterministically via the
 *     project's transliterator (the same one that generated the uz-cyr files),
 *     unless an explicit `cyr` override is given (brand names, language names).
 *
 * Run:
 *   node scripts/i18n-fix-console-gaps.mjs --dry   # preview (no writes)
 *   node scripts/i18n-fix-console-gaps.mjs         # apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translitLatToCyr } from '../_tlabel_tmp/translit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOC = path.join(ROOT, 'artifacts/erp-dashboard/src/locales');
const DRY = process.argv.includes('--dry');

/**
 * DATA[ns][flatKey] = { uz, ru, cyr? }
 *  - flatKey is the EXACT string the loader looks up (as seen in the console).
 *  - cyr is optional; when omitted we transliterate `uz`.
 */
const DATA = {
  // ─── navigation (MobileSidebar.tsx, Departments.tsx) ──────────────────────
  navigation: {
    menyu:        { uz: 'Menyu',          ru: 'Меню' },
    euro:         { uz: 'Euro',           ru: 'Euro',          cyr: 'Euro' },  // brand logo
    print:        { uz: 'Print',          ru: 'Print',         cyr: 'Print' }, // brand logo
    close2:       { uz: 'Yopish',         ru: 'Закрыть' },
    modullar:     { uz: 'Modullar',       ru: 'Модули' },
    yangiVazifa1: { uz: 'Yangi vazifa',   ru: 'Новая задача' },
    help:         { uz: 'Yordam',         ru: 'Помощь' },
    fikr:         { uz: 'Fikr bildirish', ru: 'Обратная связь' },
    HR:           { uz: 'HR',             ru: 'HR',            cyr: 'HR' },     // acronym
  },

  // ─── finance (SalesOrdersDialogs.tsx) ─────────────────────────────────────
  finance: {
    paymentTerms:   { uz: "To'lov shartlari",       ru: 'Условия оплаты' },
    deliveryStatus: { uz: 'Yetkazib berish holati', ru: 'Статус доставки' },
  },

  // ─── crm (QuickCreateModalTypes, crm-types, RobotsViewTypes, EntityCard) ──
  crm: {
    'source.call':    { uz: "Qo'ng'iroq", ru: 'Звонок' },
    'source.webform': { uz: 'Veb-forma',  ru: 'Веб-форма' },
    'source.web':     { uz: 'Veb-sayt',   ru: 'Веб-сайт' },
    'source.inbound': { uz: 'Kiruvchi',   ru: 'Входящий' },
    'source.partner': { uz: 'Hamkor',     ru: 'Партнёр' },
    'source.other':   { uz: 'Boshqa',     ru: 'Другое' },
    'currency.uzs':   { uz: "UZS — So'm", ru: 'UZS — Сум' },
    'currency.usd':   { uz: 'USD — Dollar', ru: 'USD — Доллар' },
    'currency.eur':   { uz: 'EUR — Yevro',  ru: 'EUR — Евро' },
    'currency.rub':   { uz: 'RUB — Rubl',   ru: 'RUB — Рубль' },

    'crm-.bosqichOzgarganda':     { uz: "Bosqich o'zgarganda",    ru: 'При смене этапа' },
    'crm-.yaratilganda':          { uz: 'Yaratilganda',           ru: 'При создании' },
    'crm-.maydonOzgarganda':      { uz: "Maydon o'zgarganda",     ru: 'При изменении поля' },
    'crm-.vaqtOtganda':           { uz: "Vaqt o'tganda",          ru: 'По истечении времени' },
    'crm-.xabarYuborish':         { uz: 'Xabar yuborish',         ru: 'Отправить сообщение' },
    'crm-.vazifaYaratish':        { uz: 'Vazifa yaratish',        ru: 'Создать задачу' },
    'crm-.bosqichniOzgartirish':  { uz: "Bosqichni o'zgartirish", ru: 'Изменить этап' },
    'crm-.maydonniOzgartirish':   { uz: "Maydonni o'zgartirish",  ru: 'Изменить поле' },
    'crm-.emailYuborish':         { uz: 'Email yuborish',         ru: 'Отправить email', cyr: 'Email юбориш' },
    'crm-.yoqotildi':             { uz: "Yo'qotildi",             ru: 'Потерян' },
    'crm-.yangi':                 { uz: 'Yangi',                  ru: 'Новый' },
    'crm-.tolovKutilmoqda':       { uz: "To'lov kutilmoqda",      ru: 'Ожидание оплаты' },
    'crm-.buyurtma':              { uz: 'Buyurtma',               ru: 'Заказ' },
    'crm-.yetkazishKutilmoqda':   { uz: 'Yetkazish kutilmoqda',   ru: 'Ожидание доставки' },
    'crm-.yetkazish':             { uz: 'Yetkazish',              ru: 'Доставка' },
    'crm-.korildi':               { uz: "Ko'rildi",               ru: 'Просмотрено' },
    'crm-.qismanTolandi':         { uz: "Qisman to'landi",        ru: 'Частично оплачено' },
    'crm-.tolandi':               { uz: "To'landi",               ru: 'Оплачено' },
    'crm-.bekorQilindi':          { uz: 'Bekor qilindi',          ru: 'Отменён' },
    'crm-.lidlar':                { uz: 'Lidlar',                 ru: 'Лиды' },
    'crm-.bitimlar':              { uz: 'Bitimlar',               ru: 'Сделки' },
    'crm-.kontaktlar':            { uz: 'Kontaktlar',             ru: 'Контакты' },
    'crm-.kompaniyalar':          { uz: 'Kompaniyalar',           ru: 'Компании' },
    'crm-.takliflar':             { uz: 'Takliflar',              ru: 'Предложения' },
    'crm-.fakturalar':            { uz: 'Fakturalar',             ru: 'Счета' },
    'crm-.robotlar':              { uz: 'Robotlar',               ru: 'Роботы' },

    'RobotsView.yaratilganda':         { uz: 'Yaratilganda',           ru: 'При создании' },
    'RobotsView.bosqichOzgarganda':    { uz: "Bosqich o'zgarganda",    ru: 'При смене этапа' },
    'RobotsView.maydonOzgarganda':     { uz: "Maydon o'zgarganda",     ru: 'При изменении поля' },
    'RobotsView.vaqtOtganda':          { uz: "Vaqt o'tganda",          ru: 'По истечении времени' },
    'RobotsView.xabarnomaYuborish':    { uz: 'Xabarnoma yuborish',     ru: 'Отправить уведомление' },
    'RobotsView.vazifaYaratish':       { uz: 'Vazifa yaratish',        ru: 'Создать задачу' },
    'RobotsView.bosqichniOzgartirish': { uz: "Bosqichni o'zgartirish", ru: 'Изменить этап' },
    'RobotsView.emailYuborish':        { uz: 'Email yuborish',         ru: 'Отправить email', cyr: 'Email юбориш' },
    'RobotsView.telegramYuborish':     { uz: 'Telegram yuborish',      ru: 'Отправить Telegram' },

    'EntityCard.qongiroq': { uz: "Qo'ng'iroq", ru: 'Звонок' },
    'EntityCard.orta':     { uz: "→ O'rta",    ru: '→ Средний' },
  },

  // ─── hr (HRDashboard, MarketHeatBadge, DocumentWorkflow, alert types) ─────
  hr: {
    '.alertlar':      { uz: 'Alertlar',      ru: 'Оповещения' },
    '.kadrlar':       { uz: 'Kadrlar',       ru: 'Кадры' },
    '.xavfsizlik':    { uz: 'Xavfsizlik',    ru: 'Безопасность' },
    '.ogohlantirish': { uz: 'Ogohlantirish', ru: 'Предупреждение' },
    '.malumot':       { uz: "Ma'lumot",      ru: 'Информация' },
    '.orta':          { uz: "O'rta",         ru: 'Средний' },

    'HRDashboard.hujjatOqimi':         { uz: 'Hujjat Oqimi',         ru: 'Документооборот' },
    'HRDashboard.kunlikHisobot':       { uz: 'Kunlik Hisobot',       ru: 'Ежедневный отчёт' },
    'HRDashboard.pipRejalar':          { uz: 'PIP Rejalar',          ru: 'PIP планы' },
    'HRDashboard.enpsSorov':           { uz: "eNPS So'rov",          ru: 'eNPS опрос' },
    'HRDashboard.malakalarMatritsasi': { uz: 'Malakalar Matritsasi', ru: 'Матрица навыков' },

    'MarketHeatBadge.tsx.qizginBozor':  { uz: "Qizg'in bozor",  ru: 'Горячий рынок' },
    'MarketHeatBadge.tsx.ortachaBozor': { uz: "O'rtacha bozor", ru: 'Средний рынок' },

    qadamTartibi:        { uz: 'Qadam tartibi',      ru: 'Порядок шага' },
    marshrutlashTuri:    { uz: 'Marshrutlash turi',  ru: 'Тип маршрутизации' },
    darajaYuqoriga:      { uz: 'Daraja (yuqoriga)',  ru: 'Уровней вверх' },
    masalanHrMenejerDirektorBosh: { uz: 'Masalan: HR menejer, direktor, bosh...', ru: 'Например: HR-менеджер, директор, нач...' },
    muddatSoat:          { uz: 'Muddat (soat)',      ru: 'Срок (часов)' },
    k1EslatmaSoatQolgunicha: { uz: '1-eslatma (necha soat qolganda)', ru: 'Напоминание 1 (за сколько часов)' },
    k2EslatmaSoatQolgunicha: { uz: '2-eslatma (necha soat qolganda)', ru: 'Напоминание 2 (за сколько часов)' },
    haliMarshrutlashQoidasiYoqYuqoridagi: {
      uz: "Hali marshrutlash qoidasi yo'q. Yuqoridagi shakl orqali qo'shing.",
      ru: 'Пока нет правил маршрутизации. Добавьте через форму выше.',
    },

    // ─── employee profile (EmployeeProfile t=hr) + contract types (WorkTabContractSection t=hr) ──
    //     owner 2026-06-17 console-gap cleanup. These t() calls resolve in the `hr` namespace.
    toshkentShahri:      { uz: 'Toshkent shahri',           ru: 'город Ташкент' },
    uzbekistan:          { uz: "O'zbekiston",               ru: 'Узбекистан' },
    xalqBanki:           { uz: 'Xalq banki',                ru: 'Народный банк' },
    ismFamiliya:         { uz: 'Ism Familiya',              ru: 'Имя Фамилия' },
    otaOnaTurmushORtogI: { uz: "Ota-ona / turmush o'rtog'i", ru: 'Родитель / супруг(а)' },
    muddatsiz:           { uz: 'Muddatsiz',                 ru: 'Бессрочный' },
    muddatli:            { uz: 'Muddatli',                  ru: 'Срочный' },
    sinovMuddati:        { uz: 'Sinov muddati',             ru: 'Испытательный срок' },
    loyihaAsosida:       { uz: 'Loyiha asosida',            ru: 'На проектной основе' },
  },

  // ─── production (CandidateChecklistTypes.ts) ──────────────────────────────
  production: {
    'CandidateChecklist.cvQabulQilindiVaRoyxatga':            { uz: "CV qabul qilindi va ro'yxatga kiritildi",   ru: 'CV принято и зарегистрировано' },
    'CandidateChecklist.cvSkriningOtkazildiMaterial52':       { uz: "CV skrining o'tkazildi (Material №52)",      ru: 'Проведён скрининг CV (Материал №52)' },
    'CandidateChecklist.telefonSuhbatiOtkazildiMaterial53':   { uz: "Telefon suhbati o'tkazildi (Material №53)",  ru: 'Проведено телефонное интервью (Материал №53)' },
    'CandidateChecklist.mahsuldorlikAnketaToldirildi':        { uz: "Mahsuldorlik anketa to'ldirildi",            ru: 'Анкета продуктивности заполнена' },
    'CandidateChecklist.fonTekshiruviIjtimoiyTarmoqlarMat':   { uz: 'Fon tekshiruvi (ijtimoiy tarmoqlar, Mat. №54)', ru: 'Фоновая проверка (соцсети, Мат. №54)' },
    'CandidateChecklist.asosiySuhbatOtkazildiMaterial11':     { uz: "Asosiy suhbat o'tkazildi (Material №11)",    ru: 'Проведено основное собеседование (Материал №11)' },
    'CandidateChecklist.hrCapitalToolTestOtkazildi':          { uz: "HR Capital TOOL TEST o'tkazildi (A-J)",      ru: 'Проведён HR Capital TOOL TEST (A-J)' },
    'CandidateChecklist.aiSuhbatErpTizimidaOtkazildi':        { uz: "AI Suhbat (ERP tizimida) o'tkazildi",        ru: 'Проведено AI-собеседование (в системе ERP)' },
    'CandidateChecklist.material46MahsuldorlikShakliToldirildi': { uz: "Material №46 — Mahsuldorlik shakli to'ldirildi", ru: 'Материал №46 — Форма продуктивности заполнена' },
    'CandidateChecklist.tavsiyalarTekshirildiReferenceCheck': { uz: 'Tavsiyalar tekshirildi (Reference check)',   ru: 'Рекомендации проверены (Reference check)' },
    'CandidateChecklist.taklifYuborildiOgzakiTaklifBerildi':  { uz: "Taklif yuborildi / og'zaki taklif berildi",  ru: 'Оффер отправлен / устный оффер сделан' },
    'CandidateChecklist.30KunBaholashSuhbatiOtkazildi':       { uz: "30-kun baholash suhbati o'tkazildi",         ru: 'Проведено оценочное интервью 30-го дня' },
  },

  // ─── common (widgets, CRM KPI cards, SD, Papka, order-constants, HR Capital
  //     personality model, recruiting helpers, Kanban, language switcher) ────
  common: {
    'LanguageSwitcher.tsx.ozbekcha': { uz: "O'zbekcha", ru: "O'zbekcha", cyr: "O'zbekcha" },
    'LanguageSwitcher.tsx.untitled': { uz: 'Русский',   ru: 'Русский',   cyr: 'Русский' },

    'CompanyStateWidget.foydaMaqsad':   { uz: 'Foyda / Maqsad',   ru: 'Прибыль / Цель' },
    'CompanyStateWidget.daromadMaqsad': { uz: 'Daromad / Maqsad', ru: 'Доход / Цель' },

    'SDCustomers.yangi':      { uz: 'Yangi',         ru: 'Новый' },
    'SDCustomers.nofaol':     { uz: 'Nofaol',        ru: 'Неактивный' },
    'SDCustomers.qoraRoyxat': { uz: "Qora ro'yxat",  ru: 'Чёрный список' },

    'CRMKpiCards.tsx.jamiVazifalar':  { uz: 'Jami vazifalar',  ru: 'Всего задач' },
    'CRMKpiCards.tsx.jarayondagilar': { uz: 'Jarayondagilar',  ru: 'В процессе' },
    'CRMKpiCards.tsx.yakunlangan':    { uz: 'Yakunlangan',     ru: 'Завершённые' },

    'SDSalesQuotes.cFlute4mmOrta': { uz: "C-flute 4mm (O'rta)",   ru: 'C-flute 4mm (Средний)' },
    'SDSalesQuotes.bossiz':        { uz: 'Bossiz',                ru: 'Без печати' },
    'SDSalesQuotes.4RangToliqCmyk': { uz: "4 rang (To'liq CMYK)", ru: '4 цвета (Полный CMYK)' },

    'PapkaOrders.yangi':           { uz: 'Yangi',            ru: 'Новый' },
    'PapkaOrders.rejalashtirish':  { uz: 'Rejalashtirish',   ru: 'Планирование' },
    'PapkaOrders.ishlabChiqarish': { uz: 'Ishlab chiqarish', ru: 'Производство' },
    'PapkaOrders.bekorQilindi':    { uz: 'Bekor qilindi',    ru: 'Отменён' },
    'PapkaOrders.untitled':        { uz: 'Papka buyurtmalari', ru: 'Заказы папок', cyr: 'Папка буюртмалари' },

    'order-constants.quti':      { uz: 'Quti',          ru: 'Коробка' },
    'order-constants.l':         { uz: 'Lotok',         ru: 'Лоток', cyr: 'Лоток' },
    'order-constants.qogoz':     { uz: "Qog'oz",        ru: 'Бумага' },
    'order-constants.yangi':     { uz: 'Yangi',         ru: 'Новый' },
    'order-constants.00Rangsiz': { uz: '0+0 (Rangsiz)', ru: '0+0 (Без цвета)' },

    'translations.yangiBuyurtmaYaratish': { uz: 'Yangi buyurtma yaratish', ru: 'Создать новый заказ' },
    'translations.untitled':              { uz: 'Yangi buyurtma yaratish', ru: 'Создать новый заказ' },

    'Positions.standartXodim':                  { uz: 'Standart xodim',  ru: 'Стандартный сотрудник' },
    'Positions.davomatSifatVazifalarLmsJamoa':  { uz: 'Davomat, sifat, vazifalar, LMS, jamoa ishlashi', ru: 'Посещаемость, качество, задачи, LMS, командная работа' },
    'Positions.mashinOperatori':                { uz: 'Mashina operatori', ru: 'Оператор машины' },
    'Positions.ishlabChiqarishNuqsonlarIshVaqti': { uz: 'Ishlab chiqarish, nuqsonlar, ish vaqti, xavfsizlik', ru: 'Производство, брак, рабочее время, безопасность' },
    'Positions.sotuvMenejeri':                  { uz: 'Sotuv menejeri', ru: 'Менеджер по продажам' },
    'Positions.daromadBitimlarLeadKonversiyasiNps': { uz: 'Daromad, bitimlar, lead konversiyasi, NPS', ru: 'Доход, сделки, конверсия лидов, NPS' },
    'PositionsSections.sht':                    { uz: 'Shtat', ru: 'Штат', cyr: 'Штат' },

    'ReferralPage.kutilmoqda': { uz: 'Kutilmoqda', ru: 'Ожидается' },

    // HR Capital personality model (A-J) — types.ts
    '.aDiqqat':                       { uz: 'A — Diqqat (Внимание)',     ru: 'A — Внимание' },
    '.tafsilotlargaEtiborZiyraklik':  { uz: "Tafsilotlarga e'tibor, ziyraklik", ru: 'Внимание к деталям, бдительность' },
    '.bStrategiya':                   { uz: 'B — Strategiya (Стратегия)', ru: 'B — Стратегия' },
    '.uzoqniKorishRejalashtirish':    { uz: "Uzoqni ko'rish, rejalashtirish", ru: 'Дальновидность, планирование' },
    '.cNazorat':                      { uz: 'C — Nazorat (Контроль)',    ru: 'C — Контроль' },
    '.emotsiyalarniBoshqarishSakinBolish': { uz: "Emotsiyalarni boshqarish, sokin bo'lish", ru: 'Управление эмоциями, спокойствие' },
    '.dIshonch':                      { uz: 'D — Ishonch (Уверенность)', ru: 'D — Уверенность' },
    '.ozigaVaQarorlarigaIshonch':     { uz: "O'ziga va qarorlariga ishonch", ru: 'Уверенность в себе и решениях' },
    '.eEnergiya':                     { uz: 'E — Energiya (Энергия)',    ru: 'E — Энергия' },
    '.fQatiylik':                     { uz: "F — Qat'iylik (Решительность)", ru: 'F — Решительность' },
    '.gBardosh':                      { uz: 'G — Bardosh (Оборона)',     ru: 'G — Стойкость' },
    '.hTaktika':                      { uz: 'H — Taktika (Тактика)',     ru: 'H — Тактика' },
    '.iEmpatiya':                     { uz: 'I — Empatiya (Эмпатия)',    ru: 'I — Эмпатия' },
    '.jMuloqot':                      { uz: 'J — Muloqot (Общение)',     ru: 'J — Общение' },
    '.kommunikatsiyaAloqaOrnatish':   { uz: "Kommunikatsiya, aloqa o'rnatish", ru: 'Коммуникация, налаживание контакта' },

    // CRM contact quick-message templates — types.ts
    '.qongiroq': { uz: "Qo'ng'iroq", ru: 'Звонок' },
    '.orta':     { uz: "O'rta",      ru: 'Средний' },
    '.oldingiSuhbatimizBoyichaXabarBerishni':   { uz: "Oldingi suhbatimiz bo'yicha xabar berishni istedim...", ru: 'Хотел сообщить по нашему предыдущему разговору...' },
    '.sizgaMaxsusTaklifimizBor':                { uz: 'Sizga maxsus taklifimiz bor...', ru: 'У нас есть для вас специальное предложение...' },
    '.uchrashuvimizHaqidaEslatibOtmoqchiman':   { uz: "Uchrashuvimiz haqida eslatib o'tmoqchiman...", ru: 'Хочу напомнить о нашей встрече...' },

    // ProductivityInterviewDialog
    'ProductivityInterviewDialog.masuliyatVaMajburiyatAsosidaIshlaydi': { uz: "Mas'uliyat va majburiyat asosida ishlaydi. Jamiyat va kompaniya oldidagi burch tuyg'usi.", ru: 'Работает на основе ответственности и долга. Чувство долга перед обществом и компанией.' },
    'ProductivityInterviewDialog.etiqod': { uz: "E'tiqod", ru: 'Убеждённость' },
    'ProductivityInterviewDialog.ishigaIshonadiMissiyagaMosHarakat': { uz: "Ishiga ishonadi, missiyaga mos harakat qiladi. Ichki qadriyatlar va g'oyaviy motivatsiya.", ru: 'Верит в своё дело, действует согласно миссии. Внутренние ценности и идейная мотивация.' },
    'ProductivityInterviewDialog.natijaVaMukofotUchunIshlaydi': { uz: "Natija va mukofot uchun ishlaydi. O'sish imkoniyatlari, karyera va professional rivojlanish.", ru: 'Работает ради результата и вознаграждения. Возможности роста, карьера и профессиональное развитие.' },
    'ProductivityInterviewDialog.asosanModdiyManfaatUchunIshlaydi': { uz: 'Asosan moddiy manfaat uchun ishlaydi. Ish haqining muhimligi birinchi o\'rinda.', ru: 'Работает в основном ради материальной выгоды. Важность зарплаты на первом месте.' },
    'ProductivityInterviewDialog.yakuniyXulosa': { uz: 'Yakuniy xulosa', ru: 'Итоговое заключение' },

    'CandidateReportDialog.etiqod': { uz: "E'tiqod", ru: 'Убеждённость' },

    // recruiting helpers + kanban + candidate card
    'helpers-constants.tsx.yangiAriza':           { uz: 'Yangi ariza',            ru: 'Новая заявка' },
    'helpers-constants.tsx.suhbatOtdi':           { uz: "Suhbat o'tdi",           ru: 'Собеседование пройдено' },
    'helpers-constants.tsx.tavsiyalarTekshiruvi': { uz: 'Tavsiyalar tekshiruvi',  ru: 'Проверка рекомендаций' },
    'helpers-constants.tsx.elonBerildi':          { uz: "E'lon berildi",          ru: 'Объявление размещено' },
    'helpers-constants.tsx.untitled':             { uz: 'Kutilmoqda',             ru: 'Ждёт', cyr: 'Кутилмоқда' },
    'helpers-channel-status.untitled': { uz: 'Kutilmoqda', ru: 'Ждёт', cyr: 'Кутилмоқда' },
    'KanbanColumn.tsx.yuklanmoqda': { uz: 'Yuklanmoqda...', ru: 'Загрузка...' },
    'KanbanColumn.tsx.bosh':        { uz: "Bo'sh",          ru: 'Пусто' },
    'CandidateCard.tsx.radEtish':   { uz: 'Rad etish',      ru: 'Отклонить' },
    'CandidateCard.tsx.bekorQilish': { uz: 'Bekor qilish',  ru: 'Отменить' },

    // ─── warehouse dashboard (WarehouseDashboardPage.tsx, tLabel 'common.whDash.*') ──
    //     owner 2026-06-17 console-gap cleanup. uz = the exact in-source fallback.
    'whDash.title':       { uz: 'Ombor — Moliya nazorati',  ru: 'Склад — Финансовый контроль' },
    'whDash.error':       { uz: 'Xato',                     ru: 'Ошибка' },
    'whDash.totalValue':  { uz: 'Jami qiymat',              ru: 'Общая стоимость' },
    'whDash.sum':         { uz: "so'm",                     ru: 'сум' },
    'whDash.warehouses':  { uz: 'Omborlar',                 ru: 'Склады' },
    'whDash.stocked':     { uz: 'qoldiqli / jami',          ru: 'с остатком / всего' },
    'whDash.stockLines':  { uz: 'Stok qatorlari',           ru: 'Складские строки' },
    'whDash.materials':   { uz: 'material pozitsiyasi',     ru: 'позиций материалов' },
    'whDash.lowStock':    { uz: 'Kam qoldiq',               ru: 'Низкий остаток' },
    'whDash.lowStockOk':  { uz: 'Barcha materiallar yetarli', ru: 'Всех материалов достаточно' },
    'whDash.byWarehouse': { uz: "Omborlar bo'yicha qiymat", ru: 'Стоимость по складам' },
    'whDash.empty':       { uz: "Ombor yo'q",               ru: 'Нет складов' },
    'whDash.warehouse':   { uz: 'Ombor',                    ru: 'Склад' },
    'whDash.lines':       { uz: 'Qator',                    ru: 'Строк' },
    'whDash.qty':         { uz: 'Qoldiq',                   ru: 'Остаток' },
    'whDash.value':       { uz: 'Qiymat',                   ru: 'Стоимость' },
    'whDash.recent':      { uz: "So'nggi harakatlar",       ru: 'Последние движения' },
    'whDash.noMoves':     { uz: "Harakat yo'q",             ru: 'Нет движений' },

    // ─── other seen console gaps (tLabel 'common.*') ──
    'useCRMWorkspace.kochirildi':    { uz: "Ko'chirildi",              ru: 'Перемещено' },
    'ExtraTabs.jamiBolimlarFarzand': { uz: "Jami bo'limlar (farzand)", ru: 'Всего подразделений (дочерних)' },
    'AIDesignGenerator.dizaynTasdiqlangandaPapkaordersStatusPending': { uz: "Dizayn tasdiqlanganda papkaOrders.status = \"pending_tech\" ga o'zgaradi — texnolog moduli avtomatik signal oladi", ru: 'При утверждении дизайна papkaOrders.status меняется на "pending_tech" — модуль технолога получает автоматический сигнал' },
    'IoTExtended.ogohlantirishlar':  { uz: 'Ogohlantirishlar',         ru: 'Оповещения' },

    // ─── profile/contract t() keys resolved in `common` (ContractDialog, PerformanceTabSections, etc.) ──
    abcDaraja:        { uz: 'ABC daraja',          ru: 'ABC уровень' },
    kursTugatish:     { uz: 'Kurs tugatish',       ru: 'Завершение курса' },
    samaradorlik:     { uz: 'Samaradorlik',        ru: 'Эффективность' },
    qoshimchaMalumot: { uz: "Qo'shimcha ma'lumot", ru: 'Дополнительная информация' },
    muddatli:         { uz: 'Muddatli',            ru: 'Срочный' },
    sinovMuddati:     { uz: 'Sinov muddati',       ru: 'Испытательный срок' },
  },
};

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, obj) {
  if (DRY) return;
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

let grandAdded = 0, grandSkipped = 0;
const addedSamples = [];

for (const [ns, entries] of Object.entries(DATA)) {
  const files = {
    uz:       path.join(LOC, 'uz',     `${ns}.json`),
    ru:       path.join(LOC, 'ru',     `${ns}.json`),
    'uz-cyr': path.join(LOC, 'uz-cyr', `${ns}.json`),
  };
  for (const [lang, fp] of Object.entries(files)) {
    if (!fs.existsSync(fp)) { console.warn(`  ! missing locale file: ${lang}/${ns}.json`); }
  }
  const uz  = fs.existsSync(files.uz)       ? readJson(files.uz)       : {};
  const ru  = fs.existsSync(files.ru)       ? readJson(files.ru)       : {};
  const cyr = fs.existsSync(files['uz-cyr']) ? readJson(files['uz-cyr']) : {};

  let added = 0, skipped = 0;
  for (const [key, v] of Object.entries(entries)) {
    const cyrVal = v.cyr ?? translitLatToCyr(v.uz);
    const targets = [[uz, v.uz], [ru, v.ru], [cyr, cyrVal]];
    for (const [obj, val] of targets) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) { skipped++; continue; }
      obj[key] = val;
      added++;
      if (addedSamples.length < 12) addedSamples.push(`${ns}.${key}`);
    }
  }
  writeJson(files.uz, uz);
  writeJson(files.ru, ru);
  writeJson(files['uz-cyr'], cyr);
  grandAdded += added; grandSkipped += skipped;
  console.log(`  ${ns.padEnd(12)} added=${String(added).padStart(3)}  already-present=${String(skipped).padStart(3)}`);
}

console.log();
console.log(`  TOTAL: added=${grandAdded}  already-present=${grandSkipped}`
  + (DRY ? '   (DRY-RUN — no files changed)' : ''));
if (addedSamples.length) console.log(`  e.g. ${addedSamples.join(', ')} …`);
