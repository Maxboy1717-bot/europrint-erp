/**
 * @module WMSDashboardDialogs
 * @description Dialog components for WMSDashboard page.
 */

import { UseFormReturn, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { WarehouseFormData, RequestFormData } from "./WMSDashboardTypes";

import { useTranslation } from '@/lib/i18n';
interface CreateWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<WarehouseFormData>;
  onSubmit: (data: WarehouseFormData) => void;
  isPending: boolean;
}

export function CreateWarehouseDialog({open, onOpenChange, form, onSubmit, isPending }: CreateWarehouseDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi ombor yaratish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>Nomi</Label>
            <Input {...form.register("name")} placeholder="Ombor nomi" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>Kodi</Label>
            <Input {...form.register("code")} placeholder="WH-001" />
            {form.formState.errors.code && (
              <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>Turi</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Asosiy</SelectItem>
                    <SelectItem value="raw_material">Xom ashyo</SelectItem>
                    <SelectItem value="finished_goods">Tayyor mahsulot</SelectItem>
                    <SelectItem value="transit">Tranzit</SelectItem>
                    <SelectItem value="semi_finished">Yarim tayyor</SelectItem>
                    <SelectItem value="defective">Brak / Nuqsonli</SelectItem>
                    <SelectItem value="quarantine">Karantin</SelectItem>
                    <SelectItem value="tools_equipment">Asbob-uskuna</SelectItem>
                    <SelectItem value="household_mro">Xo'jalik (MRO)</SelectItem>
                    <SelectItem value="mro">MRO</SelectItem>
                    <SelectItem value="production">Ishlab chiqarish</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit" disabled={isPending}>Yaratish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RequestFormData>;
  onSubmit: (data: RequestFormData) => void;
  isPending: boolean;
}

export function CreateRequestDialog({ open, onOpenChange, form, onSubmit, isPending }: CreateRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Ichki so'rov yaratish</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>{"Material ID"}</Label>
            <Input type="number" {...form.register("materialId")} placeholder={"Material raqami"} />
            {form.formState.errors.materialId && (
              <p className="text-xs text-destructive">{form.formState.errors.materialId.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>Miqdor</Label>
            <Input type="number" {...form.register("quantity")} placeholder="0" />
            {form.formState.errors.quantity && (
              <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>Sabab</Label>
            <Input {...form.register("reason")} placeholder="So'rov sababi" />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
            <Button type="submit" disabled={isPending}>Yuborish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
