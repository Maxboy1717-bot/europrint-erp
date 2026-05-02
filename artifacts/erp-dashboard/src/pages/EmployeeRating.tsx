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
import { ErrorState } from "@/components/ui/error-state";

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
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const scoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold"><Award className="w-3 h-3 mr-1" />A'lo</Badge>;
    if (score >= 75) return <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold"><Star className="w-3 h-3 mr-1" />Yaxshi</Badge>;
    if (score >= 50) return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">O'rtacha</Badge>;
    return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Yomon</Badge>;
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
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Xodim <span className="font-bold text-primary">Reytingi</span>
          </h1>
          <p className="text-on-surface-variant -mt-1">KPI baholash, trend tahlili, maqsad monitoring</p>
        </div>
        <div className="flex gap-2 bg-surface-container p-1 rounded-lg">
          <Select value={periodYear} onValueChange={setPeriodYear}>
            <SelectTrigger className="w-24 bg-surface-container-lowest border-none shadow-none" data-testid="select-year"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodMonth} onValueChange={setPeriodMonth}>
            <SelectTrigger className="w-32 bg-surface-container-lowest border-none shadow-none" data-testid="select-month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Array.isArray(months) ? months : []).map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => refetch()} title="Yangilash">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Baholangan</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{totalRated}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">O'rtacha ball</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{avgComposite.toString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Samaradorlik</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{avgProductivity.toString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">KPI maqsadlar</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(goals || []).length}</p>
        </div>
      </div>

      <Tabs defaultValue="ratings" className="w-full">
        <TabsList>
          <TabsTrigger value="ratings" data-testid="tab-ratings">Reytinglar</TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">KPI Maqsadlar</TabsTrigger>
        </TabsList>
        <TabsContent value="ratings">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Bu davr uchun reyting hali hisoblanmagan</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">#</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Xodim</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Samaradorlik</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Intizom</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sifat</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Ko'nikmalar</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Umumiy ball</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Trend</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Daraja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(ratings) ? ratings : []).map((r, idx) => (
                      <TableRow key={r.id} data-testid={`row-rating-${r.id}`} className="hover:bg-surface-container-low transition-colors">
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
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="goals">
          <Card>
            <CardContent className="p-0">
              {(goals || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Target className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hali KPI maqsad belgilanmagan</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Xodim</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Maqsad</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Joriy</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Maqsad</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Bajarilish</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(goals || []).map((g) => {
                      const progress = g.targetValue > 0 ? Math.min(100, (g.currentValue / g.targetValue) * 100) : 0;
                      return (
                        <TableRow key={g.id} data-testid={`row-goal-${g.id}`} className="hover:bg-surface-container-low transition-colors">
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
                          <TableCell className="px-6"><Badge variant={g.status === "completed" ? "default" : "secondary"} className={g.status === "completed" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" : "bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold"}>{g.status}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
