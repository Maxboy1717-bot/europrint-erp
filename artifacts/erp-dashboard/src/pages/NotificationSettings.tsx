/**
 * @module NotificationSettings
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Smartphone, Save } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface NotifPref {
  key: string;
  email: boolean;
  telegram: boolean;
  inApp: boolean;
  sms: boolean;
}

const NOTIFICATION_TYPES = [
  { key: "task_assigned", label: "Vazifa tayinlandi", description: "Yangi vazifa sizga tayinlanganda" },
  { key: "order_status", label: "Buyurtma holati", description: "Buyurtma holati o'zgarganida" },
  { key: "payment_due", label: "To'lov muddati", description: "To'lov muddati yaqinlashganda" },
  { key: "approval_required", label: "Tasdiq kerak", description: "Sizning tasdiqingiz talab qilinganda" },
  { key: "defect_reported", label: "Nuqson qayd etildi", description: "Yangi sifat nuqsoni aniqlanganda" },
  { key: "leave_approved", label: "Ta'til tasdiqlandi", description: "Ta'til so'rovingiz ko'rib chiqilganda" },
  { key: "salary_processed", label: "Maosh hisoblandi", description: "Ish haqi hisob-kitobi yakunlanganda" },
  { key: "security_alert", label: "Xavfsizlik ogohlantirishi", description: "Tizimdagi shubhali faoliyat aniqlanganda" },
  { key: "stock_low", label: "Kam qoldiq", description: "Ombordagi mahsulot qoldig'i past darajaga tushganda" },
  { key: "shift_reminder", label: "Smena eslatmasi", description: "Smenangiz boshlanishidan 30 daqiqa oldin" },
];

const DEFAULT_PREFS: NotifPref[] = NOTIFICATION_TYPES.map((t) => ({
  key: t.key,
  email: true,
  telegram: true,
  inApp: true,
  sms: false,
}));

export default function NotificationSettings() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULT_PREFS);

  const { data: savedPrefs } = useQuery<NotifPref[]>({
    queryKey: ["/api/notifications/preferences"],
  });

  useEffect(() => {
    if (Array.isArray(savedPrefs) && savedPrefs.length > 0) {
      setPrefs(savedPrefs);
    }
  }, [savedPrefs]);

  const saveMutation = useMutation({
    mutationFn: (data: NotifPref[]) =>
      apiRequest("PATCH", "/api/notifications/preferences", { preferences: data }),
    onSuccess: () => toast({ title: "Sozlamalar saqlandi" }),
    onError: () =>
      toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  function toggle(key: string, channel: keyof Omit<NotifPref, "key">) {
    setPrefs((prev) =>
      (Array.isArray(prev) ? prev : []).map((p) =>
        p.key === key ? { ...p, [channel]: !p[channel] } : p
      )
    );
  }

  function getPref(key: string): NotifPref {
    return (Array.isArray(prefs) ? prefs : []).find((p) => p.key === key) ?? {
      key,
      email: false,
      telegram: false,
      inApp: false,
      sms: false,
    };
  }

  const activeCount = (Array.isArray(prefs) ? prefs : []).reduce(
    (acc, p) => acc + (p.email || p.telegram || p.inApp || p.sms ? 1 : 0),
    0
  );

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">{t("bildirishnomaSozlamalari")}</h1>
          <EPStatusPill tone="neutral">{activeCount} faol</EPStatusPill>
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(prefs)}
          disabled={saveMutation.isPending}
          data-testid="button-save-prefs"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("kanalSozlamalari")}</CardTitle>
            <CardDescription>
              {t("harBirBildirishnomaTuriUchun")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-0 border-b px-4 py-2 text-xs text-muted-foreground font-medium">
              <div className="col-span-2">{t("bildirishnomaTuri")}</div>
              <div className="flex items-center gap-1 justify-center">
                <Mail className="h-3 w-3" /> {t("email1")}
              </div>
              <div className="flex items-center gap-1 justify-center">
                <MessageSquare className="h-3 w-3" /> {t("telegram")}
              </div>
              <div className="flex items-center gap-1 justify-center">
                <Smartphone className="h-3 w-3" /> In-app
              </div>
            </div>

            {(Array.isArray(NOTIFICATION_TYPES) ? NOTIFICATION_TYPES : []).map((type) => {
              const pref = getPref(type.key);
              return (
                <div
                  key={type.key}
                  className="grid grid-cols-2 lg:grid-cols-5 gap-0 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors items-center"
                  data-testid={`notif-row-${type.key}`}
                >
                  <div className="col-span-2">
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {type.description}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.email}
                      onCheckedChange={() => toggle(type.key, "email")}
                      data-testid={`switch-${type.key}-email`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.telegram}
                      onCheckedChange={() => toggle(type.key, "telegram")}
                      data-testid={`switch-${type.key}-telegram`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={pref.inApp}
                      onCheckedChange={() => toggle(type.key, "inApp")}
                      data-testid={`switch-${type.key}-inapp`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
