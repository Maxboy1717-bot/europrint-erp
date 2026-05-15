/**
 * @module MMPurchaseOrders
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingBag, Eye, Package, Truck, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PurchaseOrder, Vendor, RawMaterial, PurchaseOrderItem } from "@shared/schema";
import { z } from "zod";
import { PageState } from "@/components/ui/page-state";
import { EPPageHeader, EPErrorState } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";
const poFormSchema = z.object({
  poNumber: z.string().optional().default(""),
  vendorId: z.string().min(1, "Yetkazib beruvchi kerak"),
  orderDate: z.string().min(1, "Buyurtma sanasi kerak"),
  deliveryDate: z.string().optional(),
  currency: z.string().default("UZS"),
  items: z.array(z.object({
    rawMaterialId: z.string().min(1, "Xom ashyo kerak"),
    quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
    unit: z.string().min(1, "O'lchov birligi kerak"),
    unitPrice: z.number().nonnegative("Narx manfiy bo'lmasligi kerak"),
  })).min(1, "Kamida bitta element kerak"),
});

type POFormValues = z.infer<typeof poFormSchema>;

interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: PurchaseOrderItem[];
  vendor?: Vendor;
}

export default function MMPurchaseOrders() {
  const { t } = useTranslation("warehouse");
  const { t: tCommon } = useTranslation("common");
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewOrder, setViewOrder] = useState<PurchaseOrderWithItems | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: purchaseOrders = [], isLoading, isError, error, refetch} = useQuery<PurchaseOrderWithItems[]>({
    queryKey: ["/api/mm/purchase-orders"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/mm/vendors"],
  });

  const { data: rawMaterials = [] } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  const form = useForm<POFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      poNumber: "",
      vendorId: "",
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: "",
      currency: "UZS",
      items: [{ rawMaterialId: "", quantity: 1, unit: "kg", unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createPO = useMutation({
    mutationFn: async (data: POFormValues) => {
      const totalAmount = data.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      await apiRequest("POST", "/api/mm/purchase-orders", {
        ...data,
        totalAmount,
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/purchase-orders"] });
      toast({ description: t("mm.toastCreated") });
      setOpenDialog(false);
      form.reset({
        poNumber: "",
        vendorId: "",
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: "",
        currency: "UZS",
        items: [{ rawMaterialId: "", quantity: 1, unit: "kg", unitPrice: 0 }],
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        description: error.message || tCommon("errorOccurred")
      });
    },
  });

  const deletePO = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/mm/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/purchase-orders"] });
      toast({ description: t("mm.toastDeleted") });
    },
  });

  const handleViewOrder = async (order: PurchaseOrderWithItems) => {
    try {
      const data = await apiRequest<PurchaseOrderWithItems>("GET", `/api/mm/purchase-orders/${order.id}`);
      setViewOrder(data);
      setViewDialogOpen(true);
    } catch {
      setViewOrder(order);
      setViewDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><FileText className="h-3 w-3" />{t("mm.statusDraft")}</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><Truck className="h-3 w-3" />{t("mm.statusSent")}</Badge>;
      case "confirmed":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><Clock className="h-3 w-3" />{t("mm.statusConfirmed")}</Badge>;
      case "received":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><CheckCircle className="h-3 w-3" />{t("mm.statusReceived")}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><XCircle className="h-3 w-3" />{t("mm.statusCancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return "-";
    const vendor = (Array.isArray(vendors) ? vendors : []).find(v => v.id === vendorId);
    return vendor?.name || "-";
  };

  const getMaterialName = (materialId: string | null) => {
    if (!materialId) return "-";
    const material = (Array.isArray(rawMaterials) ? rawMaterials : []).find(m => m.id === materialId);
    return material?.name || "-";
  };

  const filteredOrders = statusFilter === "all"
    ? purchaseOrders
    : (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(o => o.status === statusFilter);

  const statusCounts = {
    all: purchaseOrders.length,
    draft: (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(o => o.status === "draft").length,
    sent: (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(o => o.status === "sent").length,
    confirmed: (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(o => o.status === "confirmed").length,
    received: (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(o => o.status === "received").length,
    cancelled: (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter(o => o.status === "cancelled").length,
  };

  if (isError) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <EPErrorState onRetry={refetch}  error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EPPageHeader
        breadcrumb={<>{tCommon("dashboard")} · <b className="text-foreground">{t("mm.purchaseOrdersTitle")}</b></>}
        title={t("mm.purchaseOrdersTitle")}
        subtitle={t("mm.purchaseOrdersSubtitle")}
        data-testid="text-mm-po-title"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {([
          { id: "all",       label: tCommon("all"),         icon: ShoppingBag, color: "text-muted-foreground" },
          { id: "draft",     label: t("mm.statusDraft"),     icon: FileText,    color: "text-muted-foreground" },
          { id: "sent",      label: t("mm.statusSent"),      icon: Truck,       color: "text-[var(--ep-blue)]" },
          { id: "confirmed", label: t("mm.statusConfirmed"), icon: Clock,       color: "text-[var(--ep-yellow)]" },
          { id: "received",  label: t("mm.statusReceived"),  icon: CheckCircle, color: "text-[var(--ep-green)]" },
          { id: "cancelled", label: t("mm.statusCancelled"), icon: XCircle,     color: "text-[var(--ep-red)]" },
        ]).map((status) => (
          <div
            key={status.id}
            className={`cursor-pointer transition-colors p-5 rounded-lg bg-card ${statusFilter === status.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(status.id)}
            data-testid={`filter-${status.id}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{status.label}</p>
              <status.icon className={`h-4 w-4 ${status.color}`} />
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">{statusCounts[status.id as keyof typeof statusCounts]}</p>
          </div>
        ))}
      </div>

      <Card className="bg-card border-none rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Package className="h-5 w-5 text-primary" />
            {t("mm.poListTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PageState
            isLoading={isLoading}
            isError={isError}
            isEmpty={filteredOrders.length === 0}
            onRetry={refetch}
            skeleton="table"
            skeletonRows={5}
            skeletonColumns={6}
            errorTitle={t("mm.errorLoadTitle")}
            errorMessage={t("mm.errorLoadMessage")}
            emptyIcon={Package}
            emptyTitle={t("mm.emptyTitle")}
            emptyDescription={t("mm.emptyDescription")}
          >
            <div className="ep-table-scroll"><Table data-testid="purchase-orders-table">
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mm.poNumber")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mm.vendor")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mm.date")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("mm.amount")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mm.status")}</TableHead>
                  <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right">{t("mm.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredOrders) ? filteredOrders : []).map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/40 transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-foreground">{order.poNumber}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{getVendorName(order.vendorId)}</TableCell>
                    <TableCell className="py-3 px-6 text-foreground">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="py-3 px-6 text-right font-semibold text-foreground">
                      {formatCurrency(Number(order.totalAmount))} {order.currency}
                    </TableCell>
                    <TableCell className="py-3 px-6">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} className="hover:bg-muted text-foreground">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)} className="hover:bg-red-50 text-[var(--ep-red)]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </PageState>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("mm.viewTitle")}</DialogTitle>
            <DialogDescription>
              {viewOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("mm.poNumber")}</p>
                  <p className="font-medium" data-testid="view-po-number">{viewOrder.poNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("mm.vendor")}</p>
                  <p className="font-medium" data-testid="view-vendor">{getVendorName(viewOrder.vendorId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("mm.orderDate")}</p>
                  <p className="font-medium" data-testid="view-order-date">{viewOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("mm.deliveryDate")}</p>
                  <p className="font-medium" data-testid="view-delivery-date">{viewOrder.deliveryDate || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("mm.totalAmount")}</p>
                  <p className="font-medium" data-testid="view-total">{formatCurrency(Number(viewOrder.totalAmount), viewOrder.currency || undefined)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("mm.status")}</p>
                  <div data-testid="view-status">{getStatusBadge(viewOrder.status)}</div>
                </div>
              </div>

              {viewOrder.items && viewOrder.items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t("mm.orderItems")}</h4>
                  <div className="ep-table-scroll"><Table data-testid="view-items-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("mm.rawMaterial")}</TableHead>
                        <TableHead>{t("mm.quantity")}</TableHead>
                        <TableHead>{t("mm.unit")}</TableHead>
                        <TableHead>{t("mm.price")}</TableHead>
                        <TableHead>{t("mm.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(viewOrder.items) ? viewOrder.items : []).map((item, index) => (
                        <TableRow key={item.id || index} data-testid={`view-item-${index}`} className="hover:bg-muted/40 transition-colors">
                          <TableCell>{getMaterialName(item.rawMaterialId)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{formatCurrency(Number(item.unitPrice), viewOrder.currency || undefined)}</TableCell>
                          <TableCell>{formatCurrency(Number(item.totalPrice), viewOrder.currency || undefined)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {tCommon("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title={t("mm.confirmDeleteTitle")}
        description={t("mm.confirmDeleteDesc")}
        confirmText={tCommon("delete")}
        cancelText={tCommon("cancel")}
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId) deletePO.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
