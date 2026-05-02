import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { useForm } from "react-hook-form";
import { Building2, Package, DollarSign, Settings, Activity, AlertCircle, Plus, CheckCircle, XCircle, ToggleLeft, RefreshCw, Database, Cpu, Server, Users, Clock, Globe, Shield, Layers, AlertTriangle , type LucideIcon } from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface SaaSTenant {
  id: number | string;
  name?: string;
  companyName?: string;
  plan?: string;
  status?: string;
  domain?: string;
  contactEmail?: string;
  city?: string;
  country?: string;
  usersCount?: number;
  usersLimit?: number;
  monthlyFee?: number | string;
  modulesEnabled?: string[];
  expiresAt?: string;
  createdAt?: string;
}

interface ErrorLog {
  id?: number | string;
  tenantId?: number | string;
  level?: string;
  message?: string;
  module?: string;
  service?: string;
  requestPath?: string;
  createdAt?: string;
}
interface PlatformStats {
  uptimeHours?: number;
  uptime?: number;
  version?: string;
  environment?: string;
  database?: { sizeMB?: number };
  memory?: { heapUsed?: number; rss?: number };
  errors?: { last24h?: number };
  tenants?: { total?: number; active?: number; trial?: number; suspended?: number; cancelled?: number };
  users?: { total?: number };
}

const URL_TAB_MAP: Record<string, string> = {
  "/saas/tenant-management": "tenants",
  "/saas/onboarding": "onboarding",
  "/saas/licensing": "licensing",
  "/saas/module-control": "modules",
  "/saas/monitoring": "monitoring",
  "/saas/error-log": "errors",
};

const PLAN_LABELS: Record<string, string> = {
  basic: "Basic",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  suspended: "destructive",
  cancelled: "outline",
};

const ALL_MODULES = [
  { name: "CRM + Savdo", key: "crm", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: "Marketing", key: "marketing", tiers: ["starter", "professional", "enterprise"] },
  { name: "Dizayn + Texnolog", key: "design", tiers: ["starter", "professional", "enterprise"] },
  { name: "Sifat Nazorati (QC)", key: "qc", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: "AI PP", key: "pp", tiers: ["professional", "enterprise"] },
  { name: "MES", key: "mes", tiers: ["starter", "professional", "enterprise"] },
  { name: "Ombor (WMS)", key: "wms", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: "Ta'minot (MM)", key: "mm", tiers: ["starter", "professional", "enterprise"] },
  { name: "Moliya (FI)", key: "fi", tiers: ["starter", "professional", "enterprise"] },
  { name: "HR", key: "hr", tiers: ["basic", "starter", "professional", "enterprise"] },
  { name: "LMS Ta'lim", key: "lms", tiers: ["starter", "professional", "enterprise"] },
  { name: "Xavfsizlik", key: "security", tiers: ["professional", "enterprise"] },
  { name: "MRO Xo'jalik", key: "mro", tiers: ["professional", "enterprise"] },
  { name: "IoT + Kamera", key: "iot", tiers: ["enterprise"] },
  { name: "Direktor Panel", key: "director", tiers: ["professional", "enterprise"] },
  { name: "SaaS Admin", key: "saas", tiers: ["enterprise"] },
];

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "tenants":    { title: "Tenant Boshqaruvi",   icon: Building2 },
  "onboarding": { title: "Tenant Onboarding",   icon: Users },
  "licensing":  { title: "Litsenziya",           icon: Shield },
  "modules":    { title: "Modul Nazorati",       icon: Layers },
  "monitoring": { title: "Monitoring",           icon: Activity },
  "errors":     { title: "Xatolar Jurnali",     icon: AlertTriangle },
};

