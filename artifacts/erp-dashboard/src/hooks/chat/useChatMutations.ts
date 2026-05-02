import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useSendMessage(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string;
      replyToId?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
    }) => apiRequest("POST", `/api/chat/rooms/${roomId}/messages`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
    },
  });
}

export function useAddReaction(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) =>
      apiRequest("POST", `/api/chat/rooms/${roomId}/messages/${msgId}/reactions`, { emoji }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
      qc.invalidateQueries({ queryKey: ["chat-reactions", vars.msgId] });
    },
  });
}

export function useRemoveReaction(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) =>
      apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${msgId}/reactions/${encodeURIComponent(emoji)}`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
      qc.invalidateQueries({ queryKey: ["chat-reactions", vars.msgId] });
    },
  });
}

export function useEditMessage(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ msgId, content }: { msgId: string; content: string }) =>
      apiRequest("PATCH", `/api/chat/rooms/${roomId}/messages/${msgId}`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
    },
  });
}

export function useDeleteMessage(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msgId: string) =>
      apiRequest("DELETE", `/api/chat/rooms/${roomId}/messages/${msgId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
    },
  });
}

export function useCreatePoll(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      question: string;
      options: string[];
      isMultiple?: boolean;
      isAnonymous?: boolean;
    }) => apiRequest("POST", `/api/chat/rooms/${roomId}/polls`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", roomId] });
    },
  });
}

export function useVotePoll() {
  return useMutation({
    mutationFn: ({ pollId, optionIndices }: { pollId: string; optionIndices: number[] }) =>
      apiRequest("POST", `/api/chat/polls/${pollId}/vote`, { optionIndices }),
  });
}
