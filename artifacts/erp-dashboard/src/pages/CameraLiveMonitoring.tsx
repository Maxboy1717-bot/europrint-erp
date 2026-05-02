import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Activity, Users, Clock, AlertCircle, CheckCircle2, RefreshCw, Play, Maximize2, Grid, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { ErrorState } from "@/components/ui/error-state";

interface Detection {
  id: string;
  cameraId: string;
  userId: string | null;
  detectionDate: string;
  detectionTime: string;
  zoneName: string | null;
  confidence: number | null;
  createdAt: string;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
}

interface Camera {
  id: string;
  code: string;
  name: string;
  location: string | null;
  streamUrl?: string | null;
  streamType?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
}

interface LiveDetection {
  detection: Detection;
  camera: Camera;
  employee: Employee | null;
}

interface CameraWithDetections {
  camera: {
    id: string;
    code: string;
    name: string;
    nameRu?: string | null;
    location?: string | null;
    isActive: boolean;
  };
  detections: Array<{
    detection: Detection;
    employee: Employee | null;
  }>;
  lastDetectionTime: string | null;
}

export default function CameraLiveMonitoring() {
  const [activeTab, setActiveTab] = useState<"video" | "grouped" | "stream">("video");
  const [selectedCamera, setSelectedCamera] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(2);
  const [selectedVideoCamera, setSelectedVideoCamera] = useState<string | null>(null);
  const [mutedCameras, setMutedCameras] = useState<Set<string>>(new Set());

  // All cameras for video streaming
  const { data: allCameras, isLoading: camerasLoading, isError, refetch} = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Get cameras with active streams
  const streamCameras = allCameras?.filter(c => c.streamUrl && c.isActive !== false) || [];

  // Grouped detections by camera
  const { data: groupedData, isLoading: groupedLoading } = useQuery<CameraWithDetections[]>({
    queryKey: ["/api/erp/cameras/grouped-detections"],
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
  });

  // Live detections stream
  const { data: streamData, isLoading: streamLoading } = useQuery<LiveDetection[]>({
    queryKey: ["/api/erp/cameras/live-detections", selectedCamera !== "all" ? selectedCamera : null],
    queryFn: async () => {
      const url = selectedCamera !== "all" 
        ? `/api/erp/cameras/live-detections?cameraId=${selectedCamera}`
        : '/api/erp/cameras/live-detections';
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch detections');
      return response.json();
    },
    refetchInterval: autoRefresh ? 5000 : false, // Faster refresh for stream view
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/erp/cameras/live-detections"] });
    queryClient.invalidateQueries({ queryKey: ["/api/erp/cameras/grouped-detections"] });
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return "secondary";
    if (confidence >= 0.9) return "default";
    if (confidence >= 0.75) return "secondary";
    return "destructive";
  };

  const getTimeSinceDetection = (timestamp: string) => {
    const now = new Date();
    const detected = new Date(timestamp);
    const diffMs = now.getTime() - detected.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Hozir";
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} soat oldin`;
    return `${Math.floor(diffMins / 1440)} kun oldin`;
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              Jonli Kamera <span className="font-bold text-primary">Monitoring</span>
            </h1>
            <p className="text-on-surface-variant mt-1">
              Real-time xodim aniqlash va kuzatuv tizimi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`rounded-lg ${autoRefresh ? 'bg-primary text-white' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
              data-testid="button-toggle-refresh"
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? "Auto-yangilash (ON)" : "Auto-yangilash (OFF)"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="rounded-lg border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
              data-testid="button-manual-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-surface-container-lowest border-none rounded-lg p-5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Faol Kameralar</span>
              <span className="text-4xl font-bold tracking-tight text-on-surface" data-testid="stat-active-cameras">
                {groupedData?.length || 0}
              </span>
            </div>
          </Card>

          <Card className="bg-surface-container-lowest border-none rounded-lg p-5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Bugungi Aniqlashlar</span>
              <span className="text-4xl font-bold tracking-tight text-on-surface" data-testid="stat-today-detections">
                {streamData?.filter(d => d.detection.detectionDate === new Date().toISOString().split('T')[0]).length || 0}
              </span>
            </div>
          </Card>

          <Card className="bg-surface-container-lowest border-none rounded-lg p-5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Jami Aniqlashlar</span>
              <span className="text-4xl font-bold tracking-tight text-on-surface" data-testid="stat-total-detections">
                {streamData?.length || 0}
              </span>
            </div>
          </Card>

          <Card className="bg-surface-container-lowest border-none rounded-lg p-5">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">O'rtacha Ishonch</span>
              <span className="text-4xl font-bold tracking-tight text-primary" data-testid="stat-avg-confidence">
                {streamData && streamData.length > 0
                  ? (((Array.isArray(streamData) ? streamData : []).reduce((sum, d) => sum + (d.detection.confidence || 0), 0) / streamData.length) * 100).toFixed(1)
                  : "0"}%
              </span>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "video" | "grouped" | "stream")} className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <TabsList className="bg-surface-container-low p-1 rounded-lg" data-testid="tabs-view-mode">
              <TabsTrigger value="video" className="rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-video">
                <Play className="h-4 w-4 mr-2" />
                Jonli Video
              </TabsTrigger>
              <TabsTrigger value="grouped" className="rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-grouped">
                <Video className="h-4 w-4 mr-2" />
                Kameralar bo'yicha
              </TabsTrigger>
              <TabsTrigger value="stream" className="rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-stream">
                <Activity className="h-4 w-4 mr-2" />
                Jonli oqim
              </TabsTrigger>
            </TabsList>

            {activeTab === "video" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mr-2">Grid:</span>
                <div className="flex rounded-lg border border-outline-variant overflow-hidden">
                  <Button
                    variant={gridSize === 2 ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none px-4"
                    onClick={() => setGridSize(2)}
                    data-testid="button-grid-2"
                  >
                    2x2
                  </Button>
                  <Button
                    variant={gridSize === 3 ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none px-4"
                    onClick={() => setGridSize(3)}
                    data-testid="button-grid-3"
                  >
                    3x3
                  </Button>
                  <Button
                    variant={gridSize === 4 ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none px-4"
                    onClick={() => setGridSize(4)}
                    data-testid="button-grid-4"
                  >
                    4x4
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "stream" && (
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger className="w-64 bg-surface border-outline-variant rounded-lg h-10" data-testid="select-camera">
                  <SelectValue placeholder="Kamerani tanlang" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-lowest border-outline-variant">
                  <SelectItem value="all">Barcha kameralar</SelectItem>
                  {groupedData?.map((item) => (
                    <SelectItem key={item.camera.id} value={item.camera.id}>
                      {item.camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Video Grid View */}
          <TabsContent value="video" className="mt-0">
            {camerasLoading ? (
              <div className="text-center py-24 bg-surface-container-lowest rounded-lg border-none">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary opacity-20" />
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-4">Yuklanmoqda...</p>
              </div>
            ) : streamCameras.length === 0 ? (
              <Card className="bg-surface-container-lowest border-none rounded-lg py-24 text-center">
                <Play className="h-16 w-16 mx-auto text-on-surface-variant opacity-10 mb-6" />
                <p className="text-on-surface font-bold">Jonli streamlar topilmadi</p>
                <p className="text-sm text-on-surface-variant mt-2">Kameralarni boshqaruv sahifasidan sozlang</p>
              </Card>
            ) : selectedVideoCamera ? (
              /* Full screen single camera view */
              <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
                <CardHeader className="bg-surface-container-low/50 py-4 px-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      {(streamCameras ?? []).find(c => c.id === selectedVideoCamera)?.name}
                    </CardTitle>
                    <CardDescription className="text-on-surface-variant">
                      {(streamCameras ?? []).find(c => c.id === selectedVideoCamera)?.location || ""}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVideoCamera(null)}
                    className="rounded-lg hover:bg-surface-container-low text-on-surface-variant"
                    data-testid="button-exit-fullscreen"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Grid ko'rinishga qaytish
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black">
                    <iframe
                      src={(streamCameras ?? []).find(c => c.id === selectedVideoCamera)?.streamUrl || ""}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      data-testid={`video-fullscreen-${selectedVideoCamera}`}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Multi-camera grid view */
              <div className={`grid gap-6 ${gridSize === 2 ? 'grid-cols-1 md:grid-cols-2' : gridSize === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {(Array.isArray(streamCameras) ? streamCameras : []).slice(0, gridSize * gridSize).map((camera) => (
                  <Card key={camera.id} className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none group transition-all hover:ring-2 hover:ring-primary/20" data-testid={`card-video-${camera.code}`}>
                    <CardHeader className="bg-surface-container-low/50 py-2 px-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <CardTitle className="text-xs font-bold truncate text-on-surface">{camera.name}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-surface-container text-on-surface-variant"
                        onClick={() => setSelectedVideoCamera(camera.id)}
                        data-testid={`button-fullscreen-${camera.code}`}
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-black">
                        <iframe
                          src={camera.streamUrl || ""}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          data-testid={`video-stream-${camera.code}`}
                        />
                        {/* Overlay with camera info */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{camera.location || camera.code}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Grouped View */}
          <TabsContent value="grouped" className="mt-0">
            {groupedLoading ? (
              <div className="text-center py-24 bg-surface-container-lowest rounded-lg border-none">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary opacity-20" />
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-4">Yuklanmoqda...</p>
              </div>
            ) : !groupedData || groupedData.length === 0 ? (
              <Card className="bg-surface-container-lowest border-none rounded-lg py-24 text-center">
                <Video className="h-16 w-16 mx-auto text-on-surface-variant opacity-10 mb-6" />
                <p className="text-on-surface font-bold">Faol kameralar topilmadi</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(Array.isArray(groupedData) ? groupedData : []).map((item) => (
                  <Card key={item.camera.id} className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none hover-elevate transition-all" data-testid={`card-camera-${item.camera.code}`}>
                    <CardHeader className="bg-surface-container-low/50 py-4 px-6 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
                          <Video className="h-5 w-5 text-blue-500" />
                          {item.camera.name}
                        </CardTitle>
                        <CardDescription className="mt-1 text-on-surface-variant flex items-center gap-2">
                          <span className="font-bold text-primary text-[10px] uppercase tracking-widest">{item.camera.code}</span>
                          <span className="h-1 w-1 rounded-full bg-outline-variant" />
                          <span>{item.camera.location || "Joylashuv ko'rsatilmagan"}</span>
                        </CardDescription>
                      </div>
                      <Badge className={`${item.lastDetectionTime ? 'bg-green-500/10 text-green-600' : 'bg-surface-container text-on-surface-variant'} border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-none`}>
                        {item.lastDetectionTime ? (
                          <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1.5" />
                        )}
                        {item.lastDetectionTime ? "Faol" : "Tinch"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6">
                      {item.detections.length === 0 ? (
                        <div className="text-center py-12 bg-surface rounded-lg border border-dashed border-outline-variant">
                          <Clock className="h-10 w-10 mx-auto mb-3 text-on-surface-variant opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Hali aniqlashlar yo'q</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                            Oxirgi aniqlashlar
                            <Badge className="bg-primary/10 text-primary border-none rounded-full h-5 min-w-5 flex items-center justify-center font-bold px-1.5">{item.detections.length}</Badge>
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {(Array.isArray(item.detections) ? item.detections : []).map((det, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-outline-variant hover:border-primary/30 transition-colors"
                                data-testid={`detection-${item.camera.code}-${idx}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-outline-variant">
                                    <AvatarFallback className="bg-surface-container text-on-surface-variant text-[10px] font-bold">
                                      {det.employee?.fullName?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-on-surface">
                                      {det.employee?.fullName || "Noma'lum"}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                                      {det.detection.detectionDate} • {det.detection.detectionTime}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge className={`${getConfidenceColor(det.detection.confidence) === 'default' ? 'bg-green-500/10 text-green-600' : getConfidenceColor(det.detection.confidence) === 'destructive' ? 'bg-red-500/10 text-red-600' : 'bg-surface-container text-on-surface-variant'} border-none rounded-full px-2 py-0.5 text-[10px] font-bold`}>
                                    {det.detection.confidence ? `${(det.detection.confidence * 100).toFixed(0)}%` : "N/A"}
                                  </Badge>
                                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter whitespace-nowrap w-24 text-right">
                                    {getTimeSinceDetection(det.detection.createdAt)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Stream View */}
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
              <CardContent>
                {streamLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Yuklanmoqda...</p>
                  </div>
                ) : !streamData || streamData.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aniqlashlar topilmadi</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {(Array.isArray(streamData) ? streamData : []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                        data-testid={`stream-detection-${idx}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {item.employee?.fullName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium">{item.employee?.fullName || "Noma'lum xodim"}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {item.employee?.employeeId || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <p className="text-muted-foreground">Kamera</p>
                            <p className="font-medium">{item.camera.name}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Zona</p>
                            <p className="font-medium">{item.detection.zoneName || "N/A"}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Vaqt</p>
                            <p className="font-medium">{item.detection.detectionTime}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Ishonch</p>
                            <Badge variant={getConfidenceColor(item.detection.confidence)}>
                              {item.detection.confidence ? `${(item.detection.confidence * 100).toFixed(0)}%` : "N/A"}
                            </Badge>
                          </div>

                          <div>
                            <span className="text-xs text-muted-foreground">
                              {getTimeSinceDetection(item.detection.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
