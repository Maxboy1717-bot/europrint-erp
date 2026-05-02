import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray } from "@/lib/queryClient";

export function useMyNotifications() {
  return useQuery({
    queryKey: ["/api/notifications/my"],
    select: (data) => safeArray(data, "notifications"),
    refetchInterval: 60000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["/api/notifications/my/unread-count"],
    refetchInterval: 30000,
    select: (data: unknown) => {
      if (typeof data === "number") return data;
      const obj = data as Record<string, unknown>;
      return (obj?.count as number) ?? (obj?.unreadCount as number) ?? 0;
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({ queryKey: ["/api/notifications/preferences"] });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (id: string | number) =>
      apiRequest("PATCH", `/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/my"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/my/unread-count"],
      });
    },
  });
}

export function useMarkAllRead() {
  return useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/notifications/my/mark-all-read", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/my"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/my/unread-count"],
      });
    },
  });
}

export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PATCH", "/api/notifications/preferences", data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/preferences"],
      }),
  });
}
