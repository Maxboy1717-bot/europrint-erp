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
import { Grid3X3, Plus, Pencil, Trash2, Eye, Package, AlertTriangle, Clock } from "lucide-react";
import { WarehouseData, ZoneData, BinData, BinFormData, Lang, Translations, binSchema } from "./warehouse-types";

interface BinsTabProps {
  lang: Lang;
  t: Translations;
}

interface Bin360Data {
  bin: {
    id: string;
    binCode: string;
    fullAddress: string;
    warehouseName: string;
    zoneName: string;
    binType: string;
  };
  capacity: {
    maxWeight: number | null;
    maxVolume: number | null;
    currentOccupancy: number;
    occupancyStatus: string;
  };
  currentMaterials: {
    count: number;
    totalStockValue: number;
    items: Array<{ id: string; kod: string; xomAshyo: string; currentStock: number; unitOfMeasure: string; expiryDate?: string; stockValue: number }>;
  };
  expiryAlerts: {
    count: number;
    expired: number;
    expiringSoon: number;
    items: Array<{ materialName: string; expiryDate?: string; daysUntilExpiry: number | null; quantity: number; unit: string; isExpired: boolean }>;
  };
  recentMovements: {
    count: number;
    items: Array<{ transactionType: string; quantity: number; transactionDate: string; materialName: string }>;
  };
}

