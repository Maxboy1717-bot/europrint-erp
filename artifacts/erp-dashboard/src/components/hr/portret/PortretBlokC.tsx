import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PortretData } from "./types";

interface PortretBlokCProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokC({ portret, onChange }: PortretBlokCProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">Blok C: Vazifalar & Natijalar</h4>
        <Badge variant="outline" className="text-[9px]">3 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">11. Bo'lim/jamoa vazifalari</Label>
        <Textarea
          placeholder="Ushbu bo'limning asosiy funksiyalari nima? Jamoa nima bilan shug'ullanadi?"
          rows={3}
          value={portret.department_duties ?? ""}
          onChange={e => onChange("department_duties")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">12. Xodim majburiyatlari (Funksional)</Label>
        <Textarea
          placeholder="Xodim har kuni nima ish qiladi? Uning asosiy operatsiyalari nima?"
          rows={3}
          value={portret.main_duties ?? ""}
          onChange={e => onChange("main_duties")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          13. Natija/mahsulot — Qat'iy o'lchov <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder="Xodim ishining yakuniy natijasi nima? (masalan: sotilgan mahsulot hajmi, bitgan dizaynlar soni...)"
          rows={2}
          value={portret.expected_result ?? ""}
          onChange={e => onChange("expected_result")(e.target.value)}
        />
      </div>
    </div>
  );
}
