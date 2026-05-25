/**
 * @module label.types
 * @description Shared types for label printing (label.service + label-ext.service).
 *   Extracted to break the cyclic dependency.
 * @layer Types (POS)
 */

export type LabelFormat = 'ZPL' | 'EPL' | 'PDF';

export interface LabelData {
  materialId?: number;
  materialName: string;
  materialCode: string;
  barcode: string;
  batchNumber?: string;
  quantity?: number;
  unitOfMeasure?: string;
  productionDate?: string;
  expiryDate?: string;
  warehouseName?: string;
  date: string;
}

export interface PrinterConfig {
  id?: number;
  name?: string;
  ip: string;
  port: number;
  format: LabelFormat;
}

export interface LabelResult {
  format: LabelFormat;
  content: string | Buffer;
  sentToPrinter: boolean;
  printerIp?: string;
}
