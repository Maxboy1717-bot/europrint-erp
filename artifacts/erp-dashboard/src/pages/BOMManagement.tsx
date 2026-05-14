/**
 * @module BOMManagement
 * @description React page component. Route-level UI.
 */

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, ChevronRight, ChevronDown, Trash2, Edit, FileText, Layers, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUndoDelete } from "@/components/undo-toast";
import { ModulePage } from "@/components/ui/module-page";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/lib/i18n";
import { bomFormSchema, itemFormSchema } from "./BOMManagementTypes";
import type { BOMFormValues, ItemFormValues, Product, BOMHeader, BOMItem, ExplosionItem, ExplosionData } from "./BOMManagementTypes";
import { CreateBOMDialog, AddItemDialog } from "./BOMManagementDialogs";
import { EPErrorState, EPStatusPill, EPLoader } from "@/components/ep";

export default function BOMManagement() {
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const { t } = useTranslation("production");
  const { t: tCommon } = useTranslation('common');
  const [showBOMDialog, setShowBOMDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<{ header: BOMHeader; product: Product } | null>(null);
  const [explosionData, setExplosionData] = useState<ExplosionData | null>(null);
  const [expandedBOMs, setExpandedBOMs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteBomId, setDeleteBomId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const bomForm = useForm<BOMFormValues>({ resolver: zodResolver(bomFormSchema), defaultValues: { bomNumber: "", productId: "", version: "1.0", status: "draft", baseQuantity: 1, unit: "pcs", effectiveDate: "", expiryDate: "" } });
  const itemForm = useForm<ItemFormValues>({ resolver: zodResolver(itemFormSchema), defaultValues: { componentId: "", quantity: 1, unit: "pcs", componentType: "raw", scrapPercentage: 0, position: 10, itemNumber: "", notes: "" } });

  const { data: bomList = [], isLoading: bomLoading, error: bomError, isError, refetch } = useQuery<Array<{ bom: BOMHeader; product: Product }>>({ queryKey: ["/api/erp/bom-headers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/erp/products"] });
  const { data: bomItems = [] } = useQuery<Array<{ item: BOMItem; component: Product }>>({ queryKey: ["/api/erp/bom-items"], enabled: !!selectedBOM });

  const createBOMMutation = useMutation({
    mutationFn: (data: BOMFormValues) => apiRequest("POST", "/api/erp/bom-headers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-headers"] }); setShowBOMDialog(false); bomForm.reset(); toast({ title: tCommon("createdSuccessfully") }); },
    onError: () => { toast({ variant: "destructive", title: tCommon("error"), description: tCommon("operationFailed") }); },
  });
  const createItemMutation = useMutation({
    mutationFn: (data: ItemFormValues & { bomId: string }) => apiRequest("POST", "/api/erp/bom-items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-items"] }); setShowItemDialog(false); itemForm.reset(); toast({ title: tCommon("createdSuccessfully") }); },
    onError: () => { toast({ variant: "destructive", title: tCommon("error"), description: tCommon("operationFailed") }); },
  });
  const deleteBOMMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/erp/bom-headers/${id}`); return id; },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-headers"] });
      setDeleteBomId(null);
      const bom = (Array.isArray(bomList) ? bomList : []).find((b) => b.bom.id === id);
      showUndoToast("bom_headers", id, bom?.bom?.bomNumber || id, () => { queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-headers"] }); });
    },
    onError: () => { setDeleteBomId(null); toast({ variant: "destructive", title: tCommon("error"), description: tCommon("operationFailed") }); },
  });
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/erp/bom-items/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-items"] }); setDeleteItemId(null); toast({ title: tCommon("deletedSuccessfully") }); },
    onError: () => { setDeleteItemId(null); toast({ variant: "destructive", title: tCommon("error"), description: tCommon("operationFailed") }); },
  });
  const explosionMutation = useMutation({
    mutationFn: async (bomId: string) => {
      const res = await apiRequest('GET', `/api/erp/bom-headers/${bomId}/explosion?quantity=1`);
      if (!res.ok) throw new Error("Explosion failed");
      return res.json();
    },
    onSuccess: (data) => { setExplosionData(data); setShowExplosion(true); toast({ title: tCommon("success") }); },
    onError: () => { toast({ variant: "destructive", title: tCommon("error"), description: tCommon("operationFailed") }); },
  });

  const toggleBOMExpansion = (bomId: string) => { const next = new Set(expandedBOMs); next.has(bomId) ? next.delete(bomId) : next.add(bomId); setExpandedBOMs(next); };
  const handleCreateBOM = (data: BOMFormValues) => createBOMMutation.mutate(data);
  const handleCreateItem = (data: ItemFormValues) => {
    if (!selectedBOM) { toast({ variant: "destructive", title: tCommon("error"), description: tCommon("required") }); return; }
    createItemMutation.mutate({ ...data, bomId: selectedBOM.header.id });
  };
  const getBOMItems = (bomId: string) => (Array.isArray(bomItems) ? bomItems : []).filter((i) => i.item.bomId === bomId);
  const filteredBOMs = (Array.isArray(bomList) ? bomList : []).filter(({ bom, product }) => {
    const q = searchTerm.toLowerCase();
    return bom.bomNumber.toLowerCase().includes(q) || product?.name?.toLowerCase().includes(q) || product?.code?.toLowerCase().includes(q);
  });
  const safeProducts = Array.isArray(products) ? products : [];

  if (bomLoading) return <div className="flex items-center justify-center h-64" data-testid="loading-spinner"><EPLoader size={32} tone="muted" /></div>;
  if (isError) return <EPErrorState onRetry={refetch} />;
  if (bomError) return <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state"><AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">{t("loadError")}</p></div>;
  if (!bomList || bomList.length === 0) return <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="empty-state"><Package className="h-12 w-12 text-muted-foreground" /><p className="text-lg font-medium">{tCommon("noData")}</p><p className="text-sm text-muted-foreground">{tCommon("noResults")}</p></div>;

  return (
    <ModulePage module="pp" title="Materiallar spesifikatsiyasi" subtitle={`Bill of Materials - ${t("bom")}`} icon={<Package className="h-5 w-5 text-primary" />}
      actions={<Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold" onClick={() => setShowBOMDialog(true)} data-testid="button-create-bom"><Plus className="h-4 w-4 mr-2" />{t("createBom")}</Button>}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`${t("orderNumber")}, ${t("productName")}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-card border-none" data-testid="input-search" />
        </div>
      </div>
      <Tabs defaultValue="list" className="w-full space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-xl inline-flex">
          <TabsTrigger value="list" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-list">{t("bom")}</TabsTrigger>
          <TabsTrigger value="tree" className="rounded-lg px-6 py-2 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-tree">{tCommon("view")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4 mt-0">
          {bomLoading ? (
            <div className="space-y-4" data-testid="skeleton-bom-list"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          ) : filteredBOMs.length === 0 ? (
            <Card className="bg-card rounded-lg border-none shadow-none"><CardContent className="py-10"><EmptyState icon={Layers} title={tCommon("noResults")} description={tCommon("noData")} action={{ label: t("createBom"), onClick: () => setShowBOMDialog(true) }} /></CardContent></Card>
          ) : filteredBOMs.map((bomData) => (
            <Card key={bomData.bom.id} className="bg-card rounded-lg border-none shadow-none hover:bg-muted/40 transition-colors" data-testid={`card-bom-${bomData.bom.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <FileText className="h-4 w-4 text-primary" />{bomData.bom.bomNumber}
                      <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", bomData.bom.status === "active" ? "bg-green-100 text-green-800" : "bg-muted/60 text-foreground")} data-testid={`badge-status-${bomData.bom.id}`}>{bomData.bom.status}</Badge>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium"><span className="font-bold text-foreground">{bomData.product?.name}</span> ({bomData.product?.code})</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none" onClick={() => explosionMutation.mutate(bomData.bom.id)} data-testid={`button-explode-${bomData.bom.id}`}><Package className="h-4 w-4 mr-2" />Explosion</Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-muted" onClick={() => setSelectedBOM({ header: bomData.bom, product: bomData.product })} data-testid={`button-manage-${bomData.bom.id}`}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteBomId(bomData.bom.id)} data-testid={`button-delete-${bomData.bom.id}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('version')}</p><p className="font-bold text-foreground" data-testid={`text-version-${bomData.bom.id}`}>v{bomData.bom.version}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{tCommon("quantity")}</p><p className="font-bold text-foreground" data-testid={`text-quantity-${bomData.bom.id}`}>{bomData.bom.baseQuantity} {bomData.bom.unit}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{tCommon("date")}</p><p className="font-bold text-foreground" data-testid={`text-effective-${bomData.bom.id}`}>{bomData.bom.effectiveDate || "—"}</p></div>
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("materials")}</p><p className="font-bold text-foreground" data-testid={`text-components-${bomData.bom.id}`}>{getBOMItems(bomData.bom.id).length}</p></div>
                </div>
                <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:bg-muted transition-all" onClick={() => toggleBOMExpansion(bomData.bom.id)} data-testid={`button-toggle-${bomData.bom.id}`}>
                  {expandedBOMs.has(bomData.bom.id) ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                  {expandedBOMs.has(bomData.bom.id) ? tCommon("showLess") : tCommon("showMore")}
                </Button>
                {expandedBOMs.has(bomData.bom.id) && (
                  <div className="mt-4 space-y-2 pt-4 border-t border-border">
                    {getBOMItems(bomData.bom.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 italic">{tCommon("noData")}</p>
                    ) : getBOMItems(bomData.bom.id).map((item) => (
                      <div key={item.item.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border" data-testid={`row-item-${item.item.id}`}>
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-bold text-foreground text-sm">{item.component?.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{item.component?.code} • {item.item.componentType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold" data-testid={`badge-qty-${item.item.id}`}>{item.item.quantity} {item.item.unit}</Badge>
                          {item.item.scrapPercentage > 0 && <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t("scrap")}: {item.item.scrapPercentage}%</Badge>}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteItemId(item.item.id)} data-testid={`button-delete-item-${item.item.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="tree">
          <Card><CardHeader><CardTitle>{t("bom")}</CardTitle><CardDescription>{t("specification")}</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">{tCommon("noData")}</p></CardContent></Card>
        </TabsContent>
      </Tabs>

      <CreateBOMDialog open={showBOMDialog} onOpenChange={setShowBOMDialog} form={bomForm} onSubmit={handleCreateBOM} isPending={createBOMMutation.isPending} products={safeProducts} />

      {selectedBOM && (
        <Dialog open={!!selectedBOM} onOpenChange={() => setSelectedBOM(null)}>
          <DialogContent className="max-w-3xl p-6" data-testid="dialog-manage-bom">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{selectedBOM.header.bomNumber} - {selectedBOM.product.name}</DialogTitle>
              <DialogDescription>{t("materials")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button onClick={() => setShowItemDialog(true)} className="w-full" data-testid="button-add-component"><Plus className="h-4 w-4 mr-2" />{tCommon("add")}</Button>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {getBOMItems(selectedBOM.header.id).map((item) => (
                  <div key={item.item.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div><p className="font-medium">{item.component?.name}</p><p className="text-sm text-muted-foreground">{item.item.quantity} {item.item.unit} • {item.item.componentType}</p></div>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteItemId(item.item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AddItemDialog open={showItemDialog} onOpenChange={setShowItemDialog} form={itemForm} onSubmit={handleCreateItem} isPending={createItemMutation.isPending} products={safeProducts} />

      <Dialog open={showExplosion} onOpenChange={setShowExplosion}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-6" data-testid="dialog-explosion">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("bomExplosion")}</DialogTitle>
            <DialogDescription>{tCommon("total")}: {explosionData?.totalComponents || 0}</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96 space-y-2">
            {explosionData?.explosion?.map((item: ExplosionItem, idx: number) => (
              <div key={idx} style={{ marginLeft: `${item.level * 24}px` }} className="p-3 border-l-2 border-muted rounded-md hover-elevate" data-testid={`explosion-item-${idx}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Package className="h-4 w-4" /><span className="font-medium">{item.componentName}</span><span className="text-sm text-muted-foreground">({item.componentCode})</span></div>
                  <div className="flex items-center gap-2"><EPStatusPill tone="neutral" data-testid={`badge-explosion-qty-${idx}`}>{item.quantity.toFixed(2)} {item.unit}</EPStatusPill><Badge variant="outline">{item.componentType}</Badge><Badge>Level {item.level}</Badge></div>
                </div>
                {item.notes && <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBomId} onOpenChange={() => setDeleteBomId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-bom">
          <AlertDialogHeader><AlertDialogTitle>{tCommon("confirmDelete")}</AlertDialogTitle><AlertDialogDescription>{tCommon("deleteWarning")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-bom">{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteBomId && deleteBOMMutation.mutate(deleteBomId)} data-testid="button-confirm-delete-bom">{tCommon("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-item">
          <AlertDialogHeader><AlertDialogTitle>{tCommon("confirmDelete")}</AlertDialogTitle><AlertDialogDescription>{tCommon("deleteWarning")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-item">{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)} data-testid="button-confirm-delete-item">{tCommon("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
