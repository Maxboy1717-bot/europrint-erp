import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Pencil, Save, Shield, Key, Webhook, CheckCircle2, XCircle } from "lucide-react";
import type { MarketingSetting } from "@shared/schema";
import { ErrorState } from "@/components/ui/error-state";

// TZ_02-04: Telegram Webhook faollashtirish komponenti
function TelegramWebhookActivation() {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const webhookUrl = `${window.location.origin}/api/marketing/webhook/telegram-customer`;
      const res = await fetch("/api/marketing/settings/setup-telegram-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Muvaffaqiyat", description: String(data.message) || "Telegram webhook faollashtirildi" });
      } else {
        toast({ title: "Xatolik", description: String(data.message) || data.error || "Webhook o'rnatishda xatolik", variant: "destructive" });
      }
    } catch {
      toast({ title: "Xatolik", description: "Serverga ulanishda xatolik", variant: "destructive" });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          Telegram Webhook Sozlamasi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Telegram botingiz uchun webhook manzilini avtomatik o'rnating. Bu tugma bosilganda
          tizim Telegram API ga bog'lanib, kiruvchi xabarlarni qabul qilish uchun webhook ni faollashtiradi.
        </p>
        <Button
          onClick={handleActivate}
          disabled={isActivating}
          data-testid="button-activate-telegram-webhook"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {isActivating ? "Sozlanmoqda..." : "Telegram Webhook ni faollashtirish"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface SocialApiConfig {
  id: string;
  platform: string;
  apiKey: string | null;
  apiSecret: string | null;
  accessToken: string | null;
  pageId: string | null;
  webhookSecret: string | null;
  isActive: boolean;
}

export default function MarketingSettings() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [form, setForm] = useState({ key: "", value: "", category: "general", description: "" });
  const [apiOpen, setApiOpen] = useState(false);
  const [apiForm, setApiForm] = useState({
    platform: "instagram", apiKey: "", apiSecret: "", accessToken: "", pageId: "", webhookSecret: "", isActive: true,
  });
  const [editApiId, setEditApiId] = useState<string | null>(null);

  const { data: settings = [], isLoading, isError, refetch} = useQuery<MarketingSetting[]>({ queryKey: ["/api/marketing/settings"], select: selectArray<MarketingSetting> });
  const { data: apiConfigs = [], isLoading: apisLoading } = useQuery<SocialApiConfig[]>({ queryKey: ["/api/marketing/settings/social-api"], select: selectArray<SocialApiConfig> });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/settings", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings"] }); setOpen(false); resetForm(); toast({ title: "Sozlama yaratildi" }); },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/marketing/settings/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings"] }); setEditId(null); toast({ title: "Sozlama saqlandi" }); },
  });

  const apiCreateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/settings/social-api", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings/social-api"] });
      setApiOpen(false); resetApiForm();
      toast({ title: "API sozlama saqlandi" });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const apiUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => apiRequest("PATCH", `/api/marketing/settings/social-api/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings/social-api"] });
      setApiOpen(false); resetApiForm();
      toast({ title: "API sozlama yangilandi" });
    },
  });

  const resetForm = () => { setForm({ key: "", value: "", category: "general", description: "" }); };
  const resetApiForm = () => {
    setApiForm({ platform: "instagram", apiKey: "", apiSecret: "", accessToken: "", pageId: "", webhookSecret: "", isActive: true });
    setEditApiId(null);
  };

  const handleSubmit = () => {
    const payload = { ...form, description: form.description || undefined, value: form.value || undefined };
    createMutation.mutate(payload);
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({ id, data: { value: editValue } });
  };

  const handleEditApi = (cfg: SocialApiConfig) => {
    setEditApiId(cfg.id);
    setApiForm({
      platform: cfg.platform, apiKey: cfg.apiKey || "", apiSecret: cfg.apiSecret || "",
      accessToken: cfg.accessToken || "", pageId: cfg.pageId || "",
      webhookSecret: cfg.webhookSecret || "", isActive: cfg.isActive,
    });
    setApiOpen(true);
  };

  const handleApiSubmit = () => {
    const payload = { ...apiForm };
    if (editApiId) apiUpdateMutation.mutate({ id: editApiId, data: payload });
    else apiCreateMutation.mutate(payload);
  };

  const settingsArray = selectArray<MarketingSetting>(settings);
  const grouped = settingsArray.reduce((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, MarketingSetting[]>);

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/marketing/webhook` : "";

  if (isLoading) return <div className="p-4"><Skeleton className="h-96" /></div>;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="p-6 space-y-6" data-testid="marketing-settings">
      <h1 className="text-4xl font-light tracking-tight text-on-surface">
        Marketing <span className="font-bold text-primary">Sozlamalar</span>
      </h1>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-surface-container-low p-1 rounded-lg">
          <TabsTrigger value="api" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md gap-2"><Key className="h-4 w-4" />Social API</TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md gap-2"><Webhook className="h-4 w-4" />Webhook'lar</TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary rounded-md gap-2"><Settings className="h-4 w-4" />Umumiy</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6 mt-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-on-surface-variant">Ijtimoiy tarmoq API tokenlarini boshqaring</p>
            <Dialog open={apiOpen} onOpenChange={(v) => { setApiOpen(v); if (!v) resetApiForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" data-testid="button-add-api">
                  <Plus className="h-4 w-4 mr-2" />API qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-surface-container-lowest border-none ">
                <DialogHeader><DialogTitle className="text-on-surface font-bold">{editApiId ? "API ni tahrirlash" : "Yangi API sozlama"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-on-surface-variant">Platforma *</Label>
                    <Select value={apiForm.platform} onValueChange={(v) => setApiForm({ ...apiForm, platform: v })}>
                      <SelectTrigger className="bg-surface border-outline-variant"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-surface-container-lowest border-outline-variant">
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">API Key</Label><Input className="bg-surface border-outline-variant" value={apiForm.apiKey} onChange={(e) => setApiForm({ ...apiForm, apiKey: e.target.value })} type="password" /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">API Secret</Label><Input className="bg-surface border-outline-variant" value={apiForm.apiSecret} onChange={(e) => setApiForm({ ...apiForm, apiSecret: e.target.value })} type="password" /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Access Token</Label><Input className="bg-surface border-outline-variant" value={apiForm.accessToken} onChange={(e) => setApiForm({ ...apiForm, accessToken: e.target.value })} type="password" /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Page/Bot ID</Label><Input className="bg-surface border-outline-variant" value={apiForm.pageId} onChange={(e) => setApiForm({ ...apiForm, pageId: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Webhook Secret</Label><Input className="bg-surface border-outline-variant" value={apiForm.webhookSecret} onChange={(e) => setApiForm({ ...apiForm, webhookSecret: e.target.value })} type="password" /></div>
                  <div className="flex items-center gap-3">
                    <Switch checked={apiForm.isActive} onCheckedChange={(v) => setApiForm({ ...apiForm, isActive: v })} className="data-[state=checked]:bg-primary" />
                    <Label className="text-on-surface font-medium">Faol</Label>
                  </div>
                  <Button onClick={handleApiSubmit} disabled={apiCreateMutation.isPending || apiUpdateMutation.isPending} className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-bold h-11" data-testid="button-submit-api">
                    {editApiId ? "Saqlash" : "Yaratish"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {apisLoading ? (
            <Skeleton className="h-32" />
          ) : apiConfigs?.length === 0 ? (
            <Card className="bg-surface-container-lowest border-none"><CardContent className="p-12 text-center text-on-surface-variant">Social API sozlamalari yo'q</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {apiConfigs?.map((cfg) => (
                <Card key={cfg.id} className="bg-surface-container-lowest border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-api-${cfg.id}`}>
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface capitalize">{cfg.platform}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5 font-medium">Page ID: {cfg.pageId || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {cfg.isActive ? (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 rounded-full px-2.5 py-0.5 text-xs font-bold no-default-hover-elevate"><CheckCircle2 className="h-3 w-3 mr-1.5" />Faol</Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 rounded-full px-2.5 py-0.5 text-xs font-bold no-default-hover-elevate"><XCircle className="h-3 w-3 mr-1.5" />Nofaol</Badge>
                      )}
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high no-default-hover-elevate" onClick={() => handleEditApi(cfg)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6 mt-0">
          <Card className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-surface-container py-3 px-6"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Webhook URL'lar</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm text-on-surface-variant font-bold">Meta (Instagram/Facebook)</Label>
                <div className="flex gap-3">
                  <Input readOnly value={`${webhookUrl}/meta`} className="bg-surface border-outline-variant font-mono text-xs h-11" data-testid="input-webhook-meta" />
                  <Button variant="outline" className="border-outline-variant text-on-surface font-semibold h-11" onClick={() => { navigator.clipboard.writeText(`${webhookUrl}/meta`); toast({ title: "Nusxalandi" }); }}>Nusxa</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-on-surface-variant font-bold">Telegram</Label>
                <div className="flex gap-3">
                  <Input readOnly value={`${webhookUrl}/telegram`} className="bg-surface border-outline-variant font-mono text-xs h-11" data-testid="input-webhook-telegram" />
                  <Button variant="outline" className="border-outline-variant text-on-surface font-semibold h-11" onClick={() => { navigator.clipboard.writeText(`${webhookUrl}/telegram`); toast({ title: "Nusxalandi" }); }}>Nusxa</Button>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Ushbu URL'larni Meta Developer Console va Telegram BotFather'da webhook sifatida sozlang.
              </p>
            </CardContent>
          </Card>

          {/* TZ_02-04: Telegram Webhook faollashtirish */}
          <div className="bg-surface-container-lowest rounded-lg border-none shadow-sm overflow-hidden">
             <TelegramWebhookActivation />
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6 mt-0">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold" data-testid="button-create-setting">
                  <Plus className="h-4 w-4 mr-2" />Yangi Sozlama
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-surface-container-lowest border-none ">
                <DialogHeader><DialogTitle className="text-on-surface font-bold">Yangi Sozlama</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Kalit *</Label><Input className="bg-surface border-outline-variant" data-testid="input-setting-key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="brand_color" /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Qiymat</Label><Input className="bg-surface border-outline-variant" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Kategoriya</Label><Input className="bg-surface border-outline-variant" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="general" /></div>
                  <div className="space-y-1.5"><Label className="text-on-surface-variant">Tavsif</Label><Textarea className="bg-surface border-outline-variant" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                  <Button onClick={handleSubmit} disabled={!form.key || createMutation.isPending} className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-bold h-11" data-testid="button-submit-setting">Yaratish</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {Object.keys(grouped).length === 0 ? (
            <Card className="bg-surface-container-lowest border-none"><CardContent className="p-12 text-center text-on-surface-variant">Hozircha sozlamalar yo'q</CardContent></Card>
          ) : (
            <div className="grid gap-6">
              {Object.entries(grouped).map(([cat, catSettings]: [string, MarketingSetting[]]) => (
                <Card key={cat} className="bg-surface-container-lowest border-none shadow-sm overflow-hidden">
                  <CardHeader className="bg-surface-container py-3 px-6"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{cat}</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-outline-variant">
                      {(Array.isArray(catSettings) ? catSettings : []).map((s) => (
                        <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors" data-testid={`setting-item-${s.id}`}>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm font-bold text-primary">{s.key}</p>
                            {s.description && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{s.description}</p>}
                          </div>
                          {editId === s.id ? (
                            <div className="flex items-center gap-2">
                              <Input className="w-48 bg-surface border-outline-variant h-9" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-primary hover:bg-primary/5 no-default-hover-elevate" onClick={() => handleSave(s.id)} disabled={updateMutation.isPending}><Save className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-on-surface">{s.value || "-"}</span>
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high no-default-hover-elevate" onClick={() => { setEditId(s.id); setEditValue(s.value || ""); }}><Pencil className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
