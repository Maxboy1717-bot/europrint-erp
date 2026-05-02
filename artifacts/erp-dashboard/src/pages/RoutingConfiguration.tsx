import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Clock, Settings, ArrowRight, Search, Loader2, AlertCircle, Package } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";

interface Routing {
  id: string;
  routingNumber: string;
  productId: string;
  version: string;
  status: string;
  effectiveFrom: string | null;
}

interface Operation {
  id: string;
  routingId: string;
  operationNumber: string;
  operationName: string;
  workCenterId: string;
  sequence: number;
  setupTime: number;
  machineTime: number;
  laborTime: number;
  description: string | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
}

interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

const routingFormSchema = z.object({
  productId: z.string().min(1, "Mahsulotni tanlang"),
  routingNumber: z.string().min(1, "Marshrut raqamini kiriting").max(50, "Raqam 50 belgidan oshmasligi kerak"),
  version: z.string().min(1, "Versiyani kiriting").max(20, "Versiya 20 belgidan oshmasligi kerak"),
  status: z.string().min(1, "Statusni tanlang"),
  effectiveFrom: z.string().min(1, "Boshlanish sanasini kiriting"),
});

const operationFormSchema = z.object({
  operationNumber: z.string().min(1, "Operatsiya raqamini kiriting").max(50, "Raqam 50 belgidan oshmasligi kerak"),
  operationName: z.string().min(1, "Operatsiya nomini kiriting").max(200, "Nom 200 belgidan oshmasligi kerak"),
  workCenterId: z.string().min(1, "Ish markazini tanlang"),
  sequence: z.number().min(1, "Tartib raqami kamida 1 bo'lishi kerak").max(9999, "Tartib raqami 9999 dan oshmasligi kerak"),
  setupTime: z.number().min(0, "Sozlash vaqti 0 dan kam bo'lmasligi kerak"),
  machineTime: z.number().min(0, "Mashina vaqti 0 dan kam bo'lmasligi kerak"),
  laborTime: z.number().min(0, "Ish vaqti 0 dan kam bo'lmasligi kerak"),
  description: z.string().max(1000, "Tavsif 1000 belgidan oshmasligi kerak"),
});

