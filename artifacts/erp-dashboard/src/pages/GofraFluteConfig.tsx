/**
 * @module GofraFluteConfig
 * @description Config page for gofra (corrugated) flute take-up factors.
 * Route: /pp/gofra-config
 * Owner sets take-up factor per flute code; engine uses these in kg↔m²↔sheet formulas.
 */

import { useState } from "react";
import { Layers, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGofrConversion, type FluteTypeRow } from "@/hooks/useGofrConversion";
import { useToast } from "@/hooks/use-toast";

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
    </div>
  );
}
