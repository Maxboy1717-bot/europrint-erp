import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Users, MapPin, Flame, MapPinOff, Factory, Bus,
  Clock, Navigation, Sparkles, RefreshCw, Route,
  ChevronDown, ChevronRight, Home
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const FACTORY_LAT = 40.555645;
const FACTORY_LNG = 70.927983;

const GROUP_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

const createEmployeeIcon = (color: string) => {
  const svg = `<svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 32 16 32s16-20 16-32c0-8.8-7.2-16-16-16z"
      fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
};

const factoryIcon = L.divIcon({
  html: `<div style="background:#1e40af;width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 20V8l6-4v4l6-4v4l6-4v16H2zm2-2h16V9.6l-6 4V9.6l-6 4V9.6l-4 2.67V18z"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

const homeIcon = (color: string) => L.divIcon({
  html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

interface Employee {
  id: string;
  fullName: string;
  departmentName: string;
  positionName: string;
  latitude: number | null;
  longitude: number | null;
  lat: number | null;
  lng: number | null;
  shift?: string;
  status: string;
  address?: string;
  profileImageUrl?: string;
}

interface TransportEmployee {
  id: string;
  fullName: string;
  lat: number;
  lng: number;
  address: string;
  department: string;
  distanceKm: number;
  direction: string;
  travelMinutes: number;
}

interface TransportGroup {
  id: string;
  name: string;
  color: string;
  departureTime: string;
  totalMinutes: number;
  employeeIds: string[];
  route: string;
  driverNote: string;
  employees: TransportEmployee[];
}

interface TransportResult {
  groups: TransportGroup[];
  summary: string;
  factoryLat: number;
  factoryLng: number;
  generatedAt: string;
}

interface MapStats {
  total: { employees: number };
  byDepartment: Array<{ departmentName: string; count: number }>;
  byShift: Array<{ shift: string; count: number }>;
  byDistrict: Array<{ district: string; count: number }>;
  factoryLat?: number;
  factoryLng?: number;
}

function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, []);
  return null;
}

function HeatmapLayer({ employees }: { employees: Employee[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = (Array.isArray(employees) ? employees : []).filter(e => e.lat != null && e.lng != null);
    if (!valid.length) return;
    type LeafletWithHeat = typeof L & { heatLayer: (coords: [number, number, number][], options?: Record<string, unknown>) => L.Layer };
    const heatLayer = (L as LeafletWithHeat).heatLayer(
      (Array.isArray(valid) ? valid : []).map(e => [e.lat, e.lng, 1.0] as [number, number, number]),
      { radius: 25, blur: 35, maxZoom: 17, gradient: { 0: "#3b82f6", 0.5: "#f59e0b", 1: "#ef4444" } }
    );
    heatLayer.addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [map, employees]);
  return null;
}

export default function HRMap() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"markers" | "heatmap" | "routes">("markers");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: employees = [], isLoading: empLoading, isError, refetch } = useQuery<Employee[]>({
    queryKey: [selectedDepartment === "all" ? "/api/hr-map/employees" : `/api/hr-map/employees?departmentId=${selectedDepartment}`],
  });

  const { data: departments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/departments"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MapStats>({
    queryKey: ["/api/hr-map/stats"],
  });

  const {
    data: transportData,
    isPending: transportLoading,
    mutate: generateRoutes,
  } = useMutation<TransportResult>({
    mutationFn: () => apiRequest("GET", "/api/hr-map/transport-groups"),
    onSuccess: () => {
      toast({ title: "AI marshrutlar tayyor!", description: "Guruhlar va vaqtlar hisoblandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Marshrutlarni hisoblashda xatolik yuz berdi", variant: "destructive" });
    },
  });

  const validEmployees = (Array.isArray(employees) ? employees : []).filter(e => e.lat != null && e.lng != null);
  const factoryCenter: [number, number] = [FACTORY_LAT, FACTORY_LNG];

  if (isError) return <ErrorState onRetry={refetch} />;

  if (empLoading || statsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {([1,2,3]).map(i => <Skeleton key={`k-${i}`} className="h-24" />)}
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Xodimlar Geoxaritasi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Europrint zavodi • 40.5556°N, 70.9280°E • {validEmployees.length} xodim xaritada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "markers" ? "default" : "outline"} size="sm"
            onClick={() => setViewMode("markers")} data-testid="button-view-markers"
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />Markerlar
          </Button>
          <Button
            variant={viewMode === "heatmap" ? "default" : "outline"} size="sm"
            onClick={() => setViewMode("heatmap")} data-testid="button-view-heatmap"
          >
            <Flame className="h-3.5 w-3.5 mr-1.5" />Zichlik
          </Button>
          <Button
            variant={viewMode === "routes" ? "default" : "outline"} size="sm"
            onClick={() => setViewMode("routes")} data-testid="button-view-routes"
          >
            <Route className="h-3.5 w-3.5 mr-1.5" />Marshrutlar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.total?.employees || 0}</div>
                <div className="text-xs text-muted-foreground">Jami xodimlar</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{validEmployees.length}</div>
                <div className="text-xs text-muted-foreground">Koordinatalar bilan</div>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{(transportData?.groups?.length ?? 0) || 0}</div>
                <div className="text-xs text-muted-foreground">Transport guruhlari</div>
              </div>
              <Bus className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Department Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filtrlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Bo'lim</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger data-testid="select-department" className="h-8 text-sm">
                    <SelectValue placeholder="Barcha bo'limlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha bo'limlar</SelectItem>
                    {(Array.isArray(departments) ? departments : []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI Transport Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bus className="h-4 w-4 text-blue-600" />
                Transport Marshrutlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                AI xodimlarni yo'nalish bo'yicha guruhlaydi va uyga ketish vaqtini belgilaydi.
              </p>
              <Button
                className="w-full" size="sm"
                onClick={() => { generateRoutes(); setViewMode("routes"); }}
                disabled={transportLoading}
                data-testid="button-generate-routes"
              >
                {transportLoading
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Hisoblanmoqda...</>
                  : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />AI Marshrutlar</>
                }
              </Button>

              {transportData && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{transportData.summary}</p>
                  <div className="space-y-2">
                    {(Array.isArray(transportData.groups) ? transportData.groups : []).map((group) => (
                      <div key={group.id}>
                        <button
                          className="w-full flex items-center justify-between text-sm py-1 hover-elevate rounded-md px-2"
                          onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                          data-testid={`button-group-${group.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: group.color }} />
                            <span className="font-medium">{group.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">{group.employees.length}</Badge>
                            {expandedGroup === group.id
                              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </div>
                        </button>
                        {expandedGroup === group.id && (
                          <div className="mt-1 pl-3 space-y-1.5 border-l-2" style={{ borderColor: group.color }}>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Chiqish: {group.departureTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Navigation className="h-3 w-3" />
                              <span>{group.totalMinutes} daqiqa</span>
                            </div>
                            {group.driverNote && (
                              <p className="text-xs text-muted-foreground italic">{group.driverNote}</p>
                            )}
                            {(Array.isArray(group.employees) ? group.employees : []).map(emp => (
                              <div key={emp.id} className="text-xs flex items-center gap-1.5">
                                <Home className="h-3 w-3 text-muted-foreground shrink-0" />
                                <div>
                                  <div className="font-medium">{emp.fullName}</div>
                                  <div className="text-muted-foreground">{emp.distanceKm} km • {emp.travelMinutes} min</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Department breakdown */}
          {(stats?.byDepartment || []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bo'limlar bo'yicha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(stats?.byDepartment || []).map(d => (
                  <div key={d.departmentName} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.departmentName}</span>
                    <Badge variant="secondary">{d.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0 overflow-hidden rounded-md">
            {validEmployees.length === 0 && viewMode !== "routes" ? (
              <div className="h-[620px] flex items-center justify-center">
                <EmptyState
                  icon={MapPinOff}
                  title="Koordinatalar yo'q"
                  description="Xodimlar uy manzillari kiritilmagan"
                />
              </div>
            ) : (
              <MapContainer
                center={factoryCenter}
                zoom={13}
                style={{ height: "620px", width: "100%" }}
                data-testid="hr-map-container"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapCenterController center={factoryCenter} />

                {/* Factory Marker — always visible */}
                <Marker position={factoryCenter} icon={factoryIcon} data-testid="marker-factory">
                  <Popup>
                    <div className="space-y-1 min-w-[180px]">
                      <div className="font-bold text-base">🏭 Europrint Zavodi</div>
                      <div className="text-sm text-gray-600">Qo'qon, O'zbekiston</div>
                      <div className="text-xs text-gray-500">40.5556°N, 70.9280°E</div>
                    </div>
                  </Popup>
                </Marker>

                {/* MARKERS VIEW */}
                {viewMode === "markers" && (
                  <MarkerClusterGroup chunkedLoading>
                    {(Array.isArray(validEmployees) ? validEmployees : []).map(emp => (
                      <Marker
                        key={emp.id}
                        position={[emp.lat!, emp.lng!]}
                        icon={createEmployeeIcon(emp.shift ? "#f59e0b" : "#3b82f6")}
                        data-testid={`marker-emp-${emp.id}`}
                      >
                        <Popup>
                          <div className="space-y-1 min-w-[180px]">
                            <div className="font-semibold">{emp.fullName}</div>
                            <div className="text-sm text-gray-600">{emp.departmentName}</div>
                            <div className="text-sm text-gray-600">{emp.positionName}</div>
                            {emp.address && <div className="text-xs text-gray-500">{emp.address}</div>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                )}

                {/* HEATMAP VIEW */}
                {viewMode === "heatmap" && <HeatmapLayer employees={employees} />}

                {/* ROUTES VIEW */}
                {viewMode === "routes" && transportData && transportData.groups?.flatMap((group, gi) => {
                  const color = group.color || GROUP_COLORS[gi % GROUP_COLORS.length];
                  return group.employees?.flatMap(emp => [
                    <Polyline
                      key={`line-${emp.id}`}
                      positions={[[FACTORY_LAT, FACTORY_LNG], [emp.lat, emp.lng]]}
                      color={color}
                      weight={3}
                      opacity={0.8}
                      dashArray="6 4"
                    />,
                    <Marker
                      key={`home-${emp.id}`}
                      position={[emp.lat, emp.lng]}
                      icon={homeIcon(color)}
                    >
                      <Popup>
                        <div className="space-y-1 min-w-[180px]">
                          <div className="font-semibold">{emp.fullName}</div>
                          <div className="text-sm" style={{ color }}>{group.name}</div>
                          <div className="text-xs text-gray-600">{emp.address}</div>
                          <div className="text-xs text-gray-500">
                            {emp.distanceKm} km • ~{emp.travelMinutes} daqiqa
                          </div>
                          <div className="text-xs font-medium">
                            Chiqish: {group.departureTime}
                          </div>
                        </div>
                      </Popup>
                    </Marker>,
                  ]);
                })}

                {/* Routes view — employee markers when no transport data yet */}
                {viewMode === "routes" && !transportData && (Array.isArray(validEmployees) ? validEmployees : []).map(emp => (
                  <Marker
                    key={emp.id}
                    position={[emp.lat!, emp.lng!]}
                    icon={createEmployeeIcon("#94a3b8")}
                  >
                    <Popup>
                      <div className="font-semibold">{emp.fullName}</div>
                      <div className="text-xs text-gray-500">{emp.address}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
