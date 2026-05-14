/**
 * @module LeadInfo
 * @description React UI component.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X, Phone, Mail } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Lead, LeadFormValues, leadFormSchema } from "./types";

import { useTranslation } from '@/lib/i18n';
interface LeadInfoProps {
  lead: Lead | null;
  isEditing: boolean;
  isPending: boolean;
  onSubmit: (values: LeadFormValues) => void;
  onCancel: () => void;
}

export function LeadInfo({lead, isEditing, isPending, onSubmit, onCancel }: LeadInfoProps) {
  const { t } = useTranslation('common');
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    values: lead
      ? {
          title: lead.title,
          name: lead.name || "",
          lastName: lead.lastName || "",
          companyTitle: lead.companyTitle || "",
          sourceId: lead.sourceId || "",
          comments: lead.comments || "",
          opportunity: lead.opportunity || 0,
        }
      : undefined,
  });

  if (isEditing) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("leadNomi")}</FormLabel>
              <FormControl>
                <Input placeholder={t("leadNominiKiriting")} {...field} data-testid="input-lead-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("ism1")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("ism1")} {...field} data-testid="input-lead-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("familiya")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("familiya")} {...field} data-testid="input-lead-lastname" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="companyTitle" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("company")}</FormLabel>
              <FormControl>
                <Input placeholder={t("kompaniyaNomi1")} {...field} data-testid="input-lead-company" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="opportunity" render={({ field }) => (
            <FormItem>
              <FormLabel>Summa (UZS)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                  data-testid="input-lead-opportunity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="sourceId" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("manba")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-lead-source" className="h-9">
                    <SelectValue placeholder={t("manbaniTanlang")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CALL">{t("phone")}</SelectItem>
                  <SelectItem value="WEB">{t("sayt")}</SelectItem>
                  <SelectItem value="EMAIL">{t('email1')}</SelectItem>
                  <SelectItem value="TELEGRAM">{t("telegram")}</SelectItem>
                  <SelectItem value="REFERRAL">{t("tavsiya")}</SelectItem>
                  <SelectItem value="PARTNER">{t("hamkor")}</SelectItem>
                  <SelectItem value="OTHER">{t("boshqa")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="comments" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("Izoh")}</FormLabel>
              <FormControl>
                <Textarea placeholder={t("qoshimchaIzoh")} {...field} data-testid="input-lead-comments" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" disabled={isPending} data-testid="button-save-lead">
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("toliqIsm")}</p>
          <p className="font-medium">{([lead?.name, lead?.lastName]).filter(Boolean).join(" ") || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("company")}</p>
          <p className="font-medium">{lead?.companyTitle || "—"}</p>
        </div>
      </div>

      {lead?.phones && lead.phones.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("phone")}</p>
          <div className="space-y-1">
            {(Array.isArray(lead.phones) ? lead.phones : []).map((phone, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{phone.value}</span>
                <Badge variant="outline" className="text-xs">{phone.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {lead?.emails && lead.emails.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t('email1')}</p>
          <div className="space-y-1">
            {(Array.isArray(lead.emails) ? lead.emails : []).map((email, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{email.value}</span>
                <Badge variant="outline" className="text-xs">{email.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("manba")}</p>
          <p className="font-medium">{lead?.sourceId || "—"}</p>
        </div>
        {lead?.opportunity ? (
          <div>
            <p className="text-sm text-muted-foreground">{t("summa")}</p>
            <p className="font-bold text-[var(--ep-green)]">{lead.opportunity.toLocaleString()} UZS</p>
          </div>
        ) : null}
      </div>

      {lead?.comments && (
        <div>
          <p className="text-sm text-muted-foreground">{t("Izoh")}</p>
          <p className="text-sm">{lead.comments}</p>
        </div>
      )}

      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{t("Yaratilgan")}</p>
          <p>{lead?.dateCreate && format(new Date(lead.dateCreate), "dd.MM.yyyy HH:mm")}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t("ozgartirilgan")}</p>
          <p>{lead?.dateModify && format(new Date(lead.dateModify), "dd.MM.yyyy HH:mm")}</p>
        </div>
      </div>

      {(lead?.utmSource || lead?.utmMedium || lead?.utmCampaign) && (
        <>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">UTM parametrlari</p>
            <div className="flex flex-wrap gap-2">
              {lead.utmSource && <Badge variant="secondary">source: {lead.utmSource}</Badge>}
              {lead.utmMedium && <Badge variant="secondary">medium: {lead.utmMedium}</Badge>}
              {lead.utmCampaign && <Badge variant="secondary">campaign: {lead.utmCampaign}</Badge>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
