/** @module OrderCostingDialogs @description Dialog components for OrderCosting — create-new-costing dialog with live cost/profit preview. */

import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { CostingFormData, SalesOrder } from "./OrderCostingTypes";
import { useTranslation } from '@/lib/i18n';

interface CreateCostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CostingFormData>;
  salesOrders: SalesOrder[];
  onSubmit: (data: CostingFormData) => void;
  isPending: boolean;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
}

export function CreateCostingDialog({
  open,
  onOpenChange,
  form,
  salesOrders,
  onSubmit,
  isPending,
  totalCost,
  grossProfit,
  profitMargin,
}: CreateCostingDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("yangiBuyurtmaTannarxiYaratish")}</DialogTitle>
          <DialogDescription>
            {t("sotishBuyurtmasiniTanlangVaXarajatlarni")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="salesOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sotishBuyurtmasi")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-sales-order" className="h-9">
                        <SelectValue placeholder={t("buyurtmaniTanlang")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(salesOrders) ? salesOrders : []).map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.documentNumber} - {order.soldToParty || "Noma'lum mijoz"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="materialCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("materialXarajatiUzs")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-material-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="laborCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mehnatXarajatiUzs")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-labor-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="overheadCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("ustamaXarajatUzs")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-overhead-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="energyCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("energiyaXarajatiUzs")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-energy-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wasteCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("isrofXarajatiUzs")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-waste-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sotishNarxiUzs")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-selling-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("umumiyXarajat1")}</span>
                <span className="font-medium">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("yalpiFoyda2")}</span>
                <span className={`font-medium ${grossProfit >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {formatCurrency(grossProfit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("foydaMarjasi2")}</span>
                <span className={`font-medium ${profitMargin >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
