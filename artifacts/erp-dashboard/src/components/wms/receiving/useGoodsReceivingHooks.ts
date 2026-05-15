/**
 * @module useGoodsReceivingHooks
 * @description React UI component.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";
import {
  GoodsReceipt,
  Vendor,
  Warehouse,
  MaterialCard,
  WarehouseBin,
} from "./types";

export function useGoodsReceivingData(statusFilter: string, dateFrom: string, dateTo: string) {
  return useQuery<GoodsReceipt[]>({
    queryKey: ["/api/warehouse/goods-receipts", statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await apiRequest('GET', `/api/warehouse/goods-receipts?${params.toString()}`) as unknown as Response;
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useGoodsReceivingMutations(refetchDetail?: () => void) {
  const { toast } = useToast();
  const t = useGoodsReceivingTranslations();

  const createReceiptMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/warehouse/goods-receipts", data);
    },
    onSuccess: () => {
      toast({ title: t.receiptCreated });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/goods-receipts"] });
    },
    onError: (error: Error) => {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    },
  });

  const addLineMutation = useMutation({
    mutationFn: async ({ receiptId, data }: { receiptId: string; data: Record<string, unknown> }) => {
      return apiRequest("POST", `/api/warehouse/goods-receipts/${receiptId}/lines`, data);
    },
    onSuccess: () => {
      toast({ title: t.lineAdded });
      refetchDetail?.();
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/goods-receipts"] });
    },
    onError: (error: Error) => {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    },
  });

  const updateQcMutation = useMutation({
    mutationFn: async ({ lineId, data }: { lineId: string; data: Record<string, unknown> }) => {
      return apiRequest("POST", `/api/warehouse/goods-receipts/lines/${lineId}/qc`, data);
    },
    onSuccess: () => {
      toast({ title: t.qcUpdated });
      refetchDetail?.();
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/goods-receipts"] });
    },
    onError: (error: Error) => {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    },
  });

  const completeReceiptMutation = useMutation({
    mutationFn: async (receiptId: string) => {
      return apiRequest("POST", `/api/warehouse/goods-receipts/${receiptId}/complete`);
    },
    onSuccess: () => {
      toast({ title: t.receiptCompleted });
      refetchDetail?.();
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/goods-receipts"] });
    },
    onError: (error: Error) => {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    },
  });

  return {
    createReceiptMutation,
    addLineMutation,
    updateQcMutation,
    completeReceiptMutation,
  };
}

export function useGoodsReceivingLookups() {
  const stats = useQuery<{
    todayReceipts: number;
    pendingQc: number;
    monthlyValue: number;
  }>({
    queryKey: ["/api/warehouse/goods-receipts/stats"],
  });

  const vendors = useQuery<Vendor[]>({
    queryKey: ["/api/mm/vendors"],
  });

  const warehouses = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const materials = useQuery<MaterialCard[]>({
    queryKey: ["/api/warehouse/materials"],
  });

  const bins = useQuery<WarehouseBin[]>({
    queryKey: ["/api/warehouse/bins"],
  });

  return { stats, vendors, warehouses, materials, bins };
}
