import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, Clock, GraduationCap, BarChart3, AlertTriangle, Zap, Target, Activity, Pause, RotateCcw, Package, RotateCw, Trash2, RefreshCw } from "lucide-react";
import type { AbcAnalysis, CourseProgressRecord, PerformanceMetric, AttendanceStats, MesSummary, WmsSummary, TranslationFn } from "./profile-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface PerformanceTabProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  loadingAbc: boolean;
  loadingProgress: boolean;
  abcData: AbcAnalysis | undefined;
  courseProgress: CourseProgressRecord[] | undefined;
  metrics: PerformanceMetric[] | undefined;
  attendanceStats: AttendanceStats;
  getGradeColor: (grade: string) => string;
  mesSummary?: MesSummary | null;
  loadingMes?: boolean;
  wmsSummary?: WmsSummary | null;
  loadingWms?: boolean;
}

const REASON_LABELS: Record<string, string> = {
  breakdown: "Nosozlik",
  maintenance: "Texnik xizmat",
  material_shortage: "Material yetishmaydi",
  operator_absence: "Operator yo'q",
  quality_issue: "Sifat muammosi",
  changeover: "Mahsulot o'zgartirish",
  lunch: "Tushlik tanaffus",
  unknown: "Noma'lum sabab",
  planned: "Rejalashtirilgan to'xtash",
};

function MiniProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
    </>
  );
}

