import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest , selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { Zap, Building, Wrench, Package, Coffee, Shirt, Monitor, Sparkles, Leaf, Plus, RefreshCw, AlertTriangle, CheckCircle, DollarSign, Building2, Flame, Droplets, Wind, type LucideIcon } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface MROEquipment {
    id: number | string;
    name?: string;
    type?: string;
    status?: string;
    location?: string;
    oee?: number | string;
    lastMaintenanceDate?: string;
  }
interface MRORequest {
    id: number | string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    type?: string;
    assignedTo?: string | number;
    createdAt?: string;
    completedAt?: string;
    dueDate?: string;
    category?: string;
  }
interface MROItem {
    id: number | string;
    name?: string;
    code?: string;
    itemCode?: string;
    status?: string;
    category?: string;
    location?: string;
    quantity?: number;
    minQty?: number;
    unitPrice?: number | string;
    unit?: string;
    currentStock?: number;
    minStock?: number;
  }
interface MROBudget {
    id?: number | string;
    category?: string;
    usedAmount?: number | string;
    totalAmount?: number | string;
    budgetAmount?: number | string;
    spentAmount?: number | string;
    year?: number;
    month?: number;
  }
interface MROStats {
  completedThisMonth?: number;
  plannedThisMonth?: number;
  electricityToday?: number;
  gasToday?: number;
  waterToday?: number;
  budgets?: MROBudget[];
  [key: string]: unknown;
}
interface UtilityReading {
  id?: number | string;
  utilityType?: string;
  unit?: string;
  monthBudget?: number | string;
  monthTotal?: number | string;
  trendPercent?: number | string;
}

const URL_TAB_MAP: Record<string, string> = {
  "/mro/preventive": "preventive",
  "/mro/spare-parts": "spareparts",
  "/mro/utilities": "utilities",
  "/mro/expense-control": "expenses",
  "/mro/kitchen": "kitchen",
  "/mro/uniforms": "uniforms",
  "/mro/office-inventory": "office",
  "/mro/cleaning": "cleaning",
  "/mro/sanitation": "sanitation",
  "/mro/building-inventory": "building",
};

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "preventive": { title: "Profilaktika", icon: Wrench },
  "spareparts": { title: "Ehtiyot Qismlar", icon: Package },
  "utilities": { title: "Kommunal Xizmatlar", icon: Zap },
  "expenses": { title: "Xarajat Nazorati", icon: DollarSign },
  "kitchen": { title: "Oshxona", icon: Coffee },
  "uniforms": { title: "Forma va Kiyim", icon: Shirt },
  "office": { title: "Ofis Inventari", icon: Monitor },
  "cleaning": { title: "Tozalash", icon: Sparkles },
  "sanitation": { title: "Sanitariya", icon: Leaf },
  "building": { title: "Bino Inventari", icon: Building2 },
};

