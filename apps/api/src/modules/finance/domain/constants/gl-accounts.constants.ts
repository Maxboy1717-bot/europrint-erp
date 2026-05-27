/**
 * @module gl-accounts.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

// Buxgalteriya hisoblar rejasi (Chart of Accounts) — O'zbekiston BX standartlari bo'yicha
/**
 * @deprecated Duplicate account codes exist in this constant (5000=CAPITAL+COGS;
 * 2200=SALES_TAX+DEDUCTIONS; 7000=MATERIAL+EMPLOYER). Use GL_ACCOUNTS_V2 for new code.
 */
export const GL = {
  CASH:                     '1000', // Kassa
  ACCOUNTS_RECEIVABLE:      '1100', // Debitorlik qarzlar
  ACCOUNTS_RECEIVABLE_TRADE:'1200', // Savdo debitorlari
  INVENTORY:                '1040', // Tovar-moddiy qiymatliklar
  FIXED_ASSETS:             '3000', // Asosiy vositalar
  ACCOUNTS_PAYABLE:         '4000', // Kreditorlik qarzlar
  INVENTORY_ADJ:            '2000', // Tovar va materiallar korreksiyasi
  SHORT_TERM_LOANS:         '4100', // Qisqa muddatli kreditlar
  CAPITAL:                  '5000', // Ustav kapitali
  COGS:                     '5000', // Ishlab chiqarish tanarchisi
  SALARY_EXPENSE:           '5100', // Mehnat haqi xarajatlari
  REVENUE:                  '6000', // Savdo tushumlari
  MATERIAL_EXPENSE:         '7000', // Moddiy xarajatlar
  LABOR_EXPENSE:            '7100', // Mehnat haqi xarajatlari
  EMPLOYER_CONTRIBUTION:    '7000', // Ish beruvchi badali
  SALES_TAX_PAYABLE:        '2200', // QQS to'lanishi lozim
  EMPLOYEE_DEDUCTIONS:      '2200', // Xodim ushlanmalari
  SALARY_PAYABLE:           '2500', // Mehnat haqi to'lanishi lozim
} as const;

/** Uzbekistan BHM-compliant unique account codes (v2 — no duplicate codes) */
export const GL_ACCOUNTS_V2 = {
  // Assets
  CASH:                '1010',
  BANK:                '1020',
  ACCOUNTS_RECEIVABLE: '1210',
  INVENTORY:           '1410',
  // Liabilities
  ACCOUNTS_PAYABLE:    '3110',
  SALES_TAX_PAYABLE:   '6410',  // was 2200 (duplicate with DEDUCTIONS)
  EMPLOYEE_DEDUCTIONS: '6520',  // was 2200 (duplicate with SALES_TAX)
  EMPLOYER_CONTRIB:    '6530',  // was 7000 (duplicate with MATERIAL_EXPENSE)
  // Equity
  CAPITAL:             '8400',  // was 5000 (duplicate with COGS)
  // Revenue
  REVENUE:             '9010',
  // Expenses
  COGS:                '9110',  // was 5000 (duplicate with CAPITAL)
  MATERIAL_EXPENSE:    '9400',  // was 7000 (duplicate with EMPLOYER_CONTRIB)
  PAYROLL_EXPENSE:     '9500',
} as const;
