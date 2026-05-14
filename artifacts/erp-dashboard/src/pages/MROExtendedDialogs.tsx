/** @module MROExtendedDialogs @description Dialog form components for MROExtended: AddEquipDialog, AddRequestDialog, AddItemDialog. */

import { UseFormReturn, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EquipFormValues, RequestFormValues, ItemFormValues } from "./MROExtendedTypes";

import { useTranslation } from '@/lib/i18n';
// --- AddEquipDialog ---

interface AddEquipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<EquipFormValues>;
  onSubmit: (data: EquipFormValues) => void;
  isPending: boolean;
}

export function AddEquipDialog({open, onOpenChange, form, onSubmit, isPending }: AddEquipDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("jihozQoshish")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>{t("name")}</Label>
            <Input {...form.register("name")} placeholder={t("jihozNomi")} data-testid="input-equip-name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t("type")}</Label>
              <Input {...form.register("type")} placeholder={t('machine')} />
            </div>
            <div className="space-y-1">
          <Label>{t("joylashuvi")}</Label>
              <Input {...form.register("location")} placeholder="1-sex" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t("xaridSanasi")}</Label>
              <Input type="date" {...form.register("purchaseDate")} />
            </div>
            <div className="space-y-1">
          <Label>{t("kafolatMuddati")}</Label>
              <Input type="date" {...form.register("warrantyExpiry")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- AddRequestDialog ---

interface AddRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RequestFormValues>;
  onSubmit: (data: RequestFormValues) => void;
  isPending: boolean;
}

export function AddRequestDialog({ open, onOpenChange, form, onSubmit, isPending }: AddRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t("texnikXizmatSorovi")}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>{t("progress.description")}</Label>
            <Input {...form.register("description")} placeholder={t("muammoTavsifi1")} data-testid="input-req-desc" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t("tur")}</Label>
              <Controller control={form.control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">{t("profilaktik")}</SelectItem>
                    <SelectItem value="corrective">{t("tamirlash")}</SelectItem>
                    <SelectItem value="inspection">{t("tekshiruv")}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
          <Label>{t("ustuvorlik")}</Label>
              <Controller control={form.control} name="priority" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("low")}</SelectItem>
                    <SelectItem value="medium">{t("medium")}</SelectItem>
                    <SelectItem value="high">{t("high")}</SelectItem>
                    <SelectItem value="critical">{t("kritik")}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="space-y-1">
          <Label>{t("masul")}</Label>
            <Input {...form.register("assignedTo")} placeholder={t("texnikIsmi")} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={isPending}>{t("submitBtn")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- AddItemDialog ---

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ItemFormValues>;
  onSubmit: (data: ItemFormValues) => void;
  isPending: boolean;
}

export function AddItemDialog({ open, onOpenChange, form, onSubmit, isPending }: AddItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Material/Ehtiyot Qism Kirim</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t("code")}</Label>
              <Input {...form.register("itemCode")} placeholder="MRO-001" data-testid="input-item-code" />
            </div>
            <div className="space-y-1">
          <Label>{t("name")}</Label>
              <Input {...form.register("name")} placeholder={t("materialNomi")} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>{t("quantity")}</Label>
              <Input type="number" {...form.register("quantity", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
          <Label>{t("unit")}</Label>
              <Input {...form.register("unit")} placeholder="dona" />
            </div>
          </div>
          <div className="space-y-1">
          <Label>{t("joylashuvi")}</Label>
            <Input {...form.register("location")} placeholder={t("k1Saqlash")} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
            <Button type="submit" disabled={isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
