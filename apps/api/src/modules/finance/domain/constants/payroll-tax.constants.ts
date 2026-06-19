/**
 * @module payroll-tax.constants
 * @description Configurable statutory-tax rates for Uzbekistan payroll
 *   computation (INPS income tax + JSHD/pension social contribution).
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM business.constants.ts
 *   business.constants.ts explicitly removed payroll-tax rates (see NOTE at
 *   line 123 of that file) because the main ERP payroll path is GROSS-ONLY
 *   (1C handles JSHD/INPS). This finance-module-specific constants file
 *   owns the rates for the NEW pure PayrollTaxService, which implements
 *   the "har so'm hisobli" vision-accurate tax calculator that lives *inside*
 *   the Finance module — not in the HR payroll-closure path.
 *
 * WHY RATES ARE NOT HARDCODED IN THE SERVICE
 *   1. Uzbek tax law changed: income-tax 12% → 15% → 12% (2020-2024).
 *   2. Employer vs. employee contribution split can be adjusted by owner
 *      (EP-FIN-008: thresholds configurable from screen without recompile).
 *   3. compute() accepts an `opts` override so callers can pass DB-driven
 *      rates without a code change — these constants are only the defaults.
 *
 * RATES (2024 baseline — O'zbekiston Soliq Kodeksi):
 *   Income tax (INPS):                12%  (Art. 366 Tax Code UZ)
 *   Employee social contribution JSHD: 1%  (Decree PQ-5416, 01.01.2024)
 *   Employer social contribution:      12%  (Decree PQ-5416 — employer side;
 *                                           NOT deducted from employee net;
 *                                           provided here for GL-posting reference)
 *
 * @see docs/audit/decisions/03-finance.md EP-FIN-056
 * @see apps/api/src/modules/finance/domain/services/payroll-tax.service.ts
 */

// ---------------------------------------------------------------------------
// EMPLOYEE deductions (reduce take-home net pay)
// ---------------------------------------------------------------------------

/**
 * Income tax rate — INPS (Jismoniy shaxslardan olinadigan daromad solig'i).
 * Applied to gross salary: incomeTax = gross × PAYROLL_TAX_INCOME_RATE.
 * Default: 12% (Art. 366, O'zbekiston Soliq Kodeksi, 2024 edition).
 */
export const PAYROLL_TAX_INCOME_RATE = 0.12;

/**
 * Employee pension / social contribution rate — JSHD (Jamg'arma pensiya
 * hisobvarag'iga ajratma, xodim hissasi).
 * Applied to gross salary: jshd = gross × PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE.
 * Default: 1% (Decree PQ-5416, effective 01.01.2024).
 */
export const PAYROLL_TAX_EMPLOYEE_SOCIAL_RATE = 0.01;

// ---------------------------------------------------------------------------
// EMPLOYER contributions (NOT deducted from employee net; for GL reference)
// ---------------------------------------------------------------------------

/**
 * Employer social contribution rate (ijtimoiy soliq — ESP).
 * This is an EMPLOYER cost — it is NOT deducted from employee net pay.
 * Provided here for reference / GL leg computation (GL account 9420).
 * Default: 12% (Decree PQ-5416, effective 01.01.2024).
 */
export const PAYROLL_TAX_EMPLOYER_SOCIAL_RATE = 0.12;

// ---------------------------------------------------------------------------
// Precision
// ---------------------------------------------------------------------------

/**
 * Rounding precision for monetary output (2 decimal places = tiyin).
 * Applied via `Math.round(value * 10^PRECISION) / 10^PRECISION`.
 */
export const PAYROLL_TAX_ROUND_PRECISION = 2;
