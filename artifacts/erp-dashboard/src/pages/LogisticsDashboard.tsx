import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Truck, MapPin, Fuel, Calendar, AlertTriangle,
  Plus, Loader2, RefreshCw, Package,
  Navigation, User, Wrench, Route, DollarSign, FileText, CheckCircle, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

const URL_TAB_MAP: Record<string, string> = {
  "/logistics/transport": "vehicles",
  "/logistics/route-planning": "deliveries",
  "/logistics/gps": "gps",
  "/logistics/fuel": "fuel",
  "/logistics/drivers": "drivers",
  "/logistics/vehicle-schedule": "vehicles",
};

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  type: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  fuelLevel?: number;
  mileage?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  insuranceExpiry?: string;
  loadCapacity?: number;
  notes?: string;
}

interface FuelLog {
  id: string;
  vehicleId: string;
  plateNumber?: string;
  date: string;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  station?: string;
  mileage?: number;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  plateNumber?: string;
  type: string;
  date: string;
  cost: number;
  mileage?: number;
  nextDueDate?: string;
  workshop?: string;
  status: string;
}

interface Delivery {
  id: string;
  orderNo?: string;
  customerName?: string;
  address?: string;
  driverName?: string;
  plateNumber?: string;
  status: string;
  estimatedArrival?: string;
  weight?: number;
  cost?: number;
}

const statusLabel: Record<string, string> = {
  active: "Tayyor", on_route: "Yo'lda", maintenance: "Ta'mirda", idle: "Dam olmoqda", retired: "Hisobdan chiqarilgan",
  in_transit: "Yo'lda", delivered: "Yetkazildi", planned: "Rejalashtirilgan", failed: "Bajarilmadi", cancelled: "Bekor qilindi",
  completed: "Bajarildi", in_progress: "Jarayonda",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "secondary", on_route: "default", maintenance: "destructive", idle: "outline", retired: "outline",
  in_transit: "default", delivered: "secondary", planned: "outline", failed: "destructive", cancelled: "outline",
};

interface VehicleLocation {
  id: string;
  vehicleId?: string;
  plateNumber?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  status?: string;
  recordedAt?: string;
}

interface DriverExpense {
  id: string;
  vehicleId?: string;
  plateNumber?: string;
  driverName?: string;
  expenseType?: string;
  amount?: number;
  expenseDate?: string;
  notes?: string;
  createdAt?: string;
}

interface VendorInvoice {
  id: string;
  vendorId: string;
  vendorName?: string;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  status: string;
  matchStatus?: string;
  matchScore?: number;
  priceVariance?: number;
  quantityVariance?: number;
  createdAt?: string;
}

