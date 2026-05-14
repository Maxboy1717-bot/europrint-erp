/**
 * @module RoomInfoPanel
 * @description React UI component.
 */

import { useState } from "react";
import { X, Crown, ShieldCheck, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChatRoom, ChatMember, useChatStore } from "@/store/chatStore";
import { ChatAvatar } from "./ChatAvatar";
import { useRoomMembers } from "@/hooks/chat/useRooms";
import { SharedFiles } from "./SharedFiles";
import { PinnedMessages } from "./PinnedMessages";
import { RoomSettingsModal } from "./RoomSettingsModal";

import { useTranslation } from '@/lib/i18n';
interface Props {
  room: ChatRoom;
  onClose: () => void;
}

type InfoTab = "members" | "files" | "pinned";

function RoleBadge({ role }: { role: string }) {
  if (role === "OWNER") return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/50 text-[var(--ep-yellow)] dark:text-yellow-400 gap-1">
      <Crown className="w-2.5 h-2.5" />
      Egasi
    </Badge>
  );
  if (role === "ADMIN") return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/50 text-[var(--ep-blue)] dark:text-blue-400 gap-1">
      <ShieldCheck className="w-2.5 h-2.5" />
      Admin
    </Badge>
  );
  return null;
}

export function RoomInfoPanel({room, onClose }: Props) {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState<InfoTab>("members");
  const [showSettings, setShowSettings] = useState(false);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const { data: members = [] } = useRoomMembers(room.id);

  const sortedMembers = [...members].sort((a: ChatMember, b: ChatMember) => {
    const order = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
    return (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3);
  });

  const onlineCount = (Array.isArray(members) ? members : []).filter((m: ChatMember) => onlineUserIds.has(Number(m.userId))).length;
  const canPin = room.memberRole === "OWNER" || room.memberRole === "ADMIN";

  const tabs: { key: InfoTab; label: string }[] = [
    { key: "members", label: "A'zolar" },
    { key: "files", label: "Fayllar" },
    { key: "pinned", label: "Pinlangan" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
        <h3 className="font-semibold text-sm">Ma'lumot</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Xona sozlamalari"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room info */}
      <div className="p-4 border-b border-border/40 flex flex-col items-center gap-3 flex-shrink-0">
        <ChatAvatar
          name={room.displayName || room.name || "?"}
          url={room.avatarUrl}
          emoji={room.avatarEmoji}
          size={64}
        />
        <div className="text-center">
          <h4 className="font-semibold text-sm">{room.displayName || room.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {room.type === "direct" ? "Shaxsiy chat" :
             room.type === "group" ? "Guruh" :
             room.type === "channel" ? "Kanal" : room.type}
          </p>
          {room.description && (
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-[200px]">{room.description}</p>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-border/40 flex-shrink-0">
        {(Array.isArray(tabs) ? tabs : []).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 text-xs font-medium border-b-2 transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "members" && (
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                A'zolar
              </p>
              <span className="text-xs text-muted-foreground">
                {onlineCount} online · {members.length} jami
              </span>
            </div>
            <div className="space-y-0.5 px-2 pb-3">
              {(Array.isArray(sortedMembers) ? sortedMembers : []).map((m: ChatMember) => {
                const isOnline = onlineUserIds.has(Number(m.userId));
                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/40 transition-colors"
                  >
                    <ChatAvatar name={m.fullName || "?"} url={m.avatarUrl} size={34} online={isOnline} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{m.fullName}</span>
                        <RoleBadge role={m.role} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isOnline ? (
                          <span className="text-[var(--ep-green)] font-medium">{t('online1')}</span>
                        ) : (
                          <span>{t('offline3')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">A'zolar yo'q</p>
              )}
            </div>
          </div>
        )}

        {tab === "files" && <SharedFiles roomId={room.id} />}
        {tab === "pinned" && <PinnedMessages roomId={room.id} canPin={canPin} />}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <RoomSettingsModal room={room} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
