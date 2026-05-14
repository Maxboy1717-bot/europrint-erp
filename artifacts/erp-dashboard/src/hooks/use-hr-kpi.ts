/**
 * @module use-hr-kpi
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useDailyKpi() {
  return useQuery({
    queryKey: ["/api/hr/kpi/daily"],
    queryFn: () => fetchApi("/hr/kpi/daily").then(res => res.data),
  });
}

export function useCreateDailyKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/kpi/daily", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/kpi/daily"] }),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["/api/hr/kpi/goals"],
    queryFn: () => fetchApi("/hr/kpi/goals").then(res => res.data),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/kpi/goals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/kpi/goals"] }),
  });
}

export function useRatings() {
  return useQuery({
    queryKey: ["/api/hr/kpi/ratings"],
    queryFn: () => fetchApi("/hr/kpi/ratings").then(res => res.data),
  });
}

export function useCreateRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/kpi/ratings", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/kpi/ratings"] }),
  });
}

export function useProductivity() {
  return useQuery({
    queryKey: ["/api/hr/kpi/productivity"],
    queryFn: () => fetchApi("/hr/kpi/productivity").then(res => res.data),
  });
}
