/**
 * @module OutcomesTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Award, TrendingUp, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Line } from "recharts";
import type { LearningOutcomes, FunnelData, ScoreDistribution, UserActivityItem, DepartmentStat, PositionStat, SkillsMatrixItem } from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface OutcomesTabProps {
  learningOutcomes: LearningOutcomes | undefined;
  outcomesLoading: boolean;
  funnelData: FunnelData | undefined;
  funnelLoading: boolean;
  scoreDistribution: ScoreDistribution | undefined;
  scoreDistLoading: boolean;
  activityTrend: UserActivityItem[];
  trendLoading: boolean;
  departmentStats: DepartmentStat[];
  deptStatsLoading: boolean;
  positionStats: PositionStat[];
  posStatsLoading: boolean;
  skillsMatrix: SkillsMatrixItem[];
  skillsMatrixLoading: boolean;
}

export function OutcomesTab({
  learningOutcomes,
  outcomesLoading,
  funnelData,
  funnelLoading,
  scoreDistribution,
  scoreDistLoading,
  activityTrend,
  departmentStats,
  positionStats,
  skillsMatrix,
  skillsMatrixLoading,
}: OutcomesTabProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label={t("refresh")}><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      {outcomesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {([1, 2, 3]).map((i) => (
            <Card key={`k-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2 rounded-lg" />
                <Skeleton className="h-4 w-40 mb-2 rounded-lg" />
                <Skeleton className="h-2 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("kursTugatishFoizi")}</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningOutcomes?.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {learningOutcomes?.completedAssignments || 0} / {learningOutcomes?.totalAssignments || 0} tayinlangan
              </p>
              <Progress value={learningOutcomes?.completionRate || 0} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("otishFoizi1")}</CardTitle>
              <Award className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningOutcomes?.passRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {learningOutcomes?.passedAttempts || 0} / {learningOutcomes?.totalAttempts || 0} urinish
              </p>
              <Progress value={learningOutcomes?.passRate || 0} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("ortachaBall")}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningOutcomes?.averageScore || 0}</div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>Median: {learningOutcomes?.medianScore || 0}</span>
                <span>•</span>
                <span>SD: ±{learningOutcomes?.standardDeviation || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("oquvJarayoniFunnel")}</CardTitle>
          <CardDescription>{t("tayinlandiBoshladiTugatdiSertifikatOldi")}</CardDescription>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {([1, 2, 3, 4]).map((i) => (
                  <div key={`k-${i}`} className="text-center p-4 rounded-lg border bg-card">
                    <Skeleton className="h-12 w-16 mx-auto mb-2 rounded-lg" />
                    <Skeleton className="h-4 w-24 mx-auto mb-2 rounded-lg" />
                    <Skeleton className="h-6 w-16 mx-auto rounded-lg" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ) : funnelData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-primary">{funnelData.assigned}</div>
                  <p className="text-sm text-muted-foreground mt-1">{t("tayinlandi")}</p>
                  <Badge variant="outline" className="mt-2">100%</Badge>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-[var(--ep-blue)]">{funnelData.started}</div>
                  <p className="text-sm text-muted-foreground mt-1">{t("boshladi")}</p>
                  <Badge variant="outline" className="mt-2">
                    {(funnelData.assigned ?? 0) > 0 ? Math.round((funnelData.started / (funnelData.assigned ?? 1)) * 100) : 0}%
                  </Badge>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-[var(--ep-green)]">{funnelData.completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">{t("tugatdi")}</p>
                  <Badge variant="outline" className="mt-2">
                    {(funnelData.assigned ?? 0) > 0 ? Math.round((funnelData.completed / (funnelData.assigned ?? 1)) * 100) : 0}%
                  </Badge>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-[var(--ep-yellow)]">{funnelData.certificated}</div>
                  <p className="text-sm text-muted-foreground mt-1">{t("sertifikatOldi")}</p>
                  <Badge variant="outline" className="mt-2">
                    {(funnelData.assigned ?? 0) > 0 ? Math.round(((funnelData.certificated ?? 0) / (funnelData.assigned ?? 1)) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={[
                    { name: 'Tayinlandi', value: funnelData.assigned, color: 'hsl(var(--primary))' },
                    { name: 'Boshladi', value: funnelData.started, color: '#3b82f6' },
                    { name: 'Tugatdi', value: funnelData.completed, color: '#22c55e' },
                    { name: 'Sertifikat', value: funnelData.certificated, color: '#eab308' },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
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
                    data={scoreDistribution.distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip />
                </PieChart>
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
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorProgress)"
                    name="Faol o'quvchilar"
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
                  <Bar dataKey="completionRate" fill="hsl(var(--primary))" name="Tugatish %" />
                  <Line type="monotone" dataKey="averageScore" stroke="#22c55e" strokeWidth={2} name="O'rtacha ball" />
                </ComposedChart>
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
                  <Bar dataKey="completionRate" fill="hsl(var(--accent))" name="Tugatish %" />
                  <Line type="monotone" dataKey="averageScore" stroke="#3b82f6" strokeWidth={2} name="O'rtacha ball" />
                </ComposedChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t("noData")}
              </div>
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
                <Radar 
                  name="O'rtacha daraja" 
                  dataKey="A" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Tasdiqlangan (%)" 
                  dataKey="B" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
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
    </div>
    </>
  );
}
