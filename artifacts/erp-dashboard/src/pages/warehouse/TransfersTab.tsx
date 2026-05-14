/**
 * @module TransfersTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Eye, Send, ArrowRightLeft, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { WarehouseData, TransferData, MaterialCard, Lang, Translations, STATUS_COLORS } from "./warehouse-types";

interface TransfersTabProps {
  lang: Lang;
  t: Translations;
}

export function TransfersTab({ lang, t }: TransfersTabProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferData | null>(null);
  const [transferStep, setTransferStep] = useState(1);
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: "", toWarehouseId: "",
    transferDate: new Date().toISOString().split("T")[0], notes: "",
  });
  const [transferLines, setTransferLines] = useState<{ materialCardId: string; requestedQuantity: number; unitCost: number }[]>([]);

  const { data: warehouses = [] } = useQuery<WarehouseData[]>({
    queryKey: ["/api/warehouse/warehouses"],
  });

  const { data: materials = [] } = useQuery<MaterialCard[]>({
    queryKey: ["/api/warehouse/materials"],
  });

  const { data: transfers = [], isLoading } = useQuery<TransferData[]>({
    queryKey: ["/api/warehouse/transfers", statusFilter],
    queryFn: async () => {
      let url = "/api/warehouse/transfers";
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (params.toString()) url += `?${params.toString()}`;
      return await apiRequest<TransferData[]>('GET', url);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { fromWarehouseId: string; toWarehouseId: string; transferDate: string; notes: string; lines: typeof transferLines }) =>
      apiRequest("POST", "/api/warehouse/transfers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/transfers"] });
      toast({ title: lang === "uz" ? "Ko'chirish yaratildi" : "Перемещение создано" });
      setIsDialogOpen(false);
      resetTransferForm();
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/warehouse/transfers/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/transfers"] });
      toast({ title: lang === "uz" ? "Holat yangilandi" : "Статус обновлён" });
    },
    onError: () => toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" }),
  });

  const resetTransferForm = () => {
    setTransferForm({ fromWarehouseId: "", toWarehouseId: "", transferDate: new Date().toISOString().split("T")[0], notes: "" });
    setTransferLines([]);
    setTransferStep(1);
  };

  const handleViewTransfer = async (transfer: TransferData) => {
    try {
      const res = await apiRequest('GET', `/api/warehouse/transfers/${transfer.id}`);
      if (res.ok) {
        setSelectedTransfer(await res.json());
        setIsDetailOpen(true);
      }
    } catch {
      toast({ title: lang === "uz" ? "Xatolik yuz berdi" : "Произошла ошибка", variant: "destructive" });
    }
  };

  const addTransferLine = () => setTransferLines(prev => [...prev, { materialCardId: "", requestedQuantity: 0, unitCost: 0 }]);

  const updateTransferLine = (index: number, field: string, value: string | number) => {
    const newLines = [...transferLines];
    (newLines[index] as Record<string, string | number>)[field] = value;
    if (field === "materialCardId") {
      const material = (Array.isArray(materials) ? materials : []).find(m => m.id === value);
      if (material) newLines[index].unitCost = material.unitPrice;
    }
    setTransferLines(newLines);
  };

  const getWarehouseName = (id: string) => {
    const wh = (Array.isArray(warehouses) ? warehouses : []).find(w => w.id === id);
    return lang === "uz" ? wh?.name : wh?.nameRu || wh?.name;
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Select value={statusFilter || "__all__"} onValueChange={v => setStatusFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[200px] h-9" data-testid="select-status-filter"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t.allStatuses}</SelectItem>
            {Object.entries(t.transferStatuses).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { resetTransferForm(); setIsDialogOpen(true); }} data-testid="btn-add-transfer">
          <Plus className="h-4 w-4 mr-2" />{t.createTransfer}
        </Button>
      </div>

      <Card>
        <ScrollArea className="h-[500px]">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.transferNumber}</TableHead>
                <TableHead>{t.date}</TableHead>
                <TableHead>{t.from}</TableHead>
                <TableHead>{t.to}</TableHead>
                <TableHead>{t.items}</TableHead>
                <TableHead>{t.totalValue}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>)}</TableRow>
                ))
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{lang === "uz" ? "Ko'chirishlar topilmadi" : "Перемещения не найдены"}</p>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(transfers) ? transfers : []).map(transfer => (
                  <TableRow key={transfer.id} data-testid={`row-transfer-${transfer.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono font-medium">{transfer.transferNumber}</TableCell>
                    <TableCell>{transfer.transferDate}</TableCell>
                    <TableCell>{getWarehouseName(transfer.fromWarehouseId) || "-"}</TableCell>
                    <TableCell>{getWarehouseName(transfer.toWarehouseId) || "-"}</TableCell>
                    <TableCell>{transfer.totalItems}</TableCell>
                    <TableCell>{transfer.totalValue?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[transfer.status] || ""}>
                        {t.transferStatuses[transfer.status as keyof typeof t.transferStatuses] || transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleViewTransfer(transfer)} data-testid={`btn-view-transfer-${transfer.id}`}><Eye className="h-4 w-4" /></Button>
                        {transfer.status === "draft" && (
                          <Button size="icon" variant="ghost" onClick={() => statusMutation.mutate({ id: transfer.id, status: "pending" })} data-testid={`btn-submit-transfer-${transfer.id}`}><Send className="h-4 w-4 text-[var(--ep-blue)]" /></Button>
                        )}
                        {transfer.status === "pending" && (
                          <Button size="icon" variant="ghost" onClick={() => statusMutation.mutate({ id: transfer.id, status: "in_transit" })} data-testid={`btn-ship-transfer-${transfer.id}`}><ArrowRightLeft className="h-4 w-4 text-[var(--ep-yellow)]" /></Button>
                        )}
                        {transfer.status === "in_transit" && (
                          <Button size="icon" variant="ghost" onClick={() => statusMutation.mutate({ id: transfer.id, status: "received" })} data-testid={`btn-receive-transfer-${transfer.id}`}><Check className="h-4 w-4 text-[var(--ep-green)]" /></Button>
                        )}
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
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t.createTransfer}</DialogTitle></DialogHeader>
          {transferStep === 1 ? (
            <div className="space-y-4">
              <h3 className="font-medium">{t.step1}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t.sourceWarehouse}</Label>
                  <Select value={transferForm.fromWarehouseId} onValueChange={v => setTransferForm(p => ({ ...p, fromWarehouseId: v }))}>
                    <SelectTrigger data-testid="select-transfer-from" className="h-9"><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
                    <SelectContent>{(Array.isArray(warehouses) ? warehouses : []).filter(w => w.isActive).map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
          <Label>{t.targetWarehouse}</Label>
                  <Select value={transferForm.toWarehouseId} onValueChange={v => setTransferForm(p => ({ ...p, toWarehouseId: v }))}>
                    <SelectTrigger data-testid="select-transfer-to" className="h-9"><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
                    <SelectContent>{(Array.isArray(warehouses) ? warehouses : []).filter(w => w.isActive && w.id !== transferForm.fromWarehouseId).map(wh => <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
          <Label>{t.date}</Label>
                <Input type="date" value={transferForm.transferDate} onChange={e => setTransferForm(p => ({ ...p, transferDate: e.target.value }))} data-testid="input-transfer-date" />
              </div>
              <div className="space-y-1">
          <Label>{t.notes}</Label>
                <Textarea value={transferForm.notes} onChange={e => setTransferForm(p => ({ ...p, notes: e.target.value }))} data-testid="input-transfer-notes" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">{t.step2}</h3>
              <div className="space-y-2">
                {(Array.isArray(transferLines) ? transferLines : []).map((line, index) => (
                  <div key={`k-${index}`} className="flex items-center gap-2 p-2 border rounded-md">
                    <Select value={line.materialCardId} onValueChange={v => updateTransferLine(index, "materialCardId", v)}>
                      <SelectTrigger className="flex-1 h-9" data-testid={`select-transfer-material-${index}`}><SelectValue placeholder={t.material} /></SelectTrigger>
                      <SelectContent>{(Array.isArray(materials) ? materials : []).map(m => <SelectItem key={m.id} value={m.id}>{m.xomAshyo} ({m.kod})</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" placeholder={t.quantity} className="w-24" value={line.requestedQuantity || ""} onChange={e => updateTransferLine(index, "requestedQuantity", parseFloat(e.target.value) || 0)} data-testid={`input-transfer-qty-${index}`} />
                    <Button size="icon" variant="ghost" onClick={() => setTransferLines(prev => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index))} data-testid={`btn-remove-line-${index}`}><X className="h-4 w-4 text-[var(--ep-red)]" /></Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2" onClick={addTransferLine} data-testid="btn-add-transfer-line">
                  <Plus className="h-4 w-4" />{t.addMaterial}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="btn-cancel-transfer">{t.cancel}</Button>
            {transferStep === 2 && (
              <Button variant="outline" onClick={() => setTransferStep(1)} data-testid="btn-transfer-back">
                <ChevronLeft className="h-4 w-4 mr-1" />{t.back}
              </Button>
            )}
            {transferStep === 1 ? (
              <Button onClick={() => setTransferStep(2)} disabled={!transferForm.fromWarehouseId || !transferForm.toWarehouseId} data-testid="btn-transfer-next">
                {t.next}<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => createMutation.mutate({ ...transferForm, lines: transferLines })} disabled={transferLines.length === 0 || createMutation.isPending} data-testid="btn-submit-transfer">
                {t.submit}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">{t.transferDetails}</DialogTitle></DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">{t.transferNumber}:</span><span className="ml-2 font-mono">{selectedTransfer.transferNumber}</span></div>
                <div><span className="text-muted-foreground">{t.date}:</span><span className="ml-2">{selectedTransfer.transferDate}</span></div>
                <div><span className="text-muted-foreground">{t.from}:</span><span className="ml-2">{getWarehouseName(selectedTransfer.fromWarehouseId)}</span></div>
                <div><span className="text-muted-foreground">{t.to}:</span><span className="ml-2">{getWarehouseName(selectedTransfer.toWarehouseId)}</span></div>
                <div>
                  <span className="text-muted-foreground">{t.status}:</span>
                  <Badge className={`ml-2 ${STATUS_COLORS[selectedTransfer.status] || ""}`}>
                    {t.transferStatuses[selectedTransfer.status as keyof typeof t.transferStatuses] || selectedTransfer.status}
                  </Badge>
                </div>
                <div><span className="text-muted-foreground">{t.totalValue}:</span><span className="ml-2 font-medium">{selectedTransfer.totalValue?.toLocaleString()}</span></div>
              </div>
              {selectedTransfer.lines && selectedTransfer.lines.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{t.items}</h4>
                  <div className="ep-table-scroll"><Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.material}</TableHead>
                        <TableHead>{t.quantity}</TableHead>
                        <TableHead>{t.totalValue}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(selectedTransfer.lines) ? selectedTransfer.lines : []).map(line => (
                        <TableRow key={line.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell>
                            <div className="font-medium">{line.materialName}</div>
                            <div className="text-xs text-muted-foreground">{line.materialCode}</div>
                          </TableCell>
                          <TableCell>{line.requestedQuantity}</TableCell>
                          <TableCell>{line.totalCost?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </div>
              )}
              {selectedTransfer.notes && (
                <div>
                  <h4 className="font-medium mb-1">{t.notes}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
