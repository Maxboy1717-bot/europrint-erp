import { db, pool } from "./index";
import { departments } from "./schema/departments";
import { positions } from "./schema/positions";
import { leaveTypes, shiftTypes, skillCategories, abcThresholds } from "./schema/master-config";

async function seed() {
  console.log("🌱 Seeding master data...");

  const deptRows = await db.insert(departments).values([
    { code: "EXEC", nameUz: "Boshqaruv", nameRu: "Руководство", vysotskiyFunction: "executive", level: 1, sortOrder: 1 },
    { code: "HR", nameUz: "Kadrlar bo'limi", nameRu: "Отдел кадров", vysotskiyFunction: "personnel", level: 2, sortOrder: 2 },
    { code: "FIN", nameUz: "Moliya bo'limi", nameRu: "Финансовый отдел", vysotskiyFunction: "finance", level: 2, sortOrder: 3 },
    { code: "SALES", nameUz: "Sotuv bo'limi", nameRu: "Отдел продаж", vysotskiyFunction: "sales", level: 2, sortOrder: 4 },
    { code: "PROD", nameUz: "Ishlab chiqarish", nameRu: "Производство", vysotskiyFunction: "production", level: 2, sortOrder: 5 },
    { code: "QC", nameUz: "Sifat nazorati", nameRu: "Контроль качества", vysotskiyFunction: "quality", level: 2, sortOrder: 6 },
    { code: "WAREHOUSE", nameUz: "Ombor", nameRu: "Склад", vysotskiyFunction: "logistics", level: 2, sortOrder: 7 },
    { code: "LOGISTICS", nameUz: "Logistika", nameRu: "Логистика", vysotskiyFunction: "logistics", level: 2, sortOrder: 8 },
    { code: "IT", nameUz: "IT bo'limi", nameRu: "ИТ отдел", vysotskiyFunction: "it", level: 2, sortOrder: 9 },
    { code: "MARKETING", nameUz: "Marketing", nameRu: "Маркетинг", vysotskiyFunction: "marketing", level: 2, sortOrder: 10 },
    { code: "LEGAL", nameUz: "Yuridik bo'lim", nameRu: "Юридический отдел", vysotskiyFunction: "legal", level: 2, sortOrder: 11 },
    { code: "SECURITY", nameUz: "Xavfsizlik", nameRu: "Безопасность", vysotskiyFunction: "security", level: 2, sortOrder: 12 },
    { code: "MAINTENANCE", nameUz: "Texnik xizmat", nameRu: "Тех. обслуживание", vysotskiyFunction: "maintenance", level: 2, sortOrder: 13 },
    { code: "DESIGN", nameUz: "Dizayn bo'limi", nameRu: "Дизайн", vysotskiyFunction: "design", level: 2, sortOrder: 14 },
    { code: "CANTEEN", nameUz: "Oshxona", nameRu: "Столовая", vysotskiyFunction: "welfare", level: 3, sortOrder: 15 },
    { code: "PREPRESS", nameUz: "Prepress", nameRu: "Препресс", vysotskiyFunction: "production", level: 3, sortOrder: 16, parentId: 5 },
    { code: "OFFSET", nameUz: "Ofset bosma", nameRu: "Офсетная печать", vysotskiyFunction: "production", level: 3, sortOrder: 17, parentId: 5 },
    { code: "DIGITAL", nameUz: "Raqamli bosma", nameRu: "Цифровая печать", vysotskiyFunction: "production", level: 3, sortOrder: 18, parentId: 5 },
    { code: "POSTPRESS", nameUz: "Postpress", nameRu: "Постпресс", vysotskiyFunction: "production", level: 3, sortOrder: 19, parentId: 5 },
    { code: "LARGEFORMAT", nameUz: "Katta format", nameRu: "Широкоформат", vysotskiyFunction: "production", level: 3, sortOrder: 20, parentId: 5 },
  ]).returning();
  console.log(`✅ ${deptRows.length} departments inserted`);

  const posRows = await db.insert(positions).values([
    { code: "OWNER", nameUz: "Asoschi / Egasi", nameRu: "Владелец", level: 1, rbacTier: "owner", isManagement: true, sortOrder: 1 },
    { code: "CEO", nameUz: "Bosh direktor", nameRu: "Генеральный директор", level: 1, rbacTier: "c-level", isManagement: true, sortOrder: 2 },
    { code: "CFO", nameUz: "Moliya direktori", nameRu: "Финансовый директор", level: 1, rbacTier: "c-level", isManagement: true, sortOrder: 3 },
    { code: "COO", nameUz: "Operatsion direktor", nameRu: "Операционный директор", level: 1, rbacTier: "c-level", isManagement: true, sortOrder: 4 },
    { code: "CTO", nameUz: "Texnik direktor", nameRu: "Технический директор", level: 1, rbacTier: "c-level", isManagement: true, sortOrder: 5 },
    { code: "CMO", nameUz: "Marketing direktori", nameRu: "Директор по маркетингу", level: 1, rbacTier: "c-level", isManagement: true, sortOrder: 6 },
    { code: "HR_DIRECTOR", nameUz: "HR direktor", nameRu: "HR директор", level: 2, rbacTier: "director", isManagement: true, sortOrder: 7 },
    { code: "HR_MANAGER", nameUz: "HR menejeri", nameRu: "HR менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 8 },
    { code: "HR_SPECIALIST", nameUz: "HR mutaxassisi", nameRu: "HR специалист", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 9 },
    { code: "HR_RECRUITER", nameUz: "HR rekruter", nameRu: "HR рекрутер", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 10 },
    { code: "PROD_DIRECTOR", nameUz: "Ishlab chiqarish direktori", nameRu: "Директор производства", level: 2, rbacTier: "director", isManagement: true, sortOrder: 11 },
    { code: "PROD_MANAGER", nameUz: "Ishlab chiqarish menejeri", nameRu: "Менеджер производства", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 12 },
    { code: "SHIFT_SUPERVISOR", nameUz: "Smena boshlig'i", nameRu: "Начальник смены", level: 4, rbacTier: "supervisor", isManagement: true, sortOrder: 13 },
    { code: "PREPRESS_OPERATOR", nameUz: "Prepress operatori", nameRu: "Оператор препресс", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 14 },
    { code: "OFFSET_OPERATOR", nameUz: "Ofset operatori", nameRu: "Оператор офсет", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 15 },
    { code: "DIGITAL_OPERATOR", nameUz: "Raqamli bosma operatori", nameRu: "Оператор цифровой печати", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 16 },
    { code: "LARGEFORMAT_OPERATOR", nameUz: "Katta format operatori", nameRu: "Оператор широкоформата", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 17 },
    { code: "POSTPRESS_OPERATOR", nameUz: "Postpress operatori", nameRu: "Оператор постпресс", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 18 },
    { code: "CUTTER_OPERATOR", nameUz: "Kesish operatori", nameRu: "Оператор резки", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 19 },
    { code: "LAMINATOR_OPERATOR", nameUz: "Laminatsiya operatori", nameRu: "Оператор ламинации", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 20 },
    { code: "BINDING_OPERATOR", nameUz: "Broshyura operatori", nameRu: "Оператор переплёта", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 21 },
    { code: "EMBOSSING_OPERATOR", nameUz: "Shtamp operatori", nameRu: "Оператор тиснения", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 22 },
    { code: "FOILING_OPERATOR", nameUz: "Folga bosma operatori", nameRu: "Оператор фольгирования", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 23 },
    { code: "QC_MANAGER", nameUz: "Sifat nazorati menejeri", nameRu: "Менеджер контроля качества", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 24 },
    { code: "QC_INSPECTOR", nameUz: "Sifat inspektori", nameRu: "Инспектор качества", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 25 },
    { code: "QC_LAB_TECH", nameUz: "Laboratoriya texnigi", nameRu: "Лаборант", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 26 },
    { code: "SALES_DIRECTOR", nameUz: "Sotuv direktori", nameRu: "Директор по продажам", level: 2, rbacTier: "director", isManagement: true, sortOrder: 27 },
    { code: "SALES_MANAGER", nameUz: "Sotuv menejeri", nameRu: "Менеджер по продажам", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 28 },
    { code: "SALES_REP", nameUz: "Sotuv vakili", nameRu: "Торговый представитель", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 29 },
    { code: "KEY_ACCOUNT_MANAGER", nameUz: "Katta mijozlar menejeri", nameRu: "Менеджер по ключевым клиентам", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 30 },
    { code: "ORDER_MANAGER", nameUz: "Buyurtma menejeri", nameRu: "Менеджер заказов", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 31 },
    { code: "ESTIMATOR", nameUz: "Kalkulyator", nameRu: "Калькулятор", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 32 },
    { code: "FIN_MANAGER", nameUz: "Moliya menejeri", nameRu: "Финансовый менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 33 },
    { code: "CHIEF_ACCOUNTANT", nameUz: "Bosh hisobchi", nameRu: "Главный бухгалтер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 34 },
    { code: "ACCOUNTANT", nameUz: "Hisobchi", nameRu: "Бухгалтер", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 35 },
    { code: "CASHIER", nameUz: "Kassir", nameRu: "Кассир", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 36 },
    { code: "PAYROLL_SPECIALIST", nameUz: "Ish haqi mutaxassisi", nameRu: "Специалист по зарплате", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 37 },
    { code: "WAREHOUSE_MANAGER", nameUz: "Ombor menejeri", nameRu: "Менеджер склада", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 38 },
    { code: "WAREHOUSE_KEEPER", nameUz: "Omborchi", nameRu: "Кладовщик", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 39 },
    { code: "WAREHOUSE_LOADER", nameUz: "Yukchi", nameRu: "Грузчик", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 40 },
    { code: "LOGISTICS_MANAGER", nameUz: "Logistika menejeri", nameRu: "Менеджер логистики", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 41 },
    { code: "DRIVER", nameUz: "Haydovchi", nameRu: "Водитель", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 42 },
    { code: "COURIER", nameUz: "Kuryer", nameRu: "Курьер", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 43 },
    { code: "IT_MANAGER", nameUz: "IT menejeri", nameRu: "ИТ менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 44 },
    { code: "SYSTEM_ADMIN", nameUz: "Tizim administratori", nameRu: "Системный администратор", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 45 },
    { code: "DEVELOPER", nameUz: "Dasturchi", nameRu: "Разработчик", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 46 },
    { code: "IT_SUPPORT", nameUz: "IT qo'llab-quvvatlash", nameRu: "ИТ поддержка", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 47 },
    { code: "MARKETING_MANAGER", nameUz: "Marketing menejeri", nameRu: "Менеджер по маркетингу", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 48 },
    { code: "MARKETING_SPECIALIST", nameUz: "Marketing mutaxassisi", nameRu: "Специалист маркетинга", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 49 },
    { code: "SMM_SPECIALIST", nameUz: "SMM mutaxassisi", nameRu: "SMM специалист", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 50 },
    { code: "CONTENT_MANAGER", nameUz: "Kontent menejeri", nameRu: "Контент менеджер", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 51 },
    { code: "DESIGNER_LEAD", nameUz: "Bosh dizayner", nameRu: "Ведущий дизайнер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 52 },
    { code: "GRAPHIC_DESIGNER", nameUz: "Grafik dizayner", nameRu: "Графический дизайнер", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 53 },
    { code: "LAYOUT_DESIGNER", nameUz: "Maket dizayner", nameRu: "Верстальщик", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 54 },
    { code: "3D_DESIGNER", nameUz: "3D dizayner", nameRu: "3D дизайнер", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 55 },
    { code: "LEGAL_MANAGER", nameUz: "Yuridik menejeri", nameRu: "Юридический менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 56 },
    { code: "LAWYER", nameUz: "Yurist", nameRu: "Юрист", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 57 },
    { code: "SECURITY_MANAGER", nameUz: "Xavfsizlik menejeri", nameRu: "Менеджер безопасности", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 58 },
    { code: "SECURITY_GUARD", nameUz: "Qorovul", nameRu: "Охранник", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 59 },
    { code: "MAINTENANCE_MANAGER", nameUz: "Texnik xizmat menejeri", nameRu: "Менеджер тех. обслуживания", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 60 },
    { code: "MAINTENANCE_TECH", nameUz: "Texnik xizmat texnigi", nameRu: "Техник", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 61 },
    { code: "ELECTRICIAN", nameUz: "Elektrik", nameRu: "Электрик", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 62 },
    { code: "MECHANIC", nameUz: "Mexanik", nameRu: "Механик", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 63 },
    { code: "PLUMBER", nameUz: "Santexnik", nameRu: "Сантехник", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 64 },
    { code: "CANTEEN_MANAGER", nameUz: "Oshxona menejeri", nameRu: "Менеджер столовой", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 65 },
    { code: "CHEF", nameUz: "Oshpaz", nameRu: "Повар", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 66 },
    { code: "CANTEEN_WORKER", nameUz: "Oshxona xodimi", nameRu: "Работник столовой", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 67 },
    { code: "RECEPTIONIST", nameUz: "Qabul xodimi", nameRu: "Ресепшионист", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 68 },
    { code: "OFFICE_MANAGER", nameUz: "Ofis menejeri", nameRu: "Офис менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 69 },
    { code: "CLEANER", nameUz: "Tozalovchi", nameRu: "Уборщик", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 70 },
    { code: "PURCHASING_MANAGER", nameUz: "Xarid menejeri", nameRu: "Менеджер закупок", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 71 },
    { code: "PURCHASING_SPECIALIST", nameUz: "Xarid mutaxassisi", nameRu: "Специалист по закупкам", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 72 },
    { code: "CRM_MANAGER", nameUz: "CRM menejeri", nameRu: "CRM менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 73 },
    { code: "CUSTOMER_SERVICE", nameUz: "Mijozlarga xizmat", nameRu: "Обслуживание клиентов", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 74 },
    { code: "CALL_CENTER_AGENT", nameUz: "Call center operatori", nameRu: "Оператор колл-центра", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 75 },
    { code: "INVENTORY_SPECIALIST", nameUz: "Inventarizatsiya mutaxassisi", nameRu: "Специалист по инвентаризации", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 76 },
    { code: "PRODUCTION_PLANNER", nameUz: "Ishlab chiqarish rejachisi", nameRu: "Планировщик производства", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 77 },
    { code: "COLOR_SPECIALIST", nameUz: "Rang mutaxassisi", nameRu: "Специалист по цвету", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 78 },
    { code: "MACHINE_ADJUSTER", nameUz: "Mashina sozlovchisi", nameRu: "Наладчик оборудования", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 79 },
    { code: "PACKAGING_OPERATOR", nameUz: "Qadoqlash operatori", nameRu: "Оператор упаковки", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 80 },
    { code: "STACKER_OPERATOR", nameUz: "Yig'uvchi operator", nameRu: "Оператор стеллажей", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 81 },
    { code: "FORKLIFT_OPERATOR", nameUz: "Yuk ko'tarkich operatori", nameRu: "Оператор погрузчика", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 82 },
    { code: "SAFETY_OFFICER", nameUz: "Xavfsizlik xodimi", nameRu: "Инженер по ТБ", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 83 },
    { code: "ENVIRONMENTAL_SPEC", nameUz: "Ekologiya mutaxassisi", nameRu: "Специалист по экологии", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 84 },
    { code: "TRAINING_MANAGER", nameUz: "O'qitish menejeri", nameRu: "Менеджер обучения", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 85 },
    { code: "TRAINER", nameUz: "Trener", nameRu: "Тренер", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 86 },
    { code: "LMS_ADMIN", nameUz: "LMS administratori", nameRu: "Администратор LMS", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 87 },
    { code: "INTERN", nameUz: "Stajer", nameRu: "Стажёр", level: 6, rbacTier: "standard", isManagement: false, sortOrder: 88 },
    { code: "TEMP_WORKER", nameUz: "Vaqtinchalik ishchi", nameRu: "Временный работник", level: 6, rbacTier: "standard", isManagement: false, sortOrder: 89 },
    { code: "CONTRACTOR", nameUz: "Shartnomachi", nameRu: "Подрядчик", level: 6, rbacTier: "standard", isManagement: false, sortOrder: 90 },
    { code: "CONSULTANT", nameUz: "Konsultant", nameRu: "Консультант", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 91 },
    { code: "AUDITOR_INTERNAL", nameUz: "Ichki auditor", nameRu: "Внутренний аудитор", level: 3, rbacTier: "specialist", isManagement: false, sortOrder: 92 },
    { code: "DATA_ENTRY", nameUz: "Ma'lumot kirituvchi", nameRu: "Оператор ввода данных", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 93 },
    { code: "ARCHIVE_SPECIALIST", nameUz: "Arxiv mutaxassisi", nameRu: "Специалист по архивам", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 94 },
    { code: "DOCUMENT_CONTROL", nameUz: "Hujjat nazoratchi", nameRu: "Контроль документов", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 95 },
    { code: "POS_CASHIER", nameUz: "POS kassir", nameRu: "POS кассир", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 96 },
    { code: "POS_MANAGER", nameUz: "POS menejeri", nameRu: "POS менеджер", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 97 },
    { code: "ECOMMERCE_MANAGER", nameUz: "E-commerce menejeri", nameRu: "Менеджер электронной торговли", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 98 },
    { code: "PHOTOGRAPHER", nameUz: "Fotograf", nameRu: "Фотограф", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 99 },
    { code: "COPYWRITER", nameUz: "Kopyrayter", nameRu: "Копирайтер", level: 4, rbacTier: "standard", isManagement: false, sortOrder: 100 },
    { code: "BRANCH_MANAGER", nameUz: "Filial menejeri", nameRu: "Менеджер филиала", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 101 },
    { code: "BRANCH_CASHIER", nameUz: "Filial kassiri", nameRu: "Кассир филиала", level: 5, rbacTier: "standard", isManagement: false, sortOrder: 102 },
    { code: "UV_PRINT_OPERATOR", nameUz: "UV bosma operatori", nameRu: "Оператор UV печати", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 103 },
    { code: "SCREEN_PRINT_OPERATOR", nameUz: "Trafaret bosma operatori", nameRu: "Оператор трафаретной печати", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 104 },
    { code: "ENGRAVING_OPERATOR", nameUz: "Gravyura operatori", nameRu: "Оператор гравировки", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 105 },
    { code: "CNC_OPERATOR", nameUz: "CNC operatori", nameRu: "Оператор CNC", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 106 },
    { code: "SUBLIMATION_OPERATOR", nameUz: "Sublimatsiya operatori", nameRu: "Оператор сублимации", level: 5, rbacTier: "operator", isManagement: false, sortOrder: 107 },
    { code: "DEPT_HEAD", nameUz: "Bo'lim boshlig'i", nameRu: "Начальник отдела", level: 3, rbacTier: "manager", isManagement: true, sortOrder: 108 },
    { code: "TEAM_LEAD", nameUz: "Jamoa rahbari", nameRu: "Тимлид", level: 4, rbacTier: "supervisor", isManagement: true, sortOrder: 109 },
    { code: "SENIOR_SPECIALIST", nameUz: "Katta mutaxassis", nameRu: "Старший специалист", level: 4, rbacTier: "specialist", isManagement: false, sortOrder: 110 },
  ]).returning();
  console.log(`✅ ${posRows.length} positions inserted`);

  await db.insert(leaveTypes).values([
    { code: "ANNUAL", nameUz: "Yillik ta'til", nameRu: "Ежегодный отпуск", maxDaysPerYear: 24, isPaid: true, requiresMedicalCert: false, requiresDirectorApproval: false, minDaysBeforeRequest: 14, sortOrder: 1 },
    { code: "SICK", nameUz: "Kasal ta'tili", nameRu: "Больничный", maxDaysPerYear: 30, isPaid: true, requiresMedicalCert: true, requiresDirectorApproval: false, minDaysBeforeRequest: 0, sortOrder: 2 },
    { code: "UNPAID", nameUz: "Haq to'lanmaydigan", nameRu: "Без содержания", maxDaysPerYear: 15, isPaid: false, requiresMedicalCert: false, requiresDirectorApproval: true, minDaysBeforeRequest: 5, sortOrder: 3 },
    { code: "MATERNITY", nameUz: "Tug'ruq ta'tili", nameRu: "Декретный", maxDaysPerYear: 126, isPaid: true, requiresMedicalCert: true, requiresDirectorApproval: false, minDaysBeforeRequest: 30, sortOrder: 4 },
    { code: "PATERNITY", nameUz: "Otalik ta'tili", nameRu: "Отпуск по отцовству", maxDaysPerYear: 3, isPaid: true, requiresMedicalCert: false, requiresDirectorApproval: false, minDaysBeforeRequest: 5, sortOrder: 5 },
    { code: "STUDY", nameUz: "O'qish ta'tili", nameRu: "Учебный отпуск", maxDaysPerYear: 30, isPaid: false, requiresMedicalCert: false, requiresDirectorApproval: true, minDaysBeforeRequest: 14, sortOrder: 6 },
    { code: "COMPASSIONATE", nameUz: "Qayg'uli voqea", nameRu: "Семейные обстоятельства", maxDaysPerYear: 5, isPaid: true, requiresMedicalCert: false, requiresDirectorApproval: false, minDaysBeforeRequest: 0, sortOrder: 7 },
    { code: "MARRIAGE", nameUz: "Nikoh ta'tili", nameRu: "Свадебный отпуск", maxDaysPerYear: 3, isPaid: true, requiresMedicalCert: false, requiresDirectorApproval: false, minDaysBeforeRequest: 7, sortOrder: 8 },
  ]);
  console.log("✅ leave_types inserted");

  await db.insert(shiftTypes).values([
    { code: "DAY", nameUz: "Kunduzgi smena", nameRu: "Дневная смена", startTime: "08:00", endTime: "17:00", durationHours: "8.0", isOvernight: false, overtimeMultiplier: "1.5", sortOrder: 1 },
    { code: "EVENING", nameUz: "Kechki smena", nameRu: "Вечерняя смена", startTime: "14:00", endTime: "22:00", durationHours: "8.0", isOvernight: false, overtimeMultiplier: "1.5", sortOrder: 2 },
    { code: "NIGHT", nameUz: "Tungi smena", nameRu: "Ночная смена", startTime: "22:00", endTime: "06:00", durationHours: "8.0", isOvernight: true, overtimeMultiplier: "2.0", sortOrder: 3 },
    { code: "EXTENDED", nameUz: "Uzaytirilgan smena", nameRu: "Удлинённая смена", startTime: "07:00", endTime: "19:00", durationHours: "12.0", isOvernight: false, overtimeMultiplier: "1.5", sortOrder: 4 },
    { code: "FLEX", nameUz: "Erkin grafik", nameRu: "Свободный график", startTime: "09:00", endTime: "18:00", durationHours: "8.0", isOvernight: false, overtimeMultiplier: "1.5", sortOrder: 5 },
  ]);
  console.log("✅ shift_types inserted");

  await db.insert(skillCategories).values([
    { code: "PRINTING", nameUz: "Bosma texnologiyalari", nameRu: "Технологии печати", sortOrder: 1 },
    { code: "PREPRESS_SKILLS", nameUz: "Prepress ko'nikmalari", nameRu: "Навыки препресс", sortOrder: 2 },
    { code: "POSTPRESS_SKILLS", nameUz: "Postpress ko'nikmalari", nameRu: "Навыки постпресс", sortOrder: 3 },
    { code: "DESIGN_SKILLS", nameUz: "Dizayn ko'nikmalari", nameRu: "Навыки дизайна", sortOrder: 4 },
    { code: "IT_SKILLS", nameUz: "IT ko'nikmalari", nameRu: "ИТ навыки", sortOrder: 5 },
    { code: "MANAGEMENT", nameUz: "Boshqaruv ko'nikmalari", nameRu: "Управленческие навыки", sortOrder: 6 },
    { code: "SALES_SKILLS", nameUz: "Sotuv ko'nikmalari", nameRu: "Навыки продаж", sortOrder: 7 },
    { code: "SAFETY_SKILLS", nameUz: "Xavfsizlik ko'nikmalari", nameRu: "Навыки безопасности", sortOrder: 8 },
    { code: "QUALITY_SKILLS", nameUz: "Sifat nazorati", nameRu: "Навыки контроля качества", sortOrder: 9 },
    { code: "LANGUAGE", nameUz: "Til bilimi", nameRu: "Языковые навыки", sortOrder: 10 },
  ]);
  console.log("✅ skill_categories inserted");

  await db.insert(abcThresholds).values([
    { category: "A", minScore: "90.00", maxScore: "100.00", bonusPercentage: "15.00", description: "A'lo xodim — yuqori bonus", attendanceWeight: "0.40", qualityWeight: "0.25", taskWeight: "0.20", lmsWeight: "0.15" },
    { category: "B", minScore: "70.00", maxScore: "89.99", bonusPercentage: "10.00", description: "Yaxshi xodim — o'rtacha bonus", attendanceWeight: "0.40", qualityWeight: "0.25", taskWeight: "0.20", lmsWeight: "0.15" },
    { category: "C", minScore: "0.00", maxScore: "69.99", bonusPercentage: "5.00", description: "Rivojlanish kerak — minimal bonus", attendanceWeight: "0.40", qualityWeight: "0.25", taskWeight: "0.20", lmsWeight: "0.15" },
  ]);
  console.log("✅ abc_thresholds inserted (A≥90→15%, B≥70→10%, C<70→5%)");

  await db.insert(payrollTaxRules).values([
    { code: "INPS_EMPLOYEE", nameUz: "INPS xodim ulushi", nameRu: "ИНПС доля сотрудника", ratePercent: "12.00", isEmployeeContribution: true, isEmployerContribution: false, minWageUzs: 1120000, effectiveFrom: new Date("2026-01-01") },
    { code: "JSHD_PIT", nameUz: "Jismoniy shaxslar daromad solig'i", nameRu: "НДФЛ (подоходный налог)", ratePercent: "12.00", isEmployeeContribution: true, isEmployerContribution: false, minWageUzs: 1120000, effectiveFrom: new Date("2026-01-01") },
    { code: "INPS_EMPLOYER", nameUz: "INPS ish beruvchi ulushi", nameRu: "ИНПС доля работодателя", ratePercent: "12.00", isEmployeeContribution: false, isEmployerContribution: true, minWageUzs: 1120000, effectiveFrom: new Date("2026-01-01") },
    { code: "SOCIAL_TAX", nameUz: "Ijtimoiy soliq", nameRu: "Социальный налог", ratePercent: "12.00", isEmployeeContribution: false, isEmployerContribution: true, minWageUzs: 1120000, effectiveFrom: new Date("2026-01-01") },
  ]);
  console.log("✅ payroll_tax_rules inserted (INPS 12%, PIT 12%, MinWage 1,120,000 UZS)");

  await db.insert(workCenters).values([
    { code: "WC_PREPRESS_1", nameUz: "Prepress stansiya 1", nameRu: "Препресс станция 1", departmentId: 16, capacity: 3 },
    { code: "WC_OFFSET_SM52", nameUz: "Heidelberg SM52", nameRu: "Heidelberg SM52", departmentId: 17, capacity: 2 },
    { code: "WC_OFFSET_SM74", nameUz: "Heidelberg SM74", nameRu: "Heidelberg SM74", departmentId: 17, capacity: 2 },
    { code: "WC_OFFSET_XL106", nameUz: "Heidelberg XL106", nameRu: "Heidelberg XL106", departmentId: 17, capacity: 2 },
    { code: "WC_DIGITAL_RICOH", nameUz: "Ricoh Pro C9200", nameRu: "Ricoh Pro C9200", departmentId: 18, capacity: 1 },
    { code: "WC_DIGITAL_XEROX", nameUz: "Xerox Iridesse", nameRu: "Xerox Iridesse", departmentId: 18, capacity: 1 },
    { code: "WC_DIGITAL_KONICA", nameUz: "Konica Minolta", nameRu: "Konica Minolta", departmentId: 18, capacity: 1 },
    { code: "WC_CUTTER_1", nameUz: "Polar 115", nameRu: "Polar 115", departmentId: 19, capacity: 1 },
    { code: "WC_LAMINATOR_1", nameUz: "Laminatsiya 1", nameRu: "Ламинатор 1", departmentId: 19, capacity: 1 },
    { code: "WC_BINDING_1", nameUz: "Broshyura 1", nameRu: "Переплёт 1", departmentId: 19, capacity: 2 },
    { code: "WC_EMBOSSING_1", nameUz: "Shtamplash 1", nameRu: "Тиснение 1", departmentId: 19, capacity: 1 },
    { code: "WC_FOILING_1", nameUz: "Folga 1", nameRu: "Фольгирование 1", departmentId: 19, capacity: 1 },
    { code: "WC_LF_ROLAND", nameUz: "Roland TrueVIS", nameRu: "Roland TrueVIS", departmentId: 20, capacity: 1 },
    { code: "WC_LF_MIMAKI", nameUz: "Mimaki JV300", nameRu: "Mimaki JV300", departmentId: 20, capacity: 1 },
    { code: "WC_LF_HP", nameUz: "HP Latex", nameRu: "HP Latex", departmentId: 20, capacity: 1 },
    { code: "WC_UV_FLATBED", nameUz: "UV Flatbed printer", nameRu: "UV планшетный принтер", departmentId: 20, capacity: 1 },
    { code: "WC_CNC_1", nameUz: "CNC kesish", nameRu: "CNC резка", departmentId: 19, capacity: 1 },
    { code: "WC_PACKAGING_1", nameUz: "Qadoqlash stansiyasi", nameRu: "Станция упаковки", departmentId: 19, capacity: 3 },
  ]);
  console.log("✅ work_centers inserted");

  console.log("\n🎉 Seed completed successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
