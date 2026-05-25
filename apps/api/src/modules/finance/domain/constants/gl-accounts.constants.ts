/**
 * @module gl-accounts.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

// Buxgalteriya hisoblar rejasi (Chart of Accounts) — O'zbekiston BX standartlari bo'yicha
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
