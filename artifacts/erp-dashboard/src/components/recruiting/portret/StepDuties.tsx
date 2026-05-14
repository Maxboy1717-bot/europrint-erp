/**
 * @module StepDuties
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PortretData } from "./types";

interface StepDutiesProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepDuties({ portret, onChange }: StepDutiesProps) {
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Blok C: Vazifalar va natijalar</h3>
        <Badge variant="outline" className="text-[9px]">3 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">11. Bo'lim/jamoa qanday vazifalarni bajaradi?</Label>
        <Textarea
          placeholder="Ushbu bo'lim yoki jamoa nima bilan shug'ullanadi? Asosiy yo'nalishlar..."
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
          placeholder="Muvaffaqiyatli xodim 3-6 oy ichida nima natija beradi? Aniq, o'lchov mumkin bo'lgan ko'rsatkichlar..."
          rows={3}
          value={portret.expected_result ?? ""}
          onChange={e => p("expected_result")(e.target.value)}
        />
      </div>
    </div>
  );
}
