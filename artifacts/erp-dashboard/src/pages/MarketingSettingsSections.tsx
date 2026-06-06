/**
 * @module MarketingSettingsSections
 * @description Major section components for MarketingSettings page.
 */

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Shield, Pencil, Save, CheckCircle2, XCircle } from "lucide-react";
import type { MarketingSetting } from "@shared/schema";
import type { SocialApiConfig } from "./MarketingSettingsTypes";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

// TZ_02-04: Telegram Webhook faollashtirish komponenti
export function TelegramWebhookActivation() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const webhookUrl = `${window.location.origin}/api/marketing/webhook/telegram-customer`;
      const data = (await apiRequest('POST', "/api/marketing/settings/setup-telegram-webhook", { webhookUrl })) as { message?: string };
      toast({ title: "Muvaffaqiyat", description: String(data.message) || "Telegram webhook faollashtirildi" });
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
          <Shield className="h-4 w-4 text-[var(--ep-blue)]" />
          {t("telegramWebhookSozlamasi")}
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

interface WebhookUrlsSectionProps {
  webhookUrl: string;
}

export function WebhookUrlsSection({ webhookUrl }: WebhookUrlsSectionProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  return (
    <>
      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/60 py-3 px-6">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("webhookUrllar")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-1">
          <Label className="text-sm text-muted-foreground font-bold">{t("metaInstagramFacebook")}</Label>
            <div className="flex gap-3">
              <Input readOnly value={`${webhookUrl}/meta`} className="bg-background border-border font-mono text-xs h-11" data-testid="input-webhook-meta" />
              <Button variant="outline" className="border-border text-foreground font-semibold h-11" onClick={() => { navigator.clipboard.writeText(`${webhookUrl}/meta`); toast({ title: "Nusxalandi" }); }}>{t("nusxa")}</Button>
            </div>
          </div>
          <div className="space-y-1">
          <Label className="text-sm text-muted-foreground font-bold">{t("telegram")}</Label>
            <div className="flex gap-3">
              <Input readOnly value={`${webhookUrl}/telegram`} className="bg-background border-border font-mono text-xs h-11" data-testid="input-webhook-telegram" />
              <Button variant="outline" className="border-border text-foreground font-semibold h-11" onClick={() => { navigator.clipboard.writeText(`${webhookUrl}/telegram`); toast({ title: "Nusxalandi" }); }}>{t("nusxa")}</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {t("ushbuUrllarniMetaDeveloperConsole")}
          </p>
        </CardContent>
      </Card>

      {/* TZ_02-04: Telegram Webhook faollashtirish */}
      <div className="bg-card rounded-lg border-none shadow-sm overflow-hidden">
        <TelegramWebhookActivation />
      </div>
    </>
  );
}

interface ApiConfigsListProps {
  apiConfigs: SocialApiConfig[];
  apisLoading: boolean;
  onEdit: (cfg: SocialApiConfig) => void;
}

export function ApiConfigsList({ apiConfigs, apisLoading, onEdit }: ApiConfigsListProps) {
  const { t } = useTranslation("common");
  if (apisLoading) return <Skeleton className="h-32 rounded-lg" />;

  if (apiConfigs?.length === 0) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-12 text-center text-muted-foreground">{t("socialApiSozlamalariYoq")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {apiConfigs?.map((cfg) => (
        <Card key={cfg.id} className="bg-card border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-api-${cfg.id}`}>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-foreground capitalize">{cfg.platform}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">Page ID: {cfg.pageId || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cfg.isActive ? (
                <Badge variant="outline" className="border-green-200 bg-green-50 text-[var(--ep-green)] rounded-full px-2.5 py-0.5 text-xs font-bold no-default-hover-elevate"><CheckCircle2 className="h-3 w-3 mr-1.5" />{t("active")}</Badge>
              ) : (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-[var(--ep-red)] rounded-full px-2.5 py-0.5 text-xs font-bold no-default-hover-elevate"><XCircle className="h-3 w-3 mr-1.5" />{t("inactive")}</Badge>
              )}
              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={() => onEdit(cfg)}><Pencil className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface GeneralSettingsListProps {
  grouped: Record<string, MarketingSetting[]>;
  editId: string | null;
  editValue: string;
  onEditStart: (id: string, value: string) => void;
  onEditValueChange: (value: string) => void;
  onSave: (id: string) => void;
  isSavePending: boolean;
}

export function GeneralSettingsList({
  grouped,
  editId,
  editValue,
  onEditStart,
  onEditValueChange,
  onSave,
  isSavePending,
}: GeneralSettingsListProps) {
  const { t } = useTranslation("common");
  if (Object.keys(grouped).length === 0) {
    return (
      <Card className="bg-card border-none">
        <CardContent className="p-12 text-center text-muted-foreground">{t("hozirchaSozlamalarYoq")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {Object.entries(grouped).map(([cat, catSettings]: [string, MarketingSetting[]]) => (
        <Card key={cat} className="bg-card border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/60 py-3 px-6">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-outline-variant">
              {(Array.isArray(catSettings) ? catSettings : []).map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors" data-testid={`setting-item-${s.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold text-primary">{s.key}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>}
                  </div>
                  {editId === s.id ? (
                    <div className="flex items-center gap-2">
                      <Input className="w-48 bg-background border-border h-9" value={editValue} onChange={(e) => onEditValueChange(e.target.value)} />
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-primary hover:bg-primary/5 no-default-hover-elevate" onClick={() => onSave(s.id)} disabled={isSavePending}><Save className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">{s.value || "-"}</span>
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted no-default-hover-elevate" onClick={() => onEditStart(s.id, s.value || "")}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
