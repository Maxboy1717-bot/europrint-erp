/**
 * @module SummaryCards
 * @description React UI component.
 */

import { useGoodsReceivingTranslations } from "./useGoodsReceivingTranslations";

interface SummaryCardsProps {
  stats?: {
    todayReceipts: number;
    pendingQc: number;
    monthlyValue: number;
  };
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const t = useGoodsReceivingTranslations();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.todayReceipts}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats?.todayReceipts || 0}</p>
      </div>

      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.pendingQc}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{stats?.pendingQc || 0}</p>
      </div>

      <div className="bg-card rounded-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.monthlyValue}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground mt-1">
          {Number(stats?.monthlyValue || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
