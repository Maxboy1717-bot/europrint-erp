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
import { apiRequest, safeArray } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, MessageSquare, Smartphone, Save } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface NotifPref {
  key: string;
  email: boolean;
  telegram: boolean;
  inApp: boolean;
}

const NOTIFICATION_TYPES = [
  { key: "task_assigned", labelKey: "nsTaskAssigned", descriptionKey: "nsTaskAssignedDesc" },
  { key: "order_status", labelKey: "nsOrderStatus", descriptionKey: "nsOrderStatusDesc" },
  { key: "payment_due", labelKey: "nsPaymentDue", descriptionKey: "nsPaymentDueDesc" },
  { key: "approval_required", labelKey: "nsApprovalRequired", descriptionKey: "nsApprovalRequiredDesc" },
  { key: "defect_reported", labelKey: "nsDefectReported", descriptionKey: "nsDefectReportedDesc" },
  { key: "leave_approved", labelKey: "nsLeaveApproved", descriptionKey: "nsLeaveApprovedDesc" },
  { key: "salary_processed", labelKey: "nsSalaryProcessed", descriptionKey: "nsSalaryProcessedDesc" },
  { key: "security_alert", labelKey: "nsSecurityAlert", descriptionKey: "nsSecurityAlertDesc" },
  { key: "stock_low", labelKey: "nsStockLow", descriptionKey: "nsStockLowDesc" },
  { key: "shift_reminder", labelKey: "nsShiftReminder", descriptionKey: "nsShiftReminderDesc" },
];

const DEFAULT_PREFS: NotifPref[] = NOTIFICATION_TYPES.map((t) => ({
  key: t.key,
  email: true,
  telegram: true,
  inApp: true,
}));

export default function NotificationSettings() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotifPref[]>(DEFAULT_PREFS);

  // Backend returns the granular matrix inside a { statusCode, data } envelope,
  // which the api-request unwrapper (only unwraps { ok:true }) passes through
  // untouched. safeArray extracts the `data` array so saved prefs actually hydrate.
  const { data: savedPrefs } = useQuery<unknown>({
    queryKey: ["/api/notifications/preferences"],
  });

  useEffect(() => {
    const rows = safeArray<NotifPref>(savedPrefs);
    if (rows.length > 0) {
      setPrefs(rows);
    }
  }, [savedPrefs]);

  const saveMutation = useMutation({
    mutationFn: (data: NotifPref[]) =>
      apiRequest("PATCH", "/api/notifications/preferences", { preferences: data }),
    onSuccess: () => toast({ title: t("nsSettingsSaved") }),
    onError: () =>
      toast({ title: t("nsSaveError"), variant: "destructive" }),
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
    };
  }

  const activeCount = (Array.isArray(prefs) ? prefs : []).reduce(
    (acc, p) => acc + (p.email || p.telegram || p.inApp ? 1 : 0),
    0
  );

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">{t("bildirishnomaSozlamalari")}</h1>
          <EPStatusPill tone="neutral">{activeCount} {t("nsActive")}</EPStatusPill>
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(prefs)}
          disabled={saveMutation.isPending}
          data-testid="button-save-prefs"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saveMutation.isPending ? t("nsSaving") : t("nsSave")}
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
                <Smartphone className="h-3 w-3" /> {t("inApp")}
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
                    <div className="text-sm font-medium">{t(type.labelKey)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t(type.descriptionKey)}
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
