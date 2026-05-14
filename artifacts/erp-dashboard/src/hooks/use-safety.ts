/**
 * @module use-safety
 * @description React custom hook.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

// --- INCIDENTS ---
export function useIncidents() {
  return useQuery({
    queryKey: ["/hr/safety/incidents"],
    queryFn: () => fetchApi("/hr/safety/incidents").then(res => res.data),
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi("/hr/safety/incidents", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/hr/safety/incidents"] })
  });
}
