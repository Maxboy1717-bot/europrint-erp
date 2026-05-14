/**
 * @module use-wms
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useWarehouseDashboard() {
  return useQuery({ queryKey: ["/api/warehouse/dashboard/kpis"] });
}

export function useWarehouses() {
  return useQuery({ queryKey: ["/api/warehouse/warehouses"] });
}

export function useWarehouseStock(warehouseId?: string | number) {
  return useQuery({
    queryKey: ["/api/warehouse/stock", warehouseId],
    select: (data) => safeArray(data, "stock"),
  });
}

export function useWarehouseLots() {
  return useQuery({ queryKey: ["/api/warehouse/lots"] });
}

export function useWarehouseTransfers() {
  return useQuery({ queryKey: ["/api/warehouse/transfers"] });
}

export function useInternalRequests() {
  return useQuery({ queryKey: ["/api/warehouse/internal-requests"] });
}

export function useLowStockAlerts() {
  return useQuery({ queryKey: ["/api/wms/low-stock"] });
}

export function useWarehouseOccupancy() {
  return useQuery({
    queryKey: ["/api/warehouse/dashboard/warehouse-occupancy"],
  });
}

export function useGoodsReceipt() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/warehouse/goods-receipts", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/stock"] }),
  });
}

export function useGoodsIssue() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/wms/goods-issue", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/stock"] }),
  });
}

export function useBarcodeScan() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/wms/barcode/scan", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wms/stock"] });
      toast({ title: "Skanerlandi", description: "Tovar muvaffaqiyatli skanerlandi" });
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });
}

export function useCreateTransfer() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/warehouse/transfers", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/transfers"] }),
  });
}

export function useWmsStock(warehouseId?: string | number) {
  return useQuery({
    queryKey: ["/api/wms/stock", warehouseId ? { warehouseId } : undefined],
    select: (data) => safeArray(data, "stock"),
  });
}

export function useWmsStockItem(id: string | number) {
  return useQuery({
    queryKey: ["/api/wms/stock", String(id)],
    queryFn: () => apiRequest("GET", `/api/wms/stock/${id}`),
    enabled: !!id,
  });
}

export function useWmsFefoStock(materialId: string | number, warehouseId: string | number) {
  return useQuery({
    queryKey: ["/api/wms/stock/fefo", String(materialId), String(warehouseId)],
    queryFn: () => apiRequest("GET", `/api/wms/stock/fefo/${materialId}/${warehouseId}`),
    enabled: !!materialId && !!warehouseId,
  });
}

export function useWmsReplenishmentSuggestions(warehouseId?: string | number) {
  return useQuery({
    queryKey: ["/api/wms/suggestions", warehouseId ? { warehouseId } : undefined],
  });
}

export function useWmsTotalStats() {
  return useQuery({ queryKey: ["/api/wms/stats/total"] });
}

export function useGoodsReceiptList(status?: string) {
  return useQuery({
    queryKey: ["/api/warehouse/goods-receipts", status ? { status } : undefined],
  });
}

export function useGoodsReceiptStats() {
  return useQuery({ queryKey: ["/api/warehouse/goods-receipts/stats"] });
}

export function useGoodsReceiptLines(receiptId: string | number) {
  return useQuery({
    queryKey: ["/api/warehouse/goods-receipts", String(receiptId), "lines"],
    queryFn: () => apiRequest("GET", `/api/warehouse/goods-receipts/${receiptId}/lines`),
    enabled: !!receiptId,
  });
}

export function useCompleteGoodsReceipt() {
  return useMutation({
    mutationFn: (id: string | number) =>
      apiRequest("POST", `/api/warehouse/goods-receipts/${id}/complete`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/goods-receipts"] }),
  });
}

export function useInventoryMaterials(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["/api/inventory/materials", filters ?? undefined],
    select: (data) => safeArray(data, "items"),
  });
}

export function useMaterial360Card(id: string | number) {
  return useQuery({
    queryKey: ["/api/inventory/materials", String(id), "360-card"],
    queryFn: () => apiRequest("GET", `/api/inventory/materials/${id}/360-card`),
    enabled: !!id,
  });
}

export function useWarehouseRentalRecords(status?: string) {
  return useQuery({
    queryKey: ["/api/warehouse-rental/records", status ? { status } : undefined],
  });
}

export function useWarehouseRentalSummary() {
  return useQuery({ queryKey: ["/api/warehouse-rental/summary"] });
}

export function useWarehouseRentalSettings() {
  return useQuery({ queryKey: ["/api/warehouse-rental/settings"] });
}

export function useCloseRentalRecord() {
  return useMutation({
    mutationFn: (id: string | number) =>
      apiRequest("POST", `/api/warehouse-rental/records/${id}/close`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] }),
  });
}

export function useMarkRentalPaid() {
  return useMutation({
    mutationFn: ({ id, notes }: { id: string | number; notes?: string }) =>
      apiRequest("POST", `/api/warehouse-rental/records/${id}/mark-paid`, { notes }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/records"] }),
  });
}
