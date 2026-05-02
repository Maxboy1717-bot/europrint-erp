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
  Shield, 
  AlertTriangle, 
  HardHat, 
  Hand, 
  Eye,
  MapPin,
  Clock,
  User,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ErrorState } from "@/components/ui/error-state";

interface SafetyViolation {
  id: number;
  cameraId: string;
  userId: string | null;
  violationType: string;
  location: string | null;
  imageUrl: string | null;
  aiConfidence: number | null;
  penaltyApplied: boolean;
  createdAt: string;
}

interface SafetyStats {
  violationType: string;
  count: number;
}

const violationTypeLabels: Record<string, { uz: string; ru: string; icon: typeof Shield }> = {
  no_helmet: { uz: "Kaska yo'q", ru: "Нет каски", icon: HardHat },
  no_gloves: { uz: "Qo'lqop yo'q", ru: "Нет перчаток", icon: Hand },
  no_glasses: { uz: "Ko'zoynak yo'q", ru: "Нет очков", icon: Eye },
  danger_zone: { uz: "Xavfli zona", ru: "Опасная зона", icon: AlertTriangle },
  unsafe_behavior: { uz: "Xavfli xatti-harakat", ru: "Опасное поведение", icon: AlertTriangle },
  other: { uz: "Boshqa", ru: "Другое", icon: Shield }
};

const COLORS = ['#f97316', '#ef4444', '#eab308', '#3b82f6', '#22c55e', '#8b5cf6'];

