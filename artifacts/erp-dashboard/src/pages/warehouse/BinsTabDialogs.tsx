/**
 * @module BinsTabDialogs
 * @description Create/edit and delete-confirm dialogs for BinsTab.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import { WarehouseData, ZoneData, BinData, BinFormData, Lang, Translations } from "./warehouse-types";

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

interface BinFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBin: BinData | null;
  form: UseFormReturn<BinFormData>;
  onSubmit: (data: BinFormData) => void;
  warehouses: WarehouseData[];
  zones: ZoneData[];
  t: Translations & ((key: string) => string);
}

export function BinFormDialog({
  open, onOpenChange, editingBin, form, onSubmit, warehouses, zones, t,
}: BinFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{editingBin ? t.editBin : t.createBin}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="warehouseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.selectWarehouse} <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={v => { field.onChange(v); form.setValue("zoneId", ""); }} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-bin-warehouse" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="zoneId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.selectZone} <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-bin-zone" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(zones) ? zones : []).map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="binCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.binCode} <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} placeholder="A-01-001" data-testid="input-bin-code" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="binType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.binType} <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-bin-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.entries(t.binTypes).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="row" render={({ field }) => (
                <FormItem><FormLabel>{t.row}</FormLabel><FormControl><Input {...field} data-testid="input-bin-row" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="shelf" render={({ field }) => (
                <FormItem><FormLabel>{t.shelf}</FormLabel><FormControl><Input {...field} data-testid="input-bin-shelf" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem><FormLabel>{t.level}</FormLabel><FormControl><Input {...field} data-testid="input-bin-level" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="maxWeight" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.maxWeight}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-bin-max-weight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxVolume" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.maxVolume}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-bin-max-volume" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-bin-active" /></FormControl>
                <FormLabel className="!mt-0">{t.active}</FormLabel>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="btn-cancel-bin">{t.cancel}</Button>
              <Button type="submit" data-testid="btn-save-bin">{t.save}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface BinDeleteDialogProps {
  deleteId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
  lang: Lang;
  t: Translations & ((key: string) => string);
}

export function BinDeleteDialog({ deleteId, onOpenChange, onConfirm, lang, t }: BinDeleteDialogProps) {
  return (
    <AlertDialog open={!!deleteId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
          <AlertDialogDescription>
            {lang === "uz" ? "Bu amalni bekor qilib bo'lmaydi." : "Это действие нельзя отменить."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="btn-cancel-delete-bin">{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { if (deleteId) onConfirm(deleteId); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
