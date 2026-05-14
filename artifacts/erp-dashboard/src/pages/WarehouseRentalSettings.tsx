/**
 * @module WarehouseRentalSettings
 * @description `SettingsPanel` component for the Warehouse Rental feature.
 * Manages global defaults (free days, daily rate, weekend exclusion) and
 * per-manager custom rate overrides, persisted via PATCH
 * `/api/warehouse-rental/settings`.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X } from "lucide-react";
import { useTranslation } from '@/lib/i18n';
import {
  formatMoney,
  type CustomRate,
  type RentalSettings,
} from "./WarehouseRentalTypes";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  settings: RentalSettings | null;
  onSaved: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsPanel({ settings, onSaved }: SettingsPanelProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RentalSettings>({
    defaultFreeDays: settings?.defaultFreeDays ?? 8,
    defaultDailyRatePerM2: settings?.defaultDailyRatePerM2 ?? 500,
    excludeWeekends: settings?.excludeWeekends ?? false,
    customRates: settings?.customRates ?? [],
  });
  const [newRate, setNewRate] = useState({ managerName: "", dailyRate: "", freeDays: "" });

  const mutation = useMutation({
    mutationFn: (data: RentalSettings) =>
      apiRequest("PATCH", "/api/warehouse-rental/settings", data),
    onSuccess: () => {
      toast({ title: "Sozlamalar saqlandi" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-rental/settings"] });
      onSaved();
    },
    onError: (err: Error) =>
      toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  const addCustomRate = () => {
    if (!newRate.managerName || !newRate.dailyRate) return;
    const rate: CustomRate = {
      managerId: Date.now().toString(),
      managerName: newRate.managerName,
      dailyRate: parseFloat(newRate.dailyRate),
      freeDays: parseInt(newRate.freeDays || "8"),
    };
    setForm((prev) => ({ ...prev, customRates: [...prev.customRates, rate] }));
    setNewRate({ managerName: "", dailyRate: "", freeDays: "" });
  };

  const removeRate = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      customRates: prev.customRates.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("asosiySozlamalar")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("standartBepulKunlar")}</Label>
              <Input
                data-testid="input-settings-free-days"
                type="number"
                value={form.defaultFreeDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, defaultFreeDays: parseInt(e.target.value) || 8 }))
                }
              />
            </div>
            <div>
              <Label>Standart kunlik tarif (m²/kun, so'm)</Label>
              <Input
                data-testid="input-settings-daily-rate"
                type="number"
                value={form.defaultDailyRatePerM2}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    defaultDailyRatePerM2: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              data-testid="switch-settings-exclude-weekends"
              checked={form.excludeWeekends}
              onCheckedChange={(v) => setForm((p) => ({ ...p, excludeWeekends: v }))}
            />
            <Label>Dam olish kunlarini (shanba/yakshanba) hisoblamaslik</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("menejerUchunMaxsusTarif")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.customRates.length > 0 && (
            <div className="space-y-2">
              {(Array.isArray(form.customRates) ? form.customRates : []).map((r, i) => (
                <div
                  key={`k-${i}`}
                  className="flex items-center gap-3 p-2 bg-muted rounded-md"
                >
                  <span className="flex-1 text-sm font-medium">{r.managerName}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatMoney(r.dailyRate)}/m²/kun
                  </span>
                  <span className="text-sm text-muted-foreground">{r.freeDays} bepul kun</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeRate(i)}
                    data-testid={`button-remove-rate-${i}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              data-testid="input-new-rate-manager"
              placeholder={t("menejerIsmi")}
              value={newRate.managerName}
              onChange={(e) => setNewRate((p) => ({ ...p, managerName: e.target.value }))}
            />
            <Input
              data-testid="input-new-rate-daily"
              type="number"
              placeholder="Tarif (so'm)"
              value={newRate.dailyRate}
              onChange={(e) => setNewRate((p) => ({ ...p, dailyRate: e.target.value }))}
            />
            <Input
              data-testid="input-new-rate-free-days"
              type="number"
              placeholder={t("bepulKun")}
              value={newRate.freeDays}
              onChange={(e) => setNewRate((p) => ({ ...p, freeDays: e.target.value }))}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addCustomRate}
            data-testid="button-add-custom-rate"
          >
            <Plus className="h-4 w-4 mr-1" /> {t("maxsusTarifQoshish")}
          </Button>
        </CardContent>
      </Card>

      <Button
        data-testid="button-save-settings"
        onClick={() => mutation.mutate(form)}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
      </Button>
    </div>
  );
}
