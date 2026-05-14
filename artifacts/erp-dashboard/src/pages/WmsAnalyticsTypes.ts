/**
 * @module WmsAnalyticsTypes
 * @description Types, interfaces, and data hooks for WmsAnalytics.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface TurnoverItem {
  materialId: number | string;
  materialName: string;
  unitOfMeasure?: string;
  inventoryTurnover: number;
  daysInventoryOutstanding: number;
  avgInventory: number;
  cogs: number;
  category?: string;
}

export interface DeadStockItem {
  materialId: number | string;
  materialName: string;
  currentStock: number;
  unitOfMeasure?: string;
  lastMovementDate?: string;
  daysSinceMovement: number;
  estimatedValue?: number;
}

export interface RopAlert {
  materialId: number | string;
  materialName: string;
  currentStock: number;
  reorderPoint: number;
  deficit: number;
  unitOfMeasure?: string;
  leadTimeDays?: number;
  hasOpenRequisition?: boolean;
}

export function useTurnover() {
  return useQuery<TurnoverItem[]>({
    queryKey: ["/api/wms/inventory-turnover"],
    queryFn: () => apiRequest<TurnoverItem[]>("GET", "/api/wms/inventory-turnover"),
    staleTime: 60_000,
  });
}

export function useDeadStock() {
  return useQuery<DeadStockItem[]>({
    queryKey: ["/api/wms/dead-stock"],
    queryFn: () => apiRequest<DeadStockItem[]>("GET", "/api/wms/dead-stock"),
    staleTime: 60_000,
  });
}

export function useRopAlerts() {
  return useQuery<RopAlert[]>({
    queryKey: ["/api/wms/rop-alerts"],
    queryFn: () => apiRequest<RopAlert[]>("GET", "/api/wms/rop-alerts"),
    staleTime: 60_000,
  });
}
