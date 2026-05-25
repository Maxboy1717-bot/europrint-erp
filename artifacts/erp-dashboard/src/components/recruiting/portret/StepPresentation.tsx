/**
 * @module StepPresentation
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
import { tLabel } from '@/lib/i18n/tLabel';

interface StepPresentationProps {
  portret: PortretData;
  onChangePresentation: (field: keyof NonNullable<PortretData["candidate_presentation"]>) => (val: string) => void;
}

export function StepPresentation({ portret, onChangePresentation }: StepPresentationProps) {
  const { t } = useTranslation("common");
  const cp = onChangePresentation;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">{t("ivBolimKandidatgaTaqdimot1")}</h3>
        <Badge variant="outline" className="text-[9px]">{t("suhbatdaAytiladigan16Savol")}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1–3: Kompaniya, Ish tartibi, Instrumentlar */}
        <div>
          <Label className="text-xs mb-1 block">{t("k1KompaniyaHaqidaQisqachaTaqdimot")}</Label>
          <Textarea
            placeholder={t("kompaniyaFaoliyatiQisqaTarixiVa")}
            rows={2}
            value={portret.candidate_presentation?.kompaniya_taqdimoti ?? ""}
            onChange={e => cp("kompaniya_taqdimoti")(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k2IshTartibiVaJarayonlar")}</Label>
            <Input
              placeholder={t("kompaniyadaIshQandayTashkilQilingan")}
              value={portret.candidate_presentation?.ish_tartibi ?? ""}
              onChange={e => cp("ish_tartibi")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k3InstrumentlarDasturlar")}</Label>
            <Input
              placeholder={t("qandayAsboblarIshlatiladi")}
              value={portret.candidate_presentation?.instrumentlar ?? ""}
              onChange={e => cp("instrumentlar")(e.target.value)}
            />
          </div>
        </div>

        {/* 4–6: Guruh, Safar, Sinov muddati */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k4GuruhgaJavobgarlik")}</Label>
            <Input
              placeholder={t("nechaKishi")}
              value={portret.candidate_presentation?.guruh_javob ?? ""}
              onChange={e => cp("guruh_javob")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k5XizmatSafari")}</Label>
            <Select
              value={portret.candidate_presentation?.xizmat_safari ?? "no"}
              onValueChange={v => cp("xizmat_safari")(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{tLabel("common.StepPresentation.tsx.ha", "Ha")}</SelectItem>
                <SelectItem value="no">{t("no")}</SelectItem>
                <SelectItem value="rare">{t("kamdanKam")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k6SinovMuddati")}</Label>
            <Input
              placeholder={t("masalan3Oy")}
              value={portret.candidate_presentation?.sinov_muddat ?? ""}
              onChange={e => cp("sinov_muddat")(e.target.value)}
            />
          </div>
        </div>

        {/* 7–10: Maoshlar va Martaba */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-lg bg-muted/40/50">
          <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-primary">{t("sinovDavriMaoshi")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder={t("min1")} size={1}
                className="h-8 text-xs"
                value={portret.candidate_presentation?.sinov_maosh_min ?? ""}
                onChange={e => cp("sinov_maosh_min")(e.target.value)}
              />
              <Input
                placeholder={t("max1")}
                className="h-8 text-xs"
                value={portret.candidate_presentation?.sinov_maosh_max ?? ""}
                onChange={e => cp("sinov_maosh_max")(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-primary">{t("asosiyMaoshVaMartaba")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder={t("asosiyMaosh1")}
                className="h-8 text-xs"
                value={portret.candidate_presentation?.asosiy_maosh ?? ""}
                onChange={e => cp("asosiy_maosh")(e.target.value)}
              />
              <Input
                placeholder={t("martabaOsishi")}
                className="h-8 text-xs"
                value={portret.candidate_presentation?.martaba ?? ""}
                onChange={e => cp("martaba")(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 11–13: Ta'til, Rejim, Shartnoma */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">{t("k11YillikTatil")}</Label>
              <Input
                placeholder={t("kun")}
                value={portret.candidate_presentation?.tatil_kun ?? ""}
                onChange={e => cp("tatil_kun")(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("k12IshRejimi")}</Label>
              <Input
                placeholder={t("masalan09001800")}
                value={portret.candidate_presentation?.ish_rejimi ?? ""}
                onChange={e => cp("ish_rejimi")(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k13ShartnomaTuri")}</Label>
            <Select
              value={portret.candidate_presentation?.shartnoma_tur ?? ""}
              onValueChange={v => cp("shartnoma_tur")(v)}
            >
              <SelectTrigger><SelectValue placeholder={t("tanlang1")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">{t("muddatsizDoimiy")}</SelectItem>
                <SelectItem value="limited">{t("muddatli")}</SelectItem>
                <SelectItem value="gpc">{t("fuqarolikShartnomasiGpc")}</SelectItem>
                <SelectItem value="ip">{t("ipYakkaTartibdagiTadbirkor")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 14–16: Jalb qiluvchi, Sotsial paket, O'qitish */}
        <div>
          <Label className="text-xs mb-1 block">
            {t("k14NimaUchunBizdaIshlash")}<span className="text-red-400">*</span>
          </Label>
          <Textarea
            placeholder={t("kompaniyaningEngKuchliTomoniNima")}
            rows={3}
            value={portret.candidate_presentation?.jalb_qiluvchi ?? ""}
            onChange={e => cp("jalb_qiluvchi")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("k15IjtimoiyPaketSotsialPaket")}</Label>
          <Textarea
            placeholder={t("masalanTibbiySugurtaKorporativTransport")}
            rows={2}
            value={portret.candidate_presentation?.sotsial_paket ?? ""}
            onChange={e => cp("sotsial_paket")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("k16OqitishImkoniyatlari")}</Label>
          <Textarea
            placeholder={t("masalanIchkiTreninglarKasbiyKurslar")}
            rows={2}
            value={portret.candidate_presentation?.oqutish ?? ""}
            onChange={e => cp("oqutish")(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
