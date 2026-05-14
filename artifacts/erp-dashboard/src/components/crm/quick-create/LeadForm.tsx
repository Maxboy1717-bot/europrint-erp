/**
 * @module LeadForm
 * @description React UI component.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { User, Phone, Mail, Building2, DollarSign, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEAD_SOURCES, LEAD_PRIORITIES, leadFormSchema, type LeadFormValues } from "./lead-schema";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface LeadFormProps {
  users: Array<{ id: string; fullName: string }>;
  usersLoading: boolean;
  onClose: () => void;
  onCreated?: (entity: Record<string, unknown>) => void;
}

export function LeadForm({ users, usersLoading, onClose, onCreated }: LeadFormProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      title:             "",
      name:              "",
      lastName:          "",
      phone:             "",
      email:             "",
      companyTitle:      "",
      source:            "",
      sourceDescription: "",
      priority:          "normal",
      budget:            0,
      opportunityAmount: 0,
      comments:          "",
      assignedById:      "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      const payload = {
        title:             data.title,
        name:              data.name              || null,
        lastName:          data.lastName          || null,
        companyTitle:      data.companyTitle      || null,
        phones:            data.phone ? [{ value: data.phone, type: "WORK" }] : [],
        emails:            data.email ? [{ value: data.email, type: "WORK" }] : [],
        sourceId:          data.source            || null,
        sourceDescription: data.sourceDescription || null,
        priority:          data.priority          || "normal",
        budget:            data.budget?.toString() || null,
        opportunityAmount: data.opportunityAmount?.toString() || null,
        opportunity:       data.opportunityAmount  || null,   // also map to opportunity field
        comments:          data.comments          || null,
        assignedById:      data.assignedById      || null,
      };
      return apiRequest("POST", "/api/crm/leads/quick", payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({ title: "✅ Lid yaratildi", description: "Yangi lid muvaffaqiyatli qo'shildi" });
      onCreated?.(result);
      onClose();
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Lid yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-5">

        {/* ── Asosiy ma'lumotlar ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-primary" />
            <h4 className="text-sm font-semibold">{t("asosiyMalumotlar")}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Lid nomi — full width */}
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {t("email1")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@mail.com"
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
              control={form.control}
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

        {/* ── Savdo ma'lumotlari ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-emerald-500" />
            <h4 className="text-sm font-semibold">{t("savdoMalumotlari")}</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Manba */}
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="opportunityAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> {t("kutilayotganDaromad")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      data-testid="input-opportunityAmount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Byudjet */}
            <FormField
              control={form.control}
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
              control={form.control}
              name="assignedById"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>{t("masulShaxs")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-assignedById" className="h-9">
                        <SelectValue
                          placeholder={usersLoading ? "Yuklanmoqda..." : "Mas'ul shaxsni tanlang"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Array.isArray(users) ? users : []).map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          data-testid={`user-option-${user.id}`}
                        >
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

        {/* ── Qo'shimcha ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-violet-500" />
            <h4 className="text-sm font-semibold">{t("qoshimcha")}</h4>
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="sourceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manba tavsifi / Qiziqish mahsuloti</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("masalanOffsetBosmaA3Format")}
                      {...field}
                      data-testid="input-sourceDescription"
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
                  <FormLabel className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> {t("Izoh")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("qoshimchaIzohlarEslatmalar")}
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="input-comments"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-submit"
            className="gap-2"
          >
            {mutation.isPending && <EPLoader />}
            Lid yaratish
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
