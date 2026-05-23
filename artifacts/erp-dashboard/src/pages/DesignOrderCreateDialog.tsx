/**
 * @module DesignOrderCreateDialog
 * @description Create-order dialog form for the DesignOrders page.
 * Split from DesignOrders.tsx (Rule 16).
 */

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const designOrderSchema = z.object({
  clientName:   z.string().min(1, "Mijoz ismi majburiy"),
  clientCompany: z.string().optional(),
  clientPhone:  z.string().optional(),
  clientEmail:  z.string().optional(),
  productType:  z.string().min(1, "Mahsulot turini tanlang"),
  productName:  z.string().min(1, "Mahsulot nomi majburiy"),
  brandName:    z.string().optional(),
  quantity:     z.coerce.number().min(1).default(1000),
  description:  z.string().optional(),
  requirements: z.string().optional(),
  priority:     z.string().default("normal"),
  deadline:     z.string().optional(),
});

export type DesignOrderFormData = z.infer<typeof designOrderSchema>;

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<DesignOrderFormData>;
  onSubmit: (values: DesignOrderFormData) => void;
  isPending: boolean;
  t: (k: string) => string;
}

export function DesignOrderCreateDialog({ isOpen, onOpenChange, form, onSubmit, isPending, t }: Props) {
  const errs = form.formState.errors;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiDizaynBuyurtmasi")}</DialogTitle>
          <DialogDescription>{t("yangiDizaynBuyurtmasiniYaratishUchun")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">{t("mijozIsmi1")}</Label>
              <Input id="clientName" {...form.register("clientName")} data-testid="input-client-name" />
              {errs.clientName && <p className="text-sm text-destructive mt-1">{errs.clientName.message}</p>}
            </div>
            <div>
              <Label htmlFor="clientCompany">{t('company')}</Label>
              <Input id="clientCompany" {...form.register("clientCompany")} data-testid="input-client-company" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientPhone">{t('phone')}</Label>
              <Input id="clientPhone" {...form.register("clientPhone")} data-testid="input-client-phone" />
            </div>
            <div>
              <Label htmlFor="clientEmail">{t('email')}</Label>
              <Input id="clientEmail" type="email" {...form.register("clientEmail")} data-testid="input-client-email" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Mahsulot {t('type')} *</Label>
              <Controller control={form.control} name="productType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-product-type" className="h-9">
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stakan">{t("stakan")}</SelectItem>
                    <SelectItem value="quti">{t("quti")}</SelectItem>
                    <SelectItem value="plakat">{t("plakat")}</SelectItem>
                    <SelectItem value="qadoq">{t("qadoq")}</SelectItem>
                    <SelectItem value="korrugirovanniy-quti">{t("korrugirovanniyQuti")}</SelectItem>
                    <SelectItem value="tibbiy-qadoq">{t("tibbiyQadoq")}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errs.productType && <p className="text-sm text-destructive mt-1">{errs.productType.message}</p>}
            </div>
            <div>
              <Label htmlFor="productName">Mahsulot {t('name')} *</Label>
              <Input id="productName" {...form.register("productName")} data-testid="input-product-name" />
              {errs.productName && <p className="text-sm text-destructive mt-1">{errs.productName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brandName">Brend {t('name')}</Label>
              <Input id="brandName" {...form.register("brandName")} data-testid="input-brand-name" />
            </div>
            <div>
              <Label htmlFor="quantity">{t('quantity')}</Label>
              <Input id="quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} data-testid="input-quantity" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea id="description" {...form.register("description")} rows={3} data-testid="input-description" />
          </div>

          <div>
            <Label htmlFor="requirements">{t("maxsusTalablar")}</Label>
            <Textarea id="requirements" {...form.register("requirements")} rows={3} data-testid="input-requirements" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('priority')}</Label>
              <Controller control={form.control} name="priority" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger data-testid="select-priority" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('low')}</SelectItem>
                    <SelectItem value="normal">{t('medium')}</SelectItem>
                    <SelectItem value="high">{t('high')}</SelectItem>
                    <SelectItem value="urgent">{t("Shoshilinch")}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label htmlFor="deadline">{t("muddati")}</Label>
              <Input id="deadline" type="date" {...form.register("deadline")} data-testid="input-deadline" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); form.reset(); }} data-testid="button-cancel">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending ? t('loading') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
