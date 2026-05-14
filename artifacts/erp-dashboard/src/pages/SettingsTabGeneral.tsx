/** @module SettingsTabGeneral @description General settings tab card — company name, language, and notification toggle. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import type { SettingsForm } from "./SettingsTypes";

interface Props {
  loading: boolean;
  form: SettingsForm;
  onChange: (patch: Partial<SettingsForm>) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SettingsTabGeneral({ loading, form, onChange, onSave, isSaving }: Props) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('generalSettings')}</CardTitle>
        <CardDescription>{t('systemSettings')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('loading')}</div>
        ) : (
          <>
            <div className="space-y-1">
          <Label htmlFor="company-name">{t('companyName')}</Label>
              <Input
                id="company-name"
                value={form.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="language">{t('languageSettings')}</Label>
              <Select
                value={form.defaultLanguage}
                onValueChange={(value) => onChange({ defaultLanguage: value })}
              >
                <SelectTrigger id="language" data-testid="select-language" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">{t("ozbek")}</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('notificationSettings')}</Label>
                <p className="text-sm text-muted-foreground">{t('telegramBot')}</p>
              </div>
              <Switch
                checked={form.notificationsEnabled}
                onCheckedChange={(checked) => onChange({ notificationsEnabled: checked })}
                data-testid="switch-notifications"
              />
            </div>
            <Button onClick={onSave} disabled={isSaving} data-testid="button-save-general">
              {isSaving ? tCommon('loading') : tCommon('save')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
