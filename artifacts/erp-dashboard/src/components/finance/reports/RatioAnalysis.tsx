import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Percent, Activity, Calculator, Target } from "lucide-react";
import { formatPercent, formatRatio } from "./helpers";
import { KPIDashboard } from "./types";

interface RatioAnalysisProps {
  data: KPIDashboard | undefined;
  isLoading: boolean;
}

export function RatioAnalysis({ data, isLoading }: RatioAnalysisProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card data-testid="card-liquidity-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Likvidlik ko'rsatkichlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Ratio</span>
                <span className="font-bold">{formatRatio(data?.liquidity?.currentRatio)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Quick Ratio</span>
                <span className="font-bold text-blue-600">{formatRatio(data?.liquidity?.quickRatio)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-profitability-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4" /> Rentabellik
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ROE</span>
                <span className="font-bold text-green-600">{formatPercent(data?.profitability?.returnOnEquity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ROA</span>
                <span className="font-bold text-emerald-600">{formatPercent(data?.profitability?.returnOnAssets)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-efficiency-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" /> Samaradorlik
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Aktivlar aylanmasi</span>
                <span className="font-bold">{formatRatio(data?.efficiency?.assetTurnover)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Zaxiralar aylanmasi</span>
                <span className="font-bold">{formatRatio(data?.efficiency?.inventoryTurnover)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-leverage-ratios">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Moliyaviy barqarorlik
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Debt to Equity</span>
                <span className="font-bold text-red-600">{formatRatio(data?.leverage?.debtToEquity)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Debt to Assets</span>
                <span className="font-bold">{formatRatio(data?.leverage?.debtToAssets)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
