/**
 * @module use-iot
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useIoTDashboard() {
  return useQuery({
    queryKey: ["/api/iot/dashboard/stats"],
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });
}

export function useIoTDevices(status?: string) {
  return useQuery({
    queryKey: ["/api/iot/devices", status],
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
  });
}

export function useIoTDevice(deviceId: string) {
  return useQuery({
    queryKey: ["/api/iot/devices", deviceId],
    enabled: !!deviceId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useIoTAnomalies() {
  return useQuery({
    queryKey: ["/api/iot/anomalies"],
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}

export function useSensorReadings(
  deviceId: string,
  timeRange?: { from?: string; to?: string }
) {
  return useQuery({
    queryKey: ["/api/iot/devices", deviceId, "readings", timeRange?.from, timeRange?.to],
    enabled: !!deviceId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useProductionSessions() {
  return useQuery({
    queryKey: ["/api/iot/production-sessions"],
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}

export function useDowntimeEvents() {
  return useQuery({
    queryKey: ["/api/iot/downtime-events"],
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}

export function useRecordReading() {
  return useMutation({
    mutationFn: ({
      deviceId,
      data,
    }: {
      deviceId: string;
      data: Record<string, unknown>;
    }) =>
      apiRequest("POST", `/api/iot/devices/${deviceId}/readings`, data),
    onSuccess: (_data, { deviceId }) =>
      queryClient.invalidateQueries({
        queryKey: ["/api/iot/devices", deviceId, "readings"],
      }),
  });
}
