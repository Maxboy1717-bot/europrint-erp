/**
 * @module i-qc.repo
 * @description Domain repository contract for QC compute services
 *   (SPC, DPMO, spoilage, ink consumption, imposition). Keeps the domain
 *   layer DB-agnostic — concrete Drizzle implementation lives in
 *   `infrastructure/repositories/drizzle-qc.repo.ts`.
 *
 *   This interface is intentionally separate from `IQcRepository`
 *   (`application/repositories/qc.repository.ts`) which is the
 *   Inspection aggregate repo — different responsibility, different shape.
 */

export interface SpcReading {
  value:      number;
  measuredAt: Date | string;
}

export interface ProcessDpmoData {
  defects:      number;
  itemsChecked: number;
}

/** Per-stage FTQ aggregate row (09-qc #34) — one row per qc_inspections.stage. */
export interface StageFtqRow {
  stage:        string;
  itemsChecked: number;
  itemsPassed:  number;
  itemsFailed:  number;
}

export interface JobSpoilageRow {
  defectiveSheets: number;
  totalSheets:     number;
}

export interface JobCostRow {
  unitCost:    number;
  productName: string;
}

export interface InkInventoryRow {
  /** CMYK channel code — 'c' | 'm' | 'y' | 'k' (or empty for unmatched rows) */
  channel:       string;
  quantityGrams: number;
}

export interface ImpositionLayoutInsert {
  sheetWidth:    number;
  sheetHeight:   number;
  productCount:  number;
  sheetCount:    number;
  utilization:   number;
  placedCount:   number;
  unplacedCount: number;
  layoutJson:    string;
}

/**
 * Pure data-access contract for QC domain services. Methods MUST return
 * plain typed data shapes (no Drizzle/SQL leakage). Errors are reported
 * by throwing — service-layer error handling is unchanged.
 */
export interface IQcComputeRepository {
  /** SPC — last N measurements for a parameter, newest first. */
  findSpcReadings(parameterId: number, lastN: number): Promise<SpcReading[]>;

  /** DPMO — aggregate defects/items_checked for a production order. */
  findProcessDpmoData(processId: string): Promise<ProcessDpmoData>;

  /** FTQ (09-qc #34) — per-stage passed/checked aggregate; optional order filter. */
  findStageFtq(orderId: number | null): Promise<StageFtqRow[]>;

  /** Spoilage — aggregate defective/total sheets for a print job. */
  findJobSpoilageRow(jobId: string): Promise<JobSpoilageRow>;

  /** Spoilage — unit cost + product name lookup for derived print type. */
  findJobCostRow(jobId: string): Promise<JobCostRow | null>;

  /** Ink — current CMYK ink stock in grams keyed by channel ('c'|'m'|'y'|'k'). */
  findInkInventory(): Promise<InkInventoryRow[]>;

  /** Imposition — persist layout summary (SVG omitted from layout_json). */
  saveImpositionLayout(layout: ImpositionLayoutInsert): Promise<void>;
}

export const QC_COMPUTE_REPO = 'IQcComputeRepository';
