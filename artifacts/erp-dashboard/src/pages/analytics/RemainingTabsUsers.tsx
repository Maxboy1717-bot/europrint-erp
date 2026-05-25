/**
 * @module RemainingTabsUsers
 * @description UsersTab component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Clock, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, AreaChart, Area,
} from "recharts";
import type { RemainingTabsProps } from "./RemainingTabsTypes";
import type { TopUser } from "./analytics-types";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
export function UsersTab({
  stats,
  learningOutcomes,
  userActivity,
}: Pick<RemainingTabsProps, 'stats' | 'learningOutcomes' | 'userActivity'>) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("jamiXodimlar")}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{t("barchaXodimlar")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("faolOquvchilar")}</CardTitle>
            <Activity className="w-4 h-4 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-green)]">
              {stats?.topUsers?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t("progressQilmoqda")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("ortachaBall")}</CardTitle>
            <Target className="w-4 h-4 text-[var(--ep-blue)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-blue)]">
              {learningOutcomes?.averageScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t("umumiyOrtacha")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("oquvSoatlari")}</CardTitle>
            <Clock className="w-4 h-4 text-[var(--ep-purple)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-purple)]">
              {Math.round((stats?.totalUsers || 0) * 12.5)}
            </div>
            <p className="text-xs text-muted-foreground">{t("jamiSoatlar")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("xodimlarFaolligi")}</CardTitle>
            <CardDescription>{t("haftalikAktivXodimlarSoni")}</CardDescription>
          </CardHeader>
          <CardContent>
            {userActivity.length > 0 ? (
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userActivity}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                    name={tLabel('analytics.RemainingTabsUsers.aktivXodimlar', "Aktiv xodimlar")}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("performanceMatrix")}</CardTitle>
            <CardDescription>{t("xodimlarningNatijalarBoyichaTaqsimlanishi")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Yuqori (80-100)', value: 0, fill: '#22c55e' },
                    { name: "O'rtacha (60-79)", value: 0, fill: '#3b82f6' },
                    { name: 'Past (40-59)', value: 0, fill: '#eab308' },
                    { name: 'Zaif (0-39)', value: 0, fill: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("top10Xodimlar")}</CardTitle>
          <CardDescription>{t("engKopProgressQilganXodimlar")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.topUsers?.slice(0, 10).map((user: TopUser, index: number) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.employeeId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{user.completedLessons}</div>
                  <div className="text-xs text-muted-foreground">{t("darsTugatgan")}</div>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground py-8">{t("noData")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("oquvVaqtiTaqsimoti")}</CardTitle>
          <CardDescription>{t("xodimlarningOquvVaqtlariBoyicha")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="glass-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { range: '0-5 soat', count: Math.round((stats?.totalUsers || 0) * 0.2) },
              { range: '5-10 soat', count: Math.round((stats?.totalUsers || 0) * 0.3) },
              { range: '10-20 soat', count: Math.round((stats?.totalUsers || 0) * 0.35) },
              { range: '20+ soat', count: Math.round((stats?.totalUsers || 0) * 0.15) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--primary))" name={tLabel('analytics.RemainingTabsUsers.xodimlarSoni', "Xodimlar soni")} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
