/**
 * @module use-mm
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";

export function useMMDashboard() {
  return useQuery({ queryKey: ["/api/mm/dashboard"] });
}

export function useMaterials(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["/api/mm/materials", filters],
    select: (data) => safeArray(data, "materials"),
  });
}

export function usePurchaseOrders(status?: string) {
  return useQuery({
    queryKey: ["/api/mm/purchase-orders", status ? { status } : undefined],
    select: (data) => safeArray(data, "orders"),
  });
}

export function useVendors() {
  return useQuery({ queryKey: ["/api/mm/vendors"] });
}

export function useVendorRatings() {
  return useQuery({ queryKey: ["/api/mm/vendor-ratings"] });
}

export function useGoodsReceipts() {
  return useQuery({ queryKey: ["/api/mm/goods-receipts"] });
}

export function useMRPResults() {
  return useQuery({ queryKey: ["/api/mm/mrp-results"] });
}

export function useCreatePurchaseOrder() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/mm/purchase-orders", data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/mm/purchase-orders"],
      }),
  });
}

export function useApprovePurchaseOrder() {
  return useMutation({
    mutationFn: (id: string | number) =>
      apiRequest("POST", `/api/mm/purchase-orders/${id}/approve`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/mm/purchase-orders"],
      }),
  });
}

export function useCreateVendor() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/mm/vendors", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendors"] }),
  });
}

export function useThreeWayMatch(poId: string | number) {
  return useQuery({
    queryKey: ["/api/mm/three-way-match", poId],
    queryFn: () => apiRequest("GET", `/api/mm/three-way-match/${poId}`),
    enabled: !!poId,
  });
}

export function useCurrencies() {
  return useQuery({ queryKey: ["/api/mm/currencies"] });
}

export function useSupplierPriceComparison(materialId?: string | number) {
  return useQuery({
    queryKey: ["/api/mm/suppliers/price-comparison", materialId ? { materialId } : undefined],
  });
}

export function useFleetVehicles() {
  return useQuery({ queryKey: ["/api/mm/fleet/vehicles"] });
}

export function useFleetFuelLogs(vehicleId?: string | number) {
  return useQuery({
    queryKey: ["/api/mm/fleet/fuel-logs", vehicleId ? { vehicleId } : undefined],
  });
}

export function useCreateFleetVehicle() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/mm/fleet/vehicles", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] }),
  });
}

export function useCreateFuelLog() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/mm/fleet/fuel-logs", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/fuel-logs"] }),
  });
}

export function useRunMrp() {
  return useMutation({
    mutationFn: () => apiRequest("POST", "/api/mm/mrp-run", {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/mm/mrp-results"] }),
  });
}

export function useSupplierPerformance() {
  return useQuery({ queryKey: ["/api/mm/supplier-performance"] });
}

export function useMaterialPriceHistory(id: string | number) {
  return useQuery({
    queryKey: ["/api/mm/materials", id, "price-history"],
    queryFn: () => apiRequest("GET", `/api/mm/materials/${id}/price-history`),
    enabled: !!id,
  });
}

export function useIotMaterialKits(status?: string) {
  return useQuery({
    queryKey: ["/api/iot-enhanced/material-kits", status ? { status } : undefined],
  });
}

export function useIotOrdersForKits(status?: string) {
  return useQuery({
    queryKey: ["/api/iot-enhanced/orders-for-kits", status ? { status } : undefined],
  });
}

export function useIotCalculateBom(orderId: string | number) {
  return useQuery({
    queryKey: ["/api/iot-enhanced/orders", String(orderId), "calculate-bom"],
    queryFn: () => apiRequest("GET", `/api/iot-enhanced/orders/${orderId}/calculate-bom`),
    enabled: !!orderId,
  });
}

export function useIotKitItems(kitId: string | number) {
  return useQuery({
    queryKey: ["/api/iot-enhanced/material-kits", String(kitId), "items"],
    queryFn: () => apiRequest("GET", `/api/iot-enhanced/material-kits/${kitId}/items`),
    enabled: !!kitId,
  });
}
