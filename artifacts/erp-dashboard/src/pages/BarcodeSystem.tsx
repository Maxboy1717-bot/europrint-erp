import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Barcode, Package, QrCode, ScanLine, Plus, Pencil, Eye, Printer, Search, Settings,
} from "lucide-react";
import type {
  BatchData, MaterialCard, Warehouse, ScanResult, BatchStats, PrintData,
} from "./barcode/barcode-types";
import {
  translations, batchFormSchema, STATUS_COLORS, QC_STATUS_COLORS,
} from "./barcode/barcode-types";
import { BatchFormDialog, BatchViewDialog, PrintPreviewDialog } from "./barcode/BatchDialogs";
import { GenerateScannerContent } from "./barcode/GenerateScannerContent";
import { LabelPrintDialog } from "./barcode/LabelPrintDialog";
import { PrinterSettingsTab } from "./barcode/PrinterSettingsTab";

export default function BarcodeSystem() {
  const { toast } = useToast();
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("batches");
  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchData | null>(null);
  const [viewingBatch, setViewingBatch] = useState<BatchData | null>(null);

  const [generateType, setGenerateType] = useState<string>("");
  const [generateEntityId, setGenerateEntityId] = useState<string>("");
  const [generatedBarcode, setGeneratedBarcode] = useState<string>("");

  const [scanInput, setScanInput] = useState("");
  const [scanAction, setScanAction] = useState<string>("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const [selectedBatchesForBulk, setSelectedBatchesForBulk] = useState<string[]>([]);
  const [printPreviewData, setPrintPreviewData] = useState<PrintData | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const [labelPrintBatch, setLabelPrintBatch] = useState<BatchData | null>(null);
  const [isLabelPrintOpen, setIsLabelPrintOpen] = useState(false);

  const [batchForm, setBatchForm] = useState({
    batchNumber: "",
    materialCardId: "",
    warehouseId: "",
    quantity: 0,
    remainingQuantity: 0,
    unitCost: 0,
    productionDate: "",
    expiryDate: "",
    supplierBatchNumber: "",
    qcStatus: "pending",
    status: "active",
    notes: ""
  });

  const { data: batches = [], isLoading: batchesLoading, isError: batchesError, refetch: refetchBatches } = useQuery<BatchData[]>({
    queryKey: ["/api/warehouse/batches", materialFilter, warehouseFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (materialFilter) params.append("materialId", materialFilter);
      if (warehouseFilter) params.append("warehouseId", warehouseFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      const res = await fetch(`/api/warehouse/batches?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    }
  });

  const { data: materials = [] } = useQuery<MaterialCard[]>({ queryKey: ["/api/warehouse/materials"] });
  const { data: warehousesList = [] } = useQuery<Warehouse[]>({ queryKey: ["/api/warehouse/warehouses"] });
  const { data: batchStats } = useQuery<BatchStats>({ queryKey: ["/api/warehouse/batches/stats"] });

  const createBatchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => await apiRequest("POST", "/api/warehouse/batches", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/batches"] });
      toast({ title: lang === "uz" ? "Partiya yaratildi" : "Партия создана" });
      setIsBatchDialogOpen(false);
      resetBatchForm();
    },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });

  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => await apiRequest("PATCH", `/api/warehouse/batches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/batches"] });
      toast({ title: lang === "uz" ? "Partiya yangilandi" : "Партия обновлена" });
      setIsBatchDialogOpen(false);
      setEditingBatch(null);
      resetBatchForm();
    },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });

  const generateBarcodeMutation = useMutation({
    mutationFn: async (data: { type: string; entityId: string }) =>
      await apiRequest<{ barcode: string; message: Record<string, string> }>("POST", "/api/warehouse/barcode/generate", data),
    onSuccess: (data) => { setGeneratedBarcode(data.barcode); toast({ title: data.message[lang] }); },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });

  const scanBarcodeMutation = useMutation({
    mutationFn: async (data: { barcode: string; action?: string }) =>
      await apiRequest<ScanResult>("POST", "/api/warehouse/barcode/scan", data),
    onSuccess: (data) => { setScanResult(data); toast({ title: data.message[lang] }); },
    onError: () => { setScanResult(null); toast({ title: lang === "uz" ? "Topilmadi" : "Не найдено", variant: "destructive" }); }
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (data: { entityIds: string[]; type: string }) =>
      await apiRequest<{ message: Record<string, string> }>("POST", "/api/warehouse/barcode/bulk-generate", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/batches"] });
      setSelectedBatchesForBulk([]);
      toast({ title: data.message[lang] });
    },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });

  const fetchPrintPreview = async (id: string, type: string = "batch") => {
    try {
      const res = await fetch(`/api/warehouse/barcode/print/${id}?type=${type}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPrintPreviewData(data);
      setIsPrintPreviewOpen(true);
    } catch {
      toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" });
    }
  };

  const resetBatchForm = () => {
    setBatchForm({
      batchNumber: "", materialCardId: "", warehouseId: "", quantity: 0, remainingQuantity: 0,
      unitCost: 0, productionDate: "", expiryDate: "", supplierBatchNumber: "",
      qcStatus: "pending", status: "active", notes: ""
    });
  };

  const handleCreateBatch = () => { setEditingBatch(null); resetBatchForm(); setIsBatchDialogOpen(true); };

  const handleEditBatch = (batch: BatchData) => {
    setEditingBatch(batch);
    setBatchForm({
      batchNumber: batch.batchNumber, materialCardId: batch.materialCardId || "",
      warehouseId: batch.warehouseId || "", quantity: batch.quantity,
      remainingQuantity: batch.remainingQuantity, unitCost: batch.unitCost || 0,
      productionDate: batch.productionDate || "", expiryDate: batch.expiryDate || "",
      supplierBatchNumber: batch.supplierBatchNumber || "",
      qcStatus: batch.qcStatus || "pending", status: batch.status || "active", notes: batch.notes || ""
    });
    setIsBatchDialogOpen(true);
  };

  const handleSaveBatch = () => {
    const validation = batchFormSchema.safeParse(batchForm);
    if (!validation.success) {
      toast({ title: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    const data = {
      ...batchForm,
      quantity: Number(batchForm.quantity),
      remainingQuantity: Number(batchForm.remainingQuantity),
      unitCost: Number(batchForm.unitCost) || null,
      materialCardId: batchForm.materialCardId || null,
      warehouseId: batchForm.warehouseId || null,
    };
    if (editingBatch) { updateBatchMutation.mutate({ id: editingBatch.id, data }); }
    else { createBatchMutation.mutate(data); }
  };

  const handleGenerateBarcode = () => {
    if (generateType && generateEntityId) {
      generateBarcodeMutation.mutate({ type: generateType, entityId: generateEntityId });
    }
  };

  const handleScan = () => {
    if (scanInput) { scanBarcodeMutation.mutate({ barcode: scanInput, action: scanAction || undefined }); }
  };

  const handleBulkGenerate = () => {
    if (selectedBatchesForBulk.length > 0) {
      bulkGenerateMutation.mutate({ entityIds: selectedBatchesForBulk, type: "batch" });
    }
  };

  const toggleBulkSelection = (id: string) => {
    setSelectedBatchesForBulk(prev => prev.includes(id) ? (prev ?? []).filter(x => x !== id) : [...prev, id]);
  };

  const handlePrintBarcode = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && printPreviewData) {
      const labels = printPreviewData.labels[lang];
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${labels.title}</title><style>body{font-family:Arial,sans-serif;padding:20px}.barcode-container{border:2px solid #000;padding:20px;max-width:400px;margin:0 auto}.barcode-text{font-family:monospace;font-size:24px;letter-spacing:4px;text-align:center;margin:20px 0}.barcode-visual{display:flex;justify-content:center;height:60px;gap:2px;margin-bottom:20px}.bar{background:#000}.info{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px}.info-label{color:#666}.info-value{font-weight:bold}.header{text-align:center;font-weight:bold;font-size:16px;margin-bottom:15px;border-bottom:1px solid #000;padding-bottom:10px}</style></head><body><div class="barcode-container"><div class="header">${labels.title}</div><div class="barcode-text">${printPreviewData.barcode}</div><div class="barcode-visual">${printPreviewData.barcode.split('').map(c => `<div class="bar" style="width: ${c.match(/[0-9]/) ? (parseInt(c) + 1) * 2 : 3}px"></div>`).join('')}</div><div class="info">${printPreviewData.type === "batch" ? `<div class="info-label">${labels.batch}:</div><div class="info-value">${printPreviewData.batchNumber || "-"}</div><div class="info-label">${labels.material}:</div><div class="info-value">${printPreviewData.materialName}</div><div class="info-label">${labels.warehouse}:</div><div class="info-value">${printPreviewData.warehouseName || "-"}</div><div class="info-label">${labels.quantity}:</div><div class="info-value">${printPreviewData.quantity?.toLocaleString() || "-"} ${printPreviewData.unitOfMeasure || ""}</div><div class="info-label">${labels.expiry}:</div><div class="info-value">${printPreviewData.expiryDate || "-"}</div>` : `<div class="info-label">${labels.code}:</div><div class="info-value">${printPreviewData.materialCode}</div><div class="info-label">${labels.material}:</div><div class="info-value">${printPreviewData.materialName}</div><div class="info-label">${labels.unit}:</div><div class="info-value">${printPreviewData.unitOfMeasure || "-"}</div>`}</div></div><script>window.onload = function() { window.print(); }</script></body></html>`);
      printWindow.document.close();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: lang === "uz" ? "Nusxalandi" : "Скопировано" });
  };

  const getEntityOptions = () => {
    switch (generateType) {
      case "material": return (Array.isArray(materials) ? materials : []).map(m => ({ id: m.id, label: `${m.kod} - ${m.xomAshyo}` }));
      case "batch": return (Array.isArray(batches) ? batches : []).map(b => ({ id: b.id, label: `${b.batchNumber} - ${b.materialName || "N/A"}` }));
      default: return [];
    }
  };

  if (batchesError) {
    return (<div className="space-y-6 p-6"><ErrorState onRetry={refetchBatches} /></div>);
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Shtrix Kod <span className="font-bold text-primary">Tizimi</span>
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={lang === "uz" ? "default" : "outline"} size="sm" onClick={() => setLang("uz")} data-testid="button-lang-uz">UZ</Button>
          <Button variant={lang === "ru" ? "default" : "outline"} size="sm" onClick={() => setLang("ru")} data-testid="button-lang-ru">RU</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.stats.activeBatches}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{batchStats?.activeBatches || 0}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.stats.expiringSoon}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{batchStats?.expiringBatches || 0}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.stats.totalQuantity}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(batchStats?.totalQuantity || 0).toLocaleString()}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t.stats.totalValue}</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{(batchStats?.totalValue || 0).toLocaleString()}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-surface-container p-1 rounded-2xl border border-outline-variant h-auto w-full grid grid-cols-4 max-w-xl">
          <TabsTrigger value="batches" className="rounded-xl py-3 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-batches">
            <Package className="h-4 w-4 mr-2" />{t.batches}
          </TabsTrigger>
          <TabsTrigger value="generate" className="rounded-xl py-3 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-generate">
            <QrCode className="h-4 w-4 mr-2" />{t.generate}
          </TabsTrigger>
          <TabsTrigger value="scanner" className="rounded-xl py-3 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-scanner">
            <ScanLine className="h-4 w-4 mr-2" />{t.scanner}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl py-3 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-2" />{t.settings ?? (lang === "uz" ? "Sozlamalar" : "Настройки")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-lg">{t.batches}</CardTitle>
                <div className="flex items-center gap-2">
                  {selectedBatchesForBulk.length > 0 && (
                    <Button onClick={handleBulkGenerate} size="sm" variant="outline" disabled={bulkGenerateMutation.isPending} data-testid="button-bulk-generate">
                      <QrCode className="h-4 w-4 mr-2" />{t.bulkGenerate} ({selectedBatchesForBulk.length})
                    </Button>
                  )}
                  <Button onClick={handleCreateBatch} size="sm" data-testid="button-create-batch">
                    <Plus className="h-4 w-4 mr-2" />{t.add}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap pt-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-batches" />
                </div>
                <Select value={materialFilter || "__all__"} onValueChange={(v) => setMaterialFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-material-filter"><SelectValue placeholder={t.allMaterials} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t.allMaterials}</SelectItem>
                    {(Array.isArray(materials) ? materials : []).map((m) => (<SelectItem key={m.id} value={m.id}>{m.xomAshyo}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={warehouseFilter || "__all__"} onValueChange={(v) => setWarehouseFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-warehouse-filter"><SelectValue placeholder={t.allWarehouses} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t.allWarehouses}</SelectItem>
                    {(Array.isArray(warehousesList) ? warehousesList : []).map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter"><SelectValue placeholder={t.allStatuses} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t.allStatuses}</SelectItem>
                    <SelectItem value="active">{t.statuses.active}</SelectItem>
                    <SelectItem value="depleted">{t.statuses.depleted}</SelectItem>
                    <SelectItem value="blocked">{t.statuses.blocked}</SelectItem>
                    <SelectItem value="expired">{t.statuses.expired}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="space-y-2">{([1, 2, 3]).map((i) => (<Skeleton key={`k-${i}`} className="h-12 w-full" />))}</div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input type="checkbox" checked={selectedBatchesForBulk.length === batches.length && batches.length > 0} onChange={(e) => { if (e.target.checked) { setSelectedBatchesForBulk((Array.isArray(batches) ? batches : []).map(b => b.id)); } else { setSelectedBatchesForBulk([]); } }} className="h-4 w-4 rounded border-outline-variant/40" data-testid="checkbox-select-all" />
                        </TableHead>
                        <TableHead>{t.batchNumber}</TableHead>
                        <TableHead>{t.material}</TableHead>
                        <TableHead>{t.warehouse}</TableHead>
                        <TableHead className="text-right">{t.quantity}</TableHead>
                        <TableHead className="text-right">{t.remaining}</TableHead>
                        <TableHead>{t.productionDate}</TableHead>
                        <TableHead>{t.expiryDate}</TableHead>
                        <TableHead>{t.qcStatus}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(batches) ? batches : []).map((batch) => (
                        <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                          <TableCell>
                            <input type="checkbox" checked={selectedBatchesForBulk.includes(batch.id)} onChange={() => toggleBulkSelection(batch.id)} className="h-4 w-4 rounded border-outline-variant/40" data-testid={`checkbox-batch-${batch.id}`} />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2"><Barcode className="h-4 w-4 text-muted-foreground" />{batch.batchNumber}</div>
                          </TableCell>
                          <TableCell>{batch.materialName || "-"}</TableCell>
                          <TableCell>{batch.warehouseName || "-"}</TableCell>
                          <TableCell className="text-right">{batch.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{batch.remainingQuantity.toLocaleString()}</TableCell>
                          <TableCell>{batch.productionDate || "-"}</TableCell>
                          <TableCell>{batch.expiryDate || "-"}</TableCell>
                          <TableCell><Badge className={QC_STATUS_COLORS[batch.qcStatus || "pending"]}>{t.qcStatuses[batch.qcStatus as keyof typeof t.qcStatuses] || batch.qcStatus}</Badge></TableCell>
                          <TableCell><Badge className={STATUS_COLORS[batch.status || "active"]}>{t.statuses[batch.status as keyof typeof t.statuses] || batch.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewingBatch(batch)} data-testid={`button-view-batch-${batch.id}`}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEditBatch(batch)} data-testid={`button-edit-batch-${batch.id}`}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => fetchPrintPreview(batch.id, "batch")} data-testid={`button-print-batch-${batch.id}`}><Printer className="h-4 w-4" /></Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={t.labelPrint}
                                onClick={() => { setLabelPrintBatch(batch); setIsLabelPrintOpen(true); }}
                                data-testid={`button-label-print-${batch.id}`}
                                className="text-primary hover:text-primary/80"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                                  <path d="M17 6V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2"/>
                                  <path d="M7 12h.01M12 12h.01M17 12h.01"/>
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {batches.length === 0 && (
                        <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">{lang === "uz" ? "Partiyalar topilmadi" : "Партии не найдены"}</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <GenerateScannerContent
          lang={lang}
          t={t}
          generateType={generateType}
          onGenerateTypeChange={setGenerateType}
          generateEntityId={generateEntityId}
          onGenerateEntityIdChange={setGenerateEntityId}
          generatedBarcode={generatedBarcode}
          onGenerateBarcode={handleGenerateBarcode}
          isGenerating={generateBarcodeMutation.isPending}
          entityOptions={getEntityOptions()}
          onCopyToClipboard={copyToClipboard}
          onPrintToast={() => toast({ title: lang === "uz" ? "Chop etish" : "Печать" })}
          scanInput={scanInput}
          onScanInputChange={setScanInput}
          scanAction={scanAction}
          onScanActionChange={setScanAction}
          scanResult={scanResult}
          onScan={handleScan}
          isScanning={scanBarcodeMutation.isPending}
          onScanActionToast={(info) => toast({ title: info[lang] })}
        />

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t.printerSettings ?? (lang === "uz" ? "Printer sozlamalari" : "Настройки принтера")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PrinterSettingsTab lang={lang} t={t} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LabelPrintDialog
        open={isLabelPrintOpen}
        onOpenChange={setIsLabelPrintOpen}
        batch={labelPrintBatch}
        lang={lang}
        t={t}
      />

      <BatchFormDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        editingBatch={editingBatch}
        batchForm={batchForm}
        onFormChange={setBatchForm}
        onSave={handleSaveBatch}
        isSaving={createBatchMutation.isPending || updateBatchMutation.isPending}
        materials={materials}
        warehouses={warehousesList}
        t={t}
      />

      <BatchViewDialog
        batch={viewingBatch}
        onClose={() => setViewingBatch(null)}
        t={t}
        lang={lang}
      />

      <PrintPreviewDialog
        open={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        printData={printPreviewData}
        onPrint={handlePrintBarcode}
        onCopy={copyToClipboard}
        lang={lang}
        t={t}
      />
    </div>
  );
}
