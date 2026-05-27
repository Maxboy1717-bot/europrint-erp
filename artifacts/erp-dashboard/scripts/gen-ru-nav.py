"""Generate Russian translations for missing navigation keys."""
import json, re

UZ_TO_RU = {
    # Finance
    "Moliya": "Финансы", "Buxgalter": "Бухгалтер", "Tasdiqlash": "Подтверждение",
    "Hisoblar": "Счета", "Auditor": "Аудитор", "Byudjet": "Бюджет",
    "Kassa": "Касса", "Pul Oqimi": "Денежный поток", "Hisobotlar": "Отчёты",
    "Hujjatlar": "Документы", "Soliq": "Налог", "Soliqlar": "Налоги",
    "Tannarx": "Себестоимость", "Xarajat": "Затраты", "Xarajatlar": "Затраты",
    "Inventarizatsiya": "Инвентаризация", "Ombor": "Склад", "Ish Haqi": "Зарплата",
    "Davr Yopish": "Закрытие периода", "Foyda": "Прибыль", "Risk": "Риск",
    "Kredit": "Кредит", "Debitor": "Дебитор", "Kreditor": "Кредитор",
    "Avans": "Аванс", "Transfer": "Трансфер", "Priking": "Ценообразование",
    "Asosiy Vositalar": "Основные средства", "Hisoblar Rejasi": "План счетов",
    "Bosh Buxgalter": "Главный бухгалтер", "Xarajat Markazlari": "Центры затрат",
    "GL Hujjatlar": "GL документы", "Kirim/Chiqim": "Доходы/расходы",
    "Buyurtma Tannarxi": "Себестоимость заказа",
    "POS Kassa": "POS-касса", "Inventar Boshqaruvi": "Управление инвентарём",
    "POS Monitor": "POS-монитор", "Foyda Tahlili": "Анализ прибыли",
    "Moliyaviy Risk AI": "AI финансовых рисков", "Soliq Kalendari": "Налоговый календарь",
    "Ichki Soliqlar": "Внутренние налоги",
    # Admin/IoT
    "Sensor": "Сенсор", "Sensorlar": "Сенсоры", "Mashina": "Машина",
    "Monitoring": "Мониторинг", "Ogohlantirishlar": "Уведомления",
    "Kamera": "Камера", "Sifat": "Качество", "Defekt": "Дефект",
    "Sozlamalar": "Настройки", "Nazorat": "Контроль", "Tahlil": "Анализ",
    "Texnik": "Техника", "Digital Tvin": "Цифровой двойник",
    "Prediktive Maintenanke": "Предиктивное обслуживание",
    "Prediktive Maintenance": "Предиктивное обслуживание",
    # Coordination/Director
    "Xulosa": "Сводка", "Agent": "Агент", "Agentlar": "Агенты",
    "Direktor": "Директор", "Boshqaruv": "Управление", "Markazi": "Центр",
    "Kunlik": "Ежедневный", "Ideal Rasm": "Идеальная фотография",
    "Muammoli": "Проблемные", "Nuqtalar": "Точки", "Strategik": "Стратегический",
    "Ishlab Chiqarish": "Производство", "Sotib Olish": "Закупки",
    "Xojalik": "Хозяйство", "Rejalash": "Планирование",
    # CRM/Design
    "Dizayn": "Дизайн", "Kutubxona": "Библиотека", "Buyurtmalar": "Заказы",
    "Qoliplar": "Шаблоны", "Asboblar": "Инструменты", "Plastinalar": "Пластины",
    "Generator": "Генератор", "Taqqoslash": "Сравнение",
    "Tekshiruvi": "Проверка", "Maxsus": "Специальные", "Talablar": "Требования",
    "3D Mockup": "3D макет", "Mockup": "Макет", "Brend Guidelines": "Бренд-гайдлайн",
    # Director/System
    "Integratsiya": "Интеграция", "Integratsiyalar": "Интеграции",
    "Istisno": "Исключения", "Litsenziya": "Лицензия", "Tarif": "Тариф",
    "Tenantlar": "Клиенты", "Tenant": "Клиент",
    "Zavodga Onboarding": "Онбординг завода",
    "Navbat": "Очередь", "Navbat Monitori": "Монитор очереди",
    "Xatolar": "Ошибки", "Logi": "Журнал", "Log ": "Журнал ",
    "Super Admin Panel": "Панель суперадмина", "Super Admin": "Суперадмин",
    "Tizim": "Система", "Tizimi": "Системы",
    # HR
    "Xodimlar": "Сотрудники", "Xodim": "Сотрудник", "Baholash": "Оценка",
    "Rekruting": "Рекрутинг", "Voronka": "Воронка", "Smena": "Смена",
    "Jadvali": "Расписание", "Bildirishnomalar": "Уведомления",
    "Tatil va Kasallik": "Отпуск и больничный", "Tatil": "Отпуск", "Kasallik": "Больничный",
    "Mentorlik": "Наставничество", "Onboarding": "Онбординг", "Offboarding": "Оффбординг",
    "Kasbiy Osish": "Карьерный рост", "Konikmalar": "Навыки",
    "Ko'nikmalar Matritsasi": "Матрица навыков", "Ko'nikmalar": "Навыки",
    "Matritsasi": "Матрица", "Maqsadlar": "Цели",
    "Referral Tizimi": "Реферальная система", "Referral": "Реферальная",
    "HR Brend": "HR бренд", "Brend Boshqaruv": "Управление брендом", "Brend": "Бренд",
    "Xarita": "Карта", "Sogliq Nazorati": "Мониторинг здоровья",
    "Sogliq": "Здоровье", "Xavfsizlik": "Безопасность",
    "Kompensatsiya": "Компенсация", "Tashkilot": "Организация",
    "Org Tuzilma": "Орг. структура", "Tuzilma": "Структура",
    "Zona Tarixi": "История зон", "Maosh Ish Haqi": "Зарплата",
    "Maosh": "Зарплата", "Inspection": "Инспекция",
    "Adaptatsiya": "Адаптация", "Gamifikatsiya": "Геймификация",
    "Anketa Shablonlari": "Шаблоны анкет", "Anketa": "Анкета",
    "Biznes Salomatligi": "Здоровье бизнеса",
    "Raci Matritsasi": "RACI матрица", "Raci": "RACI",
    "Recruiter KPI": "KPI рекрутера", "Vorislik Rejalash": "Планирование преемников",
    "Succession Planning": "Планирование преемников",
    "Qabulxona": "Приёмная", "Kun Hisobot": "Ежедневный отчёт",
    "Intizom": "Дисциплина", "7 Funksiya": "7 функций",
    "Ai Intervyu": "AI интервью", "AI Intervyu": "AI интервью",
    "HR Aktiv": "HR активы", "Aktivlari": "Активы",
    # IoT/Facility
    "Bino Inventari": "Инвентарь здания", "Ofis Inventari": "Офисный инвентарь",
    "Elektr gas suv": "Электричество/газ/вода", "Forma Boshqaruvi": "Управление формой",
    "Kommunal Xarajat": "Коммунальные расходы", "Oshxona va Ovqat": "Столовая и питание",
    "Preventive Maintenance": "Профилактическое обслуживание",
    "Sanitariya": "Санитария", "Tamirlas": "Ремонт",
    "Chiqindi Nazorati": "Контроль отходов", "Chiqindi Hisobotlar": "Отчёты по отходам",
    "Chiqindilar": "Отходы", "Toza": "Уборка",
    "Uskuna": "Оборудование", "Uskunalar": "Оборудование",
    "MRO Dashboard": "МРО Dashboard", "MRO": "МРО",
    "Ehtiyot Qismlar": "Запчасти", "Tamirlash": "Ремонт",
    "Toza lash": "Уборка", "Xizmati": "Служба",
    # LMS
    "Bilim Bazasi": "База знаний", "Bilim": "Знания", "Bazasi": "База",
    "Kurslar": "Курсы", "Kurs": "Курс", "Darslar": "Уроки",
    "Testlar": "Тесты", "Sertifikatlar": "Сертификаты",
    "Microlearning": "Микрообучение", "Leaderboard": "Рейтинг",
    "Tadbirlar": "Мероприятия", "Statistika": "Статистика",
    "Kurs Muallifi": "Автор курса", "O'quv Byudjeti": "Учебный бюджет",
    "Operator Sertifikatsiyasi": "Сертификация операторов",
    "LMS Dashboard": "LMS Dashboard", "HR Capital": "HR Capital",
    "Hr Capital": "HR Capital",
    # MES
    "BOM Tarkib": "Состав изделия (BOM)", "Tarkib": "Состав",
    "Marshrutlar": "Маршруты", "Materiallar": "Материалы", "Material": "Материал",
    "Muqobili": "Альтернатива", "Mijoz": "Клиент", "Mijozlar": "Клиенты",
    "Maxsus Talablar": "Особые требования", "Ozgarishlar Tarixi": "История изменений",
    "Parallel Buyurtmalar": "Параллельные заказы", "Vaqt va Tannarx": "Время и себестоимость",
    "Stanok Tanlash": "Выбор станка", "Texnik Kartalar": "Техкарты",
    "Texnik Tasdiqlash": "Техническое утверждение",
    "Xarajat Optimizatsiya": "Оптимизация затрат",
    # Marketing
    "Kampaniyalar": "Кампании", "Kontent": "Контент",
    "Ko'rgazmalar": "Выставки", "NPS va Churn": "NPS и отток",
    "PR Faoliyat": "PR деятельность", "Raqobatchilar": "Конкуренты",
    "SEO Monitoring": "SEO мониторинг", "Social Inbox": "Социальные сообщения",
    "Taqvim": "Календарь", "Web Sayt CMS": "Веб-сайт CMS",
    "AB Testing": "A/B тестирование", "ROAS": "ROAS",
    "ROI ROAS": "ROI/ROAS", "Tahlil ROI": "Анализ ROI",
    "Dashboard": "Dashboard", "Module": "Модуль", "Module ": "Модуль ",
    "Modul": "Модуль",
    # Print/Production
    "Kaizen": "Кайдзен", "Reja": "План", "Mahsulot": "Продукт",
    "Mahsulotlar": "Продукты", "Imposition Hisob": "Расчёт спуска полос",
    "IoT Planshet": "IoT планшет", "OEE Monitoring": "Мониторинг ОЭО",
    "Smena Topshirish": "Сдача смены", "Toxtashlar": "Простои",
    "Normalari": "Нормы", "Zona Boshqaruvi": "Управление зонами",
    "Xodim Tayinlashlari": "Назначения сотрудников",
    "Siyoh Qoplama": "Нанесение чернил", "Papka Buyurtmalari": "Заказы папок",
    "Kunlik Reja": "Дневной план", "Texnik Xizmat Sorovi": "Запрос техобслуживания",
    "Production Facts": "Производственные данные", "MES Dashboard": "MES Dashboard",
    "Mashina Holati": "Состояние машин",
    # QC/QA
    "Brak Boshqaruvi": "Управление браком", "Reklamatsiya": "Рекламация",
    "Inline QC": "Инлайн QC", "ISO Hujjatlari": "Документы ISO",
    "Laboratoriya": "Лаборатория", "Parametrlar": "Параметры",
    "Qog'oz Parametrlari": "Параметры бумаги", "Yakuniy Tekshiruv": "Итоговая проверка",
    "Yetkazuvchi Sifati": "Качество поставщика", "Sifat Trendi AI": "AI тренд качества",
    "Bottleneck Tahlili": "Анализ узких мест", "Demand Forecasting": "Прогнозирование спроса",
    "Energiya Optimizatsiya": "Оптимизация энергии", "MRP Matritsa": "MRP матрица",
    "Quvvat Rejasi": "План мощности", "Realtime Progress": "Прогресс онлайн",
    "Rush Order": "Срочный заказ", "What-if Tahlil": "Анализ что-если",
    "Yetkazish Kalkulyator": "Калькулятор доставки", "PP Dashboard": "PP Dashboard",
    "QC Dashboard": "QC Dashboard", "QC Dashboard Home": "QC Dashboard",
    "AI Rejalash": "AI планирование", "Super Admin Override": "Переопределение суперадмина",
    # Sales
    "Lidlar": "Лиды", "Kvota Dashboard": "Dashboard квоты",
    "Menejer Paneli": "Панель менеджера", "Shartnomalar": "Договоры",
    "Tolovlar": "Платежи", "Taklifnomalar": "Предложения",
    "Ombor Ijarasi": "Аренда склада", "SD Dashboard": "SD Dashboard",
    "CRM Voronka": "Воронка CRM", "ERP Buyurtmalar": "ERP заказы",
    "70 Avans Nazorat": "Контроль аванса 70%", "AI CRM": "AI CRM",
    # Security
    "Evakuatsiya Rejasi": "План эвакуации", "Hodisalar": "Инциденты",
    "Jonli Monitoring": "Онлайн-мониторинг", "PPE Nazorati": "Контроль СИЗ",
    "Tashrif Nazorati": "Контроль посещений", "Xavfli Material": "Опасный материал",
    "Yuz Royxatdan Otish": "Регистрация лица", "Yuz Tanish Kuzatuv": "Распознавание лиц",
    "Zona Ruxsatlari": "Разрешения зон", "Holati": "Состояние",
    "Reytingi": "Рейтинг", "Kameralar": "Камеры", "Kirishlar": "Входы",
    # Supply/Logistics
    "Chek Bot": "Чек-бот", "GPS Monitoring": "GPS мониторинг",
    "Haydovchi Boshqaruvi": "Управление водителями",
    "Marshrut Rejalash": "Планирование маршрутов",
    "Mashina Jadvali": "График машин",
    "Kredit Qarzlar": "Кредиторская задолженность",
    "Supplier Portal": "Портал поставщика", "Transport Parki": "Автопарк",
    "Yoqilgi Nazorati": "Контроль топлива",
    "Xarid Buyurtmalari": "Заказы на закупку",
    "Yetkazuvchi Baho": "Оценка поставщика", "Yetkazuvchilar": "Поставщики",
    "Logistika": "Логистика", "MM Dashboard": "MM Dashboard",
    "Xarajat Nazorati": "Контроль затрат", "Haydovchilar": "Водители",
    # WMS
    "Barkod Tizimi": "Система штрихкодов", "Ichki Sorov": "Внутренний запрос",
    "Kochirishlar": "Перемещения", "Lot Traceability": "Прослеживаемость партий",
    "Material 360": "Материал 360", "Qabul Akti GRN": "Акт приёмки GRN",
    "Reservation Panel": "Панель резервирования",
    "Ombordan chiqindi": "Отходы склада",
    "Tayyor Mahsulot Ijarasi": "Аренда готовой продукции",
    "WMS KPI Hub": "WMS KPI Hub", "WMS Reports All": "Все отчёты WMS",
    "AI WMS Analytics": "AI аналитика WMS", "Ombor Dashboard": "Dashboard склада",
    "POS Harakatlar": "POS движения", "PPMM FI Integratsiya": "Интеграция PP/MM/FI",
    "Kochirishlar Hujjatlari": "Документы перемещений", "Inventarizatsiya": "Инвентаризация",
    "Warehouse Reports": "Отчёты склада", "Ombor Hisobi": "Учёт склада",
    # Top nav
    "Byudjet Rejasi": "Бюджетный план",
    "Eski Dashboard": "Устаревший Dashboard",
    "CFO Dashboard": "CFO Dashboard", "Pul Oqimi": "Денежный поток",
    "Buxgalteriya Bosh Buxgalter": "Главный бухгалтер",
    "Buxgalteriya Ish Haqi Hisobi": "Учёт зарплаты",
    "Buxgalteriya Ombor Hisobi": "Учёт склада",
    "Director Auditor": "Директор-аудитор", "Director Super Admin": "Суперадмин",
    "Director QC Moduli": "Модуль QC", "Director Telegram Bot": "Telegram-бот",
    "Director Tizim Monitoring": "Мониторинг системы",
    "HR 7 Funksiya": "HR 7 функций", "HR Adaptatsiya": "HR адаптация",
    "HR Anketa": "HR анкета", "HR Anketa Shablonlari": "Шаблоны HR анкет",
    "HR Biznes Salomatligi": "Здоровье HR", "HR Gamifikatsiya": "HR геймификация",
    "HR HR Dashboard": "HR Dashboard", "HR HR Xarita": "HR карта",
    "HR Intizom": "HR дисциплина", "HR Offboarding": "HR оффбординг",
    "HR Qabulxona": "HR приёмная", "HR Raci Matritsasi": "RACI матрица",
    "HR Recruiter KPI": "KPI рекрутера", "HR Tashkiliy Tuzilma": "Орг. структура",
    "HR Vorislik Rejalash": "Планирование преемников",
    "LMS LMS Dashboard": "LMS Dashboard", "LMS Mentorlik": "Наставничество",
    "MM Karantin": "ММ карантин", "MM Logistika": "ММ логистика",
    "MM Ombor Dashboard": "Dashboard склада MM", "MM Rulon": "ММ рулон",
    "MM Tayyor Mahsulot": "Готовая продукция MM",
    "MM Transport Parki": "Автопарк MM", "MM Xarid Buyurtmalari": "Заказы закупок MM",
    "MM Xom Ashyo": "Сырьё MM", "MM Yordamchi": "Помощник MM",
    "PP BOM Tarkib": "PP состав изделия", "PP Imposition Hisob": "PP расчёт спуска",
    "PP IoT Jonli": "PP IoT онлайн", "PP Kunlik Reja": "PP дневной план",
    "PP Papka Buyurtmalari": "PP заказы папок", "PP PP Dashboard": "PP Dashboard",
    "PP Quvvat Rejasi": "PP план мощности", "PP Siyoh Qoplama": "PP нанесение чернил",
    "SD CRM Voronka": "SD воронка CRM", "SD Dashboard": "SD Dashboard",
    "SD KPI": "SD KPI", "Xavfsizlik Kirish Jurnali": "Журнал входа безопасности",
    "Xavfsizlik MRO Dashboard": "MRO Dashboard безопасности",
    # Common suffixes
    "Boshqaruvi": "Управление", "Tizimi": "Системы", "Markazi": "Центр",
    "Tarixi": "История", "Nazorati": "Контроль", "Paneli": "Панель",
    "Hisob": "Учёт", "Xizmati": "Служба", "Bazasi": "База",
    "Hisobi": "Учёт", "Buyurtmalari": "Заказы",
}


