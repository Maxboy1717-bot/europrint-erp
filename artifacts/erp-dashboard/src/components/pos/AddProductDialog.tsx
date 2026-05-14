/**
 * @module AddProductDialog
 * @description React UI component.
 */

import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RefreshCw } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<{
    barcode: string;
    name: string;
    unitPrice: number;
    unit: string;
    stockQuantity: number;
    minStock: number;
    nameRu: string;
    category: string;
  }>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
}

export function AddProductDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: AddProductDialogProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-product" className="p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{tCommon('create')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shtrix-kod</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-barcode" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('category')}</FormLabel>
                    <FormControl><Input {...field} data-testid="input-product-category" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('name')} (UZ)</FormLabel>
                  <FormControl><Input {...field} data-testid="input-product-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameRu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('name')} (RU)</FormLabel>
                  <FormControl><Input {...field} data-testid="input-product-name-ru" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('amount')} (UZS)</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-product-price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('unit')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-unit" className="h-9"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dona">Dona</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="m2">m²</SelectItem>
                        <SelectItem value="rulon">Rulon</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('quantity')}</FormLabel>
                    <FormControl><Input type="number" {...field} data-testid="input-product-stock" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min zaxira (ogohlantirish)</FormLabel>
                  <FormControl><Input type="number" {...field} data-testid="input-product-min-stock" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-product">
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-product">
                {isPending ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                {tCommon('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
