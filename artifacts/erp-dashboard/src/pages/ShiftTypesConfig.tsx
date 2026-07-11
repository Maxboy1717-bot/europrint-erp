/**
 * @module ShiftTypesConfig
 * @description Config page for shift types (smena jadvali).
 * Route: /hr/shift-types-config
 * Owner configures shift start/end time and overtime multiplier.
 * Data feeds late-arrival-fine cron and IoT tablet shift-schedule.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ShiftType {
  id: number;
  code: string;
  name_uz: string;
  start_time: string;
  end_time: string;
  overtime_multiplier: string | number;
  is_active: boolean;
}

// ── Inline-edit row ────────────────────────────────────────────────────────────

function ShiftRow({
  row,
  onSave,
  onDelete,
}: {
  row: ShiftType;
  onSave: (id: number, patch: { start_time?: string; end_time?: string; overtime_multiplier?: number }) => Promise<unknown>;
  onDelete: (id: number) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [startTime, setStartTime]     = useState(row.start_time);
  const [endTime, setEndTime]         = useState(row.end_time);
  const [multiplier, setMultiplier]   = useState(String(row.overtime_multiplier));
  const [busy, setBusy]               = useState(false);

  function startEdit() {
    setStartTime(row.start_time);
    setEndTime(row.end_time);
    setMultiplier(String(row.overtime_multiplier));
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); }

  async function handleSave() {
    const m = parseFloat(multiplier);
    if (isNaN(m) || m < 1 || m > 5) {
      toast({ title: "Koeffitsient 1 dan 5 gacha bo'lishi kerak", variant: "destructive" });
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      toast({ title: "Vaqt formati HH:MM bo'lishi kerak (masalan 08:00)", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onSave(row.id, { start_time: startTime, end_time: endTime, overtime_multiplier: m });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-semibold w-24">{row.code}</TableCell>
      <TableCell className="text-muted-foreground">{row.name_uz}</TableCell>
      <TableCell className="w-28">
        {editing ? (
          <Input className="h-7 w-20 text-sm" value={startTime}
            onChange={(e) => setStartTime(e.target.value)} placeholder="HH:MM" />
        ) : (
          <span className="tabular-nums">{row.start_time}</span>
        )}
      </TableCell>
      <TableCell className="w-28">
        {editing ? (
          <Input className="h-7 w-20 text-sm" value={endTime}
            onChange={(e) => setEndTime(e.target.value)} placeholder="HH:MM" />
        ) : (
          <span className="tabular-nums">{row.end_time}</span>
        )}
      </TableCell>
      <TableCell className="w-36">
        {editing ? (
          <Input type="number" step="0.1" min="1" max="5"
            className="h-7 w-20 text-sm" value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)} />
        ) : (
          <span className="tabular-nums">{parseFloat(String(row.overtime_multiplier)).toFixed(1)}×</span>
        )}
      </TableCell>
      <TableCell className="w-24 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--ep-green)]"
              onClick={() => void handleSave()} disabled={busy}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
              onClick={cancelEdit} disabled={busy}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(row.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const EMPTY_NEW_SHIFT = { code: "", name_uz: "", start_time: "", end_time: "", overtime_multiplier: "1.5" };

export default function ShiftTypesConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newShift, setNewShift] = useState(EMPTY_NEW_SHIFT);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<ShiftType[]>({
    queryKey: ["/api/hr/shifts/types"],
    queryFn: () => apiRequest<ShiftType[]>("GET", "/api/hr/shifts/types"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: {
      id: number;
      patch: { start_time?: string; end_time?: string; overtime_multiplier?: number };
    }) => apiRequest<ShiftType>("PATCH", `/api/hr/shifts/types/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/types"] });
      toast({ title: "Smena vaqti saqlandi" });
    },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  // 2026-07-11: egasi so'rovi — sahifa faqat mavjud 3 smenani tahrirlar edi, yangi qo'shish/
  // o'chirish yo'q edi ("sozlanishi kerak"). Backend POST/DELETE endi mavjud (hr-shifts-compat).
  const createMutation = useMutation({
    mutationFn: (dto: typeof newShift) => apiRequest<ShiftType>("POST", "/api/hr/shifts/types", {
      ...dto,
      code: dto.code.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      overtime_multiplier: parseFloat(dto.overtime_multiplier) || 1.5,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/types"] });
      toast({ title: tLabel("hr.yangiSmenaTuriQoshildi", "Yangi smena turi qo'shildi") });
      setAddOpen(false);
      setNewShift(EMPTY_NEW_SHIFT);
    },
    onError: (e) => toast({ title: tLabel("common.xatolik", "Xatolik"), description: (e as Error).message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/shifts/types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/shifts/types"] });
      toast({ title: tLabel("hr.smenaTuriOchirildi", "Smena turi o'chirildi") });
      setDeleteId(null);
    },
    onError: () => toast({ title: tLabel("hr.ochirishXatoligi", "O'chirish xatoligi"), variant: "destructive" }),
  });

  const shifts: ShiftType[] = Array.isArray(data) ? data : [];

  async function handleSave(
    id: number,
    patch: { start_time?: string; end_time?: string; overtime_multiplier?: number },
  ) {
    await updateMutation.mutateAsync({ id, patch });
  }

  function submitNewShift() {
    if (!newShift.code || !newShift.name_uz || !/^\d{2}:\d{2}$/.test(newShift.start_time) || !/^\d{2}:\d{2}$/.test(newShift.end_time)) {
      toast({ title: tLabel("hr.kodNomVaqtToldirilishiShart", "Kod, nom va vaqt (HH:MM) to'ldirilishi shart"), variant: "destructive" });
      return;
    }
    createMutation.mutate(newShift);
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Smena Jadvali Konfiguratsiyasi</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Har bir smena boshlash/tugash vaqti va ortiqcha ish koeffitsienti.
              Kunlik kech kelish hisobi va IoT tablet smenasi shu yerdan o'qiladi.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Yangi smena qo'shish
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border max-w-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Kod</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead className="w-28">Boshlanish</TableHead>
              <TableHead className="w-28">Tugash</TableHead>
              <TableHead className="w-36">Ortiqcha ish koeff.</TableHead>
              <TableHead className="w-24 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : shifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Smena turlari topilmadi
                </TableCell>
              </TableRow>
            ) : (
              shifts.map((row) => (
                <ShiftRow key={row.id} row={row} onSave={handleSave} onDelete={setDeleteId} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Tungi smena tugash vaqti kechasi bo'lishi mumkin (masalan 07:00 — ertasi kuni ertasi).
        Koeffitsient: 1.0 = oddiy stavka, 1.5 = yarim barobar qo'shimcha ish haqi.
      </p>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader><DialogTitle>{tLabel("hr.yangiSmenaTuri", "Yangi smena turi")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Kod</Label>
              <Input value={newShift.code} onChange={(e) => setNewShift((f) => ({ ...f, code: e.target.value }))} placeholder="DAY_SHIFT_2" />
            </div>
            <div>
              <Label>Nomi</Label>
              <Input value={newShift.name_uz} onChange={(e) => setNewShift((f) => ({ ...f, name_uz: e.target.value }))} placeholder={tLabel("hr.ikkinchiKunduzgiSmena", "Ikkinchi kunduzgi smena")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Boshlanish</Label>
                <Input value={newShift.start_time} onChange={(e) => setNewShift((f) => ({ ...f, start_time: e.target.value }))} placeholder="08:00" />
              </div>
              <div>
                <Label>Tugash</Label>
                <Input value={newShift.end_time} onChange={(e) => setNewShift((f) => ({ ...f, end_time: e.target.value }))} placeholder="17:00" />
              </div>
            </div>
            <div>
              <Label>Ortiqcha ish koeffitsienti</Label>
              <Input type="number" step="0.1" min="1" max="5" value={newShift.overtime_multiplier}
                onChange={(e) => setNewShift((f) => ({ ...f, overtime_multiplier: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
            <Button onClick={submitNewShift} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title={tLabel("hr.smenaTuriniOchirish", "Smena turini o'chirish")}
        description={tLabel("hr.smenaOchirishTavsif", "Bu amalni qaytarib bo'lmaydi. Shu smenani ishlatgan eski yozuvlarga ta'sir qilmaydi.")}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />
    </div>
  );
}
