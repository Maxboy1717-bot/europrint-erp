import { lazy } from "react";

const FinanceDashboard = lazy(() => import("@/pages/FinanceDashboard"));
const FinanceVariance = lazy(() => import("@/pages/FinanceVariance"));
const FinanceBreakEven = lazy(() => import("@/pages/FinanceBreakEven"));
const PricingTiers = lazy(() => import("@/pages/PricingTiers"));
const CFODashboard = lazy(() => import("@/pages/CFODashboard"));
const CashFlowManagement = lazy(() => import("@/pages/CashFlowManagement"));
const BudgetManagement = lazy(() => import("@/pages/BudgetManagement"));
const OrderCosting = lazy(() => import("@/pages/OrderCosting"));
const FinancialReports = lazy(() => import("@/pages/FinancialReports"));
const ProductProfitability = lazy(() => import("@/pages/ProductProfitability"));
const DailyKPIDashboard = lazy(() => import("@/pages/DailyKPIDashboard"));
const AccountsReceivable = lazy(() => import("@/pages/AccountsReceivable"));
const AccountsPayable = lazy(() => import("@/pages/AccountsPayable"));
const PayrollAutomation = lazy(() => import("@/pages/PayrollAutomation"));
const MaterialsAccounting = lazy(() => import("@/pages/MaterialsAccounting"));
const GLDocuments = lazy(() => import("@/pages/GLDocuments"));
const ChartOfAccounts = lazy(() => import("@/pages/ChartOfAccounts"));
const PeriodClosing = lazy(() => import("@/pages/PeriodClosing"));
const CashRegister = lazy(() => import("@/pages/CashRegister"));
const POSDashboard = lazy(() => import("@/pages/POSDashboard"));
const POSInventoryPage = lazy(() => import("@/pages/POSInventoryPage"));
const IncomeExpense = lazy(() => import("@/pages/IncomeExpense"));
const InventoryValuation = lazy(() => import("@/pages/InventoryValuation"));
const AssetManagement = lazy(() => import("@/pages/AssetManagement"));
const FinanceExtended = lazy(() => import("@/pages/FinanceExtended"));
const GLChartOfAccounts = lazy(() => import("@/pages/GLChartOfAccounts"));
const CfoConfigSettings = lazy(() => import("@/pages/CfoConfigSettings"));

export const FINANCE_ROUTES: [string, React.ComponentType][] = [
  ['/finance-dashboard',               FinanceDashboard],
  ['/cfo/dashboard',                   CFODashboard],
  ['/finance/cashflow',                CashFlowManagement],
  ['/finance/budgets',                 BudgetManagement],
  ['/finance/order-costing',           OrderCosting],
  ['/finance/reports',                 FinancialReports],
  ['/finance/profitability',           ProductProfitability],
  ['/finance/daily-kpi',               DailyKPIDashboard],
  ['/accounting/ar',                   AccountsReceivable],
  ['/accounting/ap',                   AccountsPayable],
  ['/accounting/payroll-automation',   PayrollAutomation],
  ['/accounting/materials',            MaterialsAccounting],
  ['/accounting/gl-documents',         GLDocuments],
  ['/accounting/chart-of-accounts',    ChartOfAccounts],
  ['/accounting/period-closing',       PeriodClosing],
  ['/accounting/cash-register',        CashRegister],
  ['/pos/dashboard',                   POSDashboard],
  ['/pos/inventory',                   POSInventoryPage],
  ['/accounting/income-expense',       IncomeExpense],
  ['/accounting/inventory-valuation',  InventoryValuation],
  ['/accounting/asset-management',     AssetManagement],
  ['/fi/cost-centers',                 FinanceExtended],
  ['/fi/transfer-pricing',             FinanceExtended],
  ['/fi/tax-management',               FinanceExtended],
  ['/fi/tax-calendar',                 FinanceExtended],
  ['/fi/audit-log',                    FinanceExtended],
  ['/fi/risk-ai',                      FinanceExtended],
  ['/finance/gl-chart-of-accounts',    GLChartOfAccounts],
  ['/cfo/config',                      CfoConfigSettings],
  ['/finance/variance',                FinanceVariance],
  ['/finance/break-even',              FinanceBreakEven],
  ['/finance/pricing-tiers',           PricingTiers],
];
