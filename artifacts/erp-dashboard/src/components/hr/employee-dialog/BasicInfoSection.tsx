/**
 * @module BasicInfoSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";
import { useTranslation } from '@/lib/i18n';

export function BasicInfoSection({ form }: FormSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>F.I.SH</FormLabel>
            <FormControl>
              <Input placeholder={t("toliqIsm")} {...field} data-testid="input-fullName" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="employeeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("tabelRaqami")}</FormLabel>
            <FormControl>
              <Input placeholder="ID" {...field} data-testid="input-employeeId" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("phone")}</FormLabel>
            <FormControl>
              <Input placeholder="+998" {...field} data-testid="input-phone" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="telegramChatId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("telegramId")}</FormLabel>
            <FormControl>
              <Input placeholder={t("chatId")} {...field} data-testid="input-telegramChatId" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
