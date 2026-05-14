/**
 * @module WarehousesTab
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Warehouse, Plus, Pencil, Trash2, Search } from "lucide-react";
import { WarehouseData, WarehouseFormData, Lang, Translations, warehouseSchema } from "./warehouse-types";

interface WarehousesTabProps {
  lang: Lang;
  t: Translations;
}

export function WarehousesTab({ lang, t }: WarehousesTabProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: warehouses = [], isLoading } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: { code: "", name: "", nameRu: "", type: "main", location: "", isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: WarehouseFormData) => apiRequest("POST", "/api/warehouse/warehouses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses"] });
      toast({ title: lang === "uz" ? "Ombor yaratildi" : "Склад создан" });
      setIsDialogOpen(false);
      form.reset({ code: "", name: "", nameRu: "", type: "main", location: "", isActive: true });
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarehouseFormData> }) =>
      apiRequest("PATCH", `/api/warehouse/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses"] });
      toast({ title: lang === "uz" ? "Ombor yangilandi" : "Склад обновлён" });
      setIsDialogOpen(false);
      setEditingWarehouse(null);
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/warehouse/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses"] });
      toast({ title: lang === "uz" ? "Ombor o'chirildi" : "Склад удалён" });
    },
  });

  const handleEdit = (wh: WarehouseData) => {
    setEditingWarehouse(wh);
    form.reset({ code: wh.code, name: wh.name, nameRu: wh.nameRu || "", type: wh.type, location: wh.location || "", isActive: wh.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: WarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = useMemo(() => (Array.isArray(warehouses) ? warehouses : []).filter(wh => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return wh.code.toLowerCase().includes(q) || wh.name.toLowerCase().includes(q) ||
      (wh.nameRu && wh.nameRu.toLowerCase().includes(q)) || (wh.location && wh.location.toLowerCase().includes(q));
  }), [warehouses, searchQuery]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-warehouses" />
        </div>
        <Button onClick={() => { form.reset({ code: "", name: "", nameRu: "", type: "main", location: "", isActive: true }); setEditingWarehouse(null); setIsDialogOpen(true); }} data-testid="btn-add-warehouse">
          <Plus className="h-4 w-4 mr-2" />{t.add}
        </Button>
      </div>

      <Card>
        <ScrollArea className="h-[500px]">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.code}</TableHead>
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.type}</TableHead>
                <TableHead>{t.location}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                    {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Warehouse className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{lang === "uz" ? "Omborlar topilmadi" : "Склады не найдены"}</p>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(filtered) ? filtered : []).map(wh => (
                  <TableRow key={wh.id} data-testid={`row-warehouse-${wh.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono">{wh.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{wh.name}</div>
                      {wh.nameRu && <div className="text-xs text-muted-foreground">{wh.nameRu}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.warehouseTypes[wh.type as keyof typeof t.warehouseTypes] || wh.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{wh.location || "-"}</TableCell>
                    <TableCell>
                      <Badge className={wh.isActive ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-gray-500/20 text-muted-foreground border-gray-500/40"}>
                        {wh.isActive ? t.active : t.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(wh)} data-testid={`btn-edit-warehouse-${wh.id}`}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(wh.id)} data-testid={`btn-delete-warehouse-${wh.id}`}><Trash2 className="h-4 w-4 text-[var(--ep-red)]" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </ScrollArea>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{editingWarehouse ? t.editWarehouse : t.createWarehouse}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.code} <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} data-testid="input-warehouse-code" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.type} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-warehouse-type" className="h-9"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(t.warehouseTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.name} <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} data-testid="input-warehouse-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nameRu" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.nameRu}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-warehouse-name-ru" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.location}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-warehouse-location" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-warehouse-active" /></FormControl>
                  <FormLabel className="!mt-0">{t.active}</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="btn-cancel-warehouse">{t.cancel}</Button>
                <Button type="submit" data-testid="btn-save-warehouse">{t.save}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>{lang === "uz" ? "Bu amalni bekor qilib bo'lmaydi." : "Это действие нельзя отменить."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete-warehouse">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
              data-testid="btn-confirm-delete-warehouse"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
