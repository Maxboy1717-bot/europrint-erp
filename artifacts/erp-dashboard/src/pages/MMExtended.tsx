import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { MessageSquare, DollarSign, Globe, Truck, Map, Navigation, Fuel, User2, Calendar, Plus, MapPin, Building2, RefreshCw, CheckCircle, PackageCheck, ShoppingCart, Bot, Gauge, Users , type LucideIcon } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface MMVendor {
    id: number | string;
    name?: string;
    code?: string;
    status?: string;
    rating?: number | string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    category?: string;
    paymentTerms?: number | string;
    country?: string;
  }
interface PurchaseOrder {
    id: number | string;
    poNumber?: string;
    orderNumber?: string;
    vendorId?: number | string;
    vendorName?: string;
    status?: string;
    totalAmount?: number | string;
    createdAt?: string;
    orderDate?: string;
    deliveryDate?: string;
    expectedDate?: string;
    currency?: string;
  }
interface GoodsReceipt {
    id: number | string;
    receiptNumber?: string;
    poNumber?: string;
    vendorId?: number | string;
    vendorName?: string;
    status?: string;
    totalAmount?: number | string;
    receiptDate?: string;
    receivedAt?: string;
    createdAt?: string;
  }
  interface MMRequisition {
    id: number | string;
    description?: string;
    status?: string;
    quantity?: number | string;
  }
  interface MMVehicle {
    id: number | string;
    plateNumber?: string;
    model?: string;
    type?: string;
    status?: string;
    driverId?: number | string;
    driverName?: string;
    driverPhone?: string;
    fuelLevel?: number | string;
    mileage?: number | string;
    insuranceExpiry?: string;
    nextServiceDate?: string;
    lastServiceDate?: string;
    year?: number | string;
  }
  interface MMDelivery {
    id: number | string;
    orderNo?: string;
    orderId?: string;
    customerName?: string;
    address?: string;
    vehicleId?: number | string;
    plateNumber?: string;
    driverName?: string;
    status?: string;
    estimatedArrival?: string;
    actualArrival?: string;
    weight?: number | string;
    cost?: number | string;
    distance?: number | string;
    createdAt?: string;
  }
  interface MMFuelLog {
    id: number | string;
    vehicleId?: number | string;
    plateNumber?: string;
    liters?: number | string;
    costPerLiter?: number | string;
    totalCost?: number | string;
    mileage?: number | string;
    date?: string;
    createdAt?: string;
  }

const URL_TAB_MAP: Record<string, string> = {
  "/mm/check-bot": "checkbot",
  "/mm/creditor-debts": "creditor",
  "/mm/supplier-portal": "portal",
  "/logistics/transport": "transport",
  "/logistics/route-planning": "routes",
  "/logistics/gps": "gps",
  "/logistics/fuel": "fuel",
  "/logistics/drivers": "drivers",
  "/logistics/vehicle-schedule": "schedule",
};

function fmtMoney(val: unknown) {
  const n = Number(val);
  if (!n) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M so'm`;
  return `${n.toLocaleString()} so'm`;
}

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "checkbot":  { title: "Chek Bot",           icon: Bot },
  "creditor":  { title: "Kreditor Qarzlar",   icon: DollarSign },
  "portal":    { title: "Supplier Portal",    icon: Building2 },
  "transport": { title: "Transport Parki",    icon: Truck },
  "routes":    { title: "Marshrut Rejasi",    icon: Map },
  "gps":       { title: "GPS Monitoring",     icon: MapPin },
  "fuel":      { title: "Yoqilg'i Nazorat",  icon: Gauge },
  "drivers":   { title: "Haydovchilar",       icon: Users },
  "schedule":  { title: "Transport Jadvali", icon: Calendar },
};