export default function SaaSExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "tenants");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
  const meta = tabMeta[activeTab] || tabMeta["tenants"];
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  const addForm = useForm({
    defaultValues: { name: "", domain: "", plan: "basic", contactEmail: "", contactPhone: "", usersLimit: 10 },
  });

  // ===================== QUERIES =====================
  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery<{ tenants?: SaaSTenant[] }>({
    queryKey: ["/api/saas/tenants"],
  });
  const { data: platformStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<PlatformStats>({
    queryKey: ["/api/saas/platform-stats"],
    enabled: activeTab === "monitoring",
  });
  const { data: errorLogsData, isLoading: errorsLoading, refetch: refetchErrors } = useQuery<{ logs?: Record<string, unknown>[]; total?: number }>({
    queryKey: ["/api/saas/error-logs"],
    enabled: activeTab === "errors",
  });

  const tenants: SaaSTenant[] = tenantsData?.tenants || [];

  // ===================== MUTATIONS =====================
  const addTenantMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/saas/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      setShowAddDialog(false);
      addForm.reset();
      toast({ title: "Tenant yaratildi", description: "Yangi tenant muvaffaqiyatli qo'shildi" });
    },
    onError: (e: Error) => toast({ title: "Xatolik", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/saas/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      toast({ title: "Status yangilandi" });
    },
  });

  const selectedTenantData = (Array.isArray(tenants) ? tenants : []).find((t: SaaSTenant) => String(t.id) === selectedTenant) || tenants[0];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Globe className="h-3 w-3" />{tenants.length} tenant
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetchTenants()} data-testid="button-refresh-saas">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4 overflow-x-auto">
                  </div>

        <div className="flex-1 overflow-auto p-6">

      <ModuleSectionHeader
        moduleName="SaaS"
        moduleColor="text-on-surface-variant"
        sectionTitle={meta?.title || ""}
        icon={meta?.icon || (() => null)}
      />
          {/* ===================== TENANTS ===================== */}
          <TabsContent value="tenants" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Barcha Tenantlar</h2>
              <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-tenant">
                <Plus className="h-4 w-4 mr-2" />Yangi Tenant
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Jami tenantlar", v: tenantsLoading ? "..." : tenants.length, c: "text-primary" },
                { l: "Faol", v: tenantsLoading ? "..." : (Array.isArray(tenants) ? tenants : []).filter((t: SaaSTenant) => t.status === "active").length, c: "text-green-600" },
                { l: "Sinov davri", v: tenantsLoading ? "..." : (Array.isArray(tenants) ? tenants : []).filter((t: SaaSTenant) => t.status === "trial").length, c: "text-orange-600" },
                { l: "Jami foydalanuvchilar", v: tenantsLoading ? "..." : (Array.isArray(tenants) ? tenants : []).reduce((s: number, t: SaaSTenant) => s + (t.usersCount || 0), 0), c: "text-blue-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {tenantsLoading ? (
                  <div className="p-8 text-center text-muted-foreground animate-pulse">Yuklanmoqda...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Domen</TableHead>
                        <TableHead>Tarif</TableHead>
                        <TableHead>Foydalanuvchilar</TableHead>
                        <TableHead>Muddat</TableHead>
                        <TableHead>Holati</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => (
                        <TableRow key={t.id} data-testid={`row-tenant-${t.id}`}>
                          <TableCell>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">{t.contactEmail || t.city || "—"}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{t.domain}</TableCell>
                          <TableCell>
                            <Badge variant={t.plan === "enterprise" ? "default" : "outline"}>
                              {PLAN_LABELS[t.plan ?? ""] || t.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.usersCount}/{t.usersLimit}</TableCell>
                          <TableCell className="text-sm">{t.expiresAt || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANTS[t.status ?? ""] || "outline"}>
                              {t.status === "active" ? "Faol" : t.status === "trial" ? "Sinov" : t.status === "suspended" ? "Bloklangan" : "Bekor"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {t.status === "active" && (
                                <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: String(t.id), status: "suspended" })} data-testid={`button-suspend-${t.id}`}>
                                  Bloklash
                                </Button>
                              )}
                              {t.status === "suspended" && (
                                <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: String(t.id), status: "active" })} data-testid={`button-activate-${t.id}`}>
                                  Faollashtirish
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" data-testid={`button-manage-${t.id}`}>
                                <Settings className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {tenants.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tenantlar yo'q</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Add Tenant Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Yangi Tenant Yaratish</DialogTitle></DialogHeader>
                <form className="space-y-4" onSubmit={addForm.handleSubmit((d) => addTenantMutation.mutate(d))}>
                  <div className="space-y-2">
                    <Label>Kompaniya nomi *</Label>
                    <Input {...addForm.register("name", { required: true })} placeholder="Zavod LLC" data-testid="input-tenant-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Domen *</Label>
                    <Input {...addForm.register("domain", { required: true })} placeholder="zavod.uz" data-testid="input-tenant-domain" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarif *</Label>
                    <Select defaultValue="basic" onValueChange={v => addForm.setValue("plan", v)}>
                      <SelectTrigger data-testid="select-tenant-plan"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLAN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input {...addForm.register("contactEmail")} type="email" placeholder="admin@zavod.uz" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input {...addForm.register("contactPhone")} placeholder="+998 90..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowAddDialog(false)}>Bekor</Button>
                    <Button type="submit" disabled={addTenantMutation.isPending} data-testid="button-create-tenant">
                      {addTenantMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ===================== ONBOARDING ===================== */}
          <TabsContent value="onboarding" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Yangi Zavod Onboarding</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Onboarding jarayoni bosqichlari</CardTitle>
                  <Select defaultValue={tenants[0]?.id as string | undefined} onValueChange={setSelectedTenant}>
                    <SelectTrigger className="w-56" data-testid="select-onboard-tenant">
                      <SelectValue placeholder="Tenant tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {([
                    { step: 1, title: "Tenant schema va ma'lumotlar bazasi yaratish", status: "done" },
                    { step: 2, title: "Super admin foydalanuvchi qo'shish", status: "done" },
                    { step: 3, title: "Tarif plani va modullarni belgilash", status: "done" },
                    { step: 4, title: "Demo ma'lumotlar yuklash (ixtiyoriy)", status: "done" },
                    { step: 5, title: "Admin onboarding treningi o'tkazish", status: "current" },
                    { step: 6, title: "Haqiqiy ma'lumotlar migratsiyasi", status: "pending" },
                    { step: 7, title: "Foydalanuvchilarni import qilish va rollarni belgilash", status: "pending" },
                    { step: 8, title: "Go-live tasdiqlash va monitoring", status: "pending" },
                  ]).map(s => (
                    <div key={s.step} className="flex items-center gap-3" data-testid={`row-step-${s.step}`}>
                      {s.status === "done"
                        ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                        : s.status === "current"
                          ? <Activity className="h-5 w-5 text-blue-600 shrink-0" />
                          : <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />}
                      <span className={`text-sm flex-1 ${s.status === "done" ? "text-muted-foreground line-through" : s.status === "current" ? "font-medium" : "text-muted-foreground"}`}>
                        {s.step}. {s.title}
                      </span>
                      {s.status === "current" && <Badge variant="secondary">Davom etmoqda</Badge>}
                      {s.status === "done" && <Badge variant="default">Bajarildi</Badge>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-onboard-next">Keyingi bosqich</Button>
                  <Button variant="outline" size="sm" data-testid="button-onboard-complete">Go-live qilish</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== TARIFLAR ===================== */}
          <TabsContent value="licensing" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Tarif Rejalari va Litsenziyalar</h2>
            <div className="grid grid-cols-4 gap-4">
              {([
                { plan: "Basic", price: "$199/oy", users: "30 nafar", modules: "5 modul (CRM, WMS, QC, HR, SD)", color: "border-muted", highlight: false },
                { plan: "Starter", price: "$399/oy", users: "80 nafar", modules: "10 modul", color: "border-secondary", highlight: false },
                { plan: "Professional", price: "$799/oy", users: "200 nafar", modules: "14 modul", color: "border-primary", highlight: true },
                { plan: "Enterprise", price: "$1,499/oy", users: "Cheksiz", modules: "17 ta barcha modul + IoT", color: "border-blue-400", highlight: false },
              ]).map(p => (
                <Card key={p.plan} className={`border-2 ${p.color} ${p.highlight ? "shadow-md" : ""}`}>
                  <CardContent className="pt-5 pb-4">
                    {p.highlight && <Badge className="mb-2 w-full justify-center">Tavsiya etilgan</Badge>}
                    <div className="text-center">
                      <div className="font-bold text-lg">{p.plan}</div>
                      <div className="text-2xl font-bold text-primary mt-1">{p.price}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.users}</div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">{p.modules}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground text-center">
                        {(Array.isArray(tenants) ? tenants : []).filter((t: SaaSTenant) => (t.plan ?? "") === p.plan.toLowerCase()).length} ta joriy tenant
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Tenant Tarif Holati</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Oylik to'lov</TableHead>
                      <TableHead>Muddati</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => (
                      <TableRow key={t.id} data-testid={`row-license-${t.id}`}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell><Badge variant="outline">{PLAN_LABELS[t.plan ?? ""] || t.plan}</Badge></TableCell>
                        <TableCell>${t.monthlyFee || 0}/oy</TableCell>
                        <TableCell className={t.expiresAt && t.expiresAt < new Date().toISOString().split("T")[0] ? "text-red-600" : ""}>{t.expiresAt || "—"}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANTS[t.status ?? ""] || "outline"}>{t.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== MODUL NAZORAT ===================== */}
          <TabsContent value="modules" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Modul Nazorati</h2>
              <div className="flex items-center gap-2">
                <Label className="text-sm shrink-0">Tenant:</Label>
                <Select
                  value={selectedTenant || (tenants[0]?.id !== undefined ? String(tenants[0].id) : undefined)}
                  onValueChange={setSelectedTenant}
                >
                  <SelectTrigger className="w-56" data-testid="select-module-tenant">
                    <SelectValue placeholder="Tenant tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(tenants) ? tenants : []).map((t: SaaSTenant) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedTenantData && (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modul</TableHead>
                        <TableHead>Kalit</TableHead>
                        <TableHead>Min. tarif</TableHead>
                        <TableHead>{String(selectedTenantData.name ?? "")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(ALL_MODULES) ? ALL_MODULES : []).map((mod) => {
                        const tenantModules: string[] = Array.isArray(selectedTenantData?.modulesEnabled) ? selectedTenantData.modulesEnabled : [];
                        const hasAccess = tenantModules.includes(mod.key);
                        const minTier = mod.tiers[0];
                        return (
                          <TableRow key={mod.key} data-testid={`row-module-${mod.key}`}>
                            <TableCell className="font-medium">{mod.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{mod.key}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{PLAN_LABELS[minTier] || minTier}</Badge></TableCell>
                            <TableCell>
                              {hasAccess
                                ? <CheckCircle className="h-4 w-4 text-green-600" />
                                : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== MONITORING ===================== */}
          <TabsContent value="monitoring" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tizim Monitoringi</h2>
              <Button variant="outline" size="sm" onClick={() => refetchStats()} data-testid="button-refresh-stats">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-4 gap-4">
                {([...Array(4)]).map((_, i) => <Card key={`k-${i}`}><CardContent className="pt-4 pb-3 h-16 animate-pulse bg-muted/30 rounded" /></Card>)}
              </div>
            ) : platformStats ? (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {([
                    { icon: Clock, l: "Uptime", v: `${platformStats.uptimeHours}h`, c: "text-green-600" },
                    { icon: Database, l: "DB hajmi", v: `${platformStats.database?.sizeMB || 0} MB`, c: "text-blue-600" },
                    { icon: Cpu, l: "Heap xotira", v: `${platformStats.memory?.heapUsed || 0} MB`, c: "text-orange-600" },
                    { icon: AlertCircle, l: "Xatolar (24h)", v: platformStats.errors?.last24h || 0, c: (platformStats.errors?.last24h ?? 0) > 0 ? "text-red-600" : "text-green-600" },
                  ]).map(s => (
                    <Card key={s.l}><CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className={`h-4 w-4 ${s.c}`} />
                        <span className="text-xs text-muted-foreground">{s.l}</span>
                      </div>
                      <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                    </CardContent></Card>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Tenant statistika</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {([
                        { l: "Jami", v: platformStats.tenants?.total },
                        { l: "Faol", v: platformStats.tenants?.active },
                        { l: "Sinov", v: platformStats.tenants?.trial },
                        { l: "Bloklangan", v: platformStats.tenants?.suspended },
                        { l: "Bekor qilingan", v: platformStats.tenants?.cancelled },
                        { l: "Jami foydalanuvchilar", v: platformStats.users?.total },
                      ]).map(s => (
                        <div key={s.l} className="flex items-center justify-between text-sm" data-testid={`stat-${s.l.replace(" ", "-")}`}>
                          <span className="text-muted-foreground">{s.l}</span>
                          <span className="font-medium">{s.v ?? 0}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Server holati</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {([
                        { l: "Versiya", v: platformStats.version },
                        { l: "Muhit", v: platformStats.environment },
                        { l: "RSS xotira", v: `${platformStats.memory?.rss || 0} MB` },
                        { l: "Heap xotira", v: `${platformStats.memory?.heapUsed || 0} MB` },
                        { l: "Uptime", v: `${Math.round((platformStats.uptime || 0) / 60)} daqiqa` },
                      ]).map(s => (
                        <div key={s.l} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{s.l}</span>
                          <span className="font-medium font-mono">{s.v ?? "—"}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                  Ma'lumot yuklanmadi
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== XATOLAR LOGI ===================== */}
          <TabsContent value="errors" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tizim Xatolari Logi</h2>
              <Button variant="outline" size="sm" onClick={() => refetchErrors()} data-testid="button-refresh-errors">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {errorsLoading ? (
                  <div className="p-8 text-center text-muted-foreground animate-pulse">Yuklanmoqda...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vaqt</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Daraja</TableHead>
                        <TableHead>Modul</TableHead>
                        <TableHead>Xabar</TableHead>
                        <TableHead>Yo'l</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((errorLogsData as { logs?: ErrorLog[] } | undefined)?.logs || []).map((e: ErrorLog, i: number) => (
                        <TableRow key={e.id || i} data-testid={`row-error-${i}`}>
                          <TableCell className="text-xs font-mono">{e.createdAt ? new Date(e.createdAt).toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                          <TableCell className="text-sm">{e.tenantId || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={e.level === "error" ? "destructive" : e.level === "warn" ? "secondary" : "outline"} className="text-xs">{e.level}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{e.module || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{e.message}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{e.requestPath || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {(errorLogsData?.logs || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            Hech qanday xato yo'q
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
