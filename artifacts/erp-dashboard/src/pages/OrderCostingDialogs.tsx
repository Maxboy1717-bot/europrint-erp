/** @module OrderCostingDialogs @description Dialog components for OrderCosting — create-new-costing dialog with live cost/profit preview. */

import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { CostingFormData, SalesOrder } from "./OrderCostingTypes";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi Buyurtma Tannarxi Yaratish</DialogTitle>
          <DialogDescription>
            Sotish buyurtmasini tanlang va xarajatlarni kiriting
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="salesOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sotish Buyurtmasi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-sales-order" className="h-9">
                        <SelectValue placeholder="Buyurtmani tanlang" />
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
                    <FormLabel>Material Xarajati (UZS)</FormLabel>
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
                    <FormLabel>Mehnat Xarajati (UZS)</FormLabel>
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
                    <FormLabel>Ustama Xarajat (UZS)</FormLabel>
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
                    <FormLabel>Energiya Xarajati (UZS)</FormLabel>
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
                    <FormLabel>Isrof Xarajati (UZS)</FormLabel>
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
                    <FormLabel>Sotish Narxi (UZS)</FormLabel>
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
                <span>Umumiy Xarajat:</span>
                <span className="font-medium">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Yalpi Foyda:</span>
                <span className={`font-medium ${grossProfit >= 0 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}`}>
                  {formatCurrency(grossProfit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Foyda Marjasi:</span>
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
                Bekor qilish
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
