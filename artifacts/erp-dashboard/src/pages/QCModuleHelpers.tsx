/** @module QCModuleHelpers @description Pure helper functions for QC Module: badge renderers and input colour logic. */

import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { QcParameter } from "./QCModuleTypes";

// ─── Status badge ─────────────────────────────────────────────────────────────

/** Returns a coloured inline badge for a test overall-status string. */
export function useStatusBadge() {
  const { t: tCommon } = useTranslation("common");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit">
            <CheckCircle className="w-3 h-3 mr-1" />
            {tCommon("approved")}
          </span>
        );
      case "conditional":
        return (
          <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {tCommon("warning")}
          </span>
        );
      case "failed":
        return (
          <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit">
            <XCircle className="w-3 h-3 mr-1" />
            {tCommon("rejected")}
          </span>
        );
      case "rework":
        return (
          <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit">
            <RefreshCw className="w-3 h-3 mr-1" />
            REWORK
          </span>
        );
      case "scrap":
        return (
          <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center w-fit">
            <Trash2 className="w-3 h-3 mr-1" />
            SCRAP
          </span>
        );
      default:
        return (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">
            {tCommon("pending")}
          </span>
        );
    }
  };

  return { getStatusBadge };
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

/** Returns a coloured inline badge for an AI risk-level string. */
export function useRiskBadge() {
  const { t: tCommon } = useTranslation("common");

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return (
          <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">
            {tCommon("low")}
          </span>
        );
      case "medium":
        return (
          <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">
            {tCommon("medium")}
          </span>
        );
      case "high":
        return (
          <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">
            {tCommon("high")}
          </span>
        );
      default:
        return (
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit">
            {riskLevel}
          </span>
        );
    }
  };

  return { getRiskBadge };
}

// ─── Input colour ─────────────────────────────────────────────────────────────

/** Returns a Tailwind class string tinting an input based on whether its value
 *  is within the parameter's normal / warning ranges. */
export function getInputColor(param: QcParameter, value: number | undefined): string {
  if (value === undefined || value === 0) return "";
  if (param.minValue !== undefined && value < param.minValue)
    return "border-red-500 bg-red-50 dark:bg-red-950/20";
  if (param.maxValue !== undefined && value > param.maxValue)
    return "border-red-500 bg-red-50 dark:bg-red-950/20";
  if (param.warningMinValue !== undefined && value < param.warningMinValue)
    return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
  if (param.warningMaxValue !== undefined && value > param.warningMaxValue)
    return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
  return "border-green-500 bg-green-50 dark:bg-green-950/20";
}
