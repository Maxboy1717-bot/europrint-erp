/**
 * @module CapacityPlanningSections
 * @description Date-range filter card and load-analysis tab content for the
 * Capacity Planning page. Includes KPI stat cards, the recharts bar chart, and
 * the bottleneck list. Tab-list components live in CapacityPlanningTabs.tsx.
 */

import { TrendingUp, AlertTriangle, BarChart3, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { queryClient } from "@/lib/queryClient";
import type { LoadAnalysis, WorkCenterLoad, ChartRow } from "./CapacityPlanningTypes";
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// DateRangeCard
// ---------------------------------------------------------------------------

interface DateRangeCardProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  t: (key: string) => string;
}

export function DateRangeCard({ dateFrom, dateTo, onDateFromChange, onDateToChange, t }: DateRangeCardProps) {
  return (
    <Card className="bg-card rounded-lg border-none shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t("dateRange")}</CardTitle>
        <CardDescription className="text-muted-foreground font-medium">
          {t("loadAnalysisDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[200px] flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              {t("start")}
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="bg-muted/40 border-none"
              data-testid="input-date-from"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              {t("end")}
            </Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="bg-muted/40 border-none"
              data-testid="input-date-to"
            />
          </div>
          <Button
            className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/erp/capacity"] })}
            data-testid="button-refresh"
          >
            <Search className="h-4 w-4 mr-2" />
            {t("analyze")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AnalysisTabContent
// ---------------------------------------------------------------------------

interface AnalysisTabContentProps {
  isLoading: boolean;
  loadAnalysis: LoadAnalysis | null;
  bottlenecks: WorkCenterLoad[];
  overloaded: WorkCenterLoad[];
  chartData: ChartRow[];
  onAddCapacity: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function AnalysisTabContent({
  isLoading,
  loadAnalysis,
  bottlenecks,
  overloaded,
  chartData,
  onAddCapacity,
  t,
  tCommon,
}: AnalysisTabContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <EPLoader className="w-8 h-8" />
      </div>
    );
  }

  if (!loadAnalysis?.workCenters) {
    return (
      <Card className="bg-card rounded-lg border-none shadow-none">
        <CardContent className="py-12">
          <EmptyState
            icon={BarChart3}
            title={t("noCapacityData")}
            description={t("noCapacityDataDesc")}
            action={{ label: t("addCapacity"), onClick: onAddCapacity }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card rounded-lg border-none shadow-none p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("totalWorkCenters")}
            </p>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-total-centers">
            {loadAnalysis.workCenters.length}
          </div>
        </Card>

        <Card className="bg-card rounded-lg border-none shadow-none p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("bottlenecks")}
            </p>
            <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-[var(--ep-red)]" data-testid="text-bottlenecks">
            {bottlenecks.length}
          </div>
        </Card>

        <Card className="bg-card rounded-lg border-none shadow-none p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("overloaded")}
            </p>
            <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)]" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-[var(--ep-yellow)]" data-testid="text-overloaded">
            {overloaded.length}
          </div>
        </Card>
      </div>

      <Card className="bg-card rounded-lg border-none shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t("workCenterLoadChart")}</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">{t("capacityLoadComparison")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--on-surface-variant))", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--on-surface-variant))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--surface-container-lowest))", borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="available" fill="#0058cb" name={t("availableHours")} radius={[4, 4, 0, 0]} />
                <Bar dataKey="loaded" fill="#ef4444" name={t("loadedHours")} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card rounded-lg border-none shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t("criticalWorkCenters")}</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">{t("bottlenecksHighLoad")}</CardDescription>
        </CardHeader>
        <CardContent>
          {bottlenecks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 italic">{t("noBottlenecksFound")}</p>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(bottlenecks) ? bottlenecks : []).map((wc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors"
                  data-testid={`row-bottleneck-${idx}`}
                >
                  <div>
                    <p className="font-bold text-foreground">{wc.workCenterName}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                      {tCommon("code")}: {wc.workCenterCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <EPStatusPill tone="danger" data-testid={`badge-load-${idx}`}>
                      {wc.loadPercentage.toFixed(1)}%
                    </EPStatusPill>
                    <Badge className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                      {wc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
