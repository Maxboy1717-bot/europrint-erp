/**
 * @module MMExtended
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Table/Badge/Card are still needed for the vendors and PO tabs above
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Truck, Plus, Building2, RefreshCw, ShoppingCart } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import {
  URL_TAB_MAP, tabMeta, VendorSchema, fmtMoney,
  type MMVendor, type PurchaseOrder, type GoodsReceipt,
  type MMVehicle, type MMDelivery, type MMFuelLog, type VendorFormValues,
} from "./MMExtendedTypes";
import { VendorDialog } from "./MMExtendedDialogs";
import { CheckBotTab, SupplierPortalTab, GoodsReceiptsTab, CreditorTab } from "./MMExtendedTabs";
import { TransportTab, GPSTab, FuelTab, DriversTab, ScheduleTab, RoutesTab } from "./MMExtendedFleetTabs";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function MMExtended() {
  const { t } = useTranslation("common");
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "checkbot");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const meta = tabMeta[activeTab] || tabMeta["checkbot"];
  const { toast } = useToast();
  const [showVendorDialog, setShowVendorDialog] = useState(false);

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(VendorSchema),
    defaultValues: { name: "", vendorCode: "", contactPerson: "", phone: "", email: "", paymentTerms: "30" },
  });

  // ─── Queries ────────────────────────────────────────────────────────────────

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
    queryKey: ["/api/mm/purchase-requisitions"],
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<MMVehicle[]>({
    queryKey: ["/api/mm/fleet/vehicles"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<MMDelivery[]>({
    queryKey: ["/api/mm/fleet/deliveries"],
    select: selectArray<MMDelivery>,
  });

  const { data: fuelLogs = [], isLoading: fuelLoading } = useQuery<MMFuelLog[]>({
    queryKey: ["/api/mm/fleet/fuel-logs"],
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

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

  const addVehicleMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/mm/fleet/vehicles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] });
      toast({ title: "Mashina qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  // ─── Derived stats ──────────────────────────────────────────────────────────

  const safeOrders = Array.isArray(purchaseOrders) ? purchaseOrders : [];
  const pendingPO = safeOrders.filter(po => po.status === "pending" || po.status === "approved");
  const overduePO = safeOrders.filter(po => {
    if (!po.deliveryDate) return false;
    return new Date(po.deliveryDate) < new Date() && po.status !== "completed";
  });
  const totalPOValue = safeOrders.reduce((s, p) => s + Number(p.totalAmount || 0), 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 py-4 flex items-center gap-3">
        <Truck className="h-6 w-6 text-primary" />
        <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("taminotVaLogistika")}</b></>}
        title={t("taminotVaLogistika")}
      />
        {pendingPO.length > 0 && (
          <Badge className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none ml-2">
            {pendingPO.length} buyurtma kutmoqda
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 mb-4">
          <TabsList className="bg-muted/60 p-1 rounded-lg inline-flex gap-1 h-auto">
            {(["vendors", "po", "receipts", "creditor", "checkbot"] as const).map(v => (
              <TabsTrigger key={v} value={v} className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md px-4 py-2 text-sm font-medium">
                {v === "vendors" ? "Yetkazuvchilar" : v === "po" ? "Buyurtmalar" : v === "receipts" ? "Qabul Aktlari" : v === "creditor" ? "Kreditor Qarzlar" : "Chek Bot"}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">

          {/* Vendors */}
          <TabsContent value="vendors" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("yetkazuvchilarRoyxati")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchVendors()} className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
                </Button>
                <Button size="sm" onClick={() => setShowVendorDialog(true)} data-testid="button-add-vendor" className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />{t("yetkazuvchiQoshish")}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { l: "Jami yetkazuvchilar", v: vendors.length, c: "text-foreground" },
                { l: "Faol kontraktlar", v: (Array.isArray(vendors) ? vendors : []).filter((v: MMVendor) => v.status === "active" || !v.status).length, c: "text-primary" },
                { l: "So'rovlar (oy)", v: requisitions.length, c: "text-primary" },
              ]).map(s => (
                <div key={s.l} className="bg-card rounded-lg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p>
                  <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-card border-none rounded-xl">
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                      {["Kod", "Nomi", "Aloqa", "To'lov muddati", "Holati"].map(h => (
                        <TableHead key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
                    ) : vendors.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("yetkazuvchilarYoq")}
                      </TableCell></TableRow>
                    ) : (Array.isArray(vendors) ? vendors : []).slice(0, 15).map((v: MMVendor) => (
                      <TableRow key={v.id} data-testid={`row-vendor-${v.id}`} className="hover:bg-muted/40 transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono text-sm text-foreground">{v.code || `V-${v.id}`}</TableCell>
                        <TableCell className="py-3 px-6 font-medium text-foreground">{v.name}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-muted-foreground">{v.contactPerson || v.phone || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-foreground">{v.paymentTerms ? `${v.paymentTerms} kun` : "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={v.status === "inactive" ? "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                            {v.status === "inactive" ? "Nofaol" : "Faol"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
            <VendorDialog
              open={showVendorDialog}
              onOpenChange={setShowVendorDialog}
              form={vendorForm}
              onSubmit={d => createVendor.mutate(d)}
              isPending={createVendor.isPending}
            />
          </TabsContent>

          {/* Purchase Orders */}
          <TabsContent value="po" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("xaridBuyurtmalari")}</h2>
              <Button variant="outline" size="sm" onClick={() => refetchPO()} className="bg-muted/60 text-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted border-none">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />{t("refresh")}
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { l: "Jami buyurtmalar", v: purchaseOrders.length, c: "text-foreground" },
                { l: "Kutilmoqda", v: pendingPO.length, c: "text-primary" },
                { l: "Muddati o'tgan", v: overduePO.length, c: "text-[var(--ep-red)]" },
                { l: "Jami summa", v: fmtMoney(totalPOValue), c: "text-primary" },
              ]).map(s => (
                <div key={s.l} className="bg-card rounded-lg p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{s.l}</p>
                  <p className={`text-2xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-card border-none rounded-xl">
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                      {["Buyurtma №", "Yetkazuvchi", "Sana", "Summa", "Holati"].map(h => (
                        <TableHead key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</TableCell></TableRow>
                    ) : purchaseOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">
                        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />{t("xaridBuyurtmalariYoq")}
                      </TableCell></TableRow>
                    ) : safeOrders.slice(0, 15).map((po: PurchaseOrder) => (
                      <TableRow key={po.id} data-testid={`row-po-${po.id}`} className="hover:bg-muted/40 transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono text-sm text-foreground">PO-{po.id}</TableCell>
                        <TableCell className="py-3 px-6 font-medium text-foreground">{po.vendorName || po.vendorId || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-muted-foreground text-sm">
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString("uz-UZ") : po.createdAt ? new Date(po.createdAt).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="py-3 px-6 font-medium text-foreground">{fmtMoney(po.totalAmount)}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={
                            po.status === "completed" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" :
                            po.status === "approved"  ? "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" :
                            po.status === "cancelled" ? "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" :
                            "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"
                          }>
                            {po.status === "pending" ? "Kutilmoqda" : po.status === "approved" ? "Tasdiqlangan" : po.status === "completed" ? "Yetkazilgan" : po.status === "cancelled" ? "Bekor" : po.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            </Card>
          </TabsContent>

          <GoodsReceiptsTab goodsReceipts={goodsReceipts} grLoading={grLoading} />

          <CreditorTab
            purchaseOrders={purchaseOrders}
            totalPOValue={totalPOValue}
            overduePOCount={overduePO.length}
            pendingPOCount={pendingPO.length}
            vendorsCount={vendors.length}
          />

          {/* Delegated tabs */}
          <CheckBotTab />

          <SupplierPortalTab
            vendorsCount={vendors.length}
            purchaseOrdersCount={purchaseOrders.length}
            requisitionsCount={requisitions.length}
            metaTitle={meta?.title || ""}
            MetaIcon={meta?.icon || (() => null)}
            ModuleSectionHeaderComponent={ModuleSectionHeader}
          />

          <TransportTab
            vehicles={vehicles}
            vehiclesLoading={vehiclesLoading}
            onAddVehicle={() => addVehicleMutation.mutate({ plateNumber: "NEW-001", model: "Yangi mashina", type: "own", status: "idle", fuelLevel: 100, mileage: 0 })}
          />

          <GPSTab vehicles={vehicles} vehiclesLoading={vehiclesLoading} />
          <FuelTab fuelLogs={fuelLogs} vehicles={vehicles} fuelLoading={fuelLoading} />
          <DriversTab vehicles={vehicles} vehiclesLoading={vehiclesLoading} onAddDriver={() => {}} />
          <ScheduleTab deliveries={deliveries} deliveriesLoading={deliveriesLoading} />
          <RoutesTab />

        </div>
      </Tabs>
    </div>
  );
}
