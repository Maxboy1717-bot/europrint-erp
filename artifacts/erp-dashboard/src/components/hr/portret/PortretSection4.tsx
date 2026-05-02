import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";

interface PortretSection4Props {
  portret: PortretData;
  onChange: (field: keyof NonNullable<PortretData["candidate_presentation"]>) => (val: string) => void;
}

export function PortretSection4({ portret, onChange }: PortretSection4Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 mb-2">
        <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">IV Bo'lim: Kandidatga taqdimot</h4>
        <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
          Bu ma'lumotlar HR manager tomonidan suhbat davomida nomzodga kompaniya va lavozimni "sotish" uchun ishlatiladi.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1–3: Kompaniya, Tartib, Instrumentlar */}
        <div>
          <Label className="text-xs mb-1 block">1. Kompaniya taqdimoti (qisqa)</Label>
          <Textarea
            placeholder="HR manager suhbat boshida kompaniyani qanday tanishtirishi kerak?"
            rows={2}
            value={portret.candidate_presentation?.kompaniya_taqdimoti ?? ""}
            onChange={e => onChange("kompaniya_taqdimoti")(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">2. Ish tartibi</Label>
            <Input
              placeholder="Masalan: Agile, qat'iy intizom..."
              value={portret.candidate_presentation?.ish_tartibi ?? ""}
              onChange={e => onChange("ish_tartibi")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">3. Asboblar/Dasturlar</Label>
            <Input
              placeholder="Noutbuk, CRM, maxsus kiyim..."
              value={portret.candidate_presentation?.instrumentlar ?? ""}
              onChange={e => onChange("instrumentlar")(e.target.value)}
            />
          </div>
        </div>

        {/* 4–6: Guruh, Safar, Sinov davri */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">4. Guruh (soni)</Label>
            <Input
              placeholder="5 kishi"
              value={portret.candidate_presentation?.guruh_javob ?? ""}
              onChange={e => onChange("guruh_javob")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">5. Xizmat safari</Label>
            <Select
              value={portret.candidate_presentation?.xizmat_safari ?? "no"}
              onValueChange={v => onChange("xizmat_safari")(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Yo'q</SelectItem>
                <SelectItem value="yes">Ha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">6. Sinov muddati</Label>
            <Input
              placeholder="3 oy"
              value={portret.candidate_presentation?.sinov_muddat ?? ""}
              onChange={e => onChange("sinov_muddat")(e.target.value)}
            />
          </div>
        </div>

        {/* 7–9: Maoshlar */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">7. Sinov maosh (min)</Label>
            <Input
              value={portret.candidate_presentation?.sinov_maosh_min ?? ""}
              onChange={e => onChange("sinov_maosh_min")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">8. Sinov maosh (max)</Label>
            <Input
              value={portret.candidate_presentation?.sinov_maosh_max ?? ""}
              onChange={e => onChange("sinov_maosh_max")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">9. Asosiy maosh</Label>
            <Input
              value={portret.candidate_presentation?.asosiy_maosh ?? ""}
              onChange={e => onChange("asosiy_maosh")(e.target.value)}
            />
          </div>
        </div>

        {/* 10–13: Martaba, Ta'til, Rejim, Shartnoma */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">10. Martaba o'sishi</Label>
            <Input
              value={portret.candidate_presentation?.martaba ?? ""}
              onChange={e => onChange("martaba")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">11. Yillik ta'til (kun)</Label>
            <Input
              value={portret.candidate_presentation?.tatil_kun ?? ""}
              onChange={e => onChange("tatil_kun")(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">12. Ish rejimi (soat)</Label>
            <Input
              value={portret.candidate_presentation?.ish_rejimi ?? ""}
              onChange={e => onChange("ish_rejimi")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">13. Shartnoma turi</Label>
            <Select
              value={portret.candidate_presentation?.shartnoma_tur ?? "unlimited"}
              onValueChange={v => onChange("shartnoma_tur")(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">Muddatsiz (Trudovoy)</SelectItem>
                <SelectItem value="limited">Muddati (1 yil)</SelectItem>
                <SelectItem value="gpc">GPC (Shartnoma)</SelectItem>
                <SelectItem value="ip">O'zini o'zi band qilish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 14–16: Jalb qiluvchi, Sotsial paket, O'qitish */}
        <div>
          <Label className="text-xs mb-1 block">
            14. Nima uchun bizda ishlash kerak? — Asosiy jalb qiluvchi omil <span className="text-red-400">*</span>
          </Label>
          <Textarea
            placeholder="Kompaniyaning eng kuchli tomoni — nima uchun aqlli kandidat bizni tanlaydi? Imkoniyatlar, jamoa, missiya..."
            rows={3}
            value={portret.candidate_presentation?.jalb_qiluvchi ?? ""}
            onChange={e => onChange("jalb_qiluvchi")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">15. Ijtimoiy paket (sotsial paket)</Label>
          <Textarea
            placeholder="Masalan: Tibbiy sug'urta, korporativ transport, ovqatlanish, sport zali, bonus dasturi..."
            rows={2}
            value={portret.candidate_presentation?.sotsial_paket ?? ""}
            onChange={e => onChange("sotsial_paket")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">16. O'qitish imkoniyatlari</Label>
          <Textarea
            placeholder="Masalan: Ichki treninglar, kasbiy kurslar, sertifikatlar, xorijiy o'qishlar..."
            rows={2}
            value={portret.candidate_presentation?.oqutish ?? ""}
            onChange={e => onChange("oqutish")(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