function PMUpcomingPanel() {
  const { data, isLoading } = useQuery<{ upcoming?: Record<string, unknown>[]; overdue?: Record<string, unknown>[] }>({
    queryKey: ["/api/integration/mro/pm-upcoming"],
  });

  const upcoming = data?.upcoming ?? [];
  const overdue = data?.overdue ?? [];

  if (isLoading) return null;
  if (upcoming.length === 0 && overdue.length === 0) return null;

  return (
    <div className="space-y-3">
      {overdue.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Kechiktirilgan PM vazifalari ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {(Array.isArray(overdue) ? overdue : []).map((s: { id: number | string; taskName?: string; equipmentName?: string; equipmentCode?: string; nextDueDate?: string; priority?: string }) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-950/30 text-sm" data-testid={`row-pm-overdue-${s.id}`}>
                <div>
                  <span className="font-medium">{s.taskName}</span>
                  <span className="text-muted-foreground ml-2">— {s.equipmentName || s.equipmentCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">{s.nextDueDate}</Badge>
                  <Badge variant={s.priority === "critical" ? "destructive" : "secondary"} className="text-xs">
                    {s.priority === "critical" ? "Kritik" : s.priority === "high" ? "Yuqori" : "O'rta"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" /> Yaqin 7 kunda rejalashtirilgan PM ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {(Array.isArray(upcoming) ? upcoming : []).map((s: { id: number | string; taskName?: string; equipmentName?: string; equipmentCode?: string; nextDueDate?: string }) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-muted/40 text-sm" data-testid={`row-pm-upcoming-${s.id}`}>
                <div>
                  <span className="font-medium">{s.taskName}</span>
                  <span className="text-muted-foreground ml-2">— {s.equipmentName || s.equipmentCode}</span>
                </div>
                <Badge variant="outline" className="text-xs">{s.nextDueDate}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MROExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "preventive");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
    const meta = tabMeta[activeTab] || tabMeta["preventive"];

  const { toast } = useToast();
  const [showEquipDialog, setShowEquipDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);

  const equipForm = useForm({ defaultValues: { name: "", type: "machine", location: "", status: "active", purchaseDate: "", warrantyExpiry: "" } });
  const requestForm = useForm({ defaultValues: { equipmentId: "", type: "preventive", description: "", priority: "medium", assignedTo: "" } });
  const itemForm = useForm({ defaultValues: { itemCode: "", name: "", category: "spare_part", unit: "dona", quantity: 0, minQty: 5, location: "" } });

  const { data: equipment = [], isLoading: equipLoading, refetch: refetchEquip } = useQuery<MROEquipment[]>({
    queryKey: ["/api/integration/equipment"],
    select: selectArray<MROEquipment>,
  });

  const { data: requests = [], isLoading: reqLoading, refetch: refetchReqs } = useQuery<MRORequest[]>({
    queryKey: ["/api/integration/requests"],
    select: selectArray<MRORequest>,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<MROItem[]>({
    queryKey: ["/api/integration/items"],
    select: selectArray<MROItem>,
  });

  const { data: stats } = useQuery<MROStats>({
    queryKey: ["/api/integration/stats"]
  });

  const { data: cleaningSchedule = [] } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/integration/mro/cleaning-schedules"]
  });

  const { data: utilityReadings = [], isLoading: utilityReadingsLoading } = useQuery<UtilityReading[]>({
    queryKey: ["/api/integration/mro/utility-readings"]
  });

  const { data: ppeItems = [] } = useQuery<MROItem[]>({
    queryKey: ["/api/integration/mro/items", { category: "ppe" }],
    queryFn: () => fetch("/api/integration/mro/items?category=ppe", { credentials: "include" }).then(r => r.json()),
  });

  const createEquipment = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/integration/equipment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integration/equipment"] });
      setShowEquipDialog(false);
      toast({ title: "Jihoz qo'shildi" });
    },
  });

  const createRequest = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/integration/requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integration/requests"] });
      setShowRequestDialog(false);
      toast({ title: "So'rov yaratildi" });
    },
  });

  const createItem = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/integration/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integration/items"] });
      setShowItemDialog(false);
      toast({ title: "Material qo'shildi" });
    },
  });

  const pendingReqs = (Array.isArray(requests) ? requests : []).filter((r: MRORequest) => r.status === "pending" || r.status === "open");
  const lowStockItems = (Array.isArray(items) ? items : []).filter((i: MROItem) => Number(i.quantity) <= Number(i.minQty || 5));

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Building className="h-5 w-5 text-primary" />
        <h1 className="font-semibold text-base">MRO — Xo'jalik Boshqaruvi</h1>
        {pendingReqs.length > 0 && (
          <Badge variant="secondary" className="ml-2">{pendingReqs.length} so'rov kutmoqda</Badge>
        )}
        {lowStockItems.length > 0 && (
          <Badge variant="destructive" className="ml-1">
            <AlertTriangle className="h-3 w-3 mr-1" />{lowStockItems.length} kam zaxira
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto">
                  </div>

        <div className="flex-1 overflow-auto p-6">

      <ModuleSectionHeader
        moduleName="MRO"
        moduleColor="text-amber-600"
        sectionTitle={meta?.title || ""}
        icon={meta?.icon || (() => null)}
      />
          {/* Preventive Maintenance */}
          <TabsContent value="preventive" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Profilaktik Texnik Xizmat</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { refetchEquip(); refetchReqs(); }}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
                </Button>
                <Button size="sm" onClick={() => setShowRequestDialog(true)} data-testid="button-add-maintenance">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />So'rov Yaratish
                </Button>
              </div>
            </div>

            <PMUpcomingPanel />

            {stats && (
              <div className="grid grid-cols-4 gap-4">
                {([
                  { l: "Ushbu oy rejalashtirilgan", v: stats.plannedThisMonth ?? pendingReqs.length, c: "text-primary" },
                  { l: "Bajarilgan", v: stats.completedThisMonth ?? (Array.isArray(requests) ? requests : []).filter((r: MRORequest) => r.status === "completed").length, c: "text-green-600" },
                  { l: "Kutilmoqda", v: pendingReqs.length, c: "text-orange-600" },
                  { l: "Jihozlar soni", v: equipment.length, c: "text-blue-600" },
                ]).map(s => (
                  <Card key={s.l}><CardContent className="pt-4 pb-3">
                    <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                  </CardContent></Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-base">Texnik Xizmat So'rovlari</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowEquipDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Jihoz Qo'shish
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Tur</TableHead><TableHead>Tavsif</TableHead>
                    <TableHead>Ustuvorlik</TableHead><TableHead>Mas'ul</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {reqLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        So'rovlar yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(requests) ? requests : []).slice(0, 10).map((r: MRORequest) => (
                      <TableRow key={r.id} data-testid={`row-request-${r.id}`}>
                        <TableCell><Badge variant="outline">{r.type === "preventive" ? "Profilaktik" : r.type === "corrective" ? "Ta'mirlash" : r.type}</Badge></TableCell>
                        <TableCell className="max-w-[200px] text-sm">{r.description}</TableCell>
                        <TableCell>
                          <Badge variant={r.priority === "critical" ? "destructive" : r.priority === "high" ? "secondary" : "outline"}>
                            {r.priority === "critical" ? "Kritik" : r.priority === "high" ? "Yuqori" : r.priority === "medium" ? "O'rta" : "Past"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.assignedTo || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "completed" ? "default" : r.status === "in_progress" ? "secondary" : "outline"}>
                            {r.status === "completed" ? "Bajarilgan" : r.status === "in_progress" ? "Jarayonda" : "Kutilmoqda"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Texnik Xizmat So'rovi</DialogTitle></DialogHeader>
                <form onSubmit={requestForm.handleSubmit(d => createRequest.mutate(d))} className="space-y-4">
                  <div className="space-y-2"><Label>Tavsif</Label><Input {...requestForm.register("description")} placeholder="Muammo tavsifi" data-testid="input-req-desc" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Tur</Label>
                      <Controller control={requestForm.control} name="type" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preventive">Profilaktik</SelectItem>
                            <SelectItem value="corrective">Ta'mirlash</SelectItem>
                            <SelectItem value="inspection">Tekshiruv</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div className="space-y-2"><Label>Ustuvorlik</Label>
                      <Controller control={requestForm.control} name="priority" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Past</SelectItem>
                            <SelectItem value="medium">O'rta</SelectItem>
                            <SelectItem value="high">Yuqori</SelectItem>
                            <SelectItem value="critical">Kritik</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Mas'ul</Label><Input {...requestForm.register("assignedTo")} placeholder="Texnik ismi" /></div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowRequestDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={createRequest.isPending}>Yuborish</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showEquipDialog} onOpenChange={setShowEquipDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Jihoz Qo'shish</DialogTitle></DialogHeader>
                <form onSubmit={equipForm.handleSubmit(d => createEquipment.mutate(d))} className="space-y-4">
                  <div className="space-y-2"><Label>Nomi</Label><Input {...equipForm.register("name")} placeholder="Jihoz nomi" data-testid="input-equip-name" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Turi</Label><Input {...equipForm.register("type")} placeholder="machine" /></div>
                    <div className="space-y-2"><Label>Joylashuvi</Label><Input {...equipForm.register("location")} placeholder="1-sex" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Xarid sanasi</Label><Input type="date" {...equipForm.register("purchaseDate")} /></div>
                    <div className="space-y-2"><Label>Kafolat muddati</Label><Input type="date" {...equipForm.register("warrantyExpiry")} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowEquipDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={createEquipment.isPending}>Saqlash</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Spare Parts */}
          <TabsContent value="spareparts" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">MRO Ehtiyot Qismlar</h2>
              <Button size="sm" onClick={() => setShowItemDialog(true)} data-testid="button-add-spare">
                <Plus className="h-3.5 w-3.5 mr-1.5" />Kirim Qilish
              </Button>
            </div>
            {lowStockItems.length > 0 && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-400">{lowStockItems.length} ta material minimal zaxira darajasidan past</span>
              </div>
            )}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Kod</TableHead><TableHead>Nomi</TableHead>
                    <TableHead>Toifa</TableHead><TableHead>Miqdor</TableHead>
                    <TableHead>Min</TableHead><TableHead>Joylashuvi</TableHead><TableHead>Holati</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {itemsLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Materiallar yo'q</TableCell></TableRow>
                    ) : (Array.isArray(items) ? items : []).slice(0, 15).map((item: MROItem) => {
                      const isLow = Number(item.quantity) <= Number(item.minQty || 5);
                      return (
                        <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                          <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                          <TableCell className={isLow ? "text-red-600 font-bold" : ""}>{item.quantity} {item.unit}</TableCell>
                          <TableCell className="text-muted-foreground">{item.minQty || 5} {item.unit}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={isLow ? "destructive" : "default"}>{isLow ? "Kam zaxira" : "Normal"}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Material/Ehtiyot Qism Kirim</DialogTitle></DialogHeader>
                <form onSubmit={itemForm.handleSubmit(d => createItem.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Kod</Label><Input {...itemForm.register("itemCode")} placeholder="MRO-001" data-testid="input-item-code" /></div>
                    <div className="space-y-2"><Label>Nomi</Label><Input {...itemForm.register("name")} placeholder="Material nomi" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Miqdor</Label><Input type="number" {...itemForm.register("quantity", { valueAsNumber: true })} /></div>
                    <div className="space-y-2"><Label>Birlik</Label><Input {...itemForm.register("unit")} placeholder="dona" /></div>
                  </div>
                  <div className="space-y-2"><Label>Joylashuvi</Label><Input {...itemForm.register("location")} placeholder="1-saqlash" /></div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowItemDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={createItem.isPending}>Saqlash</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Utilities */}
          <TabsContent value="utilities" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Kommunal Xizmatlar Monitoring</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Elektr (bugungi)", v: stats?.electricityToday ?? "—", unit: "kWh", icon: Zap, c: "text-yellow-600" },
                { l: "Gaz (bugungi)", v: stats?.gasToday ?? "—", unit: "m³", icon: Zap, c: "text-blue-600" },
                { l: "Suv (bugungi)", v: stats?.waterToday ?? "—", unit: "m³", icon: Zap, c: "text-cyan-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Kommunal xarajatlar (oylik)</CardTitle></CardHeader>
              <CardContent>
                {utilityReadingsLoading ? (
                  <div className="space-y-3">
                    {([0, 1, 2]).map(i => (
                      <div key={`k-${i}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50 animate-pulse" data-testid={`skeleton-utility-${i}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded bg-muted-foreground/20" />
                          <div className="space-y-1">
                            <div className="h-3 w-24 rounded bg-muted-foreground/20" />
                            <div className="h-2 w-12 rounded bg-muted-foreground/20" />
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="h-3 w-16 rounded bg-muted-foreground/20" />
                          <div className="h-2 w-8 rounded bg-muted-foreground/20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !utilityReadings || utilityReadings.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6" data-testid="text-no-utility-readings">
                    Kommunal o'qish ma'lumotlari mavjud emas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(utilityReadings) ? utilityReadings : []).map((u, i) => {
                      const typeLabel = u.utilityType === "electricity" ? "Elektr energiya"
                        : u.utilityType === "gas" ? "Tabiiy gaz"
                        : u.utilityType === "water" ? "Suv ta'minoti"
                        : u.utilityType === "compressed_air" ? "Siqilgan havo"
                        : String(u.utilityType);
                      const UtilityIcon: LucideIcon = u.utilityType === "electricity" ? Zap
                        : u.utilityType === "gas" ? Flame
                        : u.utilityType === "water" ? Droplets
                        : u.utilityType === "compressed_air" ? Wind
                        : Zap;
                      const rawTrend = Number(u.trendPercent);
                      const trend = Number.isFinite(rawTrend) ? rawTrend : 0;
                      const trendUp = trend > 0;
                      return (
                        <div key={u.id as string} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-utility-${i}`}>
                          <div className="flex items-center gap-3">
                            <UtilityIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{typeLabel}</div>
                              <div className="text-xs text-muted-foreground">{u.unit} / Oy: {Number(u.monthBudget).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{Number(u.monthTotal).toLocaleString()}</div>
                            <div className={`text-xs ${trendUp ? "text-red-500" : "text-green-500"}`}>
                              {trendUp ? "+" : ""}{trend.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">MRO Xarajat Nazorati</h2>
            {stats?.budgets ? (
              <div className="grid grid-cols-3 gap-4">
                {(Array.isArray(stats?.budgets) ? stats.budgets : []).slice(0, 6).map((b: MROBudget, i: number) => {
                  const used = Number(b.usedAmount ?? 0);
                  const total = Number(b.totalAmount ?? 1);
                  const pct = Math.round((used / total) * 100);
                  return (
                    <Card key={`k-${i}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium">{b.category}</div>
                          <Badge variant={pct >= 90 ? "destructive" : pct >= 70 ? "secondary" : "outline"}>{pct}%</Badge>
                        </div>
                        <div className="h-2 bg-muted rounded mb-2">
                          <div className={`h-2 rounded ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground">{used.toLocaleString()} / {total.toLocaleString()} so'm</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Byudjet ma'lumotlari mavjud emas
              </div>
            )}
          </TabsContent>

          {/* Kitchen */}
          <TabsContent value="kitchen" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Korporativ Oshxona Boshqaruvi</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Bugungi ovqatlanuvchilar", v: "—", c: "text-primary" },
                { l: "Oylik xarajat", v: "—", c: "text-orange-600" },
                { l: "1 kishi narxi", v: "—", c: "text-blue-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Haftalik menyu</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"]).map((day, i) => (
                    <div key={`k-${i}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-menu-${i}`}>
                      <div className="font-medium text-sm">{day}</div>
                      <div className="text-sm text-muted-foreground">
                        {["Moshxo'rda + Kompot", "Lag'mon + Choy", "Osh + Salat", "So'p + Non", "Dimlama + Limonad"][i]}
                      </div>
                      <Badge variant="outline">—</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Uniforms */}
          <TabsContent value="uniforms" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Korporativ Forma Boshqaruvi</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "PPE buyumlar soni", v: ppeItems.length, c: "text-primary" },
                { l: "Kam zaxira", v: (Array.isArray(ppeItems) ? ppeItems : []).filter((p: MROItem) => (p.currentStock ?? 0) < (p.minStock ?? 0)).length, c: "text-orange-600" },
                { l: "Jami birlik (ombor)", v: (Array.isArray(ppeItems) ? ppeItems : []).reduce((s: number, p: MROItem) => s + Number(p.currentStock || 0), 0), c: "text-blue-600" },
                { l: "Min. zaxira bajarilgan", v: (Array.isArray(ppeItems) ? ppeItems : []).filter((p: MROItem) => (p.currentStock ?? 0) >= (p.minStock ?? 0)).length, c: "text-green-600" },
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
                  <TableHeader><TableRow><TableHead>Buyum</TableHead><TableHead>Birlik</TableHead><TableHead>Joriy zaxira</TableHead><TableHead>Min. zaxira</TableHead><TableHead>Holati</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ppeItems.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">PPE buyumlari mavjud emas</TableCell></TableRow>
                    ) : (Array.isArray(ppeItems) ? ppeItems : []).map((r: MROItem, i: number) => (
                      <TableRow key={r.id} data-testid={`row-uniform-${i}`}>
                        <TableCell className="font-medium">{r.name || "—"}</TableCell>
                        <TableCell>{r.unit || "—"}</TableCell>
                        <TableCell>{r.currentStock ?? "—"}</TableCell>
                        <TableCell className={(r.currentStock ?? 0) === 0 ? "text-red-600 font-bold" : ""}>{r.minStock ?? "—"}</TableCell>
                        <TableCell><Badge variant={(r.currentStock ?? 0) >= (r.minStock ?? 0) ? "default" : (r.currentStock ?? 0) > 0 ? "secondary" : "destructive"}>{(r.currentStock ?? 0) >= (r.minStock ?? 0) ? "Yetarli" : (r.currentStock ?? 0) > 0 ? "Kam" : "Tugagan"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Office */}
          <TabsContent value="office" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Ofis Inventar Nazorati</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Uskuna</TableHead><TableHead>Soni</TableHead><TableHead>Holati</TableHead><TableHead>Mas'ul</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {equipment.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Jihozlar ma'lumotlari mavjud emas</TableCell></TableRow>
                    ) : (Array.isArray(equipment) ? equipment : []).slice(0, 10).map((r: MROEquipment, i: number) => (
                      <TableRow key={r.id} data-testid={`row-office-${i}`}>
                        <TableCell className="font-medium">{r.name || "—"}</TableCell>
                        <TableCell>1 ta</TableCell>
                        <TableCell><Badge variant={r.status === "active" ? "default" : r.status === "maintenance" ? "secondary" : "destructive"}>{r.status === "active" ? "Yaxshi" : r.status === "maintenance" ? "Ta'mirlash" : r.status || "—"}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{r.location || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cleaning */}
          <TabsContent value="cleaning" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Tozalash Xizmati Jadvali</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Jami zonalar", v: `${cleaningSchedule.length} zona`, c: "text-green-600" },
                { l: "Bajarilgan", v: `${(Array.isArray(cleaningSchedule) ? cleaningSchedule : []).filter((z: Record<string, unknown>) => z.status === "completed").length} zona`, c: "text-primary" },
                { l: "Navbatdagi", v: `${(Array.isArray(cleaningSchedule) ? cleaningSchedule : []).filter((z: Record<string, unknown>) => z.status !== "completed").length} zona`, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Kunlik tozalash jadvali</CardTitle></CardHeader>
              <CardContent>
                {cleaningSchedule.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">Tozalash jadvali mavjud emas</p>
                ) : (
                  <div className="space-y-2">
                    {(Array.isArray(cleaningSchedule) ? cleaningSchedule : []).map((r: Record<string, unknown>, i: number) => (
                      <div key={String(r.id || i)} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-cleaning-${i}`}>
                        <div>
                          <div className="font-medium text-sm">{String(r.area || "—")}</div>
                          <div className="text-xs text-muted-foreground">{String(r.frequency || "—")} — {String(r.responsible || "—")}</div>
                        </div>
                        <Badge variant={r.status === "completed" ? "default" : "outline"}>{r.status === "completed" ? "Bajarildi" : "Kutilmoqda"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sanitation */}
          <TabsContent value="sanitation" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Sanitariya va Dezinfeksiya</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Oxirgi tekshiruv", v: "—", c: "text-green-600" },
                { l: "Muvofiqlik darajasi", v: "—", c: "text-primary" },
                { l: "Muammo zonalar", v: "—", c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* Building */}
          <TabsContent value="building" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Bino va Inshoot Inventari</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Binolar soni", v: "—", c: "text-primary" },
                { l: "Umumiy maydon", v: "—", c: "text-blue-600" },
                { l: "Ta'mirlash kerak", v: "—", c: "text-orange-600" },
                { l: "Inventar qiymati", v: "—", c: "text-green-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            {equipment.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Jihozlar ro'yxati</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Nomi</TableHead><TableHead>Turi</TableHead>
                      <TableHead>Joylashuvi</TableHead><TableHead>Holati</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(Array.isArray(equipment) ? equipment : []).slice(0, 8).map((eq: MROEquipment) => (
                        <TableRow key={eq.id} data-testid={`row-equip-${eq.id}`}>
                          <TableCell className="font-medium">{eq.name}</TableCell>
                          <TableCell><Badge variant="outline">{eq.type}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{eq.location || "—"}</TableCell>
                          <TableCell><Badge variant={eq.status === "active" ? "default" : eq.status === "maintenance" ? "secondary" : "destructive"}>
                            {eq.status === "active" ? "Faol" : eq.status === "maintenance" ? "Ta'mirda" : "Nofaol"}
                          </Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
