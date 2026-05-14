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

interface PortretBlokBProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokB({ portret, onChange }: PortretBlokBProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">Blok B: Demografik talablar</h4>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs mb-1 block">6. Yosh (min)</Label>
          <Input type="number" min={18} max={70}
            value={portret.age_min ?? 22}
            onChange={e => onChange("age_min")(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">7. Yosh (max)</Label>
          <Input type="number" min={18} max={70}
            value={portret.age_max ?? 45}
            onChange={e => onChange("age_max")(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">8. Jins</Label>
          <Select value={portret.gender ?? "any"} onValueChange={v => onChange("gender")(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Muhim emas</SelectItem>
              <SelectItem value="male">Erkak</SelectItem>
              <SelectItem value="female">Ayol</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">9. Oilaviy holat (izoh, ixtiyoriy)</Label>
        <Input
          placeholder="Masalan: uylanganlar afzal, muhim emas, farzandlilari uchun moslashtirilgan..."
          value={portret.family_status ?? ""}
          onChange={e => onChange("family_status")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">10. Ta'lim darajasi</Label>
        <Select value={portret.education_req ?? "higher"} onValueChange={v => onChange("education_req")(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="higher">Oliy ma'lumot (bakalavr/magistr)</SelectItem>
            <SelectItem value="incomplete_higher">Tugallanmagan oliy / talaba</SelectItem>
            <SelectItem value="secondary_special">O'rta maxsus (kollej/litsey)</SelectItem>
            <SelectItem value="any">Muhim emas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