export default function MMExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "checkbot");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
  const meta = tabMeta[activeTab] || tabMeta["checkbot"];
  const { toast } = useToast();
  const [showVendorDialog, setShowVendorDialog] = useState(false);

  const vendorForm = useForm({
    defaultValues: { name: "", vendorCode: "", contactPerson: "", phone: "", email: "", paymentTerms: "30" }
  });

  // Real API queries
  const { data: vendors = [], isLoading: vendorsLoading, refetch: refetchVendors } = useQuery<MMVendor[]>({
    queryKey: ["/api/mm/vendors"],
    select: selectArray<MMVendor>,
  });

  const { data: purchaseOrders = [], isLoading: poLoading, refetch: refetchPO } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/mm/purchase-orders"],
    select: selectArray<PurchaseOrder>,
  });

  const { data: goodsReceipts = [], isLoading: grLoading } = useQuery<GoodsReceipt[]>({
    queryKey: ["/api/mm/goods-receipts"],
    select: selectArray<GoodsReceipt>,
  });

  const { data: requisitions = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/mm/purchase-requisitions"]
  });

  const createVendor = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/mm/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendors"] });
      setShowVendorDialog(false);
      vendorForm.reset();
      toast({ title: "Yetkazuvchi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  // Derived stats
  const pendingPO = (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter((po: PurchaseOrder) => po.status === "pending" || po.status === "approved");
  const overduePO = (Array.isArray(purchaseOrders) ? purchaseOrders : []).filter((po: PurchaseOrder) => {
    if (!po.deliveryDate) return false;
    return new Date(po.deliveryDate) < new Date() && po.status !== "completed";
  });
  const totalPOValue = (Array.isArray(purchaseOrders) ? purchaseOrders : []).reduce((s: number, p: PurchaseOrder) => s + Number(p.totalAmount || 0), 0);

  // Fleet API queries
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<MMVehicle[]>({
    queryKey: ["/api/mm/fleet/vehicles"]
  });
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<MMDelivery[]>({
    queryKey: ["/api/mm/fleet/deliveries"],
    select: selectArray<MMDelivery>,
  });
  const { data: fuelLogs = [], isLoading: fuelLoading } = useQuery<MMFuelLog[]>({
    queryKey: ["/api/mm/fleet/fuel-logs"]
  });

  const addVehicleMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/mm/fleet/vehicles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] });
      toast({ title: "Mashina qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="px-6 py-4 flex items-center gap-3">
        <Truck className="h-6 w-6 text-primary" />
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Ta'minot va <span className="font-bold text-primary">Logistika</span>
        </h1>
        {pendingPO.length > 0 && (
          <Badge className="bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none ml-2">
            {pendingPO.length} buyurtma kutmoqda
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 mb-4">
          <div className="bg-surface-container p-1 rounded-lg inline-flex gap-1">
            <TabsTrigger value="vendors" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">Yetkazuvchilar</TabsTrigger>
            <TabsTrigger value="po" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">Buyurtmalar</TabsTrigger>
            <TabsTrigger value="receipts" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">Qabul Aktlari</TabsTrigger>
            <TabsTrigger value="creditor" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">Kreditor Qarzlar</TabsTrigger>
            <TabsTrigger value="checkbot" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">Chek Bot</TabsTrigger>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Vendors */}
          <TabsContent value="vendors" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Yetkazuvchilar Ro'yxati</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchVendors()} className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
                </Button>
                <Button size="sm" onClick={() => setShowVendorDialog(true)} data-testid="button-add-vendor" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Yetkazuvchi Qo'shish
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Jami yetkazuvchilar", v: vendors.length, c: "text-on-surface" },
                { l: "Faol kontraktlar", v: (Array.isArray(vendors) ? vendors : []).filter((v: MMVendor) => v.status === "active" || !v.status).length, c: "text-primary" },
                { l: "So'rovlar (oy)", v: requisitions.length, c: "text-primary" },
              ]).map(s => (
                <div key={s.l} className="bg-surface-container-lowest rounded-lg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.l}</p>
                  <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-surface-container-lowest border-none rounded-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kod</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Nomi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Aloqa</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">To'lov muddati</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-on-surface-variant">Yuklanmoqda...</TableCell></TableRow>
                    ) : vendors.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-on-surface-variant">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />Yetkazuvchilar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(vendors) ? vendors : []).slice(0, 15).map((v: MMVendor) => (
                      <TableRow key={v.id} data-testid={`row-vendor-${v.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono text-sm text-on-surface">{v.code || `V-${v.id}`}</TableCell>
                        <TableCell className="py-3 px-6 font-medium text-on-surface">{v.name}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface-variant">{v.contactPerson || v.phone || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{v.paymentTerms ? `${v.paymentTerms} kun` : "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={v.status === "inactive" ? "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                            {v.status === "inactive" ? "Nofaol" : "Faol"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
              <DialogContent className="bg-surface-container-lowest border-none rounded-xl">
                <DialogHeader><DialogTitle className="text-on-surface">Yangi Yetkazuvchi</DialogTitle></DialogHeader>
                <form onSubmit={vendorForm.handleSubmit(d => createVendor.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-on-surface-variant">Nomi</Label><Input {...vendorForm.register("name")} placeholder="Kompaniya nomi" data-testid="input-vendor-name" className="bg-surface border-outline-variant text-on-surface" /></div>
                    <div className="space-y-2"><Label className="text-on-surface-variant">Kod</Label><Input {...vendorForm.register("vendorCode")} placeholder="V-001" className="bg-surface border-outline-variant text-on-surface" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-on-surface-variant">Aloqa shaxsi</Label><Input {...vendorForm.register("contactPerson")} className="bg-surface border-outline-variant text-on-surface" /></div>
                    <div className="space-y-2"><Label className="text-on-surface-variant">Telefon</Label><Input {...vendorForm.register("phone")} placeholder="+998..." className="bg-surface border-outline-variant text-on-surface" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-on-surface-variant">Email</Label><Input type="email" {...vendorForm.register("email")} className="bg-surface border-outline-variant text-on-surface" /></div>
                    <div className="space-y-2"><Label className="text-on-surface-variant">To'lov muddati (kun)</Label><Input type="number" {...vendorForm.register("paymentTerms")} className="bg-surface border-outline-variant text-on-surface" /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowVendorDialog(false)} className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">Bekor</Button>
                    <Button type="submit" disabled={createVendor.isPending} className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">Saqlash</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Purchase Orders */}
          <TabsContent value="po" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Xarid Buyurtmalari</h2>
              <Button variant="outline" size="sm" onClick={() => refetchPO()} className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Jami buyurtmalar", v: purchaseOrders.length, c: "text-on-surface" },
                { l: "Kutilmoqda", v: pendingPO.length, c: "text-primary" },
                { l: "Muddati o'tgan", v: overduePO.length, c: "text-error" },
                { l: "Jami summa", v: fmtMoney(totalPOValue), c: "text-primary" },
              ]).map(s => (
                <div key={s.l} className="bg-surface-container-lowest rounded-lg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.l}</p>
                  <p className={`text-2xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-surface-container-lowest border-none rounded-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Buyurtma №</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yetkazuvchi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Summa</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-on-surface-variant">Yuklanmoqda...</TableCell></TableRow>
                    ) : purchaseOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-on-surface-variant">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />Xarid buyurtmalari yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(purchaseOrders) ? purchaseOrders : []).slice(0, 15).map((po: PurchaseOrder) => (
                      <TableRow key={po.id} data-testid={`row-po-${po.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono text-sm text-on-surface">PO-{po.id}</TableCell>
                        <TableCell className="py-3 px-6 font-medium text-on-surface">{po.vendorName || po.vendorId || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface-variant text-sm">
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString("uz-UZ") : po.createdAt ? new Date(po.createdAt).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="py-3 px-6 font-medium text-on-surface">{fmtMoney(po.totalAmount)}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={
                            po.status === "completed" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" :
                            po.status === "approved" ? "bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" :
                            po.status === "cancelled" ? "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"
                          }>
                            {po.status === "pending" ? "Kutilmoqda" :
                             po.status === "approved" ? "Tasdiqlangan" :
                             po.status === "completed" ? "Yetkazilgan" :
                             po.status === "cancelled" ? "Bekor" : po.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goods Receipts */}
          <TabsContent value="receipts" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Qabul Aktlari (Goods Receipts)</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Bugun qabul", v: (Array.isArray(goodsReceipts) ? goodsReceipts : []).filter((r: GoodsReceipt) => { const d = new Date(r.receiptDate || r.createdAt || ""); return d.toDateString() === new Date().toDateString(); }).length, c: "text-green-600" },
                { l: "Bu oy jami", v: goodsReceipts.length, c: "text-primary" },
                { l: "QC kutmoqda", v: (Array.isArray(goodsReceipts) ? goodsReceipts : []).filter((r: GoodsReceipt) => r.status === "pending_qc").length, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Akt №</TableHead><TableHead>Yetkazuvchi</TableHead>
                    <TableHead>Sana</TableHead><TableHead>Summa</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {grLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : goodsReceipts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />Qabul aktlari yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(goodsReceipts) ? goodsReceipts : []).slice(0, 15).map((gr: GoodsReceipt) => (
                      <TableRow key={gr.id} data-testid={`row-gr-${gr.id}`}>
                        <TableCell className="font-mono text-sm">GR-{gr.id}</TableCell>
                        <TableCell className="font-medium">{gr.vendorName || gr.vendorId || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {gr.receiptDate ? new Date(gr.receiptDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell>{fmtMoney(gr.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={gr.status === "completed" ? "default" : gr.status === "pending_qc" ? "secondary" : "outline"}>
                            {gr.status === "pending_qc" ? "QC kutmoqda" : gr.status === "completed" ? "Qabul qilindi" : gr.status || "Jarayonda"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creditor */}
          <TabsContent value="creditor" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Kreditor Qarzlar</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Jami qarz (PO)", v: fmtMoney(totalPOValue), c: "text-red-600" },
                { l: "Muddati o'tgan", v: overduePO.length, c: "text-red-700" },
                { l: "Bu oyda kutilmoqda", v: pendingPO.length, c: "text-orange-600" },
                { l: "Yetkazuvchilar soni", v: vendors.length, c: "text-blue-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Yetkazuvchi</TableHead><TableHead>Qarz (PO summa)</TableHead>
                    <TableHead>Yetkazish muddati</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(purchaseOrders) ? purchaseOrders : []).filter((po: PurchaseOrder) => po.status !== "completed" && po.status !== "cancelled").slice(0, 10).map((po: PurchaseOrder) => {
                      const isOverdue = po.deliveryDate && new Date(po.deliveryDate) < new Date();
                      return (
                        <TableRow key={po.id} data-testid={`row-creditor-${po.id}`}>
                          <TableCell className="font-medium">{po.vendorName || po.vendorId || `Vendor #${po.vendorId}`}</TableCell>
                          <TableCell className="text-red-600 font-medium">{fmtMoney(po.totalAmount)}</TableCell>
                          <TableCell className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                            {po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString("uz-UZ") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isOverdue ? "destructive" : po.status === "approved" ? "default" : "outline"}>
                              {isOverdue ? "Muddati o'tgan" : po.status === "approved" ? "Tasdiqlangan" : "Kutilmoqda"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(Array.isArray(purchaseOrders) ? purchaseOrders : []).filter((po: PurchaseOrder) => po.status !== "completed" && po.status !== "cancelled").length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-60" />
                        Muddati o'tgan qarzlar yo'q
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Check Bot */}
          <TabsContent value="checkbot" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Telegram Chek Bot (OCR)</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Bugun skanerlangan", v: "—", c: "text-blue-600" },
                { l: "Umumiy xarajat", v: "—", c: "text-green-600" },
                { l: "OCR aniqligi", v: "—", c: "text-primary" },
                { l: "Tekshiruv kutmoqda", v: "—", c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Oxirgi cheklar</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Sana/Vaqt</TableHead><TableHead>Yetkazuvchi</TableHead>
                    <TableHead>Summa</TableHead><TableHead>Toifasi</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {([
                      { dt: "2026-03-18 09:15", sup: "KartonPack", sum: "1,450,000", cat: "Material", st: "Tasdiqlangan" },
                      { dt: "2026-03-18 11:30", sup: "Petrol Station", sum: "285,000", cat: "Yoqilg'i", st: "Tasdiqlangan" },
                      { dt: "2026-03-18 14:20", sup: "PoliChem", sum: "780,000", cat: "Material", st: "Tekshiruv" },
                    ]).map((r, i) => (
                      <TableRow key={`k-${i}`} data-testid={`row-check-${i}`}>
                        <TableCell className="text-sm text-muted-foreground">{r.dt}</TableCell>
                        <TableCell className="font-medium">{r.sup}</TableCell>
                        <TableCell>{r.sum} so'm</TableCell>
                        <TableCell><Badge variant="outline">{r.cat}</Badge></TableCell>
                        <TableCell><Badge variant={r.st === "Tasdiqlangan" ? "default" : "secondary"}>{r.st}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-10 w-10 text-[#229ED9]" />
                  <div>
                    <div className="font-semibold">Telegram Bot ulangan</div>
                    <div className="text-sm text-muted-foreground">@europrint_check_bot</div>
                    <div className="text-xs text-green-600 mt-1">Faol — xabar yuboring yoki chek rasmini yuklang</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplier Portal */}
          <TabsContent value="portal" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Supplier Portal</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Portal statistikasi</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {([
                    { l: "Ro'yxatdan o'tgan yetkazuvchilar", v: vendors.length },
                    { l: "Faol sessiyalar (bugun)", v: 8 },
                    { l: "Yuborilgan buyurtmalar", v: purchaseOrders.length },
                    { l: "Javob kutayotgan so'rovlar", v: requisitions.length },
                  ]).map(s => (
                    <div key={s.l} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{s.l}</span>
                      <span className="font-bold">{s.v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Portal kirish</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <ModuleSectionHeader
        moduleName="MM"
        moduleColor="text-teal-600"
        sectionTitle={meta?.title || ""}
        icon={meta?.icon || (() => null)}
      />
      <Globe className="h-8 w-8 text-blue-500 mb-2" />
                    <div className="font-semibold">suppliers.europrint.uz</div>
                    <div className="text-sm text-muted-foreground mt-1">Yetkazuvchilar tashqi portal manzili</div>
                  </div>
                  <Button className="w-full" data-testid="button-invite-supplier">
                    <Building2 className="h-4 w-4 mr-2" />Yetkazuvchi Taklif Etish
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transport */}
          <TabsContent value="transport" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transport Parki</h2>
              <Button data-testid="button-add-vehicle" onClick={() => addVehicleMutation.mutate({ plateNumber: "NEW-001", model: "Yangi mashina", type: "own", status: "idle", fuelLevel: 100, mileage: 0 })}>
                <Plus className="h-4 w-4 mr-2" />Mashina Qo'shish
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Jami transport", v: vehicles.length, c: "text-primary" },
                { l: "Yo'lda", v: (Array.isArray(vehicles) ? vehicles : []).filter((v: MMVehicle) => v.status === "on_route").length, c: "text-blue-600" },
                { l: "Bo'sh", v: (Array.isArray(vehicles) ? vehicles : []).filter((v: MMVehicle) => v.status === "idle").length, c: "text-green-600" },
                { l: "Ta'mirda", v: (Array.isArray(vehicles) ? vehicles : []).filter((v: MMVehicle) => v.status === "maintenance").length, c: "text-red-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{vehiclesLoading ? "..." : s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Davlat raqami</TableHead><TableHead>Model</TableHead>
                    <TableHead>Haydovchi</TableHead><TableHead>Holati</TableHead><TableHead>Yoqilg'i</TableHead><TableHead>Probeg</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {vehiclesLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Yuklanmoqda...</TableCell></TableRow>
                    ) : vehicles.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Transport ma'lumotlari yo'q</TableCell></TableRow>
                    ) : (Array.isArray(vehicles) ? vehicles : []).map((v: MMVehicle) => {
                      const fuelLevel = Number(v.fuelLevel || 0);
                      return (
                        <TableRow key={v.id} data-testid={`row-vehicle-${v.id}`}>
                          <TableCell className="font-medium font-mono">{v.plateNumber || "-"}</TableCell>
                          <TableCell>{v.model || "-"}</TableCell>
                          <TableCell>{v.driverName || <span className="text-muted-foreground text-xs">Tayinlanmagan</span>}</TableCell>
                          <TableCell>
                            <Badge variant={v.status === "on_route" ? "default" : v.status === "idle" ? "outline" : "secondary"}>
                              {v.status === "on_route" ? "Yo'lda" : v.status === "idle" ? "Bo'sh" : v.status === "maintenance" ? "Ta'mirda" : v.status || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded">
                                <div className={`h-1.5 rounded ${fuelLevel > 50 ? "bg-green-500" : fuelLevel > 25 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${fuelLevel}%` }} />
                              </div>
                              <span className="text-xs">{fuelLevel}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{Number(v.mileage || 0).toLocaleString()} km</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GPS */}
          <TabsContent value="gps" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">GPS Real-time Monitoring</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Harakatdagi transportlar</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {vehiclesLoading ? (
                    <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
                  ) : (Array.isArray(vehicles) ? vehicles : []).filter((v: MMVehicle) => v.status === "on_route").length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">Hozirda harakatdagi transport yo'q</div>
                  ) : (Array.isArray(vehicles) ? vehicles : []).filter((v: MMVehicle) => v.status === "on_route").map((v: MMVehicle) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <Navigation className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{v.model || v.plateNumber}</div>
                        <div className="text-xs text-muted-foreground">{v.driverName || "Haydovchi yo'q"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-green-600">{v.plateNumber}</div>
                        <div className="text-xs text-muted-foreground">GPS tracking</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="h-48 bg-muted/30 rounded-md flex items-center justify-center border border-dashed">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">GPS xarita ko'rinishi</div>
                      <div className="text-xs mt-1">{(Array.isArray(vehicles) ? vehicles : []).filter((v: MMVehicle) => v.status === "on_route").length} transport harakatda</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fuel */}
          <TabsContent value="fuel" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Yoqilg'i Nazorati</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Jami sarfi (L)", v: (Array.isArray(fuelLogs) ? fuelLogs : []).reduce((s: number, f: MMFuelLog) => s + Number(f.liters || 0), 0).toFixed(0) + " L", c: "text-orange-600" },
                { l: "Jami xarajat", v: fmtMoney((Array.isArray(fuelLogs) ? fuelLogs : []).reduce((s: number, f: MMFuelLog) => s + Number(f.totalCost || 0), 0)), c: "text-red-600" },
                { l: "Yonilg'i to'ldirish", v: fuelLogs.length + " ta", c: "text-blue-600" },
                { l: "Mashinalar soni", v: vehicles.length + " ta", c: "text-green-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{fuelLoading ? "..." : s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Mashina</TableHead><TableHead>Sana</TableHead>
                    <TableHead>Miqdor (L)</TableHead><TableHead>Narx/L</TableHead><TableHead>Jami xarajat</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {fuelLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Yuklanmoqda...</TableCell></TableRow>
                    ) : fuelLogs.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Yonilg'i ma'lumotlari yo'q</TableCell></TableRow>
                    ) : (Array.isArray(fuelLogs) ? fuelLogs : []).map((f: MMFuelLog) => (
                      <TableRow key={f.id} data-testid={`row-fuel-${f.id}`}>
                        <TableCell className="font-medium">{f.plateNumber || `Mashina #${f.vehicleId}`}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{f.date || (f.createdAt ? new Date(f.createdAt).toLocaleDateString("uz-UZ") : "-")}</TableCell>
                        <TableCell>{Number(f.liters || 0).toFixed(1)} L</TableCell>
                        <TableCell>{fmtMoney(f.costPerLiter)}/L</TableCell>
                        <TableCell className="font-medium">{fmtMoney(f.totalCost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers */}
          <TabsContent value="drivers" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Haydovchilar</h2>
              <Button data-testid="button-add-driver"><Plus className="h-4 w-4 mr-2" />Haydovchi Qo'shish</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Haydovchi</TableHead><TableHead>Transport</TableHead>
                    <TableHead>Davlat raqami</TableHead><TableHead>Holati</TableHead><TableHead>Sug'urta muddati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {vehiclesLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Yuklanmoqda...</TableCell></TableRow>
                    ) : vehicles.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Transport ma'lumotlari yo'q</TableCell></TableRow>
                    ) : (Array.isArray(vehicles) ? vehicles : []).map((v: MMVehicle, i: number) => (
                      <TableRow key={v.id} data-testid={`row-driver-${i}`}>
                        <TableCell className="font-medium">{v.driverName || <span className="text-muted-foreground text-xs">Tayinlanmagan</span>}</TableCell>
                        <TableCell>{v.model || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{v.plateNumber || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={v.status === "on_route" ? "default" : "outline"}>
                            {v.status === "on_route" ? "Yo'lda" : v.status === "idle" ? "Bo'sh" : v.status || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString("uz-UZ") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Transport Jadvali</h2>
            <Card>
              <CardHeader><CardTitle className="text-base">Yetkazish jadvali</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {deliveriesLoading ? (
                  <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
                ) : deliveries.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">Rejalashtirilgan yetkazish yo'q</div>
                ) : (Array.isArray(deliveries) ? deliveries : []).slice(0, 10).map((d: MMDelivery, i: number) => {
                  const statusMap: Record<string, string> = { delivered: "Bajarildi", in_transit: "Bajarilmoqda", planned: "Rejalashtirilgan", cancelled: "Bekor" };
                  const statusLabel = statusMap[d.status || ""] || d.status || "-";
                  const scheduledTime = d.estimatedArrival ? new Date(d.estimatedArrival).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "-";
                  return (
                    <div key={d.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50" data-testid={`row-schedule-${i}`}>
                      <span className="font-bold text-sm w-12 shrink-0">{scheduledTime}</span>
                      <Badge variant="outline" className="shrink-0 font-mono">{d.plateNumber || `#${d.vehicleId}`}</Badge>
                      <span className="text-sm flex-1">{d.customerName || "Mijoz"} — {d.address || "Manzil ko'rsatilmagan"}</span>
                      <Badge variant={d.status === "delivered" ? "default" : d.status === "in_transit" ? "secondary" : "outline"}>
                        {statusLabel}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes */}
          <TabsContent value="routes" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">AI Marshrut Rejalashtirish</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Yangi marshrut hisoblash</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {([
                    { l: "Qayerdan", p: "Toshkent, Sergeli" },
                    { l: "Qayerga", p: "Namangan shahar" },
                    { l: "Transportlar soni", p: "2" },
                    { l: "Umumiy yuk", p: "8,500 kg" },
                  ]).map(f => (
                    <div key={f.l} className="space-y-1">
                      <Label className="text-muted-foreground">{f.l}</Label>
                      <Input defaultValue={f.p} />
                    </div>
                  ))}
                  <Button className="w-full" data-testid="button-calc-route">
                    <Map className="h-4 w-4 mr-2" />Optimal Marshrut
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">AI tavsiya</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {([
                    { label: "Masofa", value: "312 km" },
                    { label: "Taxminiy vaqt", value: "4.5 soat" },
                    { label: "Yoqilg'i", value: "58 L" },
                    { label: "Xarajat", value: "649,600 so'm" },
                    { label: "Yetkazish vaqti", value: "15:30" },
                  ]).map(r => (
                    <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-bold">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
