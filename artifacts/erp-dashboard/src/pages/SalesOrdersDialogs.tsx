/**
 * @module SalesOrdersDialogs
 * @description Create / Edit Sales Order dialog component.
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseFormReturn, Control, FieldPath } from "react-hook-form";
import type { InsertSalesOrder } from "@shared/schema";
import type { CustomerRecord, DealRecord } from "./SalesOrdersTypes";
import { useTranslation } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Internal helpers — reduce repetition in the form
// ---------------------------------------------------------------------------

interface SelectOption { value: string; label: string }

interface FormSelectProps {
  control: Control<InsertSalesOrder>;
  name: FieldPath<InsertSalesOrder>;
  label: string;
  testId: string;
  options: SelectOption[];
  nullableNone?: boolean;
  onChange?: (val: string) => void;
}

function FormSelect({ control, name, label, testId, options, nullableNone, onChange }: FormSelectProps) {
  const { t: tCommon } = useTranslation('common');
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-foreground">{label}</FormLabel>
          <Select
            value={nullableNone ? (field.value ?? "none") as string : (field.value ?? undefined) as string}
            onValueChange={onChange ?? ((val) => field.onChange(nullableNone && val === "none" ? null : val))}
          >
            <FormControl>
              <SelectTrigger data-testid={testId} className="rounded-lg border-border bg-muted/40 h-9">
                <SelectValue placeholder={tCommon('select')} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-background border-border">
              {nullableNone && <SelectItem value="none">{tCommon('none')}</SelectItem>}
              {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormDateProps {
  control: Control<InsertSalesOrder>;
  name: FieldPath<InsertSalesOrder>;
  label: string;
  testId: string;
}

function FormDate({ control, name, label, testId }: FormDateProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-foreground">{label}</FormLabel>
          <FormControl>
            <Input type="date" {...field} value={field.value as string ?? ""} data-testid={testId} className="rounded-lg border-border bg-muted/40" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FormNumberProps {
  control: Control<InsertSalesOrder>;
  name: FieldPath<InsertSalesOrder>;
  label: string;
  testId: string;
}

function FormNumber({ control, name, label, testId }: FormNumberProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-foreground">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              {...field}
              value={field.value as number}
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              data-testid={testId}
              className="rounded-lg border-border bg-muted/40"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface SalesOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<InsertSalesOrder>;
  onSubmit: (data: InsertSalesOrder) => void;
  isPending: boolean;
  isEditing: boolean;
  customers: CustomerRecord[];
  deals: DealRecord[];
}

export function SalesOrderFormDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  isEditing,
  customers,
  deals,
}: SalesOrderFormDialogProps) {
  const { t } = useTranslation('finance');

  const customerOptions: SelectOption[] = (Array.isArray(customers) ? customers : []).map((c) => ({
    value: c.id,
    label: c.companyName || c.contactPerson || c.company,
  }));

  const dealOptions: SelectOption[] = (Array.isArray(deals) ? deals : []).map((d) => ({
    value: d.id,
    label: d.title,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-none shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {isEditing ? "Tahrirlash" : "Yaratish"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            SAP SD - {t('sales')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormSelect
                control={form.control}
                name="documentType"
                label={t('documentNumber')}
                testId="select-document-type"
                options={[
                  { value: "OR", label: "OR - Standard" },
                  { value: "RO", label: `RO - ${t('refund')}` },
                  { value: "CS", label: `CS - ${t('cash')}` },
                ]}
              />
              <FormSelect control={form.control} name="customerId" label={t('customerName') || "Nomi"} testId="select-customer" options={customerOptions} />
              <FormSelect control={form.control} name="crmDealId" label={`CRM (${"Ixtiyoriy"})`} testId="select-crm-deal" options={dealOptions} nullableNone />
              <FormDate control={form.control} name="orderDate" label={"Sana"} testId="input-order-date" />
              <FormDate control={form.control} name="requestedDeliveryDate" label={t('dueDate')} testId="input-delivery-date" />
              <FormSelect
                control={form.control}
                name="currency"
                label={t('currency')}
                testId="select-currency"
                options={[
                  { value: "UZS", label: t('uzs') },
                  { value: "USD", label: t('usd') },
                  { value: "EUR", label: t('eur') },
                ]}
              />
              <FormNumber control={form.control} name="netValue" label={t('amount')} testId="input-net-value" />
              <FormNumber control={form.control} name="taxAmount" label={t('tax')} testId="input-tax-amount" />
              <FormNumber control={form.control} name="totalValue" label={"Jami"} testId="input-total-value" />
              <FormSelect
                control={form.control}
                name="paymentTerms"
                label={t('paymentTerms') || t('payment')}
                testId="select-payment-terms"
                options={[
                  { value: "0001", label: `0001 - ${t('prepayment')}` },
                  { value: "0014", label: "0014 - 14 kun" },
                  { value: "0030", label: "0030 - 30 kun" },
                  { value: "0060", label: "0060 - 60 kun" },
                ]}
              />
              <FormSelect
                control={form.control}
                name="overallStatus"
                label={"Holat"}
                testId="select-overall-status"
                options={[
                  { value: "IN_PROCESS", label: "Jarayonda" },
                  { value: "COMPLETED", label: "Tugallangan" },
                  { value: "CANCELLED", label: "Bekor qilish" },
                ]}
              />
              <FormSelect
                control={form.control}
                name="deliveryStatus"
                label={t('deliveryStatus') || "Holat"}
                testId="select-delivery-status"
                options={[
                  { value: "NOT_DELIVERED", label: t('unpaid') },
                  { value: "PARTIALLY_DELIVERED", label: t('partiallyPaid') },
                  { value: "FULLY_DELIVERED", label: t('paid') },
                ]}
              />
              <FormSelect
                control={form.control}
                name="billingStatus"
                label={t('invoice')}
                testId="select-billing-status"
                options={[
                  { value: "NOT_BILLED", label: t('unpaid') },
                  { value: "PARTIALLY_BILLED", label: t('partiallyPaid') },
                  { value: "FULLY_BILLED", label: t('paid') },
                ]}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg border-border text-foreground">
                {"Bekor qilish"}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-sales-order" className="bg-primary text-white rounded-lg px-6">
                {isPending ? "Yuklanmoqda..." : isEditing ? "Saqlash" : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
