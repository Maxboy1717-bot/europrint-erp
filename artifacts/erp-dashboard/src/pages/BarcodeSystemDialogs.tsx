/**
 * @module BarcodeSystemDialogs
 * @description Re-exports the dialog components used by BarcodeSystem so that
 * the main page file only needs one import path.
 *
 * The actual dialog implementations live in barcode/ — this module is a
 * thin facade that keeps BarcodeSystem.tsx under 300 lines without moving
 * the dialog source files (which would require updating other imports).
 */

export { BatchFormDialog, BatchViewDialog, PrintPreviewDialog } from "./barcode/BatchDialogs";
export { LabelPrintDialog } from "./barcode/LabelPrintDialog";
