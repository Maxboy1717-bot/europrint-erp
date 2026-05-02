import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Warehouse, ScrollText, Boxes, Factory, Trash2,
  ShieldCheck, Wrench, Beaker, Settings, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ArrowRightLeft,
  RefreshCw, MapPin, TrendingUp, TrendingDown,
  ChevronRight, CheckCircle2, Clock, Layers,
  BarChart3, Activity, Zap, PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WarehouseStat {
  id: string; code: string; name: string; type: string; location: string | null; capacity: number | null; isActive: boolean;
  stats: { itemCount: number; totalQty: number; availableQty: number; reservedQty: number };
}
interface LowStockItem {
  id: number; kod: string; xomAshyo: string; currentStock: number | null; minStock: number | null; category: string | null;
}
interface RecentTx {
  id: number; materialName: string | null; materialCode: string | null; quantity: number;
  transactionType: string; transactionDate: string; createdAt: string;
}
interface PendingTransfer {
  id: number; transferNumber: string; status: string; totalItems: number; totalValue: number | null; createdAt: string;
}
interface CategoryStat {
  category: string | null; count: number; totalValue: number; totalStock: number;
}
interface DashboardData {
  kpis: {
    totalWarehouses: number; totalMaterials: number; totalStockValue: number;
    lowStockCount: number; outOfStockCount: number; zoneCount: number; binCount: number;
    pendingTransfers: number; todayTransactionCount: number;
    monthlyInflow: number; monthlyOutflow: number;
    abcA: number; abcB: number; abcC: number;
  };
  warehouses: WarehouseStat[];
  alerts: { lowStockItems: LowStockItem[] };
  recentTransactions: RecentTx[];
  pendingTransfers: PendingTransfer[];
  categoryStats: CategoryStat[];
  generatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WAREHOUSE_ICONS: Record<string, typeof Package> = {
  "RM-MAIN": Package, "RM-ROLLS": ScrollText, "FG-MAIN": Boxes,
  "WIP-MAIN": Factory, "SCRAP-MAIN": Trash2, "SCRAP": Trash2,
  "QC-HOLD": ShieldCheck, "TOOL-MAIN": Wrench, "MRO-MAIN": Wrench,
  "MRO-STORE": Beaker, "AUX-MAIN": Beaker,
};
const WAREHOUSE_GRADIENTS: Record<string, string> = {
  "RM-MAIN": "from-blue-500 to-blue-700",
  "RM-ROLLS": "from-indigo-500 to-indigo-700",
  "FG-MAIN": "from-emerald-500 to-emerald-700",
  "WIP-MAIN": "from-cyan-500 to-cyan-700",
  "SCRAP-MAIN": "from-red-500 to-red-700",
  "SCRAP": "from-red-400 to-red-600",
  "QC-HOLD": "from-orange-500 to-orange-700",
  "TOOL-MAIN": "from-yellow-500 to-yellow-700",
  "MRO-MAIN": "from-amber-500 to-amber-700",
  "MRO-STORE": "from-purple-500 to-purple-700",
};
const TYPE_LABELS: Record<string, string> = {
  raw_material: "Xom Ashyo", finished_goods: "Tayyor", wip: "Yarim Tayyor",
  scrap: "Brak", quarantine: "Karantin", tools: "Asbob", household_mro: "Xo'jalik", mro: "MRO",
};
const TYPE_COLORS: Record<string, string> = {
  raw_material: "bg-blue-100 text-blue-700", finished_goods: "bg-emerald-100 text-emerald-700",
  wip: "bg-cyan-100 text-cyan-700", scrap: "bg-red-100 text-red-700",
  quarantine: "bg-orange-100 text-orange-700", tools: "bg-yellow-100 text-yellow-700",
  household_mro: "bg-amber-100 text-amber-700", mro: "bg-purple-100 text-purple-700",
};

function fmt(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function KpiCard({
  icon: Icon, label, value, sub, trend, trendUp, color = "text-primary", bg = "bg-primary/10", accent,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean; color?: string; bg?: string; accent?: string;
}) {
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-md",
              trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            )}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
          {accent && <p className="text-[11px] font-medium text-primary mt-1">{accent}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function WarehouseCard({ wh, onClick }: { wh: WarehouseStat; onClick: () => void }) {
  const Icon = WAREHOUSE_ICONS[wh.code] || Warehouse;
  const grad = WAREHOUSE_GRADIENTS[wh.code] || "from-slate-500 to-slate-700";
  const fillPct = wh.capacity && wh.stats.totalQty > 0
    ? Math.min(100, Math.round((wh.stats.totalQty / Number(wh.capacity)) * 100))
    : 0;
  const typeLabel = TYPE_LABELS[wh.type || ""] || wh.type || "";
  const typeColor = TYPE_COLORS[wh.type || ""] || "bg-slate-100 text-slate-600";

  return (
    <div
      onClick={onClick}
      className="group relative bg-card border border-border/60 rounded-2xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-primary/4 group-hover:bg-primary/8 transition-colors" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform", grad)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className={cn("text-[10px] font-bold px-2", typeColor, "border-0")}>{typeLabel}</Badge>
            <span className={cn("w-2 h-2 rounded-full", wh.isActive ? "bg-emerald-500" : "bg-slate-400")} />
          </div>
        </div>

        <h3 className="font-bold text-[15px] text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
          {wh.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-4">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0">{wh.code}</Badge>
          {wh.location && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" />{wh.location}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">SKU</p>
            <p className="text-base font-black text-foreground">{wh.stats.itemCount}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Mavjud</p>
            <p className="text-base font-black text-emerald-600">{fmt(wh.stats.availableQty)}</p>
          </div>
        </div>

        {wh.capacity && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>To'lganlik</span>
              <span className="font-bold">{fillPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-orange-500" : "bg-emerald-500"
                )}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}

        {wh.stats.reservedQty > 0 && (
          <p className="text-[10px] text-amber-600 font-medium mt-2">
            {fmt(wh.stats.reservedQty)} rezervlangan
          </p>
        )}
      </div>
      <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WarehouseDashboard() {
  const [, navigate] = useLocation();

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery<DashboardData>({
    queryKey: ["/api/warehouse/dashboard"],
    refetchInterval: 60_000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const kpis = data?.kpis;
  const warehouses = data?.warehouses || [];
  const lowStock = data?.alerts?.lowStockItems || [];
  const txs = data?.recentTransactions || [];
  const pending = data?.pendingTransfers || [];
  const catStats = data?.categoryStats || [];

  return (
    <div className="flex-1 overflow-auto bg-background p-6 font-inter">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-medium">Real-vaqt monitoring</span>
            {lastUpdated && (
              <span className="text-[11px] text-muted-foreground">· {lastUpdated}</span>
            )}
          </div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">
            Ombor <span className="font-black text-primary">Boshqaruvi</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Barcha omborlar holati, zaxira va harakat nazorati
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Yangilash
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/wms/transfer")}
            className="gap-1.5 text-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Ko'chirish
          </Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`k-${i}`} className="border border-border/60">
              <CardContent className="p-5">
                <Skeleton className="w-11 h-11 rounded-xl mb-3" />
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KpiCard
              icon={Warehouse} label="Faol omborlar"
              value={kpis?.totalWarehouses ?? 0}
              bg="bg-blue-50" color="text-blue-600"
              sub={`${kpis?.zoneCount ?? 0} zona · ${kpis?.binCount ?? 0} bin`}
            />
            <KpiCard
              icon={Package} label="Jami materiallar"
              value={kpis?.totalMaterials ?? 0}
              bg="bg-indigo-50" color="text-indigo-600"
              accent={kpis?.abcA ? `A:${kpis.abcA} B:${kpis.abcB} C:${kpis.abcC}` : undefined}
            />
            <KpiCard
              icon={Layers} label="Stok qiymati"
              value={`${fmt(kpis?.totalStockValue ?? 0)} UZS`}
              bg="bg-emerald-50" color="text-emerald-600"
              sub={`Kirim: ${fmt(kpis?.monthlyInflow ?? 0)} · Chiqim: ${fmt(kpis?.monthlyOutflow ?? 0)}`}
            />
            <KpiCard
              icon={AlertTriangle} label="Kam stok"
              value={kpis?.lowStockCount ?? 0}
              bg={kpis?.lowStockCount ? "bg-red-50" : "bg-slate-50"}
              color={kpis?.lowStockCount ? "text-red-600" : "text-slate-400"}
              sub={kpis?.outOfStockCount ? `${kpis.outOfStockCount} ta nol stok` : "Hammasi normal"}
            />
            <KpiCard
              icon={ArrowRightLeft} label="Ko'chirishlar"
              value={kpis?.pendingTransfers ?? 0}
              bg={kpis?.pendingTransfers ? "bg-amber-50" : "bg-slate-50"}
              color={kpis?.pendingTransfers ? "text-amber-600" : "text-slate-400"}
              sub="Pending / in-transit"
            />
            <KpiCard
              icon={Activity} label="Bugungi harakatlar"
              value={kpis?.todayTransactionCount ?? 0}
              bg="bg-purple-50" color="text-purple-600"
              sub="Kirdi / chiqdi / ko'chirildi"
            />
          </>
        )}
      </div>

      {/* ── Warehouse Grid ── */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Omborlar Ro'yxati</p>
              <p className="text-xs text-muted-foreground">Bosing — batafsil ko'ring</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{warehouses.length} ta ombor</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={`k-${i}`} className="border border-border/60">
                <CardContent className="p-5">
                  <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-3" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <Warehouse className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">Faol omborlar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(Array.isArray(warehouses) ? warehouses : []).map((wh) => (
              <WarehouseCard
                key={wh.id}
                wh={wh}
                onClick={() => navigate(`/warehouse/hub/${wh.code}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Kam stok ogohlantirishlari */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <CardTitle className="text-sm font-bold">Kam Stok</CardTitle>
              </div>
              {lowStock.length > 0 && (
                <Badge className="bg-red-50 text-red-600 border-0 text-[11px]">{lowStock.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
                <p className="text-sm text-muted-foreground font-medium">Barcha materiallar normal</p>
                <p className="text-xs text-muted-foreground mt-1">Kam stok ogohlantirishlari yo'q</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(lowStock) ? lowStock : []).slice(0, 6).map((item) => {
                  const pct = item.minStock ? Math.round((Number(item.currentStock) / Number(item.minStock)) * 100) : 0;
                  const isZero = Number(item.currentStock) <= 0;
                  return (
                    <div key={item.id} className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isZero ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                    )}>
                      <div className={cn(
                        "w-2 h-8 rounded-full shrink-0",
                        isZero ? "bg-red-500" : "bg-amber-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{item.xomAshyo}</p>
                        <p className="text-[10px] text-muted-foreground">{item.kod}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-sm font-black", isZero ? "text-red-600" : "text-amber-600")}>
                          {item.currentStock ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">/{item.minStock}</p>
                      </div>
                    </div>
                  );
                })}
                {lowStock.length > 6 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    + yana {lowStock.length - 6} ta
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* So'nggi harakatlar */}
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold">So'nggi Harakatlar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 rounded-lg" />)}
              </div>
            ) : txs.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground font-medium">Harakatlar yo'q</p>
                <p className="text-xs text-muted-foreground mt-1">Hozircha kirim/chiqim qayd etilmagan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(txs) ? txs : []).map((tx) => {
                  const isIn = tx.transactionType === "kirim";
                  const isOut = tx.transactionType === "chiqim";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isIn ? "bg-emerald-100" : isOut ? "bg-red-100" : "bg-blue-100"
                      )}>
                        {isIn ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          : isOut ? <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                          : <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {tx.materialName || "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{tx.transactionType} · {tx.transactionDate}</p>
                      </div>
                      <span className={cn(
                        "text-sm font-black shrink-0",
                        isIn ? "text-emerald-600" : isOut ? "text-red-600" : "text-blue-600"
                      )}>
                        {isIn ? "+" : isOut ? "-" : ""}{fmt(Number(tx.quantity))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kutilayotgan ko'chirishlar + Kategoriyalar */}
        <div className="space-y-4">
          {/* Pending transfers */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-bold">Kutilayotgan Ko'chirishlar</CardTitle>
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-xs text-primary px-2 h-7"
                  onClick={() => navigate("/wms/transfer")}
                >
                  Barchasi <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 rounded-lg" />)}
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-6">
                  <PackageCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
                  <p className="text-xs text-muted-foreground">Barcha ko'chirishlar bajarilgan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(pending) ? pending : []).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground">{t.transferNumber}</p>
                        <p className="text-[10px] text-muted-foreground">{t.totalItems} ta pozitsiya</p>
                      </div>
                      <Badge className={cn(
                        "text-[10px] border-0",
                        t.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {t.status === "pending" ? "Kutmoqda" : "Yo'lda"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category stats */}
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-bold">Kategoriyalar</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-7 rounded-md" />)}
                </div>
              ) : catStats.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Kategoriyalar yo'q</p>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(catStats) ? catStats : []).slice(0, 5).map((cat, i) => {
                    const maxCount = Math.max(...(catStats ?? []).map(c => Number(c.count)));
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
        </div>
      </div>

      {/* Quick links bar */}
      <div className="mt-6 pt-5 border-t border-border/60">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Tezkor havolalar</p>
        <div className="flex flex-wrap gap-2">
          {([
            { label: "Qabul Akti (GRN)", url: "/wms/grn", icon: PackageCheck },
            { label: "Inventarizatsiya", url: "/wms/inventory", icon: BarChart3 },
            { label: "Ko'chirish", url: "/wms/transfer", icon: ArrowRightLeft },
            { label: "Ichki So'rov", url: "/wms/internal-requests", icon: Zap },
            { label: "Lot Traceability", url: "/wms/lot-traceability", icon: Activity },
            { label: "Ombor KPI", url: "/wms/kpi", icon: TrendingUp },
          ]).map((link) => (
            <Button
              key={link.url}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => navigate(link.url)}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
