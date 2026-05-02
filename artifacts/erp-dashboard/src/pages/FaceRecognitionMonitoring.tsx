import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Target,
  TrendingUp,
  Flag,
  User,
  Camera as CameraIcon
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { format } from "date-fns";
import { ErrorState } from "@/components/ui/error-state";

interface RecognitionStats {
  total: number;
  successful: number;
  failed: number;
  falsePositives: number;
  falseNegatives: number;
  avgConfidence: number;
  accuracy: number;
  dailyStats: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
    falsePositives: number;
    falseNegatives: number;
  }>;
}

interface RecognitionLog {
  id: string;
  cameraId: string | null;
  zoneId: string | null;
  employeeId: string | null;
  isRecognized: boolean;
  confidence: number;
  faceImageUrl: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  flaggedAs: string | null;
  flaggedBy: string | null;
  flaggedAt: string | null;
  employeeName: string | null;
  cameraName: string | null;
}

const labels = {
  uz: {
    title: "Yuz aniqlash monitoring",
    totalRecognitions: "Jami aniqlashlar",
    successful: "Muvaffaqiyatli",
    failed: "Muvaffaqiyatsiz",
    falsePositives: "Yolg'on ijobiy",
    falseNegatives: "Yolg'on salbiy",
    avgConfidence: "O'rtacha ishonchlilik",
    accuracy: "Aniqlik",
    recentLogs: "So'nggi loglar",
    chartTitle: "Aniqlash statistikasi (7 kun)",
    filterByStatus: "Status bo'yicha",
    all: "Barchasi",
    recognized: "Aniqlangan",
    unrecognized: "Aniqlanmagan",
    flagged: "Belgilangan",
    flag: "Belgilash",
    unflag: "Bekor qilish",
    markAsCorrect: "To'g'ri",
    markAsFalsePositive: "Yolg'on ijobiy",
    markAsFalseNegative: "Yolg'on salbiy",
    employee: "Xodim",
    camera: "Kamera",
    confidence: "Ishonchlilik",
    time: "Vaqt",
    status: "Holat",
    actions: "Harakatlar",
    unknown: "Noma'lum",
    noLogs: "Loglar topilmadi",
    flagSuccess: "Muvaffaqiyatli belgilandi",
    flagError: "Belgilashda xato"
  },
  ru: {
    title: "Мониторинг распознавания лиц",
    totalRecognitions: "Всего распознаваний",
    successful: "Успешные",
    failed: "Неуспешные",
    falsePositives: "Ложноположительные",
    falseNegatives: "Ложноотрицательные",
    avgConfidence: "Средняя достоверность",
    accuracy: "Точность",
    recentLogs: "Последние логи",
    chartTitle: "Статистика распознавания (7 дней)",
    filterByStatus: "По статусу",
    all: "Все",
    recognized: "Распознанные",
    unrecognized: "Нераспознанные",
    flagged: "Отмеченные",
    flag: "Отметить",
    unflag: "Снять отметку",
    markAsCorrect: "Верно",
    markAsFalsePositive: "Ложноположительный",
    markAsFalseNegative: "Ложноотрицательный",
    employee: "Сотрудник",
    camera: "Камера",
    confidence: "Достоверность",
    time: "Время",
    status: "Статус",
    actions: "Действия",
    unknown: "Неизвестен",
    noLogs: "Логи не найдены",
    flagSuccess: "Успешно отмечено",
    flagError: "Ошибка при отметке"
  }
};

