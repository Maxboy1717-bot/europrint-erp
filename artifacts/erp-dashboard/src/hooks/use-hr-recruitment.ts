/**
 * @module use-hr-recruitment
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useVacancies() {
  return useQuery({
    queryKey: ["/api/hr/recruitment/vacancies"],
    queryFn: () => fetchApi("/hr/recruitment/vacancies").then(res => res.data),
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/recruitment/vacancies", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] }),
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => fetchApi(`/hr/recruitment/vacancies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/recruitment/vacancies"] }),
  });
}

export function useCandidates() {
  return useQuery({
    queryKey: ["/api/hr/recruitment/candidates"],
    queryFn: () => fetchApi("/hr/recruitment/candidates").then(res => res.data),
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/recruitment/candidates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/recruitment/candidates"] }),
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => fetchApi(`/hr/recruitment/candidates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/recruitment/candidates"] }),
  });
}

export function useInterviews() {
  return useQuery({
    queryKey: ["/api/hr/recruitment/interviews"],
    queryFn: () => fetchApi("/hr/recruitment/interviews").then(res => res.data),
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/recruitment/interviews", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/hr/recruitment/interviews"] }),
  });
}
