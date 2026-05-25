/**
 * @module legacy.types
 * @description Type definitions for legacy.service.ts (split out per Rule 16).
 */

export type PapkaOrderUpdates = Partial<{
  mahsulot_nomi: string;
  quantity: number;
  deadline: string | null;
  status: string;
  notes: string | null;
}>;
