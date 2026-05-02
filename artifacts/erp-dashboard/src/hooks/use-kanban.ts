import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";

export function useKanbanTasks(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["/api/kanban", filters],
    select: (data) => safeArray(data, "tasks"),
  });
}

export function useKanbanBoards() {
  return useQuery({ queryKey: ["/api/kanban/boards"] });
}

export function useKanbanTask(id: string | number) {
  return useQuery({
    queryKey: ["/api/kanban", id],
    enabled: !!id,
  });
}

export function useKanbanMetrics() {
  return useQuery({ queryKey: ["/api/kanban/dashboard/team-metrics"] });
}

export function useKanbanTaskStats() {
  return useQuery({ queryKey: ["/api/kanban/task-stats"] });
}

export function useKanbanEmployees() {
  return useQuery({ queryKey: ["/api/kanban/employees"] });
}

export function useCreateTask() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/kanban", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/kanban"] }),
  });
}

export function useMoveTask() {
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string | number;
      status: string;
    }) => apiRequest("PATCH", `/api/kanban/${id}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/kanban"] }),
  });
}

export function useUpdateTask() {
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string | number;
      [key: string]: unknown;
    }) => apiRequest("PATCH", `/api/kanban/${id}`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/kanban"] }),
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (id: string | number) =>
      apiRequest("DELETE", `/api/kanban/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/kanban"] }),
  });
}

export function useAssignTask() {
  return useMutation({
    mutationFn: ({
      id,
      userId,
    }: {
      id: string | number;
      userId: string | number;
    }) => apiRequest("PATCH", `/api/kanban/${id}/assign`, { userId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/kanban"] }),
  });
}
