/**
 * @module camera-settings
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Sliders, Bell, AlertTriangle, ArrowLeft, Bot, Zap, Save } from "lucide-react";
import { Link } from "wouter";
// Sub-components
import { CameraTriggerRules } from "@/components/settings/camera/CameraTriggerRules";
import { CameraAIPrompts } from "@/components/settings/camera/CameraAIPrompts";
import { AISettingsTab } from "@/components/settings/camera/AISettingsTab";
import { AlertsSettingsTab } from "@/components/settings/camera/AlertsSettingsTab";
import { TelegramSettingsTab } from "@/components/settings/camera/TelegramSettingsTab";
import { PenaltySettingsTab } from "@/components/settings/camera/PenaltySettingsTab";
import { CameraSettingsData } from "@/components/settings/camera/types";
import { EPErrorState, EPPageHeader, EPLoader } from "@/components/ep";

export default function CameraSettings() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<"uz" | "ru">("uz");
  
  const [safetyThreshold, setSafetyThreshold] = useState(80);
  const [qualityThreshold, setQualityThreshold] = useState(75);
  const [productivityThreshold, setProductivityThreshold] = useState(70);
  
  const [enableSafetyAlerts, setEnableSafetyAlerts] = useState(true);
  const [enableQualityAlerts, setEnableQualityAlerts] = useState(true);
  const [enableMachineAlerts, setEnableMachineAlerts] = useState(true);
  const [enableProductivityAlerts, setEnableProductivityAlerts] = useState(false);
  
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [dailyReportTime, setDailyReportTime] = useState("18:00");
  const [alertCooldown, setAlertCooldown] = useState(5);
  
  const [autoPenalty, setAutoPenalty] = useState(true);
  const [penaltyAmount, setPenaltyAmount] = useState(50000);

  const { data: settings, isLoading, isError, refetch} = useQuery<CameraSettingsData>({
    queryKey: ["/api/camera-settings"]
  });

  useEffect(() => {
    if (settings) {
      setSafetyThreshold(settings.safetyThreshold);
      setQualityThreshold(settings.qualityThreshold);
      setProductivityThreshold(settings.productivityThreshold);
      setEnableSafetyAlerts(settings.enableSafetyAlerts);
      setEnableQualityAlerts(settings.enableQualityAlerts);
      setEnableMachineAlerts(settings.enableMachineAlerts);
      setEnableProductivityAlerts(settings.enableProductivityAlerts);
      setTelegramEnabled(settings.telegramEnabled);
      setDailyReportTime(settings.dailyReportTime);
      setAlertCooldown(settings.alertCooldown);
      setAutoPenalty(settings.autoPenalty);
      setPenaltyAmount(settings.penaltyAmount);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: CameraSettingsData) => {
      return apiRequest("POST", "/api/camera-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera-settings"] });
      toast({
        title: language === "uz" ? "Sozlamalar saqlandi" : "Настройки сохранены",
        description: language === "uz" ? "Barcha o'zgarishlar saqlandi" : "Все изменения сохранены"
      });
    },
    onError: () => {
      toast({
        title: language === "uz" ? "Xato" : "Ошибка",
        description: language === "uz" ? "Sozlamalarni saqlashda xato" : "Ошибка сохранения настроек",
        variant: "destructive"
      });
    }
  });

  const t = {
    title: language === "uz" ? "Kamera Sozlamalari" : "Настройки камер",
    subtitle: language === "uz" ? "AI tahlil va ogohlantirish sozlamalari" : "Настройки AI анализа и уведомлений",
    back: language === "uz" ? "Orqaga" : "Назад",
    aiSettings: language === "uz" ? "AI Sozlamalari" : "Настройки AI",
    alertSettings: language === "uz" ? "Ogohlantirish" : "Уведомления",
    telegramSettings: language === "uz" ? "Telegram" : "Telegram",
    penaltySettings: language === "uz" ? "Jarima" : "Штрафы",
    safetyThreshold: language === "uz" ? "Xavfsizlik sezgirligi" : "Чувствительность безопасности",
    qualityThreshold: language === "uz" ? "Sifat sezgirligi" : "Чувствительность качества",
    productivityThreshold: language === "uz" ? "Samaradorlik chegarasi" : "Порог производительности",
    enableSafety: language === "uz" ? "Xavfsizlik ogohlantirishlarini yoqish" : "Включить уведомления безопасности",
    enableQuality: language === "uz" ? "Sifat ogohlantirishlarini yoqish" : "Включить уведомления качества",
    enableMachine: language === "uz" ? "Mashina ogohlantirishlarini yoqish" : "Включить уведомления машин",
    enableProductivity: language === "uz" ? "Samaradorlik ogohlantirishlarini yoqish" : "Включить уведомления производительности",
    telegramEnabled: language === "uz" ? "Telegram bildirishnomalarini yoqish" : "Включить Telegram уведомления",
    dailyReport: language === "uz" ? "Kunlik hisobot vaqti" : "Время ежедневного отчета",
    cooldown: language === "uz" ? "Ogohlantirishlar orasidagi vaqt (daqiqa)" : "Интервал между уведомлениями (мин)",
    autoPenalty: language === "uz" ? "Avtomatik jarima yozish" : "Автоматическое начисление штрафа",
    penaltyAmount: language === "uz" ? "Jarima miqdori (so'm)" : "Сумма штрафа (сум)",
    save: language === "uz" ? "Saqlash" : "Сохранить",
    saved: language === "uz" ? "Sozlamalar saqlandi" : "Настройки сохранены",
    lowSensitivity: language === "uz" ? "Past" : "Низкая",
    highSensitivity: language === "uz" ? "Yuqori" : "Высокая"
  };

  const handleSave = () => {
    saveMutation.mutate({
      safetyThreshold,
      qualityThreshold,
      productivityThreshold,
      enableSafetyAlerts,
      enableQualityAlerts,
      enableMachineAlerts,
      enableProductivityAlerts,
      telegramEnabled,
      dailyReportTime,
      alertCooldown,
      autoPenalty,
      penaltyAmount
    });
  };

  if (isError) {
    return <EPErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="space-y-4">
          {([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/camera-dashboard">
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:bg-muted/40" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t.back}
              </Button>
            </Link>
          </div>
          <EPPageHeader
        breadcrumb={<><b className="text-foreground">{t.title}</b></>}
        title={t.title}
        subtitle={t.subtitle}
      />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button 
              variant={language === "uz" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("uz")}
              data-testid="button-lang-uz"
            >
              UZ
            </Button>
            <Button 
              variant={language === "ru" ? "default" : "ghost"} 
              size="sm"
              className="rounded-none px-4"
              onClick={() => setLanguage("ru")}
              data-testid="button-lang-ru"
            >
              RU
            </Button>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="rounded-lg shadow-sm"
            data-testid="button-save-main"
          >
            {saveMutation.isPending ? <EPLoader className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {t.save}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg grid grid-cols-2 lg:grid-cols-6 w-full">
          <TabsTrigger value="ai" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-ai">
            <Sliders className="h-4 w-4 mr-2" />
            {t.aiSettings}
          </TabsTrigger>
          <TabsTrigger value="prompts" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-prompts">
            <Bot className="h-4 w-4 mr-2" />
            {language === "uz" ? "AI Promptlar" : "AI Промпты"}
          </TabsTrigger>
          <TabsTrigger value="triggers" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-triggers">
            <Zap className="h-4 w-4 mr-2" />
            {language === "uz" ? "Trigger qoidalar" : "Триггеры"}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-alerts">
            <Bell className="h-4 w-4 mr-2" />
            {t.alertSettings}
          </TabsTrigger>
          <TabsTrigger value="telegram" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-telegram">
            <Bot className="h-4 w-4 mr-2" />
            {t.telegramSettings}
          </TabsTrigger>
          <TabsTrigger value="penalty" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm" data-testid="tab-penalty">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t.penaltySettings}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AISettingsTab 
            language={language}
            safetyThreshold={safetyThreshold}
            setSafetyThreshold={setSafetyThreshold}
            qualityThreshold={qualityThreshold}
            setQualityThreshold={setQualityThreshold}
            productivityThreshold={productivityThreshold}
            setProductivityThreshold={setProductivityThreshold}
            t={t}
          />
        </TabsContent>

        <TabsContent value="prompts">
          <CameraAIPrompts />
        </TabsContent>

        <TabsContent value="triggers">
          <CameraTriggerRules />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsSettingsTab 
            language={language}
            enableSafetyAlerts={enableSafetyAlerts}
            setEnableSafetyAlerts={setEnableSafetyAlerts}
            enableQualityAlerts={enableQualityAlerts}
            setEnableQualityAlerts={setEnableQualityAlerts}
            enableMachineAlerts={enableMachineAlerts}
            setEnableMachineAlerts={setEnableMachineAlerts}
            enableProductivityAlerts={enableProductivityAlerts}
            setEnableProductivityAlerts={setEnableProductivityAlerts}
            t={t}
          />
        </TabsContent>

        <TabsContent value="telegram">
          <TelegramSettingsTab 
            language={language}
            telegramEnabled={telegramEnabled}
            setTelegramEnabled={setTelegramEnabled}
            dailyReportTime={dailyReportTime}
            setDailyReportTime={setDailyReportTime}
            alertCooldown={alertCooldown}
            setAlertCooldown={setAlertCooldown}
            t={t}
          />
        </TabsContent>

        <TabsContent value="penalty">
          <PenaltySettingsTab 
            language={language}
            autoPenalty={autoPenalty}
            setAutoPenalty={setAutoPenalty}
            penaltyAmount={penaltyAmount}
            setPenaltyAmount={setPenaltyAmount}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
