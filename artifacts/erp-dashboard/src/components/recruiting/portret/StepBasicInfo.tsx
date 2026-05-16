/**
 * @module StepBasicInfo
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface StepBasicInfoProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepBasicInfo({ portret, onChange }: StepBasicInfoProps) {
  const { t } = useTranslation("common");
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">{t("blokALavozimTahlili")}</h3>
        <Badge variant="outline" className="text-[9px]">{t("k5TaSavol")}</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          {t("k1LavozimNomiVariantlari")}
        </Label>
        <Input
          placeholder={t("buLavozimningQandayNomlariBoLishi")}
          value={portret.position_name_variants ?? ""}
          onChange={e => p("position_name_variants")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          2. Lavozim maqsadi — QYM (Цель должности) <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder={t("buLavozimKompaniyaUchunQanday1")}
          rows={3}
          value={portret.main_purpose ?? ""}
          onChange={e => p("main_purpose")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k3VakansiyaniOchishSababi")}</Label>
        <Select value={portret.vacancy_reason ?? "new"} onValueChange={v => p("vacancy_reason")(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">{t("yangiLavozimKengayish")}</SelectItem>
            <SelectItem value="left">{t("xodimKetdiIshdanBoShatildi")}</SelectItem>
            <SelectItem value="expand">{t("hajmOsdiIshKopaydi")}</SelectItem>
            <SelectItem value="maternity">{t("dekretTurmushTaTili")}</SelectItem>
            <SelectItem value="other">{t("boshqaSabab")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          {t("k4BuOdamniYollashQanday")}<span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder={t("buLavozimBolmasaQandayMuammo1")}
          rows={2}
          value={portret.problem_solved ?? ""}
          onChange={e => p("problem_solved")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k5KimgaHisobotBeradiTuzilmaviyJoylashuv")}</Label>
        <Input
          placeholder={t("lavozimiVaYokiIsmiMasalanMarketing")}
          value={portret.reports_to ?? ""}
          onChange={e => p("reports_to")(e.target.value)}
        />
      </div>
    </div>
  );
}