export default function CameraSafety() {
  const [language, setLanguage] = useState<"uz" | "ru">("uz");

  const { data: violations, isLoading: violationsLoading, isError, refetch} = useQuery<SafetyViolation[]>({
    queryKey: ["/api/safety-violations"]
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SafetyStats[]>({
    queryKey: ["/api/camera-dashboard/safety-stats"]
  });

  const t = {
    title: language === "uz" ? "Xavfsizlik Nazorati" : "Контроль безопасности",
    subtitle: language === "uz" ? "AI kamera orqali xavfsizlik buzilishlarini kuzatish" : "Мониторинг нарушений безопасности через AI камеры",
    back: language === "uz" ? "Orqaga" : "Назад",
    totalViolations: language === "uz" ? "Jami buzilishlar" : "Всего нарушений",
    today: language === "uz" ? "Bugun" : "Сегодня",
    byType: language === "uz" ? "Tur bo'yicha" : "По типу",
    recentViolations: language === "uz" ? "So'nggi buzilishlar" : "Последние нарушения",
    violationType: language === "uz" ? "Buzilish turi" : "Тип нарушения",
    location: language === "uz" ? "Joylashuv" : "Местоположение",
    time: language === "uz" ? "Vaqt" : "Время",
    confidence: language === "uz" ? "Ishonch" : "Уверенность",
    penalty: language === "uz" ? "Jarima" : "Штраф",
    noViolations: language === "uz" ? "Buzilishlar topilmadi" : "Нарушения не найдены",
    helmet: language === "uz" ? "Kaska buzilishi" : "Нарушения каски",
    gloves: language === "uz" ? "Qo'lqop buzilishi" : "Нарушения перчаток",
    dangerZone: language === "uz" ? "Xavfli zona" : "Опасная зона",
    safetyScore: language === "uz" ? "Xavfsizlik ko'rsatkichi" : "Показатель безопасности"
  };

  const safeViolations = safeArray<SafetyViolation>(violations);
  const safeStats = safeArray<SafetyStats>(stats);

  const chartData = (Array.isArray(safeStats) ? safeStats : []).map(s => ({
    name: violationTypeLabels[s.violationType]?.[language] || s.violationType,
    value: s.count
  }));

  const totalViolations = safeViolations.length;
  const helmetViolations = (Array.isArray(safeViolations) ? safeViolations : []).filter(v => v.violationType === "no_helmet").length;
  const glovesViolations = (Array.isArray(safeViolations) ? safeViolations : []).filter(v => v.violationType === "no_gloves").length;
  const dangerZoneViolations = (Array.isArray(safeViolations) ? safeViolations : []).filter(v => v.violationType === "danger_zone").length;

  if (violationsLoading || statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-6 bg-surface min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button variant="ghost" size="sm" className="rounded-lg text-on-surface-variant hover:bg-surface-container-low" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Xavfsizlik <span className="font-bold text-primary">Nazorati</span>
          </h1>
          <p className="text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-outline-variant overflow-hidden">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface-container-lowest border-none rounded-lg p-5" data-testid="card-total-violations">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.totalViolations}</span>
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-orange-600" data-testid="text-total-violations">{totalViolations}</div>
          <p className="text-xs text-on-surface-variant mt-1">{t.today}</p>
        </Card>

        <Card className="bg-surface-container-lowest border-none rounded-lg p-5" data-testid="card-helmet-violations">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.helmet}</span>
            <HardHat className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-red-600" data-testid="text-helmet-violations">{helmetViolations}</div>
          <Progress value={totalViolations > 0 ? (helmetViolations / totalViolations) * 100 : 0} className="mt-4 h-1.5 bg-surface-container" />
        </Card>

        <Card className="bg-surface-container-lowest border-none rounded-lg p-5" data-testid="card-gloves-violations">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.gloves}</span>
            <Hand className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-yellow-600" data-testid="text-gloves-violations">{glovesViolations}</div>
          <Progress value={totalViolations > 0 ? (glovesViolations / totalViolations) * 100 : 0} className="mt-4 h-1.5 bg-surface-container" />
        </Card>

        <Card className="bg-surface-container-lowest border-none rounded-lg p-5" data-testid="card-danger-zone">
          <div className="flex flex-row items-center justify-between gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.dangerZone}</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-4xl font-bold tracking-tight text-red-600" data-testid="text-danger-zone-violations">{dangerZoneViolations}</div>
          <Progress value={totalViolations > 0 ? (dangerZoneViolations / totalViolations) * 100 : 0} className="mt-4 h-1.5 bg-surface-container" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none" data-testid="card-violations-chart">
          <CardHeader className="bg-surface-container-low/50 py-4 px-6">
            <CardTitle className="text-lg font-bold text-on-surface">{t.byType}</CardTitle>
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
              <div className="flex items-center justify-center h-[300px] text-on-surface-variant">
                {t.noViolations}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none" data-testid="card-violations-bar">
          <CardHeader className="bg-surface-container-low/50 py-4 px-6">
            <CardTitle className="text-lg font-bold text-on-surface">{t.byType}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#ddeaf3' }} />
                  <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-on-surface-variant">
                {t.noViolations}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none" data-testid="card-violations-table">
        <CardHeader className="bg-surface-container-low/50 py-4 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t.recentViolations}
            </CardTitle>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {safeViolations.length} {t.totalViolations}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.violationType}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.location}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.time}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.confidence}</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">{t.penalty}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeViolations.length > 0 ? (
                  (Array.isArray(safeViolations) ? safeViolations : []).map((violation) => {
                    const typeInfo = violationTypeLabels[violation.violationType] || violationTypeLabels.other;
                    const IconComponent = typeInfo.icon;
                    return (
                      <TableRow key={violation.id} className="hover:bg-surface-container-low transition-colors border-none" data-testid={`row-violation-${violation.id}`}>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-on-surface">{language === "uz" ? typeInfo.uz : typeInfo.ru}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant">
                            <MapPin className="h-4 w-4" />
                            {violation.location || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant">
                            <Clock className="h-4 w-4" />
                            {new Date(violation.createdAt).toLocaleString(language === "uz" ? "uz-UZ" : "ru-RU")}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {violation.aiConfidence ? (
                            <Badge variant="outline" className="border-outline-variant text-on-surface-variant font-bold rounded-full">
                              {Math.round(violation.aiConfidence * 100)}%
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {violation.penaltyApplied ? (
                            <Badge className="bg-red-100 text-red-800 border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {language === "uz" ? "Qo'llanildi" : "Применен"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-surface-container text-on-surface-variant border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              <XCircle className="h-3 w-3 mr-1" />
                              {language === "uz" ? "Yo'q" : "Нет"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-on-surface-variant">
                      <Shield className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">{t.noViolations}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
