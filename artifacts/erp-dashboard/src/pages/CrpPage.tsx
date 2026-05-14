/**
 * @module CrpPage
 * @description React page component. Route-level UI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Factory, AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { EPPageHeader, EPStatusPill } from "@/components/ep";

interface WorkCenterLoad {
  workCenterId: number | string;
  workCenterName: string;
  requiredHours: number;
  availableHours: number;
  utilizationPct: number;
  isBottleneck: boolean;
  operations?: Array<{
    operationName: string;
    requiredHours: number;
  }>;
}

interface CrpResult {
  periodStart?: string;
  periodEnd?: string;
  workCenters: WorkCenterLoad[];
  bottleneckCount: number;
  avgUtilization: number;
}

interface UtilizationBarProps {
  pct: number;
  isBottleneck: boolean;
  labelBottleneck: string;
  labelHigh: string;
  labelNormal: string;
}

function UtilizationBar({ pct, isBottleneck, labelBottleneck, labelHigh, labelNormal }: UtilizationBarProps) {
  const clamped = Math.min(Math.max(pct, 0), 150);
  const color =
    isBottleneck
      ? "bg-destructive"
      : clamped > 80
      ? "bg-amber-500"
      : "bg-green-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>{pct.toFixed(1)}%</span>
        {isBottleneck && <span className="text-destructive font-semibold">{labelBottleneck}</span>}
        {!isBottleneck && pct > 80 && <span className="text-[var(--ep-yellow)] font-semibold">{labelHigh}</span>}
        {!isBottleneck && pct <= 80 && <span className="text-[var(--ep-green)]">{labelNormal}</span>}
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(clamped / 1.5, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function CrpPage() {
  const { t } = useTranslation('production');
  const { toast } = useToast();
  const [result, setResult] = useState<CrpResult | null>(null);

  const runCrp = useMutation({
    mutationFn: () => apiRequest<CrpResult>("GET", "/api/pp/crp"),
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: t('crp_calculated'),
        description: `${data.workCenters?.length ?? 0} ${t('crp_analyzed')}`,
      });
    },
    onError: () =>
      toast({ title: t('error'), description: t('crp_loadError'), variant: "destructive" }),
  });

  const bottlenecks = result?.workCenters?.filter((w) => w.isBottleneck) ?? [];
  const overloaded = result?.workCenters?.filter((w) => !w.isBottleneck && w.utilizationPct > 80) ?? [];
  const normal = result?.workCenters?.filter((w) => w.utilizationPct <= 80) ?? [];

  const sorted = [...(result?.workCenters ?? [])].sort((a, b) => b.utilizationPct - a.utilizationPct);

  return (
    <div className="flex flex-col gap-6 p-6">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t('crp_title')}</b></>}
        title={t('crp_title')}
        subtitle={t('crp_description')}
        icon={<Factory className="w-6 h-6"
      />}
      />

      <div className="flex justify-start">
        <Button onClick={() => runCrp.mutate()} disabled={runCrp.isPending} className="gap-2">
          {runCrp.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {t('crp_calculate')}
        </Button>
      </div>

      {/* Summary */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Factory className="w-8 h-8 text-[var(--ep-blue)]" />
                <div>
                  <p className="text-2xl font-bold">{result.workCenters?.length ?? 0}</p>
                  <p className="text-sm text-muted-foreground">{t('crp_totalCenters')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Gauge className="w-8 h-8 text-[var(--ep-purple)]" />
                <div>
                  <p className="text-2xl font-bold">{(result.avgUtilization ?? 0).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">{t('crp_avgLoad')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{bottlenecks.length}</p>
                  <p className="text-sm text-muted-foreground">{t('crp_bottlenecks')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[var(--ep-green)]" />
                <div>
                  <p className="text-2xl font-bold">{normal.length}</p>
                  <p className="text-sm text-muted-foreground">{t('crp_normalLoad')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {runCrp.isPending && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bottleneck Alert */}
      {bottlenecks.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('crp_bottleneckCenters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bottlenecks.map((w) => (
                <Badge key={w.workCenterId} variant="destructive" className="gap-1">
                  {w.workCenterName} — {w.utilizationPct.toFixed(0)}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart — all work centers */}
      {sorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('crp_loadDiagram')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {sorted.map((wc) => (
              <div key={wc.workCenterId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{wc.workCenterName}</span>
                    {wc.isBottleneck && (
                      <EPStatusPill tone="danger" className="text-[10px] px-1 py-0">{t('crp_statusBottleneck')}</EPStatusPill>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {wc.requiredHours.toFixed(1)}h / {wc.availableHours.toFixed(1)}h
                  </span>
                </div>
                <UtilizationBar
                  pct={wc.utilizationPct}
                  isBottleneck={wc.isBottleneck}
                  labelBottleneck={t('crp_statusBottleneck')}
                  labelHigh={t('crp_statusHigh')}
                  labelNormal={t('crp_statusNormal')}
                />
                {wc.operations && wc.operations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {wc.operations.slice(0, 5).map((op, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">
                        {op.operationName}: {op.requiredHours.toFixed(1)}h
                      </Badge>
                    ))}
                    {wc.operations.length > 5 && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        +{wc.operations.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!result && !runCrp.isPending && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Factory className="w-12 h-12 opacity-30" />
            <p className="text-base font-medium">{t('crp_clickToCalculate')}</p>
            <p className="text-sm">{t('crp_allCentersMsg')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
