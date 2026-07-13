/**
 * @module ReclamationsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useToast } from "@/hooks/use-toast";

interface Reclamation {
  id: number;
  reclamationNumber: string;
  customerName: string;
  productName: string | null;
  category: string;
  status: "new" | "investigating" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "critical";
  resolutionDays: number | null;
  reportedDate: string;
  resolvedAt: string | null;
}

// Keys match the canonical qc_reclamations.status values (apps/api/src/modules/qc/
// domain/aggregates/reclamation.aggregate.ts ReclamationStatus) — "investigating",
// not "in_progress".
const STATUS_CONFIG: Record<Reclamation["status"], { label: string; className: string }> = {
  new:           { label: "Yangi",        className: "bg-blue-100 text-[var(--ep-blue)]" },
  investigating: { label: "Jarayonda",    className: "bg-yellow-100 text-[var(--ep-yellow)]" },
  resolved:      { label: "Hal qilingan", className: "bg-emerald-100 text-[var(--ep-green)]" },
  rejected:      { label: "Rad etilgan",  className: "bg-rose-100 text-[var(--ep-red)]" },
};

const PRIORITY_CONFIG: Record<Reclamation["priority"], string> = {
  low:      "bg-slate-100 text-slate-700",
  medium:   "bg-blue-100 text-[var(--ep-blue)]",
  high:     "bg-orange-100 text-[var(--ep-primary)]",
  critical: "bg-[var(--ep-red)] text-white",
};

const SLA_RESOLUTION_DAYS = 7;

const SEVERITY_LABELS = {
  minor:    "Kichik (minor)",
  major:    "Katta (major)",
  critical: "Kritik (critical)",
};

// ── Create dialog ──────────────────────────────────────────────────────────────

function CreateReclamationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");
  const [description,  setDescription]  = useState("");
  const [severity,     setSeverity]     = useState<string>("minor");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<{ id: number }>("POST", "/api/qc/reclamations", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] });
      toast({ title: "Reklamatsiya yaratildi" });
      setCustomerName(""); setDescription(""); setSeverity("minor");
      onClose();
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  function handleSubmit() {
    if (!customerName.trim() || customerName.trim().length < 2) {
      toast({ title: "Mijoz nomi kamida 2 belgi bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (description.trim().length < 10) {
      toast({ title: "Tavsif kamida 10 belgi bo'lishi kerak", variant: "destructive" });
      return;
    }
    mutation.mutate({ customerName: customerName.trim(), description: description.trim(), severity });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi reklamatsiya</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Mijoz nomi *</Label>
            <Input placeholder="Mijoz nomi..." value={customerName}
              onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Tavsif * (kamida 10 belgi)</Label>
            <Input placeholder="Muammo tavsifi..." value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Og'irlik darajasi</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !customerName.trim() || description.trim().length < 10}
          >
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReclamationsPage() {
  const { t } = useTranslation('qc');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery<{ items: Reclamation[] }>({
    queryKey: ["/api/qc/reclamations"],
    queryFn: () => apiRequest("GET", "/api/qc/reclamations"),
  });

  const items = selectArray<Reclamation>(data, "items");
  const newCount = items.filter((r) => r.status === "new").length;
  const inProgress = items.filter((r) => r.status === "investigating").length;
  const resolved = items.filter((r) => r.status === "resolved").length;
  const overSla = items.filter(
    (r) => r.resolutionDays !== null && r.resolutionDays > SLA_RESOLUTION_DAYS,
  ).length;

  return (
    <DedicatedPageShell
      title={t('reclamations.title', "Reklamatsiya")}
      description={t('reclamations.description', "Mijoz shikoyatlari va ularni hal qilish (SLA: 7 kun)")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('reclamations.new', "Yangi")} value={newCount} icon={<AlertCircle className="h-4 w-4" />} variant={newCount > 0 ? "warning" : "default"} />
        <KpiCard label={t('reclamations.inProgress', "Jarayonda")} value={inProgress} icon={<Clock className="h-4 w-4" />} variant="default" />
        <KpiCard label={t('reclamations.resolved', "Hal qilingan")} value={resolved} icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('reclamations.overSla', "SLA dan oshgan")} value={overSla} icon={<MessageSquare className="h-4 w-4" />} variant={overSla > 0 ? "danger" : "success"} />
      </div>

      <Section title={t('reclamations.list', "Reklamatsiyalar ro'yxati")}>
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Yangi reklamatsiya
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('reclamations.empty', "Reklamatsiya yo'q")}</p>
        ) : (
          <div className="space-y-2">
            {items.map((r) => {
              const sCfg = STATUS_CONFIG[r.status] ?? { label: r.status, className: "bg-slate-100 text-slate-700" };
              const pCfg = PRIORITY_CONFIG[r.priority];
              const overdue = r.resolutionDays !== null && r.resolutionDays > SLA_RESOLUTION_DAYS;
              return (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.reclamationNumber}</span>
                      <span className="text-sm text-muted-foreground">— {r.customerName}</span>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={pCfg}>{r.priority}</Badge>
                      <Badge className={sCfg.className}>{sCfg.label}</Badge>
                      {overdue ? <EPStatusPill tone="danger">SLA</EPStatusPill> : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>{t("mahsulot")}<strong>{r.productName ?? '—'}</strong></span>
                    <span>{t("kategoriya1")}<strong>{r.category}</strong></span>
                    <span>{t("qabul")}<strong>{new Date(r.reportedDate).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
      <CreateReclamationDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </DedicatedPageShell>
  );
}