export default function RoutingConfiguration() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [showRoutingDialog, setShowRoutingDialog] = useState(false);
  const [showOperationDialog, setShowOperationDialog] = useState(false);
  const [selectedRouting, setSelectedRouting] = useState<{ routing: Routing; product: Product } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [routingForm, setRoutingForm] = useState({
    productId: "",
    routingNumber: "",
    version: "1.0",
    status: "active",
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const [operationForm, setOperationForm] = useState({
    operationNumber: "",
    operationName: "",
    workCenterId: "",
    sequence: 10,
    setupTime: 0,
    machineTime: 0,
    laborTime: 0,
    description: "",
  });

  const { data: routings = [], isLoading: routingsLoading, error: routingsError, isError, refetch} = useQuery<Array<{ routing: Routing; product: Product }>>({
    queryKey: ['/api/erp/routings'],
  });

  const { data: operations = [] } = useQuery<Array<{ operation: Operation; workCenter: WorkCenter }>>({
    queryKey: ['/api/erp/routing-operations'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/erp/products'],
  });

  const { data: workCenters = [] } = useQuery<WorkCenter[]>({
    queryKey: ['/api/erp/work-centers'],
  });

  const createRoutingMutation = useMutation({
    mutationFn: async (data: typeof routingForm) => apiRequest('POST', '/api/erp/routings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/routings'] });
      setShowRoutingDialog(false);
      setRoutingForm({
        productId: "",
        routingNumber: "",
        version: "1.0",
        status: "active",
        effectiveFrom: new Date().toISOString().split('T')[0],
      });
      toast({ title: t('routingCreated') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: t('routingCreateError') });
    },
  });

  const createOperationMutation = useMutation({
    mutationFn: async (data: typeof operationForm & { routingId: string }) =>
      apiRequest('POST', '/api/erp/routing-operations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/routing-operations'] });
      setShowOperationDialog(false);
      setOperationForm({
        operationNumber: "",
        operationName: "",
        workCenterId: "",
        sequence: 10,
        setupTime: 0,
        machineTime: 0,
        laborTime: 0,
        description: "",
      });
      toast({ title: t('operationAdded') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: t('operationAddError') });
    },
  });

  const deleteRoutingMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/erp/routings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/routings'] });
      toast({ title: t('routingDeleted') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: t('routingDeleteError') });
    },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/erp/routing-operations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/routing-operations'] });
      toast({ title: t('operationDeleted') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: t('operationDeleteError') });
    },
  });

  const getRoutingOperations = (routingId: string) => {
    return operations
      .filter((item) => item.operation.routingId === routingId)
      .sort((a, b) => a.operation.sequence - b.operation.sequence);
  };

  const getProductName = (productId: string) => {
    const product = (Array.isArray(products) ? products : []).find((p) => p.id === productId);
    return product ? `${product.name} (${product.code})` : productId;
  };

  const getWorkCenterName = (wcId: string) => {
    const wc = (Array.isArray(workCenters) ? workCenters : []).find((w) => w.id === wcId);
    return wc ? wc.name : wcId;
  };

  const handleCreateRouting = () => {
    const validation = routingFormSchema.safeParse(routingForm);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({ variant: "destructive", title: tCommon('error'), description: firstError.message });
      return;
    }
    createRoutingMutation.mutate(routingForm);
  };

  const handleCreateOperation = () => {
    if (!selectedRouting) {
      toast({ variant: "destructive", title: tCommon('error'), description: t('fillAllFields') });
      return;
    }
    const validation = operationFormSchema.safeParse(operationForm);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({ variant: "destructive", title: tCommon('error'), description: firstError.message });
      return;
    }
    createOperationMutation.mutate({ ...operationForm, routingId: selectedRouting.routing.id });
  };

  const filteredRoutings = (Array.isArray(routings) ? routings : []).filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.routing.routingNumber.toLowerCase().includes(searchLower) ||
      item.product?.name?.toLowerCase().includes(searchLower) ||
      item.product?.code?.toLowerCase().includes(searchLower)
    );
  });

  if (routingsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }
  if (routingsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="error-state">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{t('loadError')}</p>
      </div>
    );
  }

  if (!routings || routings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2" data-testid="empty-state">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{t('noDataYet')}</p>
        <p className="text-sm text-muted-foreground">{t('addNewRecordHint')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-surface">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              Routing <span className="font-bold text-primary">Konfiguratsiyasi</span>
            </h1>
            <p className="text-on-surface-variant">{t('routingConfigDesc')}</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
          onClick={() => setShowRoutingDialog(true)} 
          data-testid="button-create-routing"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newRouting')}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder={t('searchRouting')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-surface-container-lowest border-none"
            data-testid="input-search"
          />
        </div>
      </div>

      {routingsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRoutings.length === 0 ? (
        <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
          <CardContent className="p-12 text-center text-on-surface-variant italic">
            {t('routingNotFound')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(filteredRoutings) ? filteredRoutings : []).map((routingData) => (
            <Card key={routingData.routing.id} className="bg-surface-container-lowest rounded-lg border-none shadow-none hover:bg-surface-container-low transition-colors" data-testid={`card-routing-${routingData.routing.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-on-surface">
                      <Settings className="h-5 w-5 text-primary" />
                      {routingData.routing.routingNumber}
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          routingData.routing.status === "active" ? "bg-green-100 text-green-800" : "bg-surface-container text-on-surface"
                        )}
                        data-testid={`badge-status-${routingData.routing.id}`}
                      >
                        {routingData.routing.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-on-surface-variant font-medium">
                      <span className="font-bold text-on-surface">{routingData.product?.name}</span> ({routingData.product?.code})
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
                      onClick={() => setSelectedRouting(routingData)}
                      data-testid={`button-manage-${routingData.routing.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('manageOperations')}
                    </Button>
                    <DeleteConfirmDialog
                      title={t('deleteRouting')}
                      description={tCommon('deleteWarning')}
                      onConfirm={() => deleteRoutingMutation.mutate(routingData.routing.id)}
                      isPending={deleteRoutingMutation.isPending}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-on-surface-variant hover:text-red-600 hover:bg-red-50"
                        data-testid={`button-delete-${routingData.routing.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteConfirmDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{tCommon('version')}</p>
                    <p className="font-bold text-on-surface" data-testid={`text-version-${routingData.routing.id}`}>
                      v{routingData.routing.version}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('effectiveFrom')}</p>
                    <p className="font-bold text-on-surface" data-testid={`text-effective-${routingData.routing.id}`}>
                      {routingData.routing.effectiveFrom || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{t('manageOperations')}</p>
                    <p className="font-bold text-on-surface" data-testid={`text-operations-${routingData.routing.id}`}>
                      {getRoutingOperations(routingData.routing.id).length}
                    </p>
                  </div>
                </div>

                {getRoutingOperations(routingData.routing.id).length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-outline-variant">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('operationSequence')}:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {getRoutingOperations(routingData.routing.id).map((opData, idx) => (
                        <div key={opData.operation.id} className="flex items-center gap-2">
                          <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold" data-testid={`badge-operation-${opData.operation.id}`}>
                            {opData.operation.sequence}. {opData.operation.operationName}
                          </Badge>
                          {idx < getRoutingOperations(routingData.routing.id).length - 1 && (
                            <ArrowRight className="h-3 w-3 text-on-surface-variant" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showRoutingDialog} onOpenChange={setShowRoutingDialog}>
        <DialogContent data-testid="dialog-create-routing">
          <DialogHeader>
            <DialogTitle>{t('createNewRouting')}</DialogTitle>
            <DialogDescription>{t('routingForProduct')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('routingNumberLabel')} *</Label>
                <Input
                  value={routingForm.routingNumber}
                  onChange={(e) => setRoutingForm({ ...routingForm, routingNumber: e.target.value })}
                  placeholder="RTG-001"
                  data-testid="input-routing-number"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('product')} *</Label>
                <Select value={routingForm.productId} onValueChange={(val) => setRoutingForm({ ...routingForm, productId: val })}>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder={tCommon('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(products) ? products : []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{tCommon('version')}</Label>
                <Input
                  value={routingForm.version}
                  onChange={(e) => setRoutingForm({ ...routingForm, version: e.target.value })}
                  data-testid="input-version"
                />
              </div>
              <div className="space-y-2">
                <Label>{tCommon('status')}</Label>
                <Select value={routingForm.status} onValueChange={(val) => setRoutingForm({ ...routingForm, status: val })}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{tCommon('draft')}</SelectItem>
                    <SelectItem value="active">{tCommon('active')}</SelectItem>
                    <SelectItem value="obsolete">{t('obsolete')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('effectiveFrom')}</Label>
                <Input
                  type="date"
                  value={routingForm.effectiveFrom}
                  onChange={(e) => setRoutingForm({ ...routingForm, effectiveFrom: e.target.value })}
                  data-testid="input-effective-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoutingDialog(false)} data-testid="button-cancel">
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateRouting} disabled={createRoutingMutation.isPending} data-testid="button-submit">
              {createRoutingMutation.isPending ? t('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRouting && (
        <Dialog open={!!selectedRouting} onOpenChange={() => setSelectedRouting(null)}>
          <DialogContent className="max-w-4xl" data-testid="dialog-manage-operations">
            <DialogHeader>
              <DialogTitle>
                {selectedRouting.routing.routingNumber} - {selectedRouting.product.name}
              </DialogTitle>
              <DialogDescription>{t('manageOperations')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button onClick={() => setShowOperationDialog(true)} className="w-full" data-testid="button-add-operation">
                <Plus className="h-4 w-4 mr-2" />
                {t('addOperation')}
              </Button>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {getRoutingOperations(selectedRouting.routing.id).map((opData) => (
                  <div
                    key={opData.operation.id}
                    className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                    data-testid={`row-operation-${opData.operation.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{opData.operation.sequence}</Badge>
                        <span className="font-medium">{opData.operation.operationName}</span>
                        <span className="text-sm text-muted-foreground">({opData.operation.operationNumber})</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{t('workCenter')}: {opData.workCenter?.name || "—"}</p>
                        <p className="flex items-center gap-4">
                          <span>{t('setupTimeLabel')}: {opData.operation.setupTime}</span>
                          <span>{t('machineTimeLabel')}: {opData.operation.machineTime}</span>
                          <span>{t('laborTimeLabel')}: {opData.operation.laborTime}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteOperationMutation.mutate(opData.operation.id)}
                      data-testid={`button-delete-operation-${opData.operation.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
        <DialogContent data-testid="dialog-add-operation">
          <DialogHeader>
            <DialogTitle>{t('addOperation')}</DialogTitle>
            <DialogDescription>{t('newOperationDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('operationNumber')} *</Label>
                <Input
                  value={operationForm.operationNumber}
                  onChange={(e) => setOperationForm({ ...operationForm, operationNumber: e.target.value })}
                  placeholder="OP-010"
                  data-testid="input-operation-number"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('operationName')} *</Label>
                <Input
                  value={operationForm.operationName}
                  onChange={(e) => setOperationForm({ ...operationForm, operationName: e.target.value })}
                  placeholder="Kesish"
                  data-testid="input-operation-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('workCenter')} *</Label>
              <Select value={operationForm.workCenterId} onValueChange={(val) => setOperationForm({ ...operationForm, workCenterId: val })}>
                <SelectTrigger data-testid="select-work-center">
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                    <SelectItem key={wc.id} value={wc.id}>
                      {wc.name} ({wc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('sequenceLabel')}</Label>
                <Input
                  type="number"
                  value={operationForm.sequence}
                  onChange={(e) => setOperationForm({ ...operationForm, sequence: parseInt(e.target.value) })}
                  data-testid="input-sequence"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('setupTimeLabel')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={operationForm.setupTime}
                  onChange={(e) => setOperationForm({ ...operationForm, setupTime: parseFloat(e.target.value) })}
                  data-testid="input-setup-time"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('machineTimeLabel')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={operationForm.machineTime}
                  onChange={(e) => setOperationForm({ ...operationForm, machineTime: parseFloat(e.target.value) })}
                  data-testid="input-machine-time"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('laborTimeLabel')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={operationForm.laborTime}
                  onChange={(e) => setOperationForm({ ...operationForm, laborTime: parseFloat(e.target.value) })}
                  data-testid="input-labor-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tCommon('description')}</Label>
              <Input
                value={operationForm.description}
                onChange={(e) => setOperationForm({ ...operationForm, description: e.target.value })}
                placeholder={t('additionalInfo')}
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOperationDialog(false)} data-testid="button-cancel-operation">
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreateOperation} disabled={createOperationMutation.isPending} data-testid="button-submit-operation">
              {createOperationMutation.isPending ? t('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
