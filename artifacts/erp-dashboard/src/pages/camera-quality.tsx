/**
 * @module camera-quality
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Package,
  Scissors,
  Layers,
  Printer,
  ArrowLeft,
  Clock,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { EPErrorState, EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface QualityDefect {
  id: number;
  cameraId: string;
  workCenterId: string | null;
  defectType: string;
  defectLocation: string | null;
  imageUrl: string | null;
  aiConfidence: number | null;
  defectCount: number | null;
  actionTaken: string | null;
  createdAt: string;
}

interface QualityStats {
  defectType: string;
  count: number;
}

const defectTypeLabels: Record<string, { uz: string; ru: string; icon: typeof Package }> = {
  tear: { uz: "Yirtilish", ru: "Разрыв", icon: Scissors },
  crush: { uz: "Ezilish", ru: "Сминание", icon: Package },
  misprint: { uz: "Noto'g'ri chop", ru: "Неправильная печать", icon: Printer },
  misalignment: { uz: "Noto'g'ri joylashish", ru: "Несовпадение", icon: Layers },
  glue_issue: { uz: "Yelim muammosi", ru: "Проблема клея", icon: Package },
  dimension_error: { uz: "O'lcham xatosi", ru: "Ошибка размера", icon: Package },
  other: { uz: "Boshqa", ru: "Другое", icon: AlertTriangle }
};

const actionLabels: Record<string, { uz: string; ru: string }> = {
  rejected: { uz: "Rad etildi", ru: "Отклонен" },
  rework: { uz: "Qayta ishlash", ru: "Доработка" },
  passed: { uz: "O'tdi", ru: "Принят" }
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function CameraQuality() {
  const { t } = useTranslation("common");
  const [language, setLanguage] = useState<"uz" | "ru">("uz");

  const { data: defects, isLoading: defectsLoading, isError, refetch} = useQuery<QualityDefect[]>({
    queryKey: ["/api/quality-defects-camera"]
  });

  const { data: stats, isLoading: statsLoading } = useQuery<QualityStats[]>({
    queryKey: ["/api/camera-dashboard/quality-stats"]
  });

  const t = {
    title: language === "uz" ? "Sifat Nazorati" : "Контроль качества",
    subtitle: language === "uz" ? "AI kamera orqali sifat nuqsonlarini aniqlash" : "Обнаружение дефектов качества через AI камеры",
    back: language === "uz" ? "Orqaga" : "Назад",
    totalDefects: language === "uz" ? "Jami nuqsonlar" : "Всего дефектов",
    byType: language === "uz" ? "Tur bo'yicha" : "По типу",
    recentDefects: language === "uz" ? "So'nggi nuqsonlar" : "Последние дефекты",
    defectType: language === "uz" ? "Nuqson turi" : "Тип дефекта",
    location: language === "uz" ? "Joylashuv" : "Местоположение",
    time: language === "uz" ? "Vaqt" : "Время",
    confidence: language === "uz" ? "Ishonch" : "Уверенность",
    action: language === "uz" ? "Chora" : "Действие",
    noDefects: language === "uz" ? "Nuqsonlar topilmadi" : "Дефекты не найдены",
    rejected: language === "uz" ? "Rad etilgan" : "Отклоненные",
    rework: language === "uz" ? "Qayta ishlash" : "Доработка",
    passed: language === "uz" ? "O'tgan" : "Принятые",
    qualityRate: language === "uz" ? "Sifat darajasi" : "Уровень качества"
  };

  const safeDefects = safeArray<QualityDefect>(defects);
  const safeStats = safeArray<QualityStats>(stats);

  const chartData = (Array.isArray(safeStats) ? safeStats : []).map(s => ({
    name: defectTypeLabels[s.defectType]?.[language] || s.defectType,
    value: s.count
  }));

  const totalDefects = safeDefects.length;
  const rejectedCount = (Array.isArray(safeDefects) ? safeDefects : []).filter(d => d.actionTaken === "rejected").length;
  const reworkCount = (Array.isArray(safeDefects) ? safeDefects : []).filter(d => d.actionTaken === "rework").length;
  const passedCount = (Array.isArray(safeDefects) ? safeDefects : []).filter(d => d.actionTaken === "passed").length;

  if (defectsLoading || statsLoading) {
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
    return <EPErrorState onRetry={refetch} />;
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
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("sifatNazorati")}</b></>}
        title={t("sifatNazorati")}
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
        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-total-defects">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.totalDefects}</span>
            <Package className="h-4 w-4 text-[var(--ep-blue)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-blue)]" data-testid="text-total-defects">{totalDefects}</div>
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-rejected">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.rejected}</span>
            <XCircle className="h-5 w-5 text-[var(--ep-red)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-red)]" data-testid="text-rejected-count">{rejectedCount}</div>
          <Progress value={totalDefects > 0 ? (rejectedCount / totalDefects) * 100 : 0} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-rework">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.rework}</span>
            <RefreshCw className="h-5 w-5 text-[var(--ep-yellow)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-yellow)]" data-testid="text-rework-count">{reworkCount}</div>
          <Progress value={totalDefects > 0 ? (reworkCount / totalDefects) * 100 : 0} className="mt-4 h-1.5 bg-muted/60" />
        </Card>

        <Card className="bg-card border-none rounded-lg p-5" data-testid="card-passed">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.passed}</span>
            <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-[var(--ep-green)]" data-testid="text-passed-count">{passedCount}</div>
          <Progress value={totalDefects > 0 ? (passedCount / totalDefects) * 100 : 0} className="mt-4 h-1.5 bg-muted/60" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-defects-pie">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t.byType}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {(Array.isArray(chartData) ? chartData : []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t.noDefects}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-defects-bar">
          <CardHeader className="bg-muted/40/50 py-4 px-6">
            <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{t.byType}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#ddeaf3' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {t.noDefects}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none" data-testid="card-defects-table">
        <CardHeader className="bg-muted/40/50 py-4 px-6">
          <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-[var(--ep-blue)]" />
            {t.recentDefects}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.defectType}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.location}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.time}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.confidence}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeDefects.length > 0 ? (
                  (Array.isArray(safeDefects) ? safeDefects : []).map((defect) => {
                    const typeInfo = defectTypeLabels[defect.defectType] || defectTypeLabels.other;
                    const IconComponent = typeInfo.icon;
                    const actionInfo = defect.actionTaken ? actionLabels[defect.actionTaken] : null;
                    return (
                      <TableRow key={defect.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-defect-${defect.id}`}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-[var(--ep-blue)]">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-foreground">{language === "uz" ? typeInfo.uz : typeInfo.ru}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">{defect.defectLocation || "—"}</TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(defect.createdAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU")}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {defect.aiConfidence ? (
                            <Badge variant="outline" className="border-border text-muted-foreground font-bold rounded-full">
                              {Math.round(defect.aiConfidence * 100)}%
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {actionInfo ? (
                            <Badge className={`${
                              defect.actionTaken === "rejected" ? "bg-red-100 text-red-800" :
                              defect.actionTaken === "passed" ? "bg-green-100 text-green-800" : "bg-muted/60 text-muted-foreground"
                            } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                              {language === "uz" ? actionInfo.uz : actionInfo.ru}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border text-muted-foreground font-bold rounded-full">—</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-[13px] text-muted-foreground">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{t.noDefects}</p>
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
