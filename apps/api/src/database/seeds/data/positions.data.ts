/**
 * 110+ lavozim — ARCHITECTURE.md §28 (Vysotskiy lavozim ierarxiyasi).
 *
 * Daraja (level):
 *   1 — Egasi
 *   2 — CEO
 *   3 — Direktor (Ma'muriy/Texnik/Rivojlanish)
 *   4 — Bo'lim boshlig'i
 *   5 — Mutaxassis
 *   6 — Ijrochi (Operator/Haydovchi/Omborchi)
 *
 * rbac_tier:
 *   'owner'      — Egasi (FULL hammasiga + audit)
 *   'executive'  — CEO/Director (READ_PLUS)
 *   'manager'    — Bo'lim boshliqlari, mutaxassis-menejerlar
 *   'specialist' — Mutaxassislar
 *   'operator'   — Ijrochilar (LIMITED)
 *   'standard'   — Default (yangi lavozim)
 */
export interface PositionSeed {
  code: string;
  nameUz: string;
  nameRu: string;
  departmentCode: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  rbacTier: 'owner' | 'executive' | 'manager' | 'specialist' | 'operator' | 'standard';
  isManagement: boolean;
  headcount: number;
  sortOrder: number;
}

const _executive: ReadonlyArray<PositionSeed> = [
  { code: 'OWNER',           nameUz: 'Egasi',               nameRu: 'Владелец',                  departmentCode: 'CEO_OFFICE', level: 1, rbacTier: 'owner',     isManagement: true,  headcount: 1, sortOrder: 1 },
  { code: 'CEO',             nameUz: 'Bosh Direktor',       nameRu: 'Генеральный директор',      departmentCode: 'CEO_OFFICE', level: 2, rbacTier: 'executive', isManagement: true,  headcount: 1, sortOrder: 2 },
  { code: 'ADMIN_DIRECTOR',  nameUz: "Ma'muriy Direktor",   nameRu: 'Административный директор', departmentCode: 'ADMIN',      level: 3, rbacTier: 'executive', isManagement: true,  headcount: 1, sortOrder: 3 },
  { code: 'TECH_DIRECTOR',   nameUz: 'Texnik Direktor',     nameRu: 'Технический директор',      departmentCode: 'PRODUCTION', level: 3, rbacTier: 'executive', isManagement: true,  headcount: 1, sortOrder: 4 },
  { code: 'DEV_DIRECTOR',    nameUz: 'Rivojlanish Direktori', nameRu: 'Директор развития',       departmentCode: 'PR_DEPT',    level: 3, rbacTier: 'executive', isManagement: true,  headcount: 1, sortOrder: 5 },
];

const _heads: ReadonlyArray<PositionSeed> = [
  { code: 'HR_HEAD',           nameUz: "HR Boshlig'i",                nameRu: 'Начальник HR',                  departmentCode: 'HR_DEPT',    level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 10 },
  { code: 'SALES_HEAD',        nameUz: "Sotuvlar Boshlig'i",          nameRu: 'Начальник продаж',              departmentCode: 'SALES',      level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 11 },
  { code: 'MARKETING_HEAD',    nameUz: "Marketing Boshlig'i",          nameRu: 'Начальник маркетинга',           departmentCode: 'MARKETING',  level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 12 },
  { code: 'CHIEF_ACCOUNTANT',  nameUz: 'Bosh Buxgalter',               nameRu: 'Главный бухгалтер',              departmentCode: 'ACCOUNTING', level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 13 },
  { code: 'PRODUCTION_HEAD',   nameUz: "Ishlab Chiqarish Boshlig'i",  nameRu: 'Начальник производства',         departmentCode: 'PRODUCTION', level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 14 },
  { code: 'WAREHOUSE_HEAD',    nameUz: "Ombor Boshlig'i",             nameRu: 'Начальник склада',               departmentCode: 'WAREHOUSE',  level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 15 },
  { code: 'QC_HEAD',           nameUz: "Sifat Boshlig'i",             nameRu: 'Начальник ОТК',                  departmentCode: 'QC_DEPT',    level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 16 },
  { code: 'SUPPLY_HEAD',       nameUz: "Ta'minlash Boshlig'i",        nameRu: 'Начальник снабжения',            departmentCode: 'WAREHOUSE',  level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 17 },
  { code: 'LOGISTICS_HEAD',    nameUz: "Logistika Boshlig'i",         nameRu: 'Начальник логистики',            departmentCode: 'DELIVERY',   level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 18 },
  { code: 'DESIGN_HEAD',       nameUz: "Dizayn Bo'lim Boshlig'i",     nameRu: 'Начальник дизайн-бюро',          departmentCode: 'PREPRESS',   level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 19 },
  { code: 'PLANNING_HEAD',     nameUz: "Rejalashtirish Boshlig'i",    nameRu: 'Начальник планирования',         departmentCode: 'PRODUCTION', level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 20 },
  { code: 'FLEXO_HEAD',        nameUz: "Flekso Sex Boshlig'i",        nameRu: 'Начальник флексо цеха',          departmentCode: 'FLEXO',      level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 21 },
  { code: 'OFFSET_HEAD',       nameUz: "Ofset Sex Boshlig'i",         nameRu: 'Начальник офсет цеха',           departmentCode: 'OFFSET',     level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 22 },
  { code: 'LMS_HEAD',          nameUz: "O'qitish Boshlig'i",          nameRu: 'Руководитель обучения',          departmentCode: 'LMS_DEPT',   level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 23 },
  { code: 'PR_HEAD',           nameUz: "PR Boshlig'i",                nameRu: 'Начальник PR',                   departmentCode: 'PR_DEPT',    level: 4, rbacTier: 'manager', isManagement: true, headcount: 1, sortOrder: 24 },
];

