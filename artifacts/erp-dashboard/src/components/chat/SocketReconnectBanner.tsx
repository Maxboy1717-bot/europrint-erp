/**
 * @module SocketReconnectBanner
 * @description React UI component.
 */

import { useState, useEffect } from "react";
import { useChatSocketContext } from "@/hooks/chat/ChatSocketProvider";
import { Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
export function SocketReconnectBanner() {
  const { t } = useTranslation("common");
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
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-[14px] font-medium animate-in fade-in slide-in-from-top-2",
        showDisconnected ? "bg-[var(--ep-red)] text-white" : "bg-[var(--ep-green)] text-white"
      )}
    >
      {showDisconnected ? (
        <>
          <EPLoader className="w-4 h-4" />
          <span>{t("ulanmoqda")}</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>{t("ulandi")}</span>
        </>
      )}
    </div>
  );
}
