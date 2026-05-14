/**
 * @module HRRequestDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle } from "lucide-react";

interface HRRequestDialogProps {
  nodeId: number;
  nodeName: string;
  portretId?: number;
  open: boolean;
  onClose: () => void;
}

const REQUEST_TYPES = [
  { value: "new_hire",    label: "Yangi xodim yollash" },
  { value: "replacement", label: "Xodimni almashtirish" },
  { value: "additional",  label: "Qo'shimcha xodim" },
  { value: "transfer",    label: "Ko'chirish / Transfer" },
  { value: "promotion",   label: "Lavozim ko'tarish" },
];

export function HRRequestDialog({
  nodeId, nodeName, portretId, open, onClose,
}: HRRequestDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ request_type: "new_hire", priority: "normal", comment: "" });

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/org-structure/nodes/${nodeId}/hr-requests`, {
      ...form, portret_id: portretId, node_name: nodeName,
    }),
    onSuccess: () => {
      toast({ title: "✅ HR ga so'rov yuborildi", description: "HR director xabardor qilindi (ERP + Telegram)" });
      qc.invalidateQueries({ queryKey: [`/api/org-structure/nodes/${nodeId}/hr-requests`] });
      onClose();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            HR ga so'rov yuborish
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{nodeName}</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label className="text-xs mb-1 block">So'rov turi</Label>
            <Select value={form.request_type} onValueChange={v => setForm(f => ({ ...f, request_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(REQUEST_TYPES) ? REQUEST_TYPES : []).map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Muhimlik darajasi</Label>
            <div className="flex gap-2">
              {([
                { value: "normal", label: "Oddiy",         color: "bg-amber-500" },
                { value: "urgent", label: "🔴 SHOSHILINCH", color: "bg-red-500"   },
              ]).map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.priority === p.value
                      ? `${p.color} text-white border-transparent`
                      : "border-border/40 text-muted-foreground hover:border-primary/40"
                  }`}
                >{p.label}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Qo'shimcha tushuntirish, shoshilinchlik sababi..."
              rows={3}
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            />
          </div>

          {portretId && (
            <div className="flex items-center gap-2 text-xs text-[var(--ep-green)] bg-green-50 dark:bg-green-950/30 rounded-lg p-2.5">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              Portret saqlangan — so'rovga avtomatik biriktiriladi
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Bekor</Button>
          <Button
            size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="bg-primary text-primary-foreground"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {mutation.isPending ? "Yuborilmoqda..." : "HR ga yuborish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
