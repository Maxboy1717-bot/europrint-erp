/**
 * @module SmsForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Smartphone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SmsFormProps {
  entityType: string;
  entityId: number;
  phone?: string;
}

export function SmsForm({ entityType, entityId, phone }: SmsFormProps) {
  const { toast } = useToast();
  const [smsForm, setSmsForm] = useState({
    phone: phone || "",
    message: "",
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/crm/sms/send", {
        ...data,
        entityType,
        entityId,
      });
    },
    onSuccess: () => {
      toast({ title: "SMS yuborildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/activities", entityType, entityId] });
      setSmsForm({ phone: phone || "", message: "" });
    },
  });

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Telefon</Label>
        <Input
          value={smsForm.phone}
          onChange={(e) => setSmsForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="+998"
          data-testid="input-sms-phone"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Xabar</Label>
        <Textarea
          value={smsForm.message}
          onChange={(e) => setSmsForm((prev) => ({ ...prev, message: e.target.value }))}
          className="min-h-[100px] resize-none"
          placeholder="SMS matni..."
          data-testid="input-sms-message"
        />
      </div>
      <Button
        className="w-full bg-blue-500 hover:bg-[var(--ep-blue)]/90"
        onClick={() => sendSmsMutation.mutate(smsForm)}
        disabled={!smsForm.message || !smsForm.phone || sendSmsMutation.isPending}
        data-testid="button-send-sms"
      >
        <Smartphone className="h-4 w-4 mr-2" />
        SMS yuborish
      </Button>
    </div>
  );
}
