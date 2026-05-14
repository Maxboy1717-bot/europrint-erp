/**
 * @module use-hr-assessment
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useAssessments360() {
  return useQuery({
    queryKey: ["/hr/assessment/360"],
    queryFn: () => fetchApi("/hr/assessment/360").then(res => res.data),
  });
}

export function useCreateAssessment360() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/assessment/360", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/assessment/360"] }),
  });
}

export function useSuccessionPlans() {
  return useQuery({
    queryKey: ["/hr/assessment/succession-plans"],
    queryFn: () => fetchApi("/hr/assessment/succession-plans").then(res => res.data),
  });
}

export function useCreateSuccessionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/assessment/succession-plans", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/assessment/succession-plans"] }),
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: ["/hr/assessment/transfers"],
    queryFn: () => fetchApi("/hr/assessment/transfers").then(res => res.data),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/assessment/transfers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/assessment/transfers"] }),
  });
}

export function useNineBox() {
  return useQuery({
    queryKey: ["/hr/360/nine-box"],
    queryFn: () => fetchApi("/hr/360/nine-box").then(res => res.data),
  });
}
