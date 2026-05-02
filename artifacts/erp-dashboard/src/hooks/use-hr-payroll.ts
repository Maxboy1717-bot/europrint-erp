import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ["/hr/payroll/periods"],
    queryFn: () => fetchApi("/hr/payroll/periods").then(res => res.data),
  });
}

export function useCreatePayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/payroll/periods", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll/periods"] }),
  });
}

export function useCalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => fetchApi("/hr/payroll/calculate", { method: "POST", body: JSON.stringify({ periodId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll"] }),
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => fetchApi("/hr/payroll/approve", { method: "PUT", body: JSON.stringify({ periodId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll"] }),
  });
}

export function usePayPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => fetchApi("/hr/payroll/pay", { method: "POST", body: JSON.stringify({ periodId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll"] }),
  });
}

export function useSalaryHistory() {
  return useQuery({
    queryKey: ["/hr/payroll/salary-history"],
    queryFn: () => fetchApi("/hr/payroll/salary-history").then(res => res.data),
  });
}

export function useOvertime() {
  return useQuery({
    queryKey: ["/hr/payroll/overtime"],
    queryFn: () => fetchApi("/hr/payroll/overtime").then(res => res.data),
  });
}

export function useCreateOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/payroll/overtime", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll/overtime"] }),
  });
}

export function useBonuses() {
  return useQuery({
    queryKey: ["/hr/payroll/bonuses"],
    queryFn: () => fetchApi("/hr/payroll/bonuses").then(res => res.data),
  });
}

export function useCreateBonus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/payroll/bonuses", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll/bonuses"] }),
  });
}

export function useFines() {
  return useQuery({
    queryKey: ["/hr/payroll/fines"],
    queryFn: () => fetchApi("/hr/payroll/fines").then(res => res.data),
  });
}

export function useCreateFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/payroll/fines", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll/fines"] }),
  });
}

export function useDeductions() {
  return useQuery({
    queryKey: ["/hr/payroll/deductions"],
    queryFn: () => fetchApi("/hr/payroll/deductions").then(res => res.data),
  });
}

export function useLockPayrollPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: number) => fetchApi("/hr/payroll/lock", { method: "POST", body: JSON.stringify({ periodId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/payroll/periods"] }),
  });
}
