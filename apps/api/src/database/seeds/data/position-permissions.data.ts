/**
 * RBAC matritsa — ARCHITECTURE.md §32 va §28.
 * Module × Position × AccessLevel.
 *
 * AccessLevel:
 *   FULL       — CRUD + Approve + Export
 *   READ_PLUS  — Read + Approve/Reject
 *   READ       — Read only
 *   LIMITED    — Faqat o'ziga tegishli yozuvlar
 *   NONE       — Hech narsa (menyudan ham yashiriladi)
 */
export const ACCESS_LEVEL = {
  FULL: 'FULL',
  READ_PLUS: 'READ_PLUS',
  READ: 'READ',
  LIMITED: 'LIMITED',
  NONE: 'NONE',
} as const;

export type AccessLevel = (typeof ACCESS_LEVEL)[keyof typeof ACCESS_LEVEL];

export const MODULE_CODE = {
  MDM: 'MDM',
  CRM: 'CRM',
  SD: 'SD',
  PP: 'PP',
  MM: 'MM',
  FI: 'FI',
  WMS: 'WMS',
  QC: 'QC',
  HR: 'HR',
  LMS: 'LMS',
  DESIGN: 'DESIGN',
  LOGISTICS: 'LOGISTICS',
  POS: 'POS',
  ECOMMERCE: 'ECOMMERCE',
  BI: 'BI',
} as const;

export type ModuleCode = (typeof MODULE_CODE)[keyof typeof MODULE_CODE];

export interface PositionPermissionSeed {
  positionCode: string;
  moduleCode: ModuleCode;
  accessLevel: AccessLevel;
}

const ALL_MODULES: ModuleCode[] = Object.values(MODULE_CODE);

function fullAll(positionCode: string): PositionPermissionSeed[] {
  return ALL_MODULES.map((m) => ({ positionCode, moduleCode: m, accessLevel: ACCESS_LEVEL.FULL }));
}

function readPlusAll(positionCode: string): PositionPermissionSeed[] {
  return ALL_MODULES.map((m) => ({ positionCode, moduleCode: m, accessLevel: ACCESS_LEVEL.READ_PLUS }));
}

function readAll(positionCode: string): PositionPermissionSeed[] {
  return ALL_MODULES.map((m) => ({ positionCode, moduleCode: m, accessLevel: ACCESS_LEVEL.READ }));
}

function noneAll(positionCode: string): PositionPermissionSeed[] {
  return ALL_MODULES.map((m) => ({ positionCode, moduleCode: m, accessLevel: ACCESS_LEVEL.NONE }));
}

function override(
  base: PositionPermissionSeed[],
  changes: Partial<Record<ModuleCode, AccessLevel>>,
  positionCode: string,
): PositionPermissionSeed[] {
  const result = base.filter((r) => !(r.positionCode === positionCode && r.moduleCode in changes));
  for (const [mod, lvl] of Object.entries(changes)) {
    if (lvl) result.push({ positionCode, moduleCode: mod as ModuleCode, accessLevel: lvl });
  }
  return result;
}

const FULL = ACCESS_LEVEL.FULL;
const READ_PLUS = ACCESS_LEVEL.READ_PLUS;
const READ = ACCESS_LEVEL.READ;
const LIMITED = ACCESS_LEVEL.LIMITED;
const NONE = ACCESS_LEVEL.NONE;

