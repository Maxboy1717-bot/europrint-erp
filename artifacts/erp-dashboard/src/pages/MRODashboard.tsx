import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench, Package, AlertTriangle, CheckCircle, Clock, Plus, Settings, Calendar, TrendingDown, Zap, Droplets, Flame, Building2, Trash2, UtensilsCrossed, Shirt, Activity, BarChart3, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface MroItem { id: string; itemCode?: string; name?: string; category?: string; unit?: string; minStock?: number; currentStock?: number; unitCost?: number; isActive?: boolean }
interface MroRequest { id: string; requestNumber?: string; status?: string; requestedQuantity?: number; purpose?: string; department?: string; item?: { name?: string }; requester?: { fullName?: string } }
interface MroEquipment { id: string; equipmentName?: string; equipmentCode?: string; maintenanceType?: string; nextMaintenanceDate?: string; status?: string }
interface MroStats { items?: { totalItems?: number; lowStockItems?: number }; requests?: { status: string; count: number }[]; equipment?: { status: string; count: number }[] }
interface MroBudget { id: string; name?: string; budgetAmount?: number; usedAmount?: number; period?: string }
interface MroCleaningSchedule { id: string; area: string; frequency: string; lastCleaned: string | null; nextCleaning: string | null; responsible: string; status: string; notes: string | null }

interface MroUtilityReading {
  id: string; utilityType?: string; unit?: string; readingDate?: string;
  todayValue?: number; yesterdayValue?: number; monthTotal?: number;
  monthBudget?: number; trendPercent?: number; notes?: string;
}
interface MroFacility {
  id: string; name?: string; facilityType?: string; areaM2?: number;
  capacity?: number; status?: string; lastInspection?: string; nextInspection?: string;
  responsible?: string; notes?: string;
}

const mroItemFormSchema = z.object({
  itemCode: z.string().min(1, "Kodni kiriting").max(50, "Kod 50 belgidan oshmasligi kerak"),
  name: z.string().min(1, "Nomini kiriting").max(200, "Nom 200 belgidan oshmasligi kerak"),
  nameRu: z.string().max(200, "Nom 200 belgidan oshmasligi kerak").optional().or(z.literal("")),
  category: z.string().min(1, "Kategoriya tanlang"),
  unit: z.string().min(1, "Birlikni kiriting").max(50, "Birlik 50 belgidan oshmasligi kerak"),
  minStock: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Min zaxira 0 dan kam bo'lmasligi kerak"),
  currentStock: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Joriy zaxira 0 dan kam bo'lmasligi kerak"),
  unitCost: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Narx 0 dan kam bo'lmasligi kerak"),
});

const mroRequestFormSchema = z.object({
  itemId: z.string().min(1, "Buyumni tanlang"),
  requestedQuantity: z.string().min(1, "Miqdorni kiriting").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Miqdor musbat bo'lishi kerak"),
  purpose: z.string().min(1, "Maqsadni kiriting").max(500, "Maqsad 500 belgidan oshmasligi kerak"),
  department: z.string().min(1, "Bo'limni kiriting").max(200, "Bo'lim 200 belgidan oshmasligi kerak"),
});

