/**
 * @module HouseholdSection
 * @description React UI component.
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSectionProps } from "./types";
import { useTranslation } from '@/lib/i18n';

export function HouseholdSection({ form }: FormSectionProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="housingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("uyTuri")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-housing-type" className="h-9">
                    <SelectValue placeholder={t("uyTuriniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="shaxsiy uy">{t("shaxsiyUy")}</SelectItem>
                  <SelectItem value="kvartira">{t("kvartira")}</SelectItem>
                  <SelectItem value="ijara">{t("ijaragaOlingan")}</SelectItem>
                  <SelectItem value="yotoqxona">{t("yotoqxona")}</SelectItem>
                  <SelectItem value="qarindoshlar bilan">{t("qarindoshlarBilan")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="householdSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("oiladaNechaKishiYashaydi")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder={t("masalan5")}
                  data-testid="input-household-size"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="householdMembers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("kimlarBilanYashaydi")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("masalanTurmushOrtogi2Ta")}
                data-testid="input-household-members"
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              {t("oilaAzolariniVergulBilanAjratib")}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("kenglikLatitude")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("masalan405286")}
                  data-testid="input-latitude"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("uzunlikLongitude")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("masalan709425")}
                  data-testid="input-longitude"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="geoConsent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-2 space-y-0 pt-1">
            <FormControl>
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                data-testid="checkbox-geo-consent"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{t("geoRozilikLabel")}</FormLabel>
              <p className="text-xs text-muted-foreground">
                {t("geoRozilikTavsif")}
              </p>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
