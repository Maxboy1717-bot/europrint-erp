/**
 * @module PortretSection4
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortretData } from "./types";
import { useTranslation } from '@/lib/i18n';

interface PortretSection4Props {
  portret: PortretData;
  onChange: (field: keyof NonNullable<PortretData["candidate_presentation"]>) => (val: string) => void;
}

export function PortretSection4({ portret, onChange }: PortretSection4Props) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 mb-2">
        <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">{t("ivBolimKandidatgaTaqdimot")}</h4>
        <p className="text-[10px] text-[var(--ep-yellow)] dark:text-amber-400 mt-0.5">
          {t("buMalumotlarHrManagerTomonidan")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* 1–3: Kompaniya, Tartib, Instrumentlar */}
        <div>
          <Label className="text-xs mb-1 block">{t("k1KompaniyaTaqdimotiQisqa")}</Label>
          <Textarea
            placeholder={t("hrManagerSuhbatBoshidaKompaniyaniQanday")}
            rows={2}
            value={portret.candidate_presentation?.kompaniya_taqdimoti ?? ""}
            onChange={e => onChange("kompaniya_taqdimoti")(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k2IshTartibi")}</Label>
            <Input
              placeholder={t("masalanAgileQatiyIntizom")}
              value={portret.candidate_presentation?.ish_tartibi ?? ""}
              onChange={e => onChange("ish_tartibi")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k3AsboblarDasturlar")}</Label>
            <Input
              placeholder={t("noutbukCrmMaxsusKiyim")}
              value={portret.candidate_presentation?.instrumentlar ?? ""}
              onChange={e => onChange("instrumentlar")(e.target.value)}
            />
          </div>
        </div>

        {/* 4–6: Guruh, Safar, Sinov davri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k4GuruhSoni")}</Label>
            <Input
              placeholder={t("k5Kishi")}
              value={portret.candidate_presentation?.guruh_javob ?? ""}
              onChange={e => onChange("guruh_javob")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k5XizmatSafari")}</Label>
            <Select
              value={portret.candidate_presentation?.xizmat_safari ?? "no"}
              onValueChange={v => onChange("xizmat_safari")(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">{t("no")}</SelectItem>
                <SelectItem value="yes">Ha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k6SinovMuddati")}</Label>
            <Input
              placeholder={t("k3Oy")}
              value={portret.candidate_presentation?.sinov_muddat ?? ""}
              onChange={e => onChange("sinov_muddat")(e.target.value)}
            />
          </div>
        </div>

        {/* 7–9: Maoshlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k7SinovMaoshMin")}</Label>
            <Input
              value={portret.candidate_presentation?.sinov_maosh_min ?? ""}
              onChange={e => onChange("sinov_maosh_min")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k8SinovMaoshMax")}</Label>
            <Input
              value={portret.candidate_presentation?.sinov_maosh_max ?? ""}
              onChange={e => onChange("sinov_maosh_max")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k9AsosiyMaosh")}</Label>
            <Input
              value={portret.candidate_presentation?.asosiy_maosh ?? ""}
              onChange={e => onChange("asosiy_maosh")(e.target.value)}
            />
          </div>
        </div>

        {/* 10–13: Martaba, Ta'til, Rejim, Shartnoma */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k10MartabaOsishi")}</Label>
            <Input
              value={portret.candidate_presentation?.martaba ?? ""}
              onChange={e => onChange("martaba")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k11YillikTaTilKun")}</Label>
            <Input
              value={portret.candidate_presentation?.tatil_kun ?? ""}
              onChange={e => onChange("tatil_kun")(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs mb-1 block">{t("k12IshRejimiSoat")}</Label>
            <Input
              value={portret.candidate_presentation?.ish_rejimi ?? ""}
              onChange={e => onChange("ish_rejimi")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t("k13ShartnomaTuri")}</Label>
            <Select
              value={portret.candidate_presentation?.shartnoma_tur ?? "unlimited"}
              onValueChange={v => onChange("shartnoma_tur")(v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">{t("muddatsizTrudovoy")}</SelectItem>
                <SelectItem value="limited">{t("muddati1Yil")}</SelectItem>
                <SelectItem value="gpc">{t("gpcShartnoma")}</SelectItem>
                <SelectItem value="ip">{t("oziniOziBandQilish")}</SelectItem>
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
            onChange={e => onChange("jalb_qiluvchi")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("k15IjtimoiyPaketSotsialPaket")}</Label>
          <Textarea
            placeholder={t("masalanTibbiySugurtaKorporativTransport")}
            rows={2}
            value={portret.candidate_presentation?.sotsial_paket ?? ""}
            onChange={e => onChange("sotsial_paket")(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block">{t("k16OqitishImkoniyatlari")}</Label>
          <Textarea
            placeholder={t("masalanIchkiTreninglarKasbiyKurslar")}
            rows={2}
            value={portret.candidate_presentation?.oqutish ?? ""}
            onChange={e => onChange("oqutish")(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
