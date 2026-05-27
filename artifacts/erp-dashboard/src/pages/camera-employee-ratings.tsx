// @deprecated 2026-05-27
// This component is a duplicate. Do NOT add new features here.
// See: docs/modules/hr-employees.md for canonical location.
/**
 * @module camera-employee-ratings
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Trophy, 
  ArrowLeft,
  Star,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Gift,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from '@/lib/queryClient';
import { EPPageHeader, EPStatusPill } from "@/components/ep";

interface EmployeeRating {
  id: string;
  userId: string;
  userName: string;
  department: string;
  score: number;
  violations: number;
  bonus: number;
  penalty: number;
  trend: "up" | "down" | "stable";
  rank: number;
  activeTime?: number;
  idleTime?: number;
  shift?: string;
}

interface RatingsResponse {
  ratings: EmployeeRating[];
  stats: {
    avgScore: number;
    totalBonus: number;
    totalPenalty: number;
  };
  period: string;
}

export default function CameraEmployeeRatings() {
  const { isAuthenticated } = useAuth();
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: ratingsData, isLoading, isError } = useQuery<RatingsResponse>({
    queryKey: ["/api/camera-employee-ratings", period],
    queryFn: async () => {
      return await apiRequest('GET', `/api/camera-employee-ratings?period=${period}`);
    },
    enabled: !!isAuthenticated,
  });

  const t = {
    title: language === "uz" ? "Xodim Reytingi" : "Рейтинг сотрудников",
    subtitle: language === "uz" ? "AI kamera asosida xodim baholash" : "Оценка сотрудников на основе AI камер",
    back: language === "uz" ? "Orqaga" : "Назад",
    daily: language === "uz" ? "Kunlik" : "Ежедневно",
    weekly: language === "uz" ? "Haftalik" : "Еженедельно",
    monthly: language === "uz" ? "Oylik" : "Ежемесячно",
    rank: language === "uz" ? "O'rin" : "Место",
    employee: language === "uz" ? "Xodim" : "Сотрудник",
    department: language === "uz" ? "Bo'lim" : "Отдел",
    score: language === "uz" ? "Ball" : "Балл",
    violations: language === "uz" ? "Buzilishlar" : "Нарушения",
    bonus: language === "uz" ? "Bonus" : "Бонус",
    penalty: language === "uz" ? "Jarima" : "Штраф",
    trend: language === "uz" ? "Trend" : "Тренд",
    topPerformers: language === "uz" ? "Eng yaxshilar" : "Лучшие",
    needsImprovement: language === "uz" ? "Yaxshilash kerak" : "Требует улучшения",
    totalBonus: language === "uz" ? "Jami bonus" : "Всего бонусов",
    totalPenalty: language === "uz" ? "Jami jarima" : "Всего штрафов",
    avgScore: language === "uz" ? "O'rtacha ball" : "Средний балл",
    noData: language === "uz" ? "Ma'lumot yo'q" : "Нет данных"
  };

  const ratings = ratingsData?.ratings || [];
  const totalBonus = ratingsData?.stats?.totalBonus || 0;
  const totalPenalty = ratingsData?.stats?.totalPenalty || 0;
  const avgScore = ratingsData?.stats?.avgScore || 0;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500"><Trophy className="h-3 w-3 mr-1" /> 1</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400"><Medal className="h-3 w-3 mr-1" /> 2</Badge>;
    if (rank === 3) return <Badge className="bg-orange-400"><Medal className="h-3 w-3 mr-1" /> 3</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-[var(--ep-green)]" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-[var(--ep-red)]" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
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
              data-testid="button-lang-uz"
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
              data-testid="button-lang-ru"
            >
              RU
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-avg-score">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.avgScore}</span>
              <Star className="h-4 w-4 text-[var(--ep-yellow)]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">{avgScore}%</span>
            </div>
            <Progress value={avgScore} className="h-1.5 bg-muted/60 mt-4" />
          </div>
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-total-bonus">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totalBonus}</span>
              <Gift className="h-4 w-4 text-[var(--ep-green)]" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-[var(--ep-green)]">{formatMoney(totalBonus)}</span>
          </div>
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-total-penalty">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totalPenalty}</span>
              <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-[var(--ep-red)]">{formatMoney(totalPenalty)}</span>
          </div>
        </Card>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as "daily" | "weekly" | "monthly")} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg">
          <TabsTrigger value="daily" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-daily">
            <Calendar className="h-4 w-4 mr-2" />
            {t.daily}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-weekly">
            <Calendar className="h-4 w-4 mr-2" />
            {t.weekly}
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-monthly">
            <Calendar className="h-4 w-4 mr-2" />
            {t.monthly}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={period}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-muted/40/50 py-4 px-6">
                  <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t.topPerformers}</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none bg-muted/60 hover:bg-muted/60">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 w-16">{t.rank}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.employee}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.department}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-center">{t.score}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-center">{t.violations}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t.bonus}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t.penalty}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-center">{t.trend}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(ratings) ? ratings : []).map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-muted/40 transition-colors border-none border-b border-border/30 group" data-testid={`row-employee-${emp.id}`}>
                          <TableCell className="py-4 px-6">{getRankBadge(emp.rank)}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarFallback className="bg-muted/60 text-muted-foreground text-xs font-bold">
                                  {emp.userName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground">{emp.userName}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">{emp.userId}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-sm text-muted-foreground">{emp.department}</TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                              <span className="text-xs font-bold text-foreground">{emp.score}%</span>
                              <Progress value={emp.score} className="h-1 bg-muted/60 w-full" />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">
                            {emp.violations > 0 ? (
                              <EPStatusPill tone="danger">
                                {emp.violations}
                              </EPStatusPill>
                            ) : (
                              <Badge className="bg-muted/60 text-muted-foreground border-none rounded-full px-2 py-0.5 text-[10px] font-bold">
                                0
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right text-[var(--ep-green)] font-bold text-sm">
                            {emp.bonus > 0 ? `+${formatMoney(emp.bonus)}` : "-"}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right text-[var(--ep-red)] font-bold text-sm">
                            {emp.penalty > 0 ? `-${formatMoney(emp.penalty)}` : "-"}
                          </TableCell>
                          <TableCell className="py-4 px-6 text-center">{getTrendIcon(emp.trend)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-muted/40/50 py-4 px-6">
                  <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
                    <Trophy className="h-4 w-4 text-[var(--ep-yellow)]" />
                    {t.topPerformers}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {ratings.slice(0, 3).map((emp, index) => (
                      <div 
                        key={emp.id} 
                        className={`p-4 rounded-lg border flex items-center gap-3 transition-all hover:scale-[1.02] ${
                          index === 0 ? "bg-yellow-50/50 border-yellow-200" :
                          index === 1 ? "bg-background/50 border-border/30" :
                          "bg-orange-50/50 border-orange-200"
                        }`}
                        data-testid={`top-employee-${index}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                          index === 0 ? "bg-yellow-500" :
                          index === 1 ? "bg-slate-400" :
                          "bg-orange-400"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-foreground">{emp.userName}</p>
                          <p className="text-xs text-muted-foreground">{emp.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{emp.score}%</p>
                          {emp.bonus > 0 && (
                            <p className="text-[10px] font-bold text-[var(--ep-green)] uppercase tracking-wider">+{formatMoney(emp.bonus)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-muted/40/50 py-4 px-6">
                  <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-[var(--ep-red)]">
                    <AlertTriangle className="h-5 w-5" />
                    {t.needsImprovement}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {(Array.isArray(ratings) ? ratings : []).filter(r => r.score < 80).map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/30 border border-red-100 hover:bg-red-50/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{emp.userName}</span>
                          <span className="text-[10px] text-[var(--ep-red)] font-bold uppercase tracking-wider">{emp.violations} {language === "uz" ? "buzilish" : "нарушений"}</span>
                        </div>
                        <EPStatusPill tone="danger">
                          {emp.score}%
                        </EPStatusPill>
                      </div>
                    ))}
                    {(Array.isArray(ratings) ? ratings : []).filter(r => r.score < 80).length === 0 && (
                      <p className="text-center py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.noData}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
