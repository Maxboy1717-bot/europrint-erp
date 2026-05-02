import { useCallback } from "react";
import { useChatStore } from "@/store/chatStore";

let sharedSocketRef: { socket: import("socket.io-client").Socket | null } = { socket: null };

export function setSharedSocket(s: import("socket.io-client").Socket | null) {
  sharedSocketRef.socket = s;
}

export function getSharedSocket() {
  return sharedSocketRef.socket;
}

export function useChatSocket() {
  const joinRoom = useCallback((roomId: string) => {
    const s = sharedSocketRef.socket;
    if (!s) return;
    const rId = Number(roomId) || roomId;
    s.emit("join_room", { roomId: rId });
    s.emit("get_messages", { roomId: rId });
    s.emit("mark_read", { roomId: rId });
    useChatStore.getState().markRoomRead(roomId);
  }, []);

  const sendMessage = useCallback((roomId: string, content: string, replyToId?: string, mentionedUserIds?: string[]) => {
    const s = sharedSocketRef.socket;
    if (!s || !content.trim()) return;
    s.emit("message:send", { roomId, content: content.trim(), replyToId, mentionedUserIds });
  }, []);

  const sendTypingStart = useCallback((roomId: string) => {
    sharedSocketRef.socket?.emit("typing", { roomId: Number(roomId) || roomId, isTyping: true });
  }, []);

  const sendTypingStop = useCallback((roomId: string) => {
    sharedSocketRef.socket?.emit("typing", { roomId: Number(roomId) || roomId, isTyping: false });
  }, []);

  const startDirect = useCallback((targetUserId: number) => {
    sharedSocketRef.socket?.emit("start_direct", { targetUserId: Number(targetUserId) });
  }, []);

  const editMsg = useCallback((messageId: string, content: string) => {
    sharedSocketRef.socket?.emit("message:edit", { messageId, content });
  }, []);

  const deleteMsg = useCallback((messageId: string) => {
    sharedSocketRef.socket?.emit("message:delete", { messageId });
  }, []);

  const refreshRooms = useCallback(() => {
    sharedSocketRef.socket?.emit("get_rooms");
  }, []);

  return {
    joinRoom,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    startDirect,
    editMsg,
    deleteMsg,
    refreshRooms,
  };
}
