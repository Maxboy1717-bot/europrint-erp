/**
 * @module WarehouseStatsPanel
 * @description React UI component.
 */

import { Boxes, ShieldCheck, PackagePlus, AlertTriangle } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
interface WarehouseStatsProps {
  availableCount: number;
  qcHoldCount: number;
  pendingPickingCount: number;
  debtCount: number;
}

export function WarehouseStatsPanel({
  availableCount,
  qcHoldCount,
  pendingPickingCount,
  debtCount
}: WarehouseStatsProps) {
  const stats = [
    { label: "Mavjud", value: availableCount, icon: Boxes, color: "text-[var(--ep-green)]", bg: "bg-green-50", testId: "text-available-count" },
    { label: "QC kutish", value: qcHoldCount, icon: ShieldCheck, color: "text-[var(--ep-yellow)]", bg: "bg-amber-50", testId: "text-qchold-count" },
    { label: "Picking", value: pendingPickingCount, icon: PackagePlus, color: "text-[var(--ep-blue)]", bg: "bg-indigo-50", testId: "text-picking-count" },
    { label: tLabel('warehouse.WarehouseStatsPanel.tsx.qarzlar', "Qarzlar"), value: debtCount, icon: AlertTriangle, color: "text-[var(--ep-red)]", bg: "bg-red-50", testId: "text-debt-count" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {(Array.isArray(stats) ? stats : []).map(stat => (
        <div key={stat.label} className="bg-card rounded-lg p-5 border border-border shadow-sm flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="text-4xl font-bold tracking-tight text-foreground mt-1" data-testid={stat.testId}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
