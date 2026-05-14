/**
 * PIN kiritish modali — tasdiq/rad/bekor qilish uchun. Light theme.
 */

import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { useTranslation } from '@/lib/i18n';
export function PinPromptModal({ documentId, action, open, onOpenChange, }: {
  documentId: string;
  action: 'approve' | 'reject' | 'cancel';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [comment, setComment] = useState("");
  const [reasonId, setReasonId] = useState<string | null>(null);

  type Reason = { id: string; reason_uz: string; reason_ru: string };
  const reasons = useQuery<Reason[]>({
    queryKey: [`/api/cc/documents/${documentId}/rejection-reasons`],
    queryFn: async () => {
      try { return await apiRequest<Reason[]>("GET", `/api/cc/documents/${documentId}/rejection-reasons`); }
      catch { return []; }
    },
    enabled: open && action === 'reject',
  });

  const submit = useMutation({
    mutationFn: () => {
      const url = `/api/cc/documents/${documentId}/${action}`;
      const body =
        action === 'approve' ? { pin, comment } :
        action === 'reject'  ? { pin, rejectionReasonId: reasonId, comment } :
                               { pin, reason: comment };
      return apiRequest("POST", url, body);
    },
    onSuccess: () => {
      toast({
        title: action === 'approve' ? "Tasdiqlandi" :
               action === 'reject'  ? "Rad etildi"   : "Bekor qilindi",
      });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/inbox"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/outbox"] });
      qc.invalidateQueries({ queryKey: ["/api/cc/baskets/summary"] });
      onOpenChange(false);
      setPin(""); setComment(""); setReasonId(null);
    },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const titleText  = action === 'approve' ? "Tasdiqlash"
                   : action === 'reject'  ? "Rad etish"  : "Bekor qilish";
  const submitTone = action === 'approve' ? "default" : action === 'reject' ? "destructive" : "secondary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{titleText}</DialogTitle>
          <DialogDescription>Imzo uchun PIN kodingizni kiriting (4-8 raqam).</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t('pinKod')}</label>
            <Input
              type="password"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
            />
          </div>

          {action === 'reject' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("sabab")}</label>
              <select
                value={reasonId ?? ""}
                onChange={(e) => setReasonId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-md text-sm border bg-background"
              >
                <option value="">— sababni tanlang (ixtiyoriy)</option>
                {(Array.isArray(reasons.data) ? reasons.data : []).map(r => (
                  <option key={r.id} value={r.id}>{r.reason_uz}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {action === 'cancel' ? "Bekor qilish sababi (majburiy)" : "Izoh (ixtiyoriy)"}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={action === 'cancel' ? "Sababni yozing..." : "Izoh..."}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Bekor")}</Button>
          <Button
            variant={submitTone as "default" | "destructive" | "secondary"}
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !/^\d{4,8}$/.test(pin) || (action === 'cancel' && !comment.trim())}
          >
            {titleText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
