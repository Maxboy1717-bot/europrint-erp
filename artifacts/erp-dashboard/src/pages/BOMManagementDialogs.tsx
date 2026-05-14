/**
 * @module BOMManagementDialogs
 * @description "Create BOM" and "Add Item" dialog components for BOM Management.
 */

import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTranslation } from "@/lib/i18n";
import type { BOMFormValues, ItemFormValues, Product } from "./BOMManagementTypes";

// ─── CreateBOMDialog ──────────────────────────────────────────────────────────

export interface CreateBOMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<BOMFormValues>;
  onSubmit: (data: BOMFormValues) => void;
  isPending: boolean;
  products: Product[];
}

export function CreateBOMDialog({ open, onOpenChange, form, onSubmit, isPending, products }: CreateBOMDialogProps) {
  const { t } = useTranslation("production");
  const { t: tCommon } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6" data-testid="dialog-create-bom">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("createBom")}</DialogTitle>
          <DialogDescription>{t("bom")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="bomNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("orderNumber")}</FormLabel>
                  <FormControl><Input {...field} placeholder="BOM-001" data-testid="input-bom-number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="productId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("productName")} <span className="text-destructive">*</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-product" className="h-9"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} data-testid={`option-product-${p.id}`}>{p.name} ({p.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="version" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("version")}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-version" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="baseQuantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("quantity")} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-base-qty" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("unit")}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-unit" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status" className="h-9"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{tCommon("draft")}</SelectItem>
                      <SelectItem value="active">{tCommon("active")}</SelectItem>
                      <SelectItem value="obsolete">{tCommon("archived")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="effectiveDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("startDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-effective-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon("endDate")}</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-expiry-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">{tCommon("cancel")}</Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AddItemDialog ────────────────────────────────────────────────────────────

export interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ItemFormValues>;
  onSubmit: (data: ItemFormValues) => void;
  isPending: boolean;
  products: Product[];
}

export function AddItemDialog({ open, onOpenChange, form, onSubmit, isPending, products }: AddItemDialogProps) {
  const { t } = useTranslation("production");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-item" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{"Qo'shish"}</DialogTitle>
          <DialogDescription>{t("materials")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="componentId" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("materials")} <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-component" className="h-9"><SelectValue placeholder={"Tanlash"} /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Miqdor"} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-component-qty" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Birlik"}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-component-unit" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="componentType" render={({ field }) => (
              <FormItem>
                <FormLabel>{"Turi"}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-component-type" className="h-9"><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="raw">{t("rawMaterials")}</SelectItem>
                    <SelectItem value="semifinished">{t("finishedGoods")}</SelectItem>
                    <SelectItem value="purchased">{t("materials")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="scrapPercentage" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("scrap")} %</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-scrap" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Pozitsiya"}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-position" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-item">{"Bekor qilish"}</Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-item">
                {isPending ? "Yuklanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
