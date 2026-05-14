/**
 * @module IoTExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, AlertTriangle, Plus } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import type { IoTSensor, IoTAlert, OEEData, PredictionData, SensorFormValues } from "./IoTExtendedTypes";
import { URL_TAB_MAP, tabMeta, SensorSchema } from "./IoTExtendedTypes";
import {
  SensorsTabContent, AlertsTabContent, OEETabContent,
  PredictiveTabContent, DigitalTwinTabContent,
} from "./IoTExtendedSections";
import { AddSensorDialog } from "./IoTExtendedDialogs";
import { useTranslation } from '@/lib/i18n';

export default function IoTExtended() {
  const { t } = useTranslation("common");
  const [location]          = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "sensors");
  const [showSensorDialog, setShowSensorDialog] = useState(false);

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta     = tabMeta[activeTab] || tabMeta["sensors"];
  const { toast } = useToast();

  const sensorForm = useForm<SensorFormValues>({
    resolver: zodResolver(SensorSchema),
    defaultValues: {
      sensorId: "", machineId: "", sensorType: "temperature",
      unit: "°C", minValue: 0, maxValue: 100, criticalMin: 0, criticalMax: 95,
    },
  });

  const { data: sensors = [], isLoading: sensorsLoading, refetch: refetchSensors } = useQuery<IoTSensor[]>({
    queryKey: ["/api/iot-sensors"],
    select: selectArray<IoTSensor>,
  });

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<IoTAlert[]>({
    queryKey: ["/api/iot-sensors/alerts"],
    select: selectArray<IoTAlert>,
  });

  const { data: oeeData = [], isLoading: oeeLoading } = useQuery<OEEData[]>({
    queryKey: ["/api/iot-sensors/oee"],
    select: selectArray<OEEData>,
  });

  const { data: dashboard, isLoading: dashLoading } = useQuery<{ predictions?: PredictionData[] } & Record<string, unknown>>({
    queryKey: ["/api/iot-sensors/dashboard"],
  });

  const { data: liveSummary } = useQuery<{ activeMachines?: number | string; avgOee?: number | string; totalProduced?: number | string; totalDefects?: number | string } & Record<string, unknown>>({
    queryKey: ["/api/iot/live-dashboard/summary"],
    refetchInterval: 30000,
  });

  const createSensor = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/iot-sensors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors"] });
      setShowSensorDialog(false);
      toast({ title: "Sensor qo'shildi" });
    },
  });

  const resolveAlert = useMutation({
    mutationFn: (id: number | string) => apiRequest("POST", `/api/iot-sensors/alerts/${id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot-sensors/alerts"] });
      toast({ title: "Ogohlantirish hal qilindi" });
    },
  });

  const criticalAlerts  = (Array.isArray(alerts) ? alerts : []).filter((a: IoTAlert) => a.severity === "critical" && !a.resolvedAt);
  const warningAlerts   = (Array.isArray(alerts) ? alerts : []).filter((a: IoTAlert) => a.severity === "warning" && !a.resolvedAt);
  const activeSensors   = (Array.isArray(sensors) ? sensors : []).filter((s: IoTSensor) => s.isActive);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">{t("iotSensorMonitoring")}</h1>
        {criticalAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            <AlertTriangle className="h-3 w-3 mr-1" />{criticalAlerts.length} Kritik
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto" />

        <div className="flex-1 overflow-auto p-6">
          <ModuleSectionHeader
            moduleName="IoT"
            moduleColor="text-[var(--ep-blue)]"
            sectionTitle={meta?.title || ""}
            icon={meta?.icon || (() => null)}
          />

          <TabsContent value="sensors" className="mt-0">
            <SensorsTabContent
              sensors={sensors}
              sensorsLoading={sensorsLoading}
              activeSensors={activeSensors}
              criticalAlerts={criticalAlerts}
              warningAlerts={warningAlerts}
              onRefresh={() => refetchSensors()}
              onAddSensor={() => setShowSensorDialog(true)}
            />
            <AddSensorDialog
              open={showSensorDialog}
              onOpenChange={setShowSensorDialog}
              form={sensorForm}
              onSubmit={(d) => createSensor.mutate(d)}
              isPending={createSensor.isPending}
            />
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <AlertsTabContent
              alerts={alerts}
              alertsLoading={alertsLoading}
              criticalAlerts={criticalAlerts}
              warningAlerts={warningAlerts}
              onRefresh={() => refetchAlerts()}
              onResolve={(id) => resolveAlert.mutate(id)}
              resolvePending={resolveAlert.isPending}
            />
          </TabsContent>

          <TabsContent value="oee" className="mt-0">
            <OEETabContent oeeData={oeeData} oeeLoading={oeeLoading} liveSummary={liveSummary} />
          </TabsContent>

          <TabsContent value="predictive" className="mt-0">
            <PredictiveTabContent predictions={dashboard?.predictions} dashLoading={dashLoading} />
          </TabsContent>

          <TabsContent value="twin" className="mt-0">
            <DigitalTwinTabContent
              sensors={sensors}
              activeSensors={activeSensors}
              criticalAlerts={criticalAlerts}
              warningAlerts={warningAlerts}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
