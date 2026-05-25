/**
 * @module EmailForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Paperclip } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';

interface EmailFormProps {
  entityType: string;
  entityId: number;
  email?: string;
}

export function EmailForm({ entityType, entityId, email }: EmailFormProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [emailForm, setEmailForm] = useState({
    to: email || "",
    subject: "",
    body: "",
    attachments: [] as File[],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/crm/email/send", {
        ...data,
        entityType,
        entityId,
      });
    },
    onSuccess: () => {
      toast({ title: "Email yuborildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      setEmailForm({ to: email || "", subject: "", body: "", attachments: [] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      toast({
        title: "Email yuborilmadi",
        description: msg.includes("400")
          ? "To'g'ri email manzil kiriting (masalan: user@example.com)"
          : "Serverda xatolik yuz berdi, qaytadan urinib ko'ring",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-3 p-4">
      <div>
        <Input
          placeholder="Kimga (masalan: user@example.com)"
          value={emailForm.to}
          onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
          data-testid="input-email-to"
        />
        {emailForm.to && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.to) && (
          <p className="text-xs text-destructive mt-1">{t("togriEmailManzilKiriting")}</p>
        )}
      </div>
      <Input
        placeholder={t("mavzu")}
        value={emailForm.subject}
        onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
        data-testid="input-email-subject"
      />
      <Textarea
        placeholder={t("xatMatni")}
        value={emailForm.body}
        onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
        className="min-h-[150px] resize-none"
        data-testid="input-email-body"
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" data-testid="button-email-attach">
          <Paperclip className="h-3.5 w-3.5 mr-1.5" />
          {t("faylBiriktirish")}
        </Button>
      </div>
      <Button
        className="w-full bg-blue-500 hover:bg-[var(--ep-blue)]/90"
        onClick={() => sendEmailMutation.mutate(emailForm)}
        disabled={
          !emailForm.to ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.to) ||
          !emailForm.subject ||
          sendEmailMutation.isPending
        }
        data-testid="button-send-email"
      >
        <Mail className="h-4 w-4 mr-2" />
        {t("submitBtn")}
      </Button>
    </div>
  );
}
