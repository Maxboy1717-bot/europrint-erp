/**
 * @module useGofrConversion
 * @description Frontend helper for the Gofra/Sloy 3-formula conversion engine
 *   (kg ↔ m² ↔ list/sheet). Vision: CHAT-TARIXI-YANGI-2026-06-08.md §29
 *   ("kg ↔ list avtomatik", starred element).
 *
 *   Wraps the REAL backend endpoints (verified to exist — Qoida 18 FE↔BE contract):
 *     - GET  /api/pp/gofra/convert       — Formulas 1+2 (kg↔m²↔sheet)
 *     - POST /api/pp/gofra/grammage      — Formula 3 (corrugated grammage from layers)
 *     - GET  /api/pp/gofra/flute-types   — configurable take-up factors (master-data)
 *
 *   The take-up factors are master-data the owner edits; `takeUpFactor` may be null
 *   until measured — the engine then refuses that flute (warning surfaced by the caller).
 * @layer Frontend hook (shared by PP/SD/MES conversion UIs)
 */

import { useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export type GofraDirection =
  | "kg_to_m2"
  | "m2_to_kg"
  | "m2_to_sheets"
  | "sheets_to_m2"
  | "kg_to_sheets"
  | "sheets_to_kg";

/** Flute (to'lqin) codes mirrored from `pp_flute_types.code`. */
export type FluteType = "A" | "B" | "C" | "E" | "BC" | "EB" | "F";

export interface GofraConvertInput {
  direction: GofraDirection;
  inputValue: number;
  /** Required for any kg-involving direction (Formula 2). */
  grammageGsm?: number;
  /** Required for any sheet-involving direction (Formula 1). */
  sheetWidthMm?: number;
  sheetLengthMm?: number;
  /** Chiqindi foizi 0–100; omitted → 0%. */
  wastePct?: number;
}

export interface GofraConvertResult {
  direction: GofraDirection;
  inputValue: number;
  inputUnit: string;
  outputValue: number;
  outputUnit: string;
}

/** One corrugated layer for Formula 3 (grammage). */
export interface GofraLayer {
  role: "liner" | "flute";
  gsm: number;
  /** Required only for flute layers. */
  fluteType?: FluteType;
}

export interface FluteTypeRow {
  code: string;
  nameUz: string;
  nameRu: string | null;
  /** null = owner has not entered a measured value yet. */
  takeUpFactor: number | null;
  isActive: boolean;
}

/** Build the GET query string for /pp/gofra/convert from a typed input. */
function buildConvertUrl(input: GofraConvertInput): string {
  const p = new URLSearchParams();
  p.set("direction", input.direction);
  p.set("inputValue", String(input.inputValue));
  if (input.grammageGsm !== undefined) p.set("grammageGsm", String(input.grammageGsm));
  if (input.sheetWidthMm !== undefined) p.set("sheetWidthMm", String(input.sheetWidthMm));
  if (input.sheetLengthMm !== undefined) p.set("sheetLengthMm", String(input.sheetLengthMm));
  if (input.wastePct !== undefined) p.set("wastePct", String(input.wastePct));
  return `/api/pp/gofra/convert?${p.toString()}`;
}

export function useGofrConversion() {
  // Flute take-up factors (master-data, owner-editable). Cached — rarely changes.
  const fluteQuery = useQuery({
    queryKey: ["/api/pp/gofra/flute-types"],
    queryFn: () => apiRequest<FluteTypeRow[]>("GET", "/api/pp/gofra/flute-types"),
    staleTime: 10 * 60 * 1000,
  });

  // Formulas 1+2: kg ↔ m² ↔ sheet conversion.
  const convertMutation = useMutation({
    mutationFn: (input: GofraConvertInput) =>
      apiRequest<GofraConvertResult>("GET", buildConvertUrl(input)),
    onError: () =>
      toast({ title: "Konversiya xatoligi", variant: "destructive" }),
  });

  // Formula 3: corrugated grammage (g/m²) from layers.
  const grammageMutation = useMutation({
    mutationFn: (layers: GofraLayer[]) =>
      apiRequest<{ grammageGsm: number }>("POST", "/api/pp/gofra/grammage", { layers }),
    onError: () =>
      toast({ title: "Grammaj hisobi xatoligi", variant: "destructive" }),
  });

  const convert = useCallback(
    (input: GofraConvertInput) => convertMutation.mutateAsync(input),
    [convertMutation],
  );

  const computeGrammage = useCallback(
    (layers: GofraLayer[]) => grammageMutation.mutateAsync(layers),
    [grammageMutation],
  );

  const fluteTypes: FluteTypeRow[] = Array.isArray(fluteQuery.data) ? fluteQuery.data : [];

  return {
    convert,
    computeGrammage,
    fluteTypes,
    lastResult: convertMutation.data ?? null,
    lastGrammage: grammageMutation.data?.grammageGsm ?? null,
    isConverting: convertMutation.isPending,
    isComputingGrammage: grammageMutation.isPending,
    isFluteLoading: fluteQuery.isLoading,
  };
}
