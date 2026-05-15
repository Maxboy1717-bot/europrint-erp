/**
 * @module camera-employees
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  User,
  Clock,
  Activity,
  Shield,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Award,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { EPErrorState, EPPageHeader } from "@/components/ep";
interface EmployeeProductivity {
  id: number;
  userId: string;
  date: string;
  shift: string | null;
  totalWorkMinutes: number | null;
  activeWorkMinutes: number | null;
  idleMinutes: number | null;
  unitsProduced: number | null;
  defectsCount: number | null;
  safetyViolationsCount: number | null;
  productivityScore: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  overallScore: number | null;
}

interface TopEmployee {
  id: number;
  userId: string;
  overallScore: number;
  productivityScore: number;
  qualityScore: number;
  safetyScore: number;
}

export default function CameraEmployees() {
  const [language, setLanguage] = useState<"uz" | "ru">("uz");

  const { data: productivity, isLoading: productivityLoading, isError, error, refetch} = useQuery<EmployeeProductivity[]>({
    queryKey: ["/api/employee-productivity"]
  });

  const { data: topEmployees, isLoading: topLoading } = useQuery<TopEmployee[]>({
    queryKey: ["/api/camera-dashboard/top-employees"]
  });

  const t = {
    title: language === "uz" ? "Xodim Kuzatuvi" : "Мониторинг сотрудников",
    subtitle: language === "uz" ? "AI kamera orqali xodim samaradorligini kuzatish" : "Мониторинг производительности сотрудников через AI камеры",
    back: language === "uz" ? "Orqaga" : "Назад",
    totalEmployees: language === "uz" ? "Jami xodimlar" : "Всего сотрудников",
    avgProductivity: language === "uz" ? "O'rtacha samaradorlik" : "Средняя производительность",
    avgQuality: language === "uz" ? "O'rtacha sifat" : "Среднее качество",
    avgSafety: language === "uz" ? "O'rtacha xavfsizlik" : "Средняя безопасность",
    topEmployees: language === "uz" ? "Top xodimlar" : "Лучшие сотрудники",
    allEmployees: language === "uz" ? "Barcha xodimlar" : "Все сотрудники",
    employee: language === "uz" ? "Xodim" : "Сотрудник",
    date: language === "uz" ? "Sana" : "Дата",
    workTime: language === "uz" ? "Ish vaqti" : "Рабочее время",
    productivity: language === "uz" ? "Samaradorlik" : "Производительность",
    quality: language === "uz" ? "Sifat" : "Качество",
    safety: language === "uz" ? "Xavfsizlik" : "Безопасность",
    overall: language === "uz" ? "Umumiy" : "Общий",
    noData: language === "uz" ? "Ma'lumot topilmadi" : "Данные не найдены",
    hours: language === "uz" ? "soat" : "часов",
    minutes: language === "uz" ? "daqiqa" : "минут"
  };

  const safeProductivity = safeArray<EmployeeProductivity>(productivity);
  const safeTopEmployees = safeArray<TopEmployee>(topEmployees);

  const avgProductivity = safeProductivity.length 
    ? Math.round((Array.isArray(safeProductivity) ? safeProductivity : []).reduce((sum, p) => sum + (p.productivityScore || 0), 0) / safeProductivity.length) 
    : 0;
  const avgQuality = safeProductivity.length 
    ? Math.round((Array.isArray(safeProductivity) ? safeProductivity : []).reduce((sum, p) => sum + (p.qualityScore || 0), 0) / safeProductivity.length) 
    : 0;
  const avgSafety = safeProductivity.length 
    ? Math.round((Array.isArray(safeProductivity) ? safeProductivity : []).reduce((sum, p) => sum + (p.safetyScore || 0), 0) / safeProductivity.length) 
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[var(--ep-green)]";
    if (score >= 60) return "text-[var(--ep-yellow)]";
    return "text-[var(--ep-red)]";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (productivityLoading || topLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch}  error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:bg-muted/40" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
            </Link>
          </div>
          <EPPageHeader
        breadcrumb={<><b className="text-foreground">{t.title}</b></>}
        title={t.title}
        subtitle={t.subtitle}
      />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button 
              variant={language === "uz" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
            >
              RU
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-total-employees">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totalEmployees}</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-foreground" data-testid="text-total-employees">{safeProductivity.length}</div>
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-avg-productivity">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.avgProductivity}</span>
            <Activity className="h-5 w-5 text-[var(--ep-blue)]" />
          </div>
          <div className={`text-4xl font-bold tracking-tight ${getScoreColor(avgProductivity)}`} data-testid="text-avg-productivity">{avgProductivity}%</div>
          <Progress value={avgProductivity} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-avg-quality">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.avgQuality}</span>
            <CheckCircle className="h-5 w-5 text-[var(--ep-purple)]" />
          </div>
          <div className={`text-4xl font-bold tracking-tight ${getScoreColor(avgQuality)}`} data-testid="text-avg-quality">{avgQuality}%</div>
          <Progress value={avgQuality} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-avg-safety">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.avgSafety}</span>
            <Shield className="h-5 w-5 text-[var(--ep-primary)]" />
          </div>
          <div className={`text-4xl font-bold tracking-tight ${getScoreColor(avgSafety)}`} data-testid="text-avg-safety">{avgSafety}%</div>
          <Progress value={avgSafety} className="mt-4 h-1.5 bg-muted/60" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-top-employees">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-[var(--ep-yellow)]" />
              {t.topEmployees}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {safeTopEmployees.length > 0 ? (
              <div className="space-y-4">
                {safeTopEmployees.slice(0, 5).map((employee, index) => (
                  <div 
                    key={employee.id} 
                    className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border hover:bg-muted/40 transition-colors group"
                    data-testid={`top-employee-${index}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? "bg-yellow-100 text-[var(--ep-yellow)] border-2 border-yellow-200" :
                      index === 1 ? "bg-muted/40 text-muted-foreground border-2 border-border/30" :
                      index === 2 ? "bg-orange-100 text-[var(--ep-primary)] border-2 border-orange-200" :
                      "bg-muted/60 text-muted-foreground border-2 border-border"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold text-foreground">{employee.userId.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getScoreBadge(employee.overallScore || 0)} border-none rounded-full px-3 py-1 font-bold`}>
                        {Math.round(employee.overallScore || 0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm">{t.noData}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-scores-chart">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{language === "uz" ? "Ko'rsatkichlar taqqoslash" : "Сравнение показателей"}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: t.productivity, value: avgProductivity },
                { name: t.quality, value: avgQuality },
                { name: t.safety, value: avgSafety }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#ddeaf3' }} />
                <Bar dataKey="value" fill="#0058cb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-all-employees">
        <CardHeader className="bg-muted/40/50 py-4 px-6">
          <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            {t.allEmployees}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.employee}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.date}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.workTime}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.productivity}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.quality}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.safety}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.overall}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeProductivity.length > 0 ? (
                  (Array.isArray(safeProductivity) ? safeProductivity : []).map((record) => {
                    const workHours = Math.floor((record.totalWorkMinutes || 0) / 60);
                    const workMins = (record.totalWorkMinutes || 0) % 60;
                    return (
                      <TableRow key={record.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-employee-${record.id}`}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-bold text-foreground">{record.userId.slice(0, 8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">{record.date}</TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">
                          {workHours > 0 ? `${workHours} ${t.hours} ` : ""}{workMins} {t.minutes}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${getScoreBadge(record.productivityScore || 0)} border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {Math.round(record.productivityScore || 0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${getScoreBadge(record.qualityScore || 0)} border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {Math.round(record.qualityScore || 0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${getScoreBadge(record.safetyScore || 0)} border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {Math.round(record.safetyScore || 0)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${getScoreBadge(record.overallScore || 0)} border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                            {Math.round(record.overallScore || 0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-20 text-[13px] text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{t.noData}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table></div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
