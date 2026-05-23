/**
 * @module financeNavI18n
 * @description Finance (tz10) sidebar i18n key maps.
 *
 * [2026-05-21 i18n Phase 3.2A] Auto-extracted from constants-finance.ts.
 * Pattern: hrNavI18n.ts + genericNavI18n.translateNavModule().
 *
 * Keylar 'navigation' namespace'da (locales/{uz,uz-cyr,ru}/navigation.json).
 */

/** Separator (UZ title — bo'sh URL'lik) → flat i18n key */
export const FINANCE_NAV_SECTION_KEYS: Record<string, string> = {
  'GL / IKKI YOQLAMA':  'finSectionGl',
  'HISOBOTLAR':         'finSectionReports',
  'DEBITOR / KREDITOR': 'finSectionArAp',
  'AVANS VA KASSA':     'finSectionCashAdvance',
  'POS TIZIMI':         'finSectionPos',
  'TANNARX':            'finSectionCosting',
  'SOLIQLAR':           'finSectionTaxes',
  'CFO BOSHQARUV':      'finSectionCfoControl',
};

/** Non-separator URL → flat i18n key */
export const FINANCE_NAV_URL_KEYS: Record<string, string> = {
  'cfo':                                 'finCfo',
  'cfo-dashboard':                       'finCfoDashboard',
  'ai/finance':                          'finAi',
  'finance-dashboard':                   'finChiefAccountant',
  'accounting/gl-documents':             'finGlDocuments',
  'accounting/chart-of-accounts':        'finChartOfAccounts',
  'accounting/period-closing':           'finPeriodClosing',
  'finance/cashflow':                    'finCashflow',
  'finance/budgets':                     'finBudgets',
  'finance/profitability':               'finProfitability',
  'finance/reports':                     'finReports',
  'accounting/ar':                       'finDebtors',
  'accounting/ap':                       'finCreditors',
  'finance/approval':                    'finApproval',
  'accounting/cash-register':            'finCashRegister',
  'accounting/income-expense':           'finIncomeExpense',
  'pos/dashboard':                       'finPosDashboard',
  'pos/inventory':                       'finPosInventory',
  'pos-monitor':                         'finPosMonitor',
  'accounting/payroll-automation':       'finPayroll',
  'finance/order-costing':               'finOrderCosting',
  'accounting/materials':                'finMaterials',
  'accounting/inventory-valuation':      'finInventoryValuation',
  'accounting/asset-management':         'finAssetManagement',
  'fi/cost-centers':                     'finCostCenters',
  'fi/transfer-pricing':                 'finTransferPricing',
  'fi/tax-management':                   'finTaxManagement',
  'fi/tax-calendar':                     'finTaxCalendar',
  'fi/audit-log':                        'finAuditLog',
  'fi/risk-ai':                          'finRiskAi',
};

/** group.title i18n key */
export const FINANCE_MODULE_TITLE_KEY = 'finModuleTitle';
