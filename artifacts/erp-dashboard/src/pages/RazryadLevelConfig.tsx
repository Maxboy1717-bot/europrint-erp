/**
 * @module RazryadLevelConfig
 * @description Config page for razryad (grade) level parameters: exam pass threshold, max retakes, salary range.
 * Route: /hr/razryad-config
 * Wraps GET+PATCH /api/org-structure/razryad-levels.
 * 6 levels — each row: coefficient (display), examPassThreshold (%), maxRetakes, salaryMin/Max.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";

// ── Types ──────────────────────────────────────────────────────────────────────

interface RazryadLevel {
  id: number;
  level: number;
  name: string;
  coefficient: string | number | null;
  exam_pass_threshold: string | number | null;
  max_retakes: number | null;
  min_months: number | null;
  salary_min: string | number | null;
  salary_max: string | number | null;
  is_active: boolean;
}

interface RazryadPatch {
  examPassThreshold?: number;
  maxRetakes?: number;
  minMonths?: number;
  salaryMin?: number;
  salaryMax?: number;
  coefficient?: number;
}

function fmtN(v: string | number | null, suffix = ""): string {
  if (v == null) return "—";
  const n = Number(v);
  return isNaN(n) ? "—" : `${n.toLocaleString("uz-UZ")}${suffix}`;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function LevelRow({
  row,
  onSave,
}: {
  row: RazryadLevel;
  onSave: (id: number, patch: RazryadPatch) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [threshold, setThreshold] = useState(row.exam_pass_threshold != null ? String(Number(row.exam_pass_threshold)) : "");
  const [retakes, setRetakes]     = useState(row.max_retakes != null ? String(row.max_retakes) : "");
  const [minMonths, setMinMonths] = useState(row.min_months != null ? String(row.min_months) : "");
  const [sMin, setSMin]           = useState(row.salary_min != null ? String(Number(row.salary_min)) : "");
  const [sMax, setSMax]           = useState(row.salary_max != null ? String(Number(row.salary_max)) : "");
  const [coeff, setCoeff]         = useState(row.coefficient != null ? String(Number(row.coefficient)) : "");
  const [busy, setBusy]           = useState(false);

  function startEdit() {
    setThreshold(row.exam_pass_threshold != null ? String(Number(row.exam_pass_threshold)) : "");
    setRetakes(row.max_retakes != null ? String(row.max_retakes) : "");
    setMinMonths(row.min_months != null ? String(row.min_months) : "");
    setSMin(row.salary_min != null ? String(Number(row.salary_min)) : "");
    setSMax(row.salary_max != null ? String(Number(row.salary_max)) : "");
    setCoeff(row.coefficient != null ? String(Number(row.coefficient)) : "");
    setEditing(true);
  }

  async function handleSave() {
    const th = parseFloat(threshold);
    const rt = parseInt(retakes, 10);
    const mm = parseInt(minMonths, 10);
    const mn = parseFloat(sMin);
    const mx = parseFloat(sMax);

    if (threshold !== "" && (isNaN(th) || th < 0 || th > 100)) {
      toast({ title: "Imtihon foizi 0–100 oralig'ida bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (retakes !== "" && (isNaN(rt) || rt < 0 || rt > 10)) {
      toast({ title: "Qayta topshirish 0–10 bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (minMonths !== "" && (isNaN(mm) || mm < 0 || mm > 120)) {
      toast({ title: tLabel('hr.razryadConfig.minMonthsRange', "Minimal oraliq (oy) 0–120 bo'lishi kerak"), variant: "destructive" });
      return;
    }
    if (sMin !== "" && sMax !== "" && !isNaN(mn) && !isNaN(mx) && mn > mx) {
      toast({ title: "Minimal oylik maksimaldan kichik bo'lishi kerak", variant: "destructive" });
      return;
    }

    const cf = parseFloat(coeff);
    if (coeff !== "" && (isNaN(cf) || cf <= 0 || cf > 20)) {
      toast({ title: "Koeffitsiyent 0 dan katta va 20 dan kichik bo'lishi kerak", variant: "destructive" });
      return;
    }

    const patch: RazryadPatch = {};
    if (threshold !== "" && !isNaN(th)) patch.examPassThreshold = th;
    if (retakes !== ""   && !isNaN(rt)) patch.maxRetakes = rt;
    if (minMonths !== "" && !isNaN(mm)) patch.minMonths = mm;
    if (sMin !== ""      && !isNaN(mn)) patch.salaryMin = mn;
    if (sMax !== ""      && !isNaN(mx)) patch.salaryMax = mx;
    if (coeff !== ""     && !isNaN(cf)) patch.coefficient = cf;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    setBusy(true);
    try {
      await onSave(row.id, patch);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="w-20 font-semibold text-primary text-center">
        {row.level}-razryad
      </TableCell>
      <TableCell className="w-32 text-sm text-muted-foreground">{row.name}</TableCell>
      <TableCell className="w-24 tabular-nums text-center text-sm font-mono">
        {editing ? (
          <Input type="number" min="0.01" max="20" step="0.05" className="h-7 w-20 text-sm"
            value={coeff} placeholder="×1.00" onChange={(e) => setCoeff(e.target.value)} />
        ) : (
          <>×{fmtN(row.coefficient)}</>
        )}
      </TableCell>
      {editing ? (
        <>
          <TableCell className="w-28">
            <Input type="number" min="0" max="100" step="1" className="h-7 w-24 text-sm"
              value={threshold} placeholder="%" onChange={(e) => setThreshold(e.target.value)} />
          </TableCell>
          <TableCell className="w-24">
            <Input type="number" min="0" max="10" step="1" className="h-7 w-20 text-sm"
              value={retakes} placeholder="0-10" onChange={(e) => setRetakes(e.target.value)} />
          </TableCell>
          <TableCell className="w-24">
            <Input type="number" min="0" max="120" step="1" className="h-7 w-20 text-sm"
              value={minMonths} placeholder="oy" onChange={(e) => setMinMonths(e.target.value)} />
          </TableCell>
          <TableCell className="w-36">
            <Input type="number" min="0" step="50000" className="h-7 w-32 text-sm"
              value={sMin} placeholder="UZS" onChange={(e) => setSMin(e.target.value)} />
          </TableCell>
          <TableCell className="w-36">
            <Input type="number" min="0" step="50000" className="h-7 w-32 text-sm"
              value={sMax} placeholder="UZS" onChange={(e) => setSMax(e.target.value)} />
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="w-28 tabular-nums text-center text-sm">
            {row.exam_pass_threshold != null ? `${fmtN(row.exam_pass_threshold)}%` : "—"}
          </TableCell>
          <TableCell className="w-24 tabular-nums text-center text-sm">
            {row.max_retakes != null ? row.max_retakes : "—"}
          </TableCell>
          <TableCell className="w-24 tabular-nums text-center text-sm">
            {row.min_months != null ? row.min_months : "—"}
          </TableCell>
          <TableCell className="w-36 tabular-nums text-right text-sm">
            {fmtN(row.salary_min, " so'm")}
          </TableCell>
          <TableCell className="w-36 tabular-nums text-right text-sm">
            {fmtN(row.salary_max, " so'm")}
          </TableCell>
        </>
      )}
      <TableCell className="w-20 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--ep-green)]"
              onClick={() => void handleSave()} disabled={busy}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
              onClick={() => setEditing(false)} disabled={busy}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RazryadLevelConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ items: RazryadLevel[] }>({
    queryKey: ["/api/org-structure/razryad-levels"],
    queryFn: () => apiRequest<{ items: RazryadLevel[] }>("GET", "/api/org-structure/razryad-levels"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: RazryadPatch }) =>
      apiRequest<RazryadLevel>("PATCH", `/api/org-structure/razryad-levels/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-structure/razryad-levels"] });
      toast({ title: "Razryad parametri saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  async function handleSave(id: number, patch: RazryadPatch) {
    await updateMutation.mutateAsync({ id, patch });
  }

  const levels: RazryadLevel[] = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">Razryad Darajalari Konfiguratsiyasi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            6 razryad daraja — imtihon o'tish chegarasi (%), qayta topshirish soni, oylik tarif (min/max).
            Koeffitsient o'zgarishdan saqlangan (Org Tuzilma tomonidan boshqariladi).
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 text-center">Daraja</TableHead>
              <TableHead className="w-32">Nomi</TableHead>
              <TableHead className="w-24 text-center">Koeff.</TableHead>
              <TableHead className="w-28 text-center">Imtihon %</TableHead>
              <TableHead className="w-24 text-center">Qayta top.</TableHead>
              <TableHead className="w-24 text-center">Min. oraliq (oy)</TableHead>
              <TableHead className="w-36 text-right">Minimal oylik</TableHead>
              <TableHead className="w-36 text-right">Maksimal oylik</TableHead>
              <TableHead className="w-20 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Razryad darajalari topilmadi
                </TableCell>
              </TableRow>
            ) : (
              levels.map((row) => (
                <LevelRow key={row.id} row={row} onSave={handleSave} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Imtihon foizi: razryad imtihonini o'tish uchun minimal ball (masalan 75 = 75%).
        Qayta topshirish: muvaffaqiyatsiz bo'lganda necha marta qayta topshirish mumkin (0-10).
        Min. oraliq (oy): oxirgi razryad o'zgarishidan keyingi razryadga o'tishgacha kutish muddati (3-oy guard).
        Oylik tarif: razryad egasiga to'lanadigan ish haqi oralig'i (so'mda).
      </p>
    </div>
  );
}