export default function LogisticsDashboard() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(() => URL_TAB_MAP[location] || "vehicles");
  const [addFuelOpen, setAddFuelOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const [fuelForm, setFuelForm] = useState({ vehicleId: "", date: new Date().toISOString().split("T")[0], liters: "", costPerLiter: "12500", station: "", mileage: "" });
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", model: "", type: "own", driverName: "", fuelLevel: "100", mileage: "0", loadCapacity: "", insuranceExpiry: "" });
  const [deliveryForm, setDeliveryForm] = useState({ orderNo: "", customerName: "", address: "", vehicleId: "", driverName: "", estimatedArrival: "", weight: "", cost: "" });

  const { data: vehicleList = [], isLoading: vLoading, refetch: refetchVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/mm/fleet/vehicles"],
  });

  const { data: fuelLogs = [], isLoading: fLoading } = useQuery<FuelLog[]>({
    queryKey: ["/api/mm/fleet/fuel-logs"],
    enabled: activeTab === "fuel",
  });

  const { data: maintenanceList = [], isLoading: mLoading } = useQuery<Maintenance[]>({
    queryKey: ["/api/mm/fleet/maintenance"],
    enabled: activeTab === "maintenance",
  });

  const { data: deliveries = [], isLoading: dLoading } = useQuery<Delivery[]>({
    queryKey: ["/api/mm/fleet/deliveries"],
    enabled: activeTab === "deliveries",
  });

  const { data: gpsLocations = [], isLoading: gpsLoading } = useQuery<VehicleLocation[]>({
    queryKey: ["/api/mm/vehicles/locations"],
    enabled: activeTab === "gps",
    refetchInterval: activeTab === "gps" ? 30000 : false,
  });

  const { data: driverExpenses = [], isLoading: driversLoading } = useQuery<DriverExpense[]>({
    queryKey: ["/api/mm/driver/expenses"],
    enabled: activeTab === "drivers",
  });

  const { data: vendorInvoiceList = [], isLoading: viLoading } = useQuery<VendorInvoice[]>({
    queryKey: ["/api/mm/vendor-invoices"],
    enabled: activeTab === "invoices",
  });

  const approveInvoiceMut = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/mm/vendor-invoices/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({ title: "Faktura tasdiqlandi, kreditor qarz avtomatik yaratildi" });
    },
    onError: () => toast({ title: "Tasdiqlashda xatolik", variant: "destructive" }),
  });

  const matchInvoiceMut = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/mm/vendor-invoices/${id}/match`, { tolerance: 5 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/vendor-invoices"] });
      toast({ title: "3-way match amalga oshirildi" });
    },
    onError: () => toast({ title: "Match xatolik", variant: "destructive" }),
  });

  const addVehicleMut = useMutation({
    mutationFn: (body: Record<string, string>) => apiRequest("POST", "/api/mm/fleet/vehicles", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] });
      toast({ title: "Avtomobil qo'shildi" });
      setAddVehicleOpen(false);
      setVehicleForm({ plateNumber: "", model: "", type: "own", driverName: "", fuelLevel: "100", mileage: "0", loadCapacity: "", insuranceExpiry: "" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const addFuelMut = useMutation({
    mutationFn: (body: Record<string, string>) => apiRequest("POST", "/api/mm/fleet/fuel-logs", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] });
      toast({ title: "Yoqilg'i qo'shildi" });
      setAddFuelOpen(false);
      setFuelForm({ vehicleId: "", date: new Date().toISOString().split("T")[0], liters: "", costPerLiter: "12500", station: "", mileage: "" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const addDeliveryMut = useMutation({
    mutationFn: (body: Record<string, string>) => apiRequest("POST", "/api/mm/fleet/deliveries", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] });
      toast({ title: "Yetkazib berish qo'shildi" });
      setAddDeliveryOpen(false);
      setDeliveryForm({ orderNo: "", customerName: "", address: "", vehicleId: "", driverName: "", estimatedArrival: "", weight: "", cost: "" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/mm/fleet/deliveries/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mm/fleet/vehicles"] });
    },
  });

  const activeVehicles = (Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.status === "active" || v.status === "on_route").length;
  const inMaintenanceCount = (Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.status === "maintenance").length;
  const activeDeliveries = (Array.isArray(deliveries) ? deliveries : []).filter(d => d.status === "in_transit").length;
  const plannedDeliveries = (Array.isArray(deliveries) ? deliveries : []).filter(d => d.status === "planned").length;

  const urgentMaintenance = (Array.isArray(vehicleList) ? vehicleList : []).filter(v => {
    if (!v.nextServiceDate) return false;
    const diff = (new Date(v.nextServiceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Europrint ERP · MM"
        title="Logistika va"
        boldWord="Transport"
        subtitle="Transport parki · Yetkazish · Yoqilg'i · Texnik xizmat"
        data-testid="text-logistics-title"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
              {(Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.type === "own").length} o'z · {(Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.type === "rental").length} ijara
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetchVehicles()} data-testid="button-refresh" className="hover:bg-surface-container-high text-on-surface border-none">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: "Faol mashinalar", value: activeVehicles, icon: Truck, color: "text-primary" },
          { label: "Yetkazishlar (jonli)", value: activeDeliveries, icon: Navigation, color: "text-blue-500" },
          { label: "Rejalashtirilgan", value: plannedDeliveries, icon: Calendar, color: "text-amber-500" },
          { label: "Ta'mirda", value: inMaintenanceCount, icon: Wrench, color: inMaintenanceCount > 0 ? "text-error" : "text-on-surface-variant" },
        ]).map((s, i) => (
          <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5" data-testid={`logistics-kpi-${i}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-4xl font-bold tracking-tight text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      {urgentMaintenance.length > 0 && (
        <div className="p-4 bg-amber-100/20 border-l-4 border-amber-500 rounded-none flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-on-surface">Yaqin TA muddati!</p>
            <p className="text-xs text-on-surface-variant">
              {(Array.isArray(urgentMaintenance) ? urgentMaintenance : []).map(v => v.plateNumber).join(", ")} — 30 kun ichida texnik xizmat kerak
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-surface-container p-1 rounded-lg flex-wrap gap-1">
          <TabsTrigger value="vehicles" data-testid="tab-vehicles" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">Transport Parki</TabsTrigger>
          <TabsTrigger value="deliveries" data-testid="tab-deliveries" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">Yetkazishlar</TabsTrigger>
          <TabsTrigger value="fuel" data-testid="tab-fuel" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">Yoqilg'i</TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">TA Tarixi</TabsTrigger>
          <TabsTrigger value="gps" data-testid="tab-gps" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">GPS Monitoring</TabsTrigger>
          <TabsTrigger value="drivers" data-testid="tab-drivers" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">Haydovchi Xarajat</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md">Vendor Fakturalar</TabsTrigger>
        </TabsList>

        {/* TRANSPORT PARKI */}
        <TabsContent value="vehicles">
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Mashinalar Ro'yxati
                </CardTitle>
                <Button onClick={() => setAddVehicleOpen(true)} data-testid="button-add-vehicle" className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold border-none">
                  <Plus className="w-4 h-4 mr-2" />Mashina Qo'sh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {vLoading ? (
                <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : vehicleList.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Hali mashina qo'shilmagan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Raqam</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Model</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Turi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Haydovchi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yoqilg'i</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Keyingi TA</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sug'urta</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(vehicleList) ? vehicleList : []).map(v => {
                      const nextDays = v.nextServiceDate ? Math.floor((new Date(v.nextServiceDate).getTime() - Date.now()) / 86400000) : null;
                      const insDays = v.insuranceExpiry ? Math.floor((new Date(v.insuranceExpiry).getTime() - Date.now()) / 86400000) : null;
                      return (
                        <TableRow key={v.id} data-testid={`row-vehicle-${v.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                          <TableCell className="py-3 px-6 font-mono font-medium text-on-surface">{v.plateNumber}</TableCell>
                          <TableCell className="py-3 px-6 text-on-surface">{v.model}</TableCell>
                          <TableCell className="py-3 px-6">
                            <Badge className="bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
                              {v.type === "own" ? "O'z" : v.type === "rental" ? "Ijara" : "Tashqi"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-6 text-on-surface">{v.driverName ? <span className="flex items-center gap-1"><User className="w-3 h-3 text-on-surface-variant" />{v.driverName}</span> : <span className="text-on-surface-variant">—</span>}</TableCell>
                          <TableCell className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-surface-container rounded-full h-1.5">
                                <div className={`h-full rounded-full ${(v.fuelLevel || 0) < 30 ? "bg-error" : (v.fuelLevel || 0) < 60 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${v.fuelLevel || 0}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-on-surface">{v.fuelLevel || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            {v.nextServiceDate ? (
                              <span className={`text-xs ${nextDays !== null && nextDays < 30 ? "text-error font-bold" : "text-on-surface"}`}>
                                {v.nextServiceDate}{nextDays !== null ? ` (${nextDays}k)` : ""}
                              </span>
                            ) : <span className="text-on-surface-variant">—</span>}
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            {v.insuranceExpiry ? (
                              <span className={`text-xs ${insDays !== null && insDays < 60 ? "text-error font-bold" : "text-on-surface"}`}>{v.insuranceExpiry}</span>
                            ) : <span className="text-on-surface-variant">—</span>}
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <Badge className={v.status === "maintenance" ? "bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : v.status === "on_route" ? "bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                              {statusLabel[v.status] || v.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* YETKAZISHLAR */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Yetkazish Jadvali</CardTitle>
                  <CardDescription>Faol va rejalashtirilgan yetkazishlar</CardDescription>
                </div>
                <Button onClick={() => setAddDeliveryOpen(true)} data-testid="button-add-delivery">
                  <Plus className="w-4 h-4 mr-2" />Yetkazish Qo'sh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dLoading ? (
                <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : deliveries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Hali yetkazish qo'shilmagan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyurtma</TableHead>
                      <TableHead>Mijoz</TableHead>
                      <TableHead>Manzil</TableHead>
                      <TableHead>Haydovchi</TableHead>
                      <TableHead>Mashina</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Og'irlik</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(deliveries) ? deliveries : []).map(d => (
                      <TableRow key={d.id} data-testid={`row-delivery-${d.id}`}>
                        <TableCell className="font-mono">{d.orderNo || "—"}</TableCell>
                        <TableCell className="font-medium">{d.customerName}</TableCell>
                        <TableCell className="text-sm">
                          {d.address ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.address}</span> : "—"}
                        </TableCell>
                        <TableCell>{d.driverName || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{d.plateNumber || "—"}</TableCell>
                        <TableCell className="text-sm">{d.estimatedArrival ? new Date(d.estimatedArrival).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                        <TableCell>{d.weight ? `${(d.weight / 1000).toFixed(1)} t` : "—"}</TableCell>
                        <TableCell><Badge variant={statusVariant[d.status] || "secondary"}>{statusLabel[d.status] || d.status}</Badge></TableCell>
                        <TableCell>
                          {d.status === "planned" && (
                            <Button size="sm" variant="outline" onClick={() => updateDeliveryStatus.mutate({ id: d.id, status: "in_transit" })} disabled={updateDeliveryStatus.isPending} data-testid={`button-start-delivery-${d.id}`}>
                              Yo'lga chiq
                            </Button>
                          )}
                          {d.status === "in_transit" && (
                            <Button size="sm" variant="secondary" onClick={() => updateDeliveryStatus.mutate({ id: d.id, status: "delivered" })} disabled={updateDeliveryStatus.isPending} data-testid={`button-complete-delivery-${d.id}`}>
                              Yetkazildi
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* YOQILG'I */}
        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2"><Fuel className="w-5 h-5" />Yoqilg'i Jurnali</CardTitle>
                  <CardDescription>Mashinalar yoqilg'i sarfi</CardDescription>
                </div>
                <Button onClick={() => setAddFuelOpen(true)} data-testid="button-add-fuel">
                  <Plus className="w-4 h-4 mr-2" />Yoqilg'i Qo'sh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {fLoading ? (
                <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : fuelLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Fuel className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Hali yoqilg'i yozuvi yo'q</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mashina</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Litri</TableHead>
                      <TableHead>Narxi (l)</TableHead>
                      <TableHead>Jami narx</TableHead>
                      <TableHead>Stantsiya</TableHead>
                      <TableHead>Probeg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(fuelLogs) ? fuelLogs : []).map(f => (
                      <TableRow key={f.id} data-testid={`row-fuel-${f.id}`}>
                        <TableCell className="font-mono">{f.plateNumber || f.vehicleId}</TableCell>
                        <TableCell>{f.date}</TableCell>
                        <TableCell className="font-mono">{f.liters} L</TableCell>
                        <TableCell className="font-mono">{(f.costPerLiter || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-mono">{(f.totalCost || 0).toLocaleString()} so'm</TableCell>
                        <TableCell>{f.station || "—"}</TableCell>
                        <TableCell className="font-mono">{f.mileage ? `${f.mileage.toLocaleString()} km` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TA TARIXI */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />Texnik Xizmat Tarixi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {mLoading ? (
                <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : maintenanceList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Hali ta'mirlash yozuvi yo'q</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mashina</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Xarajat</TableHead>
                      <TableHead>Probeg</TableHead>
                      <TableHead>Keyingi TA</TableHead>
                      <TableHead>Ustaxona</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(maintenanceList) ? maintenanceList : []).map(m => (
                      <TableRow key={m.id} data-testid={`row-maintenance-${m.id}`}>
                        <TableCell className="font-mono">{m.plateNumber || m.vehicleId}</TableCell>
                        <TableCell>{m.type}</TableCell>
                        <TableCell>{m.date}</TableCell>
                        <TableCell className="font-mono">{(m.cost || 0).toLocaleString()} so'm</TableCell>
                        <TableCell className="font-mono">{m.mileage ? `${m.mileage.toLocaleString()} km` : "—"}</TableCell>
                        <TableCell>{m.nextDueDate || "—"}</TableCell>
                        <TableCell>{m.workshop || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* GPS MONITORING */}
        <TabsContent value="gps">
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  GPS Monitoring — Jonli Joylashuv
                </CardTitle>
                <Badge className="bg-primary-container text-on-primary-container rounded-full px-3 py-0.5 text-xs border-none">
                  {gpsLocations.length} mashina
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {gpsLoading ? (
                <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : gpsLocations.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">GPS ma'lumotlari mavjud emas</p>
                  <p className="text-sm mt-1 opacity-70">Mashinalar GPS qurilmasi orqali ulanganda joylashuv ko'rinadi</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mashina</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kenglik</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Uzunlik</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tezlik</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Vaqt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(gpsLocations) ? gpsLocations : []).map(loc => (
                      <TableRow key={loc.id} data-testid={`row-gps-${loc.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono font-medium text-on-surface">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${loc.status === "moving" ? "bg-primary" : loc.status === "idle" ? "bg-amber-500" : "bg-on-surface-variant"}`} />
                            {loc.plateNumber || loc.vehicleId || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-6 font-mono text-sm text-on-surface">{loc.latitude?.toFixed(6) || "—"}</TableCell>
                        <TableCell className="py-3 px-6 font-mono text-sm text-on-surface">{loc.longitude?.toFixed(6) || "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{loc.speed != null ? `${loc.speed} km/h` : "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={loc.status === "moving" ? "bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                            {loc.status === "moving" ? "Harakatda" : loc.status === "idle" ? "To'xtagan" : loc.status || "Noma'lum"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface-variant">
                          {loc.recordedAt ? new Date(loc.recordedAt).toLocaleTimeString("uz-UZ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HAYDOVCHI XARAJATLARI */}
        <TabsContent value="drivers">
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Haydovchi Xarajatlari
                </CardTitle>
                <div className="text-sm font-semibold text-on-surface-variant">
                  Jami: {((Array.isArray(driverExpenses) ? driverExpenses : []).reduce((s, e) => s + (Number(e.amount) || 0), 0)).toLocaleString()} so'm
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {driversLoading ? (
                <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : driverExpenses.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Haydovchi xarajatlari yo'q</p>
                  <p className="text-sm mt-1 opacity-70">Haydovchilar xarajatlari qayd etilmagan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Haydovchi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mashina</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Xarajat turi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Miqdor</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(driverExpenses) ? driverExpenses : []).map(exp => (
                      <TableRow key={exp.id} data-testid={`row-driver-expense-${exp.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-medium text-on-surface">{exp.driverName || "—"}</TableCell>
                        <TableCell className="py-3 px-6 font-mono text-sm text-on-surface">{exp.plateNumber || exp.vehicleId || "—"}</TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className="bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
                            {exp.expenseType || "Boshqa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 font-mono font-medium text-on-surface">{exp.amount ? `${Number(exp.amount).toLocaleString()} so'm` : "—"}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface">{exp.expenseDate || (exp.createdAt ? new Date(exp.createdAt).toLocaleDateString("uz-UZ") : "—")}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface-variant">{exp.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* VENDOR FAKTURALARI */}
        <TabsContent value="invoices">
          <Card className="bg-surface-container-lowest border-none rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Vendor Fakturalari — 3-Way Match
              </CardTitle>
              <CardDescription className="text-xs text-on-surface-variant">PO + GR + Faktura moslik tekshiruvi va kreditor qarz boshqaruvi</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {viLoading ? (
                <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full" />)}</div>
              ) : vendorInvoiceList.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">Vendor fakturalar topilmadi</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-container hover:bg-surface-container border-none">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Faktura #</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yetkazuvchi</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sana</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Summa</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Match</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(vendorInvoiceList) ? vendorInvoiceList : []).map(inv => (
                      <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-surface-container-low transition-colors border-none">
                        <TableCell className="py-3 px-6 font-mono font-medium text-on-surface">{inv.invoiceNumber}</TableCell>
                        <TableCell className="py-3 px-6 text-on-surface">{inv.vendorName || inv.vendorId}</TableCell>
                        <TableCell className="py-3 px-6 text-sm text-on-surface-variant">{inv.invoiceDate}</TableCell>
                        <TableCell className="py-3 px-6 font-medium text-on-surface">
                          {Number(inv.totalAmount).toLocaleString()} {inv.currency}
                        </TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={
                            inv.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none rounded-full text-xs px-2.5 py-0.5" :
                            inv.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-none rounded-full text-xs px-2.5 py-0.5" :
                            "bg-surface-container text-on-surface-variant border-none rounded-full text-xs px-2.5 py-0.5"
                          }>
                            {inv.status === "approved" ? "Tasdiqlangan" : inv.status === "rejected" ? "Rad etilgan" : "Kutilmoqda"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6">
                          <Badge className={
                            inv.matchStatus === "matched" ? "bg-primary-container text-on-primary-container border-none rounded-full text-xs px-2.5 py-0.5" :
                            inv.matchStatus === "partial" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none rounded-full text-xs px-2.5 py-0.5" :
                            "bg-surface-container text-on-surface-variant border-none rounded-full text-xs px-2.5 py-0.5"
                          }>
                            {inv.matchStatus === "matched" ? "Mos" : inv.matchStatus === "partial" ? "Qisman" : "Tekshirilmagan"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            {inv.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveInvoiceMut.mutate(inv.id)}
                                disabled={approveInvoiceMut.isPending}
                                data-testid={`button-approve-invoice-${inv.id}`}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Tasdiqlash
                              </Button>
                            )}
                            {inv.purchaseOrderId && inv.matchStatus !== "matched" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => matchInvoiceMut.mutate(inv.id)}
                                disabled={matchInvoiceMut.isPending}
                                data-testid={`button-match-invoice-${inv.id}`}
                              >
                                3-Way Match
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mashina Qo'shish */}
      <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mashina Qo'shish</DialogTitle>
            <DialogDescription>Transport parkiga yangi avtomobil qo'shing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Davlat raqami *</label>
              <Input value={vehicleForm.plateNumber} onChange={e => setVehicleForm(p => ({ ...p, plateNumber: e.target.value }))} placeholder="01 A 123 AA" data-testid="input-vehicle-plate" />
            </div>
            <div>
              <label className="text-sm font-medium">Model *</label>
              <Input value={vehicleForm.model} onChange={e => setVehicleForm(p => ({ ...p, model: e.target.value }))} placeholder="MAN TGS 18.400" data-testid="input-vehicle-model" />
            </div>
            <div>
              <label className="text-sm font-medium">Turi</label>
              <Select value={vehicleForm.type} onValueChange={v => setVehicleForm(p => ({ ...p, type: v }))}>
                <SelectTrigger data-testid="select-vehicle-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">O'z transport</SelectItem>
                  <SelectItem value="rental">Ijara</SelectItem>
                  <SelectItem value="external">Tashqi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Haydovchi</label>
              <Input value={vehicleForm.driverName} onChange={e => setVehicleForm(p => ({ ...p, driverName: e.target.value }))} placeholder="Raximov Sardor" data-testid="input-vehicle-driver" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Sug'urta muddati</label>
                <Input type="date" value={vehicleForm.insuranceExpiry} onChange={e => setVehicleForm(p => ({ ...p, insuranceExpiry: e.target.value }))} data-testid="input-vehicle-insurance" />
              </div>
              <div>
                <label className="text-sm font-medium">Yuk ko'tarish (kg)</label>
                <Input type="number" value={vehicleForm.loadCapacity} onChange={e => setVehicleForm(p => ({ ...p, loadCapacity: e.target.value }))} placeholder="5000" data-testid="input-vehicle-capacity" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVehicleOpen(false)}>Bekor</Button>
            <Button onClick={() => addVehicleMut.mutate(vehicleForm as Record<string, string>)} disabled={addVehicleMut.isPending} data-testid="button-submit-vehicle">
              {addVehicleMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yoqilg'i Dialog */}
      <Dialog open={addFuelOpen} onOpenChange={setAddFuelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yoqilg'i Qo'shish</DialogTitle>
            <DialogDescription>Mashina yoqilg'i sarfini qayd eting</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Mashina *</label>
              <Select value={fuelForm.vehicleId} onValueChange={v => setFuelForm(p => ({ ...p, vehicleId: v }))}>
                <SelectTrigger data-testid="select-fuel-vehicle"><SelectValue placeholder="Mashinani tanlang" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(vehicleList) ? vehicleList : []).map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} — {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Sana *</label>
              <Input type="date" value={fuelForm.date} onChange={e => setFuelForm(p => ({ ...p, date: e.target.value }))} data-testid="input-fuel-date" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Litri *</label>
                <Input type="number" value={fuelForm.liters} onChange={e => setFuelForm(p => ({ ...p, liters: e.target.value }))} placeholder="120" data-testid="input-fuel-liters" />
              </div>
              <div>
                <label className="text-sm font-medium">Narxi (so'm/l)</label>
                <Input type="number" value={fuelForm.costPerLiter} onChange={e => setFuelForm(p => ({ ...p, costPerLiter: e.target.value }))} data-testid="input-fuel-price" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Stantsiya *</label>
              <Input value={fuelForm.station} onChange={e => setFuelForm(p => ({ ...p, station: e.target.value }))} placeholder="Lukoil Yunusobod" data-testid="input-fuel-station" />
            </div>
            <div>
              <label className="text-sm font-medium">Probeg (km)</label>
              <Input type="number" value={fuelForm.mileage} onChange={e => setFuelForm(p => ({ ...p, mileage: e.target.value }))} placeholder="125400" data-testid="input-fuel-mileage" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFuelOpen(false)}>Bekor</Button>
            <Button onClick={() => addFuelMut.mutate(fuelForm as Record<string, string>)} disabled={addFuelMut.isPending} data-testid="button-submit-fuel">
              {addFuelMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yetkazish Dialog */}
      <Dialog open={addDeliveryOpen} onOpenChange={setAddDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yetkazib Berish Qo'shish</DialogTitle>
            <DialogDescription>Yangi yetkazib berish rejalashtiring</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Buyurtma raqami</label>
              <Input value={deliveryForm.orderNo} onChange={e => setDeliveryForm(p => ({ ...p, orderNo: e.target.value }))} placeholder="SO-2026-001" data-testid="input-delivery-order" />
            </div>
            <div>
              <label className="text-sm font-medium">Mijoz *</label>
              <Input value={deliveryForm.customerName} onChange={e => setDeliveryForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Alif Nashriyot" data-testid="input-delivery-customer" />
            </div>
            <div>
              <label className="text-sm font-medium">Manzil</label>
              <Input value={deliveryForm.address} onChange={e => setDeliveryForm(p => ({ ...p, address: e.target.value }))} placeholder="Yunusobod, Toshkent" data-testid="input-delivery-address" />
            </div>
            <div>
              <label className="text-sm font-medium">Mashina</label>
              <Select value={deliveryForm.vehicleId} onValueChange={v => {
                const veh = (Array.isArray(vehicleList) ? vehicleList : []).find(x => x.id === v);
                setDeliveryForm(p => ({ ...p, vehicleId: v, driverName: veh?.driverName || p.driverName }));
              }}>
                <SelectTrigger data-testid="select-delivery-vehicle"><SelectValue placeholder="Mashinani tanlang" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.status !== "maintenance" && v.status !== "retired").map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} — {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Haydovchi</label>
              <Input value={deliveryForm.driverName} onChange={e => setDeliveryForm(p => ({ ...p, driverName: e.target.value }))} placeholder="Raximov Sardor" data-testid="input-delivery-driver" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">ETA</label>
                <Input type="datetime-local" value={deliveryForm.estimatedArrival} onChange={e => setDeliveryForm(p => ({ ...p, estimatedArrival: e.target.value }))} data-testid="input-delivery-eta" />
              </div>
              <div>
                <label className="text-sm font-medium">Og'irlik (kg)</label>
                <Input type="number" value={deliveryForm.weight} onChange={e => setDeliveryForm(p => ({ ...p, weight: e.target.value }))} placeholder="2400" data-testid="input-delivery-weight" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeliveryOpen(false)}>Bekor</Button>
            <Button onClick={() => addDeliveryMut.mutate(deliveryForm as Record<string, string>)} disabled={addDeliveryMut.isPending} data-testid="button-submit-delivery">
              {addDeliveryMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
