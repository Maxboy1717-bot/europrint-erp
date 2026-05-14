/**
 * @module BarcodeSystem
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Barcode, Package, QrCode, ScanLine, Settings } from "lucide-react";
import type { BatchData, MaterialCard, Warehouse, ScanResult, BatchStats, PrintData } from "./barcode/barcode-types";
import { translations, batchFormSchema } from "./barcode/barcode-types";
import { GenerateScannerContent } from "./barcode/GenerateScannerContent";
import { PrinterSettingsTab } from "./barcode/PrinterSettingsTab";
import { BatchFormDialog, BatchViewDialog, PrintPreviewDialog } from "./BarcodeSystemDialogs";
import { LabelPrintDialog } from "./BarcodeSystemDialogs";
import { BatchesTabContent } from "./BarcodeSystemSections";
import type { BatchFormState } from "./BarcodeSystemTypes";
import { DEFAULT_BATCH_FORM } from "./BarcodeSystemTypes";
import { EPErrorState, EPPageHeader } from "@/components/ep";

const escHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

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
  const [batchForm, setBatchForm] = useState<BatchFormState>(DEFAULT_BATCH_FORM);

  const { data: batches = [], isLoading: batchesLoading, isError: batchesError, refetch: refetchBatches } = useQuery<BatchData[]>({
    queryKey: ["/api/warehouse/batches", materialFilter, warehouseFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (materialFilter) params.append("materialId", materialFilter);
      if (warehouseFilter) params.append("warehouseId", warehouseFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      const res = await apiRequest('GET', `/api/warehouse/batches?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    }
  });

  const { data: materials = [] } = useQuery<MaterialCard[]>({ queryKey: ["/api/warehouse/materials"] });
  const { data: warehousesList = [] } = useQuery<Warehouse[]>({ queryKey: ["/api/warehouse/warehouses"] });
  const { data: batchStats } = useQuery<BatchStats>({ queryKey: ["/api/warehouse/batches/stats"] });

  const createBatchMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => await apiRequest("POST", "/api/warehouse/batches", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/warehouse/batches"] }); toast({ title: lang === "uz" ? "Partiya yaratildi" : "Партия создана" }); setIsBatchDialogOpen(false); resetBatchForm(); },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });
  const updateBatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => await apiRequest("PATCH", `/api/warehouse/batches/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/warehouse/batches"] }); toast({ title: lang === "uz" ? "Partiya yangilandi" : "Партия обновлена" }); setIsBatchDialogOpen(false); setEditingBatch(null); resetBatchForm(); },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });
  const generateBarcodeMutation = useMutation({
    mutationFn: async (data: { type: string; entityId: string }) => await apiRequest<{ barcode: string; message: Record<string, string> }>("POST", "/api/warehouse/barcode/generate", data),
    onSuccess: (data) => { setGeneratedBarcode(data.barcode); toast({ title: data.message[lang] }); },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });
  const scanBarcodeMutation = useMutation({
    mutationFn: async (data: { barcode: string; action?: string }) => await apiRequest<ScanResult>("POST", "/api/warehouse/barcode/scan", data),
    onSuccess: (data) => { setScanResult(data); toast({ title: data.message[lang] }); },
    onError: () => { setScanResult(null); toast({ title: lang === "uz" ? "Topilmadi" : "Не найдено", variant: "destructive" }); }
  });
  const bulkGenerateMutation = useMutation({
    mutationFn: async (data: { entityIds: string[]; type: string }) => await apiRequest<{ message: Record<string, string> }>("POST", "/api/warehouse/barcode/bulk-generate", data),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["/api/warehouse/batches"] }); setSelectedBatchesForBulk([]); toast({ title: data.message[lang] }); },
    onError: () => { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  });

  const fetchPrintPreview = async (id: string, type: string = "batch") => {
    try {
      const res = await apiRequest('GET', `/api/warehouse/barcode/print/${id}?type=${type}`);
      if (!res.ok) throw new Error();
      setPrintPreviewData(await res.json());
      setIsPrintPreviewOpen(true);
    } catch { toast({ title: lang === "uz" ? "Xatolik" : "Ошибка", variant: "destructive" }); }
  };

  const resetBatchForm = () => setBatchForm(DEFAULT_BATCH_FORM);

  const handleEditBatch = (batch: BatchData) => {
    setEditingBatch(batch);
    setBatchForm({ batchNumber: batch.batchNumber, materialCardId: batch.materialCardId || "", warehouseId: batch.warehouseId || "", quantity: batch.quantity, remainingQuantity: batch.remainingQuantity, unitCost: batch.unitCost || 0, productionDate: batch.productionDate || "", expiryDate: batch.expiryDate || "", supplierBatchNumber: batch.supplierBatchNumber || "", qcStatus: batch.qcStatus || "pending", status: batch.status || "active", notes: batch.notes || "" });
    setIsBatchDialogOpen(true);
  };

  const handleSaveBatch = () => {
    const validation = batchFormSchema.safeParse(batchForm);
    if (!validation.success) { toast({ title: validation.error.errors[0].message, variant: "destructive" }); return; }
    const data = { ...batchForm, quantity: Number(batchForm.quantity), remainingQuantity: Number(batchForm.remainingQuantity), unitCost: Number(batchForm.unitCost) || null, materialCardId: batchForm.materialCardId || null, warehouseId: batchForm.warehouseId || null };
    if (editingBatch) { updateBatchMutation.mutate({ id: editingBatch.id, data }); }
    else { createBatchMutation.mutate(data); }
  };

  const handlePrintBarcode = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && printPreviewData) {
      const labels = printPreviewData.labels[lang];
      printWindow.document.write(`<!DOCTYPE html><html><head><title>${escHtml(labels.title)}</title><style>body{font-family:Arial,sans-serif;padding:20px}.barcode-container{border:2px solid #000;padding:20px;max-width:400px;margin:0 auto}.barcode-text{font-family:monospace;font-size:24px;letter-spacing:4px;text-align:center;margin:20px 0}.barcode-visual{display:flex;justify-content:center;height:60px;gap:2px;margin-bottom:20px}.bar{background:#000}.info{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px}.info-label{color:#666}.info-value{font-weight:bold}.header{text-align:center;font-weight:bold;font-size:16px;margin-bottom:15px;border-bottom:1px solid #000;padding-bottom:10px}</style></head><body><div class="barcode-container"><div class="header">${escHtml(labels.title)}</div><div class="barcode-text">${escHtml(printPreviewData.barcode)}</div><div class="barcode-visual">${printPreviewData.barcode.split('').map(c => `<div class="bar" style="width: ${c.match(/[0-9]/) ? (parseInt(c) + 1) * 2 : 3}px"></div>`).join('')}</div><div class="info">${printPreviewData.type === "batch" ? `<div class="info-label">${escHtml(labels.batch)}:</div><div class="info-value">${escHtml(printPreviewData.batchNumber || "-")}</div><div class="info-label">${escHtml(labels.material)}:</div><div class="info-value">${escHtml(printPreviewData.materialName)}</div><div class="info-label">${escHtml(labels.warehouse)}:</div><div class="info-value">${escHtml(printPreviewData.warehouseName || "-")}</div><div class="info-label">${escHtml(labels.quantity)}:</div><div class="info-value">${escHtml(printPreviewData.quantity?.toLocaleString() || "-")} ${escHtml(printPreviewData.unitOfMeasure || "")}</div><div class="info-label">${escHtml(labels.expiry)}:</div><div class="info-value">${escHtml(printPreviewData.expiryDate || "-")}</div>` : `<div class="info-label">${escHtml(labels.code)}:</div><div class="info-value">${escHtml(printPreviewData.materialCode)}</div><div class="info-label">${escHtml(labels.material)}:</div><div class="info-value">${escHtml(printPreviewData.materialName)}</div><div class="info-label">${escHtml(labels.unit)}:</div><div class="info-value">${escHtml(printPreviewData.unitOfMeasure || "-")}</div>`}</div></div><script>window.onload = function() { window.print(); }</script></body></html>`);
      printWindow.document.close();
    }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: lang === "uz" ? "Nusxalandi" : "Скопировано" }); };

  const getEntityOptions = () => {
    switch (generateType) {
      case "material": return (Array.isArray(materials) ? materials : []).map(m => ({ id: m.id, label: `${m.kod} - ${m.xomAshyo}` }));
      case "batch":    return (Array.isArray(batches)   ? batches   : []).map(b => ({ id: b.id, label: `${b.batchNumber} - ${b.materialName || "N/A"}` }));
      default:         return [];
    }
  };

  if (batchesError) return (<div className="flex flex-col h-full p-5 lg:p-6 gap-5"><EPErrorState onRetry={refetchBatches} /></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Shtrix Kod Tizimi</b></>}
        title="Shtrix Kod Tizimi"
      />
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={lang === "uz" ? "default" : "outline"} size="sm" onClick={() => setLang("uz")} data-testid="button-lang-uz">UZ</Button>
          <Button variant={lang === "ru" ? "default" : "outline"} size="sm" onClick={() => setLang("ru")} data-testid="button-lang-ru">RU</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.stats.activeBatches}</p><p className="text-4xl font-bold tracking-tight text-foreground mt-1">{batchStats?.activeBatches || 0}</p></div>
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.stats.expiringSoon}</p><p className="text-4xl font-bold tracking-tight text-foreground mt-1">{batchStats?.expiringBatches || 0}</p></div>
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.stats.totalQuantity}</p><p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(batchStats?.totalQuantity || 0).toLocaleString()}</p></div>
        <div className="bg-card rounded-lg p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.stats.totalValue}</p><p className="text-4xl font-bold tracking-tight text-foreground mt-1">{(batchStats?.totalValue || 0).toLocaleString()}</p></div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border h-auto w-full grid grid-cols-2 lg:grid-cols-4 max-w-xl">
          <TabsTrigger value="batches"  className="rounded-xl py-3 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-batches"><Package className="h-4 w-4 mr-2" />{t.batches}</TabsTrigger>
          <TabsTrigger value="generate" className="rounded-xl py-3 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-generate"><QrCode className="h-4 w-4 mr-2" />{t.generate}</TabsTrigger>
          <TabsTrigger value="scanner"  className="rounded-xl py-3 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-scanner"><ScanLine className="h-4 w-4 mr-2" />{t.scanner}</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl py-3 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-wider" data-testid="tab-settings"><Settings className="h-4 w-4 mr-2" />{t.settings ?? (lang === "uz" ? "Sozlamalar" : "Настройки")}</TabsTrigger>
        </TabsList>

        <BatchesTabContent
          lang={lang} t={t as unknown as Record<string, unknown>}
          batches={batches} batchesLoading={batchesLoading}
          materials={materials} warehousesList={warehousesList}
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          materialFilter={materialFilter} onMaterialFilterChange={setMaterialFilter}
          warehouseFilter={warehouseFilter} onWarehouseFilterChange={setWarehouseFilter}
          statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
          selectedBatchesForBulk={selectedBatchesForBulk}
          onToggleBulkSelection={(id) => setSelectedBatchesForBulk(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onSelectAll={(checked) => setSelectedBatchesForBulk(checked ? batches.map(b => b.id) : [])}
          onCreateBatch={() => { setEditingBatch(null); resetBatchForm(); setIsBatchDialogOpen(true); }}
          onEditBatch={handleEditBatch}
          onViewBatch={setViewingBatch}
          onPrintBatch={fetchPrintPreview}
          onLabelPrint={(batch) => { setLabelPrintBatch(batch); setIsLabelPrintOpen(true); }}
          onBulkGenerate={() => { if (selectedBatchesForBulk.length > 0) bulkGenerateMutation.mutate({ entityIds: selectedBatchesForBulk, type: "batch" }); }}
          bulkGeneratePending={bulkGenerateMutation.isPending}
        />

        <GenerateScannerContent
          lang={lang} t={t}
          generateType={generateType} onGenerateTypeChange={setGenerateType}
          generateEntityId={generateEntityId} onGenerateEntityIdChange={setGenerateEntityId}
          generatedBarcode={generatedBarcode}
          onGenerateBarcode={() => { if (generateType && generateEntityId) generateBarcodeMutation.mutate({ type: generateType, entityId: generateEntityId }); }}
          isGenerating={generateBarcodeMutation.isPending}
          entityOptions={getEntityOptions()}
          onCopyToClipboard={copyToClipboard}
          onPrintToast={() => toast({ title: lang === "uz" ? "Chop etish" : "Печать" })}
          scanInput={scanInput} onScanInputChange={setScanInput}
          scanAction={scanAction} onScanActionChange={setScanAction}
          scanResult={scanResult}
          onScan={() => { if (scanInput) scanBarcodeMutation.mutate({ barcode: scanInput, action: scanAction || undefined }); }}
          isScanning={scanBarcodeMutation.isPending}
          onScanActionToast={(info) => toast({ title: info[lang] })}
        />

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t.printerSettings ?? (lang === "uz" ? "Printer sozlamalari" : "Настройки принтера")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PrinterSettingsTab lang={lang} t={t} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LabelPrintDialog open={isLabelPrintOpen} onOpenChange={setIsLabelPrintOpen} batch={labelPrintBatch} lang={lang} t={t} />
      <BatchFormDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen} editingBatch={editingBatch} batchForm={batchForm} onFormChange={setBatchForm} onSave={handleSaveBatch} isSaving={createBatchMutation.isPending || updateBatchMutation.isPending} materials={materials} warehouses={warehousesList} t={t} />
      <BatchViewDialog batch={viewingBatch} onClose={() => setViewingBatch(null)} t={t} lang={lang} />
      <PrintPreviewDialog open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen} printData={printPreviewData} onPrint={handlePrintBarcode} onCopy={copyToClipboard} lang={lang} t={t} />
    </div>
  );
}
