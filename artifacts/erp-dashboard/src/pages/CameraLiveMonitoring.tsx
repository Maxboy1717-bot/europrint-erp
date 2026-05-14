/**
 * @module CameraLiveMonitoring
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Activity, Play } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Camera, CameraWithDetections, LiveDetection } from "./CameraLiveMonitoringTypes";
import { HeaderControls, StatsCards } from "./CameraLiveMonitoringDialogs";
import { VideoTab, GroupedTab, StreamTab } from "./CameraLiveMonitoringSections";
import { EPErrorState, EPPageHeader } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
export default function CameraLiveMonitoring() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<"video" | "grouped" | "stream">("video");
  const [selectedCamera, setSelectedCamera] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(2);
  const [selectedVideoCamera, setSelectedVideoCamera] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const { data: allCameras, isLoading: camerasLoading, isError, refetch } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
    enabled: !!isAuthenticated,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const streamCameras = allCameras?.filter(c => c.streamUrl && c.isActive !== false) || [];

  const { data: groupedData, isLoading: groupedLoading } = useQuery<CameraWithDetections[]>({
    queryKey: ["/api/erp/cameras/grouped-detections"],
    enabled: !!isAuthenticated,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: streamData, isLoading: streamLoading } = useQuery<LiveDetection[]>({
    queryKey: ["/api/erp/cameras/live-detections", selectedCamera !== "all" ? selectedCamera : null],
    queryFn: async () => {
      const url = selectedCamera !== "all"
        ? `/api/erp/cameras/live-detections?cameraId=${selectedCamera}`
        : "/api/erp/cameras/live-detections";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch detections");
      return response.json();
    },
    enabled: !!isAuthenticated,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/erp/cameras/live-detections"] });
    queryClient.invalidateQueries({ queryKey: ["/api/erp/cameras/grouped-detections"] });
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = streamData?.filter(d => d.detection.detectionDate === todayStr).length ?? 0;
  const totalCount = streamData?.length ?? 0;
  const avgConf = streamData && streamData.length > 0
    ? (((Array.isArray(streamData) ? streamData : []).reduce((sum, d) => sum + (d.detection.confidence || 0), 0) / streamData.length) * 100).toFixed(1)
    : "0";

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Jonli Kamera Monitoring</b></>}
        title="Jonli Kamera Monitoring"
        subtitle="Real-time xodim aniqlash va kuzatuv tizimi"
      />
          </div>
          <HeaderControls
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={() => setAutoRefresh(v => !v)}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Stats */}
        <StatsCards
          activeCamerasCount={groupedData?.length ?? 0}
          todayDetectionsCount={todayCount}
          totalDetectionsCount={totalCount}
          avgConfidence={avgConf}
        />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "video" | "grouped" | "stream")} className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <TabsList className="bg-muted/40 p-1 rounded-lg" data-testid="tabs-view-mode">
              <TabsTrigger value="video" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-video">
                <Play className="h-4 w-4 mr-2" />Jonli Video
              </TabsTrigger>
              <TabsTrigger value="grouped" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-grouped">
                <Video className="h-4 w-4 mr-2" />Kameralar bo'yicha
              </TabsTrigger>
              <TabsTrigger value="stream" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-stream">
                <Activity className="h-4 w-4 mr-2" />Jonli oqim
              </TabsTrigger>
            </TabsList>

            {activeTab === "video" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">{t('grid')}</span>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <Button variant={gridSize === 2 ? "default" : "ghost"} size="sm" className="rounded-none px-4" onClick={() => setGridSize(2)} data-testid="button-grid-2">2x2</Button>
                  <Button variant={gridSize === 3 ? "default" : "ghost"} size="sm" className="rounded-none px-4" onClick={() => setGridSize(3)} data-testid="button-grid-3">3x3</Button>
                  <Button variant={gridSize === 4 ? "default" : "ghost"} size="sm" className="rounded-none px-4" onClick={() => setGridSize(4)} data-testid="button-grid-4">4x4</Button>
                </div>
              </div>
            )}

            {activeTab === "stream" && (
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger className="w-64 bg-background border-border rounded-lg h-9" data-testid="select-camera">
                  <SelectValue placeholder="Kamerani tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Barcha kameralar</SelectItem>
                  {groupedData?.map((item) => (
                    <SelectItem key={item.camera.id} value={item.camera.id}>{item.camera.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <TabsContent value="video" className="mt-0">
            <VideoTab
              camerasLoading={camerasLoading}
              streamCameras={streamCameras}
              selectedVideoCamera={selectedVideoCamera}
              onSelectCamera={setSelectedVideoCamera}
              onExitFullscreen={() => setSelectedVideoCamera(null)}
              gridSize={gridSize}
            />
          </TabsContent>

          <TabsContent value="grouped" className="mt-0">
            <GroupedTab groupedLoading={groupedLoading} groupedData={groupedData} />
          </TabsContent>

          <TabsContent value="stream">
            <Card>
              <CardHeader>
                <CardTitle>Jonli Aniqlashlar Oqimi</CardTitle>
                <CardDescription>
                  {selectedCamera === "all"
                    ? "Barcha kameralardan kelayotgan aniqlashlar"
                    : `${groupedData?.find(c => c.camera.id === selectedCamera)?.camera.name || "Tanlangan kamera"} dan aniqlashlar`
                  }
                </CardDescription>
              </CardHeader>
              <StreamTab streamLoading={streamLoading} streamData={streamData} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
