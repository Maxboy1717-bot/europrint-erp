import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  messageType: string;
  isDeleted: boolean;
  isEdited: boolean;
  isPinned: boolean;
  replyToId: string | null;
  replyToMessage: unknown | null;
  threadCount: number;
  reactions: Array<{ emoji: string; count: number; users: string[]; userIds: string[] }> | null;
  poll: unknown | null;
  createdAt: string;
  senderName: string | null;
  senderAvatar: string | null;
}

export function useMessages(roomId: string | null, limit = 50) {
  return useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", roomId, limit],
    enabled: !!roomId,
    queryFn: async () => {
      const res = await fetch(
        `/api/chat/rooms/${roomId}/messages?limit=${limit}`,
        { credentials: "include", headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error("Xabarlar yuklanmadi");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data as { data?: ChatMessage[] }).data ?? [];
      return arr;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
