/**
 * @module BarcodeSystemTypes
 * @description Types, state shape and handler types for BarcodeSystem.
 * (Barcode domain types live in barcode/barcode-types — this file covers
 *  the page-level state interfaces used by BarcodeSystem and its sections.)
 */

import type { BatchData, MaterialCard, Warehouse, ScanResult, PrintData } from "./barcode/barcode-types";

export type { BatchData, MaterialCard, Warehouse, ScanResult, PrintData };

// ── Page-level state ──────────────────────────────────────────────────────────
export interface BatchFormState {
  batchNumber: string;
  materialCardId: string;
  warehouseId: string;
  quantity: number;
  remainingQuantity: number;
  unitCost: number;
  productionDate: string;
  expiryDate: string;
  supplierBatchNumber: string;
  qcStatus: string;
  status: string;
  notes: string;
}

export const DEFAULT_BATCH_FORM: BatchFormState = {
  batchNumber: "",
  materialCardId: "",
  warehouseId: "",
  quantity: 0,
  remainingQuantity: 0,
  unitCost: 0,
  productionDate: "",
  expiryDate: "",
  supplierBatchNumber: "",
  qcStatus: "pending",
  status: "active",
  notes: "",
};

// ── Prop interfaces shared across sections ────────────────────────────────────
export interface BatchesTabProps {
  lang: "uz" | "ru";
  t: Record<string, unknown>;
  batches: BatchData[];
  batchesLoading: boolean;
  materials: MaterialCard[];
  warehousesList: Warehouse[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  materialFilter: string;
  onMaterialFilterChange: (v: string) => void;
  warehouseFilter: string;
  onWarehouseFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  selectedBatchesForBulk: string[];
  onToggleBulkSelection: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onCreateBatch: () => void;
  onEditBatch: (batch: BatchData) => void;
  onViewBatch: (batch: BatchData) => void;
  onPrintBatch: (id: string, type?: string) => void;
  onLabelPrint: (batch: BatchData) => void;
  onBulkGenerate: () => void;
  bulkGeneratePending: boolean;
}
