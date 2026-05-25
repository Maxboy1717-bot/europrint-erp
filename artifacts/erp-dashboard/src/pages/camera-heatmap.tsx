/**
 * @module camera-heatmap
 * @description Route-level page component for the Camera Heatmap feature.
 *              Owns all state and React Query hooks; delegates rendering to
 *              camera-heatmap-controls, camera-heatmap-general,
 *              camera-heatmap-employee, and camera-heatmap-zone.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { safeArray } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, User, Building2 } from "lucide-react";
import { Link } from "wouter";
import {
  ZONE_COLORS,
  UZ_TRANSLATIONS,
  RU_TRANSLATIONS,
  type HeatmapData,
  type HeatmapCell,
  type Employee,
  type EmployeeHeatmapData,
  type Department,
  type ZoneActivityResponse,
  type Language,
  type Period,
  type Metric,
  type ViewMode,
  type Zone,
} from "./camera-heatmap-types";
import { HeatmapControls } from "./camera-heatmap-controls";
import { GeneralTabContent }  from "./camera-heatmap-general";
import { EmployeeTabContent } from "./camera-heatmap-employee";
import { ZoneTabContent }     from "./camera-heatmap-zone";
import { apiRequest } from '@/lib/queryClient';
import { EPPageHeader } from "@/components/ep";

export default function CameraHeatmap() {
  const { isAuthenticated } = useAuth();

  const [language, setLanguage]                         = useState<Language>("uz");
  const [selectedPeriod, setSelectedPeriod]             = useState<Period>("today");
  const [selectedMetric, setSelectedMetric]             = useState<Metric>("movement");
  const [viewMode, setViewMode]                         = useState<ViewMode>("general");
  const [selectedEmployeeId, setSelectedEmployeeId]     = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const t = language === "uz" ? UZ_TRANSLATIONS : RU_TRANSLATIONS;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: heatmapResponse, isLoading } = useQuery<HeatmapData>({
    queryKey: ["/api/camera-heatmap/data", selectedPeriod, selectedMetric],
    queryFn: async () => {
      return await apiRequest('GET', `/api/camera-heatmap/data?period=${selectedPeriod}&metric=${selectedMetric}`);
    },
    enabled: !!isAuthenticated,
  });

  const { data: employeesList } = useQuery<Employee[]>({
    queryKey: ["/api/camera-heatmap/employees"],
    enabled: !!isAuthenticated,
  });

  const { data: employeeHeatmap, isLoading: employeeLoading } = useQuery<EmployeeHeatmapData>({
    queryKey: ["/api/camera-heatmap/employee", selectedEmployeeId, selectedPeriod],
    queryFn: async () => {
      return await apiRequest('GET', `/api/camera-heatmap/employee/${selectedEmployeeId}?period=${selectedPeriod}`);
    },
    enabled: !!isAuthenticated && !!selectedEmployeeId && viewMode === "employee",
  });

  const { data: departmentsList } = useQuery<Department[]>({
    queryKey: ["/api/erp/team-analytics/departments"],
    enabled: !!isAuthenticated,
  });

  const { data: zoneActivityResponse, isLoading: zoneActivityLoading } =
    useQuery<ZoneActivityResponse>({
      queryKey: ["/api/erp/team-analytics/zone-activity", selectedDepartmentId, selectedPeriod],
      queryFn: async () => {
        return await apiRequest('GET', `/api/erp/team-analytics/zone-activity/${selectedDepartmentId}?period=${selectedPeriod}`);
      },
      enabled: !!isAuthenticated && !!selectedDepartmentId && viewMode === "zone",
    });

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const zones = safeArray<Zone>(heatmapResponse?.zones).map(z => ({
    ...z,
    name:  language === "uz" ? z.name : z.nameRu,
    color: ZONE_COLORS[z.id] ?? "bg-gray-500",
  }));

  const heatmapData: HeatmapCell[] = Array.isArray(heatmapResponse?.heatmapData)
    ? heatmapResponse.heatmapData
    : [];

  const hotspots = heatmapData
    .filter(c => c.intensity > 0.7)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button
                variant="ghost" size="sm"
                className="rounded-lg text-muted-foreground hover:bg-muted/40"
                data-testid="button-back"
              >
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

        <HeatmapControls
          language={language}           onLanguageChange={setLanguage}
          selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod}
          viewMode={viewMode}
          selectedMetric={selectedMetric} onMetricChange={setSelectedMetric}
          selectedEmployeeId={selectedEmployeeId} onEmployeeChange={setSelectedEmployeeId}
          employeesList={employeesList}
          selectedDepartmentId={selectedDepartmentId} onDepartmentChange={setSelectedDepartmentId}
          departmentsList={departmentsList}
          t={t}
        />
      </div>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg">
          <TabsTrigger value="general" data-testid="tab-general"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />{t.generalView}
          </TabsTrigger>
          <TabsTrigger value="employee" data-testid="tab-employee"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <User className="h-4 w-4 mr-2" />{t.employeeView}
          </TabsTrigger>
          <TabsTrigger value="zone" data-testid="tab-zone"
            className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4 mr-2" />{t.zoneActivityView}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTabContent heatmapData={heatmapData} zones={zones} hotspots={hotspots} t={t} />
        </TabsContent>

        <TabsContent value="employee">
          <EmployeeTabContent
            selectedEmployeeId={selectedEmployeeId}
            employeeLoading={employeeLoading}
            employeeHeatmap={employeeHeatmap}
            t={t}
          />
        </TabsContent>

        <TabsContent value="zone">
          <ZoneTabContent
            selectedDepartmentId={selectedDepartmentId}
            zoneActivityLoading={zoneActivityLoading}
            zoneActivityResponse={zoneActivityResponse}
            language={language}
            selectedPeriod={selectedPeriod}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
