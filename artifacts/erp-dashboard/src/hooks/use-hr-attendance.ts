import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useAttendance(params?: { date?: string; employeeId?: number }) {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.employeeId) qs.set("emp_id", String(params.employeeId));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return useQuery({
    queryKey: ["/hr/attendance", params],
    queryFn: () => fetchApi(`/hr/attendance${query}`).then(res => res.data),
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: ["/hr/attendance/summary"],
    queryFn: () => fetchApi("/hr/attendance/summary").then(res => res.data),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/attendance/check-in", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/attendance"] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/attendance/check-out", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/attendance"] }),
  });
}

export function useAbcResults() {
  return useQuery({
    queryKey: ["/hr/attendance/abc-results"],
    queryFn: () => fetchApi("/hr/attendance/abc-results").then(res => res.data),
  });
}

export function useRunAbcAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fetchApi("/hr/attendance/abc-analysis", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/attendance/abc-results"] }),
  });
}

export function useLateEmployees() {
  return useQuery({
    queryKey: ["/hr/attendance/late-employees"],
    queryFn: () => fetchApi("/hr/attendance/late-employees").then(res => res.data),
  });
}

export function useMonthlyAttendanceReport(params?: { month?: string }) {
  const qs = params?.month ? `?month=${params.month}` : "";
  return useQuery({
    queryKey: ["/hr/attendance/monthly-report", params],
    queryFn: () => fetchApi(`/hr/attendance/monthly-report${qs}`).then(res => res.data),
  });
}
