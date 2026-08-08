/**
 * @module PlanningBoardTypes
 * @description Shared types, interfaces, and constants for PlanningBoard.
 * No JSX — pure TypeScript.
 */

// Re-export shared planning domain types so consumers only need one import.
export type {
  PlanningOperation,
  PapkaOrder,
  PapkaOrdersResponse,
  Equipment,
  WorkCenter,
  ProductionPlanRow,
  ProductionFactRow,
  ScheduleEntry,
  MRPRun,
  MRPResult,
  PurchaseRequisition,
  Product,
} from "./planning/planning-types";

// ---------------------------------------------------------------------------
// Local filter / form state shapes
// ---------------------------------------------------------------------------

export interface PlanningFilters {
  papkaNo: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface PlanningRunForm {
  runName: string;
  planningHorizon: number;
  includeSafetyStock: boolean;
  description: string;
}

// ---------------------------------------------------------------------------
// CSV export helper (pure utility, no JSX)
// ---------------------------------------------------------------------------

export function exportOperationsCSV(
  operationsData: { operations?: Record<string, unknown>[]; items?: Record<string, unknown>[] } | undefined
) {
  const ops = operationsData?.operations || operationsData || [];
  const rows = (Array.isArray(ops) ? ops : []).map((o) =>
    [
      o["operationCode"],
      o["operationName"],
      o["plannedDate"],
      o["plannedStartTime"],
      o["plannedEndTime"],
      o["plannedQuantity"],
      o["status"],
    ].join(",")
  );
  const csv = ["Code,Name,Date,Start,End,Quantity,Status", ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "planning-operations.csv";
  a.click();
  URL.revokeObjectURL(url);
}
