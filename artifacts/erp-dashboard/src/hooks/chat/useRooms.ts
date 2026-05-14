/**
 * @module useRooms
 * @description React custom hook.
 */

import { useQuery } from "@tanstack/react-query";
import { ChatRoom } from "@/store/chatStore";
import { apiRequest } from '@/lib/queryClient';

export function useRooms() {
  return useQuery<ChatRoom[]>({
    queryKey: ["chat-rooms"],
    queryFn: async () => {
      const data = await apiRequest<unknown>('GET', "/api/chat/rooms");
      return Array.isArray(data) ? (data as ChatRoom[]) : ((data as { rooms?: ChatRoom[] })?.rooms ?? []);
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
      return await apiRequest('GET', `/api/chat/rooms/${roomId}/members`);
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
      return await apiRequest('GET', url);
    },
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });
}
