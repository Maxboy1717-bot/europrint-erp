/**
 * @module HRZnoPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Plus, Search, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface ZnoRequest {
  id: string | number;
  purpose: string;
  amount: number | string;
  status?: string;
  submitter_name?: string;
  submitterName?: string;
  department_id?: number;
  departmentId?: number;
  payment_date?: string;
  paymentDate?: string;
  comment?: string;
  created_at?: string;
  createdAt?: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  pending:  { label: "Kutilmoqda",    variant: "secondary",    icon: <Clock        className="h-3 w-3" /> },
  approved: { label: "Tasdiqlangan",  variant: "default",      icon: <CheckCircle  className="h-3 w-3" /> },
  rejected: { label: "Rad etildi",    variant: "destructive",  icon: <XCircle      className="h-3 w-3" /> },
  paid:     { label: "To'langan",     variant: "outline",      icon: <CreditCard   className="h-3 w-3" /> },
};

const formatAmount = (v: number | string) =>
  Number(v).toLocaleString("uz-UZ") + " so'm";

export default function HRZnoPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ id: string | number; type: "approve" | "reject" } | null>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({
    purpose: "", amount: "", submitter_name: "", payment_date: "",
  });

  const { data: rawData, isLoading, isError, refetch } = useQuery<ZnoRequest[] | { data?: ZnoRequest[]; items?: ZnoRequest[] }>({
    queryKey: ["/api/hr/zno", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      return await apiRequest("GET", `/api/hr/zno${params}`);
    },
  });

  const items: ZnoRequest[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: ZnoRequest[] })?.data
      ?? (rawData as { items?: ZnoRequest[] })?.items
      ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/hr/zno", {
        ...dto,
        amount: parseFloat(dto.amount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zno"] });
      toast({ title: "ZNO arizasi yaratildi" });
      setShowCreate(false);
      setForm({ purpose: "", amount: "", submitter_name: "", payment_date: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Ariza yaratishda xatolik", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string | number; comment: string }) => {
      return await apiRequest("PATCH", `/api/hr/zno/${id}/approve`, { comment: comment || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zno"] });
      toast({ title: "ZNO tasdiqlandi" });
      setActionDialog(null);
      setComment("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Tasdiqlashda xatolik", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string | number; comment: string }) => {
      return await apiRequest("PATCH", `/api/hr/zno/${id}/reject`, { comment: comment || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/zno"] });
      toast({ title: "ZNO rad etildi" });
      setActionDialog(null);
      setComment("");
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Rad etishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch} />;

  const filtered = items.filter(r => {
    const text = `${r.purpose} ${r.submitter_name ?? r.submitterName ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.type === "approve") {
      approveMutation.mutate({ id: actionDialog.id, comment });
    } else {
      rejectMutation.mutate({ id: actionDialog.id, comment });
    }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <ModulePage
      module="hr"
      title={t("znoNaqdPulArizalari")}
      icon={<Banknote className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-zno">
          <Plus className="h-4 w-4 mr-2" />
          {t("arizaYaratish")}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("arizaQidirish")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-zno"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected", "paid"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-status-${s}`}
              >
                {s === "all" ? "Barchasi" : STATUS_MAP[s]?.label ?? s}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "ZNO arizalari mavjud emas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const status = r.status ?? "pending";
              const sc = STATUS_MAP[status] ?? STATUS_MAP.pending;
              const submitter = r.submitter_name ?? r.submitterName;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-zno-${r.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.purpose}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="text-sm font-semibold text-foreground">
                            {formatAmount(r.amount)}
                          </span>
                          {submitter && (
                            <span className="text-xs text-muted-foreground">{submitter}</span>
                          )}
                          {(r.payment_date ?? r.paymentDate) && (
                            <span className="text-xs text-muted-foreground">
                              To'lov sanasi: {new Date(r.payment_date ?? r.paymentDate ?? "").toLocaleDateString("uz-UZ")}
                            </span>
                          )}
                        </div>
                        {r.comment && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{r.comment}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={sc.variant} className="gap-1 text-xs">
                          {sc.icon}{sc.label}
                        </Badge>
                        {status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-[var(--ep-green)] border-green-200 hover:bg-green-50"
                              onClick={() => { setActionDialog({ id: r.id, type: "approve" }); setComment(""); }}
                              data-testid={`button-approve-zno-${r.id}`}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("verify")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => { setActionDialog({ id: r.id, type: "reject" }); setComment(""); }}
                              data-testid={`button-reject-zno-${r.id}`}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              {t("reject")}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiZnoArizasi")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("maqsad")}</Label>
              <Textarea
                value={form.purpose}
                onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                placeholder={t("naqdPulMaqsadi")}
                rows={3}
                data-testid="input-zno-purpose"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Miqdor (so'm) *</Label>
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="1000000"
                data-testid="input-zno-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("arizaBeruvchi")}</Label>
              <Input
                value={form.submitter_name}
                onChange={e => setForm(f => ({ ...f, submitter_name: e.target.value }))}
                placeholder={t("ismFamilya")}
                data-testid="input-zno-submitter"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("tolovSanasi")}</Label>
              <Input
                type="date"
                value={form.payment_date}
                onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                data-testid="input-zno-payment-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.purpose.trim() && form.amount) createMutation.mutate(form); }}
              disabled={!form.purpose.trim() || !form.amount || createMutation.isPending}
              data-testid="button-confirm-create-zno"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject dialog */}
      <Dialog open={!!actionDialog} onOpenChange={open => { if (!open) { setActionDialog(null); setComment(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold"> {actionDialog?.type === "approve" ? "ZNO ni tasdiqlash" : "ZNO ni rad etish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Izoh (ixtiyoriy)</Label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t("izoh1")}
                rows={3}
                data-testid="input-action-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setComment(""); }}>{t("Bekor")}</Button>
            <Button
              variant={actionDialog?.type === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={isPending}
              data-testid="button-confirm-action"
            >
              {isPending
                ? "Yuklanmoqda..."
                : actionDialog?.type === "approve"
                  ? "Tasdiqlash"
                  : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModulePage>
  );
}
