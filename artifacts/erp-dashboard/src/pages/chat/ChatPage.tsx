import { useEffect } from "react";
import { ChatLayout } from "@/components/chat/page/ChatLayout";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { RefreshCw } from "lucide-react";

export default function ChatPage() {
  const { refreshRooms } = useChatSocket();

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - 4rem - 2rem)", minWidth: "1200px" }}
    >
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Ichki Chat</h1>
        <p className="text-xs text-muted-foreground">EuroPrint korporativ messenjer</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatLayout />
      </div>
    </div>
    </>
  );
}
