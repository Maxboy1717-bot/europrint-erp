/**
 * @module WarehouseDashboardSections
 * @description Table panel components for WarehouseDashboard.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Layers,
  Package,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import type { CategoryStat, LowStockItem, PendingTransfer, RecentTx } from "./WarehouseDashboardTypes";
import { fmt } from "./WarehouseDashboardTypes";
import { KpiCard } from "./WarehouseDashboardDialogs";
import { useTranslation } from '@/lib/i18n';

export { KpiCard, WarehouseCard } from "./WarehouseDashboardDialogs";

export function LowStockPanel({ lowStock, isLoading }: { lowStock: LowStockItem[]; isLoading: boolean }) {
  const { t } = useTranslation("common");
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[var(--ep-red)]" />
            </div>
            <CardTitle className="text-sm font-bold">{t("kamStok")}</CardTitle>
          </div>
          {lowStock.length > 0 && <Badge className="bg-red-50 text-[var(--ep-red)] border-0 text-[11px]">{lowStock.length}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-2.5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />)}</div>
        ) : lowStock.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[var(--ep-green)]/40" />
            <p className="text-sm text-muted-foreground font-medium">{t("barchaMateriallarNormal")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("kamStokOgohlantirishlariYoq")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(lowStock) ? lowStock : []).slice(0, 6).map((item) => {
              const isZero = Number(item.currentStock) <= 0;
              return (
                <div key={item.id} className={cn("flex items-center gap-3 p-3 rounded-lg border", isZero ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200")}>
                  <div className={cn("w-2 h-8 rounded-full shrink-0", isZero ? "bg-red-500" : "bg-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.xomAshyo}</p>
                    <p className="text-[10px] text-muted-foreground">{item.kod}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-black", isZero ? "text-[var(--ep-red)]" : "text-[var(--ep-yellow)]")}>{item.currentStock ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">/{item.minStock}</p>
                  </div>
                </div>
              );
            })}
            {lowStock.length > 6 && <p className="text-xs text-center text-muted-foreground pt-1">+ yana {lowStock.length - 6} ta</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentTransactionsPanel({ txs, isLoading }: { txs: RecentTx[]; isLoading: boolean }) {
  const { t } = useTranslation("common");
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[var(--ep-blue)]" />
          </div>
          <CardTitle className="text-sm font-bold">{t("songgiHarakatlar1")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />)}</div>
        ) : txs.length === 0 ? (
          <div className="text-center py-10">
            <Activity className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground font-medium">{t("harakatlarYoq")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(txs) ? txs : []).map((tx) => {
              const isIn = tx.transactionType === "kirim";
              const isOut = tx.transactionType === "chiqim";
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isIn ? "bg-emerald-100" : isOut ? "bg-red-100" : "bg-blue-100")}>
                    {isIn ? <TrendingUp className="w-3.5 h-3.5 text-[var(--ep-green)]" /> {t("isout")}<TrendingDown className="w-3.5 h-3.5 text-[var(--ep-red)]" /> : <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--ep-blue)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{tx.materialName || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.transactionType} · {tx.transactionDate}</p>
                  </div>
                  <span className={cn("text-sm font-black shrink-0", isIn ? "text-[var(--ep-green)]" : isOut ? "text-[var(--ep-red)]" : "text-[var(--ep-blue)]")}>
                    {isIn ? "+" : isOut ? "-" : ""}{fmt(Number(tx.quantity))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PendingTransfersPanel({ pending, isLoading, onNavigate }: { pending: PendingTransfer[]; isLoading: boolean; onNavigate: (url: string) => void }) {
  const { t } = useTranslation("common");
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-[var(--ep-yellow)]" />
            </div>
            <CardTitle className="text-sm font-bold">{t("kutilayotganKochirishlar")}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-primary px-2 h-7" onClick={() => onNavigate("/wms/transfer")}>
            {t("Barchasi")}<ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 rounded-lg" />)}</div>
        ) : pending.length === 0 ? (
          <div className="text-center py-6">
            <PackageCheck className="w-8 h-8 mx-auto mb-2 text-[var(--ep-green)]/40" />
            <p className="text-xs text-muted-foreground">{t("barchaKochirishlarBajarilgan")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(pending) ? pending : []).map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{t.transferNumber}</p>
                  <p className="text-[10px] text-muted-foreground">{t.totalItems} ta pozitsiya</p>
                </div>
                <Badge className={cn("text-[10px] border-0", t.status === "pending" ? "bg-amber-100 text-[var(--ep-yellow)]" : "bg-blue-100 text-[var(--ep-blue)]")}>
                  {t.status === "pending" ? "Kutmoqda" : "Yo'lda"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryStatsPanel({ catStats, isLoading }: { catStats: CategoryStat[]; isLoading: boolean }) {
  const { t } = useTranslation("common");
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[var(--ep-purple)]" />
          </div>
          <CardTitle className="text-sm font-bold">{t("kategoriyalar")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-7 rounded-lg" />)}</div>
        ) : catStats.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">{t("kategoriyalarYoq")}</p>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(catStats) ? catStats : []).slice(0, 5).map((cat, i) => {
              const maxCount = Math.max(...(Array.isArray(catStats) ? catStats : []).map(c => Number(c.count)));
              const pct = maxCount > 0 ? Math.round((Number(cat.count) / maxCount) * 100) : 0;
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-red-500"];
              return (
                <div key={`k-${i}`} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-foreground truncate max-w-[140px]">{cat.category || "Boshqa"}</span>
                    <span className="text-muted-foreground font-bold">{cat.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiRow({
  kpis, isLoading,
}: {
  kpis: {
    totalWarehouses: number; totalMaterials: number; totalStockValue: number;
    lowStockCount: number; outOfStockCount: number; zoneCount: number; binCount: number;
    pendingTransfers: number; todayTransactionCount: number;
    monthlyInflow: number; monthlyOutflow: number;
    abcA: number; abcB: number; abcC: number;
  } | undefined;
  isLoading: boolean;
}) {
  const { t } = useTranslation("common");
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`k-${i}`} className="border border-border/60">
            <CardContent className="p-5">
              <Skeleton className="w-11 h-11 rounded-lg mb-3" />
              <Skeleton className="h-7 w-16 mb-1 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }
  return (
    <>
      <KpiCard icon={Warehouse} label={t("faolOmborlar")} value={kpis?.totalWarehouses ?? 0} bg="bg-blue-50" color="text-[var(--ep-blue)]" sub={`${kpis?.zoneCount ?? 0} zona · ${kpis?.binCount ?? 0} bin`} />
      <KpiCard icon={Package} label={t("jamiMateriallar")} value={kpis?.totalMaterials ?? 0} bg="bg-indigo-50" color="text-[var(--ep-blue)]" accent={kpis?.abcA ? `A:${kpis.abcA} B:${kpis.abcB} C:${kpis.abcC}` : undefined} />
      <KpiCard icon={Layers} label={t("stokQiymati")} value={`${fmt(kpis?.totalStockValue ?? 0)} UZS`} bg="bg-emerald-50" color="text-[var(--ep-green)]" sub={`Kirim: ${fmt(kpis?.monthlyInflow ?? 0)} · Chiqim: ${fmt(kpis?.monthlyOutflow ?? 0)}`} />
      <KpiCard icon={AlertTriangle} label={t("kamStok1")} value={kpis?.lowStockCount ?? 0} bg={kpis?.lowStockCount ? "bg-red-50" : "bg-slate-50"} color={kpis?.lowStockCount ? "text-[var(--ep-red)]" : "text-slate-400"} sub={kpis?.outOfStockCount ? `${kpis.outOfStockCount} ta nol stok` : "Hammasi normal"} />
      <KpiCard icon={ArrowRightLeft} label={t("kochirishlar")} value={kpis?.pendingTransfers ?? 0} bg={kpis?.pendingTransfers ? "bg-amber-50" : "bg-slate-50"} color={kpis?.pendingTransfers ? "text-[var(--ep-yellow)]" : "text-slate-400"} sub="Pending / in-transit" />
      <KpiCard icon={Activity} label={t("bugungiHarakatlar")} value={kpis?.todayTransactionCount ?? 0} bg="bg-purple-50" color="text-[var(--ep-purple)]" sub="Kirdi / chiqdi / ko'chirildi" />
    </>
  );
}
