/**
 * @module LeadFormBasicSection
 * @description Basic contact fields section for LeadForm (title, name, phone, email, company).
 * Split from LeadForm.tsx (Rule 16).
 */

import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Building2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type { LeadFormValues } from "./lead-schema";

interface LeadFormBasicSectionProps {
  control: Control<LeadFormValues>;
}

export function LeadFormBasicSection({ control }: LeadFormBasicSectionProps) {
  const { t } = useTranslation("common");

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-primary" />
        <h4 className="text-sm font-semibold">{t("asosiyMalumotlar")}</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Lid nomi — full width */}
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>
                {t("lidNomi")}<span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("masalanEuroprintUchunMatbaaUskunalari")}
                  {...field}
                  data-testid="input-title"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ism */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> {t("ism1")}
              </FormLabel>
              <FormControl>
                <Input placeholder={t("isminiKiriting")} {...field} data-testid="input-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Familiya */}
        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> {t("familiya")}
              </FormLabel>
              <FormControl>
                <Input placeholder={t("familiyasiniKiriting")} {...field} data-testid="input-lastName" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Telefon */}
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {t("phone")}
              </FormLabel>
              <FormControl>
                <Input placeholder="+998 90 123 45 67" {...field} data-testid="input-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {t("email1")}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("exampleMailCom")}
                  {...field}
                  data-testid="input-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Kompaniya — full width */}
        <FormField
          control={control}
          name="companyTitle"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {t("company")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("kompaniyaNominiKiriting")}
                  {...field}
                  data-testid="input-companyTitle"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
