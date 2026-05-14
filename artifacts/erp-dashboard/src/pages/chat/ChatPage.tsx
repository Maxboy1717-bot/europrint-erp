/**
 * @module ChatPage
 * @description React page component. Route-level UI.
 */

import { useEffect } from "react";
import { ChatLayout } from "@/components/chat/page/ChatLayout";
import { useChatSocket } from "@/hooks/chat/useChatSocket";

export default function ChatPage() {
  const { refreshRooms } = useChatSocket();

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-[var(--tg-chat-bg)] flex"
      data-chat-page="true"
    >
      <ChatLayout />
    </div>
  );
}
