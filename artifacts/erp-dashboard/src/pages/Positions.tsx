import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil, Trash2, Briefcase } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Position {
  id: string;
  code: string | null;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  department_id: string | null;
  level: number | null;
  rbac_tier: string | null;
  is_management: boolean;
  min_salary: number | null;
  max_salary: number | null;
  headcount: number | null;
  is_active: boolean;
  description: string | null;
  official_title: string | null;
}

interface Department {
  id: string;
  name: string;
  name_uz: string | null;
}

const EMPTY_FORM = {
  name: "", name_uz: "", name_ru: "", code: "", official_title: "",
  department_id: "", level: 1, is_management: false, is_active: true,
  headcount: 1, min_salary: "", max_salary: "", description: "",
};

const RBAC_TIERS: Record<string, string> = {
  owner: "Egasi", director: "Direktor", manager: "Menejer",
  specialist: "Mutaxassis", employee: "Xodim",
};

export default function Positions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: positions = [], isLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        level: Number(data.level) || 1,
        headcount: Number(data.headcount) || 1,
        min_salary: data.min_salary ? Number(data.min_salary) : null,
        max_salary: data.max_salary ? Number(data.max_salary) : null,
        department_id: data.department_id || null,
        name: data.name_uz || data.name,
      };
      if (editing) return apiRequest("PATCH", `/api/positions/${editing.id}`, payload);
      return apiRequest("POST", "/api/positions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: editing ? "Lavozim yangilandi" : "Lavozim qo'shildi" });
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({ title: "Lavozim o'chirildi" });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      const msg = err?.message || "O'chirishda xatolik";
      toast({ title: msg.includes("employees") ? "Xodimlari bor lavozimni o'chirish mumkin emas" : msg, variant: "destructive" });
      setDeleteId(null);
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (pos: Position) => {
    setEditing(pos);
    setForm({
      name: pos.name || "",
      name_uz: pos.name_uz || pos.name || "",
      name_ru: pos.name_ru || "",
      code: pos.code || "",
      official_title: pos.official_title || "",
      department_id: pos.department_id || "",
      level: pos.level || 1,
      is_management: pos.is_management,
      is_active: pos.is_active,
      headcount: pos.headcount || 1,
      min_salary: pos.min_salary != null ? String(pos.min_salary) : "",
      max_salary: pos.max_salary != null ? String(pos.max_salary) : "",
      description: pos.description || "",
    });
    setDialogOpen(true);
  };

  const getDeptName = (id: string | null) => {
    if (!id) return "—";
    const d = (Array.isArray(departments) ? departments : []).find((d) => d.id === id);
    return d?.name_uz || d?.name || "—";
  };

  const filtered = (Array.isArray(positions) ? positions : []).filter((p) => {
    if (deptFilter !== "all" && p.department_id !== deptFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.name_uz?.toLowerCase().includes(s) ||
      p.name_ru?.toLowerCase().includes(s) ||
      p.code?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Lavozimlar"
        description="Kompaniya lavozimlari ro'yxati va boshqaruvi"
        icon={<Briefcase className="h-5 w-5" />}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Qo'shish
          </Button>
        }
      />

      <div className="px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Barcha bo'limlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha bo'limlar</SelectItem>
            {(Array.isArray(departments) ? departments : []).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name_uz || d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} ta lavozim</span>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Kod</TableHead>
                <TableHead>Lavozim nomi</TableHead>
                <TableHead>Bo'lim</TableHead>
                <TableHead className="w-[90px]">Daraja</TableHead>
                <TableHead className="w-[90px]">Shtат</TableHead>
                <TableHead className="w-[90px]">Holat</TableHead>
                <TableHead className="w-[100px] text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`k-${i}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Lavozimlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(filtered) ? filtered : []).map((pos) => (
                  <TableRow key={pos.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">{pos.code || "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{pos.name_uz || pos.name}</div>
                      {pos.name_ru && <div className="text-xs text-muted-foreground">{pos.name_ru}</div>}
                      {pos.is_management && (
                        <Badge variant="outline" className="text-xs mt-0.5">Boshqaruv</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getDeptName(pos.department_id)}</TableCell>
                    <TableCell>
                      {pos.level != null ? (
                        <Badge variant="outline" className="text-xs">{pos.level}-daraja</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{pos.headcount ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={pos.is_active ? "default" : "secondary"} className="text-xs">
                        {pos.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(pos)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(pos.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Lavozimni tahrirlash" : "Yangi lavozim qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nomi (UZ) *</Label>
                <Input value={form.name_uz} onChange={(e) => setForm((f) => ({ ...f, name_uz: e.target.value, name: e.target.value }))} placeholder="Lavozim nomi" />
              </div>
              <div className="space-y-1">
                <Label>Nomi (RU)</Label>
                <Input value={form.name_ru} onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))} placeholder="Название должности" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kod</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="POS-001" />
              </div>
              <div className="space-y-1">
                <Label>Daraja</Label>
                <Input type="number" min={1} max={10} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Bo'lim</Label>
              <Select value={form.department_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, department_id: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Bo'limni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Bo'limsiz —</SelectItem>
                  {(Array.isArray(departments) ? departments : []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name_uz || d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Min oylik (so'm)</Label>
                <Input type="number" value={form.min_salary} onChange={(e) => setForm((f) => ({ ...f, min_salary: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Max oylik (so'm)</Label>
                <Input type="number" value={form.max_salary} onChange={(e) => setForm((f) => ({ ...f, max_salary: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Shtat soni</Label>
              <Input type="number" min={1} value={form.headcount} onChange={(e) => setForm((f) => ({ ...f, headcount: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_management} onCheckedChange={(v) => setForm((f) => ({ ...f, is_management: v }))} id="pos-mgmt" />
                <Label htmlFor="pos-mgmt">Boshqaruv lavozimi</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} id="pos-active" />
                <Label htmlFor="pos-active">Faol</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name_uz || saveMutation.isPending}>
              {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Lavozimni o'chirish"
        description="Ushbu lavozimni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
      />
    </div>
  );
}
