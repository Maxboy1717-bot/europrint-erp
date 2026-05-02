import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface TelegramSettingsTabProps {
  language: "uz" | "ru";
  telegramEnabled: boolean;
  setTelegramEnabled: (v: boolean) => void;
  dailyReportTime: string;
  setDailyReportTime: (v: string) => void;
  alertCooldown: number;
  setAlertCooldown: (v: number) => void;
  t: Record<string, string>;
}

export function TelegramSettingsTab({
  language,
  telegramEnabled,
  setTelegramEnabled,
  dailyReportTime,
  setDailyReportTime,
  alertCooldown,
  setAlertCooldown,
  t
}: TelegramSettingsTabProps) {
  return (
    <Card className="bg-surface-container-lowest border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-surface-container-low/50 py-4 px-6">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-on-surface">
          <Bot className="h-5 w-5 text-blue-500" />
          {t.telegramSettings}
        </CardTitle>
        <CardDescription className="text-on-surface-variant">
          {language === "uz" ? "Telegram bot orqali bildirishnomalar" : "Уведомления через Telegram бот"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline-variant">
          <Label htmlFor="telegram-enabled" className="font-bold text-on-surface">{t.telegramEnabled}</Label>
          <Switch
            id="telegram-enabled"
            checked={telegramEnabled}
            onCheckedChange={setTelegramEnabled}
            data-testid="switch-telegram"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="daily-report" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.dailyReport}</Label>
            <Input
              id="daily-report"
              type="time"
              value={dailyReportTime}
              onChange={(e) => setDailyReportTime(e.target.value)}
              className="bg-surface border-outline-variant rounded-lg h-10 w-full"
              data-testid="input-daily-report"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cooldown" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t.cooldown}</Label>
            <Select value={alertCooldown.toString()} onValueChange={(v) => setAlertCooldown(parseInt(v))}>
              <SelectTrigger className="bg-surface border-outline-variant rounded-lg h-10 w-full" data-testid="select-cooldown">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-container-lowest border-outline-variant">
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
