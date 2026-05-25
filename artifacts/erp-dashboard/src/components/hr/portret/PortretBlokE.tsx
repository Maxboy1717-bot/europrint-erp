/**
 * @module PortretBlokE
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface PortretBlokEProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokE({ portret, onChange }: PortretBlokEProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">{t("blokETajribaBilim")}</h4>
        <Badge variant="outline" className="text-[9px]">{t("k5TaSavol")}</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k14XavfliNomzodTavsifiXavfGuruhlari")}</Label>
        <Textarea
          placeholder={t("kandidatdaQaysiBelgilarBoLsaUni")}
          rows={2}
          value={portret.danger_candidate ?? ""}
          onChange={e => onChange("danger_candidate")(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2 py-2 border rounded-lg px-3 bg-muted/40">
        <Checkbox
          id="exp_req"
          checked={portret.experience_required ?? false}
          onCheckedChange={v => onChange("experience_required")(!!v)}
        />
        <label htmlFor="exp_req" className="text-xs font-medium leading-none cursor-pointer">
          15. Tajriba majburiymi? (Tajribasizlarni ko'rmaymiz)
        </label>
      </div>

      {portret.experience_required && (
        <div>
          <Label className="text-xs mb-1 block">{t("k15aQaysiSohadaVaNecha")}</Label>
          <Input
            placeholder={t("masalanLogistikaSohasidaKamida2")}
            value={portret.experience_field ?? ""}
            onChange={e => onChange("experience_field")(e.target.value)}
          />
        </div>
      )}

      <div>
        <Label className="text-xs mb-1 block">{t("k16HozirQayerdaIshlaydi")}</Label>
        <Input
          placeholder={t("potensialKandidatHozirQaysiKompaniyalarda")}
          value={portret.current_employment ?? ""}
          onChange={e => onChange("current_employment")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k17QaysiSohalardagiTajribaUstunlik")}</Label>
        <Input
          placeholder={t("masalanFmcgIshlabChiqarishIt")}
          value={portret.industry_experience ?? ""}
          onChange={e => onChange("industry_experience")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k18ProfessionalKoNikmalarHardSkills")}</Label>
        <Textarea
          placeholder={t("qaysiDasturlarniBilishiShartExcel1c")}
          rows={2}
          value={portret.professional_skills ?? ""}
          onChange={e => onChange("professional_skills")(e.target.value)}
        />
      </div>
    </div>
  );
}
