/**
 * @module legacy.types
 * @description Type definitions for legacy.service.ts (split out per Rule 16).
 */

export type PapkaOrderUpdates = Partial<{
  papka_no: string;
  mijoz_nomi: string;
  mahsulot_nomi: string;
  mahsulot_turi: string | null;
  tiraj: number;
  list_soni: number | null;
  format_a: number | null;
  format_b: number | null;
  quantity: number;
  deadline: string | null;
  status: string;
  sana: string | null;
  tayyor_bolish_sanasi: string | null;
  notes: string | null;
}>;
