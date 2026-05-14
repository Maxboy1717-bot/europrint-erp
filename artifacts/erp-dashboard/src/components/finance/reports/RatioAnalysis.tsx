/**
 * @module RatioAnalysis
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Percent, Activity, Calculator, Target } from "lucide-react";
import { formatPercent, formatRatio } from "./helpers";
import { KPIDashboard } from "./types";

import { useTranslation } from '@/lib/i18n';
interface RatioAnalysisProps {
  data: KPIDashboard | undefined;
  isLoading: boolean;
}

export function RatioAnalysis({data, isLoading }: RatioAnalysisProps) {
  const { t } = useTranslation('common');
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card data-testid="card-liquidity-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> {t("likvidlikKorsatkichlari")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('currentRatio')}</span>
                <span className="font-bold">{formatRatio(data?.liquidity?.currentRatio)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t("quickRatio")}</span>
                <span className="font-bold text-[var(--ep-blue)]">{formatRatio(data?.liquidity?.quickRatio)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-profitability-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4" /> {t("rentabellik")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ROE</span>
                <span className="font-bold text-[var(--ep-green)]">{formatPercent(data?.profitability?.returnOnEquity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ROA</span>
                <span className="font-bold text-[var(--ep-green)]">{formatPercent(data?.profitability?.returnOnAssets)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-efficiency-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" /> {t("samaradorlik")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t("aktivlarAylanmasi")}</span>
                <span className="font-bold">{formatRatio(data?.efficiency?.assetTurnover)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t("zaxiralarAylanmasi")}</span>
                <span className="font-bold">{formatRatio(data?.efficiency?.inventoryTurnover)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-leverage-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4" /> {t("moliyaviyBarqarorlik")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t("debtToEquity")}</span>
                <span className="font-bold text-[var(--ep-red)]">{formatRatio(data?.leverage?.debtToEquity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t("debtToAssets")}</span>
                <span className="font-bold">{formatRatio(data?.leverage?.debtToAssets)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