export default function FaceRecognitionMonitoring() {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const t = labels[lang];

  const { data: stats, isLoading: statsLoading, isError, refetch} = useQuery<RecognitionStats>({
    queryKey: ["/api/camera/recognition-stats"]
  });

  const { data: logs, isLoading: logsLoading } = useQuery<RecognitionLog[]>({
    queryKey: ["/api/camera/recognition-logs", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (filter === "recognized") params.set("isRecognized", "true");
      if (filter === "unrecognized") params.set("isRecognized", "false");
      if (filter === "flagged") params.set("flaggedAs", "false_positive");
      const res = await fetch(`/api/camera/recognition-logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  const flagMutation = useMutation({
    mutationFn: async ({ id, flaggedAs }: { id: string; flaggedAs: string }) => {
      return apiRequest("POST", `/api/camera/recognition-logs/${id}/flag`, { flaggedAs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-stats"] });
      toast({ title: t.flagSuccess });
    },
    onError: () => {
      toast({ title: t.flagError, variant: "destructive" });
    }
  });

  const unflagMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/camera/recognition-logs/${id}/unflag`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/camera/recognition-stats"] });
      toast({ title: t.flagSuccess });
    },
    onError: () => {
      toast({ title: t.flagError, variant: "destructive" });
    }
  });

  const getFlagBadge = (flaggedAs: string | null) => {
    if (!flaggedAs) return null;
    switch (flaggedAs) {
      case "correct":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t.markAsCorrect}</Badge>;
      case "false_positive":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t.markAsFalsePositive}</Badge>;
      case "false_negative":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">{t.markAsFalseNegative}</Badge>;
      default:
        return null;
    }
  };

  const chartData = stats?.dailyStats?.map(d => ({
    ...d,
    date: format(new Date(d.date), "MM/dd")
  })) || [];

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={lang === "uz" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("uz")}
            data-testid="button-lang-uz"
          >
            UZ
          </Button>
          <Button
            variant={lang === "ru" ? "default" : "outline"}
            size="sm"
            onClick={() => setLang("ru")}
            data-testid="button-lang-ru"
          >
            RU
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.totalRecognitions}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-recognitions">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.successful}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600" data-testid="text-successful">{stats?.successful || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.failed}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600" data-testid="text-failed">{stats?.failed || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.accuracy}</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600" data-testid="text-accuracy">{stats?.accuracy || 0}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.falsePositives}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-orange-600" data-testid="text-false-positives">{stats?.falsePositives || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.falseNegatives}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-purple-600" data-testid="text-false-negatives">{stats?.falseNegatives || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="successful" 
                  stroke="#22c55e" 
                  name={t.successful}
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  name={t.failed}
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="falsePositives" 
                  stroke="#f97316" 
                  name={t.falsePositives}
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="falseNegatives" 
                  stroke="#a855f7" 
                  name={t.falseNegatives}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>{t.recentLogs}</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter">
              <SelectValue placeholder={t.filterByStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="recognized">{t.recognized}</SelectItem>
              <SelectItem value="unrecognized">{t.unrecognized}</SelectItem>
              <SelectItem value="flagged">{t.flagged}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {([...Array(5)]).map((_, i) => (
                <Skeleton key={`k-${i}`} className="h-12 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.camera}</TableHead>
                    <TableHead>{t.confidence}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.time}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(logs) ? logs : []).map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{log.employeeName || t.unknown}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CameraIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{log.cameraName || t.unknown}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.confidence > 0.8 ? "default" : "secondary"}>
                          {(log.confidence * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.isRecognized ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t.recognized}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t.unrecognized}
                            </Badge>
                          )}
                          {getFlagBadge(log.flaggedAs)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(log.timestamp), "dd.MM.yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {log.flaggedAs ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unflagMutation.mutate(log.id)}
                              disabled={unflagMutation.isPending}
                              data-testid={`button-unflag-${log.id}`}
                            >
                              {t.unflag}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => flagMutation.mutate({ id: log.id, flaggedAs: "correct" })}
                                disabled={flagMutation.isPending}
                                className="text-green-600"
                                data-testid={`button-flag-correct-${log.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => flagMutation.mutate({ id: log.id, flaggedAs: "false_positive" })}
                                disabled={flagMutation.isPending}
                                className="text-red-600"
                                data-testid={`button-flag-false-positive-${log.id}`}
                              >
                                <Flag className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => flagMutation.mutate({ id: log.id, flaggedAs: "false_negative" })}
                                disabled={flagMutation.isPending}
                                className="text-orange-600"
                                data-testid={`button-flag-false-negative-${log.id}`}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t.noLogs}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
