/**
 * @module camera-reports
 * @description Camera reports page. Composes header, summary, and per-tab
 *   content from sibling files (camera-reports-types, camera-reports-tabs)
 *   to respect the 300-line file budget.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { safeArray, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Calendar,
  Shield,
  CheckCircle,
  ArrowLeft,
  FileSpreadsheet,
  BarChart3,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { EPErrorState, EPPageHeader } from "@/components/ep";

import type {
  SafetyStat,
  QualityStat,
  TopEmployee,
  ReportLanguage,
  ReportPeriod,
} from "./camera-reports-types";
import { buildLabels, downloadReport } from "./camera-reports-types";
import { SafetyTab, QualityTab } from "./camera-reports-tabs";
import {
  EmployeesTab,
  TrendTab,
  ReportSummaryCards,
} from "./camera-reports-tabs-extra";

export default function CameraReports() {
  const [language, setLanguage] = useState<ReportLanguage>("uz");
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("daily");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: safetyStats, isLoading: loadingSafety, isError, error, refetch } = useQuery<SafetyStat[]>({
    queryKey: ["/api/camera-dashboard/safety-stats"],
  });

  const { data: qualityStats, isLoading: loadingQuality } = useQuery<QualityStat[]>({
    queryKey: ["/api/camera-dashboard/quality-stats"],
  });

  const { data: topEmployees, isLoading: loadingEmployees } = useQuery<TopEmployee[]>({
    queryKey: ["/api/camera-dashboard/top-employees"],
  });

  const { data: trendDataApi = [] } = useQuery<{ day: string; safety: number; quality: number }[]>({
    queryKey: ["/api/camera-dashboard/weekly-trend"],
  });

  const labels = buildLabels(language);

  async function handleDownload(format: "pdf" | "xlsx") {
    setIsGenerating(true);
    try {
      await downloadReport(format, reportPeriod, apiRequest);
    } catch (err) {
      void import("@/lib/errorLogger").then(({ logClientError }) =>
        logClientError(err, `camera-reports: ${format.toUpperCase()} generation`)
      );
    }
    setIsGenerating(false);
  }

  const safetyChartData = safeArray<SafetyStat>(safetyStats).map((s) => ({
    name: s.violationType,
    count: s.count,
  }));

  const qualityChartData = safeArray<QualityStat>(qualityStats).map((s) => ({
    name: s.defectType,
    count: s.count,
  }));

  const trendData = trendDataApi.length > 0 ? trendDataApi : [];

  if (loadingSafety || loadingQuality || loadingEmployees) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return <EPErrorState onRetry={refetch} error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-muted-foreground hover:bg-muted/40"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {labels.back}
              </Button>
            </Link>
          </div>
          <EPPageHeader
            breadcrumb={<><b className="text-foreground">{labels.title}</b></>}
            title={labels.title}
            subtitle={labels.subtitle}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={reportPeriod} onValueChange={(v: ReportPeriod) => setReportPeriod(v)}>
            <SelectTrigger
              className="w-full sm:w-[140px] bg-background border-border rounded-lg h-9"
              data-testid="select-period"
            >
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="daily">{labels.daily}</SelectItem>
              <SelectItem value="weekly">{labels.weekly}</SelectItem>
              <SelectItem value="monthly">{labels.monthly}</SelectItem>
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
          onClick={() => void handleDownload("pdf")}
          disabled={isGenerating}
          className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold gap-2"
          data-testid="button-download-pdf"
        >
          <FileText className="h-4 w-4" />
          {isGenerating ? labels.generating : labels.downloadPDF}
        </Button>
        <Button
          variant="outline"
          onClick={() => void handleDownload("xlsx")}
          disabled={isGenerating}
          className="border-border text-foreground hover:bg-muted/40 rounded-lg px-5 py-2 text-sm font-semibold gap-2"
          data-testid="button-download-excel"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {isGenerating ? labels.generating : labels.downloadExcel}
        </Button>
      </div>

      <ReportSummaryCards
        language={language}
        safetyStats={safetyStats}
        qualityStats={qualityStats}
        topEmployees={topEmployees}
      />

      <Tabs defaultValue="safety" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg">
          <TabsTrigger value="safety" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-safety">
            <Shield className="h-4 w-4 mr-2" />
            {labels.safety}
          </TabsTrigger>
          <TabsTrigger value="quality" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-quality">
            <CheckCircle className="h-4 w-4 mr-2" />
            {labels.quality}
          </TabsTrigger>
          <TabsTrigger value="employees" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-employees">
            <Users className="h-4 w-4 mr-2" />
            {labels.topEmployees}
          </TabsTrigger>
          <TabsTrigger value="trend" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-trend">
            <BarChart3 className="h-4 w-4 mr-2" />
            {labels.trend}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="safety">
          <SafetyTab labels={labels} language={language} safetyChartData={safetyChartData} />
        </TabsContent>
        <TabsContent value="quality">
          <QualityTab labels={labels} language={language} qualityChartData={qualityChartData} />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeesTab labels={labels} language={language} topEmployees={topEmployees} />
        </TabsContent>
        <TabsContent value="trend">
          <TrendTab labels={labels} language={language} trendData={trendData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
