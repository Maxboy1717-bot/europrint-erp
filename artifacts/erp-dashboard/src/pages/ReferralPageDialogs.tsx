/**
 * @module ReferralPageDialogs
 * @description Dialog/modal components for ReferralPage:
 *   - AddReferralDialog  — submit a new referral
 *   - EditReferralDialog — HR status/bonus update
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Referral, AddForm, EditForm } from "./ReferralPageTypes";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// AddReferralDialog
// ---------------------------------------------------------------------------

interface AddReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AddForm;
  onFormChange: (updater: (prev: AddForm) => AddForm) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function AddReferralDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  isPending,
  onSubmit,
}: AddReferralDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("doStTanishTavsiyaQilish")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>{t("toliqIsmi")}</Label>
            <Input
              value={form.candidate_full_name}
              onChange={e => onFormChange(f => ({ ...f, candidate_full_name: e.target.value }))}
              placeholder={t("ismFamiliyaOtasiningIsmi")}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t("telefonRaqami")}</Label>
            <Input
              value={form.candidate_phone}
              onChange={e => onFormChange(f => ({ ...f, candidate_phone: e.target.value }))}
              placeholder="+998 90 000 00 00"
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t("qaysiLavozimga")}</Label>
            <Input
              value={form.position_title}
              onChange={e => onFormChange(f => ({ ...f, position_title: e.target.value }))}
              placeholder={t("lavozimNomi1")}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            onClick={onSubmit}
            disabled={!form.candidate_full_name || !form.candidate_phone || !form.position_title || isPending}
          >
            {isPending ? "Yuborilmoqda..." : "Tavsiya qilish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// EditReferralDialog
// ---------------------------------------------------------------------------

interface EditReferralDialogProps {
  editTarget: Referral | null;
  onClose: () => void;
  editForm: EditForm;
  onEditFormChange: (updater: (prev: EditForm) => EditForm) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function EditReferralDialog({
  editTarget,
  onClose,
  editForm,
  onEditFormChange,
  isPending,
  onSubmit,
}: EditReferralDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={!!editTarget} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("referralHolatiYangilashHr")}</DialogTitle>
        </DialogHeader>
        {editTarget && (
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("status28")}</Label>
              <Select value={editForm.status} onValueChange={v => onEditFormChange(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("Kutilmoqda")}</SelectItem>
                  <SelectItem value="interview">{t("intervyuda")}</SelectItem>
                  <SelectItem value="hired">{t("qabulQilindi")}</SelectItem>
                  <SelectItem value="rejected">{t("radEtildi")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.status === "hired" && (
              <>
                <div>
                  <Label>{t("bonusTuri")}</Label>
                  <Select value={editForm.bonus_type} onValueChange={v => onEditFormChange(f => ({ ...f, bonus_type: v }))}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder={t("bonusTanlang")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="money">{t("pulBonusi")}</SelectItem>
                      <SelectItem value="vacation">{t("tatilKunlari")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{editForm.bonus_type === "vacation" ? "Necha kun ta'til?" : "Bonus miqdori (so'm)"}</Label>
                  <Input
                    type="number"
                    value={editForm.bonus_amount}
                    onChange={e => onEditFormChange(f => ({ ...f, bonus_amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bp"
                    checked={editForm.bonus_paid}
                    onChange={e => onEditFormChange(f => ({ ...f, bonus_paid: e.target.checked }))}
                  />
                  <Label htmlFor="bp">{t("bonusTolandi")}</Label>
                </div>
              </>
            )}
            <div>
              <Label>{t("hrIzohi")}</Label>
              <Textarea
                value={editForm.hr_notes}
                onChange={e => onEditFormChange(f => ({ ...f, hr_notes: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("Bekor")}</Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
