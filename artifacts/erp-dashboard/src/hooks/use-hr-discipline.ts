/**
 * @module use-hr-discipline
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useDisciplineRecords() {
  return useQuery({
    queryKey: ["/hr/discipline"],
    queryFn: () => fetchApi("/hr/discipline").then(res => res.data),
  });
}

export function useCreateDisciplineRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/discipline", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/discipline"] }),
  });
}

export function useUpdateDisciplineRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => fetchApi(`/hr/discipline/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/discipline"] }),
  });
}

export function useDeleteDisciplineRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/hr/discipline/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/discipline"] }),
  });
}

export function useDisciplineAppeals() {
  return useQuery({
    queryKey: ["/hr/discipline/appeals"],
    queryFn: () => fetchApi("/hr/discipline/appeals").then(res => res.data),
  });
}

export function useCreateAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/discipline/appeals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/discipline/appeals"] }),
  });
}