export default function MRODashboard() {
  const { toast } = useToast();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const itemForm = useForm({ resolver: zodResolver(mroItemFormSchema), defaultValues: { itemCode: "", name: "", nameRu: "", category: "cleaning", unit: "dona", minStock: "5", currentStock: "0", unitCost: "0" } });
  const requestForm = useForm({ resolver: zodResolver(mroRequestFormSchema), defaultValues: { itemId: "", requestedQuantity: "", purpose: "", department: "" } });

  const { data: items, isError: itemsError, refetch: refetchItems } = useQuery<MroItem[]>({ queryKey: ["/api/integration/mro/items"] });
  const { data: requests } = useQuery<MroRequest[]>({ queryKey: ["/api/integration/mro/requests"] });
  const { data: equipment } = useQuery<MroEquipment[]>({ queryKey: ["/api/integration/mro/equipment"] });
  const { data: stats } = useQuery<MroStats>({ queryKey: ["/api/integration/mro/stats"] });
  const { data: budgets } = useQuery<MroBudget[]>({ queryKey: ["/api/integration/mro/budgets"] });
  const { data: cleaningSchedule = [] } = useQuery<MroCleaningSchedule[]>({ queryKey: ["/api/integration/mro/cleaning-schedules"] });
  const { data: utilityData = [], isLoading: utilityLoading } = useQuery<MroUtilityReading[]>({
    queryKey: ["/api/integration/mro/utility-readings"]
  });
  const { data: buildingRooms = [], isLoading: facilitiesLoading } = useQuery<MroFacility[]>({
    queryKey: ["/api/integration/mro/facilities"]
  });
  const { data: ppeItems = [] } = useQuery<MroItem[]>({
    queryKey: ["/api/integration/mro/items", { category: "ppe" }],
    queryFn: () => fetch("/api/integration/mro/items?category=ppe", { credentials: "include" }).then(r => r.json()),
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mroItemFormSchema>) => {
      const res = await apiRequest("POST", "/api/integration/mro/items", { ...data, minStock: parseFloat(data.minStock), currentStock: parseFloat(data.currentStock), unitCost: parseFloat(data.unitCost) });
      return res;
    },
    onSuccess: () => {
      toast({ title: "MRO buyum yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/mro"] });
      setItemDialogOpen(false);
      itemForm.reset();
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mroRequestFormSchema>) => {
      const res = await apiRequest("POST", "/api/integration/mro/requests", { ...data, requestedQuantity: parseFloat(data.requestedQuantity) });
      return res;
    },
    onSuccess: () => {
      toast({ title: "MRO so'rov yaratildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/mro"] });
      setRequestDialogOpen(false);
      requestForm.reset();
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const res = await apiRequest("PUT", `/api/integration/requests/${id}/approve`, { action });
      return res;
    },
    onSuccess: () => {
      toast({ title: "So'rov holati yangilandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/integration/mro"] });
    },
  });

  const lowStockItems = stats?.items?.lowStockItems || 0;
  const pendingRequests = (stats?.requests || []).find((s) => s.status === "pending")?.count || 0;
  const scheduledMaintenance = (stats?.equipment || []).find((s) => s.status === "scheduled")?.count || 0;

  if (itemsError) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState onRetry={refetchItems} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6" data-testid="page-mro-dashboard">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Xo'jalik <span className="font-bold text-primary">Boshqaruvi</span>
        </h1>
        <p className="text-on-surface-variant mt-2">Xo'jalik materiallari, ta'mirlash va texnik xizmat</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Jami buyumlar</p>
          <p className="text-4xl font-bold tracking-tight text-on-surface mt-1">{stats?.items?.totalItems || 0}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Kam zaxira</p>
          <p className="text-4xl font-bold tracking-tight text-error mt-1">{lowStockItems}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Kutilayotgan so'rovlar</p>
          <p className="text-4xl font-bold tracking-tight text-amber-600 mt-1">{pendingRequests}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Rejalashtirilgan TA</p>
          <p className="text-4xl font-bold tracking-tight text-primary mt-1">{scheduledMaintenance}</p>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="bg-surface-container-low p-1 rounded-lg flex-wrap h-auto">
          <TabsTrigger value="items" data-testid="tab-items" className="data-[state=active]:bg-surface-container-lowest">Buyumlar</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests" className="data-[state=active]:bg-surface-container-lowest">So'rovlar</TabsTrigger>
          <TabsTrigger value="equipment" data-testid="tab-equipment" className="data-[state=active]:bg-surface-container-lowest">Uskunalar</TabsTrigger>
          <TabsTrigger value="utilities" data-testid="tab-utilities" className="data-[state=active]:bg-surface-container-lowest">Kommunal</TabsTrigger>
          <TabsTrigger value="building" data-testid="tab-building" className="data-[state=active]:bg-surface-container-lowest">Bino/Xonalar</TabsTrigger>
          <TabsTrigger value="cleaning" data-testid="tab-cleaning" className="data-[state=active]:bg-surface-container-lowest">Tozalash</TabsTrigger>
          <TabsTrigger value="uniforms" data-testid="tab-uniforms" className="data-[state=active]:bg-surface-container-lowest">Forma</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
              {(items || []).length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hali MRO buyum mavjud emas</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Kod</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Nomi</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kategoriya</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Zaxira</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Min</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items || []).map((item: MroItem) => (
                      <TableRow key={item.id} data-testid={`row-item-${item.id}`} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="font-mono text-sm px-6 text-on-surface">{item.itemCode}</TableCell>
                        <TableCell className="px-6 text-on-surface">{item.name}</TableCell>
                        <TableCell className="px-6 text-on-surface"><Badge variant="outline" className="border-outline-variant text-on-surface bg-surface-container rounded-full px-2 py-0.5 text-xs font-medium">{item.category}</Badge></TableCell>
                        <TableCell className="font-mono text-sm px-6 text-on-surface">{item.currentStock} {item.unit}</TableCell>
                        <TableCell className="font-mono text-sm px-6 text-on-surface-variant">{item.minStock}</TableCell>
                        <TableCell className="px-6">
                          {Number(item.currentStock) <= Number(item.minStock) ? 
                            <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">Kam</Badge> : 
                            <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">Normal</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </div>
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
              {(requests || []).length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hali so'rov mavjud emas</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Raqam</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Buyum</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">So'rovchi</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Miqdor</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(requests || []).map((r: MroRequest) => (
                      <TableRow key={r.id} data-testid={`row-request-${r.id}`} className="hover:bg-surface-container-low transition-colors">
                        <TableCell className="font-mono text-sm px-6 text-on-surface">{r.requestNumber}</TableCell>
                        <TableCell className="px-6 text-on-surface">{r.item?.name || "-"}</TableCell>
                        <TableCell className="px-6 text-on-surface">{r.requester?.fullName || "-"}</TableCell>
                        <TableCell className="px-6 text-on-surface">{r.requestedQuantity}</TableCell>
                        <TableCell className="px-6">
                          <Badge className={
                            r.status === "pending" ? "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" :
                            r.status === "approved" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" :
                            "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                          }>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6">{r.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => approveRequestMutation.mutate({ id: r.id, action: "approve" })} data-testid={`button-approve-${r.id}`} className="hover:bg-green-50 text-green-600 h-8 w-8 p-0">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </div>
        </TabsContent>
        <TabsContent value="equipment" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
              {(equipment || []).length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant"><Settings className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Hali uskuna ma'lumoti mavjud emas</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Uskuna</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kod</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Turi</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Keyingi TA</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(equipment || []).map((eq: MroEquipment) => {
                      let rowClass = "hover:bg-surface-container-low transition-colors border-none";
                      if (eq.status === "active" || eq.status === "completed" || eq.status === "ISHLAYAPTI") rowClass += " border-l-4 border-green-500";
                      else if (eq.status === "maintenance" || eq.status === "scheduled" || eq.status === "TA'MIR") rowClass += " border-l-4 border-amber-500";
                      else if (eq.status === "repair" || eq.status === "failed" || eq.status === "TA'MIRDA") rowClass += " border-l-4 border-error";
                      
                      return (
                        <TableRow key={eq.id} data-testid={`row-equipment-${eq.id}`} className={rowClass}>
                          <TableCell className="px-6 text-on-surface font-medium">{eq.equipmentName}</TableCell>
                        <TableCell className="font-mono text-sm px-6 text-on-surface-variant">{eq.equipmentCode}</TableCell>
                        <TableCell className="px-6"><Badge variant="outline" className="border-outline-variant text-on-surface bg-surface-container rounded-full px-2 py-0.5 text-xs font-medium">{eq.maintenanceType}</Badge></TableCell>
                        <TableCell className="px-6 text-on-surface-variant">{eq.nextMaintenanceDate || "-"}</TableCell>
                        <TableCell className="px-6">
                          <Badge className={eq.status === "completed" || eq.status === "active" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                            {eq.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                </Table>
              )}
          </div>
        </TabsContent>
        {/* KOMMUNAL MONITORING TAB */}
        <TabsContent value="utilities" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            {utilityLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-48 w-full rounded-lg" />)}
              </div>
            ) : utilityData.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ma'lumot yo'q</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {(Array.isArray(utilityData) ? utilityData : []).map(u => {
                  const Icon = u.utilityType === "electricity" ? Zap : u.utilityType === "gas" ? Flame : Droplets;
                  const color = u.utilityType === "electricity" ? "text-yellow-500" : u.utilityType === "gas" ? "text-orange-500" : "text-blue-500";
                  const typeLabel = u.utilityType === "electricity" ? "Elektr" : u.utilityType === "gas" ? "Gaz" : "Suv";
                  const monthTotal = u.monthTotal || 0;
                  const monthBudget = u.monthBudget || 1; // avoid division by zero
                  const trend = u.trendPercent || 0;

                  return (
                    <div key={u.id} className="bg-surface-container-low rounded-lg p-5 border border-outline-variant" data-testid={`card-utility-${u.id}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg bg-surface-container`}>
                          <Icon className={`w-6 h-6 ${color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{typeLabel}</p>
                          <p className="text-xs text-on-surface-variant">{u.unit} birligida</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center"><span className="text-on-surface-variant">Bugun:</span><span className="font-mono font-bold text-on-surface">{(u.todayValue || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between items-center"><span className="text-on-surface-variant">Kecha:</span><span className="font-mono text-on-surface">{(u.yesterdayValue || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between items-center"><span className="text-on-surface-variant">Bu oy:</span><span className="font-mono text-on-surface">{monthTotal.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center"><span className="text-on-surface-variant">Byudjet:</span><span className="font-mono text-on-surface">{(u.monthBudget || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant">O'zgarish:</span>
                          <span className={`text-xs font-bold ${trend < 0 ? "text-green-600" : "text-error"}`}>
                            {trend > 0 ? "+" : ""}{trend}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-on-surface-variant font-medium">Byudjet sarfi</span>
                          <span className="text-on-surface font-bold">{Math.round((monthTotal / monthBudget) * 100)}%</span>
                        </div>
                        <div className="w-full bg-surface-container rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${(monthTotal / monthBudget) > 0.9 ? "bg-error" : (monthTotal / monthBudget) > 0.7 ? "bg-amber-500" : "bg-green-600"}`}
                            style={{ width: `${Math.min((monthTotal / monthBudget) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* BINO / XONALAR TAB */}
        <TabsContent value="building" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Bino va Xonalar Inventari</h2>
            </div>
            {facilitiesLoading ? (
              <div className="space-y-2">
                {([1, 2, 3, 4]).map(i => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}
              </div>
            ) : buildingRooms.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Xonalar ma'lumoti mavjud emas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Xona/Zona</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Maydon (m²)</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Sig'im</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Oxirgi tekshiruv</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(buildingRooms) ? buildingRooms : []).map(r => (
                    <TableRow key={r.id} data-testid={`row-room-${r.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                      <TableCell className="font-bold px-6 text-on-surface">{r.name}</TableCell>
                      <TableCell className="px-6 text-on-surface">{r.areaM2} m²</TableCell>
                      <TableCell className="px-6 text-on-surface">{(r.capacity || 0) > 0 ? `${r.capacity} kishi` : "—"}</TableCell>
                      <TableCell className="text-sm px-6 text-on-surface-variant">{r.lastInspection ? new Date(r.lastInspection).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="px-6">
                        <Badge className={r.status === "active" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-surface-container text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                          {r.status === "active" ? "Faol" : r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm px-6 text-on-surface-variant">{r.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* TOZALASH XIZMATI TAB */}
        <TabsContent value="cleaning" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Trash2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Tozalash Jadvali</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Maydon</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Chastota</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Oxirgi tozalash</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Keyingisi</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mas'ul</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(cleaningSchedule) ? cleaningSchedule : []).map(c => (
                  <TableRow key={c.id} data-testid={`row-cleaning-${c.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                    <TableCell className="font-medium px-6 text-on-surface">{c.area}</TableCell>
                    <TableCell className="px-6 text-on-surface"><Badge variant="outline" className="border-outline-variant text-on-surface-variant">{c.frequency === "daily" ? "Kunlik" : c.frequency === "twice_daily" ? "2x Kunlik" : "3x Kunlik"}</Badge></TableCell>
                    <TableCell className="text-sm px-6 text-on-surface-variant">{c.lastCleaned ? new Date(c.lastCleaned).toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm px-6 text-on-surface-variant">{c.nextCleaning ? new Date(c.nextCleaning).toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm px-6 text-on-surface-variant">{c.responsible}</TableCell>
                    <TableCell className="px-6">
                      <Badge className={c.status === "done" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-surface-container text-on-surface-variant rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                        {c.status === "done" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {c.status === "done" ? "Bajarildi" : "Kutilmoqda"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* FORMA VA PPE INVENTARI TAB */}
        <TabsContent value="uniforms" className="mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shirt className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Forma va PPE Inventari</h2>
            </div>
            {ppeItems.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Shirt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ma'lumot yo'q</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Mahsulot</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Birlik</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Miqdor</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Min</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(ppeItems) ? ppeItems : []).map(u => (
                    <TableRow key={u.id} data-testid={`row-uniform-${u.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                      <TableCell className="font-medium px-6 text-on-surface">{u.name}</TableCell>
                      <TableCell className="px-6 text-on-surface"><Badge variant="outline" className="border-outline-variant text-on-surface-variant">{u.unit}</Badge></TableCell>
                      <TableCell className="font-mono px-6 text-on-surface">{u.currentStock} dona</TableCell>
                      <TableCell className="font-mono px-6 text-on-surface-variant">{u.minStock}</TableCell>
                      <TableCell className="px-6">
                        <Badge className={
                          (u.currentStock || 0) > (u.minStock || 0) ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" :
                          "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                        }>
                          {(u.currentStock || 0) > (u.minStock || 0) ? "Normal" : "Kam"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