export const POSITION_PERMISSIONS_SEED: ReadonlyArray<PositionPermissionSeed> = [
  // ─── Egasi: hammasiga FULL ──────────────────────────────────────────
  ...fullAll('OWNER'),

  // ─── CEO: hammasiga READ_PLUS ───────────────────────────────────────
  ...readPlusAll('CEO'),

  // ─── Direktorlar ─────────────────────────────────────────────────────
  ...override(readAll('ADMIN_DIRECTOR'), { HR: FULL, LMS: FULL, CRM: FULL, SD: FULL, ECOMMERCE: FULL, BI: READ_PLUS }, 'ADMIN_DIRECTOR'),
  ...override(readAll('TECH_DIRECTOR'),  { PP: FULL, MM: FULL, WMS: FULL, QC: FULL, DESIGN: FULL, LOGISTICS: FULL, POS: FULL, BI: READ_PLUS }, 'TECH_DIRECTOR'),
  ...override(readAll('DEV_DIRECTOR'),   { ECOMMERCE: FULL, BI: FULL, CRM: READ_PLUS, MDM: READ_PLUS }, 'DEV_DIRECTOR'),

  // ─── Bo'lim boshliqlari ──────────────────────────────────────────────
  ...override(readAll('HR_HEAD'),         { HR: FULL, LMS: FULL, MDM: READ_PLUS }, 'HR_HEAD'),
  ...override(readAll('SALES_HEAD'),      { CRM: FULL, SD: FULL, ECOMMERCE: READ_PLUS, WMS: READ, FI: READ }, 'SALES_HEAD'),
  ...override(readAll('MARKETING_HEAD'),  { ECOMMERCE: FULL, CRM: READ_PLUS, BI: READ }, 'MARKETING_HEAD'),
  ...override(readAll('CHIEF_ACCOUNTANT'),{ FI: FULL, SD: READ, WMS: READ, HR: READ, MM: READ }, 'CHIEF_ACCOUNTANT'),
  ...override(readAll('PRODUCTION_HEAD'), { PP: FULL, MM: READ_PLUS, WMS: READ_PLUS, QC: READ_PLUS }, 'PRODUCTION_HEAD'),
  ...override(readAll('WAREHOUSE_HEAD'),  { WMS: FULL, POS: FULL, MM: READ, PP: READ }, 'WAREHOUSE_HEAD'),
  ...override(readAll('QC_HEAD'),         { QC: FULL, PP: READ, MM: READ, WMS: READ }, 'QC_HEAD'),
  ...override(readAll('SUPPLY_HEAD'),     { MM: FULL, WMS: READ_PLUS, FI: READ }, 'SUPPLY_HEAD'),
  ...override(readAll('LOGISTICS_HEAD'),  { LOGISTICS: FULL, SD: READ, WMS: READ }, 'LOGISTICS_HEAD'),
  ...override(readAll('DESIGN_HEAD'),     { DESIGN: FULL, SD: READ, PP: READ }, 'DESIGN_HEAD'),
  ...override(readAll('PLANNING_HEAD'),   { PP: FULL, MM: READ, WMS: READ }, 'PLANNING_HEAD'),
  ...override(readAll('FLEXO_HEAD'),      { PP: FULL, QC: READ_PLUS, WMS: READ }, 'FLEXO_HEAD'),
  ...override(readAll('OFFSET_HEAD'),     { PP: FULL, QC: READ_PLUS, WMS: READ }, 'OFFSET_HEAD'),
  ...override(readAll('LMS_HEAD'),        { LMS: FULL, HR: READ }, 'LMS_HEAD'),
  ...override(readAll('PR_HEAD'),         { ECOMMERCE: FULL, CRM: READ }, 'PR_HEAD'),

  // ─── Mutaxassislar (Sales/CRM) ───────────────────────────────────────
  ...override(noneAll('CRM_SPECIALIST'),    { CRM: FULL, SD: READ, ECOMMERCE: READ }, 'CRM_SPECIALIST'),
  ...override(noneAll('SALES_MANAGER'),     { CRM: FULL, SD: FULL, WMS: READ, ECOMMERCE: READ_PLUS, FI: LIMITED }, 'SALES_MANAGER'),
  ...override(noneAll('KEY_ACCOUNT_MANAGER'),{ CRM: FULL, SD: FULL, WMS: READ, FI: LIMITED }, 'KEY_ACCOUNT_MANAGER'),
  ...override(noneAll('B2B_SALES_SPECIALIST'),{ CRM: FULL, SD: READ_PLUS }, 'B2B_SALES_SPECIALIST'),

  // ─── Marketing ───────────────────────────────────────────────────────
  ...override(noneAll('MARKETING_SPECIALIST'),{ ECOMMERCE: FULL, CRM: READ, BI: READ }, 'MARKETING_SPECIALIST'),
  ...override(noneAll('SMM_SPECIALIST'),    { ECOMMERCE: FULL }, 'SMM_SPECIALIST'),
  ...override(noneAll('SEO_SPECIALIST'),    { ECOMMERCE: READ_PLUS, BI: READ }, 'SEO_SPECIALIST'),
  ...override(noneAll('CONTENT_MANAGER'),   { ECOMMERCE: FULL }, 'CONTENT_MANAGER'),
  ...override(noneAll('COPYWRITER'),        { ECOMMERCE: READ_PLUS }, 'COPYWRITER'),

  // ─── Design / Tech ───────────────────────────────────────────────────
  ...override(noneAll('DESIGNER'),          { DESIGN: FULL, SD: READ, PP: READ }, 'DESIGNER'),
  ...override(noneAll('SENIOR_DESIGNER'),   { DESIGN: FULL, SD: READ, PP: READ }, 'SENIOR_DESIGNER'),
  ...override(noneAll('PREPRESS_SPECIALIST'),{ DESIGN: FULL, PP: READ }, 'PREPRESS_SPECIALIST'),
  ...override(noneAll('TECHNOLOGIST'),      { PP: FULL, MM: READ, QC: READ_PLUS }, 'TECHNOLOGIST'),
  ...override(noneAll('SENIOR_TECHNOLOGIST'),{ PP: FULL, MM: READ, QC: READ_PLUS }, 'SENIOR_TECHNOLOGIST'),
  ...override(noneAll('PLANNING_SPECIALIST'),{ PP: FULL, MM: READ, WMS: READ }, 'PLANNING_SPECIALIST'),
  ...override(noneAll('PRODUCTION_DISPATCHER'),{ PP: READ_PLUS, WMS: READ, QC: READ }, 'PRODUCTION_DISPATCHER'),

  // ─── Finance ─────────────────────────────────────────────────────────
  ...override(noneAll('ACCOUNTANT'),        { FI: FULL, SD: READ, WMS: READ }, 'ACCOUNTANT'),
  ...override(noneAll('SENIOR_ACCOUNTANT'), { FI: FULL, SD: READ, WMS: READ, HR: READ }, 'SENIOR_ACCOUNTANT'),
  ...override(noneAll('CASHIER'),           { FI: LIMITED }, 'CASHIER'),
  ...override(noneAll('FINANCIAL_ANALYST'), { FI: READ_PLUS, BI: READ_PLUS }, 'FINANCIAL_ANALYST'),
  ...override(noneAll('PAYROLL_SPECIALIST'),{ FI: FULL, HR: READ }, 'PAYROLL_SPECIALIST'),
  ...override(noneAll('ECONOMIST'),         { FI: READ, PP: READ, SD: READ, BI: READ }, 'ECONOMIST'),

  // ─── HR / LMS / HSE ──────────────────────────────────────────────────
  ...override(noneAll('HR_SPECIALIST'),     { HR: FULL, LMS: READ_PLUS, MDM: READ }, 'HR_SPECIALIST'),
  ...override(noneAll('RECRUITER'),         { HR: LIMITED }, 'RECRUITER'),
  ...override(noneAll('TRAINING_SPECIALIST'),{ LMS: FULL, HR: READ }, 'TRAINING_SPECIALIST'),
  ...override(noneAll('LMS_COORDINATOR'),   { LMS: FULL, HR: READ }, 'LMS_COORDINATOR'),
  ...override(noneAll('HSE_SPECIALIST'),    { HR: FULL, QC: READ }, 'HSE_SPECIALIST'),

  // ─── QC ───────────────────────────────────────────────────────────────
  ...override(noneAll('QC_INSPECTOR'),      { QC: FULL, PP: READ, MM: READ }, 'QC_INSPECTOR'),
  ...override(noneAll('QC_LAB_SPECIALIST'), { QC: LIMITED }, 'QC_LAB_SPECIALIST'),
  ...override(noneAll('QC_AUDITOR'),        { QC: READ_PLUS, MM: READ, PP: READ }, 'QC_AUDITOR'),

  // ─── Supply / Logistics ──────────────────────────────────────────────
  ...override(noneAll('SUPPLY_SPECIALIST'), { MM: FULL, WMS: READ }, 'SUPPLY_SPECIALIST'),
  ...override(noneAll('LOGISTICS_COORDINATOR'),{ LOGISTICS: FULL, SD: READ }, 'LOGISTICS_COORDINATOR'),
  ...override(noneAll('CUSTOMS_BROKER'),    { LOGISTICS: READ_PLUS, MM: READ }, 'CUSTOMS_BROKER'),

  // ─── IT / PR ─────────────────────────────────────────────────────────
  ...override(readAll('IT_SPECIALIST'),     { MDM: FULL }, 'IT_SPECIALIST'),
  ...override(readAll('SYSTEM_ADMIN'),      { MDM: FULL }, 'SYSTEM_ADMIN'),
  ...override(noneAll('PR_SPECIALIST'),     { ECOMMERCE: FULL, CRM: READ }, 'PR_SPECIALIST'),

  // ─── Office ──────────────────────────────────────────────────────────
  ...override(noneAll('OFFICE_MANAGER'),    { HR: READ, ECOMMERCE: READ }, 'OFFICE_MANAGER'),
  ...override(noneAll('SECRETARY'),         { CRM: READ, SD: READ }, 'SECRETARY'),
  ...override(noneAll('LAWYER'),            { CRM: READ, SD: READ, MM: READ, FI: READ, HR: READ }, 'LAWYER'),

  // ─── Operatorlar (LIMITED — faqat o'z vazifalari) ─────────────────────
  ...override(noneAll('WAREHOUSE_KEEPER'),       { WMS: FULL, POS: FULL, MM: READ }, 'WAREHOUSE_KEEPER'),
  ...override(noneAll('SENIOR_WAREHOUSE_KEEPER'),{ WMS: FULL, POS: FULL, MM: READ }, 'SENIOR_WAREHOUSE_KEEPER'),
  ...override(noneAll('FORKLIFT_OPERATOR'),      { WMS: LIMITED, POS: LIMITED }, 'FORKLIFT_OPERATOR'),
  ...override(noneAll('PICKER'),                 { WMS: LIMITED, POS: LIMITED }, 'PICKER'),

  ...override(noneAll('FLEXO_OPERATOR'),       { PP: LIMITED }, 'FLEXO_OPERATOR'),
  ...override(noneAll('CORRUGATOR_OPERATOR'),  { PP: LIMITED }, 'CORRUGATOR_OPERATOR'),
  ...override(noneAll('STITCHER_OPERATOR'),    { PP: LIMITED }, 'STITCHER_OPERATOR'),
  ...override(noneAll('DIE_CUT_OPERATOR'),     { PP: LIMITED }, 'DIE_CUT_OPERATOR'),
  ...override(noneAll('FOLDER_GLUER_OPERATOR'),{ PP: LIMITED }, 'FOLDER_GLUER_OPERATOR'),
  ...override(noneAll('OFFSET_OPERATOR'),      { PP: LIMITED }, 'OFFSET_OPERATOR'),
  ...override(noneAll('PRINTING_OPERATOR'),    { PP: LIMITED }, 'PRINTING_OPERATOR'),
  ...override(noneAll('LAMINATION_OPERATOR'),  { PP: LIMITED }, 'LAMINATION_OPERATOR'),
  ...override(noneAll('VARNISH_OPERATOR'),     { PP: LIMITED }, 'VARNISH_OPERATOR'),
  ...override(noneAll('CUTTING_OPERATOR'),     { PP: LIMITED }, 'CUTTING_OPERATOR'),
  ...override(noneAll('PACKING_OPERATOR'),     { PP: LIMITED }, 'PACKING_OPERATOR'),

  ...override(noneAll('DRIVER'),             { LOGISTICS: LIMITED }, 'DRIVER'),
  ...override(noneAll('DELIVERY_HELPER'),    { LOGISTICS: LIMITED }, 'DELIVERY_HELPER'),
  ...override(noneAll('LOADER'),             { WMS: LIMITED }, 'LOADER'),

  ...override(noneAll('MAINTENANCE_TECH'),     { PP: LIMITED }, 'MAINTENANCE_TECH'),
  ...override(noneAll('ELECTRICIAN'),          { PP: LIMITED }, 'ELECTRICIAN'),
  ...override(noneAll('MECHANIC'),             { PP: LIMITED }, 'MECHANIC'),
  ...override(noneAll('PRINT_MACHINE_HELPER'), { PP: LIMITED }, 'PRINT_MACHINE_HELPER'),

  ...noneAll('SECURITY_GUARD'),
  ...noneAll('CLEANER'),
  ...override(noneAll('CANTEEN_WORKER'),     { POS: LIMITED }, 'CANTEEN_WORKER'),
  ...override(noneAll('COOK'),               { POS: LIMITED }, 'COOK'),
  ...noneAll('GARDENER'),
  ...override(noneAll('COURIER'),            { LOGISTICS: LIMITED }, 'COURIER'),

  ...override(noneAll('QC_OPERATOR'),        { QC: LIMITED }, 'QC_OPERATOR'),
  ...override(noneAll('SAMPLING_OPERATOR'),  { QC: LIMITED }, 'SAMPLING_OPERATOR'),

  // ─── Smena boshliqlari ───────────────────────────────────────────────
  ...override(noneAll('FLEXO_SHIFT_LEADER'),  { PP: READ_PLUS, QC: READ }, 'FLEXO_SHIFT_LEADER'),
  ...override(noneAll('OFFSET_SHIFT_LEADER'), { PP: READ_PLUS, QC: READ }, 'OFFSET_SHIFT_LEADER'),
  ...override(noneAll('WAREHOUSE_SHIFT_LEADER'),{ WMS: READ_PLUS, POS: READ_PLUS }, 'WAREHOUSE_SHIFT_LEADER'),
];
