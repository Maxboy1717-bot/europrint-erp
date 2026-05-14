/**
 * @module KaizenPageDialogs
 * @description Dialog components for KaizenPage (submit + status change).
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lightbulb } from "lucide-react";
import type { KaizenSuggestion } from "./KaizenPageTypes";
import { STATUS_CONFIG, STATUS_TRANSITIONS } from "./KaizenPageTypes";
import { useTranslation } from '@/lib/i18n';

// ── SubmitForm ────────────────────────────────────────────────────────────────

function SubmitForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", description: "", expectedImpact: "" });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/kaizen/suggestions", data),
    onSuccess: () => {
      toast({ title: "G'oya muvaffaqiyatli topshirildi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Sarlavha va tavsif majburiy", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">{t("sarlavha")}</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("goyaQisqaSarlavhasi")}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">{t("tavsif")}</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder={t("goyaniBatafsilTushuntiring")}
          rows={4}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="impact">{t("kutilayotganNatija1")}</Label>
        <Textarea
          id="impact"
          value={form.expectedImpact}
          onChange={(e) => setForm((f) => ({ ...f, expectedImpact: e.target.value }))}
          placeholder={t("qandayFoydaniKutmoqdasiz")}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Topshirilmoqda..." : "Topshirish"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── StatusDialogBody ──────────────────────────────────────────────────────────

function StatusDialogBody({
  suggestion, onClose, onSuccess,
}: { suggestion: KaizenSuggestion; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [newStatus, setNewStatus]           = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [resultMeasured, setResultMeasured] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { status: string; rejectionReason?: string; resultMeasured?: string }) =>
      apiRequest("PATCH", `/api/kaizen/suggestions/${suggestion.id}/status`, data),
    onSuccess: () => {
      toast({ title: "Status yangilandi" });
      onSuccess();
      onClose();
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const nextStatuses = STATUS_TRANSITIONS[suggestion.status] ?? [];

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg">
        <p className="font-medium text-sm">{suggestion.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("joriyHolat")}<strong>{STATUS_CONFIG[suggestion.status]?.label}</strong>
        </p>
      </div>
      <div className="space-y-1">
        <Label>{t("yangiHolat1")}</Label>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
            <SelectValue placeholder={t("holatTanlang")} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(nextStatuses) ? nextStatuses : []).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {newStatus === "rejected" && (
        <div className="space-y-1">
          <Label>{t("radEtishSababi")}</Label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t("nimaUchunRadEtildi")}
            rows={3}
          />
        </div>
      )}
      {newStatus === "completed" && (
        <div className="space-y-1">
          <Label>{t("natijaOlchovi")}</Label>
          <Textarea
            value={resultMeasured}
            onChange={(e) => setResultMeasured(e.target.value)}
            placeholder={t("natijalariQandayBoldi")}
            rows={3}
          />
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
        <Button
          disabled={!newStatus || mutation.isPending || (newStatus === "rejected" && !rejectionReason)}
          onClick={() =>
            mutation.mutate({
              status: newStatus,
              rejectionReason: rejectionReason || undefined,
              resultMeasured: resultMeasured || undefined,
            })
          }
        >
          {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── KaizenSubmitDialog ────────────────────────────────────────────────────────

interface KaizenSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function KaizenSubmitDialog({ open, onOpenChange, onSuccess }: KaizenSubmitDialogProps) {
  const { t } = useTranslation("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" /> {t("yangiGoyaTopshirish")}
          </DialogTitle>
        </DialogHeader>
        <SubmitForm onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}

// ── KaizenStatusDialog ────────────────────────────────────────────────────────

interface KaizenStatusDialogProps {
  target: KaizenSuggestion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function KaizenStatusDialog({ target, onClose, onSuccess }: KaizenStatusDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("holatOzgartirish")}</DialogTitle>
        </DialogHeader>
        {target && (
          <StatusDialogBody suggestion={target} onClose={onClose} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}
