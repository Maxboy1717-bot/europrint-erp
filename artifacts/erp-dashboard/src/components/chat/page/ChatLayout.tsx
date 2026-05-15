/**
 * @module ChatLayout
 * @description Top-level orchestrator for the chat feature. Owns all state and
 * async callbacks, then distributes them to ChatLayoutSidebar (left panel),
 * ChatLayoutMessages (center panel), and the right-side Thread/Info asides.
 * Modals (Poll, Forward, ConfirmDelete, CreateTask) are rendered here so they
 * sit outside the panel flex layout and can overlay the full viewport.
 */

import { useCallback, useState } from "react";
import { useChatStore, ChatMessage, ChatRoom } from "@/store/chatStore";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { RoomInfoPanel } from "./RoomInfoPanel";
import { ThreadPanel } from "./ThreadPanel";
import { PollCreator } from "./PollCreator";
import { ForwardModal } from "./ForwardModal";
import { CreateTaskModal } from "./CreateTaskModal";
import { SocketReconnectBanner } from "@/components/chat/SocketReconnectBanner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getChatApiBase } from "@/lib/apiBase";
import { apiRequest } from "@/lib/queryClient";
import { ChatLayoutSidebar } from "./ChatLayoutSidebar";
import { ChatLayoutMessages } from "./ChatLayoutMessages";
import { useTranslation } from '@/lib/i18n';
import { useToast } from "@/hooks/use-toast";
import {
  EMPTY_MESSAGES,
  VIDEO_HEIGHT_DEFAULT,
  VIDEO_HEIGHT_EXPANDED,
  ChatMemberEntry,
} from "./ChatLayoutTypes";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatLayout() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { joinRoom, sendMessage, sendTypingStart, sendTypingStop, editMsg, deleteMsg } =
    useChatSocket();

  // ── Store selectors ──────────────────────────────────────────────────────
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const rooms = useChatStore((s) => s.rooms);
  const members = useChatStore((s) => s.members);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const infoOpen = useChatStore((s) => s.infoOpen);
  const setInfoOpen = useChatStore((s) => s.setInfoOpen);
  const toggleInfo = useChatStore((s) => s.toggleInfo);
  const setActiveRoomId = useChatStore((s) => s.setActiveRoomId);
  const threadRootId = useChatStore((s) => s.threadRootId);
  const setThreadRootId = useChatStore((s) => s.setThreadRootId);
  const messages = useChatStore(
    (s) => (activeRoomId ? s.messages[activeRoomId] : null) ?? EMPTY_MESSAGES
  );
  const pinnedMessages = useChatStore((s) => s.pinnedMessages);
  const typingUsers = useChatStore((s) =>
    activeRoomId ? s.typingUsers[activeRoomId] : undefined
  );
  const currentUserRole = useChatStore((s) => {
    const room = s.rooms?.find((r) => r.id === s.activeRoomId);
    return room?.memberRole;
  });

  // ── Derived values ───────────────────────────────────────────────────────
  const activeRoom =
    (Array.isArray(rooms) ? rooms : []).find((r) => r.id === activeRoomId) ?? null;
  const canPin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const pinnedMessage = activeRoomId ? pinnedMessages[activeRoomId] ?? null : null;
  const threadRootMsg = threadRootId
    ? (Array.isArray(messages) ? messages : []).find((m) => m.id === threadRootId) ?? null
    : null;
  const activeMembers: ChatMemberEntry[] = activeRoomId
    ? (members[activeRoomId] ?? []).map((m) => ({
        userId: String(m.userId),
        fullName: m.fullName,
        employeeId:
          typeof m.employeeId === 'number'
            ? m.employeeId
            : m.employeeId != null && /^\d+$/.test(String(m.employeeId))
              ? Number(m.employeeId)
              : null,
        avatarUrl: m.avatarUrl ?? null,
      }))
    : [];
  const isChannelReadOnly =
    activeRoom?.type === "channel" && activeRoom?.memberRole === "MEMBER";
  const memberCount = activeRoomId ? (members[activeRoomId] ?? []).length : 0;
  const typingText = (() => {
    if (!typingUsers || typingUsers.size === 0) return null;
    const names = Array.from(typingUsers);
    if (names.length === 1) return t("typingOne", { name: names[0] });
    if (names.length === 2) return t("typingTwo", { name1: names[0], name2: names[1] });
    return t("typingMany", { count: names.length });
  })();

  // ── Local state ──────────────────────────────────────────────────────────
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<ChatMessage | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState<ChatMessage | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [taskMsg, setTaskMsg] = useState<ChatMessage | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [videoCallUrl, setVideoCallUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoHeight, setVideoHeight] = useState(VIDEO_HEIGHT_DEFAULT);
  const [videoMinimized, setVideoMinimized] = useState(false);

  // ── Callbacks ────────────────────────────────────────────────────────────
  const handleRoomSelect = useCallback(
    (room: ChatRoom) => {
      setActiveRoomId(room.id);
      joinRoom(room.id);
      setInfoOpen(false);
      setThreadRootId(null);
      setMobileShowChat(true);
      setVideoCallUrl(null);
      setVideoMinimized(false);

      apiRequest<{ id: string; content: string; sender_name: string } | null>(
        'GET',
        `${getChatApiBase()}/rooms/${room.id}/pinned`,
      )
        .then((data) => {
          if (data) {
            useChatStore.getState().setPinnedMessage(room.id, {
              id: data.id,
              content: data.content,
              senderName: data.sender_name,
            });
          }
        })
        .catch(e => {
          console.error('Failed to load pinned message:', e);
          toast({ title: t('xato'), description: String(e), variant: 'destructive' });
        });
    },
    [joinRoom, setActiveRoomId, setInfoOpen, setThreadRootId, toast]
  );

  const handleSend = useCallback(
    (content: string, replyToId?: string, mentionedUserIds?: string[]) => {
      if (!activeRoomId) return;
      if (editingMsg) {
        editMsg(editingMsg.id, content);
        setEditingMsg(null);
      } else {
        sendMessage(activeRoomId, content, replyToId, mentionedUserIds);
        setReplyToMsg(null);
      }
    },
    [activeRoomId, editingMsg, editMsg, sendMessage]
  );

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
    try {
      await apiRequest('POST', `${getChatApiBase()}/messages/${messageId}/reactions`, { emoji });
    } catch (e) {
      console.error('Failed to send reaction:', e);
      toast({ title: t('xato'), description: String(e), variant: 'destructive' });
    }
  }, [toast]);

  const handleThread = useCallback(
    (msg: ChatMessage) => {
      setThreadRootId(msg.id);
      setInfoOpen(false);
    },
    [setThreadRootId, setInfoOpen]
  );

  const handleForward = useCallback((msg: ChatMessage) => {
    setForwardMsg(msg);
  }, []);

  const handlePin = useCallback(async (msg: ChatMessage) => {
    try {
      await apiRequest('PATCH', `${getChatApiBase()}/messages/${msg.id}/pin`, { pin: !msg.isPinned });
    } catch (e) {
      console.error('Failed to pin message:', e);
      toast({ title: t('xato'), description: String(e), variant: 'destructive' });
    }
  }, [toast]);

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!activeRoomId) return;
      const isImage = file.type.startsWith("image/");
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t("fileSizeLimitMsg", { limit: isImage ? "10MB" : "50MB" }));
        return;
      }
      setUploadProgress(t("loading"));
      try {
        let uploadUrl: string;
        let publicUrl: string;
        try {
          const data = await apiRequest<{ uploadUrl: string; publicUrl: string }>(
            'POST',
            `${getChatApiBase()}/upload/request-url`,
            {
              name: file.name,
              size: file.size,
              contentType: file.type,
              roomId: activeRoomId,
            },
          );
          uploadUrl = data.uploadUrl;
          publicUrl = data.publicUrl;
        } catch (e) {
          alert((e as Error).message || t("uploadUrlError"));
          return;
        }
        setUploadProgress(t("fileUploading"));
        const formData = new FormData();
        formData.append("file", file, file.name);
        // NOTE: This is a direct PUT to an external S3 presigned URL — NOT our backend.
        // apiRequest is intentionally NOT used here (it would inject our JWT into an
        // S3 request and break the presigned signature).
        const uploadRes = await fetch(uploadUrl, { method: "PUT", body: formData });
        if (!uploadRes.ok) { alert(t("fileUploadError")); return; }
        setUploadProgress(t("messageSending"));
        try {
          await apiRequest('POST', `${getChatApiBase()}/upload/complete`, {
            roomId: activeRoomId,
            fileUrl: publicUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          });
        } catch {
          alert(t("messageSendError"));
        }
      } catch {
        alert(t("uploadError"));
      } finally {
        setUploadProgress(null);
      }
    },
    [activeRoomId]
  );

  const handleVoiceMessage = useCallback(
    async (blob: Blob, durationSec: number) => {
      const ext = blob.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `voice-${Date.now()}.${ext}`, {
        type: blob.type || "audio/webm",
      });
      void durationSec;
      await handleUploadFile(file);
    },
    [handleUploadFile]
  );

  const handleMobileBack = useCallback(() => {
    setMobileShowChat(false);
    setActiveRoomId(null as unknown as string);
  }, [setActiveRoomId]);

  const handleVideoCall = useCallback(async () => {
    if (!activeRoomId || !activeRoom) return;
    if (videoCallUrl) { setVideoCallUrl(null); return; }
    setVideoLoading(true);
    try {
      const data = await apiRequest<{
        token: string | null;
        jitsiUrl: string;
        roomName: string;
        embedUrl: string;
      }>('POST', `${getChatApiBase()}/video/token`, { roomId: activeRoomId });
      const separator = data.embedUrl.includes("#") ? "&" : "#";
      const configFlags = [
        "config.prejoinPageEnabled=false",
        "config.startWithAudioMuted=false",
        "config.startWithVideoMuted=false",
        "config.disableDeepLinking=true",
        "config.hideConferenceSubject=false",
        "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
        'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","tileview","fullscreen"]',
      ].join("&");
      const callUrl = data.embedUrl.includes("config.prejoinPageEnabled")
        ? data.embedUrl
        : `${data.embedUrl}${separator}${configFlags}`;
      sendMessage(
        activeRoomId,
        `🎥 Video qo'ng'iroq boshlandi. Qo'shilish: ${data.embedUrl.split("#")[0].split("?jwt=")[0]}`
      );
      setVideoCallUrl(callUrl);
      setVideoMinimized(false);
    } catch {
      const roomSlug = `europrint-room-${activeRoomId}`;
      const callUrl = `https://meet.jit.si/${roomSlug}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;
      sendMessage(activeRoomId, `🎥 Video qo'ng'iroq: https://meet.jit.si/${roomSlug}`);
      setVideoCallUrl(callUrl);
      setVideoMinimized(false);
    } finally {
      setVideoLoading(false);
    }
  }, [activeRoomId, activeRoom, sendMessage, videoCallUrl]);

  const handleTaskFromChat = useCallback((msg: ChatMessage) => {
    setTaskMsg(msg);
    setShowTaskModal(true);
  }, []);

  const handleTaskFromLastMsg = useCallback(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) handleTaskFromChat(lastMsg);
    else setShowTaskModal(true);
  }, [messages, handleTaskFromChat]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full overflow-hidden" style={{ minHeight: 0 }}>
      <SocketReconnectBanner />

      {/* Left panel */}
      <ChatLayoutSidebar
        showSearch={showSearch}
        mobileShowChat={mobileShowChat}
        onRoomSelect={handleRoomSelect}
        onOpenSearch={() => setShowSearch(true)}
        onCloseSearch={() => setShowSearch(false)}
      />

      {/* Center panel */}
      <ChatLayoutMessages
        activeRoom={activeRoom!}
        activeRoomId={activeRoomId ?? ""}
        messages={messages}
        memberCount={memberCount}
        canPin={canPin}
        isChannelReadOnly={isChannelReadOnly}
        activeMembers={activeMembers}
        onlineUserIds={onlineUserIds}
        typingText={typingText}
        pinnedMessage={pinnedMessage}
        uploadProgress={uploadProgress}
        editingMsg={editingMsg}
        replyToMsg={replyToMsg}
        onCancelEdit={() => setEditingMsg(null)}
        onCancelReply={() => setReplyToMsg(null)}
        videoCallUrl={videoCallUrl}
        videoLoading={videoLoading}
        videoHeight={videoHeight}
        videoMinimized={videoMinimized}
        onVideoCall={handleVideoCall}
        onVideoClose={() => { setVideoCallUrl(null); setVideoMinimized(false); }}
        onVideoToggleMinimize={() => setVideoMinimized((v) => !v)}
        onVideoToggleHeight={() =>
          setVideoHeight((h) => (h >= VIDEO_HEIGHT_EXPANDED ? VIDEO_HEIGHT_DEFAULT : VIDEO_HEIGHT_EXPANDED))
        }
        showSearch={showSearch}
        infoOpen={infoOpen}
        onToggleSearch={() => setShowSearch((v) => !v)}
        onToggleInfo={toggleInfo}
        onMobileBack={handleMobileBack}
        onTaskFromLastMsg={handleTaskFromLastMsg}
        onSend={handleSend}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReply={handleReply}
        onReact={handleReact}
        onThread={handleThread}
        onForward={handleForward}
        onPin={handlePin}
        onUploadFile={handleUploadFile}
        onVoiceMessage={handleVoiceMessage}
        onCreatePoll={() => setShowPollCreator(true)}
        onTypingStart={() => activeRoomId && sendTypingStart(activeRoomId)}
        onTypingStop={() => activeRoomId && sendTypingStop(activeRoomId)}
        onUnpinMessage={() =>
          activeRoomId && useChatStore.getState().setPinnedMessage(activeRoomId, null)
        }
        mobileShowChat={mobileShowChat}
      />

      {/* Right panel: Thread */}
      {threadRootMsg && (
        <aside className="hidden lg:flex w-full sm:w-[380px] flex-shrink-0 border-l border-[var(--tg-border)] bg-[var(--tg-sidebar-bg)] flex-col">
          <ThreadPanel rootMessage={threadRootMsg} onClose={() => setThreadRootId(null)} />
        </aside>
      )}

      {/* Right panel: Room info */}
      {infoOpen && activeRoom && !threadRootMsg && (
        <aside className="hidden lg:flex w-full sm:w-[380px] flex-shrink-0 border-l border-[var(--tg-border)] bg-[var(--tg-sidebar-bg)] flex-col">
          <RoomInfoPanel room={activeRoom} onClose={() => setInfoOpen(false)} />
        </aside>
      )}

      {/* Modals */}
      {showPollCreator && activeRoomId && (
        <PollCreator roomId={activeRoomId} onClose={() => setShowPollCreator(false)} />
      )}

      {forwardMsg && (
        <ForwardModal message={forwardMsg} onClose={() => setForwardMsg(null)} />
      )}

      <ConfirmDialog
        open={confirmDeleteMsg !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteMsg(null); }}
        title={t("xabarniOchirish")}
        description={t("ushbuXabarniOchirishniTasdiqlaysizmi")}
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteMsg) deleteMsg(confirmDeleteMsg.id); }}
      />

      <CreateTaskModal
        message={taskMsg}
        open={showTaskModal}
        onClose={() => { setShowTaskModal(false); setTaskMsg(null); }}
      />
    </div>
  );
}
