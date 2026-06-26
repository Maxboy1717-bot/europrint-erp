/**
 * @module ErrorCatalogConfig
 * @description XATO-KATALOG (defect-dropdown manbai) boshqaruv sahifasi (T23-B1, EP-ORG-097).
 *   Tipik xatolar / nuqson-sabablarini CRUD qiladi — bu ro'yxat `DefectDropdown`
 *   (kunlik-hisobot / ЦКП-fakt / IoT-tablet) "Nima xato/sabab bo'ldi?" tanlovini to'ldiradi.
 *
 * Route: /org-structure/error-catalog
 * Wraps: GET/POST /api/org-structure/error-catalog · PATCH/DELETE /api/org-structure/error-catalog/:id
 *   - GET ?includeArchived=true → arxivlangan satrlar ham (boshqaruv ekrani).
 *   - card_id NULL = umumiy xato (hamma kartaga ko'rinadi).
 *
 * ⭐ JADVAL BO'SH tug'iladi (Q-40) — real xato-ro'yxati shu sahifa orqali EGASI/HR kiritadi.
 * F1 (loading skeleton) + F2 (onError toast) + Q-14 (ConfirmDialog) + Qoida 21 (EP token).
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPStatusPill, type EPStatusTone } from "@/components/ep/EPStatusPill";
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ErrorCatalogItem {
  id: number;
  card_id: number | null;
  code: string | null;
  name: string;
  name_ru: string | null;
  category: string | null;
  severity: string | null;
  description: string | null;
  sort_order: number | null;
  is_active: boolean;
}

interface ErrorCatalogPayload {
  code?: string | null;
  name?: string;
  nameRu?: string | null;
  category?: string | null;
  severity?: string | null;
  description?: string | null;
  sortOrder?: number | null;
}

/** severity → EPStatusPill ohangi (master-data severity erkin-matn bo'lishi mumkin). */
function severityTone(severity: string | null): EPStatusTone {
  switch ((severity ?? "").toLowerCase()) {
    case "high":
    case "critical":
    case "yuqori":
      return "danger";
    case "medium":
    case "o'rta":
    case "orta":
      return "warning";
    case "low":
    case "past":
      return "info";
    default:
      return "neutral";
  }
}

// ── Inline-edit row ──────────────────────────────────────────────────────────────

