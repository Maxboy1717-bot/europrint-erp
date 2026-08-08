/**
 * @module InProcessQcPage
 * @description Jarayon ichidagi (inline) QC tekshiruvlari — MES→QC golden-thread.
 * Route: /qc/in-process
 * GET  /api/qc/in-process — tekshiruvlar ro'yxati (inspector_name JOIN)
 * POST /api/qc/in-process — yangi inline tekshiruv ({ session_id, inspector_id?, check_point?, sample_size, defects_found, notes? })
 *   status server-side derive bo'ladi (defects → pass/fail).
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InProcessRow {
  id: number;
  session_id: number | null;
  inspector_id: number | null;
  inspector_name: string | null;
  check_point: string | null;
  sample_size: number | null;
  defects_found: number | null;
  status: string | null;
  notes: string | null;
  created_at: string;
}

interface SessionRow {
  id: number;
  status?: string | null;
  order_id?: number | string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pass:    { label: "O'tdi",   color: "bg-[var(--ep-green)] text-white" },
  fail:    { label: "Brak",    color: "bg-[var(--ep-red)] text-white" },
  warning: { label: "Ogohlik", color: "bg-[var(--ep-yellow)] text-white" },
};

function defectRate(sample: number | null, defects: number | null): number {
  if (!sample || sample <= 0) return 0;
  return Math.round(((defects ?? 0) / sample) * 1000) / 10;
}

// ── Create dialog ──────────────────────────────────────────────────────────────

function CreateInProcessDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("qc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId]     = useState("");
  const [checkPoint, setCheckPoint]   = useState("");
  const [sampleSize, setSampleSize]   = useState("");
  const [defectsFound, setDefectsFound] = useState("");
  const [notes, setNotes]             = useState("");

  // session dropdown — GET /api/mes/sessions (8 real production sessions)
  const { data: sessionsRaw } = useQuery({
    queryKey: ["/api/mes/sessions"],
    queryFn: () => apiRequest("GET", "/api/mes/sessions?limit=50"),
    enabled: open,
  });
  const sessions = selectArray<SessionRow>(sessionsRaw, "items");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<InProcessRow>("POST", "/api/qc/in-process", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/in-process"] });
      toast({ title: t("inProcessQc.saved", "Tekshiruv saqlandi") });
      setSessionId(""); setCheckPoint(""); setSampleSize(""); setDefectsFound(""); setNotes("");
      onClose();
    },
    onError: () => toast({ title: t("inProcessQc.saveError", "Saqlash xatoligi"), variant: "destructive" }),
  });

  function handleSubmit() {
    const sid = parseInt(sessionId, 10);
    if (isNaN(sid) || sid <= 0) {
      toast({ title: t("inProcessQc.sessionRequired", "Ishlab chiqarish sessiyasi majburiy"), variant: "destructive" });
      return;
    }
    const ss = parseInt(sampleSize, 10);
    const df = parseInt(defectsFound, 10);
    if (isNaN(ss) || ss < 0) {
      toast({ title: t("inProcessQc.sampleRequired", "Namuna hajmi majburiy (≥0)"), variant: "destructive" });
      return;
    }
    if (isNaN(df) || df < 0) {
      toast({ title: t("inProcessQc.defectsRequired", "Brak soni majburiy (≥0)"), variant: "destructive" });
      return;
    }
    if (df > ss) {
      toast({ title: t("inProcessQc.defectsExceed", "Brak soni namuna hajmidan oshmasligi kerak"), variant: "destructive" });
      return;
    }
    const dto: Record<string, unknown> = { session_id: sid, sample_size: ss, defects_found: df };
    if (checkPoint.trim()) dto.check_point = checkPoint.trim();
    if (notes.trim())      dto.notes       = notes.trim();
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-[var(--ep-primary)]" />
            {t("inProcessQc.createTitle", "Yangi inline tekshiruv")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>{t("inProcessQc.session", "Ishlab chiqarish sessiyasi")} *</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger><SelectValue placeholder={t("inProcessQc.selectSession", "Sessiyani tanlang")} /></SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    #{s.id}{s.order_id ? ` · ${t("inProcessQc.order", "buyurtma")} ${s.order_id}` : ""}{s.status ? ` · ${s.status}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("inProcessQc.checkPoint", "Nazorat nuqtasi")}</Label>
            <Input
              placeholder={t("inProcessQc.checkPointPh", "masalan: Bosma sifati, O'lcham")}
              value={checkPoint}
              onChange={(e) => setCheckPoint(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inProcessQc.sampleSize", "Namuna hajmi")} *</Label>
              <Input type="number" min="0" placeholder="0" value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inProcessQc.defects", "Brak soni")} *</Label>
              <Input type="number" min="0" placeholder="0" value={defectsFound} onChange={(e) => setDefectsFound(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("inProcessQc.notes", "Izoh")}</Label>
            <Textarea
              placeholder={t("inProcessQc.notesPh", "Qo'shimcha izoh...")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("inProcessQc.cancel", "Bekor")}</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
          >
            {mutation.isPending ? t("inProcessQc.saving", "Saqlanmoqda...") : t("inProcessQc.save", "Saqlash")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────────

export default function InProcessQcPage() {
  const { t } = useTranslation("qc");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/qc/in-process"],
    queryFn: () => apiRequest("GET", "/api/qc/in-process?limit=100"),
  });

  const rows = selectArray<InProcessRow>(data, "items");

  const total = rows.length;
  const failed = rows.filter((r) => r.status === "fail").length;
  const totalDefects = rows.reduce((s, r) => s + (r.defects_found ?? 0), 0);
  const totalSamples = rows.reduce((s, r) => s + (r.sample_size ?? 0), 0);
  const overallRate = defectRate(totalSamples, totalDefects);

  return (
    <DedicatedPageShell
      title={t("inProcessQc.title", "Jarayon Ichidagi QC")}
      description={t("inProcessQc.desc", "Ishlab chiqarish davomida o'tkazilgan inline sifat tekshiruvlari")}
      actions={
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {t("inProcessQc.create", "Yangi tekshiruv")}
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label={t("inProcessQc.kpiTotal", "Jami tekshiruv")}
          value={total.toLocaleString()}
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <KpiCard
          label={t("inProcessQc.kpiFailed", "Brak topildi")}
          value={failed.toLocaleString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={failed > 0 ? "danger" : "success"}
        />
        <KpiCard
          label={t("inProcessQc.kpiPass", "O'tgan")}
          value={(total - failed).toLocaleString()}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          label={t("inProcessQc.kpiRate", "Umumiy brak %")}
          value={`${overallRate}%`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={overallRate > 5 ? "danger" : overallRate > 2 ? "warning" : "success"}
        />
      </div>

      <Section title={t("inProcessQc.list", "Tekshiruvlar")}>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {t("inProcessQc.empty", "Hali tekshiruvlar yo'q")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">{t("inProcessQc.session", "Sessiya")}</th>
                  <th className="text-left p-3 font-medium">{t("inProcessQc.checkPoint", "Nuqta")}</th>
                  <th className="text-left p-3 font-medium">{t("inProcessQc.inspector", "Nazoratchi")}</th>
                  <th className="text-right p-3 font-medium">{t("inProcessQc.sampleSize", "Namuna")}</th>
                  <th className="text-right p-3 font-medium">{t("inProcessQc.defects", "Brak")}</th>
                  <th className="text-right p-3 font-medium">{t("inProcessQc.rate", "Brak %")}</th>
                  <th className="text-center p-3 font-medium">{t("inProcessQc.status", "Holat")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cfg = STATUS_CONFIG[r.status ?? ""] ?? { label: r.status ?? "—", color: "bg-muted text-foreground" };
                  const rate = defectRate(r.sample_size, r.defects_found);
                  return (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono">#{r.session_id ?? "—"}</td>
                      <td className="p-3">{r.check_point ?? "—"}</td>
                      <td className="p-3">{r.inspector_name ?? "—"}</td>
                      <td className="p-3 text-right">{r.sample_size ?? 0}</td>
                      <td className="p-3 text-right text-[var(--ep-red)]">{r.defects_found ?? 0}</td>
                      <td className="p-3 text-right">{rate}%</td>
                      <td className="p-3 text-center">
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <CreateInProcessDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </DedicatedPageShell>
  );
}
