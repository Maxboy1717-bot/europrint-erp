/**
 * @module LMSSupport
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  PlusCircle,
} from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

const FAQ_ITEMS = [
  { questionKey: "faqQ1", answerKey: "faqA1" },
  { questionKey: "faqQ2", answerKey: "faqA2" },
  { questionKey: "faqQ3", answerKey: "faqA3" },
  { questionKey: "faqQ4", answerKey: "faqA4" },
  { questionKey: "faqQ5", answerKey: "faqA5" },
];

const CONTACT_CHANNELS = [
  {
    icon: Phone,
    labelKey: "telefonLabel",
    value: "+998 71 123-45-67",
    badgeKey: "contactPhoneBadge",
    color: "text-[var(--ep-green)] dark:text-green-400",
  },
  {
    icon: Mail,
    labelKey: "contactEmailLabel",
    value: "support@europrint.uz",
    badgeKey: "contactEmailBadge",
    color: "text-[var(--ep-blue)] dark:text-blue-400",
  },
  {
    icon: MessageSquare,
    labelKey: "telegram",
    value: "@europrint_support",
    badgeKey: "tezkorYordamBadge",
    color: "text-[var(--ep-blue)] dark:text-sky-400",
  },
];

export default function LMSSupport() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "", priority: "medium" });

  const createTicketMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/lms/support/tickets", {
        subject: ticketForm.subject,
        message: ticketForm.message,
        priority: ticketForm.priority,
      }),
    onSuccess: () => {
      toast({ title: t("muvaffaqiyatToast"), description: t("murojaatMuvaffaqiyatliYuborildi") });
      setTicketDialogOpen(false);
      setTicketForm({ subject: "", message: "", priority: "medium" });
    },
    onError: () => {
      toast({ title: t("xatolikTitle"), description: t("murojaatYuborishdaXatolik"), variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/lms-dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back-to-lms">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {t("yordamMarkazi")}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("lmsPlatformasiBoyichaSavolVa")}
              </p>
            </div>
          </div>
          <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-new-ticket">
                <PlusCircle className="h-4 w-4 mr-2" />
                {t("yangiMurojaat")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-6">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-semibold">{t("yangiMurojaatYaratish")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="ticket-subject">{t("mavzu")}</Label>
                  <Input
                    id="ticket-subject"
                    placeholder={t("muammoMavzusi")}
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                    data-testid="input-ticket-subject"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ticket-message">{t("xabar")}</Label>
                  <Textarea
                    id="ticket-message"
                    placeholder={t("muammoniBatafsilYozing")}
                    rows={4}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm((f) => ({ ...f, message: e.target.value }))}
                    data-testid="input-ticket-message"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ticket-priority">{t("muhimlikDarajasi")}</Label>
                  <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger id="ticket-priority" data-testid="select-ticket-priority" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("low")}</SelectItem>
                      <SelectItem value="medium">{t("medium")}</SelectItem>
                      <SelectItem value="high">{t("high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createTicketMutation.mutate()}
                  disabled={createTicketMutation.isPending || !ticketForm.subject || !ticketForm.message}
                  data-testid="button-submit-ticket"
                >
                  {createTicketMutation.isPending ? t("yuborilmoqdaLoading") : t("yuborishBtn")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Array.isArray(CONTACT_CHANNELS) ? CONTACT_CHANNELS : []).map((ch) => {
            const Icon = ch.icon;
            const label = t(ch.labelKey);
            return (
              <Card key={ch.labelKey} data-testid={`card-contact-${ch.labelKey.toLowerCase()}`}>
                <CardContent className="flex flex-col items-center text-center gap-3 p-6">
                  <div className={`${ch.color} bg-card rounded-full p-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{ch.value}</p>
                  </div>
                  <EPStatusPill tone="neutral">{t(ch.badgeKey)}</EPStatusPill>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-primary" />
              {t("faqTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {(Array.isArray(FAQ_ITEMS) ? FAQ_ITEMS : []).map((item, idx) => (
              <div
                key={idx}
                className="py-4 first:pt-0 last:pb-0"
                data-testid={`faq-item-${idx}`}
              >
                <p className="font-medium text-sm text-foreground mb-1">
                  {t(item.questionKey)}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(item.answerKey)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("foydalanuvchiQollanmasi")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("foydalanuvchiQollanmasiMatn")}
              </p>
              <Link href="/lms/knowledge-base">
                <Button variant="outline" size="sm" className="mt-2" data-testid="button-knowledge-base">
                  {t("bilimlarBazasigaOtish")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                {t("muammoniBildiribQoying")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("muammoniBildirishMatn")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                data-testid="button-send-email"
                onClick={() =>
                  window.open("mailto:support@europrint.uz?subject=LMS+Muammo", "_blank")
                }
              >
                <LifeBuoy className="h-3.5 w-3.5 mr-1.5" />
                {t("murojaatYuborish")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/lms-dashboard">
            <Button variant="default" data-testid="button-back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("lmsBoshSahifasigaQaytish")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
