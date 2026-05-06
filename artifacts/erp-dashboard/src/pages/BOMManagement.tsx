import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Package, ChevronRight, ChevronDown, Trash2, Edit, FileText, Layers, Loader2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUndoDelete } from "@/components/undo-toast";
import { ModulePage } from "@/components/ui/module-page";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/lib/i18n";
import { ErrorState } from "@/components/ui/error-state";

const bomFormSchema = z.object({
  bomNumber: z.string().optional(),
  productId: z.string().min(1, "Mahsulot tanlash majburiy"),
  version: z.string().default("1.0"),
  status: z.enum(["draft", "active", "obsolete"]).default("draft"),
  baseQuantity: z.number().min(0.01, "Miqdor 0 dan katta bo'lishi kerak"),
  unit: z.string().default("pcs"),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

const itemFormSchema = z.object({
  componentId: z.string().min(1, "Komponent tanlash majburiy"),
  quantity: z.number().min(0.01, "Miqdor 0 dan katta bo'lishi kerak"),
  unit: z.string().default("pcs"),
  componentType: z.enum(["raw", "semifinished", "purchased"]).default("raw"),
  scrapPercentage: z.number().min(0).max(100).default(0),
  position: z.number().int().positive().default(10),
  itemNumber: z.string().optional(),
  notes: z.string().optional(),
});

type BOMFormValues = z.infer<typeof bomFormSchema>;
type ItemFormValues = z.infer<typeof itemFormSchema>;

interface Product {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface BOMHeader {
  id: string;
  bomNumber: string;
  productId: string;
  version: string;
  status: string;
  baseQuantity: number;
  unit: string;
  effectiveDate: string | null;
  expiryDate: string | null;
}

interface BOMItem {
  id: string;
  bomId: string;
  componentId: string;
  quantity: number;
  unit: string;
  componentType: string;
  scrapPercentage: number;
  position: number;
  itemNumber: string;
  notes: string | null;
}

interface ExplosionItem {
  level: number;
  componentName: string;
  componentCode: string;
  quantity: number;
  unit: string;
  componentType: string;
  notes?: string;
}

interface ExplosionData {
  totalComponents?: number;
  explosion?: ExplosionItem[];
}

export default function BOMManagement() {
  const { toast } = useToast();
  const { showUndoToast } = useUndoDelete();
  const { t } = useTranslation('production');
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

  const bomForm = useForm<BOMFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
      bomNumber: "",
      productId: "",
      version: "1.0",
      status: "draft",
      baseQuantity: 1,
      unit: "pcs",
      effectiveDate: "",
      expiryDate: "",
    },
  });

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      componentId: "",
      quantity: 1,
      unit: "pcs",
      componentType: "raw",
      scrapPercentage: 0,
      position: 10,
      itemNumber: "",
      notes: "",
    },
  });

  const { data: bomList = [], isLoading: bomLoading, error: bomError, isError, refetch} = useQuery<Array<{ bom: BOMHeader; product: Product }>>({
    queryKey: ["/api/erp/bom-headers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/erp/products"],
  });

  const { data: bomItems = [] } = useQuery<Array<{ item: BOMItem; component: Product }>>({
    queryKey: ["/api/erp/bom-items"],
    enabled: !!selectedBOM,
  });

  const createBOMMutation = useMutation({
    mutationFn: (data: BOMFormValues) => apiRequest("POST", "/api/erp/bom-headers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-headers"] });
      setShowBOMDialog(false);
      bomForm.reset();
      toast({ title: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: tCommon('operationFailed') });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (data: ItemFormValues & { bomId: string }) => apiRequest("POST", "/api/erp/bom-items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-items"] });
      setShowItemDialog(false);
      itemForm.reset();
      toast({ title: tCommon('createdSuccessfully') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: tCommon('operationFailed') });
    },
  });

  const deleteBOMMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/erp/bom-headers/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-headers"] });
      setDeleteBomId(null);
      const bom = (Array.isArray(bomList) ? bomList : []).find(b => b.bom.id === id);
      showUndoToast("bom_headers", id, bom?.bom?.bomNumber || id, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-headers"] });
      });
    },
    onError: () => {
      setDeleteBomId(null);
      toast({ variant: "destructive", title: tCommon('error'), description: tCommon('operationFailed') });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/erp/bom-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/bom-items"] });
      setDeleteItemId(null);
      toast({ title: tCommon('deletedSuccessfully') });
    },
    onError: () => {
      setDeleteItemId(null);
      toast({ variant: "destructive", title: tCommon('error'), description: tCommon('operationFailed') });
    },
  });

  const explosionMutation = useMutation({
    mutationFn: async (bomId: string) => {
      const response = await fetch(`/api/erp/bom-headers/${bomId}/explosion?quantity=1`, { credentials: "include" });
      if (!response.ok) throw new Error("Explosion failed");
      return response.json();
    },
    onSuccess: (data) => {
      setExplosionData(data);
      setShowExplosion(true);
      toast({ title: tCommon('success') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: tCommon('operationFailed') });
    },
  });

  const toggleBOMExpansion = (bomId: string) => {
    const newExpanded = new Set(expandedBOMs);
    if (newExpanded.has(bomId)) {
      newExpanded.delete(bomId);
    } else {
      newExpanded.add(bomId);
    }
    setExpandedBOMs(newExpanded);
  };

  const handleCreateBOM = (data: BOMFormValues) => {
    createBOMMutation.mutate(data);
  };

  const handleCreateItem = (data: ItemFormValues) => {
    if (!selectedBOM) {
      toast({ variant: "destructive", title: tCommon('error'), description: tCommon('required') });
      return;
    }
    createItemMutation.mutate({ ...data, bomId: selectedBOM.header.id });
  };

  const getBOMItems = (bomId: string) => {
    return (Array.isArray(bomItems) ? bomItems : []).filter((item: { item: BOMItem; component: Product }) => item.item.bomId === bomId);
  };

  const getProductName = (productId: string) => {
    const product = (Array.isArray(products) ? products : []).find((p: Product) => p.id === productId);
    return product ? `${product.name} (${product.code})` : productId;
  };

  const filteredBOMs = (Array.isArray(bomList) ? bomList : []).filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.bom.bomNumber.toLowerCase().includes(searchLower) ||
      item.product?.name?.toLowerCase().includes(searchLower) ||
      item.product?.code?.toLowerCase().includes(searchLower)
    );
  });

  if (bomLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  if (bomError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{t('loadError')}</p>
      </div>
    );
  }

  if (!bomList || bomList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="empty-state">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{tCommon('noData')}</p>
        <p className="text-sm text-muted-foreground">{tCommon('noResults')}</p>
      </div>
    );
  }

  return (
    <ModulePage
      module="pp"
      title={
        <span className="text-4xl font-light tracking-tight text-on-surface">
          Materiallar <span className="font-bold text-primary">Spesifikatsiyasi</span>
        </span>
      }
      subtitle={`Bill of Materials - ${t('bom')}`}
      icon={<Package className="h-5 w-5 text-primary" />}
      actions={
        <Button 
          className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          onClick={() => setShowBOMDialog(true)} 
          data-testid="button-create-bom"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('createBom')}
        </Button>
      }
    >

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder={`${t('orderNumber')}, ${t('productName')}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-surface-container-lowest border-none"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full space-y-6">
        <TabsList className="bg-surface-container-low p-1 rounded-xl inline-flex">
          <TabsTrigger value="list" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-list">{t('bom')}</TabsTrigger>
          <TabsTrigger value="tree" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-tree">{tCommon('view')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-0">
          {bomLoading ? (
            <div className="space-y-4" data-testid="skeleton-bom-list">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredBOMs.length === 0 ? (
            <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
              <CardContent className="py-10">
                <EmptyState
                  icon={Layers}
                  title={tCommon('noResults')}
                  description={tCommon('noData')}
                  action={{
                    label: t('createBom'),
                    onClick: () => setShowBOMDialog(true),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            (Array.isArray(filteredBOMs) ? filteredBOMs : []).map((bomData) => (
              <Card key={bomData.bom.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none hover:bg-surface-container-low transition-colors" data-testid={`card-bom-${bomData.bom.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-on-surface">
                        <FileText className="h-5 w-5 text-primary" />
                        {bomData.bom.bomNumber}
                        <Badge className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          bomData.bom.status === "active" ? "bg-green-100 text-green-800" : "bg-surface-container text-on-surface"
                        )} data-testid={`badge-status-${bomData.bom.id}`}>
                          {bomData.bom.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-on-surface-variant font-medium">
                        <span className="font-bold text-on-surface">{bomData.product?.name}</span> ({bomData.product?.code})
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
                        onClick={() => explosionMutation.mutate(bomData.bom.id)}
                        data-testid={`button-explode-${bomData.bom.id}`}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Explosion
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                        onClick={() => setSelectedBOM({ header: bomData.bom, product: bomData.product })}
                        data-testid={`button-manage-${bomData.bom.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-on-surface-variant hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteBomId(bomData.bom.id)}
                        data-testid={`button-delete-${bomData.bom.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Version</p>
                      <p className="font-bold text-on-surface" data-testid={`text-version-${bomData.bom.id}`}>v{bomData.bom.version}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{tCommon('quantity')}</p>
                      <p className="font-bold text-on-surface" data-testid={`text-quantity-${bomData.bom.id}`}>
                        {bomData.bom.baseQuantity} {bomData.bom.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{tCommon('date')}</p>
                      <p className="font-bold text-on-surface" data-testid={`text-effective-${bomData.bom.id}`}>
                        {bomData.bom.effectiveDate || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('materials')}</p>
                      <p className="font-bold text-on-surface" data-testid={`text-components-${bomData.bom.id}`}>
                        {getBOMItems(bomData.bom.id).length}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-on-surface-variant hover:bg-surface-container-high transition-all"
                    onClick={() => toggleBOMExpansion(bomData.bom.id)}
                    data-testid={`button-toggle-${bomData.bom.id}`}
                  >
                    {expandedBOMs.has(bomData.bom.id) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    {expandedBOMs.has(bomData.bom.id) ? tCommon('showLess') : tCommon('showMore')}
                  </Button>

                  {expandedBOMs.has(bomData.bom.id) && (
                    <div className="mt-4 space-y-2 pt-4 border-t border-outline-variant">
                      {getBOMItems(bomData.bom.id).length === 0 ? (
                        <p className="text-sm text-on-surface-variant text-center py-4 italic">{tCommon('noData')}</p>
                      ) : (
                        <div className="space-y-2">
                          {getBOMItems(bomData.bom.id).map((item: { item: BOMItem; component: Product }) => (
                            <div
                              key={item.item.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant"
                              data-testid={`row-item-${item.item.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-bold text-on-surface text-sm">{item.component?.name}</p>
                                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
                                    {item.component?.code} • {item.item.componentType}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold" data-testid={`badge-qty-${item.item.id}`}>
                                  {item.item.quantity} {item.item.unit}
                                </Badge>
                                {item.item.scrapPercentage > 0 && (
                                  <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">{t('scrap')}: {item.item.scrapPercentage}%</Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-on-surface-variant hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteItemId(item.item.id)}
                                  data-testid={`button-delete-item-${item.item.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle>{t('bom')}</CardTitle>
              <CardDescription>{t('specification')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{tCommon('noData')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBOMDialog} onOpenChange={setShowBOMDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-bom">
          <DialogHeader>
            <DialogTitle>{t('createBom')}</DialogTitle>
            <DialogDescription>{t('bom')}</DialogDescription>
          </DialogHeader>
          <Form {...bomForm}>
            <form onSubmit={bomForm.handleSubmit(handleCreateBOM)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bomForm.control}
                  name="bomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('orderNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="BOM-001" data-testid="input-bom-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bomForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('productName')} <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product">
                            <SelectValue placeholder={tCommon('select')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Array.isArray(products) ? products : []).map((p) => (
                            <SelectItem key={p.id} value={p.id} data-testid={`option-product-${p.id}`}>
                              {p.name} ({p.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={bomForm.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('version')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-version" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bomForm.control}
                  name="baseQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('quantity')} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-base-qty"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bomForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('unit')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={bomForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('status')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{tCommon('draft')}</SelectItem>
                          <SelectItem value="active">{tCommon('active')}</SelectItem>
                          <SelectItem value="obsolete">{tCommon('archived')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bomForm.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('startDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-effective-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bomForm.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('endDate')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowBOMDialog(false)} data-testid="button-cancel">
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={createBOMMutation.isPending} data-testid="button-submit">
                  {createBOMMutation.isPending ? tCommon('loading') : tCommon('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedBOM && (
        <Dialog open={!!selectedBOM} onOpenChange={() => setSelectedBOM(null)}>
          <DialogContent className="max-w-3xl" data-testid="dialog-manage-bom">
            <DialogHeader>
              <DialogTitle>
                {selectedBOM.header.bomNumber} - {selectedBOM.product.name}
              </DialogTitle>
              <DialogDescription>{t('materials')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button onClick={() => setShowItemDialog(true)} className="w-full" data-testid="button-add-component">
                <Plus className="h-4 w-4 mr-2" />
                {tCommon('add')}
              </Button>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {getBOMItems(selectedBOM.header.id).map((item: { item: BOMItem; component: Product }) => (
                  <div key={item.item.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <p className="font-medium">{item.component?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.item.quantity} {item.item.unit} • {item.item.componentType}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteItemId(item.item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent data-testid="dialog-add-item">
          <DialogHeader>
            <DialogTitle>{tCommon('add')}</DialogTitle>
            <DialogDescription>{t('materials')}</DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleCreateItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="componentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('materials')} <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-component">
                          <SelectValue placeholder={tCommon('select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(products) ? products : []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('quantity')} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-component-qty"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('unit')}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-component-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={itemForm.control}
                name="componentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tCommon('type')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-component-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="raw">{t('rawMaterials')}</SelectItem>
                        <SelectItem value="semifinished">{t('finishedGoods')}</SelectItem>
                        <SelectItem value="purchased">{t('materials')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="scrapPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('scrap')} %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-scrap"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('position')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-position"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowItemDialog(false)} data-testid="button-cancel-item">
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={createItemMutation.isPending} data-testid="button-submit-item">
                  {createItemMutation.isPending ? tCommon('loading') : tCommon('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showExplosion} onOpenChange={setShowExplosion}>
        <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-explosion">
          <DialogHeader>
            <DialogTitle>{t('bomExplosion')}</DialogTitle>
            <DialogDescription>
              {tCommon('total')}: {explosionData?.totalComponents || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96 space-y-2">
            {explosionData?.explosion?.map((item: ExplosionItem, idx: number) => (
              <div
                key={idx}
                style={{ marginLeft: `${item.level * 24}px` }}
                className="p-3 border-l-2 border-muted rounded-md hover-elevate"
                data-testid={`explosion-item-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">{item.componentName}</span>
                    <span className="text-sm text-muted-foreground">({item.componentCode})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" data-testid={`badge-explosion-qty-${idx}`}>
                      {item.quantity.toFixed(2)} {item.unit}
                    </Badge>
                    <Badge variant="outline">{item.componentType}</Badge>
                    <Badge>Level {item.level}</Badge>
                  </div>
                </div>
                {item.notes && <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBomId} onOpenChange={() => setDeleteBomId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-bom">
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-bom">{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBomId && deleteBOMMutation.mutate(deleteBomId)}
              data-testid="button-confirm-delete-bom"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-item">
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-item">{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)}
              data-testid="button-confirm-delete-item"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
