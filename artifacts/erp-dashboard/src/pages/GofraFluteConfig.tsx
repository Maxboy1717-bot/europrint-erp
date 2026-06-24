/**
 * @module GofraFluteConfig
 * @description Config page for gofra (corrugated) flute take-up factors.
 * Route: /pp/gofra-config
 * Owner sets take-up factor per flute code; engine uses these in kg↔m²↔sheet formulas.
 */

import { useState } from "react";
import { Layers, Pencil, Check, X, Plus, Trash2, Calculator } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGofrConversion, type FluteTypeRow } from "@/hooks/useGofrConversion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Inline-edit row ────────────────────────────────────────────────────────────

function FluteRow({
  row,
  onSave,
  isSaving,
}: {
  row: FluteTypeRow;
  onSave: (code: string, factor: number) => Promise<unknown>;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(row.takeUpFactor ?? ""));
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setDraft(String(row.takeUpFactor ?? ""));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(String(row.takeUpFactor ?? ""));
  }

  async function handleSave() {
    const v = parseFloat(draft);
    if (isNaN(v) || v <= 0 || v > 5) {
      toast({ title: "Qiymat 0 dan katta va 5 dan kichik bo'lishi kerak", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onSave(row.code, v);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-semibold w-16">{row.code}</TableCell>
      <TableCell className="text-muted-foreground">{row.nameUz}</TableCell>
      <TableCell className="w-44">
        {editing ? (
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max="5"
            className="h-7 w-28 text-sm"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
              if (e.key === "Escape") cancelEdit();
            }}
          />
        ) : (
          <span className="tabular-nums">
            {row.takeUpFactor != null ? row.takeUpFactor.toFixed(4) : "—"}
          </span>
        )}
      </TableCell>
      <TableCell className="w-24 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-[var(--ep-green)]"
              onClick={() => void handleSave()}
              disabled={busy || isSaving}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              onClick={cancelEdit}
              disabled={busy}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={startEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Grammage calculator types ──────────────────────────────────────────────────

type LayerRole = 'liner' | 'flute';
type FluteCode = 'A' | 'B' | 'C' | 'E' | 'BC' | 'EB' | 'F';

interface GofraLayer {
  role: LayerRole;
  gsm: string;
  fluteType?: FluteCode;
}

const FLUTE_CODES: FluteCode[] = ['A', 'B', 'C', 'E', 'BC', 'EB', 'F'];

function defaultLayer(): GofraLayer {
  return { role: 'liner', gsm: '' };
}

// ── Grammage calculator ────────────────────────────────────────────────────────

function GofraGrammageCalculator() {
  const { toast } = useToast();
  const [layers, setLayers] = useState<GofraLayer[]>([
    { role: 'liner', gsm: '150' },
    { role: 'flute', gsm: '120', fluteType: 'C' },
    { role: 'liner', gsm: '150' },
  ]);
  const [result, setResult] = useState<number | null>(null);

  const calcMutation = useMutation({
    mutationFn: (payload: { layers: { role: LayerRole; gsm: number; fluteType?: FluteCode }[] }) =>
      apiRequest("POST", "/api/pp/gofra/grammage", payload),
    onSuccess: (data: unknown) => {
      const res = data as { grammageGsm?: number };
      setResult(typeof res?.grammageGsm === 'number' ? res.grammageGsm : null);
    },
    onError: () => toast({ title: "Hisoblashda xatolik", variant: "destructive" }),
  });

  function addLayer() {
    setLayers(prev => [...prev, defaultLayer()]);
  }

  function removeLayer(idx: number) {
    setLayers(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLayer(idx: number, patch: Partial<GofraLayer>) {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  function handleCompute() {
    const parsed = layers.map(l => ({ role: l.role, gsm: parseFloat(l.gsm), fluteType: l.fluteType }));
    if (parsed.some(l => isNaN(l.gsm) || l.gsm <= 0)) {
      toast({ title: "Barcha qatlamlar uchun musbat GSM kiriting", variant: "destructive" });
      return;
    }
    if (parsed.some(l => l.role === 'flute' && !l.fluteType)) {
      toast({ title: "Har flute qatlami uchun flute turini tanlang", variant: "destructive" });
      return;
    }
    setResult(null);
    calcMutation.mutate({ layers: parsed });
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-4 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Gofra Grammaj Kalkulyator</span>
          </div>
          <Button size="sm" variant="outline" onClick={addLayer} data-testid="button-add-layer">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Qatlam qo'sh
          </Button>
        </div>

        <div className="space-y-2">
          {layers.map((layer, idx) => (
            <div key={idx} className="flex items-center gap-2 flex-wrap" data-testid={`layer-row-${idx}`}>
              <Select value={layer.role} onValueChange={v => updateLayer(idx, { role: v as LayerRole, fluteType: v === 'liner' ? undefined : layer.fluteType })}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liner">Liner</SelectItem>
                  <SelectItem value="flute">Flute</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                step="1"
                placeholder="GSM"
                value={layer.gsm}
                onChange={e => updateLayer(idx, { gsm: e.target.value })}
                className="h-8 w-20 text-xs"
                data-testid={`input-gsm-${idx}`}
              />

              {layer.role === 'flute' && (
                <Select value={layer.fluteType ?? ""} onValueChange={v => updateLayer(idx, { fluteType: v as FluteCode })}>
                  <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue placeholder="Tur" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLUTE_CODES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeLayer(idx)}
                disabled={layers.length <= 1}
                data-testid={`button-remove-layer-${idx}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleCompute}
            disabled={calcMutation.isPending || layers.length === 0}
            size="sm"
            data-testid="button-compute-grammage"
          >
            {calcMutation.isPending ? "Hisoblanmoqda…" : "Hisoblash"}
          </Button>
          {result !== null && (
            <Badge className="text-sm px-3 py-1 bg-[var(--ep-green)]/15 text-[var(--ep-green)] border-[var(--ep-green)]/30" variant="outline" data-testid="result-grammage">
              {result.toFixed(1)} g/m²
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Qatlamlarni yuqoridan pastga kiriting (tashqi liner → flute → ichki liner). Hisoblash DB dagi take-up koeffitsientlaridan foydalanadi.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GofraFluteConfig() {
  const { fluteTypes, updateFluteFactor, isFluteLoading, isUpdatingFlute } = useGofrConversion();

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Layers className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">Gofra Flute Koeffitsientlari</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Har bir gofra turi uchun take-up (uzunlash) koeffitsienti. Formulalar: kg ↔ m² ↔ list.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border max-w-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Kod</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead className="w-44">Take-up koeffitsient</TableHead>
              <TableHead className="w-24 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFluteLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : fluteTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Flute turlari topilmadi
                </TableCell>
              </TableRow>
            ) : (
              fluteTypes.map((row) => (
                <FluteRow
                  key={row.code}
                  row={row}
                  onSave={updateFluteFactor}
                  isSaving={isUpdatingFlute}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-xl">
        Koeffitsient — gofralangan qog'oz tuzmoq uchun tekis qog'oz uzunligi × ushbu son = ishlatiladigan metraj.
        Misol: C-flute 1.45 → 100 m² gofra uchun 145 m² tekis qog'oz kerak.
      </p>

      {/* Grammage calculator */}
      <div className="border-t border-border/40 pt-5">
        <h2 className="text-sm font-semibold mb-3">Formula 3 — Gofra Grammaj Hisoblash</h2>
        <GofraGrammageCalculator />
      </div>
    </div>
  );
}
