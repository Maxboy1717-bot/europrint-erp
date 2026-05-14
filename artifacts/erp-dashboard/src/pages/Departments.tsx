/**
 * @module Departments
 * @description Bo'limlar boshqaruvi sahifasi.
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader> for the breadcrumb + title + actions strip
 *     - 4-tile <EPKpiCard> row at the top (animated count-up + module hue)
 *     - <EPCard> for the table frame
 *     - <EPStatusPill> for Faol / Nofaol chips
 *     - <EPEmptyState>, <EPErrorState>, <EPSkeletonTable> for the three
 *       data-state branches
 *     - Hover-lift on table rows + fade-up stagger on KPI tiles
 *     - Uzbek sentence-case CTAs ("Yangi bo'lim qo'shish", not "Qo'shish")
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Search, Pencil, Trash2, Building2,
  CheckCircle2, MinusCircle, Layers,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  EPPageHeader, EPCard, EPKpiCard, EPStatusPill,
  EPEmptyState, EPErrorState, EPSkeletonKpiRow, EPSkeletonTable,
} from "@/components/ep";

interface Department {
  id: string;
  code: string | null;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  level: number | null;
  sort_order: number | null;
  is_active: boolean;
  description: string | null;
  color: string | null;
  created_at?: string;
}

const EMPTY_FORM = {
  name: "", name_uz: "", name_ru: "", code: "", description: "", is_active: true,
};

export default function Departments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: departments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editing) return apiRequest("PATCH", `/api/departments/${editing.id}`, data);
      return apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: editing ? "Bo'lim yangilandi" : "Bo'lim qo'shildi" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Bo'lim o'chirildi" });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      const msg = err?.message || "O'chirishda xatolik";
      toast({
        title: msg.includes("employees") ? "Xodimlari bor bo'limni o'chirish mumkin emas" : msg,
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name || "",
      name_uz: dept.name_uz || "",
      name_ru: dept.name_ru || "",
      code: dept.code || "",
      description: dept.description || "",
      is_active: dept.is_active,
    });
    setDialogOpen(true);
  };

  // ─── Derived data ──────────────────────────────────────────────────────
  const list = Array.isArray(departments) ? departments : [];

  const stats = useMemo(() => {
    const active = list.filter((d) => d.is_active).length;
    const inactive = list.length - active;
    // "Yangi bu oy" — bo'limlar yaratilgan oxirgi 30 kun ichida
    const month = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newThisMonth = list.filter(
      (d) => d.created_at && new Date(d.created_at).getTime() > month,
    ).length;
    const levels = new Set(list.map((d) => d.level).filter((l) => l != null)).size;
    return { total: list.length, active, inactive, newThisMonth, levels };
  }, [list]);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((d) =>
      d.name?.toLowerCase().includes(s) ||
      d.name_uz?.toLowerCase().includes(s) ||
      d.name_ru?.toLowerCase().includes(s) ||
      d.code?.toLowerCase().includes(s),
    );
  }, [list, search]);

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>Dashboard · HR · <b className="text-foreground">Bo'limlar</b></>}
        title="Bo'limlar"
        subtitle="Kompaniya bo'limlari ro'yxati va boshqaruvi"
        actions={
          <Button onClick={openAdd} className="ep-btn-primary-shimmer gap-1.5">
            <Plus className="h-4 w-4" />
            Yangi bo'lim qo'shish
          </Button>
        }
      />

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <EPSkeletonKpiRow count={4} />
      ) : !isError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <EPKpiCard
            label="Jami bo'limlar"
            value={stats.total}
            icon={Building2}
            iconBg="hr"
            enterDelayMs={0}
          />
          <EPKpiCard
            label="Faol"
            value={stats.active}
            icon={CheckCircle2}
            iconBg="var(--ep-green)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label="Nofaol"
            value={stats.inactive}
            icon={MinusCircle}
            iconBg="var(--ep-muted)"
            enterDelayMs={120}
          />
          <EPKpiCard
            label="Darajalar"
            value={stats.levels}
            icon={Layers}
            iconBg="var(--ep-blue)"
            enterDelayMs={180}
          />
        </div>
      )}

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Input
            placeholder="Bo'lim nomini qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <span className="ep-caption">{filtered.length} ta bo'lim</span>
      </div>

      {/* ── Table / states ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {isError ? (
          <EPErrorState onRetry={() => refetch()} />
        ) : isLoading ? (
          <EPSkeletonTable rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <EPEmptyState
            icon={Building2}
            title={search ? "Hech narsa topilmadi" : "Hali bo'lim yo'q"}
            description={
              search
                ? "Boshqa qidiruv so'zini sinab ko'ring yoki filterni tozalang."
                : "Birinchi bo'limni qo'shing — xodimlar va lavozimlar shu yerga biriktiriladi."
            }
            action={
              !search && (
                <Button onClick={openAdd} className="ep-btn-primary-shimmer gap-1.5">
                  <Plus className="h-4 w-4" />
                  Yangi bo'lim qo'shish
                </Button>
              )
            }
          />
        ) : (
          <EPCard padding={0} className="overflow-hidden">
            <div className="ep-table-scroll">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/40 transition-colors">
                  <TableHead className="w-[80px] ep-eyebrow">Kod</TableHead>
                  <TableHead className="ep-eyebrow">Nomi (UZ)</TableHead>
                  <TableHead className="ep-eyebrow">Nomi (RU)</TableHead>
                  <TableHead className="w-[90px] ep-eyebrow">Daraja</TableHead>
                  <TableHead className="w-[100px] ep-eyebrow">Holat</TableHead>
                  <TableHead className="w-[100px] text-right ep-eyebrow">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dept, i) => (
                  <TableRow
                    key={dept.id}
                    className="group ep-fade-up border-border transition-colors hover:bg-muted/40"
                    style={{
                      animationDelay: `${Math.min(i, 20) * 30}ms`,
                      animationDuration: "0.4s",
                    }}
                  >
                    <TableCell className="ep-mono text-muted-foreground">
                      {dept.code || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {dept.name_uz || dept.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dept.name_ru || "—"}
                    </TableCell>
                    <TableCell>
                      {dept.level != null ? (
                        <EPStatusPill tone="neutral" hideDot>
                          {dept.level}-daraja
                        </EPStatusPill>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <EPStatusPill tone={dept.is_active ? "success" : "neutral"}>
                        {dept.is_active ? "Faol" : "Nofaol"}
                      </EPStatusPill>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(dept)}
                          aria-label="Tahrirlash"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          style={{ color: "var(--ep-red)" }}
                          onClick={() => setDeleteId(dept.id)}
                          aria-label="O'chirish"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </EPCard>
        )}
      </div>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold"> {editing ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="ep-label">Nomi (UZ) *</Label>
                <Input
                  value={form.name_uz}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name_uz: e.target.value, name: e.target.value }))
                  }
                  placeholder="Bo'lim nomi"
                />
              </div>
              <div className="space-y-1">
                <Label className="ep-label">Nomi (RU)</Label>
                <Input
                  value={form.name_ru}
                  onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))}
                  placeholder="Название отдела"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="ep-label">Kod</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="DEPT-001"
                className="uppercase ep-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="ep-label">Tavsif</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Qisqacha tavsif"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                id="dept-active"
              />
              <Label htmlFor="dept-active" className="ep-label">Faol</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name_uz || saveMutation.isPending}
              className="ep-btn-primary-shimmer"
            >
              {saveMutation.isPending ? "Saqlanmoqda..." : editing ? "O'zgarishlarni saqlash" : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Bo'limni o'chirish"
        description="Ushbu bo'limni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />
    </div>
  );
}
