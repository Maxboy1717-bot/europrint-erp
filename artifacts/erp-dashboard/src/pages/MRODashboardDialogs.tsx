/**
 * @module MRODashboardDialogs
 * @description Dialog components for MRODashboard — item and request creation forms.
 */

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { mroItemFormSchema, mroRequestFormSchema, MroItem } from "./MRODashboardTypes";

import { EPLoader } from "@/components/ep";
type ItemFormValues    = z.infer<typeof mroItemFormSchema>;
type RequestFormValues = z.infer<typeof mroRequestFormSchema>;

// ── CreateItemDialog ──────────────────────────────────────────────────────────
interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<ItemFormValues>;
  onSubmit: (data: ItemFormValues) => void;
  isPending: boolean;
}

export function CreateItemDialog({ open, onOpenChange, form, onSubmit, isPending }: CreateItemDialogProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Buyum qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi MRO Buyum</DialogTitle>
          <DialogDescription>Yangi xo'jalik buyumini qo'shing</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Kod *</Label>
              <Input {...register("itemCode")} placeholder="MRO-001" />
              {errors.itemCode && <p className="text-xs text-destructive">{errors.itemCode.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Birlik *</Label>
              <Input {...register("unit")} placeholder="dona" />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Nomi *</Label>
            <Input {...register("name")} placeholder="Buyum nomi" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Nomi (RU)</Label>
            <Input {...register("nameRu")} placeholder="Название на русском" />
          </div>

          <div className="space-y-1">
            <Label>Kategoriya *</Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kategoriya tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cleaning">Tozalash</SelectItem>
                <SelectItem value="maintenance">Ta'mirlash</SelectItem>
                <SelectItem value="office">Ofis</SelectItem>
                <SelectItem value="safety">Xavfsizlik</SelectItem>
                <SelectItem value="ppe">PPE / Forma</SelectItem>
                <SelectItem value="electrical">Elektr</SelectItem>
                <SelectItem value="plumbing">Sanitariya</SelectItem>
                <SelectItem value="other">Boshqa</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Joriy zaxira</Label>
              <Input {...register("currentStock")} type="number" min="0" />
              {errors.currentStock && <p className="text-xs text-destructive">{errors.currentStock.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Min zaxira</Label>
              <Input {...register("minStock")} type="number" min="0" />
              {errors.minStock && <p className="text-xs text-destructive">{errors.minStock.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Narx</Label>
              <Input {...register("unitCost")} type="number" min="0" />
              {errors.unitCost && <p className="text-xs text-destructive">{errors.unitCost.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <EPLoader className="mr-2" />}
              Saqlash
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CreateRequestDialog ───────────────────────────────────────────────────────
interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<RequestFormValues>;
  onSubmit: (data: RequestFormValues) => void;
  isPending: boolean;
  items: MroItem[];
}

export function CreateRequestDialog({ open, onOpenChange, form, onSubmit, isPending, items }: CreateRequestDialogProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" />
          So'rov yaratish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi MRO So'rov</DialogTitle>
          <DialogDescription>Xo'jalik buyumiga so'rov yuboring</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Buyum *</Label>
            <Select value={watch("itemId")} onValueChange={(v) => setValue("itemId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Buyum tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(items) ? items : []).map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.itemCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.itemId && <p className="text-xs text-destructive">{errors.itemId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Miqdor *</Label>
            <Input {...register("requestedQuantity")} type="number" min="0.01" step="0.01" />
            {errors.requestedQuantity && <p className="text-xs text-destructive">{errors.requestedQuantity.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Maqsad *</Label>
            <Input {...register("purpose")} placeholder="Foydalanish maqsadi" />
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Bo'lim *</Label>
            <Input {...register("department")} placeholder="Bo'lim nomi" />
            {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <EPLoader className="mr-2" />}
              Yuborish
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
