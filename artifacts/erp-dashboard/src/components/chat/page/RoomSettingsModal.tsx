/**
 * @module RoomSettingsModal
 * @description React UI component.
 */

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Archive, ChevronDown } from "lucide-react";
import { ChatRoom, useChatStore } from "@/store/chatStore";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

const EMOJI_PRESETS = ["💬", "📢", "🚀", "🎯", "💡", "🔥", "⚡", "🌟", "📋", "🏢", "👥", "🎨", "📊", "🔧", "🌐"];

interface Props {
  room: ChatRoom;
  onClose: () => void;
}

export function RoomSettingsModal({ room, onClose }: Props) {
  const { t } = useTranslation("common");
  const [name, setName] = useState(room.name || room.displayName || "");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [description, setDescription] = useState(room.description || "");
  const [avatarEmoji, setAvatarEmoji] = useState(room.avatarEmoji || "");
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateRoom = useChatStore((s) => s.updateRoom);

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string; avatarEmoji?: string }) => {
      const res = await apiRequest('PATCH', `/api/chat/rooms/${room.id}`, data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || "Failed to update room");
      }
      return res.json();
    },
    onSuccess: (data) => {
      updateRoom(room.id, {
        name: data.name || name,
        displayName: data.name || name,
        description: data.description || description,
        avatarEmoji: data.avatar_emoji || avatarEmoji,
      });
      qc.invalidateQueries({ queryKey: ["chat-rooms"] });
      toast({ title: "Xona sozlamalari saqlandi" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    },
  });

  const muteMutation = useMutation({
    mutationFn: async (duration: string) => {
      const res = await apiRequest('POST', `/api/chat/rooms/${room.id}/mute`, { duration });
      if (!res.ok) throw new Error("Failed to mute");
      return res.json();
    },
    onSuccess: (data) => {
      updateRoom(room.id, { isMuted: data.isMuted });
      toast({ title: data.isMuted ? "Xona jimlatildi" : "Jimlik olib tashlandi" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', `/api/chat/rooms/${room.id}`, { isArchived: true });
      if (!res.ok) throw new Error("Failed to archive");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-rooms"] });
      toast({ title: "Xona arxivlandi" });
      onClose();
    },
  });

  const canEdit = room.memberRole === "OWNER" || room.memberRole === "ADMIN";

  return (
    <>
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("xonaSozlamalari")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar emoji picker */}
          {canEdit && room.type !== "direct" && (
            <div>
              <Label className="text-xs mb-1.5 block">Avatar (emoji)</Label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(EMOJI_PRESETS) ? EMOJI_PRESETS : []).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all
                      ${avatarEmoji === emoji
                        ? "bg-primary/10 ring-2 ring-primary scale-110"
                        : "hover:bg-muted"
                      }`}
                  >
                    {emoji}
                  </button>
                ))}
                {avatarEmoji && !EMOJI_PRESETS.includes(avatarEmoji) && (
                  <button
                    className="w-9 h-9 rounded-xl text-lg flex items-center justify-center bg-primary/10 ring-2 ring-primary"
                  >
                    {avatarEmoji}
                  </button>
                )}
                {avatarEmoji && (
                  <button
                    onClick={() => setAvatarEmoji("")}
                    className="w-9 h-9 rounded-xl text-xs flex items-center justify-center hover:bg-muted text-muted-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Room name */}
          {canEdit && room.type !== "direct" && (
            <div>
              <Label htmlFor="room-name" className="text-xs mb-1.5 block">{t("xonaNomi")}</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("xonaNomi1")}
                className="h-9"
              />
            </div>
          )}

          {/* Description */}
          {canEdit && room.type !== "direct" && (
            <div>
              <Label htmlFor="room-desc" className="text-xs mb-1.5 block">{t("progress.description")}</Label>
              <Textarea
                id="room-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("qisqachaTavsif")}
                className="resize-none text-sm"
                rows={2}
              />
            </div>
          )}

          {/* Mute options */}
          <div>
            <Label className="text-xs mb-1.5 block">{t("notifications")}</Label>
            <div className="flex gap-2">
              {room.isMuted ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-sm"
                  onClick={() => muteMutation.mutate("unmute")}
                  disabled={muteMutation.isPending}
                >
                  <Bell className="w-4 h-4" />
                  {t("yoqish")}
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 text-sm">
                      <BellOff className="w-4 h-4" />
                      {t("jimlatish")}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => muteMutation.mutate("1h")}>1 soat</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => muteMutation.mutate("8h")}>8 soat</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => muteMutation.mutate("24h")}>1 kun</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => muteMutation.mutate("forever")}>{t("doimiy")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Archive option */}
          {canEdit && room.type !== "direct" && (
            <div className="pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-sm text-[var(--ep-primary)] hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                onClick={() => setConfirmArchive(true)}
                disabled={archiveMutation.isPending}
              >
                <Archive className="w-4 h-4" />
                {t("xonaniArxivlash")}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          {canEdit && room.type !== "direct" && (
            <Button
              onClick={() =>
                updateMutation.mutate({
                  name: name.trim() || undefined,
                  description: description.trim() || undefined,
                  avatarEmoji: avatarEmoji || undefined,
                })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirmArchive}
      onOpenChange={(open) => { if (!open) setConfirmArchive(false); }}
      title={t("xonaniArxivlash")}
      description={t("xonaniArxivlashniTasdiqlaysizmiSidebarDan")}
      confirmText="Arxivlash"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => archiveMutation.mutate()}
    />
    </>
  );
}
