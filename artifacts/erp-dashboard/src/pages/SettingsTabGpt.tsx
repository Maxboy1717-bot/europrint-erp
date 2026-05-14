/** @module SettingsTabGpt @description GPT integration tab — model selection, prompt template editing, and test/save actions. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  onTest: () => void;
  isTesting: boolean;
}

export function SettingsTabGpt({
  loading,
  form,
  onChange,
  onSave,
  isSaving,
  onTest,
  isTesting,
}: Props) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>GPT {t('integrations')}</CardTitle>
        <CardDescription>{t('apiKeys')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('loading')}</div>
        ) : (
          <>
            <div className="space-y-1">
          <Label htmlFor="gpt-model">GPT Model</Label>
              <Select
                value={form.gptModel}
                onValueChange={(value) => onChange({ gptModel: value })}
              >
                <SelectTrigger id="gpt-model" data-testid="select-gpt-model" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
          <Label htmlFor="prompt-template">Prompt</Label>
              <Textarea
                id="prompt-template"
                rows={6}
                value={form.promptTemplate}
                onChange={(e) => onChange({ promptTemplate: e.target.value })}
                className="font-mono text-sm"
                data-testid="textarea-prompt"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onTest}
                disabled={isTesting}
                data-testid="button-test-prompt"
              >
                {isTesting ? tCommon('loading') : "Test"}
              </Button>
              <Button onClick={onSave} disabled={isSaving} data-testid="button-save-settings">
                {isSaving ? tCommon('loading') : tCommon('save')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
