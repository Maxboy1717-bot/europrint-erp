/**
 * @module ShiftScheduleDialogs
 * @description Dialog and modal components for ShiftSchedule.
 */

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Sunrise, Moon } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Employee, ShiftType } from "./ShiftScheduleTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
// ─── Assign Shift Dialog ─────────────────────────────────────────────────────

interface AssignDialogProps {
  assignDialog: { open: boolean; date: string; userId: string } | null;
  onClose: () => void;
  employees: Employee[];
  selectedShift: ShiftType;
  onShiftChange: (v: ShiftType) => void;
  onSave: () => void;
  isPending: boolean;
}

export function AssignShiftDialog({
  assignDialog,
  onClose,
  employees,
  selectedShift,
  onShiftChange,
  onSave,
  isPending,
}: AssignDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={!!assignDialog?.open} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("smenaTayinlash")}</DialogTitle>
        </DialogHeader>
        {assignDialog && (
          <div className="space-y-4">
            <div>
              <Label>{t("xodim1")}</Label>
              <p className="font-medium">
                {(Array.isArray(employees) ? employees : []).find(e => e.id === assignDialog.userId)?.fullName ?? assignDialog.userId}
              </p>
            </div>
            <div>
              <Label>{t("date")}</Label>
              <p className="font-medium">{assignDialog.date}</p>
            </div>
            <div>
              <Label>{t("smenaTuri")}</Label>
              <Select value={selectedShift} onValueChange={v => onShiftChange(v as ShiftType)}>
                <SelectTrigger data-testid="select-shift-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-[var(--ep-yellow)]" />
                      Ertalab (08:00–17:00)
                    </div>
                  </SelectItem>
                  <SelectItem value="EVENING">
                    <div className="flex items-center gap-2">
                      <Sunrise className="h-4 w-4 text-[var(--ep-primary)]" />
                      Kechki (17:00–02:00)
                    </div>
                  </SelectItem>
                  <SelectItem value="NIGHT">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-[var(--ep-blue)]" />
                      Tungi (02:00–08:00)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} data-testid="btn-assign-cancel">
                {t("cancel")}
              </Button>
              <Button onClick={onSave} disabled={isPending} data-testid="btn-assign-save">
                {isPending && <EPLoader className="mr-2" />}
                Saqlash
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Swap Request Dialog ──────────────────────────────────────────────────────

interface SwapDialogProps {
  swapDialog: { open: boolean; userId: string; date: string } | null;
  onClose: () => void;
  employees: Employee[];
  swapToUserId: string;
  onSwapToUserChange: (v: string) => void;
  swapReason: string;
  onSwapReasonChange: (v: string) => void;
  onSend: () => void;
  isPending: boolean;
}

export function SwapRequestDialog({
  swapDialog,
  onClose,
  employees,
  swapToUserId,
  onSwapToUserChange,
  swapReason,
  onSwapReasonChange,
  onSend,
  isPending,
}: SwapDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={!!swapDialog?.open} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("smenaAlmashishSorovi")}</DialogTitle>
        </DialogHeader>
        {swapDialog && (
          <div className="space-y-4">
            <div>
              <Label>{t("xodim1")}</Label>
              <p className="font-medium">
                {(Array.isArray(employees) ? employees : []).find(e => e.id === swapDialog.userId)?.fullName ?? swapDialog.userId}
              </p>
            </div>
            <div>
              <Label>{t("date")}</Label>
              <p className="font-medium">{swapDialog.date}</p>
            </div>
            <div>
              <Label>Kim bilan almashtirish (ixtiyoriy)</Label>
              <Select value={swapToUserId} onValueChange={onSwapToUserChange}>
                <SelectTrigger data-testid="select-swap-to" className="h-9">
                  <SelectValue placeholder="Xodim tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(employees) ? employees : [])
                    .filter(e => e.id !== swapDialog.userId)
                    .map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("sabab")}</Label>
              <Textarea
                value={swapReason}
                onChange={e => onSwapReasonChange(e.target.value)}
                placeholder={t("almashishSababi")}
                rows={3}
                data-testid="textarea-swap-reason"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} data-testid="btn-swap-cancel">
                {t("cancel")}
              </Button>
              <Button onClick={onSend} disabled={isPending} data-testid="btn-swap-send">
                {isPending && <EPLoader className="mr-2" />}
                So'rov Yuborish
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmProps {
  deleteEntryId: number | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

export function DeleteEntryConfirm({ deleteEntryId, onOpenChange, onConfirm }: DeleteConfirmProps) {
  const { t } = useTranslation("common");
  return (
    <ConfirmDialog
      open={deleteEntryId !== null}
      onOpenChange={onOpenChange}
      title={t("smenaYozuviniOchirish")}
      description={t("ushbuSmenaYozuviniOchirishniTasdiqlaysizmi")}
      confirmText="O'chirish"
      variant="destructive"
      onConfirm={onConfirm}
    />
  );
}
