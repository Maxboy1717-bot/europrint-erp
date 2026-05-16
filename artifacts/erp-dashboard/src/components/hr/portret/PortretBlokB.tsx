/**
 * @module PortretBlokB
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface PortretBlokBProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokB({ portret, onChange }: PortretBlokBProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">{t("blokBDemografikTalablar")}</h4>
        <Badge variant="outline" className="text-[9px]">{t("k5TaSavol")}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs mb-1 block">{t("k6YoshMin")}</Label>
          <Input type="number" min={18} max={70}
            value={portret.age_min ?? 22}
            onChange={e => onChange("age_min")(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("k7YoshMax")}</Label>
          <Input type="number" min={18} max={70}
            value={portret.age_max ?? 45}
            onChange={e => onChange("age_max")(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("k8Jins")}</Label>
          <Select value={portret.gender ?? "any"} onValueChange={v => onChange("gender")(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("muhimEmas")}</SelectItem>
              <SelectItem value="male">{t("erkak")}</SelectItem>
              <SelectItem value="female">{t("ayol")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k9OilaviyHolatIzohIxtiyoriy")}</Label>
        <Input
          placeholder={t("masalanUylanganlarAfzalMuhimEmas")}
          value={portret.family_status ?? ""}
          onChange={e => onChange("family_status")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k10TalimDarajasi")}</Label>
        <Select value={portret.education_req ?? "higher"} onValueChange={v => onChange("education_req")(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="higher">{t("oliyMaLumotBakalavrMagistr")}</SelectItem>
            <SelectItem value="incomplete_higher">{t("tugallanmaganOliyTalaba")}</SelectItem>
            <SelectItem value="secondary_special">{t("oRtaMaxsusKollejLitsey")}</SelectItem>
            <SelectItem value="any">{t("muhimEmas")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
