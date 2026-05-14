/**
 * @module use-hr-adaptation
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useAdaptationPrograms() {
  return useQuery({
    queryKey: ["/hr/adaptation/programs"],
    queryFn: () => fetchApi("/hr/adaptation/programs").then(res => res.data),
  });
}

export function useCreateAdaptationProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/adaptation/programs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/adaptation/programs"] }),
  });
}

export function useAdaptationRecords() {
  return useQuery({
    queryKey: ["/hr/adaptation/records"],
    queryFn: () => fetchApi("/hr/adaptation/records").then(res => res.data),
  });
}

export function useCreateAdaptationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/adaptation/records", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/adaptation/records"] }),
  });
}
