/**
 * @module TelegramSettingsTab
 * @description React UI component.
 */

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
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardHeader className="bg-muted/40/50 py-4 px-6">
        <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
          <Bot className="h-5 w-5 text-[var(--ep-blue)]" />
          {t.telegramSettings}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {language === "uz" ? "Telegram bot orqali bildirishnomalar" : "Уведомления через Telegram бот"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
          <Label htmlFor="telegram-enabled" className="font-bold text-foreground">{t.telegramEnabled}</Label>
          <Switch
            id="telegram-enabled"
            checked={telegramEnabled}
            onCheckedChange={setTelegramEnabled}
            data-testid="switch-telegram"
            className="data-[state=checked]:bg-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
          <Label htmlFor="daily-report" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.dailyReport}</Label>
            <Input
              id="daily-report"
              type="time"
              value={dailyReportTime}
              onChange={(e) => setDailyReportTime(e.target.value)}
              className="bg-background border-border rounded-lg h-10 w-full"
              data-testid="input-daily-report"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="cooldown" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t.cooldown}</Label>
            <Select value={alertCooldown.toString()} onValueChange={(v) => setAlertCooldown(parseInt(v))}>
              <SelectTrigger className="bg-background border-border rounded-lg h-9 w-full" data-testid="select-cooldown">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
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
