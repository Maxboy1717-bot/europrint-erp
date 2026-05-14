/** @module SettingsTabTax @description Tax and finance settings tab — INPS rate, minimum wage, QQS rate. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { SettingsForm } from "./SettingsTypes";

interface Props {
  loading: boolean;
  form: SettingsForm;
  onChange: (patch: Partial<SettingsForm>) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SettingsTabTax({ loading, form, onChange, onSave, isSaving }: Props) {
  const { t } = useTranslation("common");
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("soliqVaMoliyaSozlamalari")}</CardTitle>
        <CardDescription>
          {t("davlatTomonidanBelgilanganStavkalarOzgarganda")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('loading')}</div>
        ) : (
          <>
            <div className="space-y-1">
          <Label htmlFor="inps-rate">INPS stavkasi (ulush, masalan 0.12 = 12%)</Label>
              <Input
                id="inps-rate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={form.inpsRate}
                onChange={(e) => onChange({ inpsRate: parseFloat(e.target.value) || 0.12 })}
                data-testid="input-inps-rate"
              />
              <p className="text-xs text-muted-foreground">
                Joriy qiymat: {(form.inpsRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
          <Label htmlFor="min-wage">Minimal ish haqi (so'm)</Label>
              <Input
                id="min-wage"
                type="number"
                min="0"
                step="10000"
                value={form.minWage}
                onChange={(e) => onChange({ minWage: parseInt(e.target.value) || 1120000 })}
                data-testid="input-min-wage"
              />
              <p className="text-xs text-muted-foreground">
                Hozir: {form.minWage.toLocaleString('uz-UZ')} so'm
              </p>
            </div>
            <div className="space-y-1">
          <Label htmlFor="qqs-rate">QQS stavkasi (%)</Label>
              <Input
                id="qqs-rate"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={form.qqsRate}
                onChange={(e) => onChange({ qqsRate: parseFloat(e.target.value) || 12 })}
                data-testid="input-qqs-rate"
              />
              <p className="text-xs text-muted-foreground">Joriy qiymat: {form.qqsRate}%</p>
            </div>
            <Button onClick={onSave} disabled={isSaving} data-testid="button-save-tax">
              {isSaving ? tCommon('loading') : tCommon('save')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
