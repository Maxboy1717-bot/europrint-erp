/**
 * @module spreadsheetWorkbook
 * @description P1-7 multiple sheets ("varaqlar") for erp_spreadsheets — WITHOUT a schema change.
 * The `cells jsonb` column now holds a versioned workbook: { __v:2, order:[], active, sheets:{} }.
 * parseWorkbook is FULLY backward-compatible: an old flat `{ "A1": {...} }` value (v1) is read as a
 * single "Varaq 1" sheet, so every existing sheet keeps working. serializeWorkbook always writes v2.
 * Only ErpSpreadsheetEditor/SpreadsheetGrid touch cells; the grid still receives ONE flat Cells
 * (the active sheet), so nothing downstream needs to know about the wrapper.
 */

import type { Cells } from '@/lib/spreadsheet';

export interface Workbook {
  order: string[];              // sheet names, display order
  active: string;               // currently open sheet name
  sheets: Record<string, Cells>; // name -> cells
}

const V2 = 2;
const DEFAULT_NAME = 'Varaq 1';

function isCells(v: unknown): v is Cells {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Read persisted `cells` into a Workbook. Backward-compatible with v1 flat cells. */
export function parseWorkbook(raw: unknown): Workbook {
  const obj = isCells(raw) ? (raw as Record<string, unknown>) : {};
  if (obj.__v === V2 && isCells(obj.sheets)) {
    const sheets = obj.sheets as Record<string, Cells>;
    const names = Object.keys(sheets);
    if (!names.length) return { order: [DEFAULT_NAME], active: DEFAULT_NAME, sheets: { [DEFAULT_NAME]: {} } };
    const order = Array.isArray(obj.order)
      ? (obj.order as unknown[]).filter((n): n is string => typeof n === 'string' && n in sheets)
      : names;
    const finalOrder = order.length ? order : names;
    const active = typeof obj.active === 'string' && obj.active in sheets ? obj.active : finalOrder[0];
    return { order: finalOrder, active, sheets };
  }
  // v1 flat cells (or empty) -> single sheet
  return { order: [DEFAULT_NAME], active: DEFAULT_NAME, sheets: { [DEFAULT_NAME]: (raw as Cells) ?? {} } };
}

/** Write a Workbook back to the persisted (v2) shape. */
export function serializeWorkbook(wb: Workbook): Record<string, unknown> {
  return { __v: V2, order: wb.order, active: wb.active, sheets: wb.sheets };
}

/** A unique default sheet name given the existing ones (Varaq 1, Varaq 2, …). */
export function nextSheetName(existing: string[]): string {
  let i = existing.length + 1;
  let name = `Varaq ${i}`;
  const set = new Set(existing);
  while (set.has(name)) { i += 1; name = `Varaq ${i}`; }
  return name;
}
