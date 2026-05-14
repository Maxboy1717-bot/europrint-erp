/**
 * @module PortretBlokA
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface PortretBlokAProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokA({ portret, onChange }: PortretBlokAProps) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">{t("blokALavozimTahlili")}</h4>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k1LavozimNomiVariantlari")}</Label>
        <Input
          placeholder="Bu lavozimning qanday nomlari bo'lishi mumkin? (masalan: Sotuvchi, Sales manager...)"
          value={portret.position_name_variants ?? ""}
          onChange={e => onChange("position_name_variants")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          2. Lavozim maqsadi — QYM (Цель должности) <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder={t("buLavozimKompaniyaUchunQanday")}
          rows={3}
          value={portret.main_purpose ?? ""}
          onChange={e => onChange("main_purpose")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k3VakansiyaniOchishSababi")}</Label>
        <Select value={portret.vacancy_reason ?? "new"} onValueChange={v => onChange("vacancy_reason")(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Yangi lavozim (kengayish)</SelectItem>
            <SelectItem value="left">Xodim ketdi / ishdan bo'shatildi</SelectItem>
            <SelectItem value="expand">{t("hajmOsdiIshKopaydi")}</SelectItem>
            <SelectItem value="maternity">Dekret / turmush ta'tili</SelectItem>
            <SelectItem value="other">{t("boshqaSabab")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          {t("k4BuOdamniYollashQanday")}<span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder={t("buLavozimBolmasaQandayMuammo")}
          rows={2}
          value={portret.problem_solved ?? ""}
          onChange={e => onChange("problem_solved")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">5. Kimga hisobot beradi? (Tuzilmaviy joylashuv)</Label>
        <Input
          placeholder="Lavozimi / ismi (masalan: Marketing direktori — Aziz Karimov)"
          value={portret.reports_to ?? ""}
          onChange={e => onChange("reports_to")(e.target.value)}
        />
      </div>
    </div>
  );
}
