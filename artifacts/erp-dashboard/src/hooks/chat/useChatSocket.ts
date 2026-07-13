/**
 * @module useChatSocket
 * @description React custom hook.
 */

import { useCallback } from "react";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { useAuth } from "@/hooks/useAuth";

let sharedSocketRef: { socket: import("socket.io-client").Socket | null } = { socket: null };

const pendingQueue: Array<{ event: string; data: unknown }> = [];

function flushPendingQueue(socket: import("socket.io-client").Socket) {
  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    if (!item) break;
    socket.emit(item.event, item.data);
  }
}

export function setSharedSocket(s: import("socket.io-client").Socket | null) {
  sharedSocketRef.socket = s;
  if (s) {
    s.on('connect', () => flushPendingQueue(s));
    // Flush immediately if already connected
    if (s.connected) flushPendingQueue(s);
  }
}

export function getSharedSocket() {
  return sharedSocketRef.socket;
}

export function useChatSocket() {
  const { user } = useAuth();

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
    const trimmed = content.trim();
    if (!trimmed) return;
    const clientMsgId = crypto.randomUUID();
    // Optimistic bubble: render instantly in a "sending" state so the composer
    // feels instant. The server echo (new_message carrying this clientMsgId)
    // reconciles it into the persisted message via chatStore.reconcileMessage.
    if (user) {
      useChatStore.getState().addOptimisticMessage({
        id: `optimistic-${clientMsgId}`,
        clientMsgId,
        status: "sending",
        roomId,
        senderId: String(user.id),
        senderName: user.fullName || user.username || "",
        content: trimmed,
        messageType: "text",
        isDeleted: false,
        replyToId: replyToId ?? null,
        createdAt: new Date().toISOString(),
      });
    }
    const payload = { roomId, content: trimmed, replyToId, mentionedUserIds, clientMsgId };
    const s = sharedSocketRef.socket;
    // Offline queue: hold the message if the socket is missing OR not currently
    // connected (mid-reconnect). `flushPendingQueue` drains it on the next
    // `connect`. Without the `!s.connected` guard, a disconnected socket would
    // silently drop the emit.
    if (!s || !s.connected) {
      pendingQueue.push({ event: "message:send", data: payload });
      return;
    }
    s.emit("message:send", payload);
  }, [user]);

  // Re-send a message that failed (server error or never delivered). Reuses the
  // original clientMsgId so the server echo still reconciles the same bubble.
  const retryMessage = useCallback((msg: ChatMessage) => {
    if (!msg.clientMsgId || !msg.content) return;
    useChatStore.getState().markMessageSending(msg.roomId, msg.clientMsgId);
    const payload = { roomId: msg.roomId, content: msg.content, replyToId: msg.replyToId ?? undefined, clientMsgId: msg.clientMsgId };
    const s = sharedSocketRef.socket;
    if (!s || !s.connected) {
      pendingQueue.push({ event: "message:send", data: payload });
      return;
    }
    s.emit("message:send", payload);
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
    retryMessage,
    sendTypingStart,
    sendTypingStop,
    startDirect,
    editMsg,
    deleteMsg,
    refreshRooms,
  };
}
