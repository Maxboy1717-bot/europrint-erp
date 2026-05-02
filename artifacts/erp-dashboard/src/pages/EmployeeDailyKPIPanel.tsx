import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { insertEmployeeDailyKpiSchema, type InsertEmployeeDailyKpi } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Plus,
  Users,
  Trophy,
  Scale,
  Target,
  Bot,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ErrorState } from "@/components/ui/error-state";

interface KpiRecord {
  id: string;
  userId: string;
  fullName: string;
  evaluationDate: string;
  departmentId: string | null;
  departmentName: string | null;
  attendanceScore: number | null;
  taskCompletionScore: number | null;
  qualityScore: number | null;
  productivityScore: number | null;
  teamworkScore: number | null;
  disciplineScore: number | null;
  overallScore: number | null;
  bonusPercent: number | null;
  penaltyPercent: number | null;
  netScore: number | null;
  evaluatorId: string | null;
  aiGenerated: boolean | null;
  aiConfidence: number | null;
  notes: string | null;
}

interface TopPerformer {
  userId: string;
  fullName: string;
  departmentName: string | null;
  avgNetScore: number;
  avgOverall: number;
  recordCount: number;
}

function getScoreColor(score: number): string {
  if (score > 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number): string {
  if (score > 80) return "bg-green-500/10";
  if (score >= 60) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export default function EmployeeDailyKPIPanel() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertEmployeeDailyKpi>({
    resolver: zodResolver(insertEmployeeDailyKpiSchema),
    defaultValues: {
      userId: "",
      evaluationDate: selectedDate,
      departmentId: null,
      attendanceScore: 70,
      taskCompletionScore: 70,
      qualityScore: 70,
      productivityScore: 70,
      teamworkScore: 70,
      disciplineScore: 70,
      bonusPercent: 0,
      penaltyPercent: 0,
      notes: "",
    },
  });

  const watchedScores = form.watch([
    "attendanceScore",
    "taskCompletionScore",
    "qualityScore",
    "productivityScore",
    "teamworkScore",
    "disciplineScore",
    "bonusPercent",
    "penaltyPercent",
  ]);

  const overallPreview = useMemo(() => {
    const [attendance, tasks, quality, productivity, teamwork, discipline] = watchedScores;
    const avg =
      ((attendance ?? 70) + (tasks ?? 70) + (quality ?? 70) + (productivity ?? 70) + (teamwork ?? 70) + (discipline ?? 70)) / 6;
    return Math.round(avg * 100) / 100;
  }, [watchedScores]);

  const netPreview = useMemo(() => {
    const bonus = watchedScores[6] ?? 0;
    const penalty = watchedScores[7] ?? 0;
    return Math.round((overallPreview + bonus - penalty) * 100) / 100;
  }, [overallPreview, watchedScores]);

  const { data: kpiResponse, isLoading: kpiLoading, error: kpiError, isError, refetch} = useQuery<{
    count: number;
    records: KpiRecord[];
  }>({
    queryKey: [`/api/employee-kpi?dateFrom=${selectedDate}&dateTo=${selectedDate}`],
  });

  const records = kpiResponse?.records || [];

  const { data: topResponse, isLoading: topLoading, error: topError } = useQuery<{
    topPerformers: TopPerformer[];
  }>({
    queryKey: [`/api/employee-kpi/summary/top-performers?dateFrom=${selectedDate}&dateTo=${selectedDate}`],
  });

  const topPerformers = topResponse?.topPerformers || [];

  const { data: employeesResponse, isLoading: employeesLoading } = useQuery<{ data: Array<{ id: string; fullName: string; departmentId: string | null }> }>({
    queryKey: ["/api/employees"],
  });
  const employees = employeesResponse?.data || [];

  const { data: deptSummaryResponse, isLoading: deptLoading } = useQuery<{
    departments: Array<{
      departmentName: string;
      avgAttendance: number;
      avgTaskCompletion: number;
      avgQuality: number;
      avgProductivity: number;
      avgTeamwork: number;
      avgDiscipline: number;
      avgOverall: number;
    }>;
  }>({
    queryKey: [`/api/employee-kpi/summary/department?dateFrom=${selectedDate}&dateTo=${selectedDate}`],
  });

  const avgOverall = useMemo(() => {
    if (records.length === 0) return 0;
    const sum = (Array.isArray(records) ? records : []).reduce((acc, r) => acc + (r.overallScore ?? 0), 0);
    return Math.round((sum / records.length) * 100) / 100;
  }, [records]);

  const fairnessIndex = useMemo(() => {
    if (records.length < 2) return 0;
    const scores = (Array.isArray(records) ? records : []).map((r) => r.overallScore ?? 0);
    const mean = (Array.isArray(scores) ? scores : []).reduce((a, b) => a + b, 0) / scores.length;
    const variance = (Array.isArray(scores) ? scores : []).reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
    return Math.round(Math.sqrt(variance) * 100) / 100;
  }, [records]);

  const topPerformer = topPerformers.length > 0 ? topPerformers[0] : null;

  const radarData = useMemo(() => {
    const dimensions = [
      { key: "attendance", label: "Davomad" },
      { key: "tasks", label: "Vazifalar" },
      { key: "quality", label: "Sifat" },
      { key: "productivity", label: "Samaradorlik" },
      { key: "teamwork", label: "Jamoa ishi" },
      { key: "discipline", label: "Intizom" },
    ];

    const companyAvg = {
      attendance: 0,
      tasks: 0,
      quality: 0,
      productivity: 0,
      teamwork: 0,
      discipline: 0,
    };

    if (records.length > 0) {
      (Array.isArray(records) ? records : []).forEach((r) => {
        companyAvg.attendance += r.attendanceScore ?? 0;
        companyAvg.tasks += r.taskCompletionScore ?? 0;
        companyAvg.quality += r.qualityScore ?? 0;
        companyAvg.productivity += r.productivityScore ?? 0;
        companyAvg.teamwork += r.teamworkScore ?? 0;
        companyAvg.discipline += r.disciplineScore ?? 0;
      });
      const n = records.length;
      companyAvg.attendance /= n;
      companyAvg.tasks /= n;
      companyAvg.quality /= n;
      companyAvg.productivity /= n;
      companyAvg.teamwork /= n;
      companyAvg.discipline /= n;
    }

    const deptAvgs = deptSummaryResponse?.departments?.[0];

    return (dimensions ?? []).map((d) => ({
      dimension: d.label,
      "Kompaniya o'rtacha": Math.round((companyAvg as Record<string, number>)[d.key] * 10) / 10,
      "Bo'lim o'rtacha": deptAvgs
        ? Math.round(
            (d.key === "attendance"
              ? deptAvgs.avgAttendance
              : d.key === "tasks"
                ? deptAvgs.avgTaskCompletion
                : d.key === "quality"
                  ? deptAvgs.avgQuality
                  : d.key === "productivity"
                    ? deptAvgs.avgProductivity
                    : d.key === "teamwork"
                      ? deptAvgs.avgTeamwork
                      : deptAvgs.avgDiscipline) * 10
          ) / 10
        : 0,
    }));
  }, [records, deptSummaryResponse]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployeeDailyKpi) => {
      return apiRequest("POST", "/api/employee-kpi", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-kpi"] });
      toast({ title: "KPI baholash yaratildi" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "KPI baholash yaratilmadi",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertEmployeeDailyKpi) {
    const selectedEmployee = (Array.isArray(employees) ? employees : []).find((e) => e.id === data.userId);
    createMutation.mutate({
      ...data,
      departmentId: selectedEmployee?.departmentId || null,
    });
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="employee-daily-kpi-panel">
      <div className="border-b bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">
                  Kunlik KPI Baholash
                </h1>
                <p className="text-emerald-100 text-sm">
                  Adolatli va shaffof baholash tizimi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            data-testid="input-evaluation-date"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="button-add-evaluation"
                onClick={() => {
                  form.reset({
                    userId: "",
                    evaluationDate: selectedDate,
                    departmentId: null,
                    attendanceScore: 70,
                    taskCompletionScore: 70,
                    qualityScore: 70,
                    productivityScore: 70,
                    teamworkScore: 70,
                    disciplineScore: 70,
                    bonusPercent: 0,
                    penaltyPercent: 0,
                    notes: "",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Baholash qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yangi KPI Baholash</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Xodim</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-employee">
                                <SelectValue placeholder="Xodim tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Array.isArray(employees) ? employees : []).map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="evaluationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sana</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-form-date"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    {([
                      { name: "attendanceScore" as const, label: "Davomad (Attendance)", testId: "slider-attendance" },
                      { name: "taskCompletionScore" as const, label: "Vazifalar (Task Completion)", testId: "slider-tasks" },
                      { name: "qualityScore" as const, label: "Sifat (Quality)", testId: "slider-quality" },
                      { name: "productivityScore" as const, label: "Samaradorlik (Productivity)", testId: "slider-productivity" },
                      { name: "teamworkScore" as const, label: "Jamoa ishi (Teamwork)", testId: "slider-teamwork" },
                      { name: "disciplineScore" as const, label: "Intizom (Discipline)", testId: "slider-discipline" },
                    ]).map((item) => (
                      <FormField
                        key={item.testId}
                        control={form.control}
                        name={item.name}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>{item.label}</FormLabel>
                              <span className={`text-sm font-bold ${getScoreColor(field.value ?? 70)}`}>
                                {field.value ?? 70}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value ?? 70]}
                                onValueChange={(val) => field.onChange(val[0])}
                                data-testid={item.testId}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bonusPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonus %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-bonus"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="penaltyPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jarima %</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-penalty"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Izohlar</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Qo'shimcha izohlar..."
                            rows={3}
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Card className={getScoreBg(overallPreview)}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Umumiy ball</span>
                        <span className={`text-lg font-bold ${getScoreColor(overallPreview)}`} data-testid="text-overall-preview">
                          {overallPreview}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-muted-foreground">Sof ball (bonus/jarima bilan)</span>
                        <span className={`text-lg font-bold ${getScoreColor(netPreview)}`} data-testid="text-net-preview">
                          {netPreview}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-evaluation"
                    >
                      {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {kpiError && (
          <div className="text-sm text-destructive" data-testid="text-kpi-error">
            KPI ma'lumotlarini yuklashda xatolik yuz berdi
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-avg-score">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha Umumiy Ball</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpiLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className={`text-3xl font-bold ${getScoreColor(avgOverall)}`} data-testid="text-avg-score">
                    {avgOverall}
                  </div>
                  <Progress
                    value={avgOverall}
                    className="h-2 mt-2"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-total-evaluations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugungi Baholashlar</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpiLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-total-evaluations">
                  {records.length}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-top-performer">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eng Yaxshi Xodim</CardTitle>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {topLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : topError ? (
                <p className="text-sm text-destructive">Xatolik yuz berdi</p>
              ) : topPerformer ? (
                <>
                  <div className="text-lg font-bold truncate" data-testid="text-top-performer-name">
                    {topPerformer.fullName}
                  </div>
                  <p className={`text-sm font-semibold ${getScoreColor(topPerformer.avgNetScore)}`} data-testid="text-top-performer-score">
                    {Math.round(topPerformer.avgNetScore * 100) / 100} ball
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-fairness-index">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adolatlilik Indeksi</CardTitle>
              <Scale className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpiLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className={`text-3xl font-bold ${fairnessIndex <= 15 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} data-testid="text-fairness-index">
                    {fairnessIndex}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fairnessIndex <= 15 ? "Adolatli" : "Tekshirish kerak"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-radar-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              KPI O'lchovlari
            </CardTitle>
            <CardDescription>6 ta asosiy KPI bo'yicha tahlil</CardDescription>
          </CardHeader>
          <CardContent>
            {kpiLoading || deptLoading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : records.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Kompaniya o'rtacha"
                      dataKey="Kompaniya o'rtacha"
                      stroke="hsl(160, 60%, 45%)"
                      fill="hsl(160, 60%, 45%)"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Bo'lim o'rtacha"
                      dataKey="Bo'lim o'rtacha"
                      stroke="hsl(220, 60%, 55%)"
                      fill="hsl(220, 60%, 55%)"
                      fillOpacity={0.2}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <Target className="h-12 w-12 mb-4 opacity-40" />
                <p>Tanlangan sana uchun ma'lumot mavjud emas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-evaluations-table">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Baholashlar Jadvali
            </CardTitle>
            <CardDescription>
              {selectedDate} sanasi uchun barcha baholashlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <div className="space-y-3">
                {([1, 2, 3]).map((i) => (
                  <Skeleton key={`k-${i}`} className="h-12 w-full" />
                ))}
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead className="text-center">Davomad</TableHead>
                      <TableHead className="text-center">Vazifalar</TableHead>
                      <TableHead className="text-center">Sifat</TableHead>
                      <TableHead className="text-center">Samaradorlik</TableHead>
                      <TableHead className="text-center">Jamoa</TableHead>
                      <TableHead className="text-center">Intizom</TableHead>
                      <TableHead className="text-center">Umumiy</TableHead>
                      <TableHead className="text-center">Bonus%</TableHead>
                      <TableHead className="text-center">Jarima%</TableHead>
                      <TableHead className="text-center">Sof Ball</TableHead>
                      <TableHead className="text-center">AI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(records) ? records : []).map((record) => (
                      <TableRow key={record.id} data-testid={`row-kpi-${record.id}`}>
                        <TableCell className="font-medium" data-testid={`text-employee-name-${record.id}`}>
                          {record.fullName}
                        </TableCell>
                        <TableCell>{record.evaluationDate}</TableCell>
                        <TableCell className={`text-center font-medium ${getScoreColor(record.attendanceScore ?? 0)}`}>
                          {record.attendanceScore ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-medium ${getScoreColor(record.taskCompletionScore ?? 0)}`}>
                          {record.taskCompletionScore ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-medium ${getScoreColor(record.qualityScore ?? 0)}`}>
                          {record.qualityScore ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-medium ${getScoreColor(record.productivityScore ?? 0)}`}>
                          {record.productivityScore ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-medium ${getScoreColor(record.teamworkScore ?? 0)}`}>
                          {record.teamworkScore ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-medium ${getScoreColor(record.disciplineScore ?? 0)}`}>
                          {record.disciplineScore ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-bold ${getScoreColor(record.overallScore ?? 0)}`}>
                          {record.overallScore ?? 0}
                        </TableCell>
                        <TableCell className="text-center text-green-600 dark:text-green-400">
                          +{record.bonusPercent ?? 0}
                        </TableCell>
                        <TableCell className="text-center text-red-600 dark:text-red-400">
                          -{record.penaltyPercent ?? 0}
                        </TableCell>
                        <TableCell className={`text-center font-bold ${getScoreColor(record.netScore ?? 0)}`}>
                          {record.netScore ?? 0}
                        </TableCell>
                        <TableCell className="text-center">
                          {record.aiGenerated ? (
                            <Badge variant="outline" className="gap-1">
                              <Bot className="h-3 w-3" />
                              AI
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-40" />
                <p>Tanlangan sana uchun baholashlar mavjud emas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
