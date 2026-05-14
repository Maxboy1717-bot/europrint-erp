/**
 * @module StepDuties
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface StepDutiesProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepDuties({ portret, onChange }: StepDutiesProps) {
  const { t } = useTranslation("common");
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">{t("blokCVazifalarVaNatijalar")}</h3>
        <Badge variant="outline" className="text-[9px]">3 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">11. Bo'lim/jamoa qanday vazifalarni bajaradi?</Label>
        <Textarea
          placeholder={t("ushbuBolimYokiJamoaNima")}
          rows={3}
          value={portret.department_duties ?? ""}
          onChange={e => p("department_duties")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          12. Xodim qanday majburiyatlarni bajaradi? (Funksional) <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder="Har bir funktsiyani yangi qatorga yozing:&#10;1. Mijozlar bilan telefon aloqasi&#10;2. Buyurtmalarni rasmiylashtirib qo'yish&#10;..."
          rows={5}
          value={portret.main_duties ?? ""}
          onChange={e => p("main_duties")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          13. Xodimdan qanday aniq mahsulot/natija kutiladi? <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder={t("muvaffaqiyatliXodim36Oy")}
          rows={3}
          value={portret.expected_result ?? ""}
          onChange={e => p("expected_result")(e.target.value)}
        />
      </div>
    </div>
  );
}
