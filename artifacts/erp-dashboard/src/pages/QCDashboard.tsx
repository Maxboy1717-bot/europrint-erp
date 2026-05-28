/**
 * @module QCDashboard
 * @description React page component. Route-level UI.
 * State management, hooks, and section orchestration only.
 * See QCDashboardTypes.ts, QCDashboardSections.tsx, QCDashboardDialogs.tsx
 * for the split-out pieces.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { QcStats, QcFlowData, QcBrak, QcReclamation, QcSupplierQuality } from "./QCDashboardTypes";
import { KpiSection, QcFlowSection, AttentionSection, SummarySection } from "./QCDashboardSections";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QCDashboard() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const { data: stats,    isLoading: sLoad  } = useQuery<QcStats>            ({ queryKey: ["/api/qc/dashboard/stats"] });
  const { data: flow,     isLoading: fLoad  } = useQuery<QcFlowData>         ({ queryKey: ["/api/qc/dashboard/flow"] });
  const { data: braks,    isLoading: bLoad  } = useQuery<QcBrak[]>           ({ queryKey: ["/api/qc/braks"] });
  const { data: recRaw,   isLoading: rLoad  } = useQuery<QcReclamation[]>    ({ queryKey: ["/api/qc/reclamations"] });
  const { data: supplier, isLoading: suLoad } = useQuery<QcSupplierQuality[]>({ queryKey: ["/api/qc/supplier-quality"] });

  const recs:      QcReclamation[]    = Array.isArray(recRaw)   ? recRaw   : [];
  const suppliers: QcSupplierQuality[] = Array.isArray(supplier) ? supplier : [];
  const brakList:  QcBrak[]           = Array.isArray(braks)    ? braks    : [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/qc/inspections/${id}`, { status: "approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/dashboard/stats"] });
      toast({ title: tLabel('common.QCDashboard.tasdiqlandi', "Tasdiqlandi") });
    },
    onError: () => toast({
      title: tLabel('common.QCDashboard.serverXatosi', "Server xatosi"),
      description: tLabel('common.QCDashboard.ushbuFunksiyaHaliSozlanmoqda', "Ushbu funksiya hali sozlanmoqda"),
      variant: "destructive",
    }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("PATCH", `/api/qc/inspections/${id}`, { status: "rejected", reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/qc/dashboard/stats"] });
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
      toast({ title: tLabel('common.QCDashboard.radEtildi', "Rad etildi") });
    },
    onError: () => toast({
      title: tLabel('common.QCDashboard.serverXatosi', "Server xatosi"),
      description: tLabel('common.QCDashboard.ushbuFunksiyaHaliSozlanmoqda', "Ushbu funksiya hali sozlanmoqda"),
      variant: "destructive",
    }),
  });

  const passRate  = stats?.tests?.passRate || 0;
  const passColor = passRate >= 95 ? "text-[var(--ep-green)]" : passRate >= 85 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]";

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("qcSifatNazorati")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("k4TaQcOqimiSifat")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn(
            "text-sm font-semibold px-3",
            passRate >= 95 ? "bg-green-50 text-[var(--ep-green)]" :
            passRate >= 85 ? "bg-amber-50 text-[var(--ep-yellow)]" :
                             "bg-red-50 text-[var(--ep-red)]"
          )}>
            O'tish darajasi: {sLoad ? "..." : `${passRate}%`}
          </Badge>
          {(stats?.openRca || 0) > 0 && (
            <Badge className="bg-orange-50 text-[var(--ep-primary)] text-sm px-3">
              {stats?.openRca} ochiq RCA
            </Badge>
          )}
        </div>
      </div>

      {/* ── SECTION 1: KPI Kartalar ────────────────────────── */}
      <KpiSection stats={stats} loading={sLoad} passColor={passColor} passRate={passRate} />

      {/* ── SECTION 2: 4 ta QC Oqimi ─────────────────────── */}
      <QcFlowSection flow={flow} loading={fLoad} />

      {/* ── SECTION 3: E'tibor kerak ─────────────────────── */}
      <AttentionSection
        recs={recs}
        brakList={brakList}
        suppliers={suppliers}
        rLoad={rLoad}
        bLoad={bLoad}
        suLoad={suLoad}
        onApprove={(id: string) => approveMutation.mutate(id)}
        onReject={(id: string) => setRejectDialog({ open: true, id })}
        approveLoading={approveMutation.isPending}
      />

      {/* ── SECTION 4: Sifat xulosa ─────────────────────── */}
      <SummarySection stats={stats} loading={sLoad} />

      {/* Reject sababi dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => { if (!open) { setRejectDialog({ open: false, id: null }); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLabel('common.QCDashboard.radEtishSababi', "Rad etish sababi")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="qc-reject-reason">{tLabel('common.QCDashboard.sabab', "Sabab")}</Label>
            <Textarea
              id="qc-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={tLabel('common.QCDashboard.sabab', "Sabab")}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, id: null }); setRejectReason(""); }}>
              {tLabel('common.QCDashboard.bekor', "Bekor")}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => { if (rejectDialog.id) rejectMutation.mutate({ id: rejectDialog.id, reason: rejectReason }); }}
            >
              {tLabel('common.QCDashboard.radEtish', "Rad etish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tezkor harakatlar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-module">{t("qcModuli")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-extended">{t("qcExtended")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-final">{t("finalInspeksiya")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/qc-approval">{t("verify")}<ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
        </Button>
      </div>

    </div>
  );
}
