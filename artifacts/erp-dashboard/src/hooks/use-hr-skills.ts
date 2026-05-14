/**
 * @module use-hr-skills
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

export function useSkills() {
  return useQuery({
    queryKey: ["/hr/skills"],
    queryFn: () => fetchApi("/hr/skills").then(res => res.data),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/skills", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/skills"] }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => fetchApi(`/hr/skills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/hr/skills"] }),
  });
}

export function useSkillRequirements() {
  return useQuery({
    queryKey: ["/hr/skills/requirements"],
    queryFn: () => fetchApi("/hr/skills/requirements").then(res => res.data),
  });
}

export function useSkillCategories() {
  return useQuery({
    queryKey: ["/hr/skills/categories"],
    queryFn: () => fetchApi("/hr/skills/categories").then(res => res.data),
  });
}
