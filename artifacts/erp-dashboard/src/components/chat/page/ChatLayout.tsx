import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useChatStore, ChatMessage, ChatRoom } from "@/store/chatStore";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { RoomList } from "./RoomList";
import { MessageArea } from "./MessageArea";
import { MentionInput } from "./MentionInput";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { ThreadPanel } from "./ThreadPanel";
import { PollCreator } from "./PollCreator";
import { ForwardModal } from "./ForwardModal";
import { ChatAvatar } from "./ChatAvatar";
import { ChatSearchPanel } from "./ChatSearchPanel";
import { SocketReconnectBanner } from "@/components/chat/SocketReconnectBanner";
import { Info, Pin, X, Search } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getChatApiBase } from "@/lib/apiBase";
import { safeStorage } from '@/lib/safeStorage';

const EMPTY_MESSAGES: ChatMessage[] = [];

export function ChatLayout() {
  const { joinRoom, sendMessage, sendTypingStart, sendTypingStop, editMsg, deleteMsg } = useChatSocket();
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const rooms = useChatStore((s) => s.rooms);
  const members = useChatStore((s) => s.members);
  const infoOpen = useChatStore((s) => s.infoOpen);
  const setInfoOpen = useChatStore((s) => s.setInfoOpen);
  const toggleInfo = useChatStore((s) => s.toggleInfo);
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const threadRootId = useChatStore((s) => s.threadRootId);
  const setThreadRootId = useChatStore((s) => s.setThreadRootId);
  const messages = useChatStore((s) => (activeRoomId ? s.messages[activeRoomId] : null) ?? EMPTY_MESSAGES);
  const pinnedMessages = useChatStore((s) => s.pinnedMessages);

  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<ChatMessage | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState<ChatMessage | null>(null);

  const activeRoom = (Array.isArray(rooms) ? rooms : []).find((r) => r.id === activeRoomId) ?? null;

  // Check if current user is OWNER or ADMIN (for pin permissions)
  const currentUserRole = useChatStore((s) => {
    const room = s.rooms?.find((r) => r.id === s.activeRoomId);
    return room?.memberRole;
  });
  const canPin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const pinnedMessage = activeRoomId ? pinnedMessages[activeRoomId] ?? null : null;
  const threadRootMsg = threadRootId ? (Array.isArray(messages) ? messages : []).find((m) => m.id === threadRootId) ?? null : null;

  // Members for @mention autocomplete
  const activeMembers = activeRoomId ? (members[activeRoomId] ?? []).map(m => ({
    userId: String(m.userId),
    fullName: m.fullName,
    employeeId: m.employeeId,
    avatarUrl: m.avatarUrl,
  })) : [];

  const isChannelReadOnly = activeRoom?.type === "channel" && activeRoom?.memberRole === "MEMBER";

  const handleRoomSelect = useCallback((room: ChatRoom) => {
    setActiveRoomId(room.id);
    joinRoom(room.id);
    setInfoOpen(false);
    setThreadRootId(null);

    // Load pinned message
    const token = safeStorage.getItem("access_token");
    fetch(`${getChatApiBase()}/rooms/${room.id}/pinned`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json() as { id: string; content: string; sender_name: string } | null;
        if (data) {
          useChatStore.getState().setPinnedMessage(room.id, {
            id: data.id,
            content: data.content,
            senderName: data.sender_name,
          });
        }
      }
    }).catch(() => {});
  }, [joinRoom, setActiveRoomId, setInfoOpen, setThreadRootId]);

  const handleSend = useCallback((content: string, replyToId?: string, mentionedUserIds?: string[]) => {
    if (!activeRoomId) return;
    if (editingMsg) {
      editMsg(editingMsg.id, content);
      setEditingMsg(null);
    } else {
      sendMessage(activeRoomId, content, replyToId, mentionedUserIds);
      setReplyToMsg(null);
    }
  }, [activeRoomId, editingMsg, editMsg, sendMessage]);

  const handleEdit = useCallback((msg: ChatMessage) => {
    setEditingMsg(msg);
    setReplyToMsg(null);
  }, []);

  const handleDelete = useCallback((msg: ChatMessage) => {
    setConfirmDeleteMsg(msg);
  }, []);

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyToMsg(msg);
    setEditingMsg(null);
  }, []);

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    const token = safeStorage.getItem("access_token");
    await fetch(`${getChatApiBase()}/messages/${messageId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    }).catch(() => {});
  }, []);

  const handleThread = useCallback((msg: ChatMessage) => {
    setThreadRootId(msg.id);
    setInfoOpen(false);
  }, [setThreadRootId, setInfoOpen]);

  const handleForward = useCallback((msg: ChatMessage) => {
    setForwardMsg(msg);
  }, []);

  const handlePin = useCallback(async (msg: ChatMessage) => {
    const token = safeStorage.getItem("access_token");
    await fetch(`${getChatApiBase()}/messages/${msg.id}/pin`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pin: !msg.isPinned }),
    }).catch(() => {});
  }, []);

  const handleUploadFile = useCallback(async (file: File) => {
    if (!activeRoomId) return;

    const isImage = file.type.startsWith("image/");
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Fayl hajmi ${isImage ? "10MB" : "50MB"} dan oshmasligi kerak`);
      return;
    }

    setUploadProgress("Yuklanmoqda...");
    try {
      const token = safeStorage.getItem("access_token");

      // Step 1: Request presigned URL
      const urlRes = await fetch(`${getChatApiBase()}/upload/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
          roomId: activeRoomId,
        }),
      });

      if (!urlRes.ok) {
        const err = await urlRes.json() as { message?: string };
        alert(err.message || "Upload URL xatosi");
        return;
      }

      const { uploadUrl, publicUrl } = await urlRes.json() as { uploadUrl: string; publicUrl: string };

      // Step 2: Upload directly to object storage
      setUploadProgress("Fayl yuklanmoqda...");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        alert("Fayl yuklashda xato");
        return;
      }

      // Step 3: Notify server to create the message
      setUploadProgress("Xabar yuborilmoqda...");
      const completeRes = await fetch(`${getChatApiBase()}/upload/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          roomId: activeRoomId,
          fileUrl: publicUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!completeRes.ok) {
        alert("Xabar yuborishda xato");
      }
    } catch {
      alert("Upload xatosi");
    } finally {
      setUploadProgress(null);
    }
  }, [activeRoomId]);

  const handleVoiceMessage = useCallback(async (blob: Blob, durationSec: number) => {
    const ext = blob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type || "audio/webm" });
    void durationSec;
    await handleUploadFile(file);
  }, [handleUploadFile]);

  return (
    <div
      className="flex h-full bg-background rounded-xl border border-border/60 overflow-hidden shadow-sm"
      style={{ minHeight: 0 }}
    >
      <SocketReconnectBanner />

      {/* ── Left panel: Room list or Search (270px) ── */}
      <aside className="w-[270px] flex-shrink-0 flex flex-col border-r border-border/60 bg-muted/10">
        {showSearch ? (
          <ChatSearchPanel onClose={() => setShowSearch(false)} />
        ) : (
          <RoomList onRoomSelect={handleRoomSelect} onOpenSearch={() => setShowSearch(true)} />
        )}
      </aside>

      {/* ── Center panel: Messages ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeRoom ? (
          <>
            {/* Room header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-background/80 flex-shrink-0">
              <ChatAvatar
                name={activeRoom.displayName || activeRoom.name || "?"}
                url={activeRoom.avatarUrl}
                emoji={activeRoom.avatarEmoji}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors truncate"
                  onClick={toggleInfo}
                  title="Ma'lumotni ko'rish"
                >
                  {activeRoom.displayName || activeRoom.name || "Chat"}
                </h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {activeRoom.type === "direct"
                    ? "Shaxsiy chat"
                    : activeRoom.type === "group"
                    ? "Guruh"
                    : activeRoom.type === "channel"
                    ? "📢 Kanal"
                    : activeRoom.type === "context"
                    ? "Kontekst"
                    : activeRoom.type}
                </p>
              </div>
              <button
                onClick={() => setShowSearch((v) => !v)}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  showSearch
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Xabarlarda qidirish"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={toggleInfo}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  infoOpen
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Ma'lumot panelini ochish/yopish"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Pinned message banner */}
            {pinnedMessage && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/8 border-b border-amber-500/20 flex-shrink-0">
                <Pin className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-amber-600 font-medium">Pinlangan xabar</span>
                  <p className="text-xs text-muted-foreground truncate">{pinnedMessage.content}</p>
                </div>
                <button
                  onClick={() => activeRoomId && useChatStore.getState().setPinnedMessage(activeRoomId, null)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Upload progress */}
            {uploadProgress && (
              <div className="px-4 py-1.5 bg-primary/5 border-b border-primary/20 flex-shrink-0">
                <p className="text-xs text-primary">{uploadProgress}</p>
              </div>
            )}

            {/* Messages */}
            <MessageArea
              roomId={activeRoom.id}
              canPin={canPin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
              onReact={handleReact}
              onThread={handleThread}
              onForward={handleForward}
              onPin={handlePin}
            />

            {/* Edit indicator */}
            {editingMsg && (
              <div className="mx-4 mb-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-blue-500 font-medium">Tahrirlash rejimi</p>
                  <p className="text-xs text-muted-foreground truncate">{editingMsg.content}</p>
                </div>
                <button
                  onClick={() => setEditingMsg(null)}
                  className="ml-2 text-muted-foreground hover:text-foreground text-xs flex-shrink-0"
                >
                  Bekor
                </button>
              </div>
            )}

            {/* Input with @mention support + file upload + poll */}
            <MentionInput
              roomId={activeRoom.id}
              replyTo={replyToMsg}
              onCancelReply={() => setReplyToMsg(null)}
              onSend={handleSend}
              onTypingStart={() => sendTypingStart(activeRoom.id)}
              onTypingStop={() => sendTypingStop(activeRoom.id)}
              onUploadFile={handleUploadFile}
              onVoiceMessage={handleVoiceMessage}
              onCreatePoll={() => setShowPollCreator(true)}
              members={activeMembers}
              isChannelReadOnly={isChannelReadOnly}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <span className="text-4xl">💬</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Chatni tanlang</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Chap paneldagi xonani bosing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: Thread or Info (320px, collapsible) ── */}
      {threadRootMsg && (
        <aside className="w-[320px] flex-shrink-0 border-l border-border/60 bg-muted/10 flex flex-col">
          <ThreadPanel rootMessage={threadRootMsg} onClose={() => setThreadRootId(null)} />
        </aside>
      )}

      {infoOpen && activeRoom && !threadRootMsg && (
        <aside className="w-[320px] flex-shrink-0 border-l border-border/60 bg-muted/10 flex flex-col">
          <RoomInfoPanel room={activeRoom} onClose={() => setInfoOpen(false)} />
        </aside>
      )}

      {/* Poll creator modal */}
      {showPollCreator && activeRoomId && (
        <PollCreator
          roomId={activeRoomId}
          onClose={() => setShowPollCreator(false)}
        />
      )}

      {/* Forward modal */}
      {forwardMsg && (
        <ForwardModal
          message={forwardMsg}
          onClose={() => setForwardMsg(null)}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteMsg !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteMsg(null); }}
        title="Xabarni o'chirish"
        description="Ushbu xabarni o'chirishni tasdiqlaysizmi?"
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteMsg) deleteMsg(confirmDeleteMsg.id); }}
      />
    </div>
  );
}
