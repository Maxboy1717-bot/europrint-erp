/**
 * @module WarehouseDashboardDialogs
 * @description KpiCard and WarehouseCard components for WarehouseDashboard.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight, ArrowUpRight, ChevronRight, MapPin,
  Package, Warehouse,
} from "lucide-react";
import type { WarehouseStat } from "./WarehouseDashboardTypes";
import { TYPE_COLORS, TYPE_LABELS, WAREHOUSE_GRADIENTS, fmt } from "./WarehouseDashboardTypes";
import { useTranslation } from '@/lib/i18n';

const WAREHOUSE_ICON_COMPONENTS: Record<string, React.ElementType> = {
  Package, ScrollText: Package, Boxes: Package, Factory: Package,
  Trash2: Package, ShieldCheck: Package, Wrench: Package, Beaker: Package, Warehouse,
};

function getWarehouseIcon(code: string): React.ElementType {
  const iconName: Record<string, string> = {
    "RM-MAIN": "Package", "RM-ROLLS": "ScrollText", "FG-MAIN": "Boxes",
    "WIP-MAIN": "Factory", "SCRAP-MAIN": "Trash2", "SCRAP": "Trash2",
    "QC-HOLD": "ShieldCheck", "TOOL-MAIN": "Wrench", "MRO-MAIN": "Wrench",
    "MRO-STORE": "Beaker", "AUX-MAIN": "Beaker",
  };
  return WAREHOUSE_ICON_COMPONENTS[iconName[code] || "Warehouse"] || Warehouse;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendUp,
  color = "text-primary",
  bg = "bg-primary/10",
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  bg?: string;
  accent?: string;
}) {
  const { t } = useTranslation("common");
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
              trendUp ? "bg-emerald-50 text-[var(--ep-green)]" : "bg-red-50 text-[var(--ep-red)]"
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

export function WarehouseCard({ wh, onClick }: { wh: WarehouseStat; onClick: () => void }) {
  const Icon = getWarehouseIcon(wh.code);
  const grad = WAREHOUSE_GRADIENTS[wh.code] || "";
  const fillPct = wh.capacity && wh.stats.totalQty > 0
    ? Math.min(100, Math.round((wh.stats.totalQty / Number(wh.capacity)) * 100))
    : 0;
  const typeLabel = TYPE_LABELS[wh.type || ""] || wh.type || "";
  const typeColor = TYPE_COLORS[wh.type || ""] || "bg-slate-100 text-slate-600";

  return (
    <div
      onClick={onClick}
      className="group relative bg-card border border-border/60 rounded-xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-primary/4 group-hover:bg-primary/8 transition-colors" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform", grad)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className={cn("text-[10px] font-bold px-2", typeColor, "border-0")}>{typeLabel}</Badge>
            <span className={cn("w-2 h-2 rounded-full", wh.isActive ? "bg-emerald-500" : "bg-slate-400")} />
          </div>
        </div>
        <h3 className="font-bold text-[15px] text-foreground group-hover:text-primary transition-colors leading-tight mb-1">{wh.name}</h3>
        <div className="flex items-center gap-1.5 mb-4">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0">{wh.code}</Badge>
          {wh.location && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" />{wh.location}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">SKU</p>
            <p className="text-base font-black text-foreground">{wh.stats.itemCount}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">{t("mavjud")}</p>
            <p className="text-base font-black text-[var(--ep-green)]">{fmt(wh.stats.availableQty)}</p>
          </div>
        </div>
        {wh.capacity && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{t("tolganlik")}</span>
              <span className="font-bold">{fillPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-orange-500" : "bg-emerald-500")}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}
        {wh.stats.reservedQty > 0 && (
          <p className="text-[10px] text-[var(--ep-yellow)] font-medium mt-2">{fmt(wh.stats.reservedQty)} rezervlangan</p>
        )}
      </div>
      <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </div>
  );
}
