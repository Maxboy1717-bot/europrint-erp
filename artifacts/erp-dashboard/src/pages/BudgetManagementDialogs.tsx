/** @module BudgetManagementDialogs @description Dialog and form components for creating a budget and adding budget lines. Self-contained: each dialog owns its open/close trigger and form submission. */

import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { BudgetFormData, BudgetLineFormData, Account, CostCenter } from "./BudgetManagementTypes";

// ---------------------------------------------------------------------------
// CreateBudgetDialog
// ---------------------------------------------------------------------------

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<BudgetFormData>;
  onSubmit: (data: BudgetFormData) => void;
  isPending: boolean;
}

export function CreateBudgetDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: CreateBudgetDialogProps) {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" data-testid="button-create-budget">
          <Plus className="h-4 w-4" />
          {tCommon("create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-none rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("budgetManagement")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{tCommon("create")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="budgetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{tCommon("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("masalan2024YillikOperatsionByudjet")} data-testid="input-budget-name" className="bg-background border-border text-foreground" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fiscalYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{t("fiscalYear")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-fiscal-year" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{t("periodType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-period-type" className="bg-background border-border text-foreground h-9">
                          <SelectValue placeholder={t("periodType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-none">
                        <SelectItem value="annual">{t("yearly")}</SelectItem>
                        <SelectItem value="quarterly">{t("choraklik")}</SelectItem>
                        <SelectItem value="monthly">{t("monthly")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{t("startDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-start-date" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">{t("endDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-end-date" className="bg-background border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{t("totalAmount")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-total-amount" className="bg-background border-border text-foreground" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending} data-testid="button-submit-budget" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? tCommon("loading") : tCommon("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// AddBudgetLineDialog
// ---------------------------------------------------------------------------

interface AddBudgetLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<BudgetLineFormData>;
  onSubmit: (data: BudgetLineFormData) => void;
  isPending: boolean;
  accounts: Account[];
  costCenters: CostCenter[];
}

export function AddBudgetLineDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  accounts,
  costCenters,
}: AddBudgetLineDialogProps) {
  const { t } = useTranslation("finance");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-line" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" />
          {"Yaratish"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-none rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t("budgetLines")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{"Yaratish"}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{t("chartOfAccounts")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-account" className="bg-background border-border text-foreground h-9">
                        <SelectValue placeholder={t("chartOfAccounts")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-none">
                      {(Array.isArray(accounts) ? accounts : []).map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.accountCode} - {acc.accountName}
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
              name="costCenterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{t("costCenter")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-cost-center" className="bg-background border-border text-foreground h-9">
                        <SelectValue placeholder={t("costCenter")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-none">
                      <SelectItem value="__none__">-</SelectItem>
                      {(Array.isArray(costCenters) ? costCenters : []).map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.code} - {cc.name}
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
              name="plannedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{t("planned")}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} data-testid="input-planned-amount" className="bg-background border-border text-foreground" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">{"Tavsif"}</FormLabel>
                  <FormControl>
                    <Textarea {...field} data-testid="input-notes" className="bg-background border-border text-foreground min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending} data-testid="button-submit-line" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isPending ? "Yuklanmoqda..." : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
