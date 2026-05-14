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
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Jihoz Qo'shish</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>Nomi</Label>
            <Input {...form.register("name")} placeholder="Jihoz nomi" data-testid="input-equip-name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Turi</Label>
              <Input {...form.register("type")} placeholder={t('machine')} />
            </div>
            <div className="space-y-1">
          <Label>Joylashuvi</Label>
              <Input {...form.register("location")} placeholder="1-sex" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Xarid sanasi</Label>
              <Input type="date" {...form.register("purchaseDate")} />
            </div>
            <div className="space-y-1">
          <Label>Kafolat muddati</Label>
              <Input type="date" {...form.register("warrantyExpiry")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending}>Saqlash</Button>
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
        <DialogHeader><DialogTitle className="text-[18px] font-semibold">Texnik Xizmat So'rovi</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>Tavsif</Label>
            <Input {...form.register("description")} placeholder="Muammo tavsifi" data-testid="input-req-desc" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Tur</Label>
              <Controller control={form.control} name="type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Profilaktik</SelectItem>
                    <SelectItem value="corrective">Ta'mirlash</SelectItem>
                    <SelectItem value="inspection">Tekshiruv</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
          <Label>Ustuvorlik</Label>
              <Controller control={form.control} name="priority" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Past</SelectItem>
                    <SelectItem value="medium">O'rta</SelectItem>
                    <SelectItem value="high">Yuqori</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="space-y-1">
          <Label>Mas'ul</Label>
            <Input {...form.register("assignedTo")} placeholder="Texnik ismi" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending}>Yuborish</Button>
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
          <Label>Kod</Label>
              <Input {...form.register("itemCode")} placeholder="MRO-001" data-testid="input-item-code" />
            </div>
            <div className="space-y-1">
          <Label>Nomi</Label>
              <Input {...form.register("name")} placeholder="Material nomi" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
          <Label>Miqdor</Label>
              <Input type="number" {...form.register("quantity", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
          <Label>Birlik</Label>
              <Input {...form.register("unit")} placeholder="dona" />
            </div>
          </div>
          <div className="space-y-1">
          <Label>Joylashuvi</Label>
            <Input {...form.register("location")} placeholder="1-saqlash" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending}>Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
