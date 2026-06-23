/**
 * @module WorkCenterNormsConfig
 * @description Config page for work-center norms (norma/brak/crew per sex/ish markazi).
 * Route: /pp/work-center-norms
 * Wraps PUT /api/pp/work-centers/:id/norms (normaM2PerShift, brakLimitPct, min/maxCrewSize + reason).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface WorkCenter {
  id: number;
  name: string;
  code: string;
  type: string;
  norma_m2_per_shift: string | null;
  norma_kg_per_shift: string | null;
  brak_limit_pct: string | null;
  min_crew_size: number | null;
  max_crew_size: number | null;
}

interface NormForm {
  normaM2PerShift: string;
  normaKgPerShift: string;
  brakLimitPct: string;
  minCrewSize: string;
  maxCrewSize: string;
  reason: string;
}

const EMPTY_FORM: NormForm = {
  normaM2PerShift: "", normaKgPerShift: "", brakLimitPct: "",
  minCrewSize: "",     maxCrewSize: "",     reason: "",
};

function toForm(wc: WorkCenter): NormForm {
  return {
    normaM2PerShift: wc.norma_m2_per_shift ?? "",
    normaKgPerShift: wc.norma_kg_per_shift ?? "",
    brakLimitPct:    wc.brak_limit_pct     ?? "",
    minCrewSize:     wc.min_crew_size != null ? String(wc.min_crew_size) : "",
    maxCrewSize:     wc.max_crew_size != null ? String(wc.max_crew_size) : "",
    reason: "",
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkCenterNormsConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editWc, setEditWc]   = useState<WorkCenter | null>(null);
  const [form, setForm]       = useState<NormForm>(EMPTY_FORM);
  const [open, setOpen]       = useState(false);

  const { data, isLoading } = useQuery<WorkCenter[]>({
    queryKey: ["/api/pp/work-centers"],
    queryFn: () => apiRequest<WorkCenter[]>("GET", "/api/pp/work-centers"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiRequest("PUT", `/api/pp/work-centers/${id}/norms`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pp/work-centers"] });
      setOpen(false);
      setEditWc(null);
      toast({ title: "Normativ saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  const workCenters: WorkCenter[] = Array.isArray(data) ? data : [];

  function startEdit(wc: WorkCenter) {
    setEditWc(wc);
    setForm(toForm(wc));
    setOpen(true);
  }

  function handleSubmit() {
    if (!editWc) return;
    if (form.reason.trim().length < 5) {
      toast({ title: "Sabab kamida 5 belgi bo'lishi kerak", variant: "destructive" });
      return;
    }
    const body: Record<string, unknown> = { reason: form.reason.trim() };
    const m2 = parseFloat(form.normaM2PerShift);
    const kg = parseFloat(form.normaKgPerShift);
    const br = parseFloat(form.brakLimitPct);
    const mn = parseInt(form.minCrewSize, 10);
    const mx = parseInt(form.maxCrewSize, 10);
    if (!isNaN(m2)) body.normaM2PerShift = m2;
    if (!isNaN(kg)) body.normaKgPerShift = kg;
    if (!isNaN(br)) body.brakLimitPct    = br;
    if (!isNaN(mn)) body.minCrewSize     = mn;
    if (!isNaN(mx)) body.maxCrewSize     = mx;
    updateMutation.mutate({ id: editWc.id, body });
  }

  function fmt(v: string | number | null | undefined): string {
    if (v == null || v === "") return "—";
    const n = Number(v);
    return isNaN(n) ? String(v) : n.toLocaleString("uz-UZ");
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">Ish Markazi Normativlari</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Har bir sex/ish markazi uchun smena norma (m²/kg), brak chegarasi va brigada hajmi.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead className="w-32 text-right">Norma m²/smena</TableHead>
              <TableHead className="w-28 text-right">Brak limit %</TableHead>
              <TableHead className="w-28 text-right">Brigada (min–max)</TableHead>
              <TableHead className="w-20 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : workCenters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Ish markazlari topilmadi
                </TableCell>
              </TableRow>
            ) : (
              workCenters.map((wc) => (
                <TableRow key={wc.id}>
                  <TableCell className="font-medium">{wc.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{wc.code}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(wc.norma_m2_per_shift)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(wc.brak_limit_pct)}{wc.brak_limit_pct ? "%" : ""}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {wc.min_crew_size != null && wc.max_crew_size != null
                      ? `${wc.min_crew_size}–${wc.max_crew_size}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(wc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditWc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Normativ tahrirlash — {editWc?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Field label="Norma m²/smena (ixtiyoriy)" value={form.normaM2PerShift}
              onChange={(v) => setForm(f => ({ ...f, normaM2PerShift: v }))} placeholder="Masalan: 5500" />
            <Field label="Norma kg/smena (ixtiyoriy)" value={form.normaKgPerShift}
              onChange={(v) => setForm(f => ({ ...f, normaKgPerShift: v }))} placeholder="Masalan: 2000" />
            <Field label="Brak limit % (0–100)" value={form.brakLimitPct}
              onChange={(v) => setForm(f => ({ ...f, brakLimitPct: v }))} placeholder="Masalan: 3" />
            <Field label="Min brigada (kishilar soni)" value={form.minCrewSize}
              onChange={(v) => setForm(f => ({ ...f, minCrewSize: v }))} placeholder="Masalan: 2" />
            <Field label="Max brigada (kishilar soni)" value={form.maxCrewSize}
              onChange={(v) => setForm(f => ({ ...f, maxCrewSize: v }))} placeholder="Masalan: 4" />
            <Field label="Sabab (majburiy, ≥5 belgi) *" value={form.reason}
              onChange={(v) => setForm(f => ({ ...f, reason: v }))} placeholder="Masalan: Texnologik tartib yangilandi" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending || form.reason.trim().length < 5}
            >
              {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
