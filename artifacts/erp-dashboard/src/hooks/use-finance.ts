/**
 * @module use-finance
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useFinanceDashboard() {
  return useQuery({ queryKey: ["/api/finance/dashboard"] });
}

export function useBudgets(status?: string) {
  return useQuery({ queryKey: ["/api/finance/budgets", status] });
}

export function useGLEntries(period?: string) {
  return useQuery({ queryKey: ["/api/finance/gl-entries", period] });
}

export function useGLAccounts() {
  return useQuery({ queryKey: ["/api/finance/gl-accounts"] });
}

export function useInvoices(status?: string) {
  return useQuery({ queryKey: ["/api/finance/invoices", status] });
}

export function usePayments(status?: string) {
  return useQuery({ queryKey: ["/api/finance/payments", status] });
}

export function useCashFlow(period?: string) {
  return useQuery({ queryKey: ["/api/finance/cash-flow", period] });
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ["/api/finance/exchange-rates"],
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialReports() {
  return useQuery({ queryKey: ["/api/finance/reports"] });
}

export function useApproveBudget() {
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/finance/budgets/${id}/approve`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/finance/budgets"] }),
  });
}

export function useApprovePayment() {
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/finance/payments/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/dashboard"] });
    },
  });
}

export function useCreateInvoice() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/finance/invoices", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/finance/invoices"] }),
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/finance/payments", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] }),
  });
}
