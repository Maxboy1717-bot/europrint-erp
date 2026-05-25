/**
 * @module PersonalInfoSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";
import { useTranslation } from '@/lib/i18n';

export function PersonalInfoSection({ form }: FormSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tugilganSana")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-birthDate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jinsi")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender" className="h-9">
                    <SelectValue placeholder={t("jinsiniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="erkak">{t("erkak")}</SelectItem>
                  <SelectItem value="ayol">{t("ayol")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("yashashManzili")}</FormLabel>
            <FormControl>
              <Input placeholder={t("toliqManzil")} {...field} data-testid="input-address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="maritalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("oilaviyHolati")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-marital-status" className="h-9">
                    <SelectValue placeholder={t("oilaviyHolatiniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="turmush qurmagan">{t("turmushQurmagan")}</SelectItem>
                  <SelectItem value="turmush qurgan">{t("turmushQurgan")}</SelectItem>
                  <SelectItem value="ajrashgan">{t("ajrashgan")}</SelectItem>
                  <SelectItem value="beva/beva ayol">{t("bevaBevaAyol")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="childrenCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("farzandlarSoni")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder={t("masalan2")}
                  data-testid="input-children-count"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="childrenEducation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("farzandlarningTalimHolati")}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-children-education" className="h-9">
                  <SelectValue placeholder={t("farzandlarTaliminiTanlang")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="yo'q">{t("farzandYoq")}</SelectItem>
                <SelectItem value="maktabgacha">{t("maktabgacha")}</SelectItem>
                <SelectItem value="maktabda">{t("maktabda")}</SelectItem>
                <SelectItem value="oliy ta'lim">{t("oliyTalimda")}</SelectItem>
                <SelectItem value="bitirgan">{t("talimniBitirgan")}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
