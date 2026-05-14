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

// Statik seed o'chirildi — bo'limlar org chart UI orqali boshqariladi.
// Bir martalik migration: apps/api/src/shared/db/migrations/0026_sync_departments_to_org.sql
export const DEPARTMENTS_SEED: ReadonlyArray<DepartmentSeed> = [
  // Bo'limlar org chart UI orqali boshqariladi.
  // Migration: 0026_sync_departments_to_org.sql ni bir marta ishga tushiring.
];
