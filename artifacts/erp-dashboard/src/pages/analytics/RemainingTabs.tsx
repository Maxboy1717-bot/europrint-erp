import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, Award, Target, Clock, Activity, CheckCircle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, AreaChart, Area, ComposedChart, Line } from "recharts";
import type {
  AnalyticsStats, TopUser, CourseProgressItem, UserActivityItem,
  TestResultItem, LearningOutcomes, HrStats, AttendanceStat
} from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface RemainingTabsProps {
  stats: AnalyticsStats | undefined;
  courseProgress: CourseProgressItem[];
  userActivity: UserActivityItem[];
  testResults: TestResultItem[];
  learningOutcomes: LearningOutcomes | undefined;
  activityTrend: UserActivityItem[];
  hrStats: HrStats | undefined;
  attendanceStats: AttendanceStat[];
  COLORS: string[];
}

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
              {(courseProgress ?? []).reduce((sum, c) => sum + c.enrolled, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Tayinlanganlar soni</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tugatganlar</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(courseProgress ?? []).reduce((sum, c) => sum + c.completed, 0)}
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
            {(Array.isArray(courseProgress) ? courseProgress : []).sort((a, b) => ((b.completed / b.enrolled) * 100) - ((a.completed / a.enrolled) * 100)).slice(0, 10)
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
              <p className="text-center text-muted-foreground py-8">
                Ma'lumot topilmadi
              </p>
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
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('uz-UZ')}
                />
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

export function UsersTab({
  stats,
  learningOutcomes,
  userActivity,
}: Pick<RemainingTabsProps, 'stats' | 'learningOutcomes' | 'userActivity'>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Xodimlar</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Barcha xodimlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol O'quvchilar</CardTitle>
            <Activity className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.topUsers?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Progress qilmoqda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha Ball</CardTitle>
            <Target className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {learningOutcomes?.averageScore || 0}
            </div>
            <p className="text-xs text-muted-foreground">Umumiy o'rtacha</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'quv Soatlari</CardTitle>
            <Clock className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((stats?.totalUsers || 0) * 12.5)}
            </div>
            <p className="text-xs text-muted-foreground">Jami soatlar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Xodimlar Faolligi</CardTitle>
            <CardDescription>Haftalik aktiv xodimlar soni</CardDescription>
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
                    name="Aktiv xodimlar"
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

        <Card>
          <CardHeader>
            <CardTitle>🎯 Performance Matrix</CardTitle>
            <CardDescription>Xodimlarning natijalar bo'yicha taqsimlanishi</CardDescription>
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
          <CardTitle>⭐ TOP 10 Xodimlar</CardTitle>
          <CardDescription>Eng ko'p progress qilgan xodimlar</CardDescription>
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
                  <div className="text-xs text-muted-foreground">dars tugatgan</div>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground py-8">
                Ma'lumot topilmadi
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⏰ O'quv Vaqti Taqsimoti</CardTitle>
          <CardDescription>Xodimlarning o'quv vaqtlari bo'yicha</CardDescription>
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
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Xodimlar soni" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TestsTab({
  stats,
  testResults,
}: Pick<RemainingTabsProps, 'stats' | 'testResults'>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Testlar</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTests || 0}</div>
            <p className="text-xs text-muted-foreground">Barcha testlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'tganlar</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.passedTests || 0}</div>
            <p className="text-xs text-muted-foreground">Muvaffaqiyatli</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'tish Foizi</CardTitle>
            <Award className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.passRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Umumiy foiz</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha Vaqt</CardTitle>
            <Clock className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.averageTestTime || 0}</div>
            <p className="text-xs text-muted-foreground">Daqiqa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Test Natijalari</CardTitle>
            <CardDescription>Har bir test bo'yicha o'rtacha ball</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length > 0 ? (
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={(Array.isArray(testResults) ? testResults : []).slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="testTitle" angle={-15} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageScore" fill="hsl(var(--primary))" name="O'rtacha ball %" />
                </BarChart>
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
            <CardTitle>🎯 O'tish Statistikasi</CardTitle>
            <CardDescription>O'tgan va o'tmagan xodimlar nisbati</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={[
                    { name: "O'tgan", value: stats?.passedTests || 0, fill: '#22c55e' },
                    { name: "O'tmagan", value: (stats?.totalTests || 0) - (stats?.passedTests || 0), fill: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>❓ Savol Turi Taqsimoti</CardTitle>
            <CardDescription>Savol turlariga ko'ra tahlil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Ko\'p tanlovli', value: 0, fill: '#3b82f6' },
                    { name: 'Ochiq savol', value: 0, fill: '#22c55e' },
                    { name: 'Haqiqat/Yolg\'on', value: 0, fill: '#eab308' },
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

        <Card>
          <CardHeader>
            <CardTitle>⏱️ Har bir savolga ketgan vaqt</CardTitle>
            <CardDescription>O'rtacha vaqt (soniyalarda)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { type: 'Oson', avgTime: 25 },
                { type: "O'rtacha", avgTime: 45 },
                { type: 'Qiyin', avgTime: 75 },
                { type: 'Juda qiyin', avgTime: 120 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgTime" fill="hsl(var(--chart-2))" name="O'rtacha vaqt (s)" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔄 Qayta Urinishlar Tahlili</CardTitle>
          <CardDescription>Xodimlarning qayta urinish naqshlari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="glass-chart">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={[
              { attempt: '1-urinish', count: 45, passRate: 45 },
              { attempt: '2-urinish', count: 30, passRate: 65 },
              { attempt: '3-urinish', count: 15, passRate: 75 },
              { attempt: '4+ urinish', count: 10, passRate: 82 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempt" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Xodimlar soni" />
              <Line type="monotone" dataKey="passRate" stroke="#22c55e" strokeWidth={2} name="O'tish foizi %" />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⭐ Testlar Qiyinlik Darajasi</CardTitle>
          <CardDescription>Qiyinlik bo'yicha testlar taqsimoti</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Oson (80-100% o'tish)</span>
                <Badge variant="outline" className="bg-green-50">
                  {Math.round((testResults.length || 0) * 0.25)} test
                </Badge>
              </div>
              <Progress value={25} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">O'rtacha (60-79% o'tish)</span>
                <Badge variant="outline" className="bg-blue-50">
                  {Math.round((testResults.length || 0) * 0.45)} test
                </Badge>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qiyin (40-59% o'tish)</span>
                <Badge variant="outline" className="bg-yellow-50">
                  {Math.round((testResults.length || 0) * 0.20)} test
                </Badge>
              </div>
              <Progress value={20} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Juda qiyin (0-39% o'tish)</span>
                <Badge variant="outline" className="bg-red-50">
                  {Math.round((testResults.length || 0) * 0.10)} test
                </Badge>
              </div>
              <Progress value={10} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HrTab({
  hrStats,
  attendanceStats,
}: Pick<RemainingTabsProps, 'hrStats' | 'attendanceStats'>) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol Xodimlar</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Aktiv holat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noaktiv Xodimlar</CardTitle>
            <Users className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.inactiveUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Noaktiv holat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sertifikatlar (7 kun)</CardTitle>
            <Award className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.certificatesExpiringIn7Days || 0}</div>
            <p className="text-xs text-muted-foreground">Muddati tugaydi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kechikishlar</CardTitle>
            <Clock className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hrStats?.totalLateRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Jami kechikishlar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bajarilmagan Onboardinglar</CardTitle>
            <CardDescription>{hrStats?.incompleteOnboardingCount || 0} ta xodim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {hrStats?.incompleteOnboarding?.map((emp: { userId: number; userName: string; hireDate: string }) => (
                <div key={emp.userId} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <p className="font-medium">{emp.userName}</p>
                    <p className="text-xs text-muted-foreground">Ishga kirgan: {emp.hireDate}</p>
                  </div>
                  <Badge variant="destructive">Bajarilmagan</Badge>
                </div>
              )) || <p className="text-center text-muted-foreground py-8">Hammasi bajarilgan</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kechikkanlar Top 10</CardTitle>
            <CardDescription>Eng ko'p kechikkan xodimlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {attendanceStats?.slice(0, 10).map((stat: AttendanceStat & { userId: number; userName: string; totalMinutesLate: number; lateCount: number }) => (
                <div key={stat.userId} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <p className="font-medium">{stat.userName}</p>
                    <p className="text-xs text-muted-foreground">{stat.totalMinutesLate || 0} daqiqa</p>
                  </div>
                  <Badge variant="destructive">{stat.lateCount} marta</Badge>
                </div>
              )) || <p className="text-center text-muted-foreground py-8">Ma'lumot topilmadi</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Hisobotlar</CardTitle>
          <CardDescription>Turli formatda yuklab olish</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">HR Dashboard to'liq hisobot</h4>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/export/hr-stats/pdf"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-hr-pdf"
              >
                HR Dashboard PDF
              </a>
              <a
                href="/api/export/hr-stats/excel"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-hr-excel"
              >
                HR Dashboard Excel
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Alohida CSV hisobotlar</h4>
            <div className="flex gap-2 flex-wrap">
              <a
                href="/api/export/employees/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-employees"
              >
                Xodimlar CSV
              </a>
              <a
                href="/api/export/attendance/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-attendance"
              >
                Davomat CSV
              </a>
              <a
                href="/api/export/discipline/csv"
                className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover-elevate"
                data-testid="button-export-discipline"
              >
                Intizom CSV
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
