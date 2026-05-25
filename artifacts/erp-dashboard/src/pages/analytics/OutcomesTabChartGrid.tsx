/**
 * @module OutcomesTabChartGrid
 * @description Charts section for OutcomesTab (score distribution, activity trend,
 * department/position stats, skills matrix).
 * Split from OutcomesTab.tsx (Rule 16).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, ComposedChart, Bar, Line, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
import type { ScoreDistribution, UserActivityItem, DepartmentStat, PositionStat, SkillsMatrixItem } from "./analytics-types";

interface Props {
  scoreDistribution: ScoreDistribution | undefined;
  scoreDistLoading: boolean;
  activityTrend: UserActivityItem[];
  departmentStats: DepartmentStat[];
  positionStats: PositionStat[];
  skillsMatrix: SkillsMatrixItem[];
  skillsMatrixLoading: boolean;
}

export function OutcomesTabChartGrid({
  scoreDistribution, scoreDistLoading,
  activityTrend, departmentStats, positionStats,
  skillsMatrix, skillsMatrixLoading,
}: Props) {
  const { t } = useTranslation("common");
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("ballTaqsimoti")}</CardTitle>
            <CardDescription>{t("xodimlarningBallOraligiBoyichaTaqsimoti")}</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreDistLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <EPLoader size={32} tone="muted" />
              </div>
            ) : scoreDistribution?.distribution && scoreDistribution.distribution.length > 0 ? (
              <div className="glass-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scoreDistribution.distribution} cx="50%" cy="50%"
                      labelLine={true}
                      label={({ name, percentage }: { name: string; percentage: number }) => `${name}: ${percentage}%`}
                      outerRadius={100} dataKey="value"
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ozlashtirishDinamikasi")}</CardTitle>
            <CardDescription>{t("oxirgi30KunIchidagiOsish")}</CardDescription>
          </CardHeader>
          <CardContent>
            {activityTrend.length > 0 ? (
              <div className="glass-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityTrend.slice(-30)}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString('uz-UZ')} />
                    <Area type="monotone" dataKey="activeUsers" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProgress)"
                      name={tLabel('analytics.OutcomesTab.faolOquvchilar', "Faol o'quvchilar")} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("tashkiliyTuzilmaBoyichaNatijalar")}</CardTitle>
            <CardDescription>{t("bolimlarBoyichaTugatishFoiziVa")}</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentStats.length > 0 ? (
              <div className="glass-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departmentName" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" fill="hsl(var(--primary))" name={tLabel('analytics.OutcomesTab.tugatish', "Tugatish %")} />
                    <Line type="monotone" dataKey="averageScore" stroke="#22c55e" strokeWidth={2} name={tLabel('analytics.OutcomesTab.ortachaBall', "O'rtacha ball")} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("funksiyalarBoyichaNatijalar")}</CardTitle>
            <CardDescription>{t("lavozimlarBoyichaTugatishFoiziVa")}</CardDescription>
          </CardHeader>
          <CardContent>
            {positionStats.length > 0 ? (
              <div className="glass-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={positionStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="positionName" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" fill="hsl(var(--accent))" name={tLabel('analytics.OutcomesTab.tugatish', "Tugatish %")} />
                    <Line type="monotone" dataKey="averageScore" stroke="#3b82f6" strokeWidth={2} name={tLabel('analytics.OutcomesTab.ortachaBall', "O'rtacha ball")} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">{t("noData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("konikmalarMatritsasi")}</CardTitle>
          <CardDescription>{t("harBirKonikmaBoyichaOzlashtirish")}</CardDescription>
        </CardHeader>
        <CardContent>
          {skillsMatrixLoading ? (
            <div className="h-[350px] flex items-center justify-center">
              <EPLoader size={32} tone="muted" />
            </div>
          ) : skillsMatrix.length > 0 ? (
            <div className="glass-chart">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={skillsMatrix}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name={tLabel('analytics.OutcomesTab.ortachaDaraja', "O'rtacha daraja")} dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Radar name={tLabel('analytics.OutcomesTab.tasdiqlangan', "Tasdiqlangan (%)")} dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              {t("konikmalarMalumotlariTopilmadi")}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
