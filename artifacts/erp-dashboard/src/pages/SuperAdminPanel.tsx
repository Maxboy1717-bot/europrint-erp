import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield, Building2, Users, Package, Settings, CheckCircle, XCircle,
  RefreshCw, Plus, Loader2, Database, Activity, Globe, Zap, Edit, Trash2,
  BarChart3, Server, AlertTriangle, Clock, Rocket,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: "basic" | "professional" | "enterprise";
  status: "active" | "suspended" | "trial";
  usersCount: number;
  modulesEnabled: string[];
  expiresAt: string;
  createdAt: string;
  contactEmail: string;
  contactPhone: string;
}

interface ModuleDef { key: string; label: string; labelRu: string }

interface PlatformStats {
  tenants: { total: number; active: number; trial: number; suspended: number };
  users: { total: number };
  database: { sizeBytes: number; sizeMB: number };
  uptime: number;
  version: string;
  environment: string;
  errors: { last24h: number };
}

interface ExpiryAlert {
  id: string;
  name: string;
  plan: string;
  status: string;
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface ExpiryAlertsData {
  total: number;
  expired: number;
  expiring: number;
  tenants: ExpiryAlert[];
}

const PLAN_LABELS: Record<string, string> = { basic: "Basic", professional: "Professional", enterprise: "Enterprise" };
const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", trial: "secondary", suspended: "destructive",
};
const STATUS_LABELS: Record<string, string> = { active: "Faol", trial: "Sinov", suspended: "To'xtatilgan" };

