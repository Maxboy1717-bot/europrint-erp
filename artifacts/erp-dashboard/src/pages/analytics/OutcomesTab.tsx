import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Award, TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Line } from "recharts";
import type { LearningOutcomes, FunnelData, ScoreDistribution, UserActivityItem, DepartmentStat, PositionStat, SkillsMatrixItem } from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

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
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      {outcomesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {([1, 2, 3]).map((i) => (
            <Card key={`k-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kurs Tugatish Foizi</CardTitle>
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
              <CardTitle className="text-sm font-medium">O'tish Foizi</CardTitle>
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
              <CardTitle className="text-sm font-medium">O'rtacha Ball</CardTitle>
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
          <CardTitle>O'quv Jarayoni Funnel</CardTitle>
          <CardDescription>Tayinlandi → Boshladi → Tugatdi → Sertifikat oldi</CardDescription>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {([1, 2, 3, 4]).map((i) => (
                  <div key={`k-${i}`} className="text-center p-4 rounded-lg border bg-card">
                    <Skeleton className="h-12 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto mb-2" />
                    <Skeleton className="h-6 w-16 mx-auto" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : funnelData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-primary">{funnelData.assigned}</div>
                  <p className="text-sm text-muted-foreground mt-1">Tayinlandi</p>
                  <Badge variant="outline" className="mt-2">100%</Badge>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-blue-600">{funnelData.started}</div>
                  <p className="text-sm text-muted-foreground mt-1">Boshladi</p>
                  <Badge variant="outline" className="mt-2">
                    {(funnelData.assigned ?? 0) > 0 ? Math.round((funnelData.started / (funnelData.assigned ?? 1)) * 100) : 0}%
                  </Badge>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-green-600">{funnelData.completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">Tugatdi</p>
                  <Badge variant="outline" className="mt-2">
                    {(funnelData.assigned ?? 0) > 0 ? Math.round((funnelData.completed / (funnelData.assigned ?? 1)) * 100) : 0}%
                  </Badge>
                </div>
                <div className="text-center p-4 rounded-lg border bg-card">
                  <div className="text-3xl font-bold text-yellow-600">{funnelData.certificated}</div>
                  <p className="text-sm text-muted-foreground mt-1">Sertifikat oldi</p>
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
              Ma'lumot yuklanmoqda...
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Ball Taqsimoti</CardTitle>
            <CardDescription>Xodimlarning ball oralig'i bo'yicha taqsimoti</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreDistLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                Ma'lumot topilmadi
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 O'zlashtirish Dinamikasi</CardTitle>
            <CardDescription>Oxirgi 30 kun ichidagi o'sish tendentsiyasi</CardDescription>
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
                Ma'lumot topilmadi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tashkiliy tuzilma bo'yicha Natijalar</CardTitle>
            <CardDescription>Bo'limlar bo'yicha tugatish foizi va o'rtacha ball</CardDescription>
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
                Ma'lumot topilmadi
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funksiyalar bo'yicha Natijalar</CardTitle>
            <CardDescription>Lavozimlar bo'yicha tugatish foizi va o'rtacha ball</CardDescription>
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
                Ma'lumot topilmadi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎯 Ko'nikmalar Matritsasi</CardTitle>
          <CardDescription>Har bir ko'nikma bo'yicha o'zlashtirish darajasi</CardDescription>
        </CardHeader>
        <CardContent>
          {skillsMatrixLoading ? (
            <div className="h-[350px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              Ko'nikmalar ma'lumotlari topilmadi
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