const _specialists: ReadonlyArray<PositionSeed> = [
  // CRM/Sales
  { code: 'CRM_SPECIALIST',    nameUz: 'CRM Mutaxassisi',     nameRu: 'CRM-специалист',          departmentCode: 'SALES',      level: 5, rbacTier: 'specialist', isManagement: false, headcount: 3, sortOrder: 100 },
  { code: 'SALES_MANAGER',     nameUz: 'Savdo Menejeri',      nameRu: 'Менеджер продаж',         departmentCode: 'SALES',      level: 5, rbacTier: 'manager',    isManagement: false, headcount: 8, sortOrder: 101 },
  { code: 'KEY_ACCOUNT_MANAGER', nameUz: 'Yirik Mijozlar Menejeri', nameRu: 'Менеджер ключевых клиентов', departmentCode: 'SALES', level: 5, rbacTier: 'manager', isManagement: false, headcount: 2, sortOrder: 102 },
  { code: 'B2B_SALES_SPECIALIST', nameUz: 'B2B Sotuv Mutaxassisi', nameRu: 'B2B-специалист',     departmentCode: 'SALES',      level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 103 },

  // Marketing
  { code: 'MARKETING_SPECIALIST', nameUz: 'Marketing Mutaxassisi', nameRu: 'Маркетолог',         departmentCode: 'MARKETING',  level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 110 },
  { code: 'SMM_SPECIALIST',    nameUz: 'SMM Mutaxassisi',     nameRu: 'SMM-специалист',          departmentCode: 'MARKETING',  level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 111 },
  { code: 'SEO_SPECIALIST',    nameUz: 'SEO Mutaxassisi',     nameRu: 'SEO-специалист',          departmentCode: 'MARKETING',  level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 112 },
  { code: 'CONTENT_MANAGER',   nameUz: 'Kontent Menejeri',    nameRu: 'Контент-менеджер',        departmentCode: 'MARKETING',  level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 113 },
  { code: 'COPYWRITER',        nameUz: 'Kopirayter',          nameRu: 'Копирайтер',              departmentCode: 'MARKETING',  level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 114 },

  // Design
  { code: 'DESIGNER',          nameUz: 'Dizayner',            nameRu: 'Дизайнер',                departmentCode: 'PREPRESS',   level: 5, rbacTier: 'specialist', isManagement: false, headcount: 4, sortOrder: 120 },
  { code: 'SENIOR_DESIGNER',   nameUz: 'Bosh Dizayner',       nameRu: 'Старший дизайнер',         departmentCode: 'PREPRESS',   level: 5, rbacTier: 'manager',    isManagement: false, headcount: 1, sortOrder: 121 },
  { code: 'PREPRESS_SPECIALIST', nameUz: 'Preprint Mutaxassisi', nameRu: 'Препресс-специалист',  departmentCode: 'PREPRESS',   level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 122 },

  // Production / Tech
  { code: 'TECHNOLOGIST',      nameUz: 'Texnolog',            nameRu: 'Технолог',                departmentCode: 'PRODUCTION', level: 5, rbacTier: 'manager',    isManagement: false, headcount: 3, sortOrder: 130 },
  { code: 'SENIOR_TECHNOLOGIST', nameUz: 'Bosh Texnolog',     nameRu: 'Главный технолог',         departmentCode: 'PRODUCTION', level: 5, rbacTier: 'manager',    isManagement: false, headcount: 1, sortOrder: 131 },
  { code: 'PLANNING_SPECIALIST', nameUz: 'Rejalashtirish Mutaxassisi', nameRu: 'Специалист планирования', departmentCode: 'PRODUCTION', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 132 },
  { code: 'PRODUCTION_DISPATCHER', nameUz: 'Ishlab Chiqarish Dispetcheri', nameRu: 'Диспетчер производства', departmentCode: 'PRODUCTION', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 133 },

  // Finance
  { code: 'ACCOUNTANT',        nameUz: 'Buxgalter',           nameRu: 'Бухгалтер',               departmentCode: 'ACCOUNTING', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 4, sortOrder: 140 },
  { code: 'SENIOR_ACCOUNTANT', nameUz: 'Bosh Buxgalter Yordamchisi', nameRu: 'Старший бухгалтер', departmentCode: 'ACCOUNTING', level: 5, rbacTier: 'manager',    isManagement: false, headcount: 1, sortOrder: 141 },
  { code: 'CASHIER',           nameUz: 'Kassir',              nameRu: 'Кассир',                  departmentCode: 'ACCOUNTING', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 142 },
  { code: 'FINANCIAL_ANALYST', nameUz: 'Moliyaviy Tahlilchi', nameRu: 'Финансовый аналитик',     departmentCode: 'FINANCE',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 143 },
  { code: 'PAYROLL_SPECIALIST', nameUz: 'Maosh Mutaxassisi',  nameRu: 'Специалист по зарплате',   departmentCode: 'ACCOUNTING', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 144 },
  { code: 'ECONOMIST',         nameUz: 'Iqtisodchi',          nameRu: 'Экономист',               departmentCode: 'FINANCE',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 145 },

  // HR
  { code: 'HR_SPECIALIST',     nameUz: 'HR Mutaxassisi',      nameRu: 'HR-специалист',           departmentCode: 'HR_DEPT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 150 },
  { code: 'RECRUITER',         nameUz: 'Yollovchi',           nameRu: 'Рекрутер',                departmentCode: 'RECRUIT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 151 },
  { code: 'TRAINING_SPECIALIST', nameUz: "O'qitish Mutaxassisi", nameRu: 'Специалист по обучению', departmentCode: 'LMS_DEPT', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 152 },
  { code: 'LMS_COORDINATOR',   nameUz: 'LMS Koordinatori',    nameRu: 'Координатор обучения',     departmentCode: 'LMS_DEPT',   level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 153 },
  { code: 'HSE_SPECIALIST',    nameUz: 'Xavfsizlik Mutaxassisi', nameRu: 'HSE-специалист',        departmentCode: 'HR_DEPT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 154 },

  // QC
  { code: 'QC_INSPECTOR',      nameUz: 'QC Inspektori',       nameRu: 'Инспектор ОТК',           departmentCode: 'QC_DEPT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 4, sortOrder: 160 },
  { code: 'QC_LAB_SPECIALIST', nameUz: 'Lab Mutaxassisi',     nameRu: 'Лаборант',                departmentCode: 'QC_DEPT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 161 },
  { code: 'QC_AUDITOR',        nameUz: 'Sifat Auditori',      nameRu: 'Аудитор качества',        departmentCode: 'QC_DEPT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 162 },

  // Supply / Logistics
  { code: 'SUPPLY_SPECIALIST', nameUz: "Ta'minlash Mutaxassisi", nameRu: 'Специалист снабжения',  departmentCode: 'WAREHOUSE',  level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 170 },
  { code: 'LOGISTICS_COORDINATOR', nameUz: 'Logistika Koordinatori', nameRu: 'Координатор логистики', departmentCode: 'DELIVERY', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 171 },
  { code: 'CUSTOMS_BROKER',    nameUz: 'Bojxona Brokeri',     nameRu: 'Таможенный брокер',       departmentCode: 'DELIVERY',   level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 172 },

  // PR/IT
  { code: 'IT_SPECIALIST',     nameUz: 'IT Mutaxassis',       nameRu: 'IT-специалист',           departmentCode: 'CEO_OFFICE', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 2, sortOrder: 180 },
  { code: 'SYSTEM_ADMIN',      nameUz: 'Tizim Administratori', nameRu: 'Системный администратор', departmentCode: 'CEO_OFFICE', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 181 },
  { code: 'PR_SPECIALIST',     nameUz: 'PR Mutaxassisi',      nameRu: 'PR-специалист',           departmentCode: 'PR_DEPT',    level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 182 },

  // Office
  { code: 'OFFICE_MANAGER',    nameUz: 'Ofis Menejeri',       nameRu: 'Офис-менеджер',           departmentCode: 'CEO_OFFICE', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 190 },
  { code: 'SECRETARY',         nameUz: 'Kotiba',              nameRu: 'Секретарь',               departmentCode: 'CEO_OFFICE', level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 191 },
  { code: 'LAWYER',            nameUz: 'Yurist',              nameRu: 'Юрист',                   departmentCode: 'ADMIN',      level: 5, rbacTier: 'specialist', isManagement: false, headcount: 1, sortOrder: 192 },
];

const _operators: ReadonlyArray<PositionSeed> = [
  // Warehouse operators
  { code: 'WAREHOUSE_KEEPER',  nameUz: 'Omborchi',            nameRu: 'Кладовщик',               departmentCode: 'WAREHOUSE',  level: 6, rbacTier: 'operator', isManagement: false, headcount: 6, sortOrder: 200 },
  { code: 'SENIOR_WAREHOUSE_KEEPER', nameUz: 'Bosh Omborchi', nameRu: 'Старший кладовщик',       departmentCode: 'WAREHOUSE',  level: 6, rbacTier: 'operator', isManagement: false, headcount: 1, sortOrder: 201 },
  { code: 'FORKLIFT_OPERATOR', nameUz: 'Avtopogruzchik Operatori', nameRu: 'Водитель погрузчика', departmentCode: 'WAREHOUSE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 2, sortOrder: 202 },
  { code: 'PICKER',            nameUz: 'Yig\'uvchi',          nameRu: 'Сборщик',                 departmentCode: 'WAREHOUSE',  level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 203 },

  // Flexo operators
  { code: 'FLEXO_OPERATOR',    nameUz: 'Flekso Operatori',    nameRu: 'Оператор флексо',         departmentCode: 'FLEXO',      level: 6, rbacTier: 'operator', isManagement: false, headcount: 6, sortOrder: 210 },
  { code: 'CORRUGATOR_OPERATOR', nameUz: 'Gofra Operatori',   nameRu: 'Оператор гофрирования',    departmentCode: 'FLEXO',      level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 211 },
  { code: 'STITCHER_OPERATOR', nameUz: 'Tikuvchi Operatori',  nameRu: 'Оператор скрепления',     departmentCode: 'FLEXO',      level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 212 },
  { code: 'DIE_CUT_OPERATOR',  nameUz: 'Shtans Operatori',     nameRu: 'Оператор штанцевания',    departmentCode: 'FLEXO',      level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 213 },
  { code: 'FOLDER_GLUER_OPERATOR', nameUz: 'Bukuvchi-Yelimchi Operatori', nameRu: 'Оператор фальцевания-склейки', departmentCode: 'FLEXO', level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 214 },

  // Offset operators
  { code: 'OFFSET_OPERATOR',   nameUz: 'Ofset Operatori',     nameRu: 'Оператор офсет',          departmentCode: 'OFFSET',     level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 220 },
  { code: 'PRINTING_OPERATOR', nameUz: 'Bosma Operatori',     nameRu: 'Оператор печати',         departmentCode: 'OFFSET',     level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 221 },
  { code: 'LAMINATION_OPERATOR', nameUz: 'Laminatsiya Operatori', nameRu: 'Оператор ламинации',  departmentCode: 'OFFSET',     level: 6, rbacTier: 'operator', isManagement: false, headcount: 2, sortOrder: 222 },
  { code: 'VARNISH_OPERATOR',  nameUz: 'Lakiylash Operatori',  nameRu: 'Оператор лакирования',    departmentCode: 'OFFSET',     level: 6, rbacTier: 'operator', isManagement: false, headcount: 2, sortOrder: 223 },
  { code: 'CUTTING_OPERATOR',  nameUz: 'Kesish Operatori',    nameRu: 'Оператор резки',          departmentCode: 'OFFSET',     level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 224 },
  { code: 'PACKING_OPERATOR',  nameUz: 'Qadoqlash Operatori', nameRu: 'Оператор упаковки',       departmentCode: 'OFFSET',     level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 225 },

  // Delivery
  { code: 'DRIVER',            nameUz: 'Haydovchi',           nameRu: 'Водитель',                departmentCode: 'DELIVERY',   level: 6, rbacTier: 'operator', isManagement: false, headcount: 6, sortOrder: 230 },
  { code: 'DELIVERY_HELPER',   nameUz: 'Yetkazib Berish Yordamchisi', nameRu: 'Помощник доставки', departmentCode: 'DELIVERY', level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 231 },
  { code: 'LOADER',            nameUz: 'Yuklovchi',           nameRu: 'Грузчик',                 departmentCode: 'DELIVERY',   level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 232 },

  // Maintenance / Auxiliary
  { code: 'MAINTENANCE_TECH',  nameUz: 'Texnik Xodim',        nameRu: 'Техник обслуживания',     departmentCode: 'PRODUCTION', level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 240 },
  { code: 'ELECTRICIAN',       nameUz: 'Elektrik',            nameRu: 'Электрик',                departmentCode: 'PRODUCTION', level: 6, rbacTier: 'operator', isManagement: false, headcount: 2, sortOrder: 241 },
  { code: 'MECHANIC',          nameUz: 'Mexanik',             nameRu: 'Механик',                 departmentCode: 'PRODUCTION', level: 6, rbacTier: 'operator', isManagement: false, headcount: 2, sortOrder: 242 },
  { code: 'PRINT_MACHINE_HELPER', nameUz: 'Bosma Mashina Yordamchisi', nameRu: 'Помощник печатника', departmentCode: 'OFFSET', level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 243 },

  // Service / Auxiliary
  { code: 'SECURITY_GUARD',    nameUz: "Qo'riqchi",           nameRu: 'Охранник',                departmentCode: 'CEO_OFFICE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 250 },
  { code: 'CLEANER',           nameUz: 'Tozalovchi',          nameRu: 'Уборщик',                 departmentCode: 'CEO_OFFICE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 4, sortOrder: 251 },
  { code: 'CANTEEN_WORKER',    nameUz: 'Oshxona Xodimi',      nameRu: 'Работник столовой',       departmentCode: 'CEO_OFFICE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 252 },
  { code: 'COOK',              nameUz: 'Oshpaz',              nameRu: 'Повар',                   departmentCode: 'CEO_OFFICE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 1, sortOrder: 253 },
  { code: 'GARDENER',          nameUz: 'Bog\'bon',            nameRu: 'Садовник',                departmentCode: 'CEO_OFFICE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 1, sortOrder: 254 },
  { code: 'COURIER',           nameUz: 'Kurer',               nameRu: 'Курьер',                  departmentCode: 'CEO_OFFICE', level: 6, rbacTier: 'operator', isManagement: false, headcount: 1, sortOrder: 255 },

  // Quality operators
  { code: 'QC_OPERATOR',       nameUz: 'Sifat Operatori',     nameRu: 'Контролёр ОТК',           departmentCode: 'QC_DEPT',    level: 6, rbacTier: 'operator', isManagement: false, headcount: 3, sortOrder: 260 },
  { code: 'SAMPLING_OPERATOR', nameUz: 'Namuna Olish Operatori', nameRu: 'Оператор отбора проб',  departmentCode: 'QC_DEPT',    level: 6, rbacTier: 'operator', isManagement: false, headcount: 1, sortOrder: 261 },

  // Shift supervisors
  { code: 'FLEXO_SHIFT_LEADER',  nameUz: 'Flekso Smena Boshlig\'i', nameRu: 'Сменный мастер флексо', departmentCode: 'FLEXO',  level: 5, rbacTier: 'manager',  isManagement: true, headcount: 3, sortOrder: 270 },
  { code: 'OFFSET_SHIFT_LEADER', nameUz: 'Ofset Smena Boshlig\'i', nameRu: 'Сменный мастер офсет',  departmentCode: 'OFFSET', level: 5, rbacTier: 'manager',  isManagement: true, headcount: 3, sortOrder: 271 },
  { code: 'WAREHOUSE_SHIFT_LEADER', nameUz: 'Ombor Smena Boshlig\'i', nameRu: 'Сменный мастер склада', departmentCode: 'WAREHOUSE', level: 5, rbacTier: 'manager', isManagement: true, headcount: 2, sortOrder: 272 },
];

// Lavozimlar org chart UI orqali boshqariladi (node_type='position').
// Migration: 0026_sync_departments_to_org.sql ni bir marta ishga tushiring.
export const POSITIONS_SEED: ReadonlyArray<PositionSeed> = [];
