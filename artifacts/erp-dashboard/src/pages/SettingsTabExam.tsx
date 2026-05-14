/** @module SettingsTabExam @description Exam / security settings tab — pass percentage, max attempts, question randomisation. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import type { SettingsForm } from "./SettingsTypes";

interface Props {
  loading: boolean;
  form: SettingsForm;
  onChange: (patch: Partial<SettingsForm>) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SettingsTabExam({ loading, form, onChange, onSave, isSaving }: Props) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('securitySettings')}</CardTitle>
        <CardDescription>{t('systemSettings')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('loading')}</div>
        ) : (
          <>
            <div className="space-y-1">
          <Label htmlFor="pass-percentage">{tCommon('percentage')} (%)</Label>
              <Input
                id="pass-percentage"
                type="number"
                value={form.passPercentage}
                onChange={(e) => onChange({ passPercentage: parseInt(e.target.value) || 80 })}
                min="0"
                max="100"
                data-testid="input-pass-percentage"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="attempts">{tCommon('count')}</Label>
              <Input
                id="attempts"
                type="number"
                value={form.maxAttempts}
                onChange={(e) => onChange({ maxAttempts: parseInt(e.target.value) || 3 })}
                min="1"
                max="10"
                data-testid="input-attempts"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('systemSettings')}</Label>
                <p className="text-sm text-muted-foreground">{tCommon('sortBy')}</p>
              </div>
              <Switch
                checked={form.randomizeQuestions}
                onCheckedChange={(checked) => onChange({ randomizeQuestions: checked })}
                data-testid="switch-randomize"
              />
            </div>
            <Button onClick={onSave} disabled={isSaving} data-testid="button-save-exam">
              {isSaving ? tCommon('loading') : tCommon('save')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
