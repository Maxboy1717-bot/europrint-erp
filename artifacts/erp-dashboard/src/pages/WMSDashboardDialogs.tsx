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
          <DialogTitle className="text-[18px] font-semibold">{t("yangiOmborYaratish")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
          <Label>{t("name")}</Label>
            <Input {...form.register("name")} placeholder={t("omborNomi")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>{t("kodi")}</Label>
            <Input {...form.register("code")} placeholder="WH-001" />
            {form.formState.errors.code && (
              <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>{t("type")}</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">{t("primary")}</SelectItem>
                    <SelectItem value="raw_material">{t("xomAshyo")}</SelectItem>
                    <SelectItem value="finished_goods">{t("tayyorMahsulot")}</SelectItem>
                    <SelectItem value="transit">{t("tranzit")}</SelectItem>
                    <SelectItem value="semi_finished">{t("yarimTayyor")}</SelectItem>
                    <SelectItem value="defective">Brak / Nuqsonli</SelectItem>
                    <SelectItem value="quarantine">{t("karantin")}</SelectItem>
                    <SelectItem value="tools_equipment">{t("asbobUskuna")}</SelectItem>
                    <SelectItem value="household_mro">Xo'jalik (MRO)</SelectItem>
                    <SelectItem value="mro">MRO</SelectItem>
                    <SelectItem value="production">{t("ishlabChiqarish2")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={isPending}>{t("Yaratish")}</Button>
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
          <DialogTitle className="text-[18px] font-semibold">{t("ichkiSorovYaratish")}</DialogTitle>
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
          <Label>{t("quantity")}</Label>
            <Input type="number" {...form.register("quantity")} placeholder="0" />
            {form.formState.errors.quantity && (
              <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
            )}
          </div>
          <div className="space-y-1">
          <Label>{t("sabab")}</Label>
            <Input {...form.register("reason")} placeholder={t("sorovSababi")} />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={isPending}>{t("submitBtn")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
