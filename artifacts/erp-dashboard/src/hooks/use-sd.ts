/**
 * @module use-sd
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { invalidateOrderCascade } from "@/lib/cache-invalidation";

export function useSDDashboard() {
  return useQuery({ queryKey: ["/api/sd/dashboard/overview"] });
}

export function useSDOrders(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ["/api/sd/orders", filters] });
}

export function useSDOrder(id: string | number) {
  return useQuery({
    queryKey: ["/api/sd/orders", id],
    enabled: !!id,
  });
}

export function useSDCustomers(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ["/api/sd/customers", filters] });
}

export function useSDQuotations() {
  return useQuery({ queryKey: ["/api/sd/quotations"] });
}

export function useSDQuota() {
  return useQuery({ queryKey: ["/api/sd/dashboard/quota"] });
}

export function useSDDeliveries() {
  return useQuery({ queryKey: ["/api/sd/deliveries"] });
}

export function useSDDebitors() {
  return useQuery({ queryKey: ["/api/sd/debitors"] });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/sd/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/dashboard/overview"] });
    },
  });
}

export function useAdvanceOrderStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: string }) =>
      apiRequest("PATCH", `/api/sd/orders/${id}/status`, { status }),
    // Golden thread: advancing an order can spawn production_orders (PP) downstream,
    // so cascade-invalidate PP/MES/QC caches, not just SD (audit F22).
    onSuccess: () => invalidateOrderCascade(queryClient),
  });
}

export function useCreateQuotation() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/sd/quotations", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] }),
  });
}

export function useConvertQuotation() {
  return useMutation({
    mutationFn: (id: string | number) =>
      apiRequest("POST", `/api/sd/quotations/${id}/convert`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
    },
  });
}
