/**
 * @module PosBarcPageTypes
 * @description Interfaces, types, and constants for PosBarcPage.
 */

export interface ScanResult {
  barcode?: string;
  material?: { id: number; name: string; code?: string; unit?: string };
  materialCard?: { id: number; name: string; code?: string };
  cached?: boolean;
  aiSuggestion?: string;
  found?: boolean;
}

export interface GenerateResult {
  barcode: string;
}

export interface HistoryEntry {
  barcode: string;
  name: string;
  ts: string;
}
