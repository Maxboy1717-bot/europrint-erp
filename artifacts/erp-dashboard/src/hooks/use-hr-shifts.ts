import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useShiftAssignments() {
  return useQuery({
    queryKey: ["/hr/shifts/assignments"],
    queryFn: () => fetchApi("/hr/shifts/assignments").then(res => res.data),
  });
}

export function useCreateShiftAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/shifts/assignments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/shifts/assignments"] }),
  });
}

export function useSwapRequests() {
  return useQuery({
    queryKey: ["/hr/shifts/swap-requests"],
    queryFn: () => fetchApi("/hr/shifts/swap-requests").then(res => res.data),
  });
}

export function useCreateSwapRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/shifts/swap-requests", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/shifts/swap-requests"] }),
  });
}

export function useApproveSwapRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/hr/shifts/swap-requests/${id}/approve`, { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/shifts/swap-requests"] }),
  });
}
