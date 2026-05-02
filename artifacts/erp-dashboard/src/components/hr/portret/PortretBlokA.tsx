import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";

interface PortretBlokAProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: unknown) => void;
}

export function PortretBlokA({ portret, onChange }: PortretBlokAProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm text-primary">Blok A: Lavozim tahlili</h4>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">1. Lavozim nomi variantlari</Label>
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
          placeholder="Bu lavozim kompaniya uchun qanday natija ishlab chiqaradi? Kompaniyaga qo'shgan hissasi nima?"
          rows={3}
          value={portret.main_purpose ?? ""}
          onChange={e => onChange("main_purpose")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">3. Vakansiyani ochish sababi</Label>
        <Select value={portret.vacancy_reason ?? "new"} onValueChange={v => onChange("vacancy_reason")(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Yangi lavozim (kengayish)</SelectItem>
            <SelectItem value="left">Xodim ketdi / ishdan bo'shatildi</SelectItem>
            <SelectItem value="expand">Hajm o'sdi, ish ko'paydi</SelectItem>
            <SelectItem value="maternity">Dekret / turmush ta'tili</SelectItem>
            <SelectItem value="other">Boshqa sabab</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          4. Bu odamni yollash qanday muammoni hal qiladi? <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder="Bu lavozim bo'lmasa qanday muammo yuzaga keladi? Nima to'xtovsiz chayqalib turadi?"
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