def translate(uz_text):
    """Translate Uzbek text to Russian using the dictionary."""
    # Check exact matches first
    if uz_text in UZ_TO_RU:
        return UZ_TO_RU[uz_text]

    ru = uz_text
    # Apply longest-match substitutions
    for uz_word, ru_word in sorted(UZ_TO_RU.items(), key=lambda x: -len(x[0])):
        if uz_word in ru:
            ru = ru.replace(uz_word, ru_word, 1)

    # If still very similar to UZ (not translated much), keep some known patterns
    # for technical terms that stay the same
    return ru


with open("src/locales/uz/navigation.json", encoding="utf-8") as f:
    uz = json.load(f)
with open("src/locales/ru/navigation.json", encoding="utf-8") as f:
    ru = json.load(f)

missing_keys = sorted([k for k in uz if k not in ru])
new_entries = {}
for k in missing_keys:
    uz_val = uz[k]
    ru_val = translate(uz_val)
    new_entries[k] = ru_val

# Merge and write
ru.update(new_entries)
# Sort keys
ru_sorted = dict(sorted(ru.items()))
with open("src/locales/ru/navigation.json", "w", encoding="utf-8") as f:
    json.dump(ru_sorted, f, ensure_ascii=False, indent=2)

print(f"Added {len(new_entries)} keys to RU navigation.json")
print(f"Total RU keys: {len(ru_sorted)}")
for k in list(missing_keys)[:8]:
    print(f"  {k}: '{uz[k]}' -> '{new_entries[k]}'")
