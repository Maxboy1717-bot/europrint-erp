/**
 * @module KanbanStatusColumnMap
 * @description Settings-CRUD for `kanban_status_column_map` — lets an admin
 *   configure (SD sales-order status -> Kanban column) auto-move rules from
 *   inside the ERP instead of raw SQL. The rows created/edited/deleted here
 *   are consumed by an already-working mechanism
 *   (`KanbanCardsRepository.moveOrderCardByStatusMap`, triggered from
 *   `OrderStatusChangedKanbanHandler`) — this page is purely the admin
 *   configuration surface, it does not itself move any cards.
 *   BE: GET/POST/PUT/DELETE /api/kanban/status-column-map(+/columns).
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { tLabel } from "@/lib/i18n/tLabel";
import { SD_ORDER_STATUSES, SD_ORDER_STATUS_LABELS } from "@/lib/sd-order-status";
import { ArrowRightLeft, Plus, Pencil, Trash2 } from "lucide-react";

interface MappingRow {
  id: number;
  sdStatus: string;
  kanbanColumnId: number;
  columnName: string;
  boardId: number;
  boardName: string;
  createdAt: string | null;
}

interface ColumnOption {
  id: number;
  name: string;
  boardId: number;
  boardName: string;
}

const API = "/api/kanban/status-column-map";
const emptyForm = { sdStatus: "", kanbanColumnId: "" };

export default function KanbanStatusColumnMap() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const {
    data: mappingsRaw, isLoading, isError, error, refetch,
  } = useQuery<MappingRow[] | { data?: MappingRow[] }>({
    queryKey: [API],
    queryFn: async () => apiRequest("GET", API),
  });
  const mappings: MappingRow[] = Array.isArray(mappingsRaw) ? mappingsRaw : (mappingsRaw?.data ?? []);

  const { data: columnsRaw, isLoading: columnsLoading } = useQuery<ColumnOption[] | { data?: ColumnOption[] }>({
    queryKey: [`${API}/columns`],
    queryFn: async () => apiRequest("GET", `${API}/columns`),
  });
  const columns: ColumnOption[] = Array.isArray(columnsRaw) ? columnsRaw : (columnsRaw?.data ?? []);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [API] });
    queryClient.invalidateQueries({ queryKey: [`${API}/columns`] });
  };

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (r: MappingRow) => {
    setEditId(r.id);
    setForm({ sdStatus: r.sdStatus, kanbanColumnId: String(r.kanbanColumnId) });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId === null) {
        return apiRequest("POST", API, {
          sdStatus: form.sdStatus,
          kanbanColumnId: Number(form.kanbanColumnId),
        });
      }
      return apiRequest("PUT", `${API}/${editId}`, {
        kanbanColumnId: Number(form.kanbanColumnId),
      });
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast({ title: tLabel("common.saqlandi", "Saqlandi") });
    },
    onError: (e: unknown) => toast({
      title: "Xatolik",
      description: e instanceof Error ? e.message : tLabel("common.saqlanmadi", "Saqlanmadi"),
      variant: "destructive",
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `${API}/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: tLabel("common.ochirildi", "O'chirildi") });
    },
    onError: () => {
      toast({ title: "Xatolik", description: tLabel("common.ochirilmadi", "O'chirilmadi"), variant: "destructive" });
      setDeleteId(null);
    },
  });

  if (isError) return <EPErrorState onRetry={refetch} error={error} />;

  const mappedStatuses = new Set(mappings.map(m => m.sdStatus));
  const availableStatuses = SD_ORDER_STATUSES.filter(
    s => editId !== null || !mappedStatuses.has(s),
  );
  const canSave = form.sdStatus.trim().length > 0 && form.kanbanColumnId.trim().length > 0;

  return (
    <ModulePage
      module="admin"
      title="Holat -> Kanban Ustun Xaritasi"
      subtitle="Buyurtma holati o'zgarganda karta qaysi ustunga avtomatik ko'chishini sozlash"
      icon={<ArrowRightLeft className="h-5 w-5" />}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-mapping" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> {tLabel("common.yangiXarita", "Yangi xarita")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editId === null
                  ? tLabel("common.yangiXaritaQatori", "Yangi xarita qatori")
                  : tLabel("common.xaritaTahrir", "Xarita qatorini tahrirlash")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <Label>{tLabel("common.sdHolati", "SD buyurtma holati")} *</Label>
                <Select
                  value={form.sdStatus}
                  onValueChange={v => setForm(f => ({ ...f, sdStatus: v }))}
                  disabled={editId !== null}
                >
                  <SelectTrigger data-testid="select-sd-status">
                    <SelectValue placeholder={tLabel("common.holatniTanlang", "Holatni tanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map(s => (
                      <SelectItem key={s} value={s}>{SD_ORDER_STATUS_LABELS[s]} ({s})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{tLabel("common.kanbanUstuni", "Kanban ustuni")} *</Label>
                <Select
                  value={form.kanbanColumnId}
                  onValueChange={v => setForm(f => ({ ...f, kanbanColumnId: v }))}
                  disabled={columnsLoading}
                >
                  <SelectTrigger data-testid="select-kanban-column">
                    <SelectValue placeholder={tLabel("common.ustunniTanlang", "Ustunni tanlang")} />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.boardName} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{tLabel("common.bekor", "Bekor")}</Button>
              <Button
                data-testid="button-save-mapping"
                disabled={!canSave || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {tLabel("common.saqlash", "Saqlash")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : mappings.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {tLabel("common.xaritaYoq", "Xarita qatorlari yo'q. \"Yangi xarita\" bilan qo'shing.")}
          </p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tLabel("common.sdHolati", "SD buyurtma holati")}</TableHead>
                  <TableHead>{tLabel("common.doska", "Doska")}</TableHead>
                  <TableHead>{tLabel("common.ustun", "Ustun")}</TableHead>
                  <TableHead className="text-right">{tLabel("common.amal", "Amal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map(r => (
                  <TableRow key={r.id} data-testid={`row-mapping-${r.id}`}>
                    <TableCell className="font-medium">
                      {SD_ORDER_STATUS_LABELS[r.sdStatus as keyof typeof SD_ORDER_STATUS_LABELS] ?? r.sdStatus}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{r.sdStatus}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.boardName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.columnName}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" data-testid={`edit-${r.id}`} onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        data-testid={`delete-${r.id}`} onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent data-testid="dialog-confirm-delete-mapping">
          <AlertDialogHeader>
            <AlertDialogTitle>{tLabel("common.ochirishniTasdiqlash", "O'chirishni tasdiqlang")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tLabel("common.xaritaOchirishTasdiq", "Bu xarita qatorini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tLabel("common.bekor", "Bekor")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-mapping"
              onClick={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); }}
            >
              {tLabel("common.ochirish", "O'chirish")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
