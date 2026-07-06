/**
 * @module gl-accounts.constants
 * @description Named-constant exports (business thresholds, enums, lookup tables).
 */

// Buxgalteriya hisoblar rejasi (Chart of Accounts) — O'zbekiston BHMS standartlari bo'yicha
/**
 * #10 FIN: FULL remap to the LIVE Uzbek BHMS chart of accounts (table `accounts`, 42 codes). Every code
 * here EXISTS in `accounts`, so the GL writer (resolveAccountIds) resolves each to the correct ledger
 * account. The old values were scrambled and posted to the WRONG accounts without erroring: REVENUE='6000'
 * was Kreditorlar (a liability), ACCOUNTS_PAYABLE='4000' was the same account as AR (Debitorlar),
 * COGS+CAPITAL='5000' was the Pul mablag'lari group, and SALES_TAX_PAYABLE='2200' did not exist at all
 * (→ honest Err, so sales-invoice postings failed). Aliases that legitimately share one live account:
 * MATERIAL_EXPENSE↔COGS (9100 tannarx) and LABOR_EXPENSE↔SALARY_EXPENSE (9410 ish haqi). The separate
 * gl_journal_entries ledger is intentionally left untouched (canonical money ledger = `entries`).
 */
export const GL = {
  CASH:                      '5010', // Kassa
  ACCOUNTS_RECEIVABLE:       '4000', // Mijozlardan olinadigan summalar (Debitorlar)
  ACCOUNTS_RECEIVABLE_TRADE: '4000', // Debitorlar
  INVENTORY:                 '1000', // Materiallar
  FIXED_ASSETS:              '0100', // Asosiy vositalar (boshlang'ich qiymati)
  ACCOUNTS_PAYABLE:          '6000', // Yetkazib beruvchilarga to'lovlar (Kreditorlar)
  INVENTORY_ADJ:             '2900', // Tovarlar (inventar)
  SHORT_TERM_LOANS:          '6810', // Qisqa muddatli kreditlar (banklar)
  CAPITAL:                   '8300', // Ustav kapitali
  COGS:                      '9100', // Sotilgan mahsulot tannarxi
  SALARY_EXPENSE:            '9410', // Ish haqi (asosiy)
  REVENUE:                   '9010', // Tayyor mahsulot sotuvidan tushum
  MATERIAL_EXPENSE:          '9100', // Sotilgan mahsulot tannarxi (alias of COGS — no distinct material-expense account)
  LABOR_EXPENSE:             '9410', // Ish haqi (asosiy) (alias of SALARY_EXPENSE)
  EMPLOYER_CONTRIBUTION:     '9420', // Ijtimoiy soliqlar (ESP)
  SALES_TAX_PAYABLE:         '6310', // QQS (qo'shilgan qiymat solig'i)
  EMPLOYEE_DEDUCTIONS:       '6520', // INPS, JSHD (ijtimoiy soliqlar)
  SALARY_PAYABLE:            '6710', // Xodimlarga ish haqi
  DEPRECIATION_EXPENSE:      '9430', // Amortizatsiya
  ACCUMULATED_DEPRECIATION:  '0200', // Asosiy vositalar amortizatsiyasi (contra-asset)
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
