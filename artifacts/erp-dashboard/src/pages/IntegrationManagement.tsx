/**
 * @module IntegrationManagement
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle, XCircle, AlertTriangle, Zap, Shield,
  Database, MessageSquare, Brain, Camera, Lock, Server,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

const INTEGRATION_ICONS: Record<string, typeof Zap> = {
  telegram: MessageSquare,
  openai: Brain,
  gemini: Brain,
  postgres: Database,
  crm_webhook: Zap,
  face_ai: Camera,
  redis: Server,
  jwt: Lock,
  admin_auth: Shield,
};

const INTEGRATION_DESCRIPTIONS: Record<string, string> = {
  telegram: "Bot orqali xodimlar va direktorga xabarlar, hisobotlar yuborish",
  openai: "Texnologik kartalar, material normalar, AI tavsiyalar generatsiyasi",
  gemini: "Gemini Pro modeli orqali AI analitika va hisobotlar",
  postgres: "Neon PostgreSQL — asosiy ma'lumotlar bazasi",
  crm_webhook: "CRM tizimidan buyurtmalar va mijozlar ma'lumotlari",
  face_ai: "Kamera orqali yuz izi shifrlash va xavfsizlik",
  redis: "Kesh tizimi — API javoblarini tezlashtirish",
  jwt: "JWT token orqali autentifikatsiya",
  admin_auth: "Admin tizimiga kirish uchun maxsus foydalanuvchi",
};

interface IntegrationItem { key: string; status: string; name: string; type: string; [key: string]: unknown }
function IntegrationCard({ intg }: { intg: IntegrationItem }) {
  const { t } = useTranslation("common");
  const Icon = INTEGRATION_ICONS[intg.key] || Zap;
  const isConnected = intg.status === "connected" || intg.status === "active";
  const isWarning = ["warning", "in_memory", "default", "default_key"].includes(intg.status);

  return (
    <Card data-testid={`card-integration-${intg.key}`} className="relative">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md ${isConnected ? "bg-green-500/10" : isWarning ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
              <Icon className={`w-5 h-5 ${isConnected ? "text-[var(--ep-green)] dark:text-green-400" : isWarning ? "text-[var(--ep-yellow)] dark:text-yellow-400" : "text-[var(--ep-red)]"}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm">{intg.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {INTEGRATION_DESCRIPTIONS[intg.key] || "—"}
              </p>
              <Badge variant="outline" className="text-xs mt-2 capitalize">{intg.type}</Badge>
            </div>
          </div>
          {isConnected
            ? <Badge className="shrink-0 bg-green-500/10 text-[var(--ep-green)] dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />{t("connected")}</Badge>
            : isWarning
              ? <Badge className="shrink-0 bg-yellow-500/10 text-[var(--ep-yellow)] dark:text-yellow-400"><AlertTriangle className="w-3 h-3 mr-1" />{intg.status === "in_memory" ? "Xotirada" : "Ogohlantirish"}</Badge>
              : <Badge variant="destructive" className="shrink-0"><XCircle className="w-3 h-3 mr-1" />{t("ulanmagan")}</Badge>
          }
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationManagement() {
  const { t } = useTranslation("common");
  const { data: integrations, isLoading } = useQuery<IntegrationItem[]>({
    queryKey: ["/api/system/integrations"],
    refetchInterval: 60000,
  });

  const connected = integrations?.filter(i => i.status === "connected" || i.status === "active").length || 0;
  const total = integrations?.length || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/system/integrations"] });
  };

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("integratsiyalarBoshqaruvi")}</b></>}
        title={t("integratsiyalarBoshqaruvi")}
        subtitle={t("tashqiTizimlarVaApiUlanishlar")}
        actions={
          <Button variant="outline" size="default" onClick={handleRefresh} data-testid="button-refresh-integrations">
            <RefreshCw className="w-4 h-4 mr-2" />{t("refresh")}
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm mb-1">{t("jamiIntegratsiyalar")}</div>
            <div className="text-3xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm mb-1">{t("connected")}</div>
            <div className="text-3xl font-bold text-[var(--ep-green)] dark:text-green-400">{connected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm mb-1">{t("muammoBor")}</div>
            <div className="text-3xl font-bold text-[var(--ep-red)]">{total - connected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => <Skeleton key={`k-${i}`} className="h-32 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations?.map((intg) => (
            <IntegrationCard key={intg.key} intg={intg} />
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("integratsiyaniUlash")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t("harBirIntegratsiyaUchunTegishliMuhit")}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> {t("telegramBotUlanishiUchun")}</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">AI_INTEGRATIONS_OPENAI_API_KEY</code> {t("openaiAiFunksiyalariUchun")}</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">AI_INTEGRATIONS_GEMINI_API_KEY</code> {t("geminiAiFunksiyalariUchun")}</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">FACE_ENCRYPTION_KEY</code> {t("yuzIziShifrlashUchun")}</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">REDIS_URL</code> — Redis kesh uchun (ixtiyoriy)</li>
            </ul>
            <p className="mt-3">{t("muhitOzgaruvchilarniReplitSecretsOrqali")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
