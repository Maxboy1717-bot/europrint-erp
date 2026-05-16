/**
 * @module EngagementTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Activity, RefreshCw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ActiveUsersData, UserActivityItem, RetentionData, SessionStatsData } from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';

interface EngagementTabProps {
  activeUsers: ActiveUsersData | undefined;
  activeUsersLoading: boolean;
  activityTrend: UserActivityItem[];
  trendLoading: boolean;
  retention: RetentionData | undefined;
  retentionLoading: boolean;
  sessionStats: SessionStatsData | undefined;
  sessionLoading: boolean;
}

export function EngagementTab({
  activeUsers,
  activityTrend,
  retention,
  sessionStats,
}: EngagementTabProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DAU</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers?.dau || 0}</div>
            <p className="text-xs text-muted-foreground">{t("kunlikFaolFoydalanuvchilar")}</p>
            <Progress value={activeUsers?.dau_wau_ratio || 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              WAU dan {activeUsers?.dau_wau_ratio || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WAU</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers?.wau || 0}</div>
            <p className="text-xs text-muted-foreground">{t("haftalikFaolFoydalanuvchilar")}</p>
            <Progress value={activeUsers?.wau_mau_ratio || 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              MAU dan {activeUsers?.wau_mau_ratio || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MAU</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers?.mau || 0}</div>
            <p className="text-xs text-muted-foreground">{t("oylikFaolFoydalanuvchilar")}</p>
            <Progress value={(activeUsers?.totalActiveUsers ?? 0) > 0 ? Math.round(((activeUsers?.mau ?? 0) / (activeUsers?.totalActiveUsers ?? 1)) * 100) : 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Jami {activeUsers?.totalActiveUsers || 0} foydalanuvchidan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("sessiyalar")}</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">{t("jamiSessiyalar")}</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                O'rtacha: {sessionStats?.averageSessionDuration || 0} daqiqa
              </p>
              <p className="text-xs text-muted-foreground">
                Har bir foydalanuvchi: {sessionStats?.sessionsPerUser || 0} sessiya
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("k30KunlikFaollikTendentsiyasi")}</CardTitle>
          <CardDescription>{t("kunlikFaolFoydalanuvchilarSoni")}</CardDescription>
        </CardHeader>
        <CardContent>
          {activityTrend.length > 0 ? (
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Faol foydalanuvchilar"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("noData")}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("retentionQaytishDarajasi")}</CardTitle>
            <CardDescription>{t("foydalanuvchilarningQaytishKorsatkichlari")}</CardDescription>
          </CardHeader>
          <CardContent>
            {retention ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("k1KunRetention")}</span>
                    <span className="text-2xl font-bold text-primary">{retention.day1Retention}%</span>
                  </div>
                  <Progress value={retention.day1Retention} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    {retention.day1Count} / {retention.totalUsers} foydalanuvchi qaytib kelgan
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("k7KunRetention")}</span>
                    <span className="text-2xl font-bold text-[var(--ep-blue)]">{retention.day7Retention}%</span>
                  </div>
                  <Progress value={retention.day7Retention} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    {retention.day7Count} / {retention.totalUsers} foydalanuvchi qaytib kelgan
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("k30KunRetention")}</span>
                    <span className="text-2xl font-bold text-[var(--ep-green)]">{retention.day30Retention}%</span>
                  </div>
                  <Progress value={retention.day30Retention} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    {retention.day30Count} / {retention.totalUsers} foydalanuvchi qaytib kelgan
                  </p>
                </div>

                <div className="glass-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart 
                    data={[
                      { period: '1 kun', retention: retention.day1Retention },
                      { period: '7 kun', retention: retention.day7Retention },
                      { period: '30 kun', retention: retention.day30Retention },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="retention" fill="hsl(var(--primary))" name="Retention %" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("malumotYuklanmoqda")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sessionStatistikasi")}</CardTitle>
            <CardDescription>{t("foydalanuvchilarningSessiyaKorsatkichlari")}</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionStats ? (
              <div className="space-y-6">
                <div className="text-center p-6 rounded-lg border bg-muted/50">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {sessionStats.averageSessionDuration}
                  </div>
                  <p className="text-sm text-muted-foreground">{t("oRtachaSessiyaDavomiyligiDaqiqa")}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg border">
                    <div className="text-3xl font-bold text-[var(--ep-blue)]">{sessionStats.totalSessions}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t("jamiSessiyalar")}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border">
                    <div className="text-3xl font-bold text-[var(--ep-green)]">{sessionStats.uniqueUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">{t("faolFoydalanuvchilar")}</p>
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-[var(--ep-purple)]">{sessionStats.sessionsPerUser}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    O'rtacha sessiya/foydalanuvchi
                  </p>
                </div>

                <div className="glass-chart">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart 
                    data={[
                      { name: 'Sessiyalar', value: sessionStats.totalSessions },
                      { name: 'Foydalanuvchilar', value: sessionStats.uniqueUsers },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("malumotYuklanmoqda")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
