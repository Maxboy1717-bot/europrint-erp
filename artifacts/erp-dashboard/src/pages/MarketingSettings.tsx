/**
 * @module MarketingSettings
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, selectArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Webhook, Settings } from "lucide-react";
import type { MarketingSetting } from "@shared/schema";
import type { SocialApiConfig, SettingFormState, ApiFormState } from "./MarketingSettingsTypes";
import { DEFAULT_SETTING_FORM, DEFAULT_API_FORM } from "./MarketingSettingsTypes";
import { ApiConfigsList, WebhookUrlsSection, GeneralSettingsList } from "./MarketingSettingsSections";
import { ApiDialog, CreateSettingDialog } from "./MarketingSettingsDialogs";
import { EPErrorState, EPPageHeader } from "@/components/ep";

import { useTranslation } from '@/lib/i18n';
export default function MarketingSettings() {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [form, setForm] = useState<SettingFormState>(DEFAULT_SETTING_FORM);
  const [apiOpen, setApiOpen] = useState(false);
  const [apiForm, setApiForm] = useState<ApiFormState>(DEFAULT_API_FORM);
  const [editApiId, setEditApiId] = useState<string | null>(null);

  const { data: settings = [], isLoading, isError, refetch } = useQuery<MarketingSetting[]>({
    queryKey: ["/api/marketing/settings"],
    select: selectArray<MarketingSetting>,
  });
  const { data: apiConfigs = [], isLoading: apisLoading } = useQuery<SocialApiConfig[]>({
    queryKey: ["/api/marketing/settings/social-api"],
    select: selectArray<SocialApiConfig>,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings"] });
      setOpen(false);
      resetForm();
      toast({ title: "Sozlama yaratildi" });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/marketing/settings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings"] });
      setEditId(null);
      toast({ title: "Sozlama saqlandi" });
    },
  });

  const apiCreateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/marketing/settings/social-api", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings/social-api"] });
      setApiOpen(false);
      resetApiForm();
      toast({ title: "API sozlama saqlandi" });
    },
    onError: (e: unknown) => toast({ title: "Xatolik", description: (e as Error).message, variant: "destructive" }),
  });

  const apiUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/marketing/settings/social-api/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/settings/social-api"] });
      setApiOpen(false);
      resetApiForm();
      toast({ title: "API sozlama yangilandi" });
    },
  });

  const resetForm = () => setForm(DEFAULT_SETTING_FORM);
  const resetApiForm = () => {
    setApiForm(DEFAULT_API_FORM);
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
      platform: cfg.platform,
      apiKey: cfg.apiKey || "",
      apiSecret: cfg.apiSecret || "",
      accessToken: cfg.accessToken || "",
      pageId: cfg.pageId || "",
      webhookSecret: cfg.webhookSecret || "",
      isActive: cfg.isActive,
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

  if (isLoading) return <div className="p-4"><Skeleton className="h-96 rounded-lg" /></div>;

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5" data-testid="marketing-settings">
      <EPPageHeader
        breadcrumb={<>Dashboard · <b className="text-foreground">Marketing Sozlamalar</b></>}
        title="Marketing Sozlamalar"
      />

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg">
          <TabsTrigger value="api" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md gap-2"><Key className="h-4 w-4" />{t('socialApi')}</TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md gap-2"><Webhook className="h-4 w-4" />Webhook'lar</TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-card data-[state=active]:text-primary rounded-md gap-2"><Settings className="h-4 w-4" />Umumiy</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6 mt-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">Ijtimoiy tarmoq API tokenlarini boshqaring</p>
            <ApiDialog
              open={apiOpen}
              onOpenChange={(v) => { setApiOpen(v); if (!v) resetApiForm(); }}
              editApiId={editApiId}
              apiForm={apiForm}
              onApiFormChange={setApiForm}
              onSubmit={handleApiSubmit}
              isSubmitPending={apiCreateMutation.isPending || apiUpdateMutation.isPending}
            />
          </div>
          <ApiConfigsList
            apiConfigs={apiConfigs}
            apisLoading={apisLoading}
            onEdit={handleEditApi}
          />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6 mt-0">
          <WebhookUrlsSection webhookUrl={webhookUrl} />
        </TabsContent>

        <TabsContent value="general" className="space-y-6 mt-0">
          <div className="flex justify-end">
            <CreateSettingDialog
              open={open}
              onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}
              form={form}
              onFormChange={setForm}
              onSubmit={handleSubmit}
              isSubmitPending={createMutation.isPending}
            />
          </div>
          <GeneralSettingsList
            grouped={grouped}
            editId={editId}
            editValue={editValue}
            onEditStart={(id, value) => { setEditId(id); setEditValue(value); }}
            onEditValueChange={setEditValue}
            onSave={handleSave}
            isSavePending={updateMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
