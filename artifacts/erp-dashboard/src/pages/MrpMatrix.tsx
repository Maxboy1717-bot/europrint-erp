/**
 * @module MrpMatrix
 * @description React page component. Route-level UI.
 */

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Play, Package, AlertTriangle, CheckCircle2, TrendingDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EPPageHeader, EPStatusPill } from "@/components/ep";

interface MrpPeriod {
  period: number;
  grossReq: number;
  scheduledReceipts: number;
  projectedOnHand: number;
  netReq: number;
  plannedOrders: number;
}

interface MrpLine {
  itemId: string;
  itemName?: string;
  lotSizingMethod: string;
  eoq?: number;
  safetyStock: number;
  leadTimePeriods: number;
  periods: MrpPeriod[];
}

interface MrpResult {
  runId?: string;
  runAt?: string;
  method: string;
  horizon: number;
  lines: MrpLine[];
  summary?: {
    totalItems: number;
    itemsWithNetReq: number;
    totalPlannedOrders: number;
  };
}

const LOT_SIZING_METHODS = [
  { value: "L4L", label: "Lot-for-Lot (L4L)" },
  { value: "EOQ", label: "Economic Order Quantity (EOQ)" },
  { value: "POQ", label: "Periodic Order Quantity (POQ)" },
  { value: "WAGNER_WHITIN", label: "Wagner-Whitin (Optimal)" },
];

const HORIZONS = [4, 6, 8, 12];

export default function MrpMatrix() {
  const { t } = useTranslation('production');
  const { toast } = useToast();
  const [method, setMethod] = useState<string>("L4L");
  const [horizon, setHorizon] = useState<number>(6);
  const [result, setResult] = useState<MrpResult | null>(null);

  const runMrp = useMutation({
    mutationFn: () =>
      apiRequest<MrpResult>("POST", "/api/pp/mrp/run", {
        lotSizingMethod: method,
        horizonPeriods: horizon,
      }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: t('mrp_calculated'), description: `${data.lines?.length ?? 0} ${t('mrp_materialsProcessed')}` });
    },
    onError: () => toast({ title: t('error'), description: t('mrp_runError'), variant: "destructive" }),
  });

  const periods = result?.lines?.[0]?.periods?.map((_, i) => i + 1) ?? Array.from({ length: horizon }, (_, i) => i + 1);

  const totalPlanned = result?.lines?.reduce(
    (acc, l) => acc + l.periods.reduce((s, p) => s + (p.plannedOrders ?? 0), 0), 0
  ) ?? 0;
  const itemsWithReq = result?.lines?.filter(
    (l) => l.periods.some((p) => (p.netReq ?? 0) > 0)
  ).length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('mrp_title')}</b></>}
        title={t('mrp_title')}
        subtitle={t('mrp_description')}
        icon={<Package className="w-6 h-6"
      />}
      />

      {/* Controls */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">{t('mrp_lotSizingMethod')}</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-56 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOT_SIZING_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">{t('mrp_horizon')}</label>
              <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORIZONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => runMrp.mutate()}
              disabled={runMrp.isPending}
              className="gap-2"
            >
              {runMrp.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {t('mrp_run')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-[var(--ep-blue)]" />
                <div>
                  <p className="text-2xl font-bold">{result.lines?.length ?? 0}</p>
                  <p className="text-sm text-muted-foreground">{t('mrp_totalMaterials')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-[var(--ep-yellow)]" />
                <div>
                  <p className="text-2xl font-bold">{itemsWithReq}</p>
                  <p className="text-sm text-muted-foreground">{t('mrp_withNetReq')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[var(--ep-green)]" />
                <div>
                  <p className="text-2xl font-bold">{totalPlanned}</p>
                  <p className="text-sm text-muted-foreground">{t('mrp_plannedOrders')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MRP Matrix Table */}
      {runMrp.isPending && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
          </CardContent>
        </Card>
      )}

      {result && result.lines && result.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('mrp_matrix')} — {LOT_SIZING_METHODS.find((m) => m.value === result.method)?.label ?? result.method}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/40 transition-colors">
                  <TableHead className="sticky left-0 bg-muted/50 min-w-[140px]">{t('mrp_material')}</TableHead>
                  <TableHead className="min-w-[80px]">{t('mrp_ss')}</TableHead>
                  <TableHead className="min-w-[80px]">{t('mrp_method')}</TableHead>
                  {periods.map((p) => (
                    <TableHead key={p} className="text-center min-w-[80px]">D{p}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.lines.map((line) => (
                  <React.Fragment key={line.itemId}>
                    <TableRow className="border-t-2 border-border hover:bg-muted/40 transition-colors">
                      <TableCell className="sticky left-0 bg-background font-medium" rowSpan={4}>
                        <div>
                          <p className="font-semibold text-sm truncate max-w-[130px]">{line.itemName ?? line.itemId}</p>
                          <p className="text-xs text-muted-foreground">{t('mrp_lt', { periods: line.leadTimePeriods })}</p>
                        </div>
                      </TableCell>
                      <TableCell rowSpan={4}>
                        <Badge variant="outline" className="text-xs">{line.safetyStock}</Badge>
                      </TableCell>
                      <TableCell rowSpan={4}>
                        <EPStatusPill tone="neutral" className="text-xs">{line.lotSizingMethod}</EPStatusPill>
                      </TableCell>
                    </TableRow>
                    <TableRow className="text-xs hover:bg-muted/40 transition-colors">
                      {line.periods.map((p, pi) => (
                        <TableCell key={`${line.itemId}-demand-${pi}`} className="text-center text-muted-foreground">
                          <div className="text-[10px] text-muted-foreground/70">{t('mrp_demand')}</div>
                          <div>{p.grossReq > 0 ? p.grossReq : "—"}</div>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="text-xs bg-muted/20 hover:bg-muted/40 transition-colors">
                      {line.periods.map((p, pi) => (
                        <TableCell key={`${line.itemId}-balance-${pi}`} className="text-center">
                          <div className="text-[10px] text-muted-foreground/70">{t('mrp_balance')}</div>
                          <div className={p.projectedOnHand < 0 ? "text-destructive font-bold" : ""}>
                            {p.projectedOnHand}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="text-xs hover:bg-muted/40 transition-colors">
                      {line.periods.map((p, pi) => (
                        <TableCell key={`${line.itemId}-planned-${pi}`} className="text-center">
                          <div className="text-[10px] text-muted-foreground/70">{t('mrp_planned_short')}</div>
                          {p.plannedOrders > 0 ? (
                            <Badge className="text-[10px] px-1 py-0 bg-green-600 hover:bg-[var(--ep-green)]/90">
                              {p.plannedOrders}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!result && !runMrp.isPending && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <TrendingDown className="w-12 h-12 opacity-30" />
            <p className="text-base font-medium">{t('mrp_clickToRun')}</p>
            <p className="text-sm">{t('mrp_selectMethodMsg')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
