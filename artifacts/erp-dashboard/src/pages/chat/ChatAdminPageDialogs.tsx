/**
 * @module ChatAdminPageDialogs
 * @description Room members sheet and confirm dialog for ChatAdminPage.
 */

import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseMutationResult } from "@tanstack/react-query";
import { AdminRoom, AdminMember } from "./ChatAdminPageTypes";

import { useTranslation } from '@/lib/i18n';
interface RoomMembersSheetProps {
  selectedRoom: AdminRoom | null;
  onClose: () => void;
  membersLoading: boolean;
  roomMembers: AdminMember[];
  confirmRemove: { roomId: string; userId: string; name: string } | null;
  setConfirmRemove: (v: { roomId: string; userId: string; name: string } | null) => void;
  removeMemberMutation: UseMutationResult<unknown, Error, { roomId: string; userId: string }, unknown>;
  changeRoleMutation: UseMutationResult<unknown, Error, { roomId: string; userId: string; role: string }, unknown>;
}

export function RoomMembersSheet({selectedRoom, onClose, membersLoading, roomMembers,
  confirmRemove, setConfirmRemove, removeMemberMutation, changeRoleMutation,
}: RoomMembersSheetProps) {
  const { t } = useTranslation('common');
  return (
    <Sheet open={!!selectedRoom} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-[400px] sm:w-[480px] overflow-y-auto p-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {selectedRoom?.name || "Xona"} — A'zolar
          </SheetTitle>
        </SheetHeader>
        {membersLoading ? (
          <div className="text-center text-muted-foreground py-8">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(roomMembers) ? roomMembers : []).map((m) => (
              <div
                key={m.userId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border border-border/40",
                  m.leftAt ? "opacity-50" : ""
                )}
              >
                <div>
                  <p className="text-sm font-medium">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground">{m.employeeId}</p>
                  {m.leftAt && (
                    <p className="text-xs text-[var(--ep-red)]">
                      Chiqgan: {format(new Date(m.leftAt), "dd.MM.yyyy")}
                    </p>
                  )}
                </div>
                {!m.leftAt && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={m.role}
                      onValueChange={(role) =>
                        changeRoleMutation.mutate({
                          roomId: selectedRoom?.id ?? '',
                          userId: m.userId,
                          role,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OWNER">Egasi</SelectItem>
                        <SelectItem value="ADMIN">{t('admin')}</SelectItem>
                        <SelectItem value="MEMBER">A'zo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs text-[var(--ep-red)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setConfirmRemove({ roomId: selectedRoom?.id ?? '', userId: m.userId, name: m.fullName })}
                      disabled={removeMemberMutation.isPending}
                    >
                      Chiqarish
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {roomMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">A'zolar topilmadi</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface RemoveMemberConfirmProps {
  confirmRemove: { roomId: string; userId: string; name: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveMemberConfirm({ confirmRemove, onClose, onConfirm }: RemoveMemberConfirmProps) {
  return (
    <ConfirmDialog
      open={confirmRemove !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="A'zoni chiqarish"
      description={`${confirmRemove?.name ?? ''} ni chatdan chiqarishni tasdiqlaysizmi?`}
      confirmText="Chiqarish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}
