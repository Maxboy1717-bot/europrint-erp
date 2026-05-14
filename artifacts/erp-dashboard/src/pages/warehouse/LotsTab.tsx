/**
 * @module LotsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Clock, Package, Layers, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WarehouseData, Lang, Translations } from "./warehouse-types";
import { apiRequest } from '@/lib/queryClient';

interface LotRow {
  id: number;
  lot_number: string;
  batch_number: string;
  material_name: string;
  material_code: string;
  quantity: number;
  available_quantity: number;
  unit: string;
  status: string;
  received_date: string;
  expiry_date: string | null;
  age_days: number | null;
  days_until_expiry: number | null;
  bin_code: string | null;
  bin_row: string | null;
  bin_shelf: string | null;
  defect_reason: string | null;
  quarantine_reason: string | null;
  serial_number: string | null;
}

interface LotsResponse {
  data: LotRow[];
  total: number;
  fifoWarnings: number;
  expiryWarnings: number;
}

const STATUS_CONF: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  approved:     { label: "Tasdiqlangan", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" },
  pending:      { label: "Tekshiruvda",  icon: AlertCircle,  cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" },
  quarantine:   { label: "Karantin",     icon: AlertTriangle, cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200" },
  rejected:     { label: "Rad etilgan",  icon: XCircle,      cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200" },
  defective:    { label: "Brakli",       icon: XCircle,      cls: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" },
};

interface LotsTabProps { lang: Lang; t: Translations }

export function LotsTab({lang, t }: LotsTabProps) {
  const { toast } = useToast();
  const [warehouseId, setWarehouseId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editLot, setEditLot] = useState<LotRow | null>(null);
  const [editForm, setEditForm] = useState({ quality_status: "", defect_reason: "", quarantine_reason: "" });

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({ queryKey: ["/api/warehouse/warehouses"] });

  const { data: lotsData, isLoading } = useQuery<LotsResponse>({
    queryKey: ["/api/warehouse/warehouses", warehouseId, "lots", statusFilter],
    queryFn: async () => {
      if (!warehouseId) return { data: [], total: 0, fifoWarnings: 0, expiryWarnings: 0 };
      const url = `/api/warehouse/warehouses/${warehouseId}/lots${statusFilter ? `?status=${statusFilter}` : ""}`;
      return await apiRequest<LotsResponse>('GET', url);
    },
    enabled: !!warehouseId,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editLot) return;
      return await apiRequest('PATCH', `/api/warehouse/warehouses/${warehouseId}/lots/${editLot.id}`, editForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/warehouses", warehouseId, "lots"] });
      toast({ title: "Lot yangilandi" });
      setEditLot(null);
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const lots = lotsData?.data ?? [];
  const fifoWarnings = lotsData?.fifoWarnings ?? 0;
  const expiryWarnings = lotsData?.expiryWarnings ?? 0;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger className="w-full sm:w-[220px] h-9">
            <SelectValue placeholder={t("omborTanlang")} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
              <SelectItem key={wh.id} value={String(wh.id)}>{wh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9">
            <SelectValue placeholder={t("barchaStatuslar")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("Barchasi")}</SelectItem>
            <SelectItem value="approved">{t("approved")}</SelectItem>
            <SelectItem value="pending">{t("tekshiruvda")}</SelectItem>
            <SelectItem value="quarantine">{t("karantin")}</SelectItem>
            <SelectItem value="rejected">{t("rejected")}</SelectItem>
            <SelectItem value="defective">{t("brakli")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {warehouseId && (fifoWarnings > 0 || expiryWarnings > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fifoWarnings > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-[var(--ep-yellow)] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--ep-yellow)] dark:text-amber-400">{t("fifoOgohlantirish")}</p>
                <p className="text-xs text-[var(--ep-yellow)] dark:text-amber-500">{fifoWarnings} ta lot 30+ kun eski</p>
              </div>
            </div>
          )}
          {expiryWarnings > 0 && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3 flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-[var(--ep-red)] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--ep-red)] dark:text-rose-400">{t("muddatiTugayapti")}</p>
                <p className="text-xs text-[var(--ep-red)] dark:text-rose-500">{expiryWarnings} ta lot 30 kun ichida</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!warehouseId ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("iltimosOmborniTanlang")}</p>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[520px]">
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("lot2")}</TableHead>
                  <TableHead>Материал</TableHead>
                  <TableHead>Miqdor / Mavjud</TableHead>
                  <TableHead>{t('status21')}</TableHead>
                  <TableHead>{t("location")}</TableHead>
                  <TableHead>Yoshi (kun)</TableHead>
                  <TableHead>{t("muddatgacha")}</TableHead>
                  <TableHead className="text-right">{t("Amallar")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`} className="hover:bg-muted/40 transition-colors">
                      {Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>)}
                    </TableRow>
                  ))
                ) : lots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Layers className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">{t("lotlarTopilmadi")}</p>
                    </TableCell>
                  </TableRow>
                ) : lots.map(lot => {
                  const sConf = STATUS_CONF[lot.status] || { label: lot.status, icon: Package, cls: "bg-muted text-muted-foreground" };
                  const SIcon = sConf.icon;
                  const isFifoWarn = (lot.age_days ?? 0) > 30 && Number(lot.available_quantity) > 0;
                  const isExpiryWarn = lot.days_until_expiry !== null && lot.days_until_expiry !== undefined && lot.days_until_expiry <= 30 && lot.days_until_expiry >= 0;
                  return (
                    <TableRow key={lot.id} className={`${isFifoWarn ? "bg-amber-50/40 dark:bg-amber-950/10" : ""} ${isExpiryWarn ? "bg-rose-50/40 dark:bg-rose-950/10" : ""}`}>
                      <TableCell className="font-mono text-xs">
                        <div>{lot.lot_number || lot.batch_number}</div>
                        {lot.serial_number && <div className="text-[10px] text-muted-foreground">SN: {lot.serial_number}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm max-w-[160px] truncate">{lot.material_name || "—"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{lot.material_code}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-semibold">{Number(lot.available_quantity).toFixed(2)}</span>
                        <span className="text-muted-foreground">/{Number(lot.quantity).toFixed(2)}</span>
                        <span className="text-xs ml-1">{lot.unit}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] flex items-center gap-1 w-fit ${sConf.cls}`}>
                          <SIcon className="h-3 w-3" />{sConf.label}
                        </Badge>
                        {lot.defect_reason && <div className="text-[10px] text-[var(--ep-red)] mt-0.5">Brak: {lot.defect_reason}</div>}
                        {lot.quarantine_reason && <div className="text-[10px] text-[var(--ep-primary)] mt-0.5">Karantin: {lot.quarantine_reason}</div>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {lot.bin_code ? (
                          <div>
                            <span className="font-mono font-bold">{lot.bin_code}</span>
                            {lot.bin_row && <div className="text-muted-foreground">R{lot.bin_row} / S{lot.bin_shelf}</div>}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {lot.age_days !== null ? (
                          <span className={`text-sm font-medium ${(lot.age_days ?? 0) > 30 ? "text-[var(--ep-yellow)]" : "text-muted-foreground"}`}>
                            {lot.age_days} kun
                            {isFifoWarn && <AlertTriangle className="h-3.5 w-3.5 inline ml-1 text-[var(--ep-yellow)]" />}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {lot.days_until_expiry !== null && lot.days_until_expiry !== undefined ? (
                          <span className={`text-sm font-medium ${lot.days_until_expiry <= 7 ? "text-[var(--ep-red)]" : lot.days_until_expiry <= 30 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-green)]"}`}>
                            {lot.days_until_expiry} kun
                            {isExpiryWarn && <AlertTriangle className="h-3.5 w-3.5 inline ml-1" />}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => { setEditLot(lot); setEditForm({ quality_status: lot.status, defect_reason: lot.defect_reason ?? "", quarantine_reason: lot.quarantine_reason ?? "" }); }}>
                          {t("edit")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table></div>
          </ScrollArea>
        </Card>
      )}

      {/* Edit lot dialog */}
      <Dialog open={!!editLot} onOpenChange={() => setEditLot(null)}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("lotHolatiniYangilash")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1">{t('status20')}</p>
              <Select value={editForm.quality_status} onValueChange={v => setEditForm(p => ({ ...p, quality_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="pending">{t("tekshiruvda")}</SelectItem>
                  <SelectItem value="quarantine">{t("karantin")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  <SelectItem value="defective">{t("brakli")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(editForm.quality_status === "defective" || editForm.quality_status === "rejected") && (
              <div>
                <p className="text-xs font-medium mb-1">{t("brakSababi")}</p>
                <Input value={editForm.defect_reason} onChange={e => setEditForm(p => ({ ...p, defect_reason: e.target.value }))} placeholder={t("nuqsonSababi")} />
              </div>
            )}
            {editForm.quality_status === "quarantine" && (
              <div>
                <p className="text-xs font-medium mb-1">{t("karantinSababi")}</p>
                <Input value={editForm.quarantine_reason} onChange={e => setEditForm(p => ({ ...p, quarantine_reason: e.target.value }))} placeholder={t("karantinSababi1")} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLot(null)}>{t("Bekor")}</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>{t("Saqlash")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
