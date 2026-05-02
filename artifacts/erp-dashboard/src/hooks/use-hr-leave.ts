import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["/hr/leave/types"],
    queryFn: () => fetchApi("/hr/leave/types").then(res => res.data),
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["/hr/leave/requests"],
    queryFn: () => fetchApi("/hr/leave/requests").then(res => res.data),
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/leave/requests", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/leave/requests"] }),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/hr/leave/requests/${id}/approve`, { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/leave/requests"] }),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => fetchApi(`/hr/leave/requests/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/leave/requests"] }),
  });
}

export function useLeaveBalances() {
  return useQuery({
    queryKey: ["/hr/leave/balances"],
    queryFn: () => fetchApi("/hr/leave/balances").then(res => res.data),
  });
}
