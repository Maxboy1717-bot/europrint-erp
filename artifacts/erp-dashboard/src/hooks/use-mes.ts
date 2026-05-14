/**
 * @module use-mes
 * @description React custom hook.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";

export function useMESDashboard() {
  return useQuery({
    queryKey: ["/api/mes/stats"],
    refetchInterval: 30000,
  });
}

export function useMESOee(sessionId?: string) {
  return useQuery({
    queryKey: ["/api/mes/oee", sessionId],
    refetchInterval: 60000,
    enabled: sessionId !== undefined ? !!sessionId : true,
  });
}

export function useMESSessions() {
  return useQuery({ queryKey: ["/api/mes/production-sessions"] });
}

export function useMESSession(sessionId: string) {
  return useQuery({
    queryKey: ["/api/mes/sessions", sessionId],
    enabled: !!sessionId,
    refetchInterval: 30000,
  });
}

export function useMESDowntimes(sessionId?: string) {
  return useQuery({
    queryKey: ["/api/mes/downtime-events", sessionId],
    queryFn: () =>
      fetch(
        sessionId
          ? `/api/mes/downtime-events/${sessionId}`
          : "/api/mes/downtime-events",
        { headers: getAuthHeaders() },
      ).then((r) => (r.ok ? r.json() : Promise.reject(r))),
    refetchInterval: 60000,
  });
}

export function useMESDowntimeReasons() {
  return useQuery({ queryKey: ["/api/mes/downtime-reasons"] });
}

export function useMESMaintenanceRequests() {
  return useQuery({ queryKey: ["/api/mes/maintenance-requests"] });
}

export function useMESTasks() {
  return useQuery({ queryKey: ["/api/mes/tasks"] });
}

export function useMESLeaderboard() {
  return useQuery({ queryKey: ["/api/mes/gamification/leaderboard"] });
}

export function useMESCurrentShift() {
  return useQuery({
    queryKey: ["/api/mes/shifts/current"],
    refetchInterval: 60000,
  });
}

export function useRecordDowntime() {
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: Record<string, unknown>;
    }) =>
      apiRequest("POST", `/api/mes/operations/${sessionId}/downtime`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/mes/downtime-events"] }),
  });
}

export function useStartSession() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/mes/sessions/start", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/mes/sessions"] }),
  });
}
