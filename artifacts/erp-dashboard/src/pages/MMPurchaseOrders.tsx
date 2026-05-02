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
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

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
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewOrder, setViewOrder] = useState<PurchaseOrderWithItems | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: purchaseOrders = [], isLoading, isError, refetch} = useQuery<PurchaseOrderWithItems[]>({
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
      toast({ description: "Xarid buyurtmasi yaratildi" });
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
        description: error.message || "Xatolik yuz berdi"
      });
    },
  });

  const deletePO = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/mm/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/purchase-orders"] });
      toast({ description: "Xarid buyurtmasi o'chirildi" });
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
        return <Badge className="bg-surface-container text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><FileText className="h-3 w-3" />Qoralama</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><Truck className="h-3 w-3" />Yuborilgan</Badge>;
      case "confirmed":
        return <Badge className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><Clock className="h-3 w-3" />Tasdiqlangan</Badge>;
      case "received":
        return <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><CheckCircle className="h-3 w-3" />Qabul qilingan</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold gap-1"><XCircle className="h-3 w-3" />Bekor qilingan</Badge>;
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
      <div className="flex-1 overflow-auto bg-surface p-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xarid"
        boldWord="Buyurtmalari"
        subtitle="Xarid buyurtmalarini boshqarish"
        data-testid="text-mm-po-title"
      />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {([
          { id: "all", label: "Barchasi", icon: ShoppingBag, color: "text-on-surface-variant" },
          { id: "draft", label: "Qoralama", icon: FileText, color: "text-on-surface-variant" },
          { id: "sent", label: "Yuborilgan", icon: Truck, color: "text-blue-500" },
          { id: "confirmed", label: "Tasdiqlangan", icon: Clock, color: "text-amber-500" },
          { id: "received", label: "Qabul qilingan", icon: CheckCircle, color: "text-green-500" },
          { id: "cancelled", label: "Bekor qilingan", icon: XCircle, color: "text-error" },
        ]).map((status) => (
          <div
            key={status.id}
            className={`cursor-pointer transition-colors p-5 rounded-lg bg-surface-container-lowest ${statusFilter === status.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(status.id)}
            data-testid={`filter-${status.id}`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{status.label}</p>
              <status.icon className={`h-4 w-4 ${status.color}`} />
            </div>
            <p className="text-4xl font-bold tracking-tight text-on-surface">{statusCounts[status.id as keyof typeof statusCounts]}</p>
          </div>
        ))}
      </div>

      <Card className="bg-surface-container-lowest border-none rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            <Package className="h-5 w-5 text-primary" />
            Xarid buyurtmalari ro'yxati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-on-surface-variant" data-testid="loading">
              Yuklanmoqda...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant" data-testid="empty-state">
              Xarid buyurtmalari topilmadi
            </div>
          ) : (
            <Table data-testid="purchase-orders-table">
              <TableHeader>
                <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">PO raqami</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yetkazuvchi</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Summa</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(filteredOrders) ? filteredOrders : []).map((order) => (
                  <TableRow key={order.id} className="hover:bg-surface-container-low transition-colors border-none">
                    <TableCell className="py-3 px-6 font-medium text-on-surface">{order.poNumber}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{getVendorName(order.vendorId)}</TableCell>
                    <TableCell className="py-3 px-6 text-on-surface">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="py-3 px-6 text-right font-semibold text-on-surface">
                      {formatCurrency(Number(order.totalAmount))} {order.currency}
                    </TableCell>
                    <TableCell className="py-3 px-6">{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} className="hover:bg-surface-container-high text-on-surface">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(order.id)} className="hover:bg-red-50 text-error">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buyurtma tafsilotlari</DialogTitle>
            <DialogDescription>
              {viewOrder?.poNumber}
            </DialogDescription>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">PO raqami</p>
                  <p className="font-medium" data-testid="view-po-number">{viewOrder.poNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yetkazib beruvchi</p>
                  <p className="font-medium" data-testid="view-vendor">{getVendorName(viewOrder.vendorId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyurtma sanasi</p>
                  <p className="font-medium" data-testid="view-order-date">{viewOrder.orderDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yetkazish sanasi</p>
                  <p className="font-medium" data-testid="view-delivery-date">{viewOrder.deliveryDate || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jami summa</p>
                  <p className="font-medium" data-testid="view-total">{formatCurrency(Number(viewOrder.totalAmount), viewOrder.currency || undefined)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holat</p>
                  <div data-testid="view-status">{getStatusBadge(viewOrder.status)}</div>
                </div>
              </div>

              {viewOrder.items && viewOrder.items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Buyurtma elementlari</h4>
                  <Table data-testid="view-items-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Xom ashyo</TableHead>
                        <TableHead>Miqdor</TableHead>
                        <TableHead>Birlik</TableHead>
                        <TableHead>Narx</TableHead>
                        <TableHead>Jami</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(viewOrder.items) ? viewOrder.items : []).map((item, index) => (
                        <TableRow key={item.id || index} data-testid={`view-item-${index}`}>
                          <TableCell>{getMaterialName(item.rawMaterialId)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{formatCurrency(Number(item.unitPrice), viewOrder.currency || undefined)}</TableCell>
                          <TableCell>{formatCurrency(Number(item.totalPrice), viewOrder.currency || undefined)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Xarid buyurtmasini o'chirish"
        description="Ushbu xarid buyurtmasini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId) deletePO.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
