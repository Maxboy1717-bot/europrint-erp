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
import { useTranslation } from '@/lib/i18n';

interface QuotationFormFieldsProps {
  form: UseFormReturn<QuotationFormData>;
  companies: Array<{ id: string; name: string }>;
}

export function QuotationFormFields({ form, companies }: QuotationFormFieldsProps) {
  const { t } = useTranslation("common");
  const safeCompanies = Array.isArray(companies) ? companies : [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="quotationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("taklifRaqami")}</FormLabel>
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
              <FormLabel>{t("mijozKompaniya")}</FormLabel>
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
                    <SelectValue placeholder={t("kompaniyaniTanlang")} />
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
              <FormLabel>{t("mijozNomi")}</FormLabel>
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
              <FormLabel>{t("taklifSanasi")}</FormLabel>
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
              <FormLabel>{t("amalQilishMuddati")}</FormLabel>
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
              <FormLabel>{t("valyuta")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-currency" className="h-9">
                    <SelectValue placeholder={t("tanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="UZS">{t("uzsOzbekSomi")}</SelectItem>
                  <SelectItem value="USD">{t("usdDollar")}</SelectItem>
                  <SelectItem value="EUR">{t("eurEvro")}</SelectItem>
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
              <FormLabel>{t("tolovShartlari")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-terms" className="h-9">
                    <SelectValue placeholder={t("tanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="prepaid">{t("oldindanTolov")}</SelectItem>
                  <SelectItem value="net14">{t("k14KunIchida")}</SelectItem>
                  <SelectItem value="net30">{t("k30KunIchida")}</SelectItem>
                  <SelectItem value="net60">{t("k60KunIchida")}</SelectItem>
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
              <FormLabel>{t("status28")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-status" className="h-9">
                    <SelectValue placeholder={t("tanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">{t("draft")}</SelectItem>
                  <SelectItem value="sent">{t("yuborilgan")}</SelectItem>
                  <SelectItem value="accepted">{t("qabulQilindi")}</SelectItem>
                  <SelectItem value="rejected">{t("radEtildi")}</SelectItem>
                  <SelectItem value="expired">{t("muddatiOtgan")}</SelectItem>
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
            <FormLabel>{t("notes")}</FormLabel>
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
