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
          <Label htmlFor="qqs-rate">{t("qqsStavkasi")}</Label>
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
