/**
 * @module CashFlowManagementDialogs
 * @description Dialog components for CashFlowManagement page.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { TransactionFormData, CashPositionData } from "./CashFlowManagementTypes";

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: UseFormReturn<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
  isPending: boolean;
  cashPosition: CashPositionData | undefined;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function CreateTransactionDialog({ open, onOpenChange, form, onSubmit, isPending, cashPosition, t, tCommon, }: CreateTransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" data-testid="button-add-transaction">
          <Plus className="h-4 w-4" />
          {tCommon('create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-none rounded-xl max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">{tCommon('create')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('cashFlowManagement')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{tCommon('date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-transaction-date" className="bg-background border-border text-foreground" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{tCommon('type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-transaction-type" className="bg-background border-border text-foreground h-9">
                          <SelectValue placeholder={tCommon('type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-none">
                        <SelectItem value="inflow">{t('inflow')}</SelectItem>
                        <SelectItem value="outflow">{t('outflow')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{t('category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category" className="bg-background border-border text-foreground h-9">
                          <SelectValue placeholder={t('category')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-none">
                        <SelectItem value="sales">{t('sales')}</SelectItem>
                        <SelectItem value="purchase">{t('purchases')}</SelectItem>
                        <SelectItem value="salary">{t('salary')}</SelectItem>
                        <SelectItem value="tax">{t('taxes')}</SelectItem>
                        <SelectItem value="loan">{t('loan')}</SelectItem>
                        <SelectItem value="other">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{t('amount')} (UZS)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000000" {...field} data-testid="input-amount" className="bg-background border-border text-foreground" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{t('bankAccount')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-bank-account" className="bg-background border-border text-foreground h-9">
                        <SelectValue placeholder={t('bankAccount')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-none">
                      <SelectItem value="__none__">-</SelectItem>
                      {cashPosition?.accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bankName} - {account.accountNumber} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{tCommon('description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("qoshimchaMalumot")} {...field} data-testid="input-description" className="bg-background border-border text-foreground min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending} data-testid="button-submit-transaction" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? tCommon('loading') : tCommon('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
