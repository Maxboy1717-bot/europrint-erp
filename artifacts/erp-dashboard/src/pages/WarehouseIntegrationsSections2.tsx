/**
 * @module WarehouseIntegrationsSections2
 * @description FI card, Reorder suggestions, and Stock valuation components for WarehouseIntegrations.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { DollarSign, AlertTriangle, ArrowRightLeft, Play, CheckCircle2, TrendingUp, ChevronRight } from "lucide-react";
import type { IntegrationSummary, ReorderSuggestion, StockValuation, TranslationSet, Lang } from "./WarehouseIntegrationsTypes";
import { getSeverityColor } from "./WarehouseIntegrationsTypes";

// ─── FI Card ──────────────────────────────────────────────────────────────────

interface FiCardProps {
  t: TranslationSet;
  lang: Lang;
  summary: IntegrationSummary | undefined;
  summaryLoading: boolean;
  valuationData: StockValuation | undefined;
  valuationLoading: boolean;
}

export function FiCard({ t, lang, summary, summaryLoading, valuationData, valuationLoading }: FiCardProps) {
  const { toast } = useToast();
  return (
    <Card className="from-blue-900/30 to-blue-950/30 border-blue-700/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2 text-blue-400">
            <DollarSign className="h-5 w-5" />
            {t.fi.title}
          </CardTitle>
          {summaryLoading ? (
            <Skeleton className="h-6 w-12 rounded-lg" />
          ) : (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/40">
              {summary?.fi?.recentTransactions || 0}
            </Badge>
          )}
        </div>
        <CardDescription className="text-blue-300/70">{t.fi.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.fi.totalValue}</span>
          {valuationLoading ? (
            <Skeleton className="h-4 w-24 rounded-lg" />
          ) : (
            <span className="font-medium text-foreground">{formatCurrency(valuationData?.totalValue || 0)}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.fi.valuationMethod}</span>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            {valuationData?.valuationMethod === "last_purchase" ? t.fi.fifo : t.fi.weightedAvg}
          </Badge>
        </div>
        <Separator className="bg-blue-700/30" />
        <div className="space-y-2">
          <Button
            variant="outline" size="sm"
            className="w-full justify-start border-blue-700/50 hover:bg-blue-900/30"
            data-testid="button-fi-valuation"
            onClick={() => toast({ title: t.fi.stockValuation, description: lang === "uz" ? `Umumiy qiymat: ${formatCurrency(valuationData?.totalValue || 0)}` : `Общая стоимость: ${formatCurrency(valuationData?.totalValue || 0)}` })}
          >
            <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
            {t.fi.stockValuation}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
          <Button
            variant="outline" size="sm"
            className="w-full justify-start border-blue-700/50 hover:bg-blue-900/30"
            data-testid="button-fi-post"
            onClick={() => toast({ title: t.fi.postMovements, description: lang === "uz" ? "Bosh kitobga o'tkazish boshlandi" : "Проводка в главную книгу начата" })}
          >
            <Play className="h-4 w-4 mr-2 text-blue-400" />
            {t.fi.postMovements}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
          <Button
            variant="outline" size="sm"
            className="w-full justify-start border-blue-700/50 hover:bg-blue-900/30"
            data-testid="button-fi-variance"
            onClick={() => toast({ title: t.fi.inventoryVariance, description: lang === "uz" ? "Inventarizatsiya farqlari tahlil qilinmoqda" : "Анализ расхождений инвентаризации" })}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2 text-blue-400" />
            {t.fi.inventoryVariance}
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Reorder Suggestions Card ─────────────────────────────────────────────────

interface ReorderCardProps {
  t: TranslationSet;
  lang: Lang;
  reorderData: { suggestions: ReorderSuggestion[]; criticalCount: number; highCount: number } | undefined;
  reorderLoading: boolean;
}

export function ReorderCard({ t, lang, reorderData, reorderLoading }: ReorderCardProps) {
  const { toast } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
          {t.mm.reorderSuggestions}
        </CardTitle>
        <CardDescription>
          {lang === "uz" ? "Minimal qoldiqdan kam bo'lgan materiallar" : "Материалы ниже минимального запаса"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reorderLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (reorderData?.suggestions?.length || 0) > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-3">
              {reorderData?.suggestions?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md bg-card border hover-elevate"
                  data-testid={`row-reorder-${item.id}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.xomAshyo}</span>
                      <Badge variant="outline" className={getSeverityColor(item.severity)}>
                        {item.severity === "critical" ? t.mm.critical : item.severity === "high" ? t.mm.high : t.mm.medium}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.kod} • {lang === "uz" ? "Qoldiq" : "Остаток"}: {item.currentStock} / {item.minStock} {item.unitOfMeasure}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {lang === "uz" ? "Tavsiya" : "Рекомендация"}: {item.suggestedQuantity} {item.unitOfMeasure}
                      </div>
                      <div className="text-xs text-muted-foreground">≈ {formatCurrency(item.estimatedCost)}</div>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="border-yellow-700/50 hover:bg-yellow-900/30"
                      data-testid={`button-create-po-${item.id}`}
                      onClick={() => toast({ title: t.mm.createPO, description: `${item.xomAshyo}: ${item.suggestedQuantity} ${item.unitOfMeasure} (≈ ${formatCurrency(item.estimatedCost)})` })}
                    >
                      {t.mm.createPO}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-[var(--ep-green)] mx-auto mb-3" />
            <p className="text-muted-foreground">{t.mm.noSuggestions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Stock Valuation Card ─────────────────────────────────────────────────────

interface ValuationCardProps {
  t: TranslationSet;
  lang: Lang;
  valuationData: StockValuation;
}

export function ValuationCard({ t, lang, valuationData }: ValuationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-[var(--ep-blue)]" />
          {t.fi.stockValuation}
        </CardTitle>
        <CardDescription>
          {lang === "uz" ? `Baholash sanasi: ${valuationData.valuationDate}` : `Дата оценки: ${valuationData.valuationDate}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-700/30">
            <div className="text-xs text-muted-foreground mb-1">{t.fi.totalValue}</div>
            <div className="text-xl font-semibold text-blue-400">{formatCurrency(valuationData.totalValue)}</div>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <div className="text-xs text-muted-foreground mb-1">
              {lang === "uz" ? "Jami pozitsiyalar" : "Всего позиций"}
            </div>
            <div className="text-xl font-semibold text-foreground">{valuationData.totalItems}</div>
          </div>
          {Object.entries(valuationData.byCategory || {}).slice(0, 2).map(([category, data]) => (
            <div key={category} className="p-4 rounded-lg bg-card border">
              <div className="text-xs text-muted-foreground mb-1">{category}</div>
              <div className="text-xl font-semibold text-foreground">{formatCurrency(data.totalValue)}</div>
              <div className="text-xs text-muted-foreground">{data.itemCount} {lang === "uz" ? "ta" : "шт."}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
