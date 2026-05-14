/**
 * @module WhatsAppForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_TEMPLATES } from "./types";
import { WhatsappIcon } from "./utils";

interface WhatsAppFormProps {
  entityType: string;
  entityId: number;
  phone?: string;
}

export function WhatsAppForm({ entityType, entityId, phone }: WhatsAppFormProps) {
  const { toast } = useToast();
  const [whatsappForm, setWhatsappForm] = useState({
    phone: phone || "",
    message: "",
    template: "",
  });

  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/crm/whatsapp/send", {
        ...data,
        entityType,
        entityId,
      });
    },
    onSuccess: () => {
      toast({ title: "WhatsApp xabar yuborildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      setWhatsappForm({ phone: phone || "", message: "", template: "" });
    },
  });

  const handleWhatsAppTemplateSelect = (templateId: string) => {
    const template = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setWhatsappForm((prev) => ({
        ...prev,
        template: templateId,
        message: template.text,
      }));
    }
  };

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Telefon</Label>
        <Input
          value={whatsappForm.phone}
          onChange={(e) => setWhatsappForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="+998"
          data-testid="input-whatsapp-phone"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Shablon</Label>
        <Select value={whatsappForm.template} onValueChange={handleWhatsAppTemplateSelect}>
          <SelectTrigger data-testid="select-whatsapp-template" className="h-9">
            <SelectValue placeholder="Shablonni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(WHATSAPP_TEMPLATES) ? WHATSAPP_TEMPLATES : []).map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Xabar</Label>
        <Textarea
          value={whatsappForm.message}
          onChange={(e) => setWhatsappForm((prev) => ({ ...prev, message: e.target.value }))}
          className="min-h-[100px] resize-none"
          placeholder="Xabarni yozing..."
          data-testid="input-whatsapp-message"
        />
      </div>
      <Button
        className="w-full bg-[var(--ep-green)] hover:bg-[var(--ep-green)]/90 text-white"
        onClick={() => sendWhatsAppMutation.mutate(whatsappForm)}
        disabled={!whatsappForm.message || !whatsappForm.phone || sendWhatsAppMutation.isPending}
        data-testid="button-send-whatsapp"
      >
        <WhatsappIcon className="h-4 w-4 mr-2" />
        Yuborish
      </Button>
    </div>
  );
}
