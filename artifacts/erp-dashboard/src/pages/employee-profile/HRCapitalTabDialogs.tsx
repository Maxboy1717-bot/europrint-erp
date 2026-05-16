/**
 * @module HRCapitalTabDialogs
 * @description Edit form for HRCapitalTab (inline, not modal, but isolated here per convention).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "./HRCapitalTabTypes";
import { TOOL_TEST_SCORES } from "./HRCapitalTabTypes";
import { useTranslation } from '@/lib/i18n';

interface HRCapitalEditFormProps {
  form: FormState;
  onChange: (form: FormState) => void;
}

export function HRCapitalEditForm({ form, onChange }: HRCapitalEditFormProps) {
  const { t } = useTranslation("common");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
          <Label>{t("visotskiyKategoriyasi")}</Label>
        <Select
          value={form.visotskiyCategory}
          onValueChange={(v) => onChange({ ...form, visotskiyCategory: v })}
        >
          <SelectTrigger data-testid="select-visotskiy" className="h-9">
            <SelectValue placeholder={t("tanlang1")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Flagman">{t("flagmanYetakchi")}</SelectItem>
            <SelectItem value="Performer">{t("performerBajaruvchi")}</SelectItem>
            <SelectItem value="Troublemaker">{t("troublemakerMuammoli")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label>{t("toolTestNatijasiAJ")}</Label>
        <Select
          value={form.toolTestScore}
          onValueChange={(v) => onChange({ ...form, toolTestScore: v })}
        >
          <SelectTrigger data-testid="select-tool-test" className="h-9">
            <SelectValue placeholder={t("shkala")} />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(TOOL_TEST_SCORES) ? TOOL_TEST_SCORES : []).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label>{t("psixologikProfilSindromi")}</Label>
        <Input
          value={form.psychologicalProfile}
          onChange={(e) => onChange({ ...form, psychologicalProfile: e.target.value })}
          placeholder={t("masalanDiscDTuri")}
          data-testid="input-psych-profile"
        />
      </div>

      <div className="space-y-1">
          <Label>{t("onboardingHolati")}</Label>
        <Select
          value={form.onboardingStatus}
          onValueChange={(v) => onChange({ ...form, onboardingStatus: v })}
        >
          <SelectTrigger data-testid="select-onboarding" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">{t("boshlanmagan")}</SelectItem>
            <SelectItem value="in_progress">{t("davomEtmoqda")}</SelectItem>
            <SelectItem value="completed">{t("yakunlangan")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label>{t("recruitingKanali")}</Label>
        <Input
          value={form.recruitingChannel}
          onChange={(e) => onChange({ ...form, recruitingChannel: e.target.value })}
          placeholder={t("masalanLinkedinDostlarTavsiyasi")}
          data-testid="input-recruiting-channel"
        />
      </div>

      <div className="space-y-1">
          <Label>{t("offboardingHolati")}</Label>
        <Input
          value={form.offboardingStatus}
          onChange={(e) => onChange({ ...form, offboardingStatus: e.target.value })}
          placeholder="—"
          data-testid="input-offboarding"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>{t("eslatmalar")}</Label>
        <Input
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          placeholder={t("hrIzohlar")}
          data-testid="input-hr-capital-notes"
        />
      </div>
    </div>
  );
}
