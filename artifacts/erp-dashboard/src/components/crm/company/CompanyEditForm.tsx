/**
 * @module CompanyEditForm
 * @description React UI component.
 */

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { MultiFieldInput } from "@/components/crm/MultiFieldInput";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Company, generateId } from "./types";

import { useTranslation } from '@/lib/i18n';
const updateCompanySchema = z.object({
  title: z.string().min(1, "Kompaniya nomi kerak"),
  industry: z.string().optional(),
  employees: z.coerce.number().nullable().optional(),
  revenue: z.coerce.number().nullable().optional(),
  phones: z.array(z.object({ id: z.string(), value: z.string(), type: z.string() })).optional(),
  emails: z.array(z.object({ id: z.string(), value: z.string(), type: z.string() })).optional(),
  websites: z.array(z.object({ id: z.string(), value: z.string(), type: z.string() })).optional(),
  address: z.string().optional(),
});

type UpdateCompanyForm = z.infer<typeof updateCompanySchema>;

interface CompanyEditFormProps {
  company: Company;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CompanyEditForm({company, onCancel, onSuccess }: CompanyEditFormProps) {
  const { t } = useTranslation('common');
  const { t: tCrm } = useTranslation('crm');
  const { toast } = useToast();

  const form = useForm<UpdateCompanyForm>({
    resolver: zodResolver(updateCompanySchema),
    values: {
      title: company.title,
      industry: company.industry || "",
      employees: company.employees,
      revenue: company.revenue,
      phones: (company.phones || []).map(p => ({ ...p, id: generateId() })),
      emails: (company.emails || []).map(e => ({ ...e, id: generateId() })),
      websites: (company.websites || []).map(w => ({ ...w, id: generateId() })),
      address: company.address || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateCompanyForm) => {
      const payload = {
        ...data,
        phones: data.phones?.map(({ value, type }) => ({ value, type })),
        emails: data.emails?.map(({ value, type }) => ({ value, type })),
        websites: data.websites?.map(({ value, type }) => ({ value, type })),
      };
      return apiRequest("PATCH", `/api/crm/companies/${company.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/companies", company.id] });
      toast({ title: t("muvaffaqiyatli"), description: tCrm("companyDataUpdated") });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message || tCrm("dataUpdateError"), variant: "destructive" });
    },
  });

  const handleSubmit = (data: UpdateCompanyForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("kompaniyaNomi")}</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-edit-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("soha")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("itQurilishSavdo")} data-testid="input-edit-industry" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("xodimlarSoni")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    data-testid="input-edit-employees"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("yillikDaromad")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    data-testid="input-edit-revenue"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phones"
          render={({ field }) => {
            const valueMap = new Map<string, { id: string; value: string; type: string }[]>();
            (field.value || []).forEach((p: { id: string; value: string; type: string }) => {
              const arr = valueMap.get(p.value) || [];
              arr.push(p);
              valueMap.set(p.value, arr);
            });
            return (
              <FormItem>
                <FormLabel>{t("telefonRaqamlari")}</FormLabel>
                <FormControl>
                  <MultiFieldInput
                    value={(field.value || []).map((p: { id: string; value: string; type: string }) => p.value)}
                    onChange={(values: string[]) => {
                      const existing = field.value || [];
                      const usedIds = new Set<string>();
                      const newPhones = (Array.isArray(values) ? values : []).map((val, idx) => {
                        const matchByIndex = existing[idx];
                        if (matchByIndex && matchByIndex.value === val && !usedIds.has(matchByIndex.id)) {
                          usedIds.add(matchByIndex.id);
                          return { ...matchByIndex };
                        }
                        const candidates = valueMap.get(val) || [];
                        const matchByValue = (Array.isArray(candidates) ? candidates : []).find(c => !usedIds.has(c.id));
                        if (matchByValue) { usedIds.add(matchByValue.id); return { ...matchByValue }; }
                        if (matchByIndex && !usedIds.has(matchByIndex.id)) { usedIds.add(matchByIndex.id); return { ...matchByIndex, value: val }; }
                        return { id: generateId(), value: val, type: "WORK" };
                      });
                      field.onChange(newPhones);
                    }}
                    label={t("phone")}
                    placeholder="+998 90 123 45 67"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="emails"
          render={({ field }) => {
            const valueMap = new Map<string, { id: string; value: string; type: string }[]>();
            (field.value || []).forEach((e: { id: string; value: string; type: string }) => {
              const arr = valueMap.get(e.value) || [];
              arr.push(e);
              valueMap.set(e.value, arr);
            });
            return (
              <FormItem>
                <FormLabel>{t('emailManzillar')}</FormLabel>
                <FormControl>
                  <MultiFieldInput
                    value={(field.value || []).map((e: { id: string; value: string; type: string }) => e.value)}
                    onChange={(values: string[]) => {
                      const existing = field.value || [];
                      const usedIds = new Set<string>();
                      const newEmails = (Array.isArray(values) ? values : []).map((val, idx) => {
                        const matchByIndex = existing[idx];
                        if (matchByIndex && matchByIndex.value === val && !usedIds.has(matchByIndex.id)) { usedIds.add(matchByIndex.id); return { ...matchByIndex }; }
                        const candidates = valueMap.get(val) || [];
                        const matchByValue = (Array.isArray(candidates) ? candidates : []).find(c => !usedIds.has(c.id));
                        if (matchByValue) { usedIds.add(matchByValue.id); return { ...matchByValue }; }
                        if (matchByIndex && !usedIds.has(matchByIndex.id)) { usedIds.add(matchByIndex.id); return { ...matchByIndex, value: val }; }
                        return { id: generateId(), value: val, type: "WORK" };
                      });
                      field.onChange(newEmails);
                    }}
                    label={t('email1')}
                    placeholder="info@company.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="websites"
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>{t("vebSaytlar")}</FormLabel>
                <FormControl>
                  <MultiFieldInput
                    value={(field.value || []).map((w: { id: string; value: string; type: string }) => w.value)}
                    onChange={(values: string[]) => {
                      const existing = field.value || [];
                      const newWebsites = (Array.isArray(values) ? values : []).map((val, idx) => {
                        const matchByIndex = existing[idx];
                        if (matchByIndex) return { ...matchByIndex, value: val };
                        return { id: generateId(), value: val, type: "WEB" };
                      });
                      field.onChange(newWebsites);
                    }}
                    label={t("vebSayt")}
                    placeholder="https://example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-edit-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={updateMutation.isPending} className="flex-1 gap-2" data-testid="button-save">
            <Check className="h-4 w-4" />
            {updateMutation.isPending ? t("saving") : t("save")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-edit">
            <X className="h-4 w-4 mr-2" />
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
