/**
 * 18 ta departament — ARCHITECTURE.md §28 (Vysotskiy 7-funksiya).
 * Har departament `code` UNIQUE — biznes kalit (Master Data Qoida 1).
 *
 * vysotsky_function: 1=Qurilish (HR/LMS), 2=Tarqatish (CRM/SD/Marketing),
 * 3=Moliyaviy (FI), 4=Texnik (PP/MM/WMS/MRO/Logistika), 5=Malaka (QC/LMS),
 * 6=Rivojlanish (PR/Hamkorlar), 7=Ma'muriy (Core/BI)
 */
export interface DepartmentSeed {
  code: string;
  nameUz: string;
  nameRu: string;
  parentCode: string | null;
  vysotskiyFunction: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  level: number;
  sortOrder: number;
}

export const DEPARTMENTS_SEED: ReadonlyArray<DepartmentSeed> = [
  // 7-Otdeleniye (Ma'muriy)
  { code: 'ADMIN',       nameUz: "Ma'muriyat",            nameRu: 'Администрация',         parentCode: null,    vysotskiyFunction: 7, level: 1, sortOrder: 10 },
  { code: 'CEO_OFFICE',  nameUz: 'Bosh Direktor ofisi',    nameRu: 'Офис Ген. директора',   parentCode: 'ADMIN', vysotskiyFunction: 7, level: 2, sortOrder: 11 },

  // 1-Otdeleniye (Qurilish — HR/LMS)
  { code: 'HR_DEPT',     nameUz: 'Kadrlar bo\'limi',       nameRu: 'Отдел кадров',          parentCode: 'ADMIN', vysotskiyFunction: 1, level: 2, sortOrder: 20 },
  { code: 'RECRUIT',     nameUz: 'Yollash sektsiyasi',     nameRu: 'Сектор найма',          parentCode: 'HR_DEPT', vysotskiyFunction: 1, level: 3, sortOrder: 21 },
  { code: 'LMS_DEPT',    nameUz: 'O\'qitish bo\'limi',     nameRu: 'Отдел обучения',        parentCode: 'ADMIN', vysotskiyFunction: 5, level: 2, sortOrder: 22 },

  // 2-Otdeleniye (Tarqatish — CRM/SD/Marketing)
  { code: 'MARKETING',   nameUz: 'Marketing',              nameRu: 'Маркетинг',             parentCode: 'ADMIN', vysotskiyFunction: 2, level: 2, sortOrder: 30 },
  { code: 'SALES',       nameUz: 'Sotuvlar',               nameRu: 'Продажи',               parentCode: 'ADMIN', vysotskiyFunction: 2, level: 2, sortOrder: 31 },

  // 3-Otdeleniye (Moliyaviy — FI)
  { code: 'FINANCE',     nameUz: 'Moliya',                 nameRu: 'Финансы',               parentCode: 'ADMIN', vysotskiyFunction: 3, level: 2, sortOrder: 40 },
  { code: 'ACCOUNTING',  nameUz: 'Buxgalteriya',           nameRu: 'Бухгалтерия',           parentCode: 'FINANCE', vysotskiyFunction: 3, level: 3, sortOrder: 41 },

  // 4-Otdeleniye (Texnik — PP/MM/WMS/MRO/Logistika)
  { code: 'PRODUCTION',  nameUz: 'Ishlab chiqarish',       nameRu: 'Производство',          parentCode: 'ADMIN', vysotskiyFunction: 4, level: 2, sortOrder: 50 },
  { code: 'FLEXO',       nameUz: 'Flekso sexi',             nameRu: 'Флексо цех',            parentCode: 'PRODUCTION', vysotskiyFunction: 4, level: 3, sortOrder: 51 },
  { code: 'OFFSET',      nameUz: 'Ofset sexi',             nameRu: 'Офсет цех',             parentCode: 'PRODUCTION', vysotskiyFunction: 4, level: 3, sortOrder: 52 },
  { code: 'PREPRESS',    nameUz: 'Preprint bo\'limi',      nameRu: 'Препресс',              parentCode: 'PRODUCTION', vysotskiyFunction: 4, level: 3, sortOrder: 53 },
  { code: 'WAREHOUSE',   nameUz: 'Ombor',                  nameRu: 'Склад',                 parentCode: 'ADMIN', vysotskiyFunction: 4, level: 2, sortOrder: 54 },
  { code: 'DELIVERY',    nameUz: 'Yetkazib berish',        nameRu: 'Доставка',              parentCode: 'ADMIN', vysotskiyFunction: 4, level: 2, sortOrder: 55 },

  // 5-Otdeleniye (Malaka — QC)
  { code: 'QC_DEPT',     nameUz: 'Sifat nazorati',         nameRu: 'ОТК',                   parentCode: 'ADMIN', vysotskiyFunction: 5, level: 2, sortOrder: 60 },

  // 6-Otdeleniye (Rivojlanish — PR/Hamkorlar)
  { code: 'PR_DEPT',     nameUz: 'PR va aloqalar',         nameRu: 'PR и связи',            parentCode: 'ADMIN', vysotskiyFunction: 6, level: 2, sortOrder: 70 },
  { code: 'PARTNERS',    nameUz: 'Hamkorlar',              nameRu: 'Партнёры',              parentCode: 'ADMIN', vysotskiyFunction: 6, level: 2, sortOrder: 71 },
];
