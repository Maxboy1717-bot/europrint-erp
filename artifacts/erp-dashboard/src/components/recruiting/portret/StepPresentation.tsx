import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";

interface StepPresentationProps {
  portret: PortretData;
  onChangePresentation: (field: keyof NonNullable<PortretData["candidate_presentation"]>) => (val: string) => void;
}

export function StepPresentation({ portret, onChangePresentation }: StepPresentationProps) {
  const cp = onChangePresentation;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">IV bo'lim: Kandidatga taqdimot</h3>
        <Badge variant="outline" className="text-[9px]">Suhbatda aytiladigan 16 savol</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1–3: Kompaniya, Ish tartibi, Instrumentlar */}
        <div>
          <Label className="text-xs mb-1 block">1. Kompaniya haqida qisqacha taqdimot</Label>
          <Textarea
            placeholder="Kompaniya faoliyati, qisqa tarixi va yutuqlari..."
            rows={2}
            value={portret.candidate_presentation?.kompaniya_taqdimoti ?? ""}
            onChange={e => cp("kompaniya_taqdimoti")(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">2. Ish tartibi va jarayonlar</Label>
            <Input
              placeholder="Kompaniyada ish qanday tashkil qilingan?"
              value={portret.candidate_presentation?.ish_tartibi ?? ""}
              onChange={e => cp("ish_tartibi")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">3. Instrumentlar/Dasturlar</Label>
            <Input
              placeholder="Qanday asboblar ishlatiladi?"
              value={portret.candidate_presentation?.instrumentlar ?? ""}
              onChange={e => cp("instrumentlar")(e.target.value)}
            />
          </div>
        </div>

        {/* 4–6: Guruh, Safar, Sinov muddati */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">4. Guruhga javobgarlik</Label>
            <Input
              placeholder="Necha kishi?"
              value={portret.candidate_presentation?.guruh_javob ?? ""}
              onChange={e => cp("guruh_javob")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">5. Xizmat safari</Label>
            <Select
              value={portret.candidate_presentation?.xizmat_safari ?? "no"}
              onValueChange={v => cp("xizmat_safari")(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Ha</SelectItem>
                <SelectItem value="no">Yo'q</SelectItem>
                <SelectItem value="rare">Kamdan-kam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">6. Sinov muddati</Label>
            <Input
              placeholder="Masalan: 3 oy"
              value={portret.candidate_presentation?.sinov_muddat ?? ""}
              onChange={e => cp("sinov_muddat")(e.target.value)}
            />
          </div>
        </div>

        {/* 7–10: Maoshlar va Martaba */}
        <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-surface-container-low/50">
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-primary">Sinov davri maoshi</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Min" size={1}
                className="h-8 text-xs"
                value={portret.candidate_presentation?.sinov_maosh_min ?? ""}
                onChange={e => cp("sinov_maosh_min")(e.target.value)}
              />
              <Input
                placeholder="Max"
                className="h-8 text-xs"
                value={portret.candidate_presentation?.sinov_maosh_max ?? ""}
                onChange={e => cp("sinov_maosh_max")(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-primary">Asosiy maosh va Martaba</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Asosiy maosh"
                className="h-8 text-xs"
                value={portret.candidate_presentation?.asosiy_maosh ?? ""}
                onChange={e => cp("asosiy_maosh")(e.target.value)}
              />
              <Input
                placeholder="Martaba o'sishi"
                className="h-8 text-xs"
                value={portret.candidate_presentation?.martaba ?? ""}
                onChange={e => cp("martaba")(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 11–13: Ta'til, Rejim, Shartnoma */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">11. Yillik ta'til</Label>
              <Input
                placeholder="Kun"
                value={portret.candidate_presentation?.tatil_kun ?? ""}
                onChange={e => cp("tatil_kun")(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">12. Ish rejimi</Label>
              <Input
                placeholder="Masalan: 09:00-18:00"
                value={portret.candidate_presentation?.ish_rejimi ?? ""}
                onChange={e => cp("ish_rejimi")(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">13. Shartnoma turi</Label>
            <Select
              value={portret.candidate_presentation?.shartnoma_tur ?? ""}
              onValueChange={v => cp("shartnoma_tur")(v)}
            >
              <SelectTrigger><SelectValue placeholder="Tanlang..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">Muddatsiz (doimiy)</SelectItem>
                <SelectItem value="limited">Muddatli</SelectItem>
                <SelectItem value="gpc">Fuqarolik shartnomasi (GPC)</SelectItem>
                <SelectItem value="ip">IP / Yakka tartibdagi tadbirkor</SelectItem>
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
            onChange={e => cp("jalb_qiluvchi")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">15. Ijtimoiy paket (sotsial paket)</Label>
          <Textarea
            placeholder="Masalan: Tibbiy sug'urta, korporativ transport, ovqatlanish, sport zali, bonus dasturi..."
            rows={2}
            value={portret.candidate_presentation?.sotsial_paket ?? ""}
            onChange={e => cp("sotsial_paket")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">16. O'qitish imkoniyatlari</Label>
          <Textarea
            placeholder="Masalan: Ichki treninglar, kasbiy kurslar, sertifikatlar, xorijiy o'qishlar..."
            rows={2}
            value={portret.candidate_presentation?.oqutish ?? ""}
            onChange={e => cp("oqutish")(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
