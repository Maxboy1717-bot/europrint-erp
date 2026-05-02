import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";

interface StepBasicInfoProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepBasicInfo({ portret, onChange }: StepBasicInfoProps) {
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">Blok A: Lavozim tahlili</h3>
        <Badge variant="outline" className="text-[9px]">5 ta savol</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          1. Lavozim nomi variantlari
        </Label>
        <Input
          placeholder="Bu lavozimning qanday nomlari bo'lishi mumkin? (masalan: Sotuvchi, Sales manager, Savdo bo'yicha mutaxassis)"
          value={portret.position_name_variants ?? ""}
          onChange={e => p("position_name_variants")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          2. Lavozim maqsadi — QYM (Цель должности) <span className="text-red-400">*</span>
        </Label>
        <Textarea
          placeholder="Bu lavozim kompaniya uchun qanday natija ishlab chiqaradi? Lavozimning biznesga qo'shgan hissasi nima?"
          rows={3}
          value={portret.main_purpose ?? ""}
          onChange={e => p("main_purpose")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">3. Vakansiyani ochish sababi</Label>
        <Select value={portret.vacancy_reason ?? "new"} onValueChange={v => p("vacancy_reason")(v)}>
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
          placeholder="Bu lavozim bo'lmasa qanday muammo yuzaga keladi? Nima chayqalib turadi?"
          rows={2}
          value={portret.problem_solved ?? ""}
          onChange={e => p("problem_solved")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">5. Kimga hisobot beradi? (Tuzilmaviy joylashuv)</Label>
        <Input
          placeholder="Lavozimi va/yoki ismi (masalan: Marketing direktori — Aziz Karimov)"
          value={portret.reports_to ?? ""}
          onChange={e => p("reports_to")(e.target.value)}
        />
      </div>
    </div>
  );
}
