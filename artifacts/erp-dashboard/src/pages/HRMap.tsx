/**
 * @module HRMap
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, Bus, MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee, TransportResult, MapStats, ViewMode } from "./HRMapTypes";
import { FACTORY_LAT, FACTORY_LNG } from "./HRMapTypes";
import {
  MapCenterController,
  HeatmapLayer,
  MarkersLayer,
  RoutesLayer,
  ViewModeButtons,
  factoryIcon,
} from "./HRMapSections";
import { LeftPanel } from "./HRMapDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function HRMap() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("markers");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: employees = [], isLoading: empLoading, isError, error, refetch } = useQuery<Employee[]>({
    queryKey: [
      selectedDepartment === "all"
        ? "/api/hr-map/employees"
        : `/api/hr-map/employees?orgDepartmentId=${selectedDepartment}`
    ],
  });

  const { data: departments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/org-departments"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<MapStats>({
    queryKey: ["/api/hr-map/stats"],
  });

  const { data: transportData, isPending: transportLoading, mutate: generateRoutes } =
    useMutation<TransportResult>({
      mutationFn: () => apiRequest("GET", "/api/hr-map/transport-groups"),
      onSuccess: () => {
        toast({ title: "AI marshrutlar tayyor!", description: "Guruhlar va vaqtlar hisoblandi" });
      },
      onError: () => {
        toast({
          title: "Xatolik",
          description: "Marshrutlarni hisoblashda xatolik yuz berdi",
          variant: "destructive",
        });
      },
    });

  const validEmployees = (Array.isArray(employees) ? employees : []).filter(
    e => e.lat != null && e.lng != null
  );
  const factoryCenter: [number, number] = [FACTORY_LAT, FACTORY_LNG];

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  if (empLoading || statsLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-4">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("xodimlarGeoxaritasi")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Europrint zavodi • 40.5556°N, 70.9280°E • {validEmployees.length} xodim xaritada
          </p>
        </div>
        <ViewModeButtons viewMode={viewMode} onSetViewMode={setViewMode} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats?.total?.employees || 0}</div>
                <div className="text-xs text-muted-foreground">{t("jamiXodimlar1")}</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[var(--ep-green)]">{validEmployees.length}</div>
                <div className="text-xs text-muted-foreground">{t("koordinatalarBilan")}</div>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[var(--ep-blue)]">
                  {(transportData?.groups?.length ?? 0) || 0}
                </div>
                <div className="text-xs text-muted-foreground">{t("transportGuruhlari")}</div>
              </div>
              <Bus className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <LeftPanel
          selectedDepartment={selectedDepartment}
          departments={Array.isArray(departments) ? departments : []}
          stats={stats}
          transportData={transportData}
          transportLoading={transportLoading}
          expandedGroup={expandedGroup}
          onDepartmentChange={setSelectedDepartment}
          onGenerateRoutes={() => { generateRoutes(); setViewMode("routes"); }}
          onToggleGroup={(id) => setExpandedGroup(expandedGroup === id ? null : id)}
        />

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0 overflow-hidden rounded-md">
            {validEmployees.length === 0 && viewMode !== "routes" ? (
              <div className="h-[620px] flex items-center justify-center">
                <EmptyState
                  icon={MapPinOff}
                  title={t("koordinatalarYoq")}
                  description={t("xodimlarUyManzillariKiritilmagan")}
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
                  attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">${t('openstreetmap')}</a>`}
                />
                <MapCenterController center={factoryCenter} />

                {/* Factory marker — always visible */}
                <Marker position={factoryCenter} icon={factoryIcon} data-testid="marker-factory">
                  <Popup>
                    <div className="space-y-1 min-w-[180px]">
                      <div className="font-bold text-base">{t("europrintZavodi")}</div>
                      <div className="text-sm text-gray-600">{t("qoqonOzbekiston")}</div>
                      <div className="text-xs text-gray-500">{t("k405556N709280E")}</div>
                    </div>
                  </Popup>
                </Marker>

                {viewMode === "markers" && <MarkersLayer employees={validEmployees} />}
                {viewMode === "heatmap" && <HeatmapLayer employees={employees} />}
                {viewMode === "routes" && (
                  <RoutesLayer transportData={transportData} employees={validEmployees} />
                )}
              </MapContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
