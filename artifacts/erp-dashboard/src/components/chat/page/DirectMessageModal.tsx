/**
 * @module DirectMessageModal
 * @description React UI component.
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEmployeeSearch } from "@/hooks/chat/useRooms";
import { ChatAvatar } from "./ChatAvatar";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useAuth } from "@/hooks/useAuth";
import { getChatApiBase } from "@/lib/apiBase";
import { useChatStore, ChatRoom } from "@/store/chatStore";
import { apiRequest } from "@/lib/queryClient";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface Employee {
  id: number;
  fullName: string;
  employeeId: string;
  avatarUrl?: string;
  departmentName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DirectMessageModal({ open, onClose }: Props) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<number | null>(null);
  const { startDirect, joinRoom } = useChatSocket();

  const { data: employees = [] } = useEmployeeSearch(search);

  const start = async (emp: Employee) => {
    setLoading(emp.id);
    try {
      // Emit socket event (fire and forget)
      startDirect(emp.id);

      // Also call REST API as reliable fallback
      const data = await apiRequest<Record<string, unknown>>(
        'POST',
        `${getChatApiBase()}/rooms/direct`,
        { targetUserId: emp.id },
      );

      const room: ChatRoom = {
        id: String(data.id),
        name: String(data.name || emp.fullName),
        displayName: String(data.displayName || data.name || emp.fullName),
        type: "direct",
        avatarUrl: (data.avatarUrl as string) || emp.avatarUrl,
        unreadCount: Number(data.unreadCount) || 0,
        createdAt: String(data.createdAt || new Date().toISOString()),
        memberRole: "MEMBER",
      };

      const st = useChatStore.getState();
      const exists = st.rooms?.some((r) => r.id === room.id);
      if (!exists) {
        st.setRooms([room, ...st.rooms]);
      }
      st.setActiveRoomId(room.id);
      joinRoom(room.id);
    } catch {
      // Silently ignore — socket event may still deliver the room
    } finally {
      setLoading(null);
      onClose();
      setSearch("");
    }
  };

  const handleClose = () => {
    onClose();
    setSearch("");
  };

  const filtered = (employees as Employee[]).filter((e) => e.id !== user?.id);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiDirectXabar")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("xodimniQidirish")}
              className="pl-8 h-9 text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {(Array.isArray(filtered) ? filtered : []).slice(0, 30).map((emp) => (
              <button
                key={emp.id}
                onClick={() => start(emp)}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 text-left transition-colors disabled:opacity-60"
              >
                {loading === emp.id ? (
                  <EPLoader tone="muted" className="w-9 h-9 flex-shrink-0" />
                ) : (
                  <ChatAvatar name={emp.fullName} url={emp.avatarUrl} size={36} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.fullName}</p>
                  <p className="text-xs text-muted-foreground">{emp.departmentName || emp.employeeId}</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                {search ? "Xodim topilmadi" : "Qidirish uchun ism kiriting"}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
