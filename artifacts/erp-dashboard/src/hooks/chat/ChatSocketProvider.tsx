/**
 * @module ChatSocketProvider
 * @description React custom hook.
 */

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io } from "socket.io-client";
import { useChatStore, ChatRoom, ChatMessage, ChatReaction } from "@/store/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { safeStorage } from "@/lib/safeStorage";
import { setSharedSocket } from "./useChatSocket";

const ChatSocketContext = createContext<{ connected: boolean }>({ connected: false });

// WS reconnect transport defaults. Unbounded attempts with exponential backoff
// between the initial delay and the cap (socket.io randomizes between the two)
// so a dropped connection keeps retrying forever instead of giving up — a
// prod-messenger never silently stops reconnecting.
// NOTE (owner): sourcing these two values from `business_settings` (CRUD) is an
// open sub-decision — the settings read endpoint is role-gated (READ excludes
// plain operators → 403), so a per-user pre-connect fetch would break the very
// connect path we just fixed. Flagged for the Phase-1 report.
const WS_RECONNECT_DELAY_MS = 2000;      // initial backoff
const WS_RECONNECT_DELAY_MAX_MS = 30000; // exponential-backoff cap

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Auth: the JWT access token (same one used by REST) is passed via the
    // socket handshake `auth.token`. `ChatGateway.handleConnection` reads
    // `handshake.auth.token` (NOT a cookie), identical to the working
    // `use-kanban-realtime.ts` / RecruitmentGateway pattern. Passing only a
    // cookie left the handshake tokenless and the gateway disconnected every
    // client — the module's P0 auth-drift bug.
    const token = safeStorage.getItem("access_token");
    if (!token) return;

    const wsUrl = `${window.location.protocol}//${window.location.host}`;
    const basePath = (import.meta.env.BASE_URL ?? "/erp-dashboard/").replace(/\/$/, "");
    const socketPath = `${basePath}/socket.io`;

    const s = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      path: socketPath,
      reconnection: true,
      reconnectionDelay: WS_RECONNECT_DELAY_MS,
      reconnectionDelayMax: WS_RECONNECT_DELAY_MAX_MS,
      reconnectionAttempts: Infinity,
    });

    setSharedSocket(s);

    s.on("connect", () => {
      setConnected(true);
      s.emit("get_rooms");
      // Reconnect catch-up: this handler fires on the initial connect AND on
      // every reconnect. If a room is open, re-fetch its recent messages so
      // anything that arrived during a disconnect window is pulled in (the
      // `messages_list` handler replaces the room list with fresh server
      // state — no gap, no duplicates) and re-mark it read.
      const activeRoomId = useChatStore.getState().activeRoomId;
      if (activeRoomId) {
        const rId = Number(activeRoomId) || activeRoomId;
        s.emit("get_messages", { roomId: rId });
        s.emit("mark_read", { roomId: rId });
      }
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    s.on("connect_error", () => {
      setConnected(false);
    });

    // No `reconnect_failed` handler: with unbounded `reconnectionAttempts`
    // it never fires, and calling `disconnect()` there would defeat the
    // never-give-up reconnect policy this phase installs.

    const normalizeRooms = (rooms: Array<Record<string, unknown>>): ChatRoom[] =>
      (Array.isArray(rooms) ? rooms : []).map((r) => ({ ...r, id: String(r.id) } as ChatRoom));

    s.on("connected", ({ rooms, onlineUserIds }: { userId: number; rooms: Array<Record<string, unknown>>; onlineUserIds?: number[] }) => {
      useChatStore.getState().setRooms(normalizeRooms(rooms));
      if (Array.isArray(onlineUserIds)) {
        useChatStore.getState().setOnlineUserIds(onlineUserIds);
      }
    });

    s.on("rooms_list", (rooms: Array<Record<string, unknown>>) => {
      useChatStore.getState().setRooms(normalizeRooms(rooms));
    });

    // New direct room created — prepend to rooms list, auto-select, and load messages
    // (single handler — the duplicate at the bottom of this file was removed)
    s.on("direct_room", (rawRoom: Record<string, unknown>) => {
      const room = { ...rawRoom, id: String(rawRoom.id) } as ChatRoom;
      const st = useChatStore.getState();
      const exists = st.rooms?.some((r) => r.id === room.id);
      if (!exists) {
        st.setRooms([room, ...st.rooms]);
      }
      st.setActiveRoomId(room.id);
      st.markRoomRead(room.id);
      s.emit("join_room", { roomId: room.id });
      s.emit("get_messages", { roomId: room.id });
      s.emit("mark_read", { roomId: room.id });
      s.emit("get_rooms");
    });

    s.on("unread_count", ({ count }: { count: number }) => {
      useChatStore.getState().setTotalUnread(count);
    });

    s.on("messages_list", ({ roomId, messages: rawMessages }: { roomId: string | number; messages: unknown }) => {
      const rId = String(roomId);
      // Defensive unwrap: backend may send { ok, data } Result wrapper instead of plain array
      let msgArr: Array<Record<string, unknown>>;
      if (Array.isArray(rawMessages)) {
        msgArr = rawMessages as Array<Record<string, unknown>>;
      } else if (rawMessages && typeof rawMessages === "object" && (rawMessages as Record<string, unknown>).ok) {
        msgArr = ((rawMessages as Record<string, unknown>).data as Array<Record<string, unknown>>) ?? [];
      } else {
        msgArr = [];
      }
      const normalized = msgArr.map((m) => ({
        ...m,
        id: String(m.id),
        roomId: rId,
        senderId: String(m.senderId ?? m.sender_id),
      })) as ChatMessage[];
      useChatStore.getState().setMessages(rId, normalized);
    });

    s.on("new_message", (rawMsg: Record<string, unknown>) => {
      const st = useChatStore.getState();
      const msg: ChatMessage = {
        ...(rawMsg as unknown as ChatMessage),
        id: String(rawMsg.id),
        roomId: String(rawMsg.roomId ?? rawMsg.room_id),
        senderId: String(rawMsg.senderId ?? rawMsg.sender_id),
        createdAt: String(rawMsg.createdAt ?? rawMsg.created_at),
        messageType: (rawMsg.messageType ?? rawMsg.message_type ?? "text") as ChatMessage["messageType"],
        isDeleted: Boolean(rawMsg.isDeleted ?? rawMsg.is_deleted ?? false),
        senderName: String(rawMsg.senderName ?? rawMsg.sender_name ?? ""),
      };
      const roomId = msg.roomId;
      if (msg.threadRootId) {
        const threadRootId = String(msg.threadRootId);
        st.addThreadMessage({ ...msg, threadRootId });
        st.updateThreadCount(roomId, threadRootId, (st.threadMessages[threadRootId]?.length ?? 0) + 1);
        return;
      }
      st.addMessage(msg);
      st.updateRoom(roomId, {
        lastMessage: {
          id: msg.id,
          content: msg.content,
          senderName: msg.senderName,
          createdAt: msg.createdAt,
          messageType: msg.messageType,
        },
      });
      const activeRoomId = st.activeRoomId;
      if (activeRoomId !== roomId) {
        const room = st.rooms?.find((r) => r.id === roomId);
        if (room) {
          st.updateRoom(roomId, { unreadCount: room.unreadCount + 1 });
        }
        const total = useChatStore.getState().rooms?.reduce((acc, r) => acc + r.unreadCount, 0);
        st.setTotalUnread(total);
      }
    });

    s.on("room_updated", () => {
      s.emit("get_rooms");
    });

    s.on("room_read", ({ roomId }: { roomId: string | number }) => {
      useChatStore.getState().markReadByOther(String(roomId));
      s.emit("get_rooms");
    });

    s.on("message:edited", ({ id, roomId, content }: { id: string; roomId: string; content: string }) => {
      useChatStore.getState().editMessage(roomId, id, content, true);
    });

    s.on("message:deleted", ({ id, roomId }: { id: string; roomId: string }) => {
      useChatStore.getState().deleteMessage(roomId, id);
    });

    s.on("reaction:updated", ({
      messageId, roomId, reactions,
    }: { messageId: string; roomId?: string; reactions: ChatReaction[] }) => {
      const st = useChatStore.getState();
      const rId = roomId || Object.keys(st.messages).find(
        (rid) => st.messages[rid]?.some((m) => m.id === messageId)
      );
      if (rId) st.updateReactions(rId, messageId, reactions);
    });

    s.on("poll:updated", ({
      messageId, roomId, votes, totalVotes, myVotes,
    }: { messageId: string; roomId: string; pollId: string; votes: Record<number, { count: number; users: string[] }>; totalVotes: number; myVotes: number[] }) => {
      useChatStore.getState().updatePoll(roomId, messageId, { votes, totalVotes, myVotes });
    });

    s.on("thread:new_reply", (msg: ChatMessage) => {
      useChatStore.getState().addThreadMessage(msg);
    });

    s.on("thread:count_updated", ({
      messageId, threadCount, roomId,
    }: { messageId: string; threadCount: number; roomId?: string }) => {
      const st = useChatStore.getState();
      const activeRoomId = st.activeRoomId;
      if (activeRoomId) {
        st.updateThreadCount(activeRoomId, messageId, threadCount);
      }
    });

    s.on("message:pinned", ({
      roomId, messageId, content, senderName,
    }: { roomId: string; messageId: string; content?: string; senderName?: string }) => {
      if (content) {
        useChatStore.getState().setPinnedMessage(String(roomId), {
          id: messageId,
          content,
          senderName: senderName || "Unknown",
        });
      }
    });

    s.on("message:unpinned", ({ roomId }: { roomId: string }) => {
      useChatStore.getState().setPinnedMessage(roomId, null);
    });

    s.on("user:online", ({ userId }: { userId: number }) => {
      useChatStore.getState().addOnlineUser(userId);
    });

    s.on("user:offline", ({ userId }: { userId: number }) => {
      useChatStore.getState().removeOnlineUser(userId);
    });

    s.on("user_typing", ({
      userId: uid, roomId, isTyping, userName,
    }: { userId: number; roomId: string | number; isTyping: boolean; userName: string }) => {
      if (!userName) return;
      const rId = String(roomId);
      const key = `${uid}:${rId}`;
      useChatStore.getState().setTyping(rId, userName, isTyping);
      if (isTyping) {
        const old = typingTimers.current.get(key);
        if (old) clearTimeout(old);
        const timer = setTimeout(() => {
          useChatStore.getState().setTyping(rId, userName, false);
          typingTimers.current.delete(key);
        }, 4000);
        typingTimers.current.set(key, timer);
      } else {
        const old = typingTimers.current.get(key);
        if (old) clearTimeout(old);
        typingTimers.current.delete(key);
      }
    });

    return () => {
      s.disconnect();
      setSharedSocket(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <ChatSocketContext.Provider value={{ connected }}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocketContext() {
  return useContext(ChatSocketContext);
}
