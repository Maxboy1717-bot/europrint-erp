/**
 * @module GofraWasteConfig
 * @description Config page for gofra chiqindi% (waste) and kley (glue) parameters.
 * Route: /pp/gofra-waste-config
 * GET  /api/pp/gofra/config        — list all params
 * PATCH /api/pp/gofra/config/:key  — update one param
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GofraConfigRow {
  id: number;
  key: string;
  label_uz: string;
  value: string | number;
  unit: string | null;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function ConfigRow({
  row,
  onSave,
}: {
  row: GofraConfigRow;
  onSave: (key: string, value: number) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(String(Number(row.value)));
  const [busy, setBusy]       = useState(false);

  function startEdit() {
    setVal(String(Number(row.value)));
    setEditing(true);
  }

  async function handleSave() {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      toast({ title: "Qiymat 0 dan katta bo'lishi kerak", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onSave(row.key, num);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="w-48 font-mono text-xs text-muted-foreground">{row.key}</TableCell>
      <TableCell className="w-56 font-medium">{row.label_uz}</TableCell>
      {editing ? (
        <TableCell className="w-36">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              step="0.01"
              className="h-7 w-24 text-sm"
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
            {row.unit && <span className="text-xs text-muted-foreground">{row.unit}</span>}
          </div>
        </TableCell>
      ) : (
        <TableCell className="w-36 tabular-nums font-semibold text-primary">
          {Number(row.value).toFixed(row.unit === "%" ? 1 : 2)}{row.unit ? ` ${row.unit}` : ""}
        </TableCell>
      )}
      <TableCell className="w-20 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-[var(--ep-green)]"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
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

export default function GofraWasteConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ items: GofraConfigRow[] }>({
    queryKey: ["/api/pp/gofra/config"],
    queryFn: () => apiRequest<{ items: GofraConfigRow[] }>("GET", "/api/pp/gofra/config"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      apiRequest<GofraConfigRow>("PATCH", `/api/pp/gofra/config/${key}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pp/gofra/config"] });
      toast({ title: "Gofra config saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  async function handleSave(key: string, value: number) {
    await updateMutation.mutateAsync({ key, value });
  }

  const items: GofraConfigRow[] = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-base">Gofra Chiqindi & Kley Konfiguratsiyasi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gofra konversiya formulasidagi standart chiqindi foiz va kley og'irligi parametrlari.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Kalit</TableHead>
              <TableHead className="w-56">Parametr</TableHead>
              <TableHead className="w-36">Qiymat</TableHead>
              <TableHead className="w-20 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Ma'lumot topilmadi
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <ConfigRow key={row.key} row={row} onSave={handleSave} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground max-w-2xl space-y-1">
        <p>
          <strong>waste_pct_default:</strong> Gofra konversiyasida standart chiqindi ulushi (%).
          Klient alohida foiz ko&apos;rsatmasa, bu qiymat ishlatiladi.
        </p>
        <p>
          <strong>kley_gsm:</strong> Bir m² gofra uchun sarf bo&apos;ladigan kley og&apos;irligi (g/m²).
          Umumiy material narx hisob-kitobida ishlatiladi.
        </p>
      </div>
    </div>
  );
}