export default function SuperAdminPanel() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [confirmDeleteTenantId, setConfirmDeleteTenantId] = useState<number | null>(null);
  const [editModulesDialog, setEditModulesDialog] = useState<Tenant | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [newTenant, setNewTenant] = useState({ name: "", domain: "", plan: "basic", contactEmail: "", contactPhone: "" });

  const { data: tenantsData, isLoading: tenantsLoading, refetch } = useQuery<{ tenants: Tenant[]; total: number }>({
    queryKey: ["/api/saas/tenants"],
  });

  const { data: modulesData } = useQuery<{ modules: ModuleDef[] }>({
    queryKey: ["/api/saas/modules"],
  });

  const { data: platformStats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/saas/platform-stats"],
    refetchInterval: 60000,
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/saas/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saas/platform-stats"] });
      setAddDialogOpen(false);
      setNewTenant({ name: "", domain: "", plan: "basic", contactEmail: "", contactPhone: "" });
      toast({ title: "Tenant yaratildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/saas/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      toast({ title: "Status yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const updateModulesMutation = useMutation({
    mutationFn: ({ id, modulesEnabled }: { id: string; modulesEnabled: string[] }) =>
      apiRequest("PATCH", `/api/saas/tenants/${id}/modules`, { modulesEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      setEditModulesDialog(null);
      toast({ title: "Modullar yangilandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/saas/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saas/platform-stats"] });
      toast({ title: "Tenant o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const onboardMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/saas/tenants/${id}/onboard`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saas/tenants"] });
      toast({ title: "Onboarding muvaffaqiyatli bajarildi", description: "Tenant faollashtirildi va Telegram xabari yuborildi" });
    },
    onError: () => toast({ title: "Onboarding xatoligi", variant: "destructive" }),
  });

  const { data: expiryData } = useQuery<ExpiryAlertsData>({
    queryKey: ["/api/saas/expiry-alerts"],
    refetchInterval: 300000,
  });

  const tenants = tenantsData?.tenants ?? [];
  const modules = modulesData?.modules ?? [];

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}s ${m}d`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Super Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">SaaS platformasini boshqaring — tenantlar, modullar, litsenziyalar</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="icon" variant="ghost" onClick={() => refetch()} data-testid="button-refresh-saas">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-tenant">
            <Plus className="w-4 h-4 mr-2" />
            Yangi Tenant
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={`k-${i}`}><CardContent className="p-4"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>)
        ) : ([
          { label: "Jami Tenantlar", value: platformStats?.tenants.total ?? 0, sub: `${platformStats?.tenants.active ?? 0} faol`, icon: Building2, color: "text-blue-500" },
          { label: "Jami Foydalanuvchilar", value: platformStats?.users.total ?? 0, sub: "barcha tenantlarda", icon: Users, color: "text-green-500" },
          { label: "DB Hajmi", value: `${platformStats?.database.sizeMB ?? 0} MB`, sub: "PostgreSQL", icon: Database, color: "text-orange-500" },
          { label: "Uptime", value: formatUptime(platformStats?.uptime ?? 0), sub: platformStats?.version ?? "1.0.0", icon: Server, color: "text-purple-500" },
        ]).map((s, i) => (
          <Card key={`k-${i}`} data-testid={`saas-stat-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiry Alerts */}
      {(expiryData?.total ?? 0) > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Litsenziya muddati yaqinlashmoqda
            </CardTitle>
            <CardDescription>
              {expiryData?.expired ?? 0} ta muddati o'tgan, {expiryData?.expiring ?? 0} ta 30 kun ichida tugaydi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiryData?.tenants?.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`expiry-alert-${t.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.isExpired ? "bg-red-500" : t.daysRemaining <= 7 ? "bg-amber-500" : "bg-yellow-400"}`} />
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.plan} · {t.expiresAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.isExpired ? "destructive" : "outline"}>
                      <Clock className="w-3 h-3 mr-1" />
                      {t.isExpired ? "Muddati o'tgan" : `${t.daysRemaining} kun qoldi`}
                    </Badge>
                    {t.contactPhone && <span className="text-xs text-muted-foreground">{t.contactPhone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Tenantlar
          </CardTitle>
          <CardDescription>Barcha zavodlar va kompaniyalar</CardDescription>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Tenantlar yo'q</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomi</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Reja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Foydalanuvchilar</TableHead>
                  <TableHead>Modullar</TableHead>
                  <TableHead>Muddati</TableHead>
                  <TableHead>Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(tenants) ? tenants : []).map(t => (
                  <TableRow key={t.id} data-testid={`row-tenant-${t.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        {t.contactEmail && <p className="text-xs text-muted-foreground">{t.contactEmail}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{t.domain}</TableCell>
                    <TableCell><Badge variant="outline">{PLAN_LABELS[t.plan]}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[t.status]}>
                        {STATUS_LABELS[t.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.usersCount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.modulesEnabled.length} modul</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.expiresAt ? (
                        <div>
                          <p>{t.expiresAt}</p>
                          {(() => {
                            const days = Math.ceil((new Date(t.expiresAt).getTime() - Date.now()) / 86400000);
                            if (days < 0) return <Badge variant="destructive" className="text-xs mt-1">O'tgan</Badge>;
                            if (days <= 14) return <Badge variant="outline" className="text-xs mt-1 text-amber-600">{days}k qoldi</Badge>;
                            return null;
                          })()}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="Onboarding"
                          data-testid={`button-onboard-${t.id}`}
                          onClick={() => onboardMutation.mutate(t.id)}
                          disabled={onboardMutation.isPending}>
                          <Rocket className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Modullarni tahrirlash"
                          data-testid={`button-edit-modules-${t.id}`}
                          onClick={() => { setEditModulesDialog(t); setSelectedModules([...t.modulesEnabled]); }}>
                          <Zap className="w-3 h-3" />
                        </Button>
                        {t.status === "active" ? (
                          <Button size="icon" variant="ghost" title="To'xtatish"
                            data-testid={`button-suspend-${t.id}`}
                            onClick={() => updateStatusMutation.mutate({ id: t.id, status: "suspended" })}>
                            <XCircle className="w-3 h-3 text-red-500" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" title="Faollashtirish"
                            data-testid={`button-activate-${t.id}`}
                            onClick={() => updateStatusMutation.mutate({ id: t.id, status: "active" })}>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title="O'chirish"
                          data-testid={`button-delete-tenant-${t.id}`}
                          onClick={() => setConfirmDeleteTenantId(t.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground" />
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

      {/* Add Tenant Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Tenant Qo'shish</DialogTitle>
            <DialogDescription>Yangi zavod yoki kompaniyani ro'yxatdan o'tkazing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kompaniya nomi *</Label>
              <Input value={newTenant.name} onChange={e => setNewTenant(p => ({ ...p, name: e.target.value }))}
                placeholder="Europrint Samarkand" data-testid="input-tenant-name" />
            </div>
            <div>
              <Label>Domain *</Label>
              <Input value={newTenant.domain} onChange={e => setNewTenant(p => ({ ...p, domain: e.target.value }))}
                placeholder="samarkand.europrint.uz" data-testid="input-tenant-domain" />
            </div>
            <div>
              <Label>Reja</Label>
              <Select value={newTenant.plan} onValueChange={v => setNewTenant(p => ({ ...p, plan: v }))}>
                <SelectTrigger data-testid="select-tenant-plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kontakt email</Label>
              <Input value={newTenant.contactEmail} onChange={e => setNewTenant(p => ({ ...p, contactEmail: e.target.value }))}
                placeholder="admin@company.uz" type="email" data-testid="input-tenant-email" />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={newTenant.contactPhone} onChange={e => setNewTenant(p => ({ ...p, contactPhone: e.target.value }))}
                placeholder="+998 90 000 00 00" data-testid="input-tenant-phone" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Bekor</Button>
            <Button data-testid="button-submit-tenant"
              disabled={createTenantMutation.isPending || !newTenant.name || !newTenant.domain}
              onClick={() => createTenantMutation.mutate({ ...newTenant })}>
              {createTenantMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modules Dialog */}
      {editModulesDialog && (
        <Dialog open={!!editModulesDialog} onOpenChange={() => setEditModulesDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modullarni tahrirlash — {editModulesDialog.name}</DialogTitle>
              <DialogDescription>Ushbu tenant uchun modullarni yoqing yoki o'chiring</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {(Array.isArray(modules) ? modules : []).map(m => (
                <div key={m.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`mod-${m.key}`}
                    checked={selectedModules.includes(m.key)}
                    data-testid={`checkbox-module-${m.key}`}
                    onCheckedChange={checked => {
                      setSelectedModules(prev =>
                        checked ? [...prev, m.key] : (prev ?? []).filter(x => x !== m.key)
                      );
                    }}
                  />
                  <label htmlFor={`mod-${m.key}`} className="text-sm cursor-pointer">{m.label}</label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModulesDialog(null)}>Bekor</Button>
              <Button data-testid="button-save-modules"
                disabled={updateModulesMutation.isPending}
                onClick={() => updateModulesMutation.mutate({ id: editModulesDialog.id, modulesEnabled: selectedModules })}>
                {updateModulesMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Saqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={confirmDeleteTenantId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteTenantId(null); }}
        title="Tenantni o'chirish"
        description="Ushbu tenantni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteTenantId !== null) deleteTenantMutation.mutate(confirmDeleteTenantId); }}
      />
    </div>
  );
}
