/**
 * @module ERPDashboardTab
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, ClipboardList, RefreshCw } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { WorkCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function ERPDashboardTab() {
  const { t } = useTranslation('production');
  const [selectedWorkCenterId, setSelectedWorkCenterId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<number>(7);

  const { data: workCenters = [] } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"],
  });

  const { data: dashboardStats, isLoading: loadingDashboard } = useQuery<{
    planTotal: number;
    factTotal: number;
    downtimeTotal: number;
    oee: number;
    scrapPercentage: number;
    weeklyTrend: Array<{ date: string; plan: number; fact: number; good: number; scrap: number; downtime: number }>;
  }>({
    queryKey: ["/api/erp/dashboard-stats"],
  });

  const { data: workCenterStats, isLoading: loadingWorkCenterStats } = useQuery<{
    totalPlanned: number;
    totalActual: number;
    totalGood: number;
    totalScrap: number;
    oee: number;
    scrapRate: number;
    totalDowntime: number;
    utilization: number;
    downtimeBreakdown: Array<{ category: string; minutes: number; count: number }>;
  } | null>({
    queryKey: ["/api/erp/work-centers", selectedWorkCenterId || "none", "stats", dateRange],
    queryFn: async () => {
      if (!selectedWorkCenterId) return null;
      try {
        const url = `/api/erp/work-centers/${selectedWorkCenterId}/stats?dateRange=${dateRange}`;
        return await apiRequest('GET', url);
      } catch {
        return null;
      }
    },
    enabled: !!selectedWorkCenterId,
  });

  useEffect(() => {
    if (!selectedWorkCenterId && workCenters.length > 0) {
      setSelectedWorkCenterId(workCenters[0].id);
    }
  }, [selectedWorkCenterId, workCenters]);

  const planVsFact = dashboardStats ? (dashboardStats.planTotal > 0 ? Math.round((dashboardStats.factTotal / dashboardStats.planTotal) * 100) : 0) : 0;
  const oee = dashboardStats?.oee || 0;
  const scrap = dashboardStats?.scrapPercentage || 0;
  const downtime = dashboardStats?.downtimeTotal || 0;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      {/* KPI Cards — Bitrix24 style */}
      <div className="grid gap-3 md:grid-cols-5">
        {/* Plan */}
        <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ClipboardList className="h-4.5 w-4.5 text-[var(--ep-blue)]" />
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                {t('today')}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight" data-testid="text-plan-total">
              {loadingDashboard ? <span className="text-muted-foreground">—</span> : (dashboardStats?.planTotal || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('totalPlan')}</p>
          </CardContent>
        </Card>

        {/* Fact */}
        <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
              </div>
              {!loadingDashboard && dashboardStats && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${planVsFact >= 90 ? 'bg-green-500/10 text-[var(--ep-green)] dark:text-green-400' : planVsFact >= 70 ? 'bg-yellow-500/10 text-[var(--ep-yellow)] dark:text-yellow-400' : 'bg-red-500/10 text-[var(--ep-red)] dark:text-red-400'}`}>
                  {planVsFact >= 90 ? '↑' : '↓'} {planVsFact}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold tracking-tight text-primary" data-testid="text-fact-total">
              {loadingDashboard ? <span className="text-muted-foreground">—</span> : (dashboardStats?.factTotal || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('actualProduction')}</p>
          </CardContent>
        </Card>

        {/* OEE */}
        <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${oee >= 85 ? 'bg-green-500/10' : oee >= 70 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                <BarChart3 className={`h-4.5 w-4.5 ${oee >= 85 ? 'text-[var(--ep-green)]' : oee >= 70 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${oee >= 85 ? 'bg-green-500/10 text-[var(--ep-green)] dark:text-green-400' : oee >= 70 ? 'bg-yellow-500/10 text-[var(--ep-yellow)] dark:text-yellow-400' : 'bg-red-500/10 text-[var(--ep-red)] dark:text-red-400'}`}>
                {oee >= 85 ? t('statusGood') : oee >= 70 ? t('statusMedium') : t('statusPoor')}
              </span>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${oee >= 85 ? 'text-[var(--ep-green)] dark:text-green-500' : oee >= 70 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-oee">
              {loadingDashboard ? <span className="text-muted-foreground">—</span> : `${oee}%`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">OEE {t('oeeEfficiency')}</p>
          </CardContent>
        </Card>

        {/* Scrap */}
        <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${scrap <= 2 ? 'bg-green-500/10' : scrap <= 5 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                <AlertTriangle className={`h-4.5 w-4.5 ${scrap <= 2 ? 'text-[var(--ep-green)]' : scrap <= 5 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${scrap <= 2 ? 'bg-green-500/10 text-[var(--ep-green)] dark:text-green-400' : scrap <= 5 ? 'bg-yellow-500/10 text-[var(--ep-yellow)] dark:text-yellow-400' : 'bg-red-500/10 text-[var(--ep-red)] dark:text-red-400'}`}>
                {scrap <= 2 ? `↓ ${t('statusLow')}` : scrap <= 5 ? t('statusMedium') : `↑ ${t('statusHigh')}`}
              </span>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${scrap <= 2 ? 'text-[var(--ep-green)] dark:text-green-500' : scrap <= 5 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-scrap-percentage">
              {loadingDashboard ? <span className="text-muted-foreground">—</span> : `${scrap}%`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('scrapPercent')}</p>
          </CardContent>
        </Card>

        {/* Downtime */}
        <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${downtime <= 30 ? 'bg-green-500/10' : downtime <= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                <TrendingDown className={`h-4.5 w-4.5 ${downtime <= 30 ? 'text-[var(--ep-green)]' : downtime <= 60 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${downtime <= 30 ? 'bg-green-500/10 text-[var(--ep-green)] dark:text-green-400' : downtime <= 60 ? 'bg-yellow-500/10 text-[var(--ep-yellow)] dark:text-yellow-400' : 'bg-red-500/10 text-[var(--ep-red)] dark:text-red-400'}`}>
                {downtime <= 30 ? t('statusNormal') : downtime <= 60 ? t('statusMedium') : t('statusHigh')}
              </span>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${downtime <= 30 ? 'text-[var(--ep-green)] dark:text-green-500' : downtime <= 60 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-downtime-total">
              {loadingDashboard ? <span className="text-muted-foreground">—</span> : `${downtime} ${t('min')}`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('downtimeToday')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan vs Fact Chart */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-semibold">{t('planVsFact')}</CardTitle>
          <CardDescription className="text-xs">{t('weeklyComparison')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDashboard ? (
            <div className="h-[300px] space-y-4 p-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </div>
          ) : !dashboardStats?.weeklyTrend || dashboardStats.weeklyTrend.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t('noDataYet')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardStats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="plan" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name={t('plan')} />
                <Line type="monotone" dataKey="fact" stroke="hsl(14 100% 59%)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name={t('fact')} />
                <Line type="monotone" dataKey="downtime" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" name={t('downtimeMin')} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Work Center Performance */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-1 border-b border-border/40 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">{t('workCenterResults')}</CardTitle>
            <CardDescription className="text-xs">{t('dailyIndicators')}</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedWorkCenterId || ""} onValueChange={setSelectedWorkCenterId}>
              <SelectTrigger className="w-full sm:w-[250px] h-9" data-testid="select-work-center">
                <SelectValue placeholder={t('selectWorkCenter')} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(workCenters) ? workCenters : []).filter(wc => wc.isActive).map((wc) => (
                  <SelectItem key={wc.id} value={wc.id}>
                    {wc.name} ({wc.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(Number(v))}>
              <SelectTrigger className="w-full sm:w-[150px] h-9" data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('last7Days')}</SelectItem>
                <SelectItem value="14">{t('last14Days')}</SelectItem>
                <SelectItem value="30">{t('last30Days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedWorkCenterId ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">{t('selectWorkCenter')}</div>
          ) : loadingWorkCenterStats ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                {([1, 2, 3, 4]).map((i) => (
                  <Card key={`k-${i}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                      <Skeleton className="h-4 w-16 rounded-lg" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-20 mb-1 rounded-lg" />
                      <Skeleton className="h-3 w-16 rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : !workCenterStats ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">{t('noDataFound')}</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-4">
                {/* WC OEE */}
                <Card className="border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(workCenterStats?.oee || 0) >= 85 ? 'bg-green-500/10' : (workCenterStats?.oee || 0) >= 70 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <BarChart3 className={`h-4 w-4 ${(workCenterStats?.oee || 0) >= 85 ? 'text-[var(--ep-green)]' : (workCenterStats?.oee || 0) >= 70 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${(workCenterStats?.oee || 0) >= 85 ? 'text-[var(--ep-green)] dark:text-green-500' : (workCenterStats?.oee || 0) >= 70 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-work-center-oee">
                      {workCenterStats?.oee || 0}%
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('oee')}</p>
                  </CardContent>
                </Card>
                {/* WC Utilization */}
                <Card className="border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(workCenterStats?.utilization || 0) >= 90 ? 'bg-green-500/10' : (workCenterStats?.utilization || 0) >= 75 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <TrendingUp className={`h-4 w-4 ${(workCenterStats?.utilization || 0) >= 90 ? 'text-[var(--ep-green)]' : (workCenterStats?.utilization || 0) >= 75 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${(workCenterStats?.utilization || 0) >= 90 ? 'text-[var(--ep-green)] dark:text-green-500' : (workCenterStats?.utilization || 0) >= 75 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-work-center-utilization">
                      {workCenterStats?.utilization || 0}%
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('utilization')}</p>
                  </CardContent>
                </Card>
                {/* WC Scrap */}
                <Card className="border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(workCenterStats?.scrapRate || 0) <= 2 ? 'bg-green-500/10' : (workCenterStats?.scrapRate || 0) <= 5 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <AlertTriangle className={`h-4 w-4 ${(workCenterStats?.scrapRate || 0) <= 2 ? 'text-[var(--ep-green)]' : (workCenterStats?.scrapRate || 0) <= 5 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${(workCenterStats?.scrapRate || 0) <= 2 ? 'text-[var(--ep-green)] dark:text-green-500' : (workCenterStats?.scrapRate || 0) <= 5 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-work-center-scrap-rate">
                      {workCenterStats?.scrapRate || 0}%
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('scrapPercent')}</p>
                  </CardContent>
                </Card>
                {/* WC Downtime */}
                <Card className="border border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(workCenterStats?.totalDowntime || 0) <= 30 ? 'bg-green-500/10' : (workCenterStats?.totalDowntime || 0) <= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                        <TrendingDown className={`h-4 w-4 ${(workCenterStats?.totalDowntime || 0) <= 30 ? 'text-[var(--ep-green)]' : (workCenterStats?.totalDowntime || 0) <= 60 ? 'text-[var(--ep-yellow)]' : 'text-[var(--ep-red)]'}`} />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${(workCenterStats?.totalDowntime || 0) <= 30 ? 'text-[var(--ep-green)] dark:text-green-500' : (workCenterStats?.totalDowntime || 0) <= 60 ? 'text-[var(--ep-yellow)] dark:text-yellow-500' : 'text-[var(--ep-red)] dark:text-red-500'}`} data-testid="text-work-center-downtime">
                      {workCenterStats?.totalDowntime || 0} {t('min')}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{t('downtimeLogs')}</p>
                  </CardContent>
                </Card>
              </div>

              {workCenterStats?.downtimeBreakdown && workCenterStats.downtimeBreakdown.length > 0 && (
                <Card className="border border-border/60 shadow-sm">
                  <CardHeader className="border-b border-border/40 pb-3">
                    <CardTitle className="text-sm font-semibold">{t('downtimeBreakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={workCenterStats.downtimeBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="category" tickFormatter={(value) => {
                          const names: Record<string, string> = {
                            breakdown: t('breakdown'), maintenance: t('maintenance'),
                            changeover: t('changeover'), material_shortage: t('materialShortage'), other: t('other')
                          };
                          return names[value] || value;
                        }} />
                        <YAxis />
                        <Tooltip labelFormatter={(value) => {
                          const names: Record<string, string> = {
                            breakdown: t('breakdown'), maintenance: t('maintenance'),
                            changeover: t('changeover'), material_shortage: t('materialShortage'), other: t('other')
                          };
                          return names[value as string] || value;
                        }} />
                        <Legend />
                        <Bar dataKey="minutes" fill="hsl(14 100% 59%)" radius={[4, 4, 0, 0]} name={t('minutes')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
