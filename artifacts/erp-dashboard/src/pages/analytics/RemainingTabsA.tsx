/**
 * @module RemainingTabsA
 * @description CoursesTab component and re-export of UsersTab.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, Target, CheckCircle, RefreshCw } from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, AreaChart, Area, ComposedChart, Bar, Line,
} from "recharts";
import type { RemainingTabsProps } from "./RemainingTabsTypes";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

export { UsersTab } from "./RemainingTabsUsers";

// ---------------------------------------------------------------------------
// CoursesTab
// ---------------------------------------------------------------------------

export function CoursesTab({
  stats,
  courseProgress,
  activityTrend,
  COLORS,
}: Pick<RemainingTabsProps, 'stats' | 'courseProgress' | 'activityTrend' | 'COLORS'>) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Kurslar</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">Barcha kurslar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha Tugatish</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Umumiy tugatish foizi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Yozilganlar</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(Array.isArray(courseProgress) ? courseProgress : []).reduce((sum, c) => sum + c.enrolled, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tayinlanganlar soni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tugatganlar</CardTitle>
            <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-green)]">
              {(Array.isArray(courseProgress) ? courseProgress : []).reduce((sum, c) => sum + c.completed, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Muvaffaqiyatli</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Kurs Tugatish Ko'rsatkichlari</CardTitle>
            <CardDescription>Har bir kurs bo'yicha o'quvchilar progressi</CardDescription>
          </CardHeader>
          <CardContent>
            {courseProgress.length > 0 ? (
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={courseProgress.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="courseTitle" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrolled" fill="hsl(var(--chart-1))" name="Tayinlangan" />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Tugatgan" />
                  <Line type="monotone" dataKey="completionRate" stroke="#22c55e" strokeWidth={2} name="Foiz %" />
                </ComposedChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Ma'lumot topilmadi
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔥 Eng Ommabop Kurslar</CardTitle>
            <CardDescription>Eng ko'p xodim tayinlangan kurslar</CardDescription>
          </CardHeader>
          <CardContent>
            {courseProgress.length > 0 ? (
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={(Array.isArray(courseProgress) ? courseProgress : []).slice(0, 6).map((c, idx) => ({
                      name: c.courseTitle.substring(0, 20) + '...',
                      value: c.enrolled,
                      fill: COLORS[idx % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Ma'lumot topilmadi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🏅 Kurslar Reytingi</CardTitle>
          <CardDescription>Tugatish foizi bo'yicha saralangan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="glass-panel space-y-3 p-3">
            {(Array.isArray(courseProgress) ? courseProgress : [])
              .sort((a, b) => ((b.completed / b.enrolled) * 100) - ((a.completed / a.enrolled) * 100))
              .slice(0, 10)
              .map((course, index) => {
                const completionPercent = Math.round((course.completed / course.enrolled) * 100);
                return (
                  <div key={`k-${index}`} className="space-y-2 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant={index < 3 ? "default" : "outline"}>#{index + 1}</Badge>
                        <span className="text-sm font-medium flex-1">{course.courseTitle}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={completionPercent >= 80 ? "default" : completionPercent >= 50 ? "secondary" : "outline"}>
                          {completionPercent}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{course.enrolled} tayinlangan</span>
                      <span>{course.completed} tugatgan</span>
                    </div>
                    <Progress value={completionPercent} className="h-2" />
                  </div>
                );
              })}
            {courseProgress.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Ma'lumot topilmadi</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📈 Kurs Yozilish Dinamikasi</CardTitle>
          <CardDescription>Oxirgi 30 kun ichida kurs tayinlanishi</CardDescription>
        </CardHeader>
        <CardContent>
          {activityTrend.length > 0 ? (
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={(Array.isArray(activityTrend) ? activityTrend : []).slice(-30)}>
                <defs>
                  <linearGradient id="colorEnrollment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ')} />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorEnrollment)"
                  name="Yangi tayinlanganlar"
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
    </>
  );
}
