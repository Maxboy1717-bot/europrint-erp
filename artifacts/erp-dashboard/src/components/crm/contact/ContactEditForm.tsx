/**
 * @module ContactEditForm
 * @description React UI component.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Contact, Company, ContactFormValues, contactFormSchema } from "./types";
import { MultiFieldInput } from "../MultiFieldInput";

import { useTranslation } from '@/lib/i18n';
interface ContactEditFormProps {
  contact: Contact | null;
  companies: Company[] | undefined;
  isPending: boolean;
  onSubmit: (values: ContactFormValues) => void;
  onCancel: () => void;
}

export function ContactEditForm({contact, companies, isPending, onSubmit, onCancel }: ContactEditFormProps) {
  const { t } = useTranslation('common');
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    values: contact
      ? {
          name: contact.name || "",
          secondName: contact.secondName || "",
          lastName: contact.lastName || "",
          post: contact.post || "",
          companyId: contact.companyId,
          phones: contact.phones?.map(p => p.value) || [],
          emails: contact.emails?.map(e => e.value) || [],
          birthdate: contact.birthdate || "",
          comments: contact.comments || "",
        }
      : undefined,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("familiya")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-lastName" />
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
                <FormLabel>{t("ism")}</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secondName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("otasiningIsmi")}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-secondName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="post"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("lavozim1")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} data-testid="input-post" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("company")}</FormLabel>
              <Select
                value={field.value?.toString() || "none"}
                onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-company" className="h-9">
                    <SelectValue placeholder={t("kompaniyaniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{t("no")}</SelectItem>
                  {companies?.map((company) => (
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

        <FormField
          control={form.control}
          name="phones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("telefonlar")}</FormLabel>
              <FormControl>
                <MultiFieldInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="+998 90 123 45 67"
                  label={t("phone")}
                  type="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailManzillar')}</FormLabel>
              <FormControl>
                <MultiFieldInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="example@email.com"
                  label={t('email1')}
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthdate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("tugilganSana")}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value || ""}
                  data-testid="input-birthdate"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("notes")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  rows={4}
                  data-testid="input-comments"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isPending}
            data-testid="button-save-contact"
          >
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="button-cancel-edit"
          >
            <X className="h-4 w-4 mr-2" />
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