function CatalogRow({
  row,
  onSave,
  onDelete,
}: {
  row: ErrorCatalogItem;
  onSave: (id: number, patch: ErrorCatalogPayload) => Promise<unknown>;
  onDelete: (id: number) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName]         = useState(row.name ?? "");
  const [code, setCode]         = useState(row.code ?? "");
  const [category, setCategory] = useState(row.category ?? "");
  const [severity, setSeverity] = useState(row.severity ?? "");
  const [sortOrder, setSortOrder] = useState(row.sort_order != null ? String(row.sort_order) : "");
  const [busy, setBusy]         = useState(false);

  function startEdit() {
    setName(row.name ?? "");
    setCode(row.code ?? "");
    setCategory(row.category ?? "");
    setSeverity(row.severity ?? "");
    setSortOrder(row.sort_order != null ? String(row.sort_order) : "");
    setEditing(true);
  }

  async function handleSave() {
    if (name.trim() === "") {
      toast({ title: "Nomi bo'sh bo'lishi mumkin emas", variant: "destructive" });
      return;
    }
    const so = parseInt(sortOrder, 10);
    const patch: ErrorCatalogPayload = {
      name: name.trim(),
      code: code.trim() === "" ? null : code.trim(),
      category: category.trim() === "" ? null : category.trim(),
      severity: severity.trim() === "" ? null : severity.trim(),
      sortOrder: sortOrder !== "" && !isNaN(so) ? so : null,
    };
    setBusy(true);
    try {
      await onSave(row.id, patch);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <TableRow className={row.is_active ? "" : "opacity-50"}>
      <TableCell className="w-28 text-sm font-mono text-muted-foreground">
        {editing ? (
          <Input className="h-7 w-24 text-sm" value={code} placeholder="kod"
            onChange={(e) => setCode(e.target.value)} />
        ) : (
          row.code || "—"
        )}
      </TableCell>
      <TableCell className="min-w-48 text-sm">
        {editing ? (
          <Input className="h-7 w-full text-sm" value={name} placeholder="Xato nomi"
            onChange={(e) => setName(e.target.value)} />
        ) : (
          <span className="font-medium">{row.name}</span>
        )}
      </TableCell>
      <TableCell className="w-36 text-sm">
        {editing ? (
          <Input className="h-7 w-32 text-sm" value={category} placeholder="guruh"
            onChange={(e) => setCategory(e.target.value)} />
        ) : (
          row.category || "—"
        )}
      </TableCell>
      <TableCell className="w-28 text-sm">
        {editing ? (
          <Input className="h-7 w-24 text-sm" value={severity} placeholder="yuqori/o'rta/past"
            onChange={(e) => setSeverity(e.target.value)} />
        ) : row.severity ? (
          <EPStatusPill tone={severityTone(row.severity)} hideDot>{row.severity}</EPStatusPill>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="w-20 text-center text-sm tabular-nums">
        {editing ? (
          <Input type="number" className="h-7 w-16 text-sm" value={sortOrder} placeholder="0"
            onChange={(e) => setSortOrder(e.target.value)} />
        ) : (
          row.sort_order ?? "—"
        )}
      </TableCell>
      <TableCell className="w-24 text-center text-sm">
        {row.card_id == null ? (
          <EPStatusPill tone="info" hideDot>Umumiy</EPStatusPill>
        ) : (
          <span className="text-muted-foreground">#{row.card_id}</span>
        )}
      </TableCell>
      <TableCell className="w-28 text-right">
        {editing ? (
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--ep-green)]"
              onClick={() => void handleSave()} disabled={busy} aria-label="Saqlash">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
              onClick={() => setEditing(false)} disabled={busy} aria-label="Bekor">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={startEdit} aria-label="Tahrirlash">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[var(--ep-red)]"
              onClick={() => onDelete(row.id)} aria-label="Arxivlash" disabled={!row.is_active}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Create dialog ────────────────────────────────────────────────────────────────

function CreateDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: ErrorCatalogPayload) => Promise<unknown>;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setName(""); setCode(""); setCategory(""); setSeverity(""); setSortOrder("");
  }

  async function handleCreate() {
    if (name.trim() === "") {
      toast({ title: "Xato nomi majburiy", variant: "destructive" });
      return;
    }
    const so = parseInt(sortOrder, 10);
    setBusy(true);
    try {
      await onCreate({
        name: name.trim(),
        code: code.trim() === "" ? null : code.trim(),
        category: category.trim() === "" ? null : category.trim(),
        severity: severity.trim() === "" ? null : severity.trim(),
        sortOrder: sortOrder !== "" && !isNaN(so) ? so : null,
      });
      reset();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi xato-katalog yozuvi</DialogTitle>
          <DialogDescription>
            Tipik xato / nuqson-sabab. Bu ro'yxat operator formasidagi defect-dropdownda ko'rinadi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ec-name">Nomi *</Label>
            <Input id="ec-name" value={name} placeholder="Masalan: Bo'yoq notekis tushgan"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ec-code">Kod</Label>
              <Input id="ec-code" value={code} placeholder="QC-001"
                onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ec-cat">Guruh</Label>
              <Input id="ec-cat" value={category} placeholder="sifat / material / deadline"
                onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ec-sev">Jiddiylik</Label>
              <Input id="ec-sev" value={severity} placeholder="yuqori / o'rta / past"
                onChange={(e) => setSeverity(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ec-sort">Tartib</Label>
              <Input id="ec-sort" type="number" value={sortOrder} placeholder="0"
                onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Bekor</Button>
          <Button onClick={() => void handleCreate()} disabled={busy}>Qo'shish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function ErrorCatalogConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const QKEY = "/api/org-structure/error-catalog?includeArchived=true";

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ items: ErrorCatalogItem[] }>({
    queryKey: [QKEY],
    queryFn: () => apiRequest<{ items: ErrorCatalogItem[] }>("GET", QKEY),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: [QKEY] });
    // DefectDropdown boshqa cardId bilan cache qiladi — prefix bo'yicha bekor qilamiz.
    queryClient.invalidateQueries({ queryKey: ["/api/org-structure/error-catalog"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: ErrorCatalogPayload) =>
      apiRequest<ErrorCatalogItem>("POST", "/api/org-structure/error-catalog", payload),
    onSuccess: () => { invalidate(); toast({ title: "Xato-katalog yozuvi qo'shildi" }); },
    onError: () => toast({ title: "Qo'shishda xatolik", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: ErrorCatalogPayload }) =>
      apiRequest<ErrorCatalogItem>("PATCH", `/api/org-structure/error-catalog/${id}`, patch),
    onSuccess: () => { invalidate(); toast({ title: "Saqlandi" }); },
    onError: () => toast({ title: "Saqlash xatoligi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<unknown>("DELETE", `/api/org-structure/error-catalog/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Arxivlandi" }); },
    onError: () => toast({ title: "Arxivlashda xatolik", variant: "destructive" }),
  });

  async function handleSave(id: number, patch: ErrorCatalogPayload) {
    await updateMutation.mutateAsync({ id, patch });
  }

  const items: ErrorCatalogItem[] = Array.isArray(data?.items) ? data.items : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 pb-3 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-md">
          <AlertTriangle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Xato Katalogi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tipik xatolar / nuqson-sabablari — operator formasidagi defect-dropdown manbai.
            Umumiy yozuv (card_id yo'q) hamma kartaga ko'rinadi.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> Yangi yozuv
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Kod</TableHead>
              <TableHead className="min-w-48">Nomi</TableHead>
              <TableHead className="w-36">Guruh</TableHead>
              <TableHead className="w-28">Jiddiylik</TableHead>
              <TableHead className="w-20 text-center">Tartib</TableHead>
              <TableHead className="w-24 text-center">Karta</TableHead>
              <TableHead className="w-28 text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Xato-katalog bo'sh — "Yangi yozuv" tugmasi orqali birinchi xatoni qo'shing.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <CatalogRow key={row.id} row={row} onSave={handleSave} onDelete={setConfirmId} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Bu ro'yxat <code>DefectDropdown</code> (kunlik-hisobot / ЦКП-fakt / IoT-tablet) "Nima xato/sabab bo'ldi?"
        tanlovini to'ldiradi. Arxivlangan (o'chirilgan) yozuvlar dropdownda ko'rinmaydi, lekin bu yerda
        kulrang holatda saqlanadi (master-data — qattiq o'chirilmaydi).
      </p>

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(payload) => createMutation.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(open) => { if (!open) setConfirmId(null); }}
        title="Yozuvni arxivlash"
        description="Bu xato-katalog yozuvi defect-dropdowndan olib tashlanadi (soft-delete). Davom etilsinmi?"
        confirmText="Arxivlash"
        cancelText="Bekor"
        variant="destructive"
        onConfirm={() => {
          if (confirmId != null) deleteMutation.mutate(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}
