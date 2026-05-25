/**
 * @module WarehouseIntegrationsSections
 * @description PP and MM card components for WarehouseIntegrations.
 * FI/Reorder/Valuation components live in WarehouseIntegrationsSections2.tsx.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Factory, Truck, AlertTriangle, ArrowRightLeft, FileCheck, ClipboardList, ChevronRight } from "lucide-react";
import type { IntegrationSummary, PendingDelivery, ReorderSuggestion, StockValuation, TranslationSet, Lang } from "./WarehouseIntegrationsTypes";
import { getStatusColor } from "./WarehouseIntegrationsTypes";

// Re-exports from second section file
export { FiCard, ReorderCard, ValuationCard } from "./WarehouseIntegrationsSections2";

// ─── PP Card ──────────────────────────────────────────────────────────────────

interface PpCardProps {
  t: TranslationSet;
  lang: Lang;
  summary: IntegrationSummary | undefined;
  summaryLoading: boolean;
}

export function PpCard({ t, lang, summary, summaryLoading }: PpCardProps) {
  const { toast } = useToast();
  return (
    <Card className="from-green-900/30 to-green-950/30 border-green-700/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-green-400">
            <Factory className="h-5 w-5" />
            {t.pp.title}
          </CardTitle>
          {summaryLoading ? (
            <Skeleton className="h-6 w-12 rounded-lg" />
          ) : (
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">
              {summary?.pp?.ordersNeedingMaterials || 0}
            </Badge>
          )}
        </div>
        <CardDescription className="text-green-300/70">{t.pp.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.pp.ordersNeedingMaterials}</span>
          <span className="font-medium text-foreground">{summary?.pp?.ordersNeedingMaterials || 0}</span>
        </div>
        <Separator className="bg-green-700/30" />
        <div className="space-y-2">
          <Button
            variant="outline" size="sm"
            className="w-full justify-start border-green-700/50 hover:bg-green-900/30"
            data-testid="button-pp-reserve"
            onClick={() => toast({ title: t.pp.reserveMaterials, description: lang === "uz" ? "Material zaxiralash jarayoni boshlandi" : "Процесс резервирования материалов начат" })}
          >
            <ClipboardList className="h-4 w-4 mr-2 text-green-400" />
            {t.pp.reserveMaterials}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
          <Button
            variant="outline" size="sm"
            className="w-full justify-start border-green-700/50 hover:bg-green-900/30"
            data-testid="button-pp-issue"
            onClick={() => toast({ title: t.pp.issueMaterials, description: lang === "uz" ? "Ishlab chiqarishga berish jarayoni boshlandi" : "Процесс выдачи на производство начат" })}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2 text-green-400" />
            {t.pp.issueMaterials}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
          <Button
            variant="outline" size="sm"
            className="w-full justify-start border-green-700/50 hover:bg-green-900/30"
            data-testid="button-pp-receive"
            onClick={() => toast({ title: t.pp.receiveGoods, description: lang === "uz" ? "Tayyor mahsulot qabul qilish boshlandi" : "Приёмка готовой продукции начата" })}
          >
            <FileCheck className="h-4 w-4 mr-2 text-green-400" />
            {t.pp.receiveGoods}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MM Card ──────────────────────────────────────────────────────────────────

interface MmCardProps {
  t: TranslationSet;
  summary: IntegrationSummary | undefined;
  summaryLoading: boolean;
  pendingDeliveries: { pendingDeliveries: PendingDelivery[] } | undefined;
  pendingLoading: boolean;
  reorderData: { suggestions: ReorderSuggestion[]; criticalCount: number; highCount: number } | undefined;
}

export function MmCard({ t, summary, summaryLoading, pendingDeliveries, pendingLoading, reorderData }: MmCardProps) {
  return (
    <Card className="from-yellow-900/30 to-yellow-950/30 border-yellow-700/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-yellow-400">
            <Truck className="h-4 w-4" />
            {t.mm.title}
          </CardTitle>
          {summaryLoading ? (
            <Skeleton className="h-6 w-12 rounded-lg" />
          ) : (
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                {summary?.mm?.pendingDeliveries || 0}
              </Badge>
              {(summary?.mm?.lowStockAlerts || 0) > 0 && (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {summary?.mm?.lowStockAlerts}
                </Badge>
              )}
            </div>
          )}
        </div>
        <CardDescription className="text-yellow-300/70">{t.mm.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.mm.pendingDeliveries}</span>
          <span className="font-medium text-foreground">{pendingDeliveries?.pendingDeliveries?.length || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.mm.lowStockAlerts}</span>
          <span className="font-medium text-red-400">{reorderData?.criticalCount || 0}</span>
        </div>
        <Separator className="bg-yellow-700/30" />
        {pendingLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : (pendingDeliveries?.pendingDeliveries?.length || 0) > 0 ? (
          <ScrollArea className="h-[120px]">
            <div className="space-y-2 pr-3">
              {pendingDeliveries?.pendingDeliveries?.slice(0, 3).map((po) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between p-2 rounded-md bg-yellow-900/20 border border-yellow-700/30"
                  data-testid={`row-pending-po-${po.id}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{po.poNumber}</span>
                    <span className="text-xs text-muted-foreground">{po.vendorName}</span>
                  </div>
                  <Badge className={getStatusColor(po.status)} variant="outline">
                    {po.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t.mm.noPending}</p>
        )}
      </CardContent>
    </Card>
  );
}
