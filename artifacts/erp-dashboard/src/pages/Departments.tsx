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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
}

const EMPTY_FORM = { name: "", name_uz: "", name_ru: "", code: "", description: "", is_active: true };

export default function Departments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editing) {
        return apiRequest("PATCH", `/api/departments/${editing.id}`, data);
      }
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
      toast({ title: msg.includes("employees") ? "Xodimlari bor bo'limni o'chirish mumkin emas" : msg, variant: "destructive" });
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

  const filtered = (Array.isArray(departments) ? departments : []).filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(s) ||
      d.name_uz?.toLowerCase().includes(s) ||
      d.name_ru?.toLowerCase().includes(s) ||
      d.code?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Bo'limlar"
        description="Kompaniya bo'limlari ro'yxati va boshqaruvi"
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Qo'shish
          </Button>
        }
      />

      <div className="px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} ta bo'lim</span>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Kod</TableHead>
                <TableHead>Nomi (UZ)</TableHead>
                <TableHead>Nomi (RU)</TableHead>
                <TableHead className="w-[80px]">Daraja</TableHead>
                <TableHead className="w-[90px]">Holat</TableHead>
                <TableHead className="w-[100px] text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`k-${i}`}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Bo'limlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(filtered) ? filtered : []).map((dept) => (
                  <TableRow key={dept.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">{dept.code || "—"}</TableCell>
                    <TableCell className="font-medium">{dept.name_uz || dept.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dept.name_ru || "—"}</TableCell>
                    <TableCell>
                      {dept.level != null ? (
                        <Badge variant="outline" className="text-xs">{dept.level}-daraja</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={dept.is_active ? "default" : "secondary"} className="text-xs">
                        {dept.is_active ? "Faol" : "Nofaol"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(dept)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(dept.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Bo'limni tahrirlash" : "Yangi bo'lim qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nomi (UZ) *</Label>
                <Input value={form.name_uz} onChange={(e) => setForm((f) => ({ ...f, name_uz: e.target.value, name: e.target.value }))} placeholder="Bo'lim nomi" />
              </div>
              <div className="space-y-1">
                <Label>Nomi (RU)</Label>
                <Input value={form.name_ru} onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))} placeholder="Название отдела" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Kod</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="DEPT-001" className="uppercase" />
            </div>
            <div className="space-y-1">
              <Label>Tavsif</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Qisqacha tavsif" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} id="dept-active" />
              <Label htmlFor="dept-active">Faol</Label>
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
