/**
 * @module ZonesTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
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
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { WarehouseData, ZoneData, ZoneFormData, Lang, Translations, zoneSchema } from "./warehouse-types";
import { useTranslation } from '@/lib/i18n';

interface ZonesTabProps {
  lang: Lang;
  t: Translations;
}

export function ZonesTab({ lang, t }: ZonesTabProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const { data: zones = [], isLoading } = useQuery<ZoneData[]>({
    queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "zones"],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiRequest('GET', `/api/warehouse/warehouses/${selectedWarehouseId}/zones`);
      if (!res.ok) throw new Error("Failed to fetch zones");
      return res.json();
    },
    enabled: !!selectedWarehouseId,
  });

  const form = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { warehouseId: "", code: "", name: "", nameRu: "", zoneType: "storage", capacity: 0, isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: ZoneFormData) => apiRequest("POST", "/api/warehouse/zones", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "zones"] });
      toast({ title: lang === "uz" ? "Zona yaratildi" : "Зона создана" });
      setIsDialogOpen(false);
      form.reset({ warehouseId: selectedWarehouseId, code: "", name: "", nameRu: "", zoneType: "storage", capacity: 0, isActive: true });
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ZoneFormData> }) =>
      apiRequest("PATCH", `/api/warehouse/zones/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "zones"] });
      toast({ title: lang === "uz" ? "Zona yangilandi" : "Зона обновлена" });
      setIsDialogOpen(false);
      setEditingZone(null);
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/warehouse/zones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "zones"] });
      toast({ title: lang === "uz" ? "Zona o'chirildi" : "Зона удалена" });
    },
  });

  const handleEdit = (zone: ZoneData) => {
    setEditingZone(zone);
    form.reset({ warehouseId: zone.warehouseId, code: zone.code, name: zone.name, nameRu: zone.nameRu || "", zoneType: zone.zoneType, capacity: zone.capacity || 0, isActive: zone.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: ZoneFormData) => {
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
          <SelectTrigger className="w-full sm:w-[240px] h-9" data-testid="select-warehouse-zones">
            <SelectValue placeholder={t.selectWarehouse} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(warehouses) ? warehouses : []).map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { form.reset({ warehouseId: selectedWarehouseId, code: "", name: "", nameRu: "", zoneType: "storage", capacity: 0, isActive: true }); setEditingZone(null); setIsDialogOpen(true); }} disabled={!selectedWarehouseId} data-testid="btn-add-zone">
          <Plus className="h-4 w-4 mr-2" />{t.add}
        </Button>
      </div>

      {!selectedWarehouseId ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{lang === "uz" ? "Iltimos, omborni tanlang" : "Пожалуйста, выберите склад"}</p>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[500px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.code}</TableHead>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.zoneType}</TableHead>
                  <TableHead>{t.capacity}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                      {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>)}
                    </TableRow>
                  ))
                ) : zones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{lang === "uz" ? "Zonalar topilmadi" : "Зоны не найдены"}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(zones) ? zones : []).map(zone => (
                    <TableRow key={zone.id} data-testid={`row-zone-${zone.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono">{zone.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{zone.name}</div>
                        {zone.nameRu && <div className="text-xs text-muted-foreground">{zone.nameRu}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.zoneTypes[zone.zoneType as keyof typeof t.zoneTypes] || zone.zoneType}</Badge>
                      </TableCell>
                      <TableCell>{zone.capacity || "-"}</TableCell>
                      <TableCell>
                        <Badge className={zone.isActive ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-gray-500/20 text-muted-foreground border-gray-500/40"}>
                          {zone.isActive ? t.active : t.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(zone)} data-testid={`btn-edit-zone-${zone.id}`}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(zone.id)} data-testid={`btn-delete-zone-${zone.id}`}><Trash2 className="h-4 w-4 text-[var(--ep-red)]" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          </ScrollArea>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{editingZone ? t.editZone : t.createZone}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="warehouseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.selectWarehouse} <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || selectedWarehouseId}>
                    <FormControl><SelectTrigger data-testid="select-zone-warehouse" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(warehouses) ? warehouses : []).map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.code} <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} data-testid="input-zone-code" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="zoneType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.zoneType} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-zone-type" className="h-9"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(t.zoneTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.name} <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input {...field} data-testid="input-zone-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nameRu" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.nameRu}</FormLabel>
                  <FormControl><Input {...field} data-testid="input-zone-name-ru" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.capacity}</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-zone-capacity" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-zone-active" /></FormControl>
                  <FormLabel className="!mt-0">{t.active}</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="btn-cancel-zone">{t.cancel}</Button>
                <Button type="submit" data-testid="btn-save-zone">{t.save}</Button>
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
            <AlertDialogCancel data-testid="btn-cancel-delete-zone">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
