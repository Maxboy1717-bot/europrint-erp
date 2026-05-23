/**
 * @module DealDetailSheetForm
 * @description Edit form for DealDetailSheet (isEditing=true branch).
 * Split from DealDetailSheet.tsx (Rule 16).
 */

import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import type { Company, DealFormValues } from "./DealDetailSheet.types";

interface DealDetailSheetFormProps {
  form: UseFormReturn<DealFormValues>;
  companies: Company[];
  isPending: boolean;
  onSubmit: (values: DealFormValues) => void;
  onCancel: () => void;
}

export function DealDetailSheetForm({
  form, companies, isPending, onSubmit, onCancel,
}: DealDetailSheetFormProps) {
  const { t } = useTranslation("common");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
        <FormField
          control={form.control} name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("kelishuvNomi")}</FormLabel>
              <FormControl><Input {...field} data-testid="input-deal-title" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control} name="opportunity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("summa1")}</FormLabel>
                <FormControl>
                  <Input
                    type="number" {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    data-testid="input-deal-opportunity"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control} name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("ehtimollik")}</FormLabel>
                <FormControl>
                  <Input
                    type="number" min={0} max={100} {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    data-testid="input-deal-probability"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control} name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("company")}</FormLabel>
              <Select
                value={field.value?.toString() || "none"}
                onValueChange={(val) => field.onChange(val === "none" ? null : Number(val))}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-deal-company" className="h-9">
                    <SelectValue placeholder={t("kompaniyaTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("none")}</SelectItem>
                  {(Array.isArray(companies) ? companies : []).map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control} name="beginDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("startDate")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-deal-begin-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control} name="closeDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("yopilishSanasi")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-deal-close-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control} name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("notes")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} data-testid="input-deal-comments" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control} name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("qoshimchaMalumot1")}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} data-testid="input-deal-additional-info" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-edit">
            <X className="h-4 w-4 mr-2" />
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-deal">
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
