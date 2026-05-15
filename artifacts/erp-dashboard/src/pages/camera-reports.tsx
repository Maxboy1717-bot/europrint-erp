/**
 * @module camera-reports
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Shield,
  Factory,
  Users,
  CheckCircle,
  ArrowLeft,
  FileSpreadsheet,
  BarChart3,
  PieChart
} from "lucide-react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { apiRequest } from '@/lib/queryClient';
import { EPErrorState, EPPageHeader } from "@/components/ep";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

interface SafetyStat {
  violationType: string;
  count: number;
}

interface QualityStat {
  defectType: string;
  count: number;
}

interface TopEmployee {
  id: string | number;
  userId: string;
  shift: string;
  activeTime: number;
  overallScore: number;
}

export default function CameraReports() {
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: safetyStats, isLoading: loadingSafety, isError, error, refetch} = useQuery<SafetyStat[]>({
    queryKey: ["/api/camera-dashboard/safety-stats"]
  });

  const { data: qualityStats, isLoading: loadingQuality } = useQuery<QualityStat[]>({
    queryKey: ["/api/camera-dashboard/quality-stats"]
  });

  const { data: topEmployees, isLoading: loadingEmployees } = useQuery<TopEmployee[]>({
    queryKey: ["/api/camera-dashboard/top-employees"]
  });

  const { data: trendDataApi = [] } = useQuery<{day:string;safety:number;quality:number}[]>({
    queryKey: ["/api/camera-dashboard/weekly-trend"]
  });

  const t = {
    title: language === "uz" ? "AI Kamera Hisobotlari" : "Отчеты AI Камер",
    subtitle: language === "uz" ? "Kunlik, haftalik va oylik hisobotlar" : "Ежедневные, еженедельные и ежемесячные отчеты",
    back: language === "uz" ? "Orqaga" : "Назад",
    daily: language === "uz" ? "Kunlik" : "Ежедневно",
    weekly: language === "uz" ? "Haftalik" : "Еженедельно",
    monthly: language === "uz" ? "Oylik" : "Ежемесячно",
    safety: language === "uz" ? "Xavfsizlik" : "Безопасность",
    quality: language === "uz" ? "Sifat" : "Качество",
    productivity: language === "uz" ? "Samaradorlik" : "Производительность",
    machines: language === "uz" ? "Mashinalar" : "Машины",
    downloadPDF: language === "uz" ? "PDF yuklab olish" : "Скачать PDF",
    downloadExcel: language === "uz" ? "Excel yuklab olish" : "Скачать Excel",
    generating: language === "uz" ? "Yaratilmoqda..." : "Создание...",
    summary: language === "uz" ? "Umumiy ko'rsatkichlar" : "Общие показатели",
    violations: language === "uz" ? "Buzilishlar" : "Нарушения",
    defects: language === "uz" ? "Nuqsonlar" : "Дефекты",
    topEmployees: language === "uz" ? "Eng yaxshi xodimlar" : "Лучшие сотрудники",
    trend: language === "uz" ? "Trend tahlili" : "Анализ тенденций",
    noData: language === "uz" ? "Ma'lumot yo'q" : "Нет данных"
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const response = (await apiRequest('GET', `/api/camera-reports/generate-pdf?period=${reportPeriod}`)) as unknown as Response;
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `camera-report-${reportPeriod}-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      void import("@/lib/errorLogger").then(({ logClientError }) => logClientError(error, "camera-reports: PDF generation"));
    }
    setIsGenerating(false);
  };

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      const response = (await apiRequest('GET', `/api/camera-reports/generate-excel?period=${reportPeriod}`)) as unknown as Response;
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `camera-report-${reportPeriod}-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      void import("@/lib/errorLogger").then(({ logClientError }) => logClientError(error, "camera-reports: Excel generation"));
    }
    setIsGenerating(false);
  };

  const summaryData = [
    {
      title: language === "uz" ? "Xavfsizlik buzilishlari" : "Нарушения безопасности",
      value: safetyStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0,
      icon: Shield,
      color: "text-[var(--ep-primary)]",
      bg: "bg-orange-100"
    },
    {
      title: language === "uz" ? "Sifat nuqsonlari" : "Дефекты качества",
      value: qualityStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0,
      icon: CheckCircle,
      color: "text-[var(--ep-blue)]",
      bg: "bg-blue-100"
    },
    {
      title: language === "uz" ? "Top xodimlar" : "Лучшие сотрудники",
      value: safeArray<TopEmployee>(topEmployees).length,
      icon: Users,
      color: "text-[var(--ep-green)]",
      bg: "bg-green-100"
    }
  ];

  const safetyChartData = safeArray<SafetyStat>(safetyStats).map(s => ({
    name: s.violationType,
    count: s.count
  }));

  const qualityChartData = safeArray<QualityStat>(qualityStats).map(s => ({
    name: s.defectType,
    count: s.count
  }));

  const trendData = trendDataApi.length > 0 ? trendDataApi : [];

  if (loadingSafety || loadingQuality || loadingEmployees) {
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
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={reportPeriod} onValueChange={(v: "daily" | "weekly" | "monthly") => setReportPeriod(v)}>
            <SelectTrigger className="w-full sm:w-[140px] bg-background border-border rounded-lg h-9" data-testid="select-period">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="daily">{t.daily}</SelectItem>
              <SelectItem value="weekly">{t.weekly}</SelectItem>
              <SelectItem value="monthly">{t.monthly}</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={generatePDF} 
          disabled={isGenerating}
          className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold gap-2"
          data-testid="button-download-pdf"
        >
          <FileText className="h-4 w-4" />
          {isGenerating ? t.generating : t.downloadPDF}
        </Button>
        <Button 
          variant="outline" 
          onClick={generateExcel} 
          disabled={isGenerating}
          className="border-border text-foreground hover:bg-muted/40 rounded-lg px-5 py-2 text-sm font-semibold gap-2"
          data-testid="button-download-excel"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {isGenerating ? t.generating : t.downloadExcel}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Array.isArray(summaryData) ? summaryData : []).map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={`k-${index}`} className="bg-card border-none rounded-lg p-5" data-testid={`card-summary-${index}`}>
              <div className="flex flex-row items-center justify-between gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.title}</span>
                <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-4xl font-bold tracking-tight text-foreground">{item.value}</div>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="safety" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg">
          <TabsTrigger value="safety" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-safety">
            <Shield className="h-4 w-4 mr-2" />
            {t.safety}
          </TabsTrigger>
          <TabsTrigger value="quality" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-quality">
            <CheckCircle className="h-4 w-4 mr-2" />
            {t.quality}
          </TabsTrigger>
          <TabsTrigger value="employees" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-employees">
            <Users className="h-4 w-4 mr-2" />
            {t.topEmployees}
          </TabsTrigger>
          <TabsTrigger value="trend" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-trend">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t.trend}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="safety">
          <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
            <CardHeader className="bg-muted/40/50 py-4 px-6">
              <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-[var(--ep-primary)]" />
                {t.violations}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === "uz" ? "Xavfsizlik buzilishlari turlari bo'yicha" : "По типам нарушений безопасности"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={safetyChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: '#ddeaf3' }} />
                      <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={safetyChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={5}
                      >
                        {(Array.isArray(safetyChartData) ? safetyChartData : []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
            <CardHeader className="bg-muted/40/50 py-4 px-6">
              <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
                <CheckCircle className="h-5 w-5 text-[var(--ep-blue)]" />
                {t.defects}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === "uz" ? "Sifat nuqsonlari turlari bo'yicha" : "По типам дефектов качества"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qualityChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: '#ddeaf3' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={qualityChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={5}
                      >
                        {(Array.isArray(qualityChartData) ? qualityChartData : []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
            <CardHeader className="bg-muted/40/50 py-4 px-6">
              <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-[var(--ep-green)]" />
                {t.topEmployees}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === "uz" ? "Bugungi eng samarali xodimlar" : "Самые продуктивные сотрудники сегодня"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">#</TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{language === "uz" ? "Xodim ID" : "ID сотрудника"}</TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{language === "uz" ? "Smena" : "Смена"}</TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{language === "uz" ? "Faol vaqt" : "Активное время"}</TableHead>
                    <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{language === "uz" ? "Umumiy ball" : "Общий балл"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeArray<TopEmployee>(topEmployees).length > 0 ? (
                    safeArray<TopEmployee>(topEmployees).map((emp, index) => (
                      <TableRow key={emp.id} className="hover:bg-muted/40 transition-colors border-none" data-testid={`row-employee-${emp.id}`}>
                        <TableCell className="py-4 px-6">
                          <Badge className={`${index < 3 ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground"} border-none rounded-full w-6 h-6 p-0 flex items-center justify-center font-bold`}>
                            {index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 font-bold text-foreground">{emp.userId}</TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">{emp.shift}</TableCell>
                        <TableCell className="py-4 px-6 text-sm font-medium text-muted-foreground">{emp.activeTime} min</TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Progress value={emp.overallScore} className="w-20 h-1.5 bg-muted/60" />
                            <span className="text-sm font-bold text-foreground">{emp.overallScore}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-[13px] text-muted-foreground">
                        {t.noData}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
            <CardHeader className="bg-muted/40/50 py-4 px-6">
              <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-[var(--ep-purple)]" />
                {t.trend}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === "uz" ? "Haftalik trend tahlili" : "Анализ тенденций за неделю"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4fa" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: '#ddeaf3' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Line 
                      type="monotone" 
                      dataKey="safety" 
                      stroke="#f97316" 
                      name={language === "uz" ? "Xavfsizlik" : "Безопасность"}
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke="#3b82f6" 
                      name={language === "uz" ? "Sifat" : "Качество"}
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
