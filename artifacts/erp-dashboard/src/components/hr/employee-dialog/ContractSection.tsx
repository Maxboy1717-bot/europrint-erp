/**
 * @module ContractSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormSectionProps } from "./types";
import { useTranslation } from '@/lib/i18n';

export function ContractSection({ form }: FormSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="shift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("smena")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-shift" className="h-9">
                    <SelectValue placeholder={t("smenaniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A">{t("aSmena")}</SelectItem>
                  <SelectItem value="B">{t("bSmena")}</SelectItem>
                  <SelectItem value="C">{t("cSmena")}</SelectItem>
                  <SelectItem value="D">{t("dSmena")}</SelectItem>
                  <SelectItem value="kunlik">{t("daily")}</SelectItem>
                  <SelectItem value="ofis">{t("ofis")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="salaryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("ishHaqiTuri")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-salary-type" className="h-9">
                    <SelectValue placeholder={t("turiniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fiks">{t("fiksOylik")}</SelectItem>
                  <SelectItem value="baytulmal">{t("ishbay")}</SelectItem>
                  <SelectItem value="smenbay">{t("smenbay")}</SelectItem>
                  <SelectItem value="soatbay">{t("soatbay")}</SelectItem>
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
          name="workshopZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sexHudud")}</FormLabel>
              <FormControl>
                <Input placeholder={t("masalan1Sex")} {...field} data-testid="input-workshopZone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("holati")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-status" className="h-9">
                    <SelectValue placeholder={t("holatniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="inactive">{t("faolEmas")}</SelectItem>
                  <SelectItem value="on_leave">{t("tatilda")}</SelectItem>
                  <SelectItem value="probation">{t("sinovMuddati")}</SelectItem>
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
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("ishgaKirganSana")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-hireDate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attestationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("attestatsiyaSanasi")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-attestationDate" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