export function BinsTab({ lang, t }: BinsTabProps) {
  const { toast } = useToast();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<BinData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing360BinId, setViewing360BinId] = useState<string | null>(null);

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const { data: zones = [] } = useQuery<ZoneData[]>({
    queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "zones"],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await fetch(`/api/warehouse/warehouses/${selectedWarehouseId}/zones`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch zones");
      return res.json();
    },
    enabled: !!selectedWarehouseId,
  });

  const { data: bins = [], isLoading } = useQuery<BinData[]>({
    queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await fetch(`/api/warehouse/warehouses/${selectedWarehouseId}/bins`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bins");
      return res.json();
    },
    enabled: !!selectedWarehouseId,
  });

  const { data: bin360Data, isLoading: is360Loading } = useQuery<Bin360Data>({
    queryKey: ["/api/warehouse/bins", viewing360BinId, "360"],
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/bins/${viewing360BinId}/360`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bin 360");
      return res.json();
    },
    enabled: !!viewing360BinId,
  });

  const form = useForm<BinFormData>({
    resolver: zodResolver(binSchema),
    defaultValues: { warehouseId: "", zoneId: "", binCode: "", row: "", shelf: "", level: "", binType: "standard", maxWeight: 0, maxVolume: 0, isActive: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: BinFormData) => apiRequest("POST", "/api/warehouse/bins", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"] });
      toast({ title: lang === "uz" ? "Bin yaratildi" : "Ячейка создана" });
      setIsDialogOpen(false);
      form.reset({ warehouseId: selectedWarehouseId, zoneId: "", binCode: "", row: "", shelf: "", level: "", binType: "standard", maxWeight: 0, maxVolume: 0, isActive: true });
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BinFormData> }) =>
      apiRequest("PATCH", `/api/warehouse/bins/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"] });
      toast({ title: lang === "uz" ? "Bin yangilandi" : "Ячейка обновлена" });
      setIsDialogOpen(false);
      setEditingBin(null);
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/warehouse/bins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", selectedWarehouseId, "bins"] });
      toast({ title: lang === "uz" ? "Bin o'chirildi" : "Ячейка удалена" });
    },
  });

  const handleEdit = (bin: BinData) => {
    setEditingBin(bin);
    form.reset({ warehouseId: bin.warehouseId, zoneId: bin.zoneId, binCode: bin.binCode, row: bin.row || "", shelf: bin.shelf || "", level: bin.level || "", binType: bin.binType, maxWeight: bin.maxWeight || 0, maxVolume: bin.maxVolume || 0, isActive: bin.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: BinFormData) => {
    if (editingBin) {
      updateMutation.mutate({ id: editingBin.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredBins = useMemo(() => {
    if (!selectedZoneId) return bins;
    return (Array.isArray(bins) ? bins : []).filter(bin => bin.zoneId === selectedZoneId);
  }, [bins, selectedZoneId]);

  return (
    <>
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedWarehouseId} onValueChange={v => { setSelectedWarehouseId(v); setSelectedZoneId(""); }}>
          <SelectTrigger className="w-[200px]" data-testid="select-warehouse-bins"><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
          <SelectContent>{(Array.isArray(warehouses) ? warehouses : []).map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedZoneId || "__all__"} onValueChange={v => setSelectedZoneId(v === "__all__" ? "" : v)} disabled={!selectedWarehouseId}>
          <SelectTrigger className="w-[200px]" data-testid="select-zone-bins"><SelectValue placeholder={t.selectZone} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t.allZones}</SelectItem>
            {(Array.isArray(zones) ? zones : []).map(zone => <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={() => { form.reset({ warehouseId: selectedWarehouseId, zoneId: "", binCode: "", row: "", shelf: "", level: "", binType: "standard", maxWeight: 0, maxVolume: 0, isActive: true }); setEditingBin(null); setIsDialogOpen(true); }} disabled={!selectedWarehouseId} data-testid="btn-add-bin">
          <Plus className="h-4 w-4 mr-2" />{t.add}
        </Button>
      </div>

      {!selectedWarehouseId ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{lang === "uz" ? "Iltimos, omborni tanlang" : "Пожалуйста, выберите склад"}</p>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.binCode}</TableHead>
                  <TableHead>{t.row}</TableHead>
                  <TableHead>{t.shelf}</TableHead>
                  <TableHead>{t.level}</TableHead>
                  <TableHead>{t.binType}</TableHead>
                  <TableHead>{t.maxWeight}</TableHead>
                  <TableHead>{t.maxVolume}</TableHead>
                  <TableHead>{t.occupancy}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`k-${i}`}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-12" /></TableCell>)}</TableRow>
                  ))
                ) : filteredBins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Grid3X3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{lang === "uz" ? "Binlar topilmadi" : "Ячейки не найдены"}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(filteredBins) ? filteredBins : []).map(bin => (
                    <TableRow key={bin.id} data-testid={`row-bin-${bin.id}`}>
                      <TableCell className="font-mono font-medium">{bin.binCode}</TableCell>
                      <TableCell>{bin.row || "-"}</TableCell>
                      <TableCell>{bin.shelf || "-"}</TableCell>
                      <TableCell>{bin.level || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{t.binTypes[bin.binType as keyof typeof t.binTypes] || bin.binType}</Badge></TableCell>
                      <TableCell>{bin.maxWeight || "-"}</TableCell>
                      <TableCell>{bin.maxVolume || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{ width: `${bin.currentOccupancy || 0}%` }} />
                          </div>
                          <span className="text-sm">{bin.currentOccupancy || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" title="360° Ko'rinish" onClick={() => setViewing360BinId(bin.id)} data-testid={`btn-360-bin-${bin.id}`}><Eye className="h-4 w-4 text-blue-500" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(bin)} data-testid={`btn-edit-bin-${bin.id}`}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(bin.id)} data-testid={`btn-delete-bin-${bin.id}`}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBin ? t.editBin : t.createBin}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="warehouseId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.selectWarehouse} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={v => { field.onChange(v); form.setValue("zoneId", ""); }} defaultValue={field.value || selectedWarehouseId}>
                      <FormControl><SelectTrigger data-testid="select-bin-warehouse"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{(Array.isArray(warehouses) ? warehouses : []).map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="zoneId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.selectZone} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-bin-zone"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{(Array.isArray(zones) ? zones : []).map(zone => <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="binCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.binCode} <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} placeholder="A-01-001" data-testid="input-bin-code" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="binType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.binType} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-bin-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{Object.entries(t.binTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="row" render={({ field }) => (
                  <FormItem><FormLabel>{t.row}</FormLabel><FormControl><Input {...field} data-testid="input-bin-row" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="shelf" render={({ field }) => (
                  <FormItem><FormLabel>{t.shelf}</FormLabel><FormControl><Input {...field} data-testid="input-bin-shelf" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="level" render={({ field }) => (
                  <FormItem><FormLabel>{t.level}</FormLabel><FormControl><Input {...field} data-testid="input-bin-level" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="maxWeight" render={({ field }) => (
                  <FormItem><FormLabel>{t.maxWeight}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-bin-max-weight" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="maxVolume" render={({ field }) => (
                  <FormItem><FormLabel>{t.maxVolume}</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-bin-max-volume" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-bin-active" /></FormControl>
                  <FormLabel className="!mt-0">{t.active}</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="btn-cancel-bin">{t.cancel}</Button>
                <Button type="submit" data-testid="btn-save-bin">{t.save}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
            <AlertDialogDescription>{lang === "uz" ? "Bu amalni bekor qilib bo'lmaydi." : "Это действие нельзя отменить."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete-bin">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewing360BinId} onOpenChange={open => { if (!open) setViewing360BinId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              {lang === "uz" ? "Bin 360° Ko'rinish" : "360° Обзор ячейки"}
              {bin360Data && <Badge variant="outline" className="ml-2 font-mono">{bin360Data.bin.binCode}</Badge>}
            </DialogTitle>
            {bin360Data && <p className="text-sm text-muted-foreground mt-1">{bin360Data.bin.fullAddress}</p>}
          </DialogHeader>

          {is360Loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`k-${i}`} className="h-16 w-full" />)}
            </div>
          ) : bin360Data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Materiallar soni" : "Кол-во материалов"}</p>
                  <p className="text-2xl font-bold">{bin360Data.currentMaterials.count}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Ombor qiymati" : "Стоимость"}</p>
                  <p className="text-2xl font-bold">{Number(bin360Data.currentMaterials.totalStockValue).toLocaleString()} so'm</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Band bo'lish" : "Заполненность"}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{bin360Data.capacity.currentOccupancy}%</p>
                    <Badge variant={bin360Data.capacity.occupancyStatus === "critical" ? "destructive" : "outline"} className="text-xs">
                      {bin360Data.capacity.occupancyStatus}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{lang === "uz" ? "Muddati o'tayotgan" : "Истекающие"}</p>
                  <p className={`text-2xl font-bold ${bin360Data.expiryAlerts.count > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {bin360Data.expiryAlerts.count}
                    {bin360Data.expiryAlerts.expired > 0 && <span className="text-red-600 ml-1 text-sm">({bin360Data.expiryAlerts.expired} muddati o'tgan)</span>}
                  </p>
                </div>
              </div>

              {bin360Data.expiryAlerts.count > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    {lang === "uz" ? "Muddati yaqin/o'tgan materiallar (FEFO)" : "Материалы с истекающим сроком (FEFO)"}
                  </h3>
                  <div className="space-y-1">
                    {bin360Data.expiryAlerts.items.slice(0, 5).map((a, i) => (
                      <div key={`k-${i}`} className={`flex items-center justify-between p-2 rounded text-sm border ${a.isExpired ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
                        <span className="truncate">{a.materialName}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs text-muted-foreground">{a.expiryDate}</span>
                          <Badge variant={a.isExpired ? "destructive" : "secondary"} className="text-xs">
                            {a.isExpired ? "Muddati o'tgan" : `${a.daysUntilExpiry} kun`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bin360Data.currentMaterials.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Package className="h-4 w-4 text-blue-500" />
                    {lang === "uz" ? "Joriy materiallar (FEFO tartibida)" : "Текущие материалы (порядок FEFO)"}
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {bin360Data.currentMaterials.items.slice(0, 10).map((m, i) => (
                      <div key={m.id || i} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div className="min-w-0">
                          <span className="font-mono text-xs text-muted-foreground">{m.kod}</span>
                          <p className="truncate">{m.xomAshyo}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-medium">{Number(m.currentStock).toLocaleString()} {m.unitOfMeasure}</p>
                          {m.expiryDate && <p className="text-xs text-muted-foreground">Muddat: {m.expiryDate}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bin360Data.recentMovements.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {lang === "uz" ? "So'nggi harakatlar" : "Последние движения"}
                  </h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {bin360Data.recentMovements.items.slice(0, 5).map((m, i) => (
                      <div key={`k-${i}`} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={m.transactionType === "kirim" ? "default" : "secondary"} className="text-xs">
                            {m.transactionType}
                          </Badge>
                          <span className="truncate">{m.materialName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{m.transactionDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
