/**
 * @module LeadFormSalesSection
 * @description Sales fields section for LeadForm (source, priority, amounts, assignee).
 * Split from LeadForm.tsx (Rule 16).
 */

import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import { LEAD_SOURCES, LEAD_PRIORITIES } from "./lead-schema";
import type { LeadFormValues } from "./lead-schema";

interface LeadFormSalesSectionProps {
  control: Control<LeadFormValues>;
  users: Array<{ id: string; fullName: string }>;
  usersLoading: boolean;
}

export function LeadFormSalesSection({ control, users, usersLoading }: LeadFormSalesSectionProps) {
  const { t } = useTranslation("common");

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-emerald-500" />
        <h4 className="text-sm font-semibold">{t("savdoMalumotlari")}</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Manba */}
        <FormField
          control={control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("manba")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-source" className="h-9">
                    <SelectValue placeholder={t("manbaniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value} data-testid={`source-option-${s.value}`}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ustuvorlik */}
        <FormField
          control={control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("ustuvorlik")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-priority" className="h-9">
                    <SelectValue placeholder={t("darajaniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value} data-testid={`priority-option-${p.value}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Kutilayotgan daromad */}
        <FormField
          control={control}
          name="opportunityAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> {t("kutilayotganDaromad")}
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} data-testid="input-opportunityAmount" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Byudjet */}
        <FormField
          control={control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Byudjet (so'm)
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} data-testid="input-budget" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mas'ul shaxs — full width */}
        <FormField
          control={control}
          name="assignedById"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>{t("masulShaxs")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-assignedById" className="h-9">
                    <SelectValue placeholder={usersLoading ? "Yuklanmoqda..." : "Mas'ul shaxsni tanlang"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Array.isArray(users) ? users : []).map((user) => (
                    <SelectItem key={user.id} value={user.id} data-testid={`user-option-${user.id}`}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
