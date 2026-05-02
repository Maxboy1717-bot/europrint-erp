import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useEmployees() {
  return useQuery({
    queryKey: ["/hr/employees"],
    queryFn: () => fetchApi("/hr/employees").then(res => res.data),
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: ["/hr/employees", id],
    queryFn: () => fetchApi(`/hr/employees/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/employees", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/employees"] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => fetchApi(`/hr/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/employees"] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fetchApi(`/hr/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/employees"] }),
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ["/hr/positions"],
    queryFn: () => fetchApi("/hr/positions").then(res => res.data),
  });
}
