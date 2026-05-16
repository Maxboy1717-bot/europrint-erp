/** @module SettingsTabContact @description Contact information settings tab — email, phone, website, addresses, and working hours. */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { ContactForm } from "./SettingsTypes";

interface Props {
  loading: boolean;
  form: ContactForm;
  onChange: (patch: Partial<ContactForm>) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SettingsTabContact({ loading, form, onChange, onSave, isSaving }: Props) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          <CardTitle>{t('integrations')}</CardTitle>
        </div>
        <CardDescription>{t('telegramBot')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">{tCommon('loading')}</div>
        ) : (
          <>
            <div className="space-y-1">
          <Label htmlFor="email">{tCommon('email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder={t("infoEuroprintUz")}
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="phone">{tCommon('phone')}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="+998 71 123 45 67"
                data-testid="input-contact-phone"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="website">{t('website')}</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => onChange({ website: e.target.value })}
                placeholder={t("wwwEuroprintUz")}
                data-testid="input-contact-website"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="address">{tCommon('address')} (UZ)</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder={t("toshkentShaharYashnobodTumani")}
                data-testid="input-contact-address"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="addressRu">{tCommon('address')} (RU)</Label>
              <Input
                id="addressRu"
                value={form.addressRu}
                onChange={(e) => onChange({ addressRu: e.target.value })}
                placeholder={t("untitled")}
                data-testid="input-contact-address-ru"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="workingHours">{tCommon('time')} (UZ)</Label>
              <Input
                id="workingHours"
                value={form.workingHours}
                onChange={(e) => onChange({ workingHours: e.target.value })}
                placeholder={t("k9001800DushanbaJuma")}
                data-testid="input-contact-hours"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="workingHoursRu">{tCommon('time')} (RU)</Label>
              <Input
                id="workingHoursRu"
                value={form.workingHoursRu}
                onChange={(e) => onChange({ workingHoursRu: e.target.value })}
                placeholder={t("k9001800")}
                data-testid="input-contact-hours-ru"
              />
            </div>
            <Button onClick={onSave} disabled={isSaving} data-testid="button-save-contact">
              {isSaving ? tCommon('loading') : tCommon('save')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
