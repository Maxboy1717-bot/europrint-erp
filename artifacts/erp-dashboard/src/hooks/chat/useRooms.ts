import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import { ChatRoom } from "@/store/chatStore";

export function useRooms() {
  return useQuery<ChatRoom[]>({
    queryKey: ["chat-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/chat/rooms", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load rooms");
      const data = await res.json();
      return Array.isArray(data) ? data : data.rooms ?? [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useRoomMembers(roomId: string | null) {
  return useQuery({
    queryKey: ["chat-room-members", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const res = await fetch(`/api/chat/rooms/${roomId}/members`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useEmployeeSearch(query: string) {
  return useQuery({
    queryKey: ["chat-employees", query],
    queryFn: async () => {
      const url = `/api/chat/employees${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load employees");
      return res.json();
    },
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}
