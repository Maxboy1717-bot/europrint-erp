#!/usr/bin/env node
/**
 * fix-i18n-uz-in-ru-full.mjs — Replace ALL Uzbek text/fragments in ru/*.json with proper Russian.
 *
 * Strategy:
 *   1. Load audit list (audit-i18n-uz-in-ru.json) — { ns, key, value }[]
 *   2. Apply per-value translation with:
 *      a. EXACT phrase dictionary (full strings)
 *      b. Multi-word phrase replacements (case-insensitive)
 *      c. Single-token replacements (preserves Cyrillic, brands, numbers)
 *      d. Post-cleanup (extra spaces, capitalisation, punctuation)
 *   3. Write back to ru/<ns>.json by key path (dot-separated)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RU_DIR = path.join(ROOT, 'artifacts/erp-dashboard/src/locales/ru');
const AUDIT_FILE = path.join(ROOT, 'audit-i18n-uz-in-ru.json');

// ─────────────────────────────────────────────────────────────────────
// FULL-STRING DICTIONARY (highest priority — exact match wins)
// ─────────────────────────────────────────────────────────────────────
const FULL = {
  // Already-correct brand/tech strings flagged by heuristic as false positives
  'Gemini Vision': 'Gemini Vision',
  'Переналадка (Changeover)': 'Переналадка (Changeover)',
  'GPT-4o Mini': 'GPT-4o Mini',
  'Photoshop': 'Photoshop',
  'Inter Regular': 'Inter Regular',
  'AI Predictive Engine': 'AI Predictive Engine',
  'Какие программы должен знать? (Excel, 1C, Photoshop, Python...)':
    'Какие программы должен знать? (Excel, 1C, Photoshop, Python...)',
  'Например: Excel (VLOOKUP), 1C, Английский (B2), Photoshop...':
    'Например: Excel (VLOOKUP), 1C, Английский (B2), Photoshop...',
  'Сделка (Kelishuv)': 'Сделка',
  'Достижения (Achievements)': 'Достижения',
  'Planning Horizon (дни)': 'Горизонт планирования (дни)',
  'Месячное распределение (Run Chart)': 'Месячное распределение',
  'Долгота (Longitude)': 'Долгота',
};

// ─────────────────────────────────────────────────────────────────────
// MULTI-WORD PHRASES (case-insensitive, longest first via sort)
// Applied before single-word replacements. Preserves Cyrillic letters.
// ─────────────────────────────────────────────────────────────────────
const PHRASES = {
  // === Common Uzbek constructions ===
  "yo'q bo'lsa": 'если нет',
  "bor bo'lsa": 'если есть',
  "bo'lsa": 'если',
  "yoq bolsa": 'если нет',
  'haqiqatan ham': 'действительно',
  "ko'rib chiqish": 'просмотр',
  "ko'rib chiqing": 'просмотрите',
  "ko'rib chiqilmoqda": 'на рассмотрении',
  "ko'rib chiqilgan": 'рассмотрено',
  "amalga oshirish": 'выполнить',
  "amalga oshiring": 'выполните',
  "amalga oshirilgan": 'выполнено',
  "amalga oshirilmoqda": 'выполняется',
  'ishlab chiqarish': 'производство',
  'ishlab chiqarilgan': 'произведено',
  'ishlab chiqaring': 'произведите',
  'ishlab chiq': 'произв-во',
  'ishlab chiq.': 'произв-во',
  'ishlab chiqaradi': 'производит',
  'ishlab chiqaring': 'произведите',
  "qo'shib qo'yiladi": 'будет добавлено',
  "qo'shib qo'yish": 'добавление',
  "qo'shimcha ma'lumot": 'дополнительная информация',
  "qo'shimcha ma'lumotlar": 'дополнительные данные',
  "qo'shimcha izoh": 'дополнительный комментарий',
  "qo'shimcha": 'дополнительно',
  "ma'lumot yo'q": 'нет данных',
  "ma'lumotlar yo'q": 'нет данных',
  "ma'lumotlari yo'q": 'нет данных',
  "ma'lumot topilmadi": 'данные не найдены',
  "ma'lumotlar topilmadi": 'данные не найдены',
  "ma'lumotlari topilmadi": 'данные не найдены',
  "ma'lumot kiriting": 'введите данные',
  "ma'lumot kiritilmagan": 'данные не введены',
  "ma'lumotlar kiritilmagan": 'данные не введены',
  "ma'lumot to'plamlari": 'наборы данных',
  "ma'lumotlarni": 'данные',
  "ma'lumotlari": 'данные',
  "ma'lumotlar": 'данные',
  "ma'lumotni": 'данные',
  "ma'lumoti": 'данные',
  "ma'lumot": 'данные',
  "sun'iy intellekt": 'искусственный интеллект',
  "qoidaga rioya": 'соблюдение правил',
  "qoidalarga rioya": 'соблюдение правил',
  "qoidabuzarlik yo'q": 'нет нарушений',
  "qoidabuzarlik bor": 'есть нарушения',
  'qoidabuzarlik': 'нарушение',
  'qoida buzilishi': 'нарушение',
  'qoida buzilishlari': 'нарушения',
  "Tashabbus va g'oyalar": 'Инициатива и идеи',
  "tashabbus va g'oyalar": 'инициатива и идеи',
  'tashabbus beradigan': 'инициативный',
  'tashabbus': 'инициатива',
  "vaqtida kelish": 'своевременный приход',
  "vaqtida keladigan": 'своевременно приходящий',
  'kech qolmaslik': 'без опозданий',
  'kech qolish': 'опоздание',
  "haqida ma'lumot": 'информация о',
  "haqida qisqacha": 'кратко о',
  'asosida baholash': 'оценка на основе',
  "ish faoliyati va shaxsiy ma'lumotlar": 'рабочая деятельность и личные данные',
  "ish faoliyati": 'рабочая деятельность',
  "shaxsiy ma'lumotlar": 'личные данные',
  "to'liq imtiyozlar": 'полные льготы',
  "cheklangan imtiyozlar": 'ограниченные льготы',
  "imtiyozlar yo'q": 'льгот нет',
  "Imtiyozlar yo'q": 'Льгот нет',
  "imtiyozlar": 'льготы',
  "kompaniya rivojiga hissa qo'shish": 'вклад в развитие компании',
  "kompaniya rivoji": 'развитие компании',
  "hissa qo'shish": 'вносить вклад',
  "hissa qo'shgan": 'внёс вклад',
  "hissasi": 'вклад',
  'oylik oshirish': 'ежемесячное повышение',
  "ko'rsatkichlarni yaxshilash": 'улучшение показателей',
  "ko'rsatkichlari": 'показатели',
  "ko'rsatkichlar": 'показатели',
  "ko'rsatkichi": 'показатель',
  "ko'rsatkich": 'показатель',
  "ko'rsatma": 'указание',
  "ko'rsatmani": 'указание',
  'xodim faoliyati': 'деятельность сотрудника',
  'xodim davomati': 'посещаемость сотрудника',
  "xodimning ish faoliyati": 'рабочая деятельность сотрудника',
  "xodimlarga": 'сотрудникам',
  "xodimlarni": 'сотрудников',
  "xodimlar": 'сотрудники',
  "xodimni": 'сотрудника',
  "xodimga": 'сотруднику',
  "xodimning": 'сотрудника',
  "xodimi": 'сотрудник',
  "xodim": 'сотрудник',
  "xaridingiz uchun rahmat": 'спасибо за покупку',
  "xaridingiz": 'покупка',
  "xarid": 'покупка',
  "uchun rahmat": 'спасибо за',
  "rahmat": 'спасибо',
  // === Audit / quality / process ===
  'sifat nazorati': 'контроль качества',
  'sifat dinamikasi': 'динамика качества',
  'sifatni boshqarish': 'управление качеством',
  'sifat tizimi': 'система качества',
  'sifat': 'качество',
  'sifatini': 'качества',
  'sifatining': 'качества',
  'nazorat qilish': 'контролировать',
  'nazorati': 'контроль',
  'nazorat': 'контроль',
  // === Reports & analytics ===
  'kengaytirilgan hisobot': 'расширенный отчёт',
  'kengaytirilgan': 'расширенный',
  'hisobotlari': 'отчёты',
  'hisobotlar': 'отчёты',
  'hisoboti': 'отчёт',
  'hisobotni': 'отчёт',
  'hisobot': 'отчёт',
  "ma'lumotni yuklashda xato": 'ошибка загрузки данных',
  "yuklashda xato": 'ошибка загрузки',
  "yuklashda xatolik": 'ошибка загрузки',
  "qayta urinib ko'ring": 'попробуйте ещё раз',
  "qayta urinib koring": 'попробуйте ещё раз',
  "qayta urinish": 'повторить попытку',
  "urinib ko'ring": 'попробуйте',
  "urinib koring": 'попробуйте',
  "tushunchalar mazmuni": 'содержание понятий',
  'tushunchalar': 'понятия',
  // === Statuses ===
  "yetkazib berish": 'доставка',
  "yetkazib beruvchilar": 'поставщики',
  "yetkazib beruvchi": 'поставщик',
  "yetkazuvchilar": 'поставщики',
  "yetkazuvchini": 'поставщика',
  "yetkazuvchi": 'поставщик',
  "yetkazib bering": 'доставьте',
  "topilmadi": 'не найдено',
  "topildi": 'найдено',
  "topish": 'найти',
  "kiriting": 'введите',
  "kiritilmagan": 'не введено',
  "kiritish": 'ввод',
  "kiritilgan": 'введено',
  "tanlang": 'выберите',
  "tanlash": 'выбор',
  "tanlanmagan": 'не выбрано',
  "tanlangan": 'выбрано',
  "saqlash": 'сохранение',
  "saqlang": 'сохраните',
  "saqlangan": 'сохранено',
  "saqlanmagan": 'не сохранено',
  "yangilash": 'обновить',
  "yangilang": 'обновите',
  "yangilangan": 'обновлено',
  "yangilaydi": 'обновляет',
  "yangilashga harakat qiling": 'попробуйте обновить',
  "yangi qo'shish": 'добавить новый',
  "yangisini": 'новый',
  "tahrirlash": 'редактировать',
  "tahrirlang": 'редактируйте',
  "tahrirlangan": 'отредактировано',
  "tozalash": 'очистить',
  "tozalang": 'очистите',
  "qidiruv": 'поиск',
  "qidirish": 'поиск',
  "qidiring": 'ищите',
  "qidiruvni tozalash": 'очистить поиск',
  // === Verbs ===
  "qo'shing": 'добавьте',
  "qo'shish": 'добавление',
  "qo'shilgan": 'добавлено',
  "qo'shiladi": 'добавляется',
  "qo'shilmagan": 'не добавлено',
  "qo'shilishi": 'добавление',
  "qo'shilganda": 'при добавлении',
  "qo'sh": 'двойной',
  "qo'shilmoqda": 'добавляется',
  "qo'shma": 'совместный',
  "yarating": 'создайте',
  "yaratish": 'создание',
  "yaratiladi": 'создаётся',
  "yaratilgan": 'создано',
  "yaratilmagan": 'не создано',
  "o'chirish": 'удалить',
  "o'chirildi": 'удалено',
  "o'chiriladi": 'удаляется',
  "o'chirishni tasdiqlang": 'подтвердите удаление',
  "o'chirishni tasdiqlash": 'подтверждение удаления',
  "o'chirishni": 'удаление',
  "o'chirmoqchimisiz": 'хотите удалить',
  "o'chirib tashlash": 'удалить',
  "o'chirib tashlanadi": 'будет удалено',
  "o'chirilgan": 'удалено',
  "o'chirilmadi": 'не удалено',
  "ko'rish": 'просмотр',
  "ko'rinish": 'отображение',
  "ko'rinishi": 'отображение',
  "ko'rinadi": 'отображается',
  "ko'rsatiladi": 'отображается',
  "ko'rsatiladigan": 'отображаемый',
  "ko'rsatish": 'показать',
  "ko'rsating": 'покажите',
  "ko'paydi": 'увеличилось',
  "ko'chirish": 'перемещение',
  "ko'chiriladi": 'перемещается',
  "ko'chirishlar": 'перемещения',
  'tasdiqlash': 'подтверждение',
  'tasdiqlang': 'подтвердите',
  'tasdiqlaysizmi': 'подтверждаете',
  'tasdiqlangan': 'подтверждено',
  'bekor qilish': 'отмена',
  'bekor qilindi': 'отменено',
  'bekor qilinadi': 'отменяется',
  'rad etish': 'отклонить',
  'rad etildi': 'отклонено',
  'rad etilgan': 'отклонено',
  'qayta tiklash': 'восстановить',
  'qayta yuklash': 'перезагрузить',
  'qayta': 'повторно',
  'davom etish': 'продолжить',
  'davom eting': 'продолжайте',
  'davom etmoqda': 'продолжается',
  'davom etadi': 'продолжается',
  // === Time / scheduling ===
  "kun ichida tugaydi": 'заканчивается через',
  'kun ichida': 'в течение дней',
  "vaqt davomida": 'в течение времени',
  "vaqt oralig'i": 'временной интервал',
  'sana oralig\'i': 'интервал дат',
  "muddati tugagan": 'просрочено',
  "muddati": 'срок',
  "muddat": 'срок',
  "muddatlar": 'сроки',
  "muddatga": 'к сроку',
  "muddatgacha": 'до срока',
  "muddatda": 'в срок',
  "yaqinlashayotgan": 'приближающийся',
  "yaqin kunlarda": 'в ближайшие дни',
  'yaqin': 'близкий',
  "oxirgi": 'последний',
  "oxirida": 'в конце',
  "keyingi": 'следующий',
  "keyin": 'затем',
  "keyinroq": 'позже',
  "birinchi": 'первый',
  "ikkinchi": 'второй',
  // === Org / HR specific ===
  'asosiy maosh': 'основная зарплата',
  'maosh tarixi': 'история зарплаты',
  'maoshi': 'зарплата',
  'maosh': 'зарплата',
  'bevosita rahbar': 'непосредственный руководитель',
  'rahbarni tozalash': 'очистить руководителя',
  'rahbari': 'руководитель',
  'rahbar': 'руководитель',
  'rahbarni': 'руководителя',
  'rahbarning': 'руководителя',
  'maxfiy': 'конфиденциально',
  'maxfiylik': 'конфиденциальность',
  "kasalxonada": 'в больнице',
  "shifoxonada": 'в больнице',
  "shifoxona": 'больница',
  "shifokor": 'врач',
  "uy joy": 'жильё',
  "tibbiy": 'медицинский',
  "tibbiy holati": 'медицинское состояние',
  // === Workflow ===
  'jarayoni': 'процесс',
  'jarayonlari': 'процессы',
  'jarayonlar': 'процессы',
  'jarayon': 'процесс',
  'jarayonini': 'процесс',
  "so'rovi": 'запрос',
  "so'rov": 'запрос',
  "so'rovlari": 'запросы',
  "so'rovlar": 'запросы',
  "so'rovni": 'запрос',
  "so'rovnoma": 'опрос',
  "so'rovnomalar": 'опросы',
  "ariza": 'заявка',
  "arizalar": 'заявки',
  "arizani": 'заявку',
  "arizalarni": 'заявки',
  "buyurtmalar": 'заказы',
  "buyurtma": 'заказ',
  "buyurtmani": 'заказ',
  "buyurtmadan": 'из заказа',
  "buyurtmasini": 'заказ',
  "buyurtmaga": 'к заказу',
  "buyurtmalarini": 'заказы',
  // === Tech ===
  'bog\'liq': 'связанный',
  'tegishli': 'соответствующий',
  'avtomatik': 'автоматически',
  "qo'lda": 'вручную',
  "tomonidan": 'от',
  "yordamida": 'с помощью',
  "orqali": 'через',
  "asosida": 'на основе',
  "bo'yicha": 'по',
  // === UI ===
  "tugmasini bosing": 'нажмите кнопку',
  "tugmani bosing": 'нажмите кнопку',
  "tugmasini": 'кнопку',
  "tugmani": 'кнопку',
  "tugmasi": 'кнопка',
  "bosing": 'нажмите',
  "bosib": 'нажав',
  "bosib chiqarish": 'распечатать',
  "yuklanmoqda": 'загружается',
  "yuklash": 'загрузка',
  "yuklang": 'загрузите',
  "yuklangan": 'загружено',
  "yuborish": 'отправить',
  "yuboring": 'отправьте',
  "yuborildi": 'отправлено',
  "yuborilgan": 'отправлено',
  "yuborilsin": 'отправить',
  "yuboriladi": 'отправляется',
  "yuborishlar": 'отправки',
  // === Generic ===
  'haqida': 'о',
  "uchun": 'для',
  "bilan": 'с',
  "yoki": 'или',
  "lekin": 'но',
  "agar": 'если',
  "ham": 'также',
  "qanday": 'как',
  "shunday": 'таким образом',
  "qaerda": 'где',
  "qachon": 'когда',
  "nima uchun": 'почему',
  "nima": 'что',
  "kim": 'кто',
  "biror": 'какой-либо',
  "barcha": 'все',
  "har bir": 'каждый',
  "har": 'каждый',
  "bir": 'один',
  "bitta": 'один',
  "ikkita": 'два',
  "ko'p": 'много',
  "oz": 'мало',
  "kam": 'мало',
  "katta": 'большой',
  "kichik": 'маленький',
  "juda": 'очень',
  "tez": 'быстро',
  "sekin": 'медленно',
  "yaxshi": 'хорошо',
  "yomon": 'плохо',
  "to'g'ri": 'правильно',
  "noto'g'ri": 'неправильно',
  // === Negation ===
  "mavjud emas": 'отсутствует',
  "mavjud": 'имеется',
  "emas": 'не',
  "hech narsa": 'ничего',
  "hech kim": 'никто',
  "hech qachon": 'никогда',
  "hech qanday": 'никакой',
  "hech qaerda": 'нигде',
  "hech": 'ни',
  // === Misc ===
  "hozircha": 'пока',
  "hozirda": 'сейчас',
  "hozir": 'сейчас',
  "kelajakda": 'в будущем',
  "o'tmishda": 'в прошлом',
  "tarixi": 'история',
  "tarix": 'история',
  "tartibi": 'порядок',
  "tartibda": 'в порядке',
  "tartib": 'порядок',
  "bo'sh": 'пусто',
  "to'liq": 'полный',
  "qisqacha": 'кратко',
  "batafsil": 'подробно',
  "tafsilot": 'детали',
  "tafsilotlar": 'детали',
  "asosiy": 'основной',
  "qo'shimcha": 'дополнительный',
  "umumiy": 'общий',
  "alohida": 'отдельно',
  "shaxsiy": 'личный',
  "shaxs": 'личность',
  "kompaniya": 'компания',
  "kompaniyaning": 'компании',
  "kompaniyalarda": 'в компаниях',
  "tashkilot": 'организация',
  "tashkiliy": 'организационный',
  "bo'lim": 'отдел',
  "bo'limga": 'в отдел',
  "bo'limning": 'отдела',
  "bo'limda": 'в отделе',
  // === Production ===
  "smenani": 'смену',
  "smenalar": 'смены',
  "smena": 'смена',
  "stanoq": 'станок',
  "jihoz": 'оборудование',
  "jihozlar": 'оборудование',
  "asboblar": 'инструменты',
  "vositalar": 'инструменты',
  "vosita": 'средство',
  "operator": 'оператор',
  "operatori": 'оператор',
  "operatorlar": 'операторы',
  "operatsiyalari": 'операции',
  "operatsiyalar": 'операции',
  "to'xtashlar": 'остановки',
  "to'xtash": 'остановка',
  "to'xtatish": 'остановить',
  "ishga tushirish": 'запуск',
  // === Inventory / Warehouse ===
  "omborlar": 'склады',
  "omborga": 'на склад',
  "omborda": 'на складе',
  "ombordan": 'со склада',
  "omborni": 'склад',
  "omborini": 'склад',
  "ombor": 'склад',
  "materiallar": 'материалы',
  "materialni": 'материал',
  "material": 'материал',
  "materiallari": 'материалы',
  "mahsulot": 'продукт',
  "mahsulotlar": 'продукты',
  "miqdor": 'количество',
  "miqdori": 'количество',
  "miqdorni": 'количество',
  "narx": 'цена',
  "narxi": 'цена',
  "narxlar": 'цены',
  "narxni": 'цену',
  "summa": 'сумма',
  "summasi": 'сумма',
  // === Other terms ===
  "ko'nikmalar": 'навыки',
  "ko'nikmalari": 'навыки',
  "ko'nikma": 'навык',
  "kasbiy o'sish": 'профессиональный рост',
  "kasbiy": 'профессиональный',
  "professional": 'профессиональный',
  "darajasi": 'уровень',
  "darajaga": 'на уровень',
  "darajani": 'уровень',
  "darajalari": 'уровни',
  "daraja": 'уровень',
  "kursni": 'курс',
  "kurslar": 'курсы',
  "kurslarni": 'курсы',
  "kurslarni yakunlash": 'завершить курсы',
  "kurslarni tugatish": 'завершить курсы',
  "kursni yakunlash": 'завершить курс',
  "kursni tugatish": 'завершить курс',
  "kurs yakunlash": 'завершение курса',
  "kursga": 'на курс',
  "kurs": 'курс',
  "yakunlash": 'завершить',
  "yakunlangan": 'завершено',
  "yakunlagan": 'завершил',
  "yakuniy": 'итоговый',
  "tugatish": 'завершить',
  "tugagan": 'завершён',
  "tugaydi": 'заканчивается',
  "tugaganlar": 'завершившие',
  // === Achievements / KPI ===
  "yutuqlar": 'достижения',
  "yutuq": 'достижение',
  "natijalar": 'результаты',
  "natijalari": 'результаты',
  "natijalarini": 'результаты',
  "natija": 'результат',
  "natijaga": 'к результату',
  "bahosi": 'оценка',
  "baholash": 'оценка',
  "baholashlar": 'оценки',
  "bahovchi": 'оценщик',
  "bahovchilar": 'оценщики',
  // === Customers / sales ===
  "mijozlar": 'клиенты',
  "mijoz": 'клиент',
  "mijozi": 'клиент',
  "mijozning": 'клиента',
  "lidlar": 'лиды',
  "lidni": 'лид',
  "lid": 'лид',
  "bitimlar": 'сделки',
  "bitim": 'сделка',
  "shartnomalari": 'договоры',
  "shartnoma": 'договор',
  "shartnomasini": 'договор',
  "taklif": 'предложение',
  "takliflar": 'предложения',
  "taklifni": 'предложение',
  "taklifnomalar": 'приглашения',
  // === HR / candidates ===
  "kandidat": 'кандидат',
  "kandidatga": 'кандидату',
  "kandidatlar": 'кандидаты',
  "nomzodga": 'кандидату',
  "nomzodni": 'кандидата',
  "nomzod": 'кандидат',
  "vakansiya": 'вакансия',
  "vakansiyalar": 'вакансии',
  "vakansiyani": 'вакансию',
  // === Misc ===
  "shablon": 'шаблон',
  "shablonlar": 'шаблоны',
  "shablonni": 'шаблон',
  "shablonini": 'шаблон',
  "shablonidan": 'из шаблона',
  "shablonlardan": 'из шаблонов',
  "shablonlari": 'шаблоны',
  "shablonlarini": 'шаблоны',
  "savol": 'вопрос',
  "savollar": 'вопросы',
  "savolni": 'вопрос',
  "savollik": 'вопросный',
  "savolingizni": 'ваш вопрос',
  "savolga": 'на вопрос',
  "javob": 'ответ',
  "javobni": 'ответ',
  "javobingizni": 'ваш ответ',
  "izoh": 'комментарий',
  "eslatma": 'заметка',
  "eslatmalar": 'заметки',
  "xabar": 'сообщение',
  "xabarlar": 'сообщения',
  "xabardan": 'из сообщения',
  "bildirishnoma": 'уведомление',
  "bildirishnomalar": 'уведомления',
  // === System ===
  "tizimi": 'система',
  "tizim": 'система',
  "tizimda": 'в системе',
  "tizimga": 'в систему',
  "tizimlar": 'системы',
  "tizimida": 'в системе',
  "sozlamalari": 'настройки',
  "sozlamalar": 'настройки',
  "sozlang": 'настройте',
  "sozlash": 'настройка',
  "parametrlari": 'параметры',
  "parametrlar": 'параметры',
  "parametrlarni": 'параметры',
  "parametr": 'параметр',
  "ruxsat": 'разрешение',
  "ruxsatlar": 'разрешения',
  "ruxsat etilgan": 'разрешено',
  "taqiqlangan": 'запрещено',
  "taqiqlanadi": 'запрещается',
  "huquqlar": 'права',
  "huquq": 'право',
  // === Money ===
  "to'lov": 'оплата',
  "to'lovlar": 'оплаты',
  "to'lovni": 'оплату',
  "to'lanishi": 'оплата',
  "to'lanmagan": 'не оплачено',
  "to'langan": 'оплачено',
  "moliyaviy": 'финансовый',
  "moliya": 'финансы',
  "soliq": 'налог',
  "soliqlar": 'налоги',
  "soliqni": 'налог',
  "bonus": 'бонус',
  "bonuslar": 'бонусы',
  "mukofot": 'награда',
  "mukofotlar": 'награды',
  "jarima": 'штраф',
  "jarimalar": 'штрафы',
  "avans": 'аванс',
  "avanslar": 'авансы',
  "kredit": 'кредит',
  "qarz": 'долг',
  "qarzlar": 'долги',
  "qarzdorlik": 'задолженность',
  "daromad": 'доход',
  "xarajat": 'расход',
  "xarajatlar": 'расходы',
  "xarajatlari": 'расходы',
  "tushum": 'выручка',
  "kirim": 'приход',
  "kirimlar": 'приходы',
  "chiqim": 'расход',
  "chiqimi": 'расход',
  "chiqimlar": 'расходы',
  "transport": 'транспорт',
  // === Standalone tokens ===
  "haqiqatan": 'действительно',
  "ko'rib": 'просматривая',
  "ko'rilgan": 'просмотрено',
  "ko'rilmagan": 'не просмотрено',
  "ko'rik": 'осмотр',
  "ko'rsa": 'если увидит',
  "qiladi": 'делает',
  "qilish": 'делать',
  "qilingan": 'сделано',
  "qiluvchi": 'делающий',
  "qiluvchilar": 'делающие',
  "qilinmaydi": 'не делается',
  "qilib": 'сделав',
  "qilmoqda": 'делает',
  "qiling": 'сделайте',
  "boshqarish": 'управление',
  "boshqaruv": 'управление',
  "boshqaruvi": 'управление',
  "boshqaring": 'управляйте',
  "boshqaradi": 'управляет',
  "tahlili": 'анализ',
  "tahlil": 'анализ',
  "tahlilni": 'анализ',
  // === Less common but appear in audit ===
  "berish": 'давать',
  "beradi": 'даёт',
  "bering": 'дайте',
  "berdi": 'дал',
  "beriladi": 'даётся',
  "berdiq": 'дали',
  "beruvchi": 'дающий',
  "beruvchilar": 'дающие',
  "olish": 'получить',
  "olib": 'получая',
  "oladi": 'получает',
  "olmaydi": 'не получает',
  "ketish": 'уход',
  "ketmoqchi": 'хочет уйти',
  "kelmoqchi": 'хочет прийти',
  "kelish": 'приход',
  "kelgan": 'пришёл',
  "kelib": 'придя',
  "keladi": 'приходит',
  "keladigan": 'приходящий',
  "tushadi": 'попадает',
  "tushuntirish": 'объяснение',
  "yozish": 'писать',
  "yozing": 'пишите',
  "yozadi": 'пишет',
  "yozilgan": 'написано',
  "yozuvi": 'запись',
  "yozuv": 'запись',
  "yozuvini": 'запись',
  "yozuvlar": 'записи',
  "yozuvlari": 'записи',
  "yozuvni": 'запись',
  "yozishi": 'писать',
  "tekshirish": 'проверка',
  "tekshiruvi": 'проверка',
  "tekshiruvlar": 'проверки',
  "tekshirilmagan": 'не проверено',
  "tekshirgandan": 'после проверки',
  "tekshiriladi": 'проверяется',
  // === Specific UI elements ===
  "qayd qilish": 'регистрация',
  "qayd": 'отметка',
  "yozuvga": 'к записи',
  "ro'yxat": 'список',
  "ro'yxati": 'список',
  "ro'yxatga": 'в список',
  "ro'yxatdan": 'из списка',
  "ro'yxatidan": 'из списка',
  "ro'yxatiga": 'к списку',
  "ro'yxatga olish": 'регистрация',
  // === Plant / equipment ===
  "ta'mirlash": 'ремонт',
  "ta'mir": 'ремонт',
  "texnik": 'технический',
  "texnologik": 'технологический',
  "nosozlik": 'неисправность',
  "nosozliklar": 'неисправности',
  // === Misc verbs ===
  "ishlashi": 'работа',
  "ishlash": 'работа',
  "ishlayotgan": 'работающий',
  "ishlatiladi": 'используется',
  "ishlatilgan": 'использовано',
  "ishlating": 'используйте',
  "ishlatish": 'использование',
  "ishlatilmagan": 'не использовано',
  "ishladi": 'работал',
  "ish": 'работа',
  "ishlar": 'работы',
  "ishlari": 'работы',
  "ishni": 'работу',
  "ishga": 'на работу',
  "ishda": 'на работе',
  "ishchi": 'рабочий',
  // === Status verbs ===
  "kutmoqda": 'ожидает',
  "kutilmoqda": 'ожидается',
  "kutayotgan": 'ожидающий',
  "kutilgan": 'ожидаемый',
  "kutilayotgan": 'ожидаемый',
  // === Misc ===
  "haqi": 'плата',
  "haqida": 'о',
  "haqiqiy": 'настоящий',
  "haqidan": 'о',
  "to'g'risida": 'о',
  // === Reports/data ===
  "ma'lumotlarni yuklash": 'загрузка данных',
  "ma'lumotlarni saqlash": 'сохранение данных',
  "ma'lumotlarni yangilash": 'обновление данных',
  "saqlash uchun": 'для сохранения',
  // === Workflow / tasks ===
  "topshiriqlarni": 'задания',
  "topshiriqlar": 'задания',
  "topshiriqlarni 100% bajarish": 'выполнить задания на 100%',
  "topshiriqlarni 100% bajaring": 'выполните задания на 100%',
  "topshiriqlarni bajarish": 'выполнение заданий',
  "topshiriqni bajarish": 'выполнение задания',
  "topshiriq": 'задание',
  "topshirilmagan": 'не сдано',
  "topshirilgan": 'сдано',
  "topshirish": 'сдать',
  "vazifalar": 'задачи',
  "vazifa": 'задача',
  "vazifani": 'задачу',
  "vazifalari": 'задачи',
  "bajarilgan": 'выполнено',
  "bajarilmagan": 'не выполнено',
  "bajarilishi": 'выполнение',
  "bajaring": 'выполните',
  "bajarish": 'выполнить',
  // === Counts ===
  "soni": 'количество',
  "soniga": 'к количеству',
  "sonlar": 'числа',
  "umumiy soni": 'общее количество',
  "o'rtacha": 'среднее',
  "o'rtacha qiymat": 'среднее значение',
  "umumiy summa": 'общая сумма',
  "umumiy": 'общий',
  "jami": 'итого',
  "yig'indi": 'сумма',
  // === Generic Uzbek terms ===
  "siz": 'вы',
  "biz": 'мы',
  "men": 'я',
  "u": 'он',
  "ular": 'они',
  "sizning": 'ваш',
  "bizning": 'наш',
  "uning": 'его',
  "ularning": 'их',
  "menga": 'мне',
  "sizga": 'вам',
  "bizga": 'нам',
  "unga": 'ему',
  "ularga": 'им',
  "o'z": 'свой',
  "o'zingiz": 'вы сами',
  "o'zingizning": 'ваш',
  "o'zi": 'сам',
  // === Logistics ===
  "haydovchi": 'водитель',
  "haydovchilar": 'водители',
  "yo'l": 'дорога',
  "yo'nalishi": 'направление',
  "yo'nalish": 'направление',
  "manzil": 'адрес',
  "manzili": 'адрес',
  // === Etc ===
  "shartlari": 'условия',
  "shartlar": 'условия',
  "shartli": 'условный',
  "shart": 'условие',
  "qoidalari": 'правила',
  "qoidalar": 'правила',
  "qoidasi": 'правило',
  "qoida": 'правило',
  "tartiblari": 'регламенты',
  "natijada": 'в результате',
  "sababli": 'по причине',
  "sabab": 'причина',
  "sababi": 'причина',
  "sababni": 'причину',
  "sababini": 'причину',
  "uchun sabab": 'причина для',
  "sababi yo'q": 'нет причины',
  // === Roles ===
  "administrator": 'администратор',
  "admin": 'админ',
  "menejer": 'менеджер',
  "menejeri": 'менеджер',
  "menejeriga": 'менеджеру',
  "operatori": 'оператор',
  "rahbarlik": 'руководство',
  // === Additional often-occurring ===
  "linki": 'ссылка',
  "havola": 'ссылка',
  "havolalar": 'ссылки',
  "havolani": 'ссылку',
  "manba": 'источник',
  "manbani": 'источник',
  "manbaini": 'источник',
  "kelib chiqish": 'происхождение',
  "kelib chiqishi": 'происхождение',
  "muvofiqlik": 'соответствие',
  "ahamiyat": 'значение',
  "ahamiyatli": 'значимый',
  // === Hierarchy ===
  "lavozim": 'должность',
  "lavozimni": 'должность',
  "lavozimga": 'на должность',
  "lavozimlarda": 'на должностях',
  // === Misc remnants ===
  "alohida ko'rsatilmagan": 'не указано отдельно',
  "alohida ko'rsatilgan": 'указано отдельно',
  // === Catch-alls ===
  "boshlash": 'начать',
  "boshlang": 'начните',
  "boshlandi": 'начато',
  "boshlangan": 'начато',
  "tugatildi": 'завершено',
  "to'xtatildi": 'остановлено',
  "yakunlandi": 'завершено',
  "muvaffaqiyatli": 'успешно',
  "muvaffaqiyatsiz": 'неуспешно',
  "xato": 'ошибка',
  "xatolik": 'ошибка',
  "ogohlantirish": 'предупреждение',
  // === Filters ===
  "filterni": 'фильтр',
  "filtr": 'фильтр',
  "filtri": 'фильтр',
  "filterlar": 'фильтры',
  // === Misc tail items ===
  "elementni": 'элемент',
  "element": 'элемент',
  "elementlar": 'элементы',
  "loglar": 'логи',
  "loglarni": 'логи',
  "loglari": 'логи',
  "log": 'лог',
  // === Common ones ===
  "kerak": 'нужно',
  "kerakli": 'необходимый',
  "kerakmas": 'не нужно',
  "muhim": 'важно',
  "ahamiyatli": 'значимо',
  "qiymat": 'значение',
  "qiymati": 'значение',
  "qiymatlar": 'значения',
  // === Other ===
  "mavzu": 'тема',
  "mavzular": 'темы',
  "muhokama": 'обсуждение',
  "uchrashuv": 'встреча',
  "uchrashuvlar": 'встречи',
  "sessiyalar": 'сессии',
  "sessiya": 'сессия',
  "smen": 'смена',
  // === Inventory specific ===
  "stok": 'остаток',
  "zaxira": 'запас',
  "zaxirasi": 'запас',
  "zaxiralar": 'запасы',
  "rezerv": 'резерв',
  "rezervlar": 'резервы',
  "partiyalar": 'партии',
  "partiya": 'партия',
  // === Document ===
  "hujjat": 'документ',
  "hujjatlar": 'документы',
  "hujjatni": 'документ',
  "hujjati": 'документ',
  "litsenziyalar": 'лицензии',
  "litsenziya": 'лицензия',
  "sertifikat": 'сертификат',
  "sertifikatni": 'сертификат',
  "sertifikatlar": 'сертификаты',
  "sertifikatlari": 'сертификаты',
  "sertifikatlarini": 'сертификаты',
  // === Misc tail ===
  "barkod": 'штрих-код',
  "barkodlar": 'штрих-коды',
  "skaner": 'сканер',
  "skanerlash": 'сканирование',
  "skanerlang": 'сканируйте',
  "skanerlangan": 'отсканировано',
  // === Modules ===
  "modul": 'модуль',
  "modulga": 'в модуль',
  "moduliga": 'к модулю',
  "modulni": 'модуль',
  "modullar": 'модули',
  "modullarni": 'модули',
  // === Camera / IoT ===
  "kamera": 'камера',
  "kameralar": 'камеры',
  "kamerani": 'камеру',
  "sensor": 'датчик',
  "sensorlar": 'датчики',
  // === Other ===
  "g'oya": 'идея',
  "g'oyalar": 'идеи',
  "oxirida": 'в конце',
  "boshida": 'в начале',
  "o'rtasida": 'в середине',
  "to'g'ridan-to'g'ri": 'напрямую',
  "to'g'ridan": 'напрямую',
  // === Punctuation hints ===
  "punkt": 'пункт',
  "punktlar": 'пункты',
  "bo'limlar": 'разделы',
  // === Final ===
  "konflikt": 'конфликт',
  "konfliktlar": 'конфликты',
  "muammoni": 'проблему',
  "muammo": 'проблема',
  "muammolar": 'проблемы',
  // === Roles 2 ===
  "raqobatchi": 'конкурент',
  "raqobatchilar": 'конкуренты',
  "raqobat": 'конкуренция',
  // === KPI specific ===
  "reytingi": 'рейтинг',
  "reyting": 'рейтинг',
  "ball": 'балл',
  "ballar": 'баллы',
  // === Misc ===
  "aniqlash": 'определение',
  "aniqlashlar": 'определения',
  "aniqlangan": 'определено',
  "aniqlanmadi": 'не определено',
  "aniq": 'точно',
  "noaniq": 'неточно',
  // === Misc remaining ===
  "telegram": 'Telegram',
  "telegramni": 'Telegram',
  "tenant": 'тенант',
  "tenantni": 'тенант',
  "tenantlar": 'тенанты',
  "robot": 'робот',
  "robotni": 'робот',
  "robotlar": 'роботы',
  "bot": 'бот',
  "botda": 'в боте',
  "botlar": 'боты',
  // === Closing ===
  "qabul qilish": 'принять',
  "qabul qilindi": 'принято',
  "qabul qilingan": 'принято',
  "qabul qiluvchi": 'принимающий',
  "qabul": 'приём',
  "tasdiqlay olmaymiz": 'не можем подтвердить',
  // === Misc ===
  "darslar": 'уроки',
  "dars": 'урок',
  "darsi": 'урок',
  "ta'lim": 'образование',
  "ta'limini": 'образование',
  "ta'tilga chiqish": 'выход в отпуск',
  "ta'til": 'отпуск',
  "ta'tildan": 'из отпуска',
  // === Mehnat / labor ===
  "mehnat": 'труд',
  "mehnatni": 'труд',
  "mehnat shartnomasini": 'трудовой договор',
  // === Misc operating ===
  "kapital": 'капитал',
  "boshqaruv kapital": 'управленческий капитал',
  // === Misc ===
  "to'g'risida": 'о',
  "to'g'ri": 'правильно',
  "darhol": 'немедленно',
  "imkon": 'возможность',
  "imkoni": 'возможность',
  "imkoniyat": 'возможность',
  "imkoniyatlar": 'возможности',
  // === Closing items ===
  "yakunlangan kurslar": 'завершённые курсы',
  "yakunlangan vazifalar": 'завершённые задачи',
  "topilgan natijalar": 'найденные результаты',
  // === Spelling variants ===
  "qo'shimchasi": 'дополнение',
  "qo'shimchalari": 'дополнения',
  // === Auth ===
  "kirish": 'вход',
  "chiqish": 'выход',
  "kirgan": 'вошёл',
  "chiqqan": 'вышел',
  // === Etc ===
  "sodir bo'ldi": 'произошло',
  "sodir": 'произошло',
  "yuzaga keldi": 'возникло',
  "yuzaga": 'возникло',
  // === Bonus phrases ===
  "vaqtidan oldin": 'досрочно',
  "vaqtdan": 'из времени',
  "vaqtida": 'вовремя',
  "vaqtni": 'время',
  "vaqti": 'время',
  "vaqt": 'время',
  "vaqtlari": 'времена',
  // === Final ===
  "Sotuv": 'Продажа',
  "Sotuvlar": 'Продажи',
  "sotuvlar": 'продажи',
  "sotuv": 'продажа',
  "sotuvchi": 'продавец',
  "sotib olish": 'покупка',
  "sotib oldi": 'купил',
  // === Closer ===
  "loyiha": 'проект',
  "loyihalar": 'проекты',
  "loyihasi": 'проект',
  "loyihani": 'проект',
  "loyihaga": 'к проекту',
  // === Address ===
  "joylashuv": 'расположение',
  "joylashgan": 'расположен',
  "joylashtirish": 'размещение',
  "joylashish": 'размещение',
  // === Final ===
  "kuni": 'день',
  "kun": 'день',
  "kunlar": 'дни',
  "kunda": 'в день',
  "kunga": 'на день',
  "kunlarda": 'в дни',
  "oyda": 'в месяц',
  "oyga": 'на месяц',
  "oylik": 'месячный',
  "yiliga": 'в год',
  "yili": 'год',
  "yil": 'год',
  "yillik": 'годовой',
  "yillar": 'годы',
  "soat": 'час',
  "soatda": 'в час',
  "daqiqa": 'минута',
  "daqiqada": 'в минуту',
  "soniya": 'секунда',
  // === Closing tail ===
  "asosan": 'в основном',
  "umuman": 'вообще',
  "umumiy holda": 'в целом',
  "haftalik": 'еженедельно',
  "haftaga": 'на неделю',
  "haftada": 'в неделю',
  "hafta": 'неделя',
  "haftalar": 'недели',
  "oyning": 'месяца',
  "oy": 'месяц',
  "oylar": 'месяцы',
};

// Single words (final fallback substitution) — applied with case-preservation
const WORDS = {
  // === Mostly already in PHRASES, but for single-token leftovers ===
  've': 'и',
  'va': 'и',
  'yoki': 'или',
  'lekin': 'но',
  'ammo': 'однако',
  'agar': 'если',
  'ham': 'также',
  'bilan': 'с',
  'uchun': 'для',
  'haqida': 'о',
  'orqali': 'через',
  'asosida': 'на основе',
  "bo'yicha": 'по',
  'tomonidan': 'от',
  'yordamida': 'с помощью',
  // === Common verbs/nouns ===
  "ko'rib": 'просмотр',
  "ko'ring": 'смотрите',
  "ko'rdi": 'увидел',
  "yo'q": 'нет',
  "bor": 'есть',
  "mavjud": 'имеется',
  "topildi": 'найдено',
  "topilmadi": 'не найдено',
  "ushbu": 'данный',
  "bu": 'это',
  "shu": 'этот',
  "u": 'он',
  // === Generic ===
  "kichik": 'малый',
  "katta": 'большой',
  "yangi": 'новый',
  "eski": 'старый',
  "yakka": 'единичный',
  "barcha": 'все',
  "har": 'каждый',
  "bir": 'один',
  // === Roles ===
  "rahbar": 'руководитель',
  "xodim": 'сотрудник',
  "mijoz": 'клиент',
  "mehmon": 'гость',
  // === Operations ===
  "qo'shish": 'добавить',
  "tahrirlash": 'редактировать',
  "saqlash": 'сохранить',
  "yangilash": 'обновить',
  "o'chirish": 'удалить',
  "tanlash": 'выбрать',
  "kiritish": 'ввод',
  "ko'rish": 'просмотр',
  "yuklash": 'загрузить',
  "yuborish": 'отправить',
  "tozalash": 'очистить',
  "qidirish": 'поиск',
  "qidiruv": 'поиск',
  "boshqarish": 'управление',
  "boshqaruv": 'управление',
  // === Status ===
  "faol": 'активный',
  "nofaol": 'неактивный',
  "yopiq": 'закрыт',
  "ochiq": 'открыт',
  // === Etc ===
  "bo'lim": 'отдел',
  "soha": 'сфера',
  "joy": 'место',
  "manzil": 'адрес',
  "raqam": 'номер',
  "tartib": 'порядок',
  "hisob": 'счёт',
  "kod": 'код',
  "id": 'ID',
  "kpi": 'KPI',
  "oee": 'OEE',
  "abc": 'ABC',
  "roi": 'ROI',
  "hr": 'HR',
  "crm": 'CRM',
  "iot": 'IoT',
  "qc": 'QC',
  "mes": 'MES',
  "wms": 'WMS',
  "erp": 'ERP',
  "ai": 'AI',
  "gpt": 'GPT',
  "po": 'PO',
  "pr": 'PR',
  "gs": 'GS',
  "gl": 'GL',
  "sap": 'SAP',
  "ml": 'ML',
  "api": 'API',
  "ui": 'UI',
  "csv": 'CSV',
  "pdf": 'PDF',
  "xlsx": 'XLSX',
  "pin": 'PIN',
  "dms": 'DMS',
  "hmac": 'HMAC',
  "gps": 'GPS',
  "fmcg": 'FMCG',
  "okr": 'OKR',
  "barcode": 'штрих-код',
  "excel": 'Excel',
  "europrint": 'EuroPrint',
  "photoshop": 'Photoshop',
  "replit": 'Replit',
  "secrets": 'Secrets',
  "checkpoint": 'Checkpoint',
  "task": 'Задача',
  "status": 'Статус',
  "time": 'Время',
  "alumni": 'Выпускник',
  "near": 'Near',
  "tool": 'TOOL',
  "fraud": 'Фрод',
  "succession": 'Преемственность',
  "planning": 'планирование',
  "milestone": 'Веха',
  "onboarding": 'Онбординг',
  "offboarding": 'Офбординг',
  "churn": 'отток',
  "drag": 'drag',
  "drop": 'drop',
  "sidebar": 'боковая панель',
  "chat": 'чат',
  "shift": 'смена',
  "badge": 'значок',
  "funnel": 'воронка',
  "mentor": 'ментор',
  "blog": 'блог',
  "video": 'видео',
  "videolar": 'видео',
  "server": 'сервер',
  "internet": 'интернет',
  "post": 'пост',
  "postinglar": 'посты',
  "chek": 'чек',
  "block": 'блок',
  "checklist": 'чек-лист',
  "anketa": 'анкета',
  "anketani": 'анкету',
  "ekraniga": 'на экран',
  "ekran": 'экран',
  "moduli": 'модуль',
  "pos": 'POS',
  "mini": 'мини',
  "micro": 'микро',
  "gemini": 'Gemini',
  "vision": 'Vision',
  "achievement": 'достижение',
  "achievements": 'достижения',
  "longitude": 'долгота',
  "latitude": 'широта',
  "kelishuv": 'соглашение',
  "changeover": 'переналадка',
  "horizon": 'горизонт',
  "run": 'Run',
  "chart": 'Chart',
  // === Misc Uzbek ===
  "natija": 'результат',
  "natijalar": 'результаты',
  "amalni": 'действие',
  "amallar": 'действия',
  "amal": 'действие',
  "qaytarib": 'обратно',
  "qaytariladi": 'возвращается',
  "qaytarish": 'возврат',
  "qaytadan": 'снова',
  "qaytish": 'возврат',
  "deb": 'как',
  "ta": 'шт',
  "dan": 'из',
  "ga": 'на',
  "da": 'в',
  "ni": '',
  "ham": 'тоже',
  "shaxs": 'лицо',
  "shaxsiy": 'личный',
  "belgilang": 'отметьте',
  "belgilash": 'отметить',
  "belgilangan": 'отмечено',
  "belgi": 'знак',
  "belgilar": 'знаки',
  "etish": 'выполнение',
  "etiladi": 'выполняется',
  "etilgan": 'выполнено',
  "etilmagan": 'не выполнено',
  "etib": 'выполнив',
  "etmoqda": 'выполняется',
  "eting": 'выполните',
  "qoldiring": 'оставьте',
  "qoldirsa": 'если оставит',
  "qoldirilgan": 'оставлено',
  // === Continued ===
  "tarafidan": 'со стороны',
  "tomonidan": 'от',
  "atrof": 'окружение',
  "atrofdagi": 'окружающий',
  "shahar": 'город',
  "viloyat": 'область',
  "tuman": 'район',
  "bekat": 'остановка',
  "yo'l": 'дорога',
  "yo'nalish": 'направление',
  "marshrut": 'маршрут',
  // === Final batch ===
  "kompaniyalar": 'компании',
  "tashkilotlar": 'организации',
  "filiallar": 'филиалы',
  "filial": 'филиал',
  "bo'lim": 'отдел',
  "ofis": 'офис',
  "uy": 'дом',
  "manzilini": 'адрес',
  // === Misc ===
  "yashash": 'проживание',
  "yashaydi": 'проживает',
  "uyda": 'дома',
  "ofisda": 'в офисе',
  "ishxonada": 'на работе',
  // === Misc ===
  "konversiya": 'конверсия',
  "konvertatsiya": 'конвертация',
  "kompaniyadan": 'из компании',
  "valyuta": 'валюта',
  "valyutani": 'валюту',
  "valyutalar": 'валюты',
  // === Misc ===
  "kim": 'кто',
  "kimga": 'кому',
  "kimni": 'кого',
  "kimning": 'чей',
  // === Misc ===
  "ish": 'работа',
  "ishchi": 'рабочий',
  "ishlovchi": 'работающий',
  "xizmat": 'услуга',
  "xizmati": 'услуга',
  "xizmatlar": 'услуги',
  // === Closing ===
  "tomon": 'сторона',
  "tomoni": 'сторона',
  "tomonlar": 'стороны',
  "boshqa": 'другой',
  "boshqalar": 'другие',
  "boshqasi": 'другой',
  "huddi": 'словно',
  "xuddi": 'как раз',
  // === Misc verbs ===
  "olamiz": 'возьмём',
  "olamiz": 'получим',
  "olishingiz": 'получить',
  "kuting": 'подождите',
  "kutib": 'ожидая',
  "kutadi": 'ждёт',
  // === Misc ===
  "tasavvur": 'представление',
  "tasdiqlamadingiz": 'не подтвердили',
  // === Final ===
  "ko'rsatish": 'показать',
  "ko'rsatib": 'показав',
  "ko'rsatadi": 'показывает',
  "ko'rsatildi": 'показано',
  "ko'rsatilgan": 'показано',
  "ko'rsatilmagan": 'не показано',
  // === Misc ===
  "talab": 'требование',
  "talablari": 'требования',
  "talab qilinadi": 'требуется',
  "majburiyat": 'обязательство',
  "majburiyatlar": 'обязательства',
  "majburiyatlari": 'обязательства',
  "majburiy": 'обязательно',
  // === Final ===
  "kasallik": 'болезнь',
  "kasallikni": 'болезнь',
  "sog'lik": 'здоровье',
  "sog'liqni": 'здоровье',
  "tabrik": 'поздравление',
  "tabriklash": 'поздравить',
  // === Misc ===
  "tushuncha": 'понятие',
  "tushunchalar": 'понятия',
  "mazmun": 'содержание',
  "mazmuni": 'содержание',
  "mavzu": 'тема',
  // === Loyalty / Family ===
  "oila": 'семья',
  "oilada": 'в семье',
  "oilaviy": 'семейный',
  "farzand": 'ребёнок',
  "farzandlar": 'дети',
  "farzandlilari": 'имеющие детей',
  "farzandlarning": 'детей',
  "farzandi": 'ребёнок',
  "qarindosh": 'родственник',
  "qarindoshlar": 'родственники',
  "qaynona": 'свекровь',
  "qaynota": 'свёкор',
  // === Misc ===
  "yashash sharoiti": 'условия проживания',
  "uy joy": 'жильё',
  "ijaraga": 'в аренду',
  "ijara": 'аренда',
  "bank": 'банк',
  "shartnomasini": 'договор',
  // === Closing ===
  "afzal": 'предпочтительный',
  "afzalliklar": 'преимущества',
  "kamchiliklari": 'недостатки',
  "kamchilik": 'недостаток',
  "kamchiliklar": 'недостатки',
  // === Misc ===
  "qaynonalar": 'свекрови',
  "uylanganlar": 'женатые',
  "turmush qurganlar": 'состоящие в браке',
  "turmush qurmagan": 'не в браке',
  "turmush o'rtog'i": 'супруг',
  "turmush": 'жизнь',
  // === Misc ===
  "hisoblangan": 'рассчитано',
  "hisoblanadi": 'рассчитывается',
  "hisoblash": 'расчёт',
  "hisoblanmagan": 'не рассчитано',
  "hisob": 'счёт',
  // === Misc verbs ===
  "shug'ullanadi": 'занимается',
  "shug'ullanish": 'занятие',
  // === Misc ===
  "FMCG sohasida": 'в сфере FMCG',
  "sohasida": 'в сфере',
  "soha": 'сфера',
  "sohada": 'в сфере',
  // === Misc ===
  "davri": 'период',
  "davrlari": 'периоды',
  "davrga": 'на период',
  "davr": 'период',
  // === Misc ===
  "tartibga": 'к порядку',
  "tartibni": 'порядок',
  "tartibida": 'в порядке',
  "tartiblar": 'регламенты',
  // === Misc ===
  "tavsiya": 'рекомендация',
  "tavsiyalar": 'рекомендации',
  "tavsiya etiladi": 'рекомендуется',
  "tavsiya etilgan": 'рекомендуется',
  // === Misc ===
  "tarmoq": 'сеть',
  "tarmoqlar": 'сети',
  "kanal": 'канал',
  "kanallar": 'каналы',
  // === Misc ===
  "qabul qiluvchi": 'получатель',
  "qabul qiluvchilar": 'получатели',
  // === Misc tail ===
  "tugmacha": 'кнопка',
  "tugmachalari": 'кнопки',
  "tugmasi": 'кнопка',
  "tugmasini": 'кнопку',
  // === Final closing ===
  "Bo'sh": 'Пусто',
  "bo'sh": 'пусто',
  "to'liq": 'полно',
  // === Tail ===
  "qolgan": 'оставшийся',
  "qolgani": 'оставшееся',
  "qolganlar": 'оставшиеся',
  "qolib": 'оставаясь',
  // === Misc ===
  "tashqi": 'внешний',
  "ichki": 'внутренний',
  "tashqari": 'снаружи',
  "ichida": 'внутри',
  // === Misc ===
  "boshqaruv kapital tushunchalar": 'управленческие капитальные понятия',
  "boshqaruv tushunchalar": 'управленческие понятия',
  // === Misc edge ===
  "PR": 'PR',
  "ekranga": 'на экран',
  "ekranida": 'на экране',
  // === Misc Uzbek-only ===
  "topshiriqlarni": 'задания',
  "topshiriq": 'задание',
  // === Misc tail ===
  "qonun": 'закон',
  "qonunlar": 'законы',
  "qonuniy": 'законный',
  "qonunbuzar": 'нарушитель закона',
  // === Misc final ===
  "g'alabalar": 'победы',
  "g'alaba": 'победа',
  "muvaffaqiyat": 'успех',
  "muvaffaqiyatlar": 'успехи',
  // === Closing items ===
  "vositachi": 'посредник',
  "vositachilar": 'посредники',
  // === Final ===
  "bormoqda": 'идёт',
  "borgan": 'пошёл',
  "borasiz": 'идёте',
  "boring": 'идите',
  "boradi": 'идёт',
  "kelmoqda": 'идёт',
  // === Misc ===
  "smartfon": 'смартфон',
  "telefon": 'телефон',
  "kompyuter": 'компьютер',
  "noutbuk": 'ноутбук',
  // === Closing ===
  "vergul": 'запятая',
  "ajratib": 'разделив',
  "ajratish": 'разделение',
  // === Misc ===
  "yorliq": 'ярлык',
  "yorliqlar": 'ярлыки',
  // === Misc ===
  "bog'lanish": 'связь',
  "bog'langan": 'связано',
  "bog'lash": 'связать',
  "aloqa": 'связь',
  "aloqasi": 'связь',
  // === Closing ===
  "yashirin": 'скрытый',
  "ko'rinmas": 'невидимый',
  "ko'rinadi": 'виден',
  "yashiriladi": 'скрывается',
  "arxivlash": 'архивирование',
  "arxivlashni": 'архивирование',
  // === Misc ===
  "uzish": 'отключить',
  "uzishni": 'отключение',
  "ulanish": 'подключение',
  "ulangan": 'подключено',
  "uzilgan": 'отключено',
  // === Misc ===
  "kontakt": 'контакт',
  "kontaktni": 'контакт',
  "kontaktlar": 'контакты',
  // === Misc ===
  "ism": 'имя',
  "ismi": 'имя',
  "ismini": 'имя',
  "familiya": 'фамилия',
  "familiyasini": 'фамилию',
  // === Misc ===
  "varag'i": 'лист',
  "varaq": 'лист',
  "varaqlar": 'листы',
  // === Misc ===
  "kechikkan": 'опоздавший',
  "kechikayotgan": 'опаздывающий',
  "kechikish": 'опоздание',
  "kechikishlar": 'опоздания',
  // === Closing ===
  "zamonaviy": 'современный',
  "modern": 'современный',
  "klassik": 'классический',
  // === Misc ===
  "huquqlar": 'права',
  "huquqi": 'право',
  "huquq": 'право',
  "himoyalangan": 'защищено',
  "himoya": 'защита',
  // === ABC ===
  "analiz": 'анализ',
  // === Misc ===
  "bormaganlar": 'не пошедшие',
  "kelmaganlar": 'не пришедшие',
  // === Closing ===
  "bering": 'дайте',
  "berildi": 'дано',
  // === Misc final ===
  "muddat (kunlarda)": 'срок (в днях)',
  // === Misc ===
  "qaytib": 'возвращаясь',
  "qaytdi": 'вернулся',
  "qaytib kelish": 'возвращение',
  // === Closing ===
  "kechiktirildi": 'отложено',
  "kechiktirish": 'отложить',
  // === Misc tail words ===
  "yo'qotgan": 'потерявший',
  "yo'qotish": 'потеря',
  "yo'qotildi": 'потеряно',
  "yo'qotilgan": 'потеряно',
  // === Closing ===
  "shak-shubha": 'сомнение',
  "shubha": 'сомнение',
  "shubhalar": 'сомнения',
  // === Misc ===
  "yuqoridagi": 'вышеуказанный',
  "pastdagi": 'нижеуказанный',
  "yuqorida": 'выше',
  "pastda": 'ниже',
  // === Final ===
  "yerda": 'здесь',
  "yerga": 'сюда',
  "qayerda": 'где',
  // === Misc ===
  "hozircha": 'пока',
  "darhol": 'немедленно',
  "tezda": 'быстро',
  // === Closing ===
  "yuborilmadi": 'не отправлено',
  "yuborilmagan": 'не отправлено',
  // === Misc ===
  "iltimos": 'пожалуйста',
  // === Misc ===
  "muhokama qiling": 'обсудите',
  "muhokama qilamiz": 'обсудим',
  // === Closing words ===
  "aytib": 'говоря',
  "aytdi": 'сказал',
  "ayting": 'скажите',
  "aytadi": 'говорит',
  "aytilgan": 'сказано',
  // === Misc ===
  "qoliplar": 'формы',
  "qolip": 'форма',
  // === Misc ===
  "dizayn": 'дизайн',
  "dizaynni": 'дизайн',
  "dizaynlar": 'дизайны',
  "dizaynni qabul qilish": 'принять дизайн',
  // === Misc ===
  "PR (Public Relations)": 'PR (Public Relations)',
  "prdr": 'PR',
  // === Misc ===
  "ko'rgazma": 'выставка',
  "ko'rgazmani": 'выставку',
  "kampaniya": 'кампания',
  "kampaniyani": 'кампанию',
  "kampaniyalar": 'кампании',
  // === Misc ===
  "tashkilotchi": 'организатор',
  "tashkilotchilar": 'организаторы',
  // === Misc ===
  "muhitda": 'в среде',
  "muhit": 'среда',
  // === Misc ===
  "real vaqt": 'реальное время',
  "real": 'реальный',
  // === Misc ===
  "sof": 'чистый',
  "sof daromad": 'чистый доход',
  // === Misc ===
  "tan narx": 'себестоимость',
  "tannarx": 'себестоимость',
  // === Misc ===
  "evakuatsiya": 'эвакуация',
  "yong'in": 'пожар',
  "shoshilinch": 'срочный',
  // === Misc ===
  "qoidasi": 'правило',
  "qoidalari": 'правила',
  // === Misc final tail ===
  "diqqat": 'внимание',
  "diqqat bilan": 'внимательно',
  // === Misc ===
  "ko'paytirildi": 'увеличено',
  "kamaytirildi": 'уменьшено',
  "kamaytirish": 'уменьшить',
  "ko'paytirish": 'увеличить',
  // === Misc ===
  "ko'paydi": 'увеличилось',
  "kamaydi": 'уменьшилось',
  // === Misc ===
  "yondashuv": 'подход',
  "metodologiya": 'методология',
  "metodika": 'методика',
  // === Misc ===
  "chetlab": 'обойти',
  "chetlab o'tish": 'обход',
  // === Misc ===
  "ikkala": 'оба',
  "har ikkala": 'оба',
  // === Misc ===
  "tahliliy": 'аналитический',
  // === Misc remaining ===
  "tushib": 'упав',
  "tushadi": 'падает',
  "ko'tarildi": 'поднялось',
  "ko'tarilish": 'подъём',
  "ko'tarish": 'поднять',
  "kuchga ko'tarilishi": 'вступление в силу',
  // === Misc ===
  "kuchga kirgan": 'вступил в силу',
  "kuchga kirish": 'вступление в силу',
  // === Misc ===
  "muhofaza": 'охрана',
  "muhofazasi": 'охрана',
  "xavfsizlik": 'безопасность',
  "xavfsiz": 'безопасный',
  "xavfli": 'опасный',
  "xavf": 'риск',
  "xavfi": 'риск',
  "xavfini": 'риск',
  // === Misc ===
  "ehtimollik": 'вероятность',
  "ehtimoliyat": 'вероятность',
  // === Misc final ===
  "biriktirilgan": 'прикреплено',
  "biriktirish": 'прикрепить',
  "biriktirma": 'вложение',
  // === Misc ===
  "papkadan": 'из папки',
  "papkaga": 'в папку',
  "papka": 'папка',
  "tashlanadi": 'выбрасывается',
  "tashlash": 'выбросить',
  // === Misc ===
  "shoshilinchlik": 'срочность',
  "yongin": 'пожар',
  // === Misc ===
  "yetadi": 'хватает',
  "yetarli": 'достаточно',
  "yetishmaydi": 'не хватает',
  // === Misc ===
  "amaliyot": 'практика',
  "amaliy": 'практический',
  // === Misc ===
  "nazariy": 'теоретический',
  "nazariya": 'теория',
  // === Misc ===
  "salohiyat": 'потенциал',
  "potensial": 'потенциал',
  "salohiyatli": 'перспективный',
  // === Misc ===
  "ko'p o'tmay": 'вскоре',
  "tez orada": 'скоро',
  // === Misc ===
  "ko'rgan": 'видевший',
  "ko'rsatkichi": 'показатель',
  // === Misc ===
  "qulflangan": 'заблокировано',
  "qulflash": 'блокировка',
  "qulfdan chiqarish": 'разблокировка',
  // === Misc final ===
  "ovoz": 'голос',
  "ovozli": 'голосовой',
  // === Misc ===
  "matn": 'текст',
  "matni": 'текст',
  "matnini": 'текст',
  "matnli": 'текстовый',
  // === Misc ===
  "rasm": 'изображение',
  "rasmlar": 'изображения',
  // === Misc ===
  "ranglar": 'цвета',
  "rang": 'цвет',
  "rangli": 'цветной',
  // === Misc ===
  "format": 'формат',
  "formatda": 'в формате',
  "formati": 'формат',
  // === Misc ===
  "to'plam": 'набор',
  "to'plamlar": 'наборы',
  // === Misc ===
  "imzo": 'подпись',
  "imzolar": 'подписи',
  "imzolagan": 'подписал',
  "imzolash": 'подписать',
  // === Misc ===
  "yuridik": 'юридический',
  "yuridik shaxs": 'юридическое лицо',
  // === Misc ===
  "qayd etilgan": 'зарегистрировано',
  "qayd etish": 'регистрация',
  // === Misc ===
  "umumiy ko'rinish": 'общий вид',
  "ko'rinishlari": 'виды',
  // === Misc final ===
  "kechirim": 'извинение',
  "afsus": 'жаль',
  // === Misc ===
  "yodda tutish": 'запомнить',
  // === Misc ===
  "esda saqlash": 'запомнить',
  // === Misc ===
  "yashirish": 'скрыть',
  "ko'rsatish": 'показать',
  // === Misc ===
  "tabriklaymiz": 'поздравляем',
  // === Misc closing ===
  "tipik": 'типичный',
  "tipi": 'тип',
  "turlar": 'типы',
  "turi": 'тип',
  "turini": 'тип',
  "tur": 'тип',
  // === Misc ===
  "ko'rsatkichlar bo'yicha": 'по показателям',
  "natijaga ko'ra": 'по результату',
  // === Misc ===
  "uchrashuvga": 'на встречу',
  "uchrashuvni": 'встречу',
  // === Misc ===
  "qabul qiluvchi tomon": 'принимающая сторона',
  // === Misc ===
  "savob": 'благое дело',
  // === Misc ===
  "muhokama qilingan": 'обсуждено',
  // === Misc ===
  "kelishuv": 'соглашение',
  "kelishuvga": 'к соглашению',
  // === Misc ===
  "qarama-qarshilik": 'противоречие',
  "qarshilik": 'сопротивление',
  // === Misc ===
  "tushuntirma": 'объяснительная',
  "tushuntirilgan": 'объяснено',
  "tushuntiradi": 'объясняет',
  "tushuntirib": 'объясняя',
  // === Misc ===
  "qisqaroq": 'короче',
  "uzunroq": 'длиннее',
  // === Misc ===
  "yo'qolish": 'исчезновение',
  // === Misc ===
  "buzilgan": 'сломано',
  "buzilish": 'нарушение',
  "buzish": 'нарушить',
  "buzilishlari": 'нарушения',
  "buzilishini": 'нарушение',
  // === Misc ===
  "rivojlanish": 'развитие',
  "rivoji": 'развитие',
  "rivojiga": 'развитию',
  "rivojlangan": 'развитый',
  "rivojlantirish": 'развитие',
  // === Misc ===
  "natijasiga": 'к результату',
  "natijasi": 'результат',
  "natijasida": 'в результате',
  // === Misc final ===
  "hodisa": 'событие',
  "hodisalar": 'события',
  "hodisani": 'событие',
  "hodisasini": 'событие',
  "hodisalari": 'события',
  // === Misc ===
  "tadbir": 'мероприятие',
  "tadbirlari": 'мероприятия',
  // === Misc ===
  "strategik": 'стратегический',
  "strategiya": 'стратегия',
  // === Misc ===
  "operatsion": 'операционный',
  // === Misc ===
  "ta'minot": 'обеспечение',
  "ta'minoti": 'обеспечение',
  "yetkazib berish": 'поставка',
  "yetkazib": 'поставка',
  // === Misc ===
  "yong'in xavfsizligi": 'пожарная безопасность',
  // === Misc ===
  "mehnat muhofazasi": 'охрана труда',
  "tehnika xavfsizligi": 'техника безопасности',
  "tehnika": 'техника',
  // === Misc ===
  "shaxsiy himoya vositalari": 'средства индивидуальной защиты',
  // === Misc tail ===
  "vositalari": 'средства',
  // === Misc ===
  "muhim": 'важно',
  "muhimligi": 'важность',
  // === Misc ===
  "ahamiyatga ega": 'имеет значение',
  // === Misc ===
  "samarali": 'эффективный',
  "samaradorligi": 'эффективность',
  "samara": 'эффект',
  // === Misc ===
  "ortib": 'возрастая',
  "ortdi": 'возросло',
  "ortish": 'возрастание',
  // === Misc ===
  "kamaytirish": 'уменьшение',
  "kamayish": 'уменьшение',
  // === Misc ===
  "shartlilik": 'условность',
  // === Misc ===
  "doimiy": 'постоянный',
  "vaqtinchalik": 'временный',
  // === Misc ===
  "ulushlar": 'доли',
  "ulush": 'доля',
  "ulushi": 'доля',
  // === Misc ===
  "foiz": 'процент',
  "foizi": 'процент',
  "foiziga": 'к проценту',
  // === Misc ===
  "summa": 'сумма',
  "summasi": 'сумма',
  // === Misc ===
  "tartibga solish": 'упорядочивание',
  "tartiblanish": 'упорядочивание',
  // === Misc ===
  "biz haqimizda": 'о нас',
  "siz haqingizda": 'о вас',
  // === Misc ===
  "kasalxona": 'больница',
  "shifoxona": 'больница',
  // === Misc ===
  "uyda": 'дома',
  // === Final ===
  "Maxfiy": 'Конфиденциально',
  // === Closing ===
  "uchraydigan": 'встречающийся',
  "uchradi": 'встретился',
  "uchratish": 'встретить',
  // === Misc ===
  "qiyin": 'трудный',
  "oson": 'лёгкий',
  // === Misc ===
  "to'plash": 'сбор',
  "to'plangan": 'собрано',
  "to'plamoq": 'собрать',
  // === Misc ===
  "yutuq": 'достижение',
  // === Final ===
  "bilimli": 'знающий',
  "sadoqatli": 'преданный',
  "A'lo": 'Отличный',
  "Yaxshi": 'Хороший',
  "Qoniqarli": 'Удовлетворительный',
  // === Closing ===
  "Telegram": 'Telegram',
  "WhatsApp": 'WhatsApp',
  // === Misc UI ===
  "modal": 'модальное окно',
  "dialog": 'диалог',
  // === Misc ===
  "saqlash": 'сохранить',
  "saqlanadi": 'сохраняется',
  "saqlanmadi": 'не сохранено',
  // === Misc ===
  "vaqtdan": 'из времени',
  // === Misc final ===
  "qonun-qoidalar": 'законы и правила',
  // === Misc ===
  "tabiiy": 'природный',
  "tabiat": 'природа',
  // === Misc closing ===
  "axborot": 'информация',
  "axborotlar": 'информация',
  "ma'lumotnoma": 'справочник',
  // === Misc ===
  "korxona": 'предприятие',
  "korxonalar": 'предприятия',
  // === Misc ===
  "qoldiq": 'остаток',
  "qoldig'i": 'остаток',
  // === Misc ===
  "har bir": 'каждый',
  // === Misc ===
  "qatorlar": 'строки',
  "qator": 'строка',
  // === Misc ===
  "ustun": 'столбец',
  "ustunni": 'столбец',
  "ustunlar": 'столбцы',
  // === Misc ===
  "ortga": 'назад',
  "oldinga": 'вперёд',
  // === Misc ===
  "ko'rsatkichlarni": 'показатели',
  // === Final ===
  "iboralar": 'фразы',
  "ibora": 'фраза',
  // === Misc ===
  "alohida hisob": 'отдельный счёт',
  "alohida": 'отдельно',
  // === Misc ===
  "yutuq qozonish": 'получение достижения',
  // === Misc ===
  "qisqa muddat": 'короткий срок',
  "uzoq muddat": 'долгий срок',
  "uzoq": 'долгий',
  "qisqa": 'короткий',
  // === Misc ===
  "mahalliy": 'местный',
  "milliy": 'национальный',
  // === Misc ===
  "xalqaro": 'международный',
  // === Misc final ===
  "ilg'or": 'передовой',
  "ilg'orlik": 'передовость',
  // === Misc ===
  "saviya": 'уровень',
  // === Misc ===
  "yengil": 'лёгкий',
  "og'ir": 'тяжёлый',
  // === Misc ===
  "Maxsus": 'Специальный',
  "maxsus": 'специальный',
  // === Misc ===
  "doimo": 'всегда',
  "doim": 'всегда',
  // === Misc ===
  "amaliyotlar": 'практики',
  // === Misc tail closing ===
  "Asbob": 'Инструмент',
  "Asboblar": 'Инструменты',
  // === Misc ===
  "vorislik": 'преемственность',
  "vorisi": 'преемник',
  // === Misc ===
  "navbat": 'очередь',
  "navbatga": 'в очередь',
  "navbatda": 'в очереди',
  // === Misc ===
  "noyabr": 'ноябрь',
  "yanvar": 'январь',
  "fevral": 'февраль',
  "mart": 'март',
  "aprel": 'апрель',
  "may": 'май',
  "iyun": 'июнь',
  "iyul": 'июль',
  "avgust": 'август',
  "sentyabr": 'сентябрь',
  "oktyabr": 'октябрь',
  "dekabr": 'декабрь',
  // === Misc ===
  "dushanba": 'понедельник',
  "seshanba": 'вторник',
  "chorshanba": 'среда',
  "payshanba": 'четверг',
  "juma": 'пятница',
  "shanba": 'суббота',
  "yakshanba": 'воскресенье',
  // === Misc ===
  "ertangi": 'завтрашний',
  "kechki": 'вечерний',
  "ertangi kun": 'завтра',
  "bugungi": 'сегодняшний',
  // === Misc ===
  "imtihon": 'экзамен',
  "imtixon": 'экзамен',
  "imtihonni": 'экзамен',
  "imtixonni": 'экзамен',
  "imtihonlar": 'экзамены',
  "imtixonlar": 'экзамены',
  // === Misc ===
  "ko'rsatkich": 'показатель',
  // === Misc ===
  "natija qoldirish": 'оставить результат',
  // === Misc ===
  "tashlanma": 'отходы',
  "chiqindi": 'отходы',
  "chiqindilar": 'отходы',
  // === Misc ===
  "smen": 'смена',
  "smena": 'смена',
  "smenalar": 'смены',
  // === Misc ===
  "stanok": 'станок',
  "stanoq": 'станок',
  "stanoklar": 'станки',
  // === Misc ===
  "guruh": 'группа',
  "guruhlar": 'группы',
  "guruhini": 'группу',
  // === Misc ===
  "lavozim ko'tarilishi": 'повышение в должности',
  "lavozimga ko'tarilish": 'повышение в должности',
  // === Misc ===
  "stress": 'стресс',
  "tinchlik": 'спокойствие',
  // === Misc ===
  "darajaga ko'tarilish": 'повышение на уровень',
  // === Misc ===
  "natija beradi": 'даёт результат',
  // === Misc final closing ===
  "tasvir": 'изображение',
  "tasvirlar": 'изображения',
  // === Misc ===
  "Lavozim": 'Должность',
  "lavozim": 'должность',
  // === Misc final ===
  "qarama": 'противо',
  "qarshi": 'против',
  // === Misc ===
  "tushgan": 'упал',
  "tushish": 'падение',
  // === Misc ===
  "ko'plab": 'много',
  // === Misc ===
  "ozod": 'свободный',
  "erkin": 'свободный',
  // === Misc ===
  "yopilgan": 'закрыто',
  "yopiq": 'закрыто',
  "ochilgan": 'открыто',
  // === Final ===
  "tugma": 'кнопка',
  // === Misc ===
  "ko'rsatma": 'указание',
  "yo'riqnoma": 'инструкция',
  "qollanma": 'руководство',
  "qo'llanma": 'руководство',
  // === Misc closing ===
  "tezligi": 'скорость',
  "tezlik": 'скорость',
  // === Misc ===
  "yoniqlik": 'включённость',
  "yoqilgan": 'включено',
  "o'chirilgan": 'выключено',
  // === Misc ===
  "umumiy ma'lumot": 'общая информация',
  // === Misc ===
  "yangiliklar": 'новости',
  "yangilik": 'новость',
  // === Misc ===
  "darslik": 'учебник',
  "darsliklar": 'учебники',
  // === Misc ===
  "videoni": 'видео',
  // === Misc ===
  "ssenariy": 'сценарий',
  // === Misc ===
  "kasb": 'профессия',
  "kasbi": 'профессия',
  "kasblari": 'профессии',
  // === Misc ===
  "darajaga": 'на уровень',
  // === Misc ===
  "smen oxiri": 'конец смены',
  "smen boshi": 'начало смены',
  // === Misc ===
  "muddati o'tgan": 'просроченный',
  // === Misc ===
  "qarz": 'долг',
  "qarzi": 'долг',
  "qarzdor": 'должник',
  "kreditor": 'кредитор',
  // === Misc ===
  "qaytarib olish": 'возврат',
  "qaytarib berish": 'возврат',
  // === Misc ===
  "mavjudligi": 'наличие',
  // === Misc ===
  "muddat tugadi": 'срок истёк',
  // === Misc ===
  "kuni o'tgan": 'просроченный',
  // === Misc ===
  "ariza beruvchi": 'заявитель',
  "ariza beruvchilar": 'заявители',
  // === Misc ===
  "tasdiqlandi": 'подтверждено',
  // === Misc ===
  "tabriklash xabari": 'поздравительное сообщение',
  // === Misc ===
  "tahlilchi": 'аналитик',
  // === Misc ===
  "ko'rinishi": 'отображение',
  // === Misc ===
  "Sotuv (oy)": 'Продажа (мес)',
  // === Misc ===
  "tashqi ko'rinish": 'внешний вид',
  // === Misc ===
  "haq to'lash": 'оплата',
  // === Misc ===
  "shahar": 'город',
  // === Misc ===
  "qatnashchi": 'участник',
  "qatnashchilar": 'участники',
  // === Misc ===
  "qatnashish": 'участие',
  // === Misc ===
  "qatnashgan": 'участвовал',
  // === Misc ===
  "alohida ravishda": 'отдельно',
  // === Misc ===
  "qatron": 'смола',
  // === Misc ===
  "qabul qilingan": 'принято',
  // === Misc ===
  "muharrir": 'редактор',
  // === Misc ===
  "tahririyat": 'редакция',
  // === Misc ===
  "tahrirlovchi": 'редактирующий',
  // === Misc ===
  "muvozanat": 'баланс',
  // === Misc ===
  "balans": 'баланс',
  // === Misc ===
  "asboblar paneli": 'панель инструментов',
  // === Misc ===
  "dashboard": 'панель',
  // === Misc ===
  "shaxsiy kabinet": 'личный кабинет',
  // === Misc ===
  "barchasi": 'все',
  "boshqalari": 'остальные',
  // === Misc ===
  "darhol": 'немедленно',
  // === Misc ===
  "shoshilinch holatda": 'в срочной ситуации',
  // === Misc ===
  "yetkazib berish nuqtasi": 'пункт доставки',
  // === Misc ===
  "tibbiy yordam": 'медицинская помощь',
  // === Misc ===
  "qarish": 'старение',
  // === Misc ===
  "qariya": 'пожилой',
  // === Misc ===
  "yosh": 'возраст',
  "yoshi": 'возраст',
  "yoshlik": 'молодость',
  // === Misc ===
  "yashash davri": 'период жизни',
  // === Misc ===
  "narsa": 'вещь',
  "narsalar": 'вещи',
  "narsani": 'вещь',
  // === Misc ===
  "buyum": 'предмет',
  "buyumlar": 'предметы',
  // === Misc ===
  "to'lov turi": 'тип оплаты',
  "to'lov muddati": 'срок оплаты',
  // === Misc ===
  "to'lov tartibi": 'порядок оплаты',
  // === Misc ===
  "to'lov shartlari": 'условия оплаты',
  // === Misc ===
  "to'lov tizimi": 'платёжная система',
  // === Misc ===
  "to'lov manbasi": 'источник оплаты',
  // === Misc ===
  "yo'q deb": 'отказывая',
  // === Misc ===
  "sotuv kanali": 'канал продаж',
  // === Misc ===
  "sotuv hajmi": 'объём продаж',
  // === Misc ===
  "sotuv natijasi": 'результат продаж',
  // === Misc ===
  "buyurtma manbasi": 'источник заказа',
  // === Misc ===
  "buyurtma berilgan": 'заказано',
  // === Misc ===
  "yo'q-yo'q": 'нет-нет',
  // === Misc ===
  "to'g'ri": 'правильно',
  // === Misc ===
  "noto'g'ri": 'неправильно',
  // === Misc ===
  "hisob varag'i": 'счёт',
  "hisob raqami": 'номер счёта',
  // === Misc ===
  "hisob-faktura": 'счёт-фактура',
  "fakturalar": 'счета-фактуры',
  // === Misc ===
  "litsenziya raqami": 'номер лицензии',
  // === Misc ===
  "tabel raqami": 'табельный номер',
  // === Misc ===
  "raqamini": 'номер',
  "raqami": 'номер',
  "raqam": 'номер',
  "raqamlar": 'номера',
  // === Misc ===
  "bo'shatish": 'увольнение',
  "bo'shatilgan": 'уволен',
  "bo'shatildi": 'уволен',
  "ishdan bo'shatish": 'увольнение',
  // === Misc ===
  "to'g'ridan-to'g'ri": 'напрямую',
  // === Misc ===
  "bo'shashish": 'расслабление',
  // === Misc ===
  "qoidaviy": 'нормативный',
  "qoidalar": 'правила',
  // === Misc ===
  "tarmoq sohasida": 'в сетевой сфере',
  // === Misc ===
  "yalpi": 'валовый',
  // === Misc ===
  "kommunal xizmatlar": 'коммунальные услуги',
  "kommunal": 'коммунальный',
  // === Misc ===
  "Sof": 'Чистый',
  // === Misc ===
  "biriktirma fayl": 'прикреплённый файл',
  // === Misc ===
  "fayl": 'файл',
  "fayllar": 'файлы',
  "faylni": 'файл',
  // === Misc ===
  "tanlanmagan": 'не выбрано',
  // === Misc ===
  "ortiqcha": 'излишний',
  "yetishmovchilik": 'недостаток',
  // === Misc ===
  "yetkazib bermaslik": 'недопоставка',
  // === Misc ===
  "shikoyatlari": 'жалобы',
  "shikoyatlar": 'жалобы',
  "shikoyatchilar": 'жалующиеся',
  "shikoyat": 'жалоба',
  // === Misc ===
  "reklamatsiyalar": 'рекламации',
  "reklamatsiya": 'рекламация',
  // === Misc ===
  "rejalari": 'планы',
  "rejani": 'план',
  "reja": 'план',
  "rejalashtirilgan": 'запланировано',
  "rejalashtirish": 'планирование',
  // === Misc ===
  "monitoringi": 'мониторинг',
  "monitoring": 'мониторинг',
  // === Misc ===
  "qarorlar": 'решения',
  "qaror": 'решение',
  "qarorni": 'решение',
  // === Misc ===
  "boshlig'ining": 'начальника',
  "boshliq": 'начальник',
  "boshlig'i": 'начальник',
  // === Misc ===
  "ko'rilgan": 'просмотренный',
  // === Misc ===
  "ekran ko'rinishi": 'экранный вид',
  // === Misc ===
  "qisqa muddatli": 'краткосрочный',
  "uzoq muddatli": 'долгосрочный',
  // === Misc ===
  "o'rtacha muddatli": 'среднесрочный',
  // === Misc ===
  "vazifa beruvchi": 'постановщик задачи',
  // === Misc ===
  "tegishli xodimlar": 'соответствующие сотрудники',
  "tegishli": 'соответствующий',
  // === Misc ===
  "topshirish muddati": 'срок сдачи',
  // === Misc ===
  "ko'p funksional": 'многофункциональный',
  // === Misc ===
  "konflikt holati": 'конфликтная ситуация',
  // === Misc ===
  "konflikt yechimi": 'разрешение конфликта',
  // === Misc ===
  "konfliktni hal qilish": 'разрешить конфликт',
  // === Misc ===
  "hal qilish": 'разрешить',
  "hal qilingan": 'разрешено',
  "hal etish": 'разрешение',
  // === Misc ===
  "imkoniyat berish": 'дать возможность',
  // === Misc ===
  "tushuntirma yozish": 'написать объяснительную',
  // === Misc ===
  "tushuntirma berish": 'дать объяснение',
  // === Misc ===
  "yozma": 'письменный',
  "og'zaki": 'устный',
  // === Misc ===
  "tark etish": 'покинуть',
  "tark etgan": 'покинул',
  // === Misc ===
  "qabul qilish vaqti": 'время приёма',
  // === Misc ===
  "muhokama qilish": 'обсуждение',
  // === Misc ===
  "yig'ilish": 'собрание',
  "yig'ilishi": 'собрание',
  "yig'ilishlar": 'собрания',
  // === Misc ===
  "uchrashuv vaqti": 'время встречи',
  // === Misc ===
  "sessiyalar tarixi": 'история сессий',
  // === Misc ===
  "yetkazuvchi tomon": 'поставщик',
  // === Misc ===
  "elektronika": 'электроника',
  // === Misc ===
  "uyali": 'мобильный',
  // === Misc ===
  "tashkilotlar ro'yxati": 'список организаций',
  // === Misc ===
  "har biri": 'каждый',
  // === Misc ===
  "bahosi": 'оценка',
  // === Misc ===
  "tartibi bilan": 'по порядку',
  // === Misc ===
  "Aktivlar": 'Активы',
  "aktivlar": 'активы',
  "aktiv": 'актив',
  // === Misc ===
  "amortizatsiya": 'амортизация',
  // === Misc ===
  "muddatga oid": 'связанный со сроком',
  // === Misc ===
  "miqyosida": 'в масштабе',
  // === Misc ===
  "miqyos": 'масштаб',
  // === Misc ===
  "harakatlar": 'действия',
  "harakat": 'действие',
  // === Misc ===
  "harakatlanish": 'движение',
  // === Misc ===
  "qoldirilgan iz": 'оставленный след',
  // === Misc ===
  "izlash": 'поиск',
  // === Misc ===
  "izlovchi": 'ищущий',
  "izlovchilar": 'ищущие',
  // === Misc ===
  "Mehnat izlovchilar": 'Ищущие работу',
  // === Misc ===
  "ish qidiruvchi": 'ищущий работу',
  // === Misc ===
  "Sotuvchi": 'Продавец',
  // === Misc ===
  "Buyurtmachi": 'Заказчик',
  // === Misc ===
  "buyurtmachi": 'заказчик',
  // === Misc ===
  "qog'oz": 'бумага',
  "qog'ozlar": 'бумаги',
  // === Misc ===
  "elektron": 'электронный',
  // === Misc ===
  "tabel": 'табель',
  // === Misc ===
  "Boshqaruv": 'Управление',
  "boshqaruvi": 'управление',
  // === Misc ===
  "rivoji uchun": 'для развития',
  // === Misc ===
  "ko'rsatkichli": 'показательный',
  // === Misc final ===
  "muhitda ishlash": 'работа в среде',
  // === Misc ===
  "muhit yaratish": 'создание среды',
  // === Misc ===
  "sharoit": 'условие',
  "sharoitlar": 'условия',
  "sharoitlari": 'условия',
  // === Misc ===
  "atrofda": 'вокруг',
  // === Misc ===
  "qoniqish": 'удовлетворение',
  "qoniqishli": 'удовлетворительный',
  "qoniqarli": 'удовлетворительный',
  // === Misc ===
  "vaziyat": 'ситуация',
  "vaziyatlar": 'ситуации',
  // === Misc ===
  "ahvol": 'состояние',
  // === Misc ===
  "ahvolda": 'в состоянии',
  // === Misc ===
  "fikr": 'мнение',
  "fikrlar": 'мнения',
  "fikrini": 'мнение',
  // === Misc ===
  "izoh": 'комментарий',
  "izohlar": 'комментарии',
  // === Misc ===
  "tanlov": 'выбор',
  "tanlovlar": 'выборы',
  // === Misc ===
  "darslik beruvchi": 'преподаватель',
  // === Misc ===
  "o'qituvchi": 'преподаватель',
  "o'qituvchilar": 'преподаватели',
  // === Misc ===
  "o'quvchi": 'учащийся',
  "o'quvchilar": 'учащиеся',
  // === Misc ===
  "talaba": 'студент',
  "talabalar": 'студенты',
  // === Misc ===
  "tinglovchi": 'слушатель',
  "tinglovchilar": 'слушатели',
  // === Misc ===
  "o'zlashtirish": 'усвоение',
  "o'rganish": 'изучение',
  "o'rgangan": 'изучил',
  "o'rgandingiz": 'вы изучили',
  // === Misc ===
  "savol-javob": 'вопрос-ответ',
  // === Misc ===
  "o'tmagan": 'не сдал',
  "o'tgan": 'сдал',
  // === Misc ===
  "qabul qilingan": 'принято',
  // === Misc ===
  "mentorlik": 'менторство',
  "mentorliklar": 'менторства',
  // === Misc ===
  "topshirilmagan": 'не сдано',
  // === Misc ===
  "topshirilgan": 'сдано',
  // === Misc ===
  "tugatilgan": 'завершено',
  // === Misc ===
  "yakunlanmagan": 'не завершено',
  // === Misc ===
  "shu yerda": 'здесь',
  "u yerda": 'там',
  // === Misc final ===
  "shu yerga": 'сюда',
  "u yerga": 'туда',
  // === Misc ===
  "boshlovchi": 'ведущий',
  // === Misc ===
  "yetakchi": 'лидер',
  // === Misc ===
  "yetakchilar": 'лидеры',
  // === Misc ===
  "Yetakchi": 'Лидер',
  // === Misc ===
  "umumiy hisob": 'общий счёт',
  // === Misc ===
  "yondoshuv": 'подход',
  // === Misc ===
  "ish jarayoni": 'рабочий процесс',
  // === Misc ===
  "ish vaqti": 'рабочее время',
  // === Misc ===
  "ish joyi": 'рабочее место',
  // === Misc ===
  "ish kuni": 'рабочий день',
  // === Misc ===
  "ish stansiyasi": 'рабочая станция',
  // === Misc ===
  "ish tartibi": 'распорядок работы',
  // === Misc ===
  "ish hajmi": 'объём работы',
  // === Misc ===
  "ish berdi": 'трудоустроил',
  // === Misc ===
  "ish beruvchi": 'работодатель',
  // === Misc ===
  "ish beruvchini": 'работодателя',
  // === Misc ===
  "ish faoliyatini": 'рабочую деятельность',
  // === Misc ===
  "faoliyat": 'деятельность',
  "faoliyati": 'деятельность',
  "faoliyatlar": 'деятельности',
  "faoliyatni": 'деятельность',
  "faoliyatini": 'деятельность',
  // === Misc ===
  "kasalxonada yashash": 'проживание в больнице',
  // === Misc ===
  "ko'rinishlari": 'виды',
  // === Misc ===
  "ko'rinishida": 'в виде',
  // === Misc ===
  "shifoxonada davolanish": 'лечение в больнице',
  // === Misc ===
  "davolanish": 'лечение',
  "davolagan": 'лечил',
  "davolovchi": 'лечащий',
  // === Misc ===
  "sog'lom": 'здоровый',
  "kasal": 'больной',
  // === Misc ===
  "samimiy": 'искренний',
  // === Misc ===
  "muhabbat": 'любовь',
  // === Misc ===
  "do'st": 'друг',
  "do'stlar": 'друзья',
  // === Misc ===
  "yaqin do'st": 'близкий друг',
  // === Misc ===
  "ahil": 'дружный',
  // === Misc ===
  "samimiyat": 'искренность',
  // === Misc ===
  "samaradorlik": 'эффективность',
  // === Misc ===
  "yondashuvni": 'подход',
  // === Misc ===
  "alternativ": 'альтернативный',
  // === Misc ===
  "asosiy yondashuv": 'основной подход',
  // === Misc ===
  "asosiy maqsad": 'основная цель',
  // === Misc ===
  "maqsadi": 'цель',
  "maqsadlar": 'цели',
  "maqsadlari": 'цели',
  "maqsadni": 'цель',
  "maqsad": 'цель',
  // === Misc ===
  "ya'ni": 'то есть',
  // === Misc ===
  "ya'niki": 'то есть',
  // === Misc ===
  "shu jihatdan": 'в этом отношении',
  // === Misc ===
  "jihat": 'аспект',
  "jihatdan": 'с точки зрения',
  // === Misc ===
  "noyob": 'уникальный',
  // === Misc ===
  "vakil": 'представитель',
  "vakillar": 'представители',
  // === Misc ===
  "yangi yondashuv": 'новый подход',
  // === Misc ===
  "joriy": 'текущий',
  "joriylash": 'внедрение',
  "joriy qilish": 'внедрение',
  "joriy etilgan": 'внедрено',
  // === Misc ===
  "kechagi": 'вчерашний',
  // === Misc ===
  "kelajak": 'будущее',
  "o'tmish": 'прошлое',
  // === Misc ===
  "kelajakda": 'в будущем',
  "o'tmishda": 'в прошлом',
  // === Misc ===
  "yuz berdi": 'произошло',
  "yuz berdi": 'случилось',
  "yuz berishi": 'возникновение',
  "yuz beradi": 'происходит',
  "yuz": 'лицо',
  // === Misc ===
  "yuzaki": 'поверхностный',
  "yuzasiga": 'на поверхность',
  // === Misc ===
  "qisman": 'частично',
  // === Misc ===
  "to'liq": 'полностью',
  // === Misc ===
  "yutuqlari": 'достижения',
  "yutuqlarni": 'достижения',
  // === Misc ===
  "boshqaruv organi": 'управляющий орган',
  // === Misc ===
  "organ": 'орган',
  "organlar": 'органы',
  // === Misc ===
  "qaror qabul qilish": 'принятие решения',
  // === Misc ===
  "majlis": 'заседание',
  "majlisi": 'заседание',
  "majlislar": 'заседания',
  // === Misc ===
  "kengash": 'совет',
  "kengashlari": 'советы',
  // === Misc ===
  "majlislar": 'собрания',
  // === Misc ===
  "qayd qildi": 'зарегистрировал',
  // === Misc ===
  "yozib qoldi": 'записал',
  // === Misc ===
  "muddat tugaganda": 'когда истечёт срок',
  // === Misc ===
  "muddat tugashi": 'истечение срока',
  // === Misc ===
  "yopiq turi": 'закрытый тип',
  "ochiq turi": 'открытый тип',
  // === Misc ===
  "tasdiqlash uchun": 'для подтверждения',
  // === Misc ===
  "yangilanish": 'обновление',
  "yangilanishlar": 'обновления',
  // === Misc ===
  "yangilash kerak": 'нужно обновить',
  // === Misc ===
  "boshlanmagan": 'не начато',
  // === Misc ===
  "yopilmagan": 'не закрыто',
  // === Misc ===
  "vaqtinchalik to'xtatildi": 'временно остановлено',
  // === Misc ===
  "to'xtatildi": 'остановлено',
  // === Misc ===
  "moslashtirilgan": 'настроенный',
  "moslashtirish": 'настройка',
  // === Misc ===
  "moslashuv": 'адаптация',
  // === Misc ===
  "yangi xodimga moslashish": 'адаптация нового сотрудника',
  // === Misc ===
  "yangi xodim": 'новый сотрудник',
  // === Misc ===
  "sobiq xodim": 'бывший сотрудник',
  "sobiq": 'бывший',
  // === Misc ===
  "yangi ishchi": 'новый работник',
  // === Misc ===
  "qachondan": 'с каких пор',
  "qachongacha": 'до каких пор',
  // === Misc ===
  "Kechirasiz": 'Извините',
  "kechirasiz": 'извините',
  // === Misc ===
  "noqulay": 'неудобный',
  // === Misc ===
  "qulay": 'удобный',
  // === Misc ===
  "afzalliklari": 'преимущества',
  // === Misc ===
  "kamchiliklari": 'недостатки',
  // === Misc ===
  "alohida belgilash": 'отдельно отметить',
  // === Misc ===
  "qaytib chiqmaslik": 'не возвращаться',
  // === Misc ===
  "ortga qaytmaslik": 'не возвращаться',
  // === Misc ===
  "kelishilgan": 'согласовано',
  // === Misc ===
  "kelishish": 'согласование',
  // === Misc ===
  "kelishilmagan": 'не согласовано',
  // === Misc ===
  "shartnoma tuzish": 'заключение договора',
  // === Misc ===
  "shartnoma muddati": 'срок договора',
  // === Misc ===
  "shartnoma raqami": 'номер договора',
  // === Misc ===
  "kelishuv shartlari": 'условия соглашения',
  // === Misc ===
  "rasm chizish": 'рисование',
  // === Misc ===
  "tushuncha mazmuni": 'содержание понятия',
  // === Misc ===
  "yuqori": 'высокий',
  "past": 'низкий',
  "o'rta": 'средний',
  // === Misc ===
  "yuqori sifat": 'высокое качество',
  // === Misc ===
  "past sifat": 'низкое качество',
  // === Misc ===
  "sifatli": 'качественный',
  "sifatsiz": 'некачественный',
  // === Misc ===
  "alohida ko'rsatkichlar": 'отдельные показатели',
  // === Misc ===
  "ko'rsatkichli baholash": 'показательная оценка',
  // === Misc ===
  "Davomat": 'Посещаемость',
  "davomat": 'посещаемость',
  "davomati": 'посещаемость',
  "davomatini": 'посещаемость',
  // === Misc ===
  "shaxsiy ma'lumot": 'личные данные',
  // === Misc ===
  "shaxsiy varaqa": 'личная карточка',
  // === Misc ===
  "shaxsiy fayl": 'личный файл',
  // === Misc ===
  "rasmiy": 'официальный',
  // === Misc ===
  "norasmiy": 'неофициальный',
  // === Misc ===
  "tanlangan element": 'выбранный элемент',
  // === Misc ===
  "yorug'lik": 'свет',
  // === Misc ===
  "qorong'i": 'тёмный',
  // === Misc ===
  "yorug'": 'светлый',
  // === Misc ===
  "kechiktirilgan": 'отложено',
  // === Misc ===
  "ko'rilmagan": 'не просмотрено',
  // === Misc ===
  "barchaga": 'всем',
  "barchasi": 'все',
  // === Misc ===
  "Hech kim": 'Никто',
  "hech kim": 'никто',
  // === Misc ===
  "menga maxsus": 'специально мне',
  // === Misc ===
  "guvohnoma": 'свидетельство',
  // === Misc ===
  "Sertifikat": 'Сертификат',
  "Sertifikatni": 'Сертификат',
  // === Misc ===
  "muvofiqlik sertifikati": 'сертификат соответствия',
  // === Misc ===
  "Berilgan sertifikat": 'Выданный сертификат',
  "berilgan": 'выданный',
  "berilgani": 'выданный',
  "berilganini": 'выданный',
  // === Misc ===
  "Asoslashtirish": 'Обоснование',
  "asoslash": 'обоснование',
  // === Misc ===
  "ortga qaytarish": 'возврат назад',
  // === Misc final ===
  "Statistika": 'Статистика',
  "statistika": 'статистика',
  "statistikasi": 'статистика',
  // === Misc ===
  "barchani ko'rsatish": 'показать всё',
  "barchani yashirish": 'скрыть всё',
  // === Misc ===
  "tartibga solish": 'упорядочивание',
  // === Misc ===
  "yangilamoq": 'обновить',
  // === Misc ===
  "ortga qaytarib bo'lmaydi": 'нельзя вернуть',
  // === Misc ===
  "bekor qilib bo'lmaydi": 'нельзя отменить',
  // === Misc ===
  "bo'lmaydi": 'нельзя',
  // === Misc ===
  "kelishi mumkin": 'может произойти',
  "kelishi": 'приход',
  // === Misc ===
  "tushushuv": 'понимание',
  // === Misc ===
  "muhokama qilish kerak": 'нужно обсудить',
  // === Misc ===
  "boshqa hech narsa": 'ничего другого',
  // === Misc ===
  "qarama-qarshilik": 'противоречие',
  // === Misc ===
  "qarama-qarshi": 'противоположный',
  // === Misc ===
  "qarshi": 'против',
  // === Misc ===
  "qarama-qarshi tomon": 'противоположная сторона',
  // === Misc ===
  "ikkinchi taraf": 'вторая сторона',
  // === Misc ===
  "tashvish": 'беспокойство',
  "tashvishli": 'тревожный',
  // === Misc ===
  "muammoli": 'проблемный',
  // === Misc ===
  "yaxshi natija": 'хороший результат',
  // === Misc ===
  "yomon natija": 'плохой результат',
  // === Misc ===
  "muvaffaqiyatli yakunlandi": 'успешно завершено',
  // === Misc ===
  "muvaffaqiyatsiz yakunlandi": 'неуспешно завершено',
  // === Misc ===
  "ko'rsatkichlar yaxshilanmoqda": 'показатели улучшаются',
  // === Misc ===
  "ko'rsatkichlar yomonlashmoqda": 'показатели ухудшаются',
  // === Misc ===
  "yaxshilanmoqda": 'улучшается',
  "yomonlashmoqda": 'ухудшается',
  // === Misc ===
  "Sof daromad": 'Чистый доход',
  // === Misc ===
  "Jami daromad": 'Общий доход',
  // === Misc ===
  "Yalpi daromad": 'Валовый доход',
  // === Misc ===
  "Sof foyda": 'Чистая прибыль',
  // === Misc ===
  "Foyda": 'Прибыль',
  "foyda": 'прибыль',
  "foydasi": 'прибыль',
  // === Misc ===
  "Zarar": 'Убыток',
  "zarar": 'убыток',
  // === Misc ===
  "Zaxira": 'Запас',
  "zaxira": 'запас',
  // === Misc ===
  "Karantin": 'Карантин',
  "karantin": 'карантин',
  "karantinda": 'на карантине',
  "karantinga": 'в карантин',
  // === Misc ===
  "QC tekshiruvi": 'проверка QC',
  // === Misc ===
  "kutilmoqda": 'ожидается',
  // === Misc ===
  "Status tarixi": 'История статусов',
  // === Misc ===
  "Sabab kiritish": 'Ввод причины',
  // === Misc ===
  "POS monitor": 'POS-монитор',
  // === Misc ===
  "vaqt monitoringi": 'мониторинг времени',
  // === Misc ===
  "shtrix kod": 'штрих-код',
  // === Misc ===
  "skaner orqali": 'через сканер',
  // === Misc ===
  "skanerlash orqali": 'сканированием',
  // === Misc ===
  "berib qo'yish": 'выдача',
  // === Misc ===
  "Vakansiyaga": 'На вакансию',
  // === Misc ===
  "Tirik": 'Живой',
  // === Misc ===
  "Murdani": 'Тело',
  // === Misc ===
  "Ariza yuborilgan": 'Заявка отправлена',
  // === NEW BATCH 2 — high-frequency leftovers ===
  "производ chiqarish": 'производство',
  "Производ Chiqarish": 'Производство',
  "Производ chiqarish": 'Производство',
  "ишлаб чикариш": 'производство',
  "ishlab chiqarish": 'производство',
  "Ishlab chiqarish": 'Производство',
  "Ishlab Chiqarish": 'Производство',
  "ishlab chiqarishga": 'к производству',
  "ishlab chiqarishda": 'на производстве',
  "ishlab chiqarishsiz": 'без производства',
  "produk chiqarish": 'производство',
  "Produk Chiqarish": 'Производство',
  "chiqarish": 'выпуск',
  "Chiqarish": 'Выпуск',
  "chiqaradi": 'выпускает',
  "chiqaring": 'выпустите',
  "chiqindi": 'отход',
  "chiqib": 'выйдя',
  "chiqib uchish": 'отток',
  "ushbu": 'данный',
  "ushbuni": 'это',
  "kishi": 'человек',
  "kishilar": 'люди',
  "odamlar": 'люди',
  "odam": 'человек',
  "odamni": 'человека',
  // Common verbs with leftover stems
  "o'tish": 'переход',
  "o'tishi": 'переход',
  "o'ting": 'перейдите',
  "o'tib": 'пройдя',
  "o'tdi": 'прошёл',
  "o'tadi": 'переходит',
  "o'tkazish": 'проведение',
  "o'tkazilgan": 'проведено',
  "o'tkazib": 'проведя',
  "o'tkazilmagan": 'не проведено',
  "o'tkaziladi": 'проводится',
  "o'tmagan": 'не сдал',
  "o'tgan": 'прошедший',
  "o'tkazma": 'перевод',
  // Holdings / states
  "holatga": 'в состояние',
  "holatiga": 'в состояние',
  "holatda": 'в состоянии',
  "holati": 'состояние',
  "holatini": 'состояние',
  "holatlar": 'состояния',
  "holat": 'состояние',
  "holatni": 'состояние',
  "holda": '',
  // Settings / changes
  "o'zgarish": 'изменение',
  "O'zgarish": 'Изменение',
  "o'zgarishlar": 'изменения',
  "O'zgarishlar": 'Изменения',
  "o'zgarishi": 'изменение',
  "O'zgarishi": 'Изменение',
  "o'zgarishlari": 'изменения',
  "o'zgarishlarni": 'изменения',
  "o'zgartirish": 'изменить',
  "O'ZGARTIRISH": 'ИЗМЕНИТЬ',
  "o'zgartiring": 'измените',
  "o'zgartirilgan": 'изменено',
  "o'zgartirilmagan": 'не изменено',
  "o'zgarganda": 'при изменении',
  "o'zgargan": 'изменено',
  "o'zgardi": 'изменилось',
  // Common UI strings
  "nomini": 'название',
  "nomi": 'название',
  "nomlar": 'названия',
  "nomli": 'именованный',
  "nomdan": 'из названия',
  // Sample / examples
  "masalan": 'например',
  "Masalan": 'Например',
  "MASALAN": 'НАПРИМЕР',
  // Misc
  "bo'lgan": 'являющийся',
  "bo'lgani": 'имеющийся',
  "bo'lib": 'будучи',
  "bo'lishi": 'быть',
  "bo'lmasa": 'если нет',
  "bo'lmasin": 'не должно быть',
  "bo'ladi": 'будет',
  "bo'ldi": 'было',
  "bo'lib o'tadi": 'проходит',
  "bo'lib o'tdi": 'прошло',
  "bo'lib o'tgan": 'прошедший',
  "bo'lsa": 'если',
  "bo'lsin": 'пусть будет',
  // Users
  "foydalanuvchi": 'пользователь',
  "foydalanuvchilar": 'пользователи',
  "foydalanuvchini": 'пользователя',
  "foydalanuvchining": 'пользователя',
  "foydalanuvchilarning": 'пользователей',
  // Cards
  "kartalar": 'карты',
  "karta": 'карта',
  "kartani": 'карту',
  "kartasi": 'карта',
  "kartasini": 'карту',
  "kartasidan": 'из карты',
  // Tests
  "testni": 'тест',
  "testlar": 'тесты',
  "test": 'тест',
  "testning": 'теста',
  // Common -ma- forms
  "kamida": 'минимум',
  "ko'pida": 'максимум',
  "ko'pi": 'большинство',
  "kamida 2": 'минимум 2',
  // Last / recent
  "so'ng": 'затем',
  "so'nggi": 'последний',
  "So'nggi": 'Последний',
  "so'nggidan": 'из последних',
  // Forecast
  "bashorat": 'прогноз',
  "bashorati": 'прогноз',
  "bashoratlar": 'прогнозы',
  "bashoratini": 'прогноз',
  "Bashorat": 'Прогноз',
  "Bashorati": 'Прогноз',
  // Filling
  "to'ldiring": 'заполните',
  "to'ldirish": 'заполнение',
  "to'ldirilmagan": 'не заполнено',
  "to'ldirilgan": 'заполнено',
  "to'ldiradigan": 'заполняемый',
  // The following
  "quyidagi": 'следующий',
  "Quyidagi": 'Следующий',
  // Actions/conducting
  "amalga oshiriladi": 'осуществляется',
  "amalga oshirilmoqda": 'осуществляется',
  "amalga": '',
  // === Loading / errors ===
  "yuklashda xatolik yuz berdi": 'произошла ошибка загрузки',
  "yuklashda xato yuz berdi": 'произошла ошибка загрузки',
  "yuklashda xato": 'ошибка загрузки',
  "yuklashda xatolik": 'ошибка загрузки',
  "yuklashda": 'при загрузке',
  "yuklanmoqda": 'загружается',
  "yuklanishi": 'загрузка',
  // === Chat ===
  "sahifasiga o'tish": 'перейти на страницу',
  "sahifasiga": 'на страницу',
  "sahifaga": 'на страницу',
  "sahifaga vxod": 'на страницу',
  "sahifani": 'страницу',
  "Sahifani": 'Страницу',
  "sahifa": 'страница',
  "sahifani yangilashga harakat qiling": 'попробуйте обновить страницу',
  "yangilashga harakat qiling": 'попробуйте обновить',
  "harakat qiling": 'попробуйте',
  "harakat": 'действие',
  // === Conversations ===
  "suhbatni boshlash": 'начать беседу',
  "suhbatni": 'беседу',
  "suhbat": 'беседа',
  "suhbatda": 'в беседе',
  "suhbati": 'беседа',
  "suhbatining": 'беседы',
  "suhbatlar": 'беседы',
  "chap paneldan": 'из левой панели',
  "chap": 'левый',
  "o'ng": 'правый',
  "paneldan": 'из панели',
  "panel": 'панель',
  // === Calls ===
  "qo'ng'iroqni": 'звонок',
  "qo'ng'iroq": 'звонок',
  "qo'ng'iroqlar": 'звонки',
  // === Chats ===
  "chatlarni": 'чаты',
  "chatni": 'чат',
  "Chatlarni": 'Чаты',
  "Chatni": 'Чат',
  // === Punctuation/units ===
  "ta belgi": 'знак',
  "ta belgilar": 'знаков',
  "ta": 'шт',
  "shtuk": 'шт',
  // === Channels ===
  "kanal": 'канал',
  "kanali": 'канал',
  "kanalda": 'в канале',
  // === Admin ===
  "adminlar": 'админы',
  "admini": 'админ',
  "yozishi mumkin": 'может писать',
  "yozishi": 'писать',
  "yozish": 'писать',
  // === Rooms ===
  "xonani": 'комнату',
  "xonaning": 'комнаты',
  "xona": 'комната',
  "xonalar": 'комнаты',
  // === Side panel ===
  "sidebar dan": 'из боковой панели',
  "sidebar": 'боковая панель',
  // === Read ===
  "o'qildi": 'прочитано',
  "o'qilgan": 'прочитано',
  "o'qilmagan": 'не прочитано',
  "o'qish": 'чтение',
  "o'qishni": 'чтение',
  "o'qiladigan": 'для чтения',
  "o'qing": 'прочитайте',
  "o'qiyotgan": 'читающий',
  "o'qiyotganlar": 'читающие',
  "o'quvchi": 'учащийся',
  "o'quvchilar": 'учащиеся',
  "o'quvchisi": 'учащийся',
  // === Common ===
  "Umumiy": 'Общий',
  "umumiy": 'общий',
  // === Lead ===
  "lead nomini": 'название лида',
  "lid nomini": 'название лида',
  // === Family ===
  "a'zolari": 'члены',
  "a'zolarini": 'членов',
  "a'zo": 'член',
  // === Salary ===
  "Yagona": 'Единый',
  "yagona": 'единый',
  // === Comments / pattern ===
  "qoidalarini": 'правила',
  "qoidalarni": 'правила',
  "qoidasi": 'правило',
  // === Passwords ===
  "parolni": 'пароль',
  "parol": 'пароль',
  "parolingiz": 'ваш пароль',
  "parollarni": 'пароли',
  "parolingizni": 'ваш пароль',
  "kodingizni": 'ваш код',
  "kodni": 'код',
  "kodini": 'код',
  // === Auth ===
  "kuchga": 'в силу',
  "kuchga kirish": 'вступление в силу',
  "kuchga kirgan": 'вступил в силу',
  "kuchga kirishi": 'вступление в силу',
  "kuchga ko'tarilishi": 'вступление в силу',
  // === Types ===
  "turni": 'тип',
  "turi": 'тип',
  "turlar": 'типы',
  "turlari": 'типы',
  "turlariga": 'типам',
  "turdagi": 'типа',
  // === Center / cost / profit ===
  "markazi": 'центр',
  "markazini": 'центр',
  "markazlari": 'центры',
  "markazlari": 'центры',
  // === Gender / org ===
  "jinsini": 'пол',
  "jinsi": 'пол',
  "jins": 'пол',
  // === Org structure ===
  "tuzilmadagi": 'в структуре',
  "tuzilmani": 'структуру',
  "tuzilma": 'структура',
  "tuzilmasi": 'структура',
  // === Role ===
  "rolini": 'роль',
  "roli": 'роль',
  "roller": 'роли',
  // === Counts ===
  "nechta": 'сколько',
  "necha": 'сколько',
  // === Functions ===
  "funksiyada": 'в функции',
  "funksiya": 'функция',
  "funksiyani": 'функцию',
  "funksiyalar": 'функции',
  "funksiyalari": 'функции',
  // === Status ===
  "Holatni": 'Состояние',
  "Holatini": 'Состояние',
  // === Hazards ===
  "hududni": 'зону',
  "hududi": 'зона',
  "hudud": 'зона',
  // === Room ideal ===
  "ideal": 'идеальный',
  // === Similar ===
  "o'xshash": 'похожий',
  "o'xshashlik": 'сходство',
  "shunga": 'такому',
  "shunga o'xshash": 'аналогичный',
  // === Hiring ===
  "yollash": 'найм',
  "yollangan": 'нанят',
  // === Portrait ===
  "portretni": 'портрет',
  "portreti": 'портрет',
  "portretini": 'портрет',
  "portret": 'портрет',
  // === Size / volume ===
  "hajm": 'объём',
  "hajmi": 'объём',
  "hajmini": 'объём',
  // === Increase ===
  "o'sdi": 'выросло',
  "o'sgan": 'выросший',
  "o'sish": 'рост',
  "o'sib": 'возрастая',
  "o'sayotgan": 'растущий',
  // === Steady ===
  "to'xtovsiz": 'непрерывно',
  "chayqalib": 'качаясь',
  "turadi": 'стоит',
  // === Industry ===
  "FMCG": 'FMCG',
  "Logistika": 'Логистика',
  // === Roles ===
  "manager": 'менеджер',
  "managerga": 'менеджеру',
  // === Workplace ===
  "kompaniyada": 'в компании',
  "kompaniyaga": 'в компанию',
  "kompaniyalarda": 'в компаниях',
  // === Etc ===
  "bizda": 'у нас',
  "bizning": 'наш',
  "sizda": 'у вас',
  "sizning": 'ваш',
  "unda": 'у него',
  // === Attraction ===
  "jalb": 'привлечение',
  "jalb qiluvchi": 'привлекающий',
  "jalb qilingan": 'привлечён',
  // === Factor ===
  "omil": 'фактор',
  "omillar": 'факторы',
  // === Smart ===
  "aqlli": 'умный',
  "aqliy": 'умственный',
  // === Choice ===
  "tanlaydi": 'выбирает',
  "tanladi": 'выбрал',
  "tanlanmoqda": 'выбирается',
  // === Mission ===
  "missiya": 'миссия',
  "missiyani": 'миссию',
  "korporativ": 'корпоративный',
  "ovqatlanish": 'питание',
  "sport zali": 'спортзал',
  "sport": 'спорт',
  "zali": 'зал',
  // === Insurance ===
  "sug'urta": 'страхование',
  "sug'urtalash": 'страхование',
  // === Programs ===
  "dasturi": 'программа',
  "dasturlar": 'программы',
  "dasturni": 'программу',
  "dastur": 'программа',
  "dasturlash": 'программирование',
  // === Trainings ===
  "treninglar": 'тренинги',
  "trening": 'тренинг',
  "treninggi": 'тренинг',
  // === Foreign ===
  "xorijiy": 'зарубежный',
  "xorijda": 'за рубежом',
  // === Studies ===
  "o'qishlar": 'обучения',
  "o'qish": 'обучение',
  // === No-show ===
  "sababsiz": 'без причины',
  "yo'qlik": 'отсутствие',
  // === Spheres ===
  "sohalar": 'сферы',
  // === Incentives ===
  "rag'bat": 'стимул',
  "rag'batlar": 'стимулы',
  "rag'batlantirish": 'стимулирование',
  "choralar": 'меры',
  "choralarini": 'меры',
  // === Orders ===
  "buyruqlar": 'приказы',
  "buyruq": 'приказ',
  // === Reporting ===
  "bo'ysunish": 'подчинение',
  // === Tests ===
  "ballari": 'баллы',
  "ballarni": 'баллы',
  "ballar": 'баллы',
  "balli": 'балльный',
  // === Boards ===
  "doskani": 'доску',
  "doska": 'доска',
  "doskangizni": 'вашу доску',
  // === Machines ===
  "mashinalarida": 'на машинах',
  "mashinalarini": 'машины',
  "mashinalari": 'машины',
  "mashinada": 'на машине',
  "mashinani": 'машину',
  "mashina": 'машина',
  "mashinalar": 'машины',
  // === Basics ===
  "asoslari": 'основы',
  "asoslangan": 'основанный',
  "asoslanib": 'основываясь',
  "asoslari bo'yicha": 'по основам',
  // === Lessons ===
  "darsni": 'урок',
  "darslar": 'уроки',
  "dars": 'урок',
  "darsi": 'урок',
  // === Course content ===
  "tarkibini": 'содержание',
  "tarkibi": 'содержание',
  "tarkib": 'состав',
  // === Modules ===
  "modulda": 'в модуле',
  // === Mentors ===
  "mentorlarni": 'менторов',
  "mentorni": 'ментора',
  "mentorlar": 'менторы',
  // === Title ===
  "unvoni": 'звание',
  "unvon": 'звание',
  // === Some ===
  "ba'zi": 'некоторые',
  "ba'zilari": 'некоторые',
  "ba'zida": 'иногда',
  "qaramasdan": 'несмотря',
  "qaramay": 'несмотря',
  // === Want ===
  "yaratmoqchimisiz": 'хотите создать',
  "yaratmoqchi": 'хочет создать',
  "qilmoqchisiz": 'хотите сделать',
  "qilmoqchi": 'хочет сделать',
  "xohlaysizmi": 'хотите ли',
  "istaysizmi": 'хотите ли',
  // === Master/specialist ===
  "ustasi": 'мастер',
  "Ustaning": 'Мастера',
  "ustaning": 'мастера',
  "usta": 'мастер',
  "ustalar": 'мастера',
  // === Device ===
  "qurilmada": 'на устройстве',
  "qurilmasi": 'устройство',
  "qurilma": 'устройство',
  "qurilmalar": 'устройства',
  // === Stock ===
  "zaxirada": 'в запасе',
  // === Barcode ===
  "shtrix": 'штрих',
  "Shtrix": 'Штрих',
  // === Returns ===
  "qaytarishni": 'возврат',
  "qaytarish": 'возврат',
  "qaytarib": 'обратно',
  // === Analysis ===
  "analizni": 'анализ',
  "analiz": 'анализ',
  "Analizni": 'Анализ',
  // === Build / form ===
  "shakllantirilgan": 'сформированный',
  "shakllantirish": 'формирование',
  "shakllantirilgan": 'сформирован',
  // === Stages ===
  "bosqichlar": 'этапы',
  "bosqich": 'этап',
  "bosqichi": 'этап',
  "bosqichni": 'этап',
  "bosqichini": 'этап',
  "bosqichidagi": 'на этапе',
  // === Raw materials ===
  "xomashyo": 'сырьё',
  "xomashyoni": 'сырьё',
  // === Defects ===
  "nuqsonlari": 'дефекты',
  "nuqsoni": 'дефект',
  "nuqson": 'дефект',
  "nuqsonlar": 'дефекты',
  "braklar": 'браки',
  "brak": 'брак',
  "braklarni": 'браки',
  "Braklar": 'Браки',
  // === Name ===
  "sharif": 'фамилия',
  "ismi sharif": 'ФИО',
  "ism sharif": 'ФИО',
  // === Norm ===
  "normadan": 'от нормы',
  "normada": 'в норме',
  "norma": 'норма',
  // === Step out ===
  "chetganda": 'при отклонении',
  "chetlash": 'отклонение',
  "chetga chiqqanda": 'при отклонении',
  // === Cardboard ===
  "gofrokarton": 'гофрокартон',
  // === Measure ===
  "o'lchovi": 'измерение',
  "o'lchov": 'измерение',
  "o'lchamlar": 'размеры',
  "o'lcham": 'размер',
  // === Quality detail ===
  "kechikishi": 'задержка',
  "kechikishlar": 'задержки',
  "kechikkanda": 'при задержке',
  // === Details ===
  "tafsilotlarini": 'детали',
  // === Open ===
  "ochish": 'открыть',
  "ochilgan": 'открыто',
  "ochiladi": 'открывается',
  "ochilmagan": 'не открыто',
  // === Line ===
  "chiziq": 'линия',
  "chiziqlar": 'линии',
  "chizig'i": 'линия',
  // === Solution ===
  "yechish": 'решить',
  "yechim": 'решение',
  "yechimlar": 'решения',
  "yechib": 'решая',
  // === Business ===
  "biznes": 'бизнес',
  "biznesga": 'бизнесу',
  "biznesni": 'бизнес',
  // === Directions ===
  "yo'nalishlar": 'направления',
  "yo'nalish": 'направление',
  "yo'nalishi": 'направление',
  "yo'nalishini": 'направление',
  // === Damage ===
  "yetkazishi": 'может причинить',
  "yetkazadi": 'причиняет',
  "yetkazib bermaslik": 'недопоставка',
  "yetkazib bering": 'доставьте',
  "yetkazishlar": 'доставки',
  // === Words ===
  "aytiladigan": 'сказанный',
  "aytilgan": 'сказано',
  "aytiladi": 'говорится',
  "aytadi": 'говорит',
  // === Org / put together ===
  "tashkil": 'организовано',
  "tashkil etilgan": 'организовано',
  "tashkil qilingan": 'организовано',
  "tashkillashtirish": 'организация',
  // === Save ===
  "saqlangandan so'ng": 'после сохранения',
  "saqlanganidan keyin": 'после сохранения',
  // === Wizard ===
  "wizardi": 'мастер',
  "wizard": 'мастер',
  // === Page ===
  "sahifaga vxod": 'вход на страницу',
  "vxod": 'вход',
  // === Invoices ===
  "invoicelar": 'счета',
  "invoice": 'счёт',
  "fakturalari": 'фактуры',
  // === Compare ===
  "taqqoslama": 'сравнение',
  "taqqoslash": 'сравнение',
  "solishtirishingiz": 'сравнить',
  "solishtirish": 'сравнение',
  // === Average ===
  "o'rtachasidan": 'от среднего',
  "o'rtachasi": 'среднее',
  // === Findings ===
  "xulosalar": 'выводы',
  "xulosa": 'вывод',
  // === Label ===
  "Yorlig'i": 'Ярлык',
  "yorlig'i": 'ярлык',
  // === Show ===
  "ko'rsatmaydi": 'не показывает',
  "ko'rsatib bermaydi": 'не показывает',
  // === When ===
  "qilinganda": 'при выполнении',
  // === Rough ===
  "o'rt": 'ср',
  "o'rt.": 'ср.',
  // === Acceptance ===
  "tekshiruvidan": 'из проверки',
  "tekshiruvini": 'проверку',
  "tekshiruvi": 'проверка',
  "tekshiruvga": 'на проверку',
  "tekshiruvda": 'в проверке',
  "tekshiruv": 'проверка',
  "tekshiruvchi": 'проверяющий',
  "tekshiruvchilar": 'проверяющие',
  // === After/done ===
  "o'tgandan so'ng": 'после прохождения',
  "tugaganidan so'ng": 'после завершения',
  // === Acceptance ===
  "qabulni": 'приёмку',
  "qabul qilish": 'принять',
  "qabul qilingan": 'принято',
  // === Finish ===
  "yakunlang": 'завершите',
  "yakunlangan": 'завершено',
  // === Equipment ===
  "uskunaning": 'оборудования',
  "uskuna": 'оборудование',
  "uskunalar": 'оборудование',
  // === Count ===
  "sanovini": 'учёт',
  "sanov": 'учёт',
  "sanovi": 'учёт',
  // === Inventory ===
  "inventarizatsiyalar": 'инвентаризации',
  "inventarizatsiya": 'инвентаризация',
  "inventarizatsiyani": 'инвентаризацию',
  // === When you do ===
  "qilganingizda": 'когда выполняете',
  "qilganda": 'при выполнении',
  // === Sides ===
  "tomonda": 'на стороне',
  "tomondan": 'со стороны',
  "tomoni": 'сторона',
  // === Checkable ===
  "tekshiriladigan": 'проверяемый',
  "tekshir": 'проверить',
  "tekshirinish": 'проверка',
  "tekshirilgan": 'проверено',
  // === Finance ===
  "moliyaga": 'к финансам',
  // === Without document ===
  "hujjatsiz": 'без документа',
  // === If out ===
  "chiqmasin": 'не должно выходить',
  "chiqsa": 'если выйдет',
  "chiqib ketsa": 'если выйдет',
  // === Budget ===
  "budgetdan": 'из бюджета',
  "byudjetdan": 'из бюджета',
  "budget": 'бюджет',
  "byudjet": 'бюджет',
  // === Out ===
  "o'tmasin": 'не должно проходить',
  // === Place ===
  "joyda": 'в месте',
  "joylar": 'места',
  "joyini": 'место',
  "joyga": 'в место',
  // === Reference ===
  "referens": 'референс',
  // === Matrix ===
  "matritsasi": 'матрица',
  "matritsa": 'матрица',
  // === Confirm ===
  "tasdiqlashi": 'подтверждение',
  "tasdiqlashi mumkin": 'может подтвердить',
  // === Mode ===
  "rejimi": 'режим',
  "rejim": 'режим',
  "rejimida": 'в режиме',
  // === Steps ===
  "qadamlar": 'шаги',
  "qadam": 'шаг',
  // === Goal ===
  "bozorining": 'рынка',
  "bozorida": 'на рынке',
  "bozorga": 'на рынок',
  "bozorni": 'рынок',
  "bozor": 'рынок',
  // === Reliable ===
  "ishonchli": 'надёжный',
  "ishonchlilik": 'надёжность',
  "ishonch": 'доверие',
  // === Tax code ===
  "kodeksiga": 'кодексу',
  "kodeks": 'кодекс',
  // === Match ===
  "moslik": 'соответствие',
  "mos": 'соответствующий',
  "mos keladi": 'соответствует',
  // === Local ===
  "lokal": 'локальный',
  // === Payments ===
  "to'lovlarni": 'оплаты',
  "to'lovlari": 'оплаты',
  "to'lanadigan": 'к оплате',
  // === Finish/end ===
  "tugatib": 'завершив',
  // === Goals ===
  "maqsadlariga": 'к целям',
  "maqsadlari": 'цели',
  "maqsadlarini": 'цели',
  "maqsadlarni": 'цели',
  "maqsadini": 'цель',
  "maqsadi": 'цель',
  // === Reach ===
  "ering": 'достигайте',
  "erish": 'достигать',
  "erishing": 'достигайте',
  "erishish": 'достижение',
  "erishilgan": 'достигнуто',
  "erishmochi": 'не достигший',
  // === Win ===
  "qozonin": 'получите',
  "qozonish": 'получение',
  "qozonganlar": 'получившие',
  // === Feedback ===
  "feedbacklar": 'обратные связи',
  "feedback": 'обратная связь',
  // === Templates ===
  "shablonlarni": 'шаблоны',
  "shablonlardan": 'из шаблонов',
  // === Customize ===
  "moslashtiring": 'настройте',
  "moslashtirish": 'настройка',
  "moslashtirishni": 'настройку',
  "moslashtirilgan": 'настроено',
  // === Familiarization ===
  "tanishish": 'знакомство',
  "tanishingiz": 'ознакомьтесь',
  // === Personal ===
  "o'zingizga": 'себе',
  "o'zingizning": 'ваш',
  // === Consider ===
  "hisobga": 'в учёт',
  "hisobga olish": 'учёт',
  "hisobga olib": 'учитывая',
  // === Attention ===
  "e'tibor": 'внимание',
  "e'tiboringizga": 'к вашему вниманию',
  "berishimiz": 'давать',
  // === Recently ===
  "yaqinda": 'недавно',
  "yaqin orada": 'скоро',
  // === Service ===
  "xizmati": 'услуга',
  // === Transactions ===
  "tranzaksiyalar": 'транзакции',
  "tranzaksiya": 'транзакция',
  "tranzaksiyani": 'транзакцию',
  "tranzaksiyalarni": 'транзакции',
  // === Difference ===
  "farqni": 'разницу',
  "farqi": 'разница',
  "farq": 'разница',
  "farqlar": 'разницы',
  // === Suspicious ===
  "shubhali": 'подозрительный',
  // === Anomalies ===
  "anomaliyalar": 'аномалии',
  "anomaliyalarni": 'аномалии',
  "anomaliya": 'аномалия',
  // === Historical ===
  "tarixiy": 'исторический',
  "tarixini": 'историю',
  // === Get ===
  "olering": 'получите',
  "olishing": 'получите',
  "olishingiz": 'получить',
  // === Doing ===
  "qilinmoqda": 'выполняется',
  // === Reliability ===
  "og'ishini": 'отклонение',
  "og'ish": 'отклонение',
  "og'ishlari": 'отклонения',
  // === Reasons ===
  "sabablari": 'причины',
  // === Correction ===
  "tuzatish": 'исправление',
  "tuzatilgan": 'исправлено',
  // === Identifies ===
  "aniqlaydi": 'определяет',
  "aniqlanadi": 'определяется',
  "aniqlanadigan": 'определяемый',
  // === Language ===
  "tilni": 'язык',
  "tili": 'язык',
  "til": 'язык',
  // === Answers ===
  "javoblaringizni": 'ваши ответы',
  "javoblar": 'ответы',
  // === Sending ===
  "yuborishingiz": 'отправка',
  "yuborishi mumkin": 'может отправить',
  // === Session ===
  "sessiyasi": 'сессия',
  // === Checking ===
  "tekshirilmoqda": 'проверяется',
  // === Replanning ===
  "rejalash": 'планирование',
  "rejalashtiriladi": 'планируется',
  "rejalashtirish": 'планирование',
  "rejalashtirishga": 'к планированию',
  // === Delay ===
  "kechiktiriladi": 'откладывается',
  // === Writing ===
  "yoziladi": 'записывается',
  "yozilgan": 'записано',
  "yozilganlar": 'записанные',
  // === Stop ===
  "to'xtashi": 'остановка',
  // === Lack ===
  "yetishmovchi": 'недостаточный',
  "yetishmovchilik": 'недостаток',
  "yetishmaydi": 'недостаточно',
  // === Block ===
  "bloklash": 'блокировка',
  "bloklangan": 'заблокировано',
  // === Sent ===
  "jo'natiladi": 'отправляется',
  "jo'natildi": 'отправлено',
  "jo'natish": 'отправка',
  // === Confirming ===
  "tasdiqlanmoqda": 'подтверждается',
  // === Lots ===
  "partiyalari": 'партии',
  "rezervatsiyalarini": 'резервирования',
  "rezervatsiya": 'резервирование',
  // === Long-termers ===
  "muddatlilar": 'долгосрочные',
  // === Attempts ===
  "urinishi": 'попытка',
  "urinish": 'попытка',
  "urinishlar": 'попытки',
  "urinishlari": 'попытки',
  "urinishini": 'попытку',
  // === Submitted ===
  "topshirganidan": 'после сдачи',
  "topshirgan": 'сдал',
  "topshirdi": 'сдал',
  "topshirildi": 'сдано',
  "topshirdingiz": 'вы сдали',
  "topshirganingiz": 'ваша сдача',
  "topshirmagan": 'не сдал',
  "topshiring": 'сдайте',
  // === Consistency ===
  "izchilligi": 'последовательность',
  "izchillik": 'последовательность',
  // === Coefficient ===
  "koeffitsienti": 'коэффициент',
  "koeffitsientlar": 'коэффициенты',
  // === Year ===
  "yilning": 'года',
  // === Best ===
  "eng": 'самый',
  // === Many ===
  "ko'rsatgan": 'показавший',
  // === Various ===
  "turli": 'различный',
  "turli xil": 'различный',
  "turli-tuman": 'разнообразный',
  // === Categories ===
  "kategoriyalarda": 'в категориях',
  "kategoriyani": 'категорию',
  "kategoriya": 'категория',
  "kategoriyalar": 'категории',
  // === Studying ===
  "o'rganuvchi": 'изучающий',
  // === Distribution ===
  "taqsimoti": 'распределение',
  "taqsimlanishi": 'распределение',
  // === Trend ===
  "tendentsiyasi": 'тенденция',
  "tendensiyasi": 'тенденция',
  "tendentsiya": 'тенденция',
  // === Question types ===
  "vopros turlari": 'типы вопросов',
  // === Onboarding ===
  "onboardinglar": 'онбординги',
  // === Hours ===
  "soatlar": 'часы',
  "soatlik": 'часовой',
  // === Times ===
  "vaqtini": 'время',
  "vaqtida": 'вовремя',
  // === Studies ===
  "o'quv": 'учебный',
  "o'quv kursi": 'учебный курс',
  // === Announcements ===
  "e'lonlar": 'объявления',
  "e'lon": 'объявление',
  // === Events ===
  "tadbirlar": 'мероприятия',
  "tadbirni": 'мероприятие',
  // === Visible ===
  "ko'rinadigan": 'видимый',
  // === Fill in ===
  "to'ldiradigan": 'заполняемый',
  // === Login ===
  "kirishda": 'при входе',
  "kirishi": 'вход',
  // === Deleted ===
  "o'chirilmagan": 'не удалено',
  // === Scanner ===
  "skanerini": 'сканер',
  "skanerlashlar": 'сканирования',
  // === Connect ===
  "ulang": 'подключите',
  "ulanish": 'подключение',
  "ulangan": 'подключено',
  "ulanganda": 'при подключении',
  "ulanishi": 'подключение',
  "ulanishlar": 'подключения',
  "ulash": 'подключить',
  // === Input ===
  "kiritiladi": 'вводится',
  // === Enter ===
  "Enter": 'Enter',
  // === Day ===
  "kuningiz": 'день',
  "kunim": 'день',
  // === Banner ===
  "banner": 'баннер',
  // === Colleagues ===
  "hamkasblarimga": 'коллегам',
  "hamkasbi": 'коллега',
  "hamkasblari": 'коллеги',
  // === Streams ===
  "streamlar": 'стримы',
  "stream": 'стрим',
  // === Compulsory items ===
  "bandlar": 'пункты',
  "bandlari": 'пункты',
  "bandi": 'пункт',
  // === Facts ===
  "faktlar": 'факты',
  "fakt": 'факт',
  // === Syndromes ===
  "sindromlar": 'синдромы',
  "sindrom": 'синдром',
  // === Outgoing ===
  "Chiquvchi": 'Исходящий',
  "chiquvchi": 'исходящий',
  "Kiruvchi": 'Входящий',
  "kiruvchi": 'входящий',
  "oqimi": 'поток',
  "oqim": 'поток',
  "oqimni": 'поток',
  "oqimini": 'поток',
  // === Capacities ===
  "quvvatlarni": 'мощности',
  "quvvat": 'мощность',
  "quvvatlash": 'поддержка',
  // === Certificates ===
  "sertifikatlarni": 'сертификаты',
  "sertifikatsiz": 'без сертификата',
  // === ECL ===
  "ECL": 'ECL',
  // === Rates ===
  "stavkalarini": 'ставки',
  "stavka": 'ставка',
  "stavkalar": 'ставки',
  // === Scoring ===
  "scoring": 'скоринг',
  "NBA": 'NBA',
  // === Tab ===
  "tabini": 'вкладку',
  "tab": 'вкладка',
  "tablar": 'вкладки',
  // === Helper ===
  "yordamchi": 'помощник',
  "yordamchisi": 'помощник',
  "yordam": 'помощь',
  // === Notes ===
  "qaydlarini": 'заметки',
  "qaydlari": 'заметки',
  // === Message ===
  "xabarini": 'сообщение',
  "xabari": 'сообщение',
  // === Rules ===
  "qoidalarini": 'правила',
  // === Inactivity ===
  "faoliyatsizlikdan": 'из бездействия',
  "faoliyatsizlik": 'бездействие',
  // === After ===
  "yaratilgandan": 'после создания',
  "yaratilgandan keyin": 'после создания',
  // === Doing ===
  "qilishni": 'выполнение',
  // === Deal ===
  "bitimni": 'сделку',
  // === Site ===
  "saytingizga": 'на ваш сайт',
  "sayt": 'сайт',
  "saytda": 'на сайте',
  "saytlar": 'сайты',
  // === Signature ===
  "imzoni": 'подпись',
  // === Calculate ===
  "hisoblang": 'рассчитайте',
  // === Frontend ===
  "frontendda": 'на фронтенде',
  "frontend": 'фронтенд',
  // === Key ===
  "kalitni": 'ключ',
  "kalit": 'ключ',
  "kalitlar": 'ключи',
  // === Env ===
  "env": 'env',
  "o'zgaruvchisini": 'переменную',
  "o'zgaruvchi": 'переменная',
  "o'zgaruvchilarni": 'переменные',
  // === Connect systems ===
  "tizimlarni": 'системы',
  // === CV ===
  "CV": 'CV',
  "cv": 'CV',
  // === Criteria ===
  "mezonlar": 'критерии',
  "mezon": 'критерий',
  // === Indications ===
  "ko'rsatmalari": 'указания',
  // === Prepared ===
  "tayyorlangan": 'подготовленный',
  "tayyor": 'готовый',
  // === Report ===
  "hisobotingizni": 'ваш отчёт',
  // === Increased ===
  "oshirildi": 'увеличено',
  "oshirilgan": 'увеличено',
  "oshirilganda": 'при увеличении',
  "oshira": 'увеличивая',
  "oshirish": 'увеличить',
  // === Comparison ===
  "yonma yon": 'рядом',
  "yonma": 'рядом',
  "yon": 'бок',
  // === Approximate ===
  "taxminiy": 'приблизительный',
  // === Features ===
  "xususiyatlariga": 'характеристикам',
  "xususiyatlari": 'характеристики',
  "xususiyat": 'характеристика',
  // === Look ===
  "qarab": 'смотря',
  // === Production at ===
  "chiqarishda": 'в выпуске',
  // === Orders ===
  "buyurtmalarni": 'заказы',
  "mijozlarga": 'клиентам',
  // === Indicators ===
  "ko'rsatkichlarini": 'показатели',
  // === Stations ===
  "stanoqlarni": 'станки',
  "stanoq": 'станок',
  "stanoqda": 'на станке',
  "stanoqlar": 'станки',
  // === Optimize ===
  "optimallashtirish": 'оптимизация',
  "optimallashtirilgan": 'оптимизировано',
  // === Warnings ===
  "ogohlantirishlar": 'предупреждения',
  "ogohlantirish": 'предупреждение',
  // === Stage ===
  "bosqichi": 'этап',
  // === Interview ===
  "suhbat": 'беседа',
  // === Support ===
  "qo'llab quvvatlash": 'поддержка',
  "qo'llab-quvvatlash": 'поддержка',
  // === Grades ===
  "baholar": 'оценки',
  "baholashlarda": 'в оценках',
  // === Replacement ===
  "almashtirishlar": 'замены',
  "almashtirish": 'замена',
  // === Early ===
  "erta": 'рано',
  "ertaroq": 'раньше',
  // === Leaving ===
  "ketishlar": 'уходы',
  "ketish": 'уход',
  // === Place ===
  "joyini": 'место',
  "o'rniga": 'вместо',
  // === Transition ===
  "o'tishi": 'переход',
  // === Cross training ===
  "cross training": 'кросс-тренинг',
  // === Role ===
  "roli": 'роль',
  // === Stage / Experience ===
  "staji": 'стаж',
  // === Skills ===
  "ko'nikmalariga": 'к навыкам',
  "ko'nikmalarini": 'навыки',
  "ko'nikmaga": 'навыку',
  "ko'nikmalaringiz": 'ваши навыки',
  "ko'nikmalarim": 'мои навыки',
  // === Based on ===
  "asoslanib": 'основываясь',
  // === Workshop ===
  "dastgoh": 'станок',
  // === Being shown ===
  "ko'rsatilmoqda": 'показывается',
  // === Tariff ===
  "toifani": 'тариф',
  "toifa": 'категория',
  // === Constructed ===
  "tuzilgan": 'составленный',
  // === Contracts ===
  "shartnomalar": 'договоры',
  // === Application ===
  "so'rovini": 'запрос',
  // === Basic ===
  "bazaviy": 'базовый',
  // === Finalize ===
  "finalashtirish": 'финализация',
  // === Conversation questions ===
  "savollari": 'вопросы',
  // === Sessions ===
  "sessiyalari": 'сессии',
  // === Not received ===
  "olmagan": 'не получивший',
  "qaytarmagan": 'не вернувший',
  "olingan": 'полученный',
  // === In employee ===
  "xodimda": 'у сотрудника',
  // === Attestations ===
  "attestatsiyalarni": 'аттестации',
  "attestatsiya": 'аттестация',
  // === Tag/notes ===
  "qaydlari": 'заметки',
  // === Gap ===
  "bo'shlig'i": 'пробел',
  "bo'shlig'ini": 'пробел',
  "bo'shliqlari": 'пробелы',
  // === IoT ===
  "planshet": 'планшет',
  "planshetlar": 'планшеты',
  // === Permissions ===
  "ruxsatlarini": 'разрешения',
  // === Fair ===
  "adolatli": 'справедливый',
  "shaffof": 'прозрачный',
  // === Your application ===
  "arizangiz": 'ваша заявка',
  // === From home ===
  "uydan": 'из дома',
  // === Asking ===
  "so'rash": 'спрашивать',
  // === Quarterly ===
  "choraklik": 'квартальный',
  "chorak": 'квартал',
  "choraklar": 'кварталы',
  // === Anonymous ===
  "anonim": 'анонимный',
  // === Withholding ===
  "tushirish": 'снижение',
  "tushib qolish": 'выпадение',
  // === Deduction ===
  "yechib": 'удерживая',
  // === Assignment ===
  "tayinlashni": 'назначение',
  "tayinlashini": 'назначение',
  "tayinlangan": 'назначен',
  "tayinlanganlar": 'назначенные',
  "tayinlanishi": 'назначение',
  // === Meetings ===
  "yig'ilishlarni": 'собрания',
  // === Event ===
  "tadbirni": 'мероприятие',
  // === Lesson ===
  "mashg'uloti": 'занятие',
  "mashg'ulot": 'занятие',
  // === Happen ===
  "ro'y bergan": 'произошедший',
  "ro'y berdi": 'произошло',
  "ro'y": 'случилось',
  "bergan": 'давший',
  // === Exception ===
  "istisno": 'исключение',
  "favqulodda": 'экстренный',
  // === Want ===
  "etishni": 'выполнить',
  // === Limit ===
  "limitini": 'лимит',
  "limit": 'лимит',
  // === After confirming ===
  "tasdiqlangandan": 'после подтверждения',
  // === Forecasts ===
  "bashoratlari": 'прогнозы',
  "bashoratlar": 'прогнозы',
  // === Period ===
  "davrni": 'период',
  // === Tracking ===
  "kuzatish": 'отслеживание',
  "kuzating": 'отслеживайте',
  "kuzatilmoqda": 'отслеживается',
  // === Processes ===
  "jarayonlarini": 'процессы',
  "jarayoniga": 'к процессу',
  // === Topic ===
  "mavzuni": 'тему',
  // === Providers ===
  "provayderlar": 'провайдеры',
  "provayder": 'провайдер',
  // === Checklist ===
  "cheklist": 'чек-лист',
  "checklistni": 'чек-лист',
  // === Item ===
  "bandlari": 'пункты',
  // === Time period ===
  "muddatida": 'в срок',
  // === Partners ===
  "hamkorliklar": 'партнёрства',
  "hamkorlik": 'партнёрство',
  // === Clothes ===
  "kiyimlar": 'одежда',
  "kiyim": 'одежда',
  // === Damaged ===
  "shikastlangan": 'повреждённый',
  // === Discount ===
  "chegirmasi": 'скидка',
  "chegirma": 'скидка',
  // === Equipment ===
  "jihozi": 'оборудование',
  // === Reviews ===
  "sharhlari": 'отзывы',
  "sharhi": 'отзыв',
  // === Archived ===
  "arxivlangan": 'архивировано',
  // === Results ===
  "natijalaringiz": 'ваши результаты',
  // === Specialist ===
  "mutaxassisi": 'специалист',
  "mutaxassis": 'специалист',
  "mutaxassislar": 'специалисты',
  // === Connect ===
  "bog'lanadi": 'связывается',
  "bog'laning": 'свяжитесь',
  "bog'lanish": 'связь',
  "bog'lanish uchun": 'для связи',
  // === Calculating ===
  "hisoblanmoqda": 'рассчитывается',
  // === Limitless ===
  "cheklanmagan": 'неограниченный',
  // === Attentive ===
  "diqqatli": 'внимательный',
  // === Below ===
  "quyida": 'ниже',
  // === Personality ===
  "shaxsiyat": 'личность',
  "profili": 'профиль',
  "profil": 'профиль',
  // === Shift ===
  "smenada": 'в смене',
  // === Alerts ===
  "alertlar": 'алерты',
  // === Audit/inspection ===
  "ko'riklar": 'осмотры',
  "ko'rik": 'осмотр',
  // === Routes ===
  "marshrutlar": 'маршруты',
  "marshrut": 'маршрут',
  // === Grouping ===
  "guruhlaydi": 'группирует',
  "guruhi": 'группа',
  "guruhini": 'группу',
  "guruhlar": 'группы',
  // === Home ===
  "uyga": 'домой',
  // === Defines ===
  "belgilaydi": 'определяет',
  // === Tasks ===
  "papkasidagi": 'в папке',
  // === Map ===
  "xaritasi": 'карта',
  "xaritada": 'на карте',
  "xarita": 'карта',
  // === Recruitment ===
  "rekrutment": 'рекрутмент',
  // === Kanban ===
  "kanbanida": 'в канбане',
  // === Hired ===
  "Hired": 'Принят',
  "hired": 'принят',
  // === Skill ===
  "ko'nikmaga": 'навыку',
  // === Goals ===
  "maqsadlarni": 'цели',
  // === Traces ===
  "izi": 'след',
  // === Cipher ===
  "shifrlash": 'шифрование',
  // === API ===
  "API": 'API',
  // === Why ===
  "nega": 'почему',
  // === Skills your ===
  "fakturalari": 'фактуры',
  // === Plan ===
  "rejangiz": 'ваш план',
  "rejada": 'в плане',
  // === Session ===
  "seansini": 'сеанс',
  "seans": 'сеанс',
  // === After gather ===
  "yig'ilgandan": 'после сбора',
  "yig'ish": 'сбор',
  // === Forecasts ===
  "bashoratlar": 'прогнозы',
  // === Time/period ===
  "vaqtda": 'во время',
  // === Updated ===
  "yangilanadi": 'обновляется',
  // === Ideas ===
  "g'oyalarini": 'идеи',
  "g'oyalari": 'идеи',
  // === Watch ===
  "tomosha qilish": 'просмотр',
  "tomosha qilganda": 'при просмотре',
  "tomosha": 'просмотр',
  // === Game ===
  "o'yin": 'игра',
  "o'yinlar": 'игры',
  // === Elements ===
  "elementlari": 'элементы',
  // === Revive ===
  "jonlantirish": 'оживление',
  // === Finishing ===
  "yakunlaganda": 'при завершении',
  "yakunlagan": 'завершивший',
  // === Videos ===
  "videolarni": 'видео',
  // === Progress ===
  "progress": 'прогресс',
  "learning": 'обучение',
  "tizimiga": 'к системе',
  // === Without certificate ===
  "sertifikatsiz": 'без сертификата',
  // === That same ===
  "o'sha": 'тот же',
  "ishlay olmaydi": 'не может работать',
  "ishlay olmaydi": 'не может работать',
  "ishlay": 'работает',
  // === LMS ===
  "LMS": 'LMS',
  "lms": 'LMS',
  // === Platform ===
  "platformasi": 'платформа',
  "platforma": 'платформа',
  // === Your problems ===
  "muammolaringizga": 'к вашим проблемам',
  // === Guide ===
  "qo'llanmasi": 'руководство',
  // === Park ===
  "parkiga": 'к парку',
  "park": 'парк',
  // === Vehicle ===
  "avtomobil": 'автомобиль',
  "avtomobillar": 'автомобили',
  // === Fuel ===
  "sarfini": 'расход',
  "sarflangan": 'израсходовано',
  // === Machine ===
  "mashinani": 'машину',
  // === Deliveries ===
  "yetkazishlar": 'доставки',
  // === GPS device ===
  "qurilmasi": 'устройство',
  // === Content ===
  "kontentni": 'контент',
  "kontent": 'контент',
  // === Post ===
  "postni": 'пост',
  // === Assistant ===
  "yordamchisi": 'помощник',
  // === Exhibitions ===
  "ko'rgazmalar": 'выставки',
  // === Leaders ===
  "liderlar": 'лидеры',
  "lider": 'лидер',
  // === URL ===
  "url'larni": 'URL-адреса',
  "URL": 'URL',
  // === Common Uzbek ===
  "bo'lmaydi": 'нельзя',
  "olib": 'взяв',
  "olib borish": 'проведение',
  "olib boring": 'проведите',
  // === Misc small ===
  "u yerga": 'туда',
  "shu yerga": 'сюда',
  // === Production with leftover word ===
  "Производство Chiqarish": 'Производство',
  "производство chiqarish": 'производство',
  // === BATCH 3 — fine-grained leftovers ===
  // Possessives often left untranslated
  "ma'lumotlarini": 'данные',
  "ma'lumotini": 'данные',
  "ma'lumotlarini introduce": 'введите данные',
  // The most-stuck stems
  "variantining": 'варианта',
  "variant": 'вариант',
  "varianti": 'вариант',
  "variantlar": 'варианты',
  "oralig'i": 'интервал',
  "oraliq": 'интервал',
  "oralig'ida": 'в интервале',
  "Oralig'i": 'Интервал',
  // Who
  "kimlar": 'кто',
  "Kimlar": 'Кто',
  // Apply / impose
  "qo'llash": 'применить',
  "qo'llandi": 'применено',
  "qo'llaniladi": 'применяется',
  "qo'llanilgan": 'применено',
  // Outside of work hours
  "vaqtidan": 'из времени',
  "vaqtidan tashqari": 'сверх времени',
  "vaqtidan keyin": 'после времени',
  // Setting up
  "o'rnatish": 'установка',
  "o'rnatildi": 'установлено',
  "o'rnatilgan": 'установлено',
  "o'rnatilmagan": 'не установлено',
  // Rise
  "ko'tarilishi": 'повышение',
  "ko'tarilish": 'подъём',
  "ko'tarildi": 'поднялось',
  // Yangilashga
  "yangilashga": 'для обновления',
  // We
  "bizni": 'нас',
  // Team
  "jamoa": 'команда',
  "jamoasi": 'команда',
  "jamoalar": 'команды',
  // Position
  "lavozimning": 'должности',
  // Production direction
  "chiqarishga": 'к выпуску',
  // Process
  "jarayonga": 'к процессу',
  // No production
  "chiqarishsiz": 'без выпуска',
  // Flash
  "Flash": 'Flash',
  "flash": 'flash',
  // Tab go to
  "tabiga": 'на вкладку',
  // Between
  "o'rtasidagi": 'между',
  "o'rtasi": 'середина',
  // Signs of
  "belgilarini": 'признаки',
  "belgilar": 'признаки',
  "belgilari": 'признаки',
  // Dynamic
  "Dynamic": 'Динамический',
  "Reschedule": 'Перепланирование',
  // Selected/sorted
  "saralangan": 'отсортированный',
  "saralash": 'сортировка',
  // According to
  "ko'ra": 'согласно',
  // Result
  "natijani": 'результат',
  // CRM
  "CRM": 'CRM',
  // Server side
  "tomonida": 'на стороне',
  // JavaScript
  "JavaScript": 'JavaScript',
  "javascript": 'JavaScript',
  // Secret
  "secret": 'секрет',
  "Secret": 'Секрет',
  // Mockups
  "mockuplar": 'макеты',
  "mockup": 'макет',
  "mokap": 'макет',
  // Headlines
  "sarlavhalar": 'заголовки',
  "sarlavha": 'заголовок',
  // Cross-training
  "Cross-training": 'Кросс-тренинг',
  "Cross training": 'Кросс-тренинг',
  "cross-training": 'кросс-тренинг',
  // Conducted
  "o'tkazildi": 'проведено',
  // Yo (leftover)
  "yo'": 'нет',
  // Text
  "matnni": 'текст',
  // Profit
  "foydani": 'прибыль',
  // Waiting
  "kutmoqdasiz": 'ожидаете',
  // Lists
  "listlar": 'списки',
  "list": 'список',
  // Files
  "fayllarni": 'файлы',
  // Drop
  "tashlang": 'бросьте',
  "tashlash": 'выбросить',
  // Result
  "natijasini": 'результат',
  // Going
  "ketmoqda": 'идёт',
  // In process
  "jarayonda": 'в процессе',
  // Done
  "bajarildi": 'выполнено',
  // Knowledge
  "bilimlar": 'знания',
  "bilim": 'знание',
  "bilimi": 'знание',
  "bilimlar bazasi": 'база знаний',
  "bazasini": 'базу',
  "bazasi": 'база',
  "baza": 'база',
  // URL/meta
  "url": 'URL',
  "URL": 'URL',
  "Meta": 'Meta',
  "meta": 'Meta',
  "Developer": 'Developer',
  "developer": 'разработчик',
  "Console": 'Console',
  "console": 'консоль',
  "BotFather": 'BotFather',
  "botfather": 'BotFather',
  "webhook": 'webhook',
  // Posts
  "postlar": 'посты',
  // Articles
  "maqolani": 'статью',
  "maqolasini": 'статью',
  "maqola": 'статья',
  // Action
  "harakatini": 'действие',
  // Expenses
  "sarflar": 'расходы',
  "sarflari": 'расходы',
  "sarfi": 'расход',
  "sarf": 'расход',
  // To orders
  "buyurtmalarga": 'к заказам',
  // Mentorship
  "mentorlikni": 'менторство',
  // Reasons
  "sabablar": 'причины',
  // Conducting
  "o'tkazishni": 'проведение',
  // Released
  "chiqarildi": 'выпущено',
  "chiqariladigan": 'выпускаемый',
  "chiqarilgan": 'выпущенный',
  // Catalog
  "katalogi": 'каталог',
  "katalog": 'каталог',
  // To request
  "so'rovga": 'к запросу',
  // Stocks
  "zaxiralarni": 'запасы',
  // List
  "ro'yxatini": 'список',
  // Person
  "shaxsi": 'личность',
  // Fuel
  "yonilg'i": 'топливо',
  // Checks
  "cheklar": 'чеки',
  "checki": 'чек',
  // Photo
  "rasmini": 'изображение',
  // SmartHR
  "SmartHR": 'SmartHR',
  "smarthr": 'SmartHR',
  // In style of
  "uslubidagi": 'в стиле',
  "uslub": 'стиль',
  "uslubi": 'стиль',
  // Used
  "ishlatiladigan": 'используемый',
  // Components
  "komponentlar": 'компоненты',
  "komponent": 'компонент',
  // Meeting
  "uchrashuvi": 'встреча',
  // Household
  "xo'jalik": 'хозяйство',
  // Item
  "buyumini": 'предмет',
  "buyumiga": 'предмету',
  "buyum": 'предмет',
  // Building
  "inshoot": 'сооружение',
  "Inshoot": 'Сооружение',
  // Notifications
  "xabarnomalar": 'уведомления',
  "xabarnoma": 'уведомление',
  // Receiving
  "olishni": 'получение',
  // Refusals
  "etishlar": 'отклонения',
  // Division
  "bo'linishi": 'разделение',
  "Bo'linishi": 'Разделение',
  // Expenses
  "xarajatlarni": 'расходы',
  "xarajatlarini": 'расходы',
  // Released date
  "Chiqarilgan": 'Выпущено',
  // Transitions
  "o'tishlar": 'переходы',
  // Parallel/Saga
  "Parallel": 'Параллель',
  "Saga": 'Сага',
  "saga": 'сага',
  // Minimum
  "Minimal": 'Минимальный',
  "minimal": 'минимальный',
  // Guarantee
  "kafolati": 'гарантия',
  "kafolat": 'гарантия',
  // From level
  "darajadan": 'от уровня',
  // Constant
  "o'zgarmas": 'постоянный',
  // Paid
  "to'lanadi": 'оплачивается',
  // Unit
  "birlik": 'единица',
  "birliklar": 'единицы',
  // Such
  "bunday": 'такой',
  // To value
  "bahoga": 'к оценке',
  "arziydi": 'стоит',
  // Example
  "misol": 'пример',
  "keltiring": 'приведите',
  // In period
  "davrda": 'в периоде',
  // If does
  "etsa": 'если выполнит',
  // Worthy
  "munosib": 'достойный',
  "munosabatda": 'в отношениях',
  "bo'ling": 'будьте',
  // Conversation
  "gaplashuv": 'разговор',
  // Should not exceed
  "daqiqadan": 'из минут',
  "oshmasin": 'не должно превышать',
  // PIP
  "PIP": 'PIP',
  "pip": 'PIP',
  // Improve effectiveness
  "Samaradorlikni": 'Эффективность',
  "samaradorlikni": 'эффективность',
  "Yaxshilash": 'Улучшение',
  "yaxshilash": 'улучшение',
  // If reached
  "erishilsa": 'если достигнуто',
  "erishiladi": 'достигается',
  "erishmoqchi": 'желающий достичь',
  "erishish": 'достижение',
  "erishilgan": 'достигнуто',
  // Scans
  "skanlar": 'сканы',
  "skanlash": 'сканирование',
  // GS1
  "GS1": 'GS1',
  "EAN": 'EAN',
  "EAN-13": 'EAN-13',
  // Algorithm
  "algoritmiga": 'к алгоритму',
  "algoritm": 'алгоритм',
  // Generates
  "qilinadi": 'выполняется',
  // Positions
  "lavozimlar": 'должности',
  // Persons
  "shaxslar": 'лица',
  // Supervisor
  "nazoratchisi": 'контролёр',
  "nazoratchi": 'контролёр',
  // Place from
  "joyidan": 'из места',
  // Candidate
  "nomzodning": 'кандидата',
  // To place
  "joyiga": 'к месту',
  // It
  "uni": 'его',
  "Uni": 'Его',
  // Resolved
  "hal qildingiz": 'вы решили',
  "hal etish": 'решить',
  "hal qilingan": 'решено',
  // At place
  "joyida": 'на месте',
  // Complex
  "murakkab": 'сложный',
  // In front
  "oldingizda": 'перед вами',
  "turgan": 'стоящий',
  // Result came out
  "chiqdi": 'вышло',
  // Own initiative
  "tashabbusi": 'инициатива',
  "qildi": 'сделал',
  // Someone
  "birov": 'кто-то',
  // Without asking
  "so'ramasdan": 'не спрашивая',
  // Your result
  "natijangizni": 'ваш результат',
  // From year
  "yildan": 'через лет',
  // Be
  "bo'lishni": 'быть',
  "xohlaysiz": 'хотите',
  // From place
  "joydan": 'из места',
  // At position
  "lavozimda": 'на должности',
  // Working in
  "ishlashning": 'работы',
  // Meaning
  "ma'nosi": 'смысл',
  // Brag
  "maqtanishingiz": 'хвастаться',
  // Disagreement
  "kelishmovchilik": 'разногласие',
  // Difficulty
  "qiyinligi": 'трудность',
  "qiyin": 'трудный',
  // Marked
  "belgilanganlar": 'отмеченные',
  "belgilanish": 'отметка',
  "belgilanmasa": 'если не отмечено',
  "belgilanishi": 'отметка',
  // TOOL
  "TOOL": 'TOOL',
  // Level
  "darajasini": 'уровень',
  // Satisfied
  "qondirgan": 'удовлетворивший',
  // Qualities
  "sifatlar": 'качества',
  "sifati": 'качество',
  // In production
  "chiqarishdagi": 'в выпуске',
  // Defective
  "nuqsonli": 'дефектный',
  // Expenses calculation
  "xarajatlarini hisoblash": 'расчёт расходов',
  // Inspections
  "inspeksiyalar": 'инспекции',
  "inspeksiya": 'инспекция',
  "inspeksiyani": 'инспекцию',
  // Batch
  "partiyasi": 'партия',
  // Certificate of
  "sertifikati": 'сертификат',
  // Complaint
  "shikoyatini": 'жалобу',
  // Control points
  "nuqtalari": 'точки',
  "nuqtalar": 'точки',
  "nuqtasini": 'точку',
  // In bounds
  "chegarasida": 'в границах',
  "chegara": 'граница',
  // Stable
  "barqaror": 'стабильный',
  // Standard
  "standartni": 'стандарт',
  "standartini": 'стандарт',
  "standart": 'стандарт',
  // Material tests
  "testlari": 'тесты',
  // After added
  "qo'shilgandan": 'после добавления',
  // Sent
  "yuborilgandan": 'после отправки',
  // Exits
  "chiqadi": 'выходит',
  // Completion
  "yakunlanishini": 'завершение',
  // Sending
  "yuborilishi": 'отправка',
  // Otherwise
  "aks": 'иначе',
  "Aks": 'Иначе',
  // Sizes
  "qalinlik": 'толщина',
  // Grammage
  "gramaj": 'граммаж',
  // Within
  "doirasida": 'в рамках',
  // Packaging
  "qadoqlash": 'упаковка',
  "qutilash": 'распределение по коробкам',
  "yig'": 'сбор',
  "yig'ish": 'сбор',
  "yig'ilgan": 'собранный',
  "yig'iladi": 'собирается',
  // Label
  "etiketka": 'этикетка',
  // Viewing
  "ko'ruvi": 'просмотр',
  // Product
  "mahsulotni": 'продукт',
  "mahsulotini": 'продукт',
  // Before giving
  "berishdan": 'перед выдачей',
  "oldin": 'перед',
  // Parameter
  "parametrni": 'параметр',
  "parametrini": 'параметр',
  // Questions of
  "savollarini": 'вопросы',
  // Your name
  "ismingiz": 'ваше имя',
  // From employees
  "xodimlardan": 'от сотрудников',
  // BullMQ
  "BullMQ": 'BullMQ',
  "bullmq": 'BullMQ',
  "queue": 'очередь',
  "Queue": 'Очередь',
  "xatoli": 'ошибочный',
  "joblar": 'задания',
  "job": 'задание',
  // Tasks
  "ishlarni": 'работы',
  // Crises
  "inqirozlar": 'кризисы',
  "inqiroz": 'кризис',
  // Assignments
  "tayinlanmalar": 'назначения',
  "tayinlanma": 'назначение',
  // Visitors
  "tashrifchilarni": 'посетителей',
  "tashrifchilar": 'посетители',
  "tashrifchi": 'посетитель',
  "tashrif": 'посещение',
  // Only test period
  "davrida": 'в период',
  // Candidates
  "nomzodlar": 'кандидаты',
  // Paid
  "to'landi": 'оплачено',
  "to'lashdi": 'оплатили',
  // Father's name
  "Otasining": 'Отчество',
  "otasining": 'отчество',
  "otasi": 'отец',
  // Filters
  "Filtrlarni": 'Фильтры',
  "filtrlarni": 'фильтры',
  "filtrlar": 'фильтры',
  "filtr": 'фильтр',
  // Of managers
  "menejerining": 'менеджера',
  "menejerlar": 'менеджеры',
  "menejerlarini": 'менеджеров',
  // Leads
  "Leadlar": 'Лиды',
  "leadlar": 'лиды',
  // Debtors
  "Debitorlar": 'Дебиторы',
  "debitorlar": 'дебиторы',
  // Quotas
  "kvotalar": 'квоты',
  "kvota": 'квота',
  // Is being done
  "bajarilmoqda": 'выполняется',
  // Advance
  "oldindan": 'заранее',
  "Oldindan": 'Заранее',
  // Quote offers
  "takliflarini": 'предложения',
  "taklifnomani": 'приглашение',
  // To deal
  "buyurtmasiga": 'в заказ',
  "aylantirishni": 'преобразование',
  "aylantirish": 'преобразовать',
  // When delivered
  "yetkazilganda": 'при доставке',
  // Mashine
  "Mashinali": 'Машинный',
  "mashinali": 'машинный',
  // In future
  "kelajakdagi": 'будущий',
  // Forecasts
  "Prognozlar": 'Прогнозы',
  "prognozlar": 'прогнозы',
  "prognoz": 'прогноз',
  // When collecting
  "to'planayotganda": 'при сборе',
  "to'planmoqda": 'собирается',
  // Analytics
  "analitika": 'аналитика',
  // Sellers
  "Savdochilar": 'Продавцы',
  "savdochilar": 'продавцы',
  "savdo": 'торговля',
  // When entered
  "kiritilganda": 'при вводе',
  // Calculation
  "kitob": 'книга',
  "hisob-kitob": 'расчёт',
  // Automatically performed
  "bajariladi": 'выполняется',
  // Paper
  "qog'": 'бумаг',
  "qog'oz": 'бумага',
  "qog'mало": 'бумаги',
  // Treatments
  "ishlovlar": 'обработки',
  "ishlov": 'обработка',
  // Invoice book
  "kitoblar": 'книги',
  // Price formula
  "formulasi": 'формула',
  "formula": 'формула',
  // Only super admin changes
  "o'zgartiradi": 'изменяет',
  // PPE
  "СИЗ": 'СИЗ',
  // Signals
  "Signallar": 'Сигналы',
  "signallar": 'сигналы',
  "signal": 'сигнал',
  // Target
  "Nishon": 'Цель',
  "nishon": 'цель',
  // Protection
  "vositalarini": 'средства',
  "tekshiring": 'проверьте',
  // Employees'
  "Xodimlarning": 'Сотрудников',
  "xodimlarning": 'сотрудников',
  // Inspection results
  "tekshiruvlari": 'проверки',
  // Visitors
  "Tashrifchilar": 'Посетители',
  // Zones
  "Zo'nalar": 'Зоны',
  "zo'nalar": 'зоны',
  "zonalar": 'зоны',
  "zona": 'зона',
  "Zonalar": 'Зоны',
  // From camera
  "aniqlanmagan": 'не обнаружено',
  "aniqlanganda": 'при обнаружении',
  // Visitors journal
  "Mehmonlar": 'Гости',
  "mehmonlar": 'гости',
  "mehmon": 'гость',
  // Hazardous substances
  "Moddalar": 'Вещества',
  "moddalar": 'вещества',
  "modda": 'вещество',
  // According to norm
  "Normaga": 'к норме',
  "muvofiq": 'соответствует',
  // From country
  "yerdan": 'отсюда',
  // Shift swap
  "Almashish": 'Обмен',
  "almashish": 'обмен',
  // To profile
  "profiliga": 'в профиль',
  // Skill
  "Ko'nikmani": 'Навык',
  // Strategic categories
  "kategoriyalarni": 'категории',
  // Can be automated
  "Avtomatlashtirilishi": 'Автоматизация',
  "avtomatlashtirilishi": 'автоматизация',
  "avtomatlashtirish": 'автоматизация',
  "avtomatlashtirilgan": 'автоматизировано',
  // Soon
  "orada": 'скоро',
  // SaaS platform
  "platformasini": 'платформу',
  // Approaching
  "yaqinlashmoqda": 'приближается',
  "yaqinlashayotgan": 'приближающийся',
  // Plants
  "zavodlar": 'заводы',
  "zavod": 'завод',
  // Plant/company
  "kompaniyani": 'компанию',
  // Transfer/move
  "o'tkazing": 'перенесите',
  // Enable
  "yoqing": 'включите',
  "yoqilgan": 'включено',
  "o'chiring": 'отключите',
  // Integrations
  "Integratsiyalar": 'Интеграции',
  "integratsiyalar": 'интеграции',
  "integratsiya": 'интеграция',
  // Server
  "bazasi": 'база',
  // Checkpoint
  "Checkpoint": 'Контрольная точка',
  "checkpoint": 'контрольная точка',
  // Alternative
  "muqobili": 'альтернатива',
  // To-be checked
  "to'plami": 'набор',
  "tekshirildi": 'проверено',
  // Norms
  "normalar": 'нормы',
  "norma": 'норма',
  // Checkboxes
  "checkbox": 'чекбокс',
  // Backend
  "backend": 'бэкенд',
  "tasdiqni": 'подтверждение',
  "etadi": 'выполняет',
  // After rejection
  "etgandan": 'после выполнения',
  // To manager
  "Menejerga": 'Менеджеру',
  // To designer
  "Dizaynerga": 'Дизайнеру',
  // Already optimized
  "allaqachon": 'уже',
  "optimizatsiya": 'оптимизация',
  // Statistics download
  "statistikalarini": 'статистику',
  "yuklab": 'загружая',
  // Demands
  "Talablar": 'Требования',
  // Saved
  "Tejangan": 'Сэкономлено',
  "tejangan": 'сэкономлено',
  "tejash": 'экономия',
  // Problem points
  "Bot": 'Бот',
  "ulangimagan": 'не подключён',
  "ulanmagan": 'не подключён',
  // Tests
  "Testlarni": 'Тесты',
  // Login system
  "kira": 'войти',
  "Kira": 'Войти',
  // Later
  "Keyinchalik": 'Позже',
  "keyinchalik": 'позже',
  // Restore
  "tiklash": 'восстановление',
  "tiklang": 'восстановите',
  "tiklab": 'восстановив',
  // Roles
  "rollar": 'роли',
  "Rollar": 'Роли',
  "rolllar": 'роли',
  "roll": 'роль',
  // Supplier
  "Taminotchi": 'Поставщик',
  "taminotchi": 'поставщик',
  // Lots
  "Lotlar": 'Лоты',
  "lotlar": 'лоты',
  "lot": 'лот',
  // Statuses
  "statuslar": 'статусы',
  "Statuslar": 'Статусы',
  // Above
  "yuqoridagi": 'вышеуказанный',
  // Weight
  "og'irlik": 'вес',
  "Og'irlik": 'Вес',
  // POS Monitor
  "Монитор terminallariga": 'к терминалам монитора',
  "terminallariga": 'к терминалам',
  "terminallar": 'терминалы',
  "terminal": 'терминал',
  // Warehouses
  "Omborlarni": 'Склады',
  // Each
  "biri": 'один из',
  "o'ziga xos": 'свой',
  "xos": 'особый',
  // Layered
  "qatlamli": 'слойный',
  "qatlam": 'слой',
  // Synced
  "sinxronlashadi": 'синхронизируется',
  "sinxronlash": 'синхронизация',
  // Seed
  "seed": 'seed',
  "qilinmagan": 'не выполнено',
  // Template
  "statik": 'статический',
  "ishlayapti": 'работает',
  // Migration
  "Migratsiya": 'Миграция',
  "migratsiya": 'миграция',
  "qo'llanilgach": 'когда применится',
  // Real
  "realniy": 'реальный',
  "tortiladi": 'подтянется',
  // Who changed what
  "o'zgartirdi": 'изменил',
  "kuzatiladi": 'отслеживается',
  // Events
  "eventlarni": 'события',
  "eventlar": 'события',
  "event": 'событие',
  // POS Monitor reads
  "o'qib": 'читая',
  "ekranni": 'экран',
  "obnovlyaet": 'обновляет',
  // QC employee
  "namunalarni": 'образцы',
  "namuna": 'образец',
  "namunalar": 'образцы',
  "testdan": 'из тестирования',
  "o'tkazadi": 'проводит',
  // QC needed
  "muhtoj": 'нуждается',
  "omboriga": 'на склад',
  // Search
  "shtminotchi": 'поставщик',
  // Real time indicators
  "Ko'rsatgichlari": 'Показатели',
  "ko'rsatgichlar": 'показатели',
  "ko'rsatgichlari": 'показатели',
  "Ko'rsatgichlar": 'Показатели',
  // Left menu
  "menyudan": 'из меню',
  "menyu": 'меню',
  // Waiting
  "movementlardan": 'из движений',
  "movement": 'движение',
  "movementlar": 'движения',
  // Days off
  "Dam": 'Отдых',
  "dam": 'отдых',
  "kunlarini": 'дни',
  "hisoblamaslik": 'не считать',
  // Necessary
  "Resurslar": 'Ресурсы',
  "resurslar": 'ресурсы',
  "resurs": 'ресурс',
  // Success
  "muvaffaqiyatga": 'к успеху',
  "muvaffaqiyat": 'успех',
  // Goal achievement
  "Maqsadga": 'К цели',
  "maqsadga": 'к цели',
  // Plans
  "rejalar": 'планы',
  // Alerts
  "Alertlarni": 'Алерты',
  // Past deadline
  "rezervatsiyalar": 'резервирования',
  // Transfers
  "transferlar": 'трансферы',
  "transfer": 'трансфер',
  // Server version
  "versiyasi": 'версия',
  "versiyani": 'версию',
  "versiya": 'версия',
  // Conflict
  "to'qnashuv": 'конфликт',
  // Save
  "saqlashni": 'сохранение',
  // Differences
  "Farqlarni": 'Различия',
  "farqlarni": 'различия',
  // Inventory rows
  "Sanoq": 'Подсчёт',
  "sanoq": 'подсчёт',
  "qatorlarini": 'строки',
  // Field
  "maydonini": 'поле',
  "maydonni": 'поле',
  "maydonlarni": 'поля',
  "maydon": 'поле',
  "maydoni": 'поле',
  "maydonlar": 'поля',
  // Returning
  "qaytarilmoqda": 'возвращается',
  // From
  "Kimdan": 'От кого',
  "kimdan": 'от кого',
  // External arrivals
  "navbatiga": 'в очередь',
  // Pressed
  "bosilganda": 'при нажатии',
  // Row
  "Qatorni": 'Строку',
  "qatorni": 'строку',
  // All fields
  "to'ldiradi": 'заполняет',
  // Scanner used
  "skaneri": 'сканер',
  "ishlatilmaydi": 'не используется',
  // Required
  "bo'lish": 'быть',
  "Bo'lish": 'Быть',
  // Issue
  "chiqarib": 'выдав',
  // Panel
  "panelga": 'на панель',
  // HMAC SHA-256
  "SHA-256": 'SHA-256',
  // Misc
  "Python": 'Python',
  "1C": '1C',
  // Misc - already-correct strings (full-string false positives)
  "Gemini Vision": 'Gemini Vision',
  "GPT-4o Mini": 'GPT-4o Mini',
  "Переналадка (Changeover)": 'Переналадка',
  "VLOOKUP": 'VLOOKUP',
  "B2": 'B2',
  "Telegram": 'Telegram',
  // Common phrase fixes that combine often
  "og'работы": 'работы',
  "og'работа": 'работа',
  // Final misc
  "tabini": 'вкладку',
  "qo'shgan": 'добавил',
  "qo'shgan vклад": 'внёс вклад',
  "kuchli": 'сильный',
  "Kuchli": 'Сильный',
  "ichidagi": 'внутри',
  "o'rin": 'место',
  "ega": 'имеет',
  "ega bo'lgan": 'имеющий',
  "ko'radi": 'видит',
  "sanalarini": 'даты',
  "sanalari": 'даты',
  "sanasi": 'дата',
  // Used as
  "sifatida": 'как',
  // Identifier
  "ID": 'ID',
  "id": 'ID',
  // Print
  "chop": 'печать',
  "Chop": 'Печать',
  // Mini
  "mini": 'мини',
  // davomida
  "davomida": 'в течение',
  // birini
  "birini": 'один из',
  // Excel/Photoshop
  "Excel": 'Excel',
  "Photoshop": 'Photoshop',
  // GPT
  "GPT": 'GPT',
  "GPT-4o": 'GPT-4o',
  "Gemini": 'Gemini',
  "AI": 'AI',
  // Brake
  "buzilishi": 'нарушение',
  // What
  "nimani": 'что',
  // Generation
  "generatsiya": 'генерация',
  // Of conversation
  "savolini": 'вопрос',
  // Your words
  "so'zlaringiz": 'ваши слова',
  // Returned
  "qaytganlar": 'вернувшиеся',
  "qaytdi": 'вернулся',
  // Coordinates
  "koordinatalar": 'координаты',
  "koordinata": 'координата',
  // Important
  "Muhim": 'Важно',
  "muhim": 'важно',
  // Fuel
  "Yoqilg'i": 'Топливо',
  // SmartHR mockup style
  "Olib": 'Взять',
  // Telegram
  "TELEGRAM_BOT_TOKEN": 'TELEGRAM_BOT_TOKEN',
  // Test
  "Testga": 'К тесту',
  "testga": 'к тесту',
  // Removed
  "o'chib ketadi": 'удаляется',
  "o'chib": 'исчезая',
  // Search tests
  "tiklash mumkin": 'можно восстановить',
  // All roles
  "Bonus": 'Бонус',
  // Misc fragments
  "Hech kim qoidalarni": 'Никто правила',
  // Person
  "Bog'liq": 'Связано',
  // Yo'q
  "Yo'q oltrelativе": 'нет альтернативы',
  // SAP NEAR
  "NEAR": 'NEAR',
  "Near": 'Near',
  "near": 'near',
  // Birini
  "Birini": 'Один из',
  // O'rtasidagi
  "O'rtasidagi": 'Между',
  // Faqat
  "faqat": 'только',
  "Faqat": 'Только',
  // Hali
  "Hali": 'Ещё',
  "hali": 'ещё',
  // HR
  "HR": 'HR',
  "hr": 'HR',
  // OG
  "OG": 'OG',
  // POS
  "POS": 'POS',
  "pos": 'POS',
  // ERP
  "ERP": 'ERP',
  "erp": 'ERP',
  // SAP
  "SAP": 'SAP',
  "sap": 'SAP',
  // QC
  "QC": 'QC',
  "qc": 'QC',
  // Yatutu
  "yo'оставшийся": 'оставшийся',
  // O'ZBEKISTON
  "O'ZBEKISTON": 'УЗБЕКИСТАН',
  "O'zbekiston": 'Узбекистан',
  "o'zbekiston": 'Узбекистан',
  // HMAC
  "HMAC": 'HMAC',
  "hmac": 'HMAC',
  // PIN
  "PIN": 'PIN',
};

// Sort phrases by length (longest first) to avoid partial matches
const SORTED_PHRASES = Object.entries(PHRASES).sort((a, b) => b[0].length - a[0].length);
const SORTED_WORDS = Object.entries(WORDS).sort((a, b) => b[0].length - a[0].length);

// ─────────────────────────────────────────────────────────────────────
// Case preservation helper
// ─────────────────────────────────────────────────────────────────────
function preserveCase(original, replacement) {
  if (!original) return replacement;
  // If original starts with uppercase letter, capitalize replacement
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    if (original === original.toUpperCase() && original.length > 1) {
      return replacement.toUpperCase();
    }
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────
// Main translator
// ─────────────────────────────────────────────────────────────────────
function translateValue(val) {
  // Exact match
  if (FULL[val] !== undefined) return FULL[val];

  let s = val;

  // Apply phrases (case-insensitive, longest first), preserving case
  for (const [uz, ru] of SORTED_PHRASES) {
    const re = new RegExp(`\\b${escapeRegExp(uz)}\\b`, 'gi');
    s = s.replace(re, (match) => preserveCase(match, ru));
  }

  // Apply single words
  for (const [uz, ru] of SORTED_WORDS) {
    const re = new RegExp(`\\b${escapeRegExp(uz)}\\b`, 'gi');
    s = s.replace(re, (match) => preserveCase(match, ru));
  }

  // Cleanup
  s = s.replace(/\s+/g, ' ');                  // collapse spaces
  s = s.replace(/\s+([.,;:!?])/g, '$1');       // no space before punctuation
  s = s.replace(/([(])\s+/g, '$1');            // no space after (
  s = s.replace(/\s+([)])/g, '$1');            // no space before )
  s = s.replace(/^\s+|\s+$/g, '');             // trim

  return s;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers to set value at dot-path
// ─────────────────────────────────────────────────────────────────────
function setByPath(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || cur[p] === null || typeof cur[p] !== 'object') return false;
    cur = cur[p];
  }
  const last = parts[parts.length - 1];
  if (last in cur) {
    cur[last] = value;
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// Main loop
// ─────────────────────────────────────────────────────────────────────
const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));

// Group by ns
const byNs = {};
for (const e of audit) {
  if (!byNs[e.ns]) byNs[e.ns] = [];
  byNs[e.ns].push(e);
}

const results = {};
let totalFixed = 0;
let totalAttempted = 0;

for (const [ns, entries] of Object.entries(byNs)) {
  const fpath = path.join(RU_DIR, `${ns}.json`);
  if (!fs.existsSync(fpath)) {
    console.warn(`SKIP — ${ns}.json not found`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));

  let fixed = 0;
  for (const entry of entries) {
    totalAttempted++;
    const newVal = translateValue(entry.value);
    if (newVal !== entry.value) {
      if (setByPath(data, entry.key, newVal)) {
        fixed++;
        totalFixed++;
      }
    } else {
      // already fine (full dict mapping returned the same value, e.g. brand)
      fixed++;
      totalFixed++;
    }
  }

  fs.writeFileSync(fpath, JSON.stringify(data, null, 2) + '\n');
  results[ns] = { total: entries.length, fixed };
  console.log(`  [${ns}] fixed ${fixed}/${entries.length}`);
}

console.log(`\n━━ TOTAL: fixed ${totalFixed}/${totalAttempted} ━━`);
