/**
 * @module finance
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const financeApi = {
  createGlDocument: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/accounting/gl-documents", data),

  postSalesInvoice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/gl/post-sales-invoice", data),
  postPayroll: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/gl/post-payroll", data),

  createInvoice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/invoices/create", data),
  postInvoice: (invoiceId: number | string) =>
    apiRequest("POST", `/api/finance/invoices/${invoiceId}/post`),

  recordPayment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/payments/record", data),
  verifyPayment: (paymentId: number | string) =>
    apiRequest("POST", `/api/finance/payments/${paymentId}/verify`),

  requestAdvance: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/advances/request", data),
  overrideAdvance: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/advances/override", data),

  createBudget: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/budgets", data),
  submitBudget: (id: number | string) =>
    apiRequest("PATCH", `/api/finance/budgets/${id}/submit`),
  approveBudget: (id: number | string, note?: string) =>
    apiRequest("PATCH", `/api/finance/budgets/${id}/approve`, { note }),

  createGlEntry: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/gl-entries", data),
  reverseGlEntry: (id: number | string, reason: string) =>
    apiRequest("POST", `/api/finance/gl-entries/${id}/reverse`, { reason }),

  createPaymentTransaction: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance/payments", data),

  createCostCenter: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/fi/cost-centers", data),
  updateCostCenter: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/fi/cost-centers/${id}`, data),
  deleteCostCenter: (id: number | string) =>
    apiRequest("DELETE", `/api/fi/cost-centers/${id}`),

  createProfitCenter: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/fi/profit-centers", data),
  updateProfitCenter: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/fi/profit-centers/${id}`, data),
  deleteProfitCenter: (id: number | string) =>
    apiRequest("DELETE", `/api/fi/profit-centers/${id}`),

  aiForecastCashflow: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/cashflow-forecast", data),
  aiBudgetVariance: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/budget-variance", data),
  aiClassifyInvoice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/classify-invoice", data),
  aiFraudRisk: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/ai/finance/fraud-risk", data),
  createAccountingPeriod: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/fi/accounting-periods", data),
  closeAccountingPeriod: (id: number | string) =>
    apiRequest("POST", `/api/fi/accounting-periods/${id}/close`),
  postGlDocument: (id: number | string) =>
    apiRequest("POST", `/api/fi/gl-documents/${id}/post`),
  createFiPayment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/fi/payments", data),
  createFinanceCategory: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance-extended/finance-categories", data),
  createIncomeExpense: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/finance-extended/income-expense", data),
  deleteFinanceCategory: (id: number | string) =>
    apiRequest("DELETE", `/api/finance-extended/finance-categories/${id}`),
  deleteIncomeExpense: (id: number | string) =>
    apiRequest("DELETE", `/api/finance-extended/income-expense/${id}`),
  updateFinanceCategory: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/finance-extended/finance-categories/${id}`, data),
  updateIncomeExpense: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/finance-extended/income-expense/${id}`, data),
  approvePayrollCalculation: (id: number | string) =>
    apiRequest("PATCH", `/api/finance-extended/payroll-calculations/${id}/approve`),
  approveFinancePayment: (id: number | string) =>
    apiRequest("POST", `/api/finance/payments/${id}/approve`),

};
