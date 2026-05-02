import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Shield, Factory, Settings, Activity } from "lucide-react";

interface AlertsSettingsTabProps {
  language: "uz" | "ru";
  enableSafetyAlerts: boolean;
  setEnableSafetyAlerts: (v: boolean) => void;
  enableQualityAlerts: boolean;
  setEnableQualityAlerts: (v: boolean) => void;
  enableMachineAlerts: boolean;
  setEnableMachineAlerts: (v: boolean) => void;
  enableProductivityAlerts: boolean;
  setEnableProductivityAlerts: (v: boolean) => void;
  t: Record<string, string>;
}

export function AlertsSettingsTab({
  language,
  enableSafetyAlerts,
  setEnableSafetyAlerts,
  enableQualityAlerts,
  setEnableQualityAlerts,
  enableMachineAlerts,
  setEnableMachineAlerts,
  enableProductivityAlerts,
  setEnableProductivityAlerts,
  t
}: AlertsSettingsTabProps) {
  return (
    <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-surface-container-low/50 py-4 px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
          <Bell className="h-5 w-5 text-yellow-500" />
          {t.alertSettings}
        </CardTitle>
        <CardDescription className="text-on-surface-variant">
          {language === "uz" ? "Qaysi turdagi ogohlantirishlarni qabul qilish" : "Какие типы уведомлений получать"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-low transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Shield className="h-5 w-5" />
            </div>
            <Label htmlFor="safety-alerts" className="font-bold text-on-surface cursor-pointer">{t.enableSafety}</Label>
          </div>
          <Switch
            id="safety-alerts"
            checked={enableSafetyAlerts}
            onCheckedChange={setEnableSafetyAlerts}
            data-testid="switch-safety"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-low transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Factory className="h-5 w-5" />
            </div>
            <Label htmlFor="quality-alerts" className="font-bold text-on-surface cursor-pointer">{t.enableQuality}</Label>
          </div>
          <Switch
            id="quality-alerts"
            checked={enableQualityAlerts}
            onCheckedChange={setEnableQualityAlerts}
            data-testid="switch-quality"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-low transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Settings className="h-5 w-5" />
            </div>
            <Label htmlFor="machine-alerts" className="font-bold text-on-surface cursor-pointer">{t.enableMachine}</Label>
          </div>
          <Switch
            id="machine-alerts"
            checked={enableMachineAlerts}
            onCheckedChange={setEnableMachineAlerts}
            data-testid="switch-machine"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-low transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Activity className="h-5 w-5" />
            </div>
            <Label htmlFor="productivity-alerts" className="font-bold text-on-surface cursor-pointer">{t.enableProductivity}</Label>
          </div>
          <Switch
            id="productivity-alerts"
            checked={enableProductivityAlerts}
            onCheckedChange={setEnableProductivityAlerts}
            data-testid="switch-productivity"
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}