export function PerformanceTab({
  t, tCommon, loadingAbc, loadingProgress, abcData, courseProgress, metrics, attendanceStats, getGradeColor,
  mesSummary, loadingMes, wmsSummary, loadingWms,
}: PerformanceTabProps) {
  const hasMesData = !!(mesSummary && mesSummary.summary.totalSessions > 0);

  return (
    <div className="space-y-6">
      {/* HR KPI summary cards */}
      {(loadingAbc || loadingProgress) ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-blue-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">ABC Daraja</p>
                  {abcData ? (
                    <span className={`inline-flex w-10 h-10 rounded-full items-center justify-center text-white text-lg font-bold mt-1 ${getGradeColor(abcData.grade)}`}>
                      {abcData.grade}
                    </span>
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                  )}
                </div>
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Kurs tugatish</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {courseProgress ? (Array.isArray(courseProgress) ? courseProgress : []).filter(p => p.isCompleted).length : 0}
                    <span className="text-sm text-muted-foreground font-normal">/{courseProgress?.length || 0}</span>
                  </p>
                </div>
                <GraduationCap className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Samaradorlik</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{abcData?.performanceRate || 0}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('punctuality')}</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {abcData?.punctualityRate || attendanceStats.punctualPercentage}%
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MES — Ishlab chiqarish bo'limi (har doim ko'rinadi) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4" />
          MES — Ishlab chiqarish natijalari
          {mesSummary && !loadingMes && (
            <span className="text-xs font-normal normal-case">
              (so'nggi {mesSummary.periodMonths} oy)
            </span>
          )}
        </h3>

        {loadingMes ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-20" />)}
          </div>
        ) : !hasMesData ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-muted-foreground">
              <Activity className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Bu xodim uchun ishlab chiqarish sessiyalari topilmadi</p>
              <p className="text-xs mt-1 opacity-60 text-center max-w-sm">
                Xodim hali MES tizimida ishlab chiqarish sessiyasida qatnashmagan yoki
                uning ID raqami MES tizimidagi ID bilan mos kelmaydi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* 4 KPI kartasi */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-emerald-500/20">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">OEE o'rtacha</p>
                  <p className={`text-2xl font-bold mt-1 ${mesSummary!.summary.avgOee >= 75 ? "text-green-600" : mesSummary!.summary.avgOee >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                    {mesSummary!.summary.avgOee}%
                  </p>
                  <MiniProgressBar
                    value={mesSummary!.summary.avgOee}
                    max={100}
                    color={mesSummary!.summary.avgOee >= 75 ? "bg-green-500" : mesSummary!.summary.avgOee >= 50 ? "bg-yellow-500" : "bg-red-500"}
                  />
                </CardContent>
              </Card>
              <Card className="border-blue-500/20">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Brak foizi</p>
                  <p className={`text-2xl font-bold mt-1 ${mesSummary!.summary.defectPercent <= 2 ? "text-green-600" : mesSummary!.summary.defectPercent <= 5 ? "text-yellow-600" : "text-red-500"}`}>
                    {mesSummary!.summary.defectPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">{mesSummary!.summary.totalDefects} dona brak</p>
                </CardContent>
              </Card>
              <Card className="border-violet-500/20">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Ish vaqti nisbati</p>
                  <p className={`text-2xl font-bold mt-1 ${mesSummary!.summary.workTimeRatio >= 80 ? "text-green-600" : mesSummary!.summary.workTimeRatio >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                    {mesSummary!.summary.workTimeRatio}%
                  </p>
                  <MiniProgressBar
                    value={mesSummary!.summary.workTimeRatio}
                    max={100}
                    color={mesSummary!.summary.workTimeRatio >= 80 ? "bg-violet-500" : "bg-yellow-500"}
                  />
                </CardContent>
              </Card>
              <Card className="border-cyan-500/20">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">Reja bajarish</p>
                  <p className={`text-2xl font-bold mt-1 ${mesSummary!.summary.goalAchievement >= 95 ? "text-green-600" : mesSummary!.summary.goalAchievement >= 80 ? "text-yellow-600" : "text-red-500"}`}>
                    {mesSummary!.summary.goalAchievement}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mesSummary!.summary.totalActual.toLocaleString()} / {mesSummary!.summary.totalTarget.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Qo'shimcha 3 statistika */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ish vaqti</p>
                  </div>
                  <p className="text-xl font-bold">{mesSummary!.summary.totalRunningMinutes.toLocaleString()} min</p>
                  <p className="text-xs text-muted-foreground">{Math.round(mesSummary!.summary.totalRunningMinutes / 60)} soat</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Pause className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To'xtash vaqti</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{mesSummary!.summary.totalStoppedMinutes.toLocaleString()} min</p>
                  <p className="text-xs text-muted-foreground">{mesSummary!.summary.totalStoppages} marta to'xtagan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-4 w-4 text-orange-500" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ko'p uchraydigan sabab</p>
                  </div>
                  {mesSummary!.mostFrequentReason ? (
                    <>
                      <Badge variant="outline" className="border-orange-300 text-orange-700 mb-1">
                        {REASON_LABELS[mesSummary!.mostFrequentReason.reasonCode] || mesSummary!.mostFrequentReason.reasonCode}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{mesSummary!.mostFrequentReason.count} marta</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">To'xtash yo'q</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Grafiklar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mesSummary!.monthlyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      Oylik ishlab chiqarish (reja vs fakt)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mesSummary!.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="target" name="Reja" fill="#94a3b8" radius={[2,2,0,0]} />
                          <Bar dataKey="actual" name="Fakt" fill="#3b82f6" radius={[2,2,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {mesSummary!.stoppageHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4" />
                      To'xtash sabablari tahlili
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(Array.isArray(mesSummary?.stoppageHistory) ? mesSummary!.stoppageHistory : []).slice(0, 6).map((s, idx) => (
                        <div key={s.reasonCode} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{REASON_LABELS[s.reasonCode] || s.reasonCode}</span>
                            <span className="text-muted-foreground text-xs">{s.count}x · {s.totalMinutes} min</span>
                          </div>
                          <MiniProgressBar
                            value={s.count}
                            max={mesSummary!.stoppageHistory[0].count}
                            color={idx === 0 ? "bg-red-500" : "bg-orange-400"}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* So'nggi to'xtashlar */}
            {mesSummary!.recentStoppages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Pause className="h-4 w-4" />
                    So'nggi to'xtashlar tarixi
                  </CardTitle>
                  <CardDescription>Oxirgi {mesSummary!.recentStoppages.length} ta to'xtash hodisasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana/Vaqt</TableHead>
                        <TableHead>Sabab</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead className="text-right">Davomiylik</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(mesSummary?.recentStoppages) ? mesSummary!.recentStoppages : []).slice(0, 15).map((stop) => (
                        <TableRow key={stop.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {stop.startedAt
                              ? new Date(stop.startedAt).toLocaleString('uz-UZ', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                              {REASON_LABELS[stop.reasonCode] || stop.reasonCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[180px] truncate">{stop.reasonDescription || "—"}</TableCell>
                          <TableCell className="text-right text-sm">
                            {stop.durationSeconds != null ? `${Math.round(stop.durationSeconds / 60)} min` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* WMS — Material sarfi va intizom */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Package className="h-4 w-4" />
          Material sarfi va intizom (WMS)
          {wmsSummary && !loadingWms && (
            <span className="text-xs font-normal normal-case">
              (so'nggi {wmsSummary.periodDays} kun)
            </span>
          )}
        </h3>

        {loadingWms ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-20" />)}
          </div>
        ) : !wmsSummary || wmsSummary.summary.totalMovements === 0 ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Bu xodim uchun material harakatlari topilmadi</p>
              <p className="text-xs mt-1 opacity-60 text-center max-w-sm">
                Xodim so'nggi 90 kun ichida WMS tizimida material olmagan yoki qaytarmagan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-blue-500/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Jami olingan</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{wmsSummary.summary.totalIssued.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{wmsSummary.summary.totalMovements} ta harakat</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCw className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-muted-foreground">Qaytarilgan</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">{wmsSummary.summary.totalReturned.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-500/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-muted-foreground">Isrof</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{wmsSummary.summary.totalWasted.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className={wmsSummary.summary.overallReturnRate >= 20 ? "border-green-500/20" : wmsSummary.summary.overallReturnRate >= 10 ? "border-yellow-500/20" : "border-red-500/20"}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Qaytarish foizi</p>
                  </div>
                  <p className={`text-xl font-bold ${wmsSummary.summary.overallReturnRate >= 20 ? "text-green-600" : wmsSummary.summary.overallReturnRate >= 10 ? "text-yellow-600" : "text-red-500"}`}>
                    {wmsSummary.summary.overallReturnRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">intizom ko'rsatkichi</p>
                </CardContent>
              </Card>
            </div>

            {wmsSummary.materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Materiallar bo'yicha tafsilot
                  </CardTitle>
                  <CardDescription>Har bir material uchun olingan, qaytarilgan va qaytarish foizi</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Olingan</TableHead>
                        <TableHead className="text-right">Qaytarilgan</TableHead>
                        <TableHead className="text-right">Isrof</TableHead>
                        <TableHead className="text-right">Qaytarish %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(wmsSummary.materials) ? wmsSummary.materials : []).map((mat, idx) => (
                        <TableRow key={mat.materialId || idx} data-testid={`row-wms-material-${mat.materialId || idx}`}>
                          <TableCell className="font-medium text-sm">{mat.materialName}</TableCell>
                          <TableCell className="text-right text-sm">
                            {mat.issued.toLocaleString()} <span className="text-muted-foreground text-xs">{mat.unit}</span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-green-600">
                            {mat.returned.toLocaleString()} <span className="text-muted-foreground text-xs">{mat.unit}</span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-orange-600">
                            {mat.wasted > 0 ? `${mat.wasted.toLocaleString()} ` : "—"}
                            {mat.wasted > 0 && <span className="text-muted-foreground text-xs">{mat.unit}</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className={mat.returnRate >= 20 ? "border-green-300 text-green-700" : mat.returnRate >= 10 ? "border-yellow-300 text-yellow-700" : "border-red-300 text-red-700"}
                            >
                              {mat.returnRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ABC Baholash va oylik natijalar */}
      {!(loadingAbc || loadingProgress) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {abcData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  ABC Baholash
                </CardTitle>
                <CardDescription>Xodim samaradorlik kategoriyasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ${getGradeColor(abcData.grade)}`}>
                    {abcData.grade}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{abcData.score}/5 ball</p>
                    <p className="text-muted-foreground">Umumiy daraja</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Samaradorlik</p>
                    <p className="font-medium">{abcData.performanceRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Yo'qlama</p>
                    <p className="font-medium">{abcData.attendanceRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vaqtida kelish</p>
                    <p className="font-medium">{abcData.punctualityRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kurs o'tkazish</p>
                    <p className="font-medium">{abcData.courseCompletionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  ABC Baholash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">{tCommon('noData')}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Oylik natijalar (HR KPI)
              </CardTitle>
              <CardDescription>Oxirgi 6 oylik samaradorlik</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && metrics.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(Array.isArray(metrics) ? metrics : []).slice(0, 6).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metricDate" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="productivityScore" name="Samaradorlik" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="qualityScore" name="Sifat" stroke="#10b981" />
                      <Line type="monotone" dataKey="speedScore" name="Tezlik" stroke="#f59e0b" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{tCommon('noData')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kurslar statistikasi */}
      {!(loadingAbc || loadingProgress) && courseProgress && courseProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Ta'lim samaradorligi
            </CardTitle>
            <CardDescription>Kurslarni tugatish statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/40 rounded-md">
                <p className="text-3xl font-bold text-blue-600">{courseProgress.length}</p>
                <p className="text-sm text-muted-foreground">Jami kurslar</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-md">
                <p className="text-3xl font-bold text-green-600">
                  {(Array.isArray(courseProgress) ? courseProgress : []).filter(p => p.isCompleted).length}
                </p>
                <p className="text-sm text-muted-foreground">Tugatilgan</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-md">
                <p className="text-3xl font-bold text-purple-600">
                  {courseProgress.length > 0
                    ? Math.round(((Array.isArray(courseProgress) ? courseProgress : []).filter(p => p.isCompleted).length / courseProgress.length) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Tugatish foizi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
