import { useState, useEffect } from "react";
import { useChatSocketContext } from "@/hooks/chat/ChatSocketProvider";
import { Wifi, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SocketReconnectBanner() {
  const { connected } = useChatSocketContext();
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasEverConnected, setWasEverConnected] = useState(false);

  useEffect(() => {
    if (connected) {
      setWasEverConnected(true);
      if (showDisconnected) {
        setShowDisconnected(false);
        setShowReconnected(true);
        const t = setTimeout(() => setShowReconnected(false), 2500);
        return () => clearTimeout(t);
      }
      return undefined;
    } else if (wasEverConnected) {
      const t = setTimeout(() => setShowDisconnected(true), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [connected, wasEverConnected, showDisconnected]);

  if (!showDisconnected && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2",
        showDisconnected ? "bg-red-500 text-white" : "bg-green-500 text-white"
      )}
    >
      {showDisconnected ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Ulanmoqda...</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Ulandi</span>
        </>
      )}
    </div>
  );
}
