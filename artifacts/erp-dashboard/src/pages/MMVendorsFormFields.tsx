/**
 * @module MMVendorsFormFields
 * @description Reusable form-field grid used inside both the Create and Edit
 * vendor dialogs. Renders all vendor input fields plus the dialog footer buttons.
 */

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from '@/lib/i18n';
import {
  CURRENCY_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  type VendorFormData,
} from "./MMVendorsTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VendorFormFieldsProps {
  form: UseFormReturn<VendorFormData>;
  /** Prefix used for data-testid attributes (e.g. "input-create" or "input-edit"). */
  idPrefix: string;
  /** When true the isActive toggle is rendered in the bottom row. */
  showStatusToggle?: boolean;
  isPending: boolean;
  onCancel: () => void;
  cancelTestId: string;
  submitTestId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorFormFields({form,
  idPrefix,
  showStatusToggle = false,
  isPending,
  onCancel,
  cancelTestId,
  submitTestId,
}: VendorFormFieldsProps) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      {/* Row 1: code + name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vendorCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('vendorKodi')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="V001" data-testid={`${idPrefix}-vendor-code`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nomi")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("yetkazuvchiNomi")} data-testid={`${idPrefix}-vendor-name`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Russian name */}
      <FormField
        control={form.control}
        name="nameRu"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nomi (Ruscha)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Название поставщика" data-testid={`${idPrefix}-vendor-name-ru`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address */}
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("address")}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t("address")} data-testid={`${idPrefix}-vendor-address`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Row 2: phone + email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("phone")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+998 90 123 45 67" data-testid={`${idPrefix}-vendor-phone`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email1')}</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="email@example.com" data-testid={`${idPrefix}-vendor-email`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: taxId + paymentTerms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soliq ID (INN)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123456789" data-testid={`${idPrefix}-vendor-tax-id`} />
              </FormControl>
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
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger data-testid={`${idPrefix}-payment-terms`} className="h-9">
                    <SelectValue placeholder={t("tanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_TERMS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 4: currency + optional isActive toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("valyuta")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "UZS"}>
                <FormControl>
                  <SelectTrigger data-testid={`${idPrefix}-currency`} className="h-9">
                    <SelectValue placeholder={t("valyuta")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showStatusToggle && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t("status28")}</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid={`${idPrefix}-is-active`}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Footer buttons */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} data-testid={cancelTestId}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isPending} data-testid={submitTestId}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogFooter>
    </div>
  );
}
