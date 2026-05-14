/**
 * @module EmployeeRating
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, TrendingDown, Minus, Award, Target, BarChart3, Star, Activity } from "lucide-react";
import { PageState } from "@/components/ui/page-state";
import { EPErrorState, EPPageHeader, EPStatusPill } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
interface EmployeeRatingItem {
  id: string;
  productivityScore: number;
  disciplineScore: number;
  qualityScore: number;
  skillsScore: number;
  compositeScore: number;
  trend: string;
  employee: { fullName: string } | null;
}

interface RatingsResponse {
  ratings: EmployeeRatingItem[];
  total: number;
}

interface GoalItem {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  status: string;
  employee: { fullName: string } | null;
}

interface RatingStats {
  avgScores: {
    avgComposite: number;
    avgProductivity: number;
    totalRated: number;
  };
}

export default function EmployeeRating() {
  const { t } = useTranslation('common');
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(now.getFullYear().toString());
  const [periodMonth, setPeriodMonth] = useState((now.getMonth() + 1).toString());

  const { data: ratingsData, isLoading, isError, refetch} = useQuery<RatingsResponse>({
    queryKey: ["/api/integration/employee-rating/ratings", periodYear, periodMonth],
  });

  const { data: goals } = useQuery<GoalItem[]>({
    queryKey: ["/api/integration/employee-rating/goals"],
  });

  const { data: stats } = useQuery<RatingStats>({
    queryKey: ["/api/integration/employee-rating/stats"],
  });

  const ratings = ratingsData?.ratings || [];

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-[var(--ep-green)]" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-[var(--ep-red)]" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const scoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"><Award className="w-3 h-3 mr-1" />{t("alo")}</Badge>;
    if (score >= 75) return <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold"><Star className="w-3 h-3 mr-1" />{t("Yaxshi")}</Badge>;
    if (score >= 50) return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t("average")}</Badge>;
    return <EPStatusPill tone="danger">{t("yomon")}</EPStatusPill>;
  };

  const avgComposite = stats?.avgScores?.avgComposite || 0;
  const avgProductivity = stats?.avgScores?.avgProductivity || 0;
  const totalRated = stats?.avgScores?.totalRated || 0;

  const months = [
    { value: "1", label: "Yanvar" }, { value: "2", label: "Fevral" }, { value: "3", label: "Mart" },
    { value: "4", label: "Aprel" }, { value: "5", label: "May" }, { value: "6", label: "Iyun" },
    { value: "7", label: "Iyul" }, { value: "8", label: "Avgust" }, { value: "9", label: "Sentabr" },
    { value: "10", label: "Oktabr" }, { value: "11", label: "Noyabr" }, { value: "12", label: "Dekabr" },
  ];

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("xodimReytingi")}</b></>}
        title={t("xodimReytingi")}
        subtitle={t("kpiBaholashTrendTahliliMaqsad")}
      />
        </div>
        <div className="flex gap-2 bg-muted/60 p-1 rounded-lg">
          <Select value={periodYear} onValueChange={setPeriodYear}>
            <SelectTrigger className="w-24 bg-card border-none shadow-none h-9" data-testid="select-year"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodMonth} onValueChange={setPeriodMonth}>
            <SelectTrigger className="w-32 bg-card border-none shadow-none h-9" data-testid="select-month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(months) ? months : []).map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()} title={t("refresh")}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("baholangan")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{totalRated}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("ortachaBall1")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{avgComposite.toString()}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("samaradorlik")}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{avgProductivity.toString()}</p>
        </div>
        <div className="bg-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('kpiMaqsadlar1')}</p>
          <p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(goals || []).length}</p>
        </div>
      </div>

      <Tabs defaultValue="ratings" className="w-full">
        <TabsList>
          <TabsTrigger value="ratings" data-testid="tab-ratings">{t("reytinglar")}</TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">{t('kpiMaqsadlar')}</TabsTrigger>
        </TabsList>
        <TabsContent value="ratings">
          <Card>
            <CardContent className="p-0">
              <PageState
                isLoading={isLoading}
                isError={isError}
                isEmpty={ratings.length === 0}
                onRetry={refetch}
                skeleton="table"
                skeletonRows={5}
                skeletonColumns={5}
                errorTitle="Reytinglar yuklanmadi"
                errorMessage="Server bilan bog'lanishda xatolik."
                emptyIcon={Users}
                emptyTitle="Reyting hali hisoblanmagan"
                emptyDescription="Bu davr uchun ma'lumot yo'q. Boshqa davrni tanlab ko'ring."
              >
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">#</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("xodim1")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("samaradorlik")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("intizom")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Sifat")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("konikmalar")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("umumiyBall")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('trend2')}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("daraja")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(ratings) ? ratings : []).map((r, idx) => (
                      <TableRow key={r.id} data-testid={`row-rating-${r.id}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-bold px-6">{idx + 1}</TableCell>
                        <TableCell className="font-medium px-6">{r.employee?.fullName || "-"}</TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-2">
                            <Progress value={r.productivityScore} className="w-16 h-2" />
                            <span className="text-xs font-mono">{r.productivityScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={r.disciplineScore} className="w-16 h-2" />
                            <span className="text-xs font-mono">{r.disciplineScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={r.qualityScore} className="w-16 h-2" />
                            <span className="text-xs font-mono">{r.qualityScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={r.skillsScore} className="w-16 h-2" />
                            <span className="text-xs font-mono">{r.skillsScore}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-lg">{r.compositeScore.toString()}</TableCell>
                        <TableCell>{trendIcon(r.trend)}</TableCell>
                        <TableCell>{scoreBadge(r.compositeScore)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </PageState>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="goals">
          <Card>
            <CardContent className="p-0">
              {(goals || []).length === 0 ? (
                <div className="text-center py-12 text-[13px] text-muted-foreground"><Target className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t("haliKpiMaqsadBelgilanmagan")}</p></div>
              ) : (
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("xodim1")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Maqsad")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("joriy")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Maqsad")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("progress5")}</TableHead>
                      <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("status28")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(goals || []).map((g) => {
                      const progress = g.targetValue > 0 ? Math.min(100, (g.currentValue / g.targetValue) * 100) : 0;
                      return (
                        <TableRow key={g.id} data-testid={`row-goal-${g.id}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="px-6">{g.employee?.fullName || "-"}</TableCell>
                          <TableCell className="px-6">{g.title}</TableCell>
                          <TableCell className="font-mono px-6">{g.currentValue} {g.unit}</TableCell>
                          <TableCell className="font-mono px-6">{g.targetValue} {g.unit}</TableCell>
                          <TableCell className="px-6">
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="w-20 h-2" />
                              <span className="text-xs font-mono">{progress.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6"><Badge variant={g.status === "completed" ? "default" : "secondary"} className={g.status === "completed" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" : "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold"}>{g.status}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
