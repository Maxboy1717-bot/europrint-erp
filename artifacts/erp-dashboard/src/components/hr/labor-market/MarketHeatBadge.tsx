/**
 * @module MarketHeatBadge
 * @description React UI component.
 */

import { TrendingUp } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export const HEAT_OPTIONS: { value: "hot" | "medium" | "cold"; label: string; color: string }[] = [
  { value: "hot",    label: tLabel('hr.MarketHeatBadge.tsx.qizginBozor', "Qizg'in bozor"),  color: "bg-red-500/15 text-red-400 border-red-500/40"     },
  { value: "medium", label: tLabel('hr.MarketHeatBadge.tsx.ortachaBozor', "O'rtacha bozor"), color: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  { value: "cold",   label: "Sovuq bozor",    color: "bg-blue-500/15 text-blue-400 border-blue-500/40"  },
];

export function MarketHeatBadge({ heat }: { heat: "hot" | "medium" | "cold" }) {
  const opt = HEAT_OPTIONS.find(h => h.value === heat) ?? HEAT_OPTIONS[1];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${opt.color}`}>
      <TrendingUp className="w-3 h-3" />
      {opt.label}
    </span>
  );
}
