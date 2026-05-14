/**
 * @module SDQuotationFormFields
 * @description Header form fields (metadata) for the Add/Edit quotation form.
 * Renders inside a react-hook-form <Form> context owned by the parent.
 */

import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuotationFormData } from "./SDQuotationsTypes";

interface QuotationFormFieldsProps {
  form: UseFormReturn<QuotationFormData>;
  companies: Array<{ id: string; name: string }>;
}

export function QuotationFormFields({ form, companies }: QuotationFormFieldsProps) {
  const safeCompanies = Array.isArray(companies) ? companies : [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="quotationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taklif raqami</FormLabel>
              <FormControl>
                <Input {...field} readOnly data-testid="input-quotation-number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mijoz (kompaniya)</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  const company = safeCompanies.find((c) => c.id === value);
                  if (company) form.setValue("customerName", company.name);
                }}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-customer" className="h-9">
                    <SelectValue placeholder="Kompaniyani tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {safeCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
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
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mijoz nomi</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-customer-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quotationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taklif sanasi</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-quotation-date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="validUntil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amal qilish muddati</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-valid-until" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valyuta</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-currency" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="UZS">UZS - O'zbek so'mi</SelectItem>
                  <SelectItem value="USD">USD - Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Evro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To'lov shartlari</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-terms" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prepaid">Oldindan to'lov</SelectItem>
                  <SelectItem value="net14">14 kun ichida</SelectItem>
                  <SelectItem value="net30">30 kun ichida</SelectItem>
                  <SelectItem value="net60">60 kun ichida</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holat</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-status" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="sent">Yuborilgan</SelectItem>
                  <SelectItem value="accepted">Qabul qilindi</SelectItem>
                  <SelectItem value="rejected">Rad etildi</SelectItem>
                  <SelectItem value="expired">Muddati o'tgan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Izohlar</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} data-testid="input-notes" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
