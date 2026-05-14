/**
 * @module CameraLiveMonitoringSections
 * @description Tab content section components for CameraLiveMonitoring.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Activity, Clock, AlertCircle, CheckCircle2, RefreshCw, Play, Maximize2, Grid } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Camera, CameraWithDetections, LiveDetection } from "./CameraLiveMonitoringTypes";
import { getConfidenceColor, getTimeSinceDetection } from "./CameraLiveMonitoringTypes";

// ---------------------------------------------------------------------------
// Video Grid tab
// ---------------------------------------------------------------------------

interface VideoTabProps {
  camerasLoading: boolean;
  streamCameras: Camera[];
  selectedVideoCamera: string | null;
  onSelectCamera: (id: string) => void;
  onExitFullscreen: () => void;
  gridSize: 2 | 3 | 4;
}

export function VideoTab({
  camerasLoading,
  streamCameras,
  selectedVideoCamera,
  onSelectCamera,
  onExitFullscreen,
  gridSize,
}: VideoTabProps) {
  if (camerasLoading) {
    return (
      <div className="text-center py-24 bg-card rounded-lg border-none">
        <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary opacity-20" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-4">Yuklanmoqda...</p>
      </div>
    );
  }

  if (streamCameras.length === 0) {
    return (
      <Card className="bg-card border-none rounded-lg py-24 text-center">
        <Play className="h-16 w-16 mx-auto text-muted-foreground opacity-10 mb-6" />
        <p className="text-foreground font-bold">Jonli streamlar topilmadi</p>
        <p className="text-sm text-muted-foreground mt-2">Kameralarni boshqaruv sahifasidan sozlang</p>
      </Card>
    );
  }

  if (selectedVideoCamera) {
    const cam = (Array.isArray(streamCameras) ? streamCameras : []).find(c => c.id === selectedVideoCamera);
    return (
      <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
        <CardHeader className="bg-muted/40/50 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {cam?.name}
            </CardTitle>
            <CardDescription className="text-muted-foreground">{cam?.location || ""}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onExitFullscreen}
            className="rounded-lg hover:bg-muted/40 text-muted-foreground gap-2"
            data-testid="button-exit-fullscreen">
            <Grid className="h-4 w-4" />
            Grid ko'rinishga qaytish
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            <iframe
              src={cam?.streamUrl || ""}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid={`video-fullscreen-${selectedVideoCamera}`}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const gridClass = gridSize === 2
    ? "grid-cols-1 md:grid-cols-2"
    : gridSize === 3
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-6 ${gridClass}`}>
      {(Array.isArray(streamCameras) ? streamCameras : []).slice(0, gridSize * gridSize).map((camera) => (
        <Card key={camera.id} className="bg-card border-none rounded-lg overflow-hidden shadow-none group transition-all hover:ring-2 hover:ring-primary/20"
          data-testid={`card-video-${camera.code}`}>
          <CardHeader className="bg-muted/40/50 py-2 px-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <CardTitle className="text-xs font-bold truncate text-foreground">{camera.name}</CardTitle>
            </div>
            <Button variant="ghost" size="icon"
              className="h-6 w-6 rounded-md hover:bg-muted/60 text-muted-foreground"
              onClick={() => onSelectCamera(camera.id)}
              data-testid={`button-fullscreen-${camera.code}`}>
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
              <div className="absolute inset-x-0 bottom-0 from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{camera.location || camera.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grouped tab
// ---------------------------------------------------------------------------

interface GroupedTabProps {
  groupedLoading: boolean;
  groupedData: CameraWithDetections[] | undefined;
}

export function GroupedTab({ groupedLoading, groupedData }: GroupedTabProps) {
  if (groupedLoading) {
    return (
      <div className="text-center py-24 bg-card rounded-lg border-none">
        <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary opacity-20" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-4">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!groupedData || groupedData.length === 0) {
    return (
      <Card className="bg-card border-none rounded-lg py-24 text-center">
        <Video className="h-16 w-16 mx-auto text-muted-foreground opacity-10 mb-6" />
        <p className="text-foreground font-bold">Faol kameralar topilmadi</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(Array.isArray(groupedData) ? groupedData : []).map((item) => (
        <Card key={item.camera.id} className="bg-card border-none rounded-lg overflow-hidden shadow-none hover-elevate transition-all"
          data-testid={`card-camera-${item.camera.code}`}>
          <CardHeader className="bg-muted/40/50 py-4 px-6 flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
                <Video className="h-4 w-4 text-[var(--ep-blue)]" />
                {item.camera.name}
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground flex items-center gap-2">
                <span className="font-bold text-primary text-[10px] uppercase tracking-widest">{item.camera.code}</span>
                <span className="h-1 w-1 rounded-full bg-outline-variant" />
                <span>{item.camera.location || "Joylashuv ko'rsatilmagan"}</span>
              </CardDescription>
            </div>
            <Badge className={`${item.lastDetectionTime ? 'bg-green-500/10 text-[var(--ep-green)]' : 'bg-muted/60 text-muted-foreground'} border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-none`}>
              {item.lastDetectionTime ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> : <AlertCircle className="h-3 w-3 mr-1.5" />}
              {item.lastDetectionTime ? "Faol" : "Tinch"}
            </Badge>
          </CardHeader>
          <CardContent className="p-6">
            {item.detections.length === 0 ? (
              <div className="text-center py-12 bg-background rounded-lg border border-dashed border-border">
                <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hali aniqlashlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  Oxirgi aniqlashlar
                  <Badge className="bg-primary/10 text-primary border-none rounded-full h-5 min-w-5 flex items-center justify-center font-bold px-1.5">{item.detections.length}</Badge>
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {(Array.isArray(item.detections) ? item.detections : []).map((det, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
                      data-testid={`detection-${item.camera.code}-${idx}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-muted/60 text-muted-foreground text-[10px] font-bold">
                            {det.employee?.fullName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{det.employee?.fullName || "Noma'lum"}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                            {det.detection.detectionDate} • {det.detection.detectionTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`${getConfidenceColor(det.detection.confidence) === 'default' ? 'bg-green-500/10 text-[var(--ep-green)]' : getConfidenceColor(det.detection.confidence) === 'destructive' ? 'bg-red-500/10 text-[var(--ep-red)]' : 'bg-muted/60 text-muted-foreground'} border-none rounded-full px-2 py-0.5 text-[10px] font-bold`}>
                          {det.detection.confidence ? `${(det.detection.confidence * 100).toFixed(0)}%` : "N/A"}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter whitespace-nowrap w-24 text-right">
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
  );
}

// ---------------------------------------------------------------------------
// Stream tab
// ---------------------------------------------------------------------------

interface StreamTabProps {
  streamLoading: boolean;
  streamData: LiveDetection[] | undefined;
}

export function StreamTab({ streamLoading, streamData }: StreamTabProps) {
  return (
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
            <div key={idx} className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
              data-testid={`stream-detection-${idx}`}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold">
                  {item.employee?.fullName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="font-medium">{item.employee?.fullName || "Noma'lum xodim"}</p>
                  <p className="text-sm text-muted-foreground">ID: {item.employee?.employeeId || "N/A"}</p>
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
                  <span className="text-xs text-muted-foreground">{getTimeSinceDetection(item.detection.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  );
}
