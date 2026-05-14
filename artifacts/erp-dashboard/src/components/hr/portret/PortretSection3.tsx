/**
 * @module PortretSection3
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface PortretSection3Props {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
  onToggleSocial: (opt: string) => void;
}

const SOCIAL_OPTIONS = [
  "Tibbiy sug'urta", "Korporativ transport", "Ovqatlanish",
  "Sport zali", "Telefon aloqasi", "Korporativ o'quv", "Bonus dasturi",
];

export function PortretSection3({ portret, onChange, onToggleSocial }: PortretSection3Props) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-semibold text-sm text-primary">{t("iiiBolimIshSharoitlari")}</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Maosh (min)</Label>
          <Input type="number" value={portret.salary_min ?? 0} onChange={e => onChange("salary_min")(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Maosh (max)</Label>
          <Input type="number" value={portret.salary_max ?? 0} onChange={e => onChange("salary_max")(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Sinov muddati (oy)</Label>
          <Input type="number" value={portret.probation_months ?? 3} onChange={e => onChange("probation_months")(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("ishGrafigi")}</Label>
          <Input value={portret.work_schedule ?? "5/2"} onChange={e => onChange("work_schedule")(e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Ijtimoiy paket (tanlash)</Label>
        <div className="flex flex-wrap gap-1.5">
          {(Array.isArray(SOCIAL_OPTIONS) ? SOCIAL_OPTIONS : []).map(opt => {
            const isSel = (Array.isArray(portret.social_package) ? portret.social_package : []).includes(opt);
            return (
              <Badge
                key={opt}
                variant={isSel ? "default" : "outline"}
                className="cursor-pointer py-1 px-2.5"
                onClick={() => onToggleSocial(opt)}
              >
                {opt}
              </Badge>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Boshqa sharoitlar / Izoh</Label>
        <Textarea
          placeholder={t("qoshimchaImtiyozlarYokiShartlar")}
          rows={2}
          value={portret.additional_conditions ?? ""}
          onChange={e => onChange("additional_conditions")(e.target.value)}
        />
      </div>
    </div>
  );
}
