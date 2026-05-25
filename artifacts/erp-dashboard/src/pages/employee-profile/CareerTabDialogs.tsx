/**
 * @module CareerTabDialogs
 * @description Inline edit form for the career plan card.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CareerFormState } from "./CareerTabTypes";
import { useTranslation } from '@/lib/i18n';

interface CareerEditFormProps {
  form: CareerFormState;
  onChange: (updated: CareerFormState) => void;
}

export function CareerEditForm({ form, onChange }: CareerEditFormProps) {
  const { t } = useTranslation("common");
  const set = (patch: Partial<CareerFormState>) => onChange({ ...form, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
          <Label>{t("keyingiTavsiyaEtilganLavozim")}</Label>
        <Input
          value={form.nextRecommendedPosition}
          onChange={(e) => set({ nextRecommendedPosition: e.target.value })}
          placeholder={t("masalanUstaxonaBoshligi")}
          data-testid="input-next-position"
        />
      </div>
      <div className="space-y-1">
          <Label>{t("successionKimningOrnigaOtishiMumkin")}</Label>
        <Input
          value={form.successionFor}
          onChange={(e) => set({ successionFor: e.target.value })}
          placeholder={t("masalanDirektor")}
          data-testid="input-succession-for"
        />
      </div>
      <div className="space-y-1">
          <Label>{t("crossTrainingHolati")}</Label>
        <Select
          value={form.crossTrainingStatus}
          onValueChange={(v) => set({ crossTrainingStatus: v })}
        >
          <SelectTrigger data-testid="select-cross-training" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">{t("boshlanmagan")}</SelectItem>
            <SelectItem value="in_progress">{t("davomEtmoqda")}</SelectItem>
            <SelectItem value="completed">{t("Bajarildi")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
          <Label>{t("kareraYonalishi")}</Label>
        <Input
          value={form.careerPathDirection}
          onChange={(e) => set({ careerPathDirection: e.target.value })}
          placeholder={t("masalanTexnikMutaxassis")}
          data-testid="input-career-direction"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>{t("crossTrainingEslatma")}</Label>
        <Input
          value={form.crossTrainingNotes}
          onChange={(e) => set({ crossTrainingNotes: e.target.value })}
          placeholder={t("qoshimchaMalumot")}
          data-testid="input-cross-training-notes"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>{t("umumiyEslatmalar")}</Label>
        <Input
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder={t("hrIzohlar")}
          data-testid="input-career-notes"
        />
      </div>
    </div>
  );
}
