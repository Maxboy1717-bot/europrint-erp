import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Paperclip } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailFormProps {
  entityType: string;
  entityId: number;
  email?: string;
}

export function EmailForm({ entityType, entityId, email }: EmailFormProps) {
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
  });

  return (
    <div className="space-y-3 p-4">
      <Input
        placeholder="Kimg"
        value={emailForm.to}
        onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
        data-testid="input-email-to"
      />
      <Input
        placeholder="Mavzu"
        value={emailForm.subject}
        onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
        data-testid="input-email-subject"
      />
      <Textarea
        placeholder="Xat matni..."
        value={emailForm.body}
        onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
        className="min-h-[150px] resize-none"
        data-testid="input-email-body"
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" data-testid="button-email-attach">
          <Paperclip className="h-3.5 w-3.5 mr-1.5" />
          Fayl biriktirish
        </Button>
      </div>
      <Button
        className="w-full bg-blue-500 hover:bg-blue-600"
        onClick={() => sendEmailMutation.mutate(emailForm)}
        disabled={!emailForm.to || !emailForm.subject || sendEmailMutation.isPending}
        data-testid="button-send-email"
      >
        <Mail className="h-4 w-4 mr-2" />
        Yuborish
      </Button>
    </div>
  );
}
