/**
 * @module pos-operations.api
 * @description POS Monitor ombor operatsiyalari FE API klienti.
 * Kirim, chiqim, P2P qabul — ombor xodimi amaliy sahifasi uchun.
 * BE: /api/pos/operations/*
 */
import { apiRequest } from "@/lib/api-request";

export interface PosStockLine {
  id: number;
  materialId: number;
  kod: string | null;
  name: string;
  quantity: number;
  reserved: number;
  available: number;
  unit: string;
  lastUpdatedAt: string | null;
}

export interface PosWarehouseStock {
  warehouse: {
    id: number;
    code: string;
    name: string;
    type: string;
    location?: string;
  };
  typeConfig: {
    code: string;
    nameUz: string;
    needsQc: boolean;
    needsQuarantine: boolean;
    unitBasis: string;
    inboundFlow: string;
    outboundFlow: string;
  } | null;
  stock: PosStockLine[];
  lineCount: number;
  totalQuantity: number;
}

export interface PosIssueInput {
  materialId: number;
  quantity: number;
  unit?: string;
  reason?: string;
}

export interface PosOperationResult {
  warehouseId: number;
  materialId: number;
  issued?: number;
  received?: number;
  newQuantity: number;
  newAvailable: number;
  movementId: number | null;
}

const BASE = "/api/pos/operations";

export const posOperationsApi = {
  /** Bitta ombor joriy qoldig'i (material kartochka). */
  stock: (warehouseId: number | string) =>
    apiRequest<PosWarehouseStock>("GET", `${BASE}/warehouses/${warehouseId}/stock`),

  /** Material chiqim (ombor xodimi tomonidan). */
  issue: (warehouseId: number | string, body: PosIssueInput) =>
    apiRequest<PosOperationResult>("POST", `${BASE}/warehouses/${warehouseId}/issue`, body),

  /** Material kirim (ombor xodimi tomonidan qabul qilish). */
  receive: (warehouseId: number | string, body: PosIssueInput) =>
    apiRequest<PosOperationResult>("POST", `${BASE}/warehouses/${warehouseId}/receive`, body),

  /** Kutilayotgan P2P so'rovlar (filtr: warehouseType). */
  pendingP2P: (warehouseType?: string) =>
    apiRequest<Record<string, unknown>[]>(
      "GET",
      `${BASE}/p2p/pending${warehouseType ? `?warehouseType=${encodeURIComponent(warehouseType)}` : ""}`,
    ),

  /** P2P so'rovni qabul qilish (chek + podotchet). */
  receiveP2P: (
    requestId: number,
    body: { chekNumber?: string; chekAmount?: number; warehouseId?: string },
  ) =>
    apiRequest<Record<string, unknown>>("POST", `${BASE}/p2p/${requestId}/receive`, body),
};
