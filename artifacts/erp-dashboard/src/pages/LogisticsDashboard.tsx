/**
 * @module LogisticsDashboard
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Truck, Calendar, AlertTriangle,
  RefreshCw,
  Navigation, Wrench,
} from "lucide-react";
import { LogisticsDashboardVehiclesTab, type Vehicle, type FuelLog, type Maintenance } from "./LogisticsDashboardVehiclesTab";
import { LogisticsDashboardLogisticsTab, type Delivery, type VehicleLocation, type DriverExpense, type VendorInvoice } from "./LogisticsDashboardLogisticsTab";
import { LogisticsDashboardDialogs } from "./LogisticsDashboardDialogs";
import { EPPageHeader } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
const URL_TAB_MAP: Record<string, string> = {
  "/logistics/transport": "vehicles",
  "/logistics/route-planning": "deliveries",
  "/logistics/gps": "gps",
  "/logistics/fuel": "fuel",
  "/logistics/drivers": "drivers",
  "/logistics/vehicle-schedule": "vehicles",
};

export default function LogisticsDashboard() {
  const { t } = useTranslation('common');
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
    mutationFn: (id: string) => apiRequest("PATCH", `/api/mm/vendor-invoices/${id}/match`, { tolerance: 5 }),
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
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Logistika va Transport</b></>}
        title="Logistika va Transport"
        subtitle="Transport parki · Yetkazish · Yoqilg'i · Texnik xizmat"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
              {(Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.type === "own").length} o'z · {(Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.type === "rental").length} ijara
            </Badge>
            <Button variant="outline" size="icon" onClick={() => refetchVehicles()} data-testid="button-refresh" className="hover:bg-muted text-foreground border-none">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
        data-testid="text-logistics-title"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: "Faol mashinalar", value: activeVehicles, icon: Truck, color: "text-primary" },
          { label: "Yetkazishlar (jonli)", value: activeDeliveries, icon: Navigation, color: "text-[var(--ep-blue)]" },
          { label: "Rejalashtirilgan", value: plannedDeliveries, icon: Calendar, color: "text-[var(--ep-yellow)]" },
          { label: "Ta'mirda", value: inMaintenanceCount, icon: Wrench, color: inMaintenanceCount > 0 ? "text-[var(--ep-red)]" : "text-muted-foreground" },
        ]).map((s, i) => (
          <div key={`k-${i}`} className="bg-card rounded-lg p-5" data-testid={`logistics-kpi-${i}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {urgentMaintenance.length > 0 && (
        <div className="p-4 bg-amber-100/20 border-l-4 border-amber-500 rounded-none flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[var(--ep-yellow)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Yaqin TA muddati!</p>
            <p className="text-xs text-muted-foreground">
              {(Array.isArray(urgentMaintenance) ? urgentMaintenance : []).map(v => v.plateNumber).join(", ")} — 30 kun ichida texnik xizmat kerak
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-lg flex-wrap gap-1">
          <TabsTrigger value="vehicles" data-testid="tab-vehicles" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">Transport Parki</TabsTrigger>
          <TabsTrigger value="deliveries" data-testid="tab-deliveries" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">Yetkazishlar</TabsTrigger>
          <TabsTrigger value="fuel" data-testid="tab-fuel" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">Yoqilg'i</TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">TA Tarixi</TabsTrigger>
          <TabsTrigger value="gps" data-testid="tab-gps" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">GPS Monitoring</TabsTrigger>
          <TabsTrigger value="drivers" data-testid="tab-drivers" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">Haydovchi Xarajat</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md">{t('vendorFakturalar')}</TabsTrigger>
        </TabsList>

        <LogisticsDashboardVehiclesTab
          vehicleList={Array.isArray(vehicleList) ? vehicleList : []}
          fuelLogs={Array.isArray(fuelLogs) ? fuelLogs : []}
          maintenanceList={Array.isArray(maintenanceList) ? maintenanceList : []}
          vLoading={vLoading}
          fLoading={fLoading}
          mLoading={mLoading}
          onAddVehicle={() => setAddVehicleOpen(true)}
          onAddFuel={() => setAddFuelOpen(true)}
        />

        <LogisticsDashboardLogisticsTab
          deliveries={Array.isArray(deliveries) ? deliveries : []}
          gpsLocations={Array.isArray(gpsLocations) ? gpsLocations : []}
          driverExpenses={Array.isArray(driverExpenses) ? driverExpenses : []}
          vendorInvoiceList={Array.isArray(vendorInvoiceList) ? vendorInvoiceList : []}
          dLoading={dLoading}
          gpsLoading={gpsLoading}
          driversLoading={driversLoading}
          viLoading={viLoading}
          onAddDelivery={() => setAddDeliveryOpen(true)}
          onUpdateDeliveryStatus={(id, status) => updateDeliveryStatus.mutate({ id, status })}
          isUpdatingDelivery={updateDeliveryStatus.isPending}
          onApproveInvoice={(id) => approveInvoiceMut.mutate(id)}
          onMatchInvoice={(id) => matchInvoiceMut.mutate(id)}
          isApprovingInvoice={approveInvoiceMut.isPending}
          isMatchingInvoice={matchInvoiceMut.isPending}
        />
      </Tabs>

      <LogisticsDashboardDialogs
        vehicleList={Array.isArray(vehicleList) ? vehicleList : []}
        addVehicleOpen={addVehicleOpen}
        setAddVehicleOpen={setAddVehicleOpen}
        vehicleForm={vehicleForm}
        setVehicleForm={setVehicleForm}
        onSubmitVehicle={() => addVehicleMut.mutate(vehicleForm as Record<string, string>)}
        isSubmittingVehicle={addVehicleMut.isPending}
        addFuelOpen={addFuelOpen}
        setAddFuelOpen={setAddFuelOpen}
        fuelForm={fuelForm}
        setFuelForm={setFuelForm}
        onSubmitFuel={() => addFuelMut.mutate(fuelForm as Record<string, string>)}
        isSubmittingFuel={addFuelMut.isPending}
        addDeliveryOpen={addDeliveryOpen}
        setAddDeliveryOpen={setAddDeliveryOpen}
        deliveryForm={deliveryForm}
        setDeliveryForm={setDeliveryForm}
        onSubmitDelivery={() => addDeliveryMut.mutate(deliveryForm as Record<string, string>)}
        isSubmittingDelivery={addDeliveryMut.isPending}
      />
    </div>
  );
}
