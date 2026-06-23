/**
 * @module SupplierQualityPage
 * @description Yetkazuvchi sifat nazorati: reyting jadvali + yangi tekshiruv forma.
 * Route: /qc/vendor-quality
 * GET /api/qc/supplier-quality  — raw yozuvlar ro'yxati
 * POST /api/qc/supplier-quality — yangi sifat tekshiruvi
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
import { Truck, Star, AlertTriangle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SupplierQualityRow {
  vendorId: number;
  vendorName: string;
  totalReceipts: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  qualityScore: number;
  grade: "A" | "B" | "C" | "D";
  trendLast90Days: "up" | "down" | "flat";
}

interface RawQualityRecord {
  id: number;
  supplier_name: string;
  delivery_date: string;
  total_quantity: number;
  sample_size: number | null;
  defects_found: number | null;
  quality_score: number | null;
  notes: string | null;
  status: string | null;
  created_at: string;
}

const GRADE_CONFIG: Record<SupplierQualityRow["grade"], { label: string; color: string }> = {
  A: { label: "A'lo (81-100)",     color: "bg-[var(--ep-green)] text-white" },
  B: { label: "Yaxshi (61-80)",    color: "bg-[var(--ep-blue)] text-white" },
  C: { label: "Qoniqarli (41-60)", color: "bg-[var(--ep-yellow)] text-white" },
  D: { label: "Yomon (0-40)",      color: "bg-[var(--ep-red)] text-white" },
};

const PASS_RATE_THRESHOLD_GOOD = 95;

// ── Create dialog ──────────────────────────────────────────────────────────────

function CreateQualityCheckDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [supplierName, setSupplierName] = useState("");
  const [sampleSize, setSampleSize]   = useState("");
  const [defectsFound, setDefectsFound] = useState("");
  const [qualityScore, setQualityScore] = useState("");
  const [notes, setNotes]             = useState("");

  const mutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      apiRequest<RawQualityRecord>("POST", "/api/qc/supplier-quality", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/supplier-quality"] });
      toast({ title: "Sifat tekshiruvi saqlandi" });
      setSupplierName(""); setSampleSize(""); setDefectsFound(""); setQualityScore(""); setNotes("");
      onClose();
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  function handleSubmit() {
    if (!supplierName.trim()) {
      toast({ title: "Yetkazuvchi nomi majburiy", variant: "destructive" });
      return;
    }
    const ss = parseInt(sampleSize, 10);
    const df = parseInt(defectsFound, 10);
    const qs = parseFloat(qualityScore);
    const dto: Record<string, unknown> = { supplier_name: supplierName.trim() };
    if (!isNaN(ss) && ss >= 0) dto.sample_size = ss;
    if (!isNaN(df) && df >= 0) dto.defects_found = df;
    if (!isNaN(qs) && qs >= 0 && qs <= 100) dto.quality_score = qs;
    if (notes.trim()) dto.notes = notes.trim();
    mutation.mutate(dto);
  }

  const passRate = (() => {
    const ss = parseInt(sampleSize, 10);
    const df = parseInt(defectsFound, 10);
    if (!isNaN(ss) && ss > 0 && !isNaN(df) && df >= 0) {
      return Math.round(((ss - df) / ss) * 100);
    }
    return null;
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yangi sifat tekshiruvi</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Yetkazuvchi nomi *</Label>
            <Input placeholder="Yetkazuvchi nomi..." value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Namuna soni</Label>
              <Input type="number" min="0" placeholder="0" value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Aniqlangan nuqsonlar</Label>
              <Input type="number" min="0" placeholder="0" value={defectsFound}
                onChange={(e) => setDefectsFound(e.target.value)} />
            </div>
          </div>
          {passRate !== null && (
            <p className="text-xs text-muted-foreground">
              Pass foizi: <strong>{passRate}%</strong>
            </p>
          )}
          <div className="grid gap-1.5">
            <Label>Sifat bali (0-100)</Label>
            <Input type="number" min="0" max="100" placeholder="100" value={qualityScore}
              onChange={(e) => setQualityScore(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Izoh</Label>
            <Input placeholder="Qo'shimcha ma'lumot..." value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !supplierName.trim()}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SupplierQualityPage() {
  const { t } = useTranslation('qc');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery<{ items: SupplierQualityRow[] }>({
    queryKey: ["/api/qc/supplier-quality"],
    queryFn: () => apiRequest("GET", "/api/qc/supplier-quality"),
  });

  const items = selectArray<SupplierQualityRow>(data, "items");
  const aGrade = items.filter((s) => s.grade === "A").length;
  const dGrade = items.filter((s) => s.grade === "D").length;
  const avgPassRate = items.length > 0
    ? Math.round(items.reduce((s, v) => s + v.passRate, 0) / items.length)
    : 0;

  return (
    <DedicatedPageShell
      title={t('supplierQc.title', "Yetkazuvchi Sifati")}
      description={t('supplierQc.description', "Vendor reyting: Narx 30% + Sifat 30% + Vaqt 20% + Xizmat 20%")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('supplierQc.total', "Yetkazuvchilar")} value={items.length} icon={<Truck className="h-4 w-4" />} />
        <KpiCard label={t('supplierQc.gradeA', "A reyting")} value={aGrade} icon={<Star className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('supplierQc.gradeD', "D reyting")} value={dGrade} icon={<AlertTriangle className="h-4 w-4" />} variant={dGrade > 0 ? "danger" : "default"} />
        <KpiCard label={t('supplierQc.avgPassRate', "O'rtacha PASS%")} value={`${avgPassRate}%`} icon={<Star className="h-4 w-4" />} variant={avgPassRate >= PASS_RATE_THRESHOLD_GOOD ? "success" : "warning"} />
      </div>

      <Section title={t('supplierQc.list', "Yetkazuvchilar reytingi")}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{items.length} ta yetkazuvchi</p>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Yangi tekshiruv
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t('supplierQc.empty', "Ma'lumot yo'q")}</p>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Birinchi tekshiruvni qo'shing
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-2">{t('supplierQc.vendor', "Yetkazuvchi")}</th>
                  <th className="text-right p-2">{t('supplierQc.receipts', "GR soni")}</th>
                  <th className="text-right p-2">{t('supplierQc.passed', "Pass")}</th>
                  <th className="text-right p-2">{t('supplierQc.failed', "Fail")}</th>
                  <th className="text-right p-2">{t('supplierQc.passRate', "Pass %")}</th>
                  <th className="text-right p-2">{t('supplierQc.score', "Ball")}</th>
                  <th className="text-center p-2">{t('supplierQc.grade', "Grade")}</th>
                  <th className="text-center p-2">{t('supplierQc.trend', "Trend")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => {
                  const cfg = GRADE_CONFIG[v.grade];
                  return (
                    <tr key={v.vendorId} className="border-b">
                      <td className="p-2 font-medium">{v.vendorName}</td>
                      <td className="text-right p-2">{v.totalReceipts}</td>
                      <td className="text-right p-2 text-[var(--ep-green)]">{v.passedCount}</td>
                      <td className="text-right p-2 text-[var(--ep-red)]">{v.failedCount}</td>
                      <td className="text-right p-2 font-medium">{v.passRate}%</td>
                      <td className="text-right p-2 font-medium">{v.qualityScore}</td>
                      <td className="text-center p-2"><Badge className={cfg.color}>{v.grade}</Badge></td>
                      <td className="text-center p-2">
                        {v.trendLast90Days === "up" ? "↑" : v.trendLast90Days === "down" ? "↓" : "→"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <CreateQualityCheckDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </DedicatedPageShell>
  );
}
