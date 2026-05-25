/** @module ProductivityInterviewDialogStep2 @description Step 2 panel — motivation (motivatsiya). Renders 4 open questions, flow direction selector, and motivation level picker (1–4). */

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MOTIVATION_LEVELS } from "./ProductivityInterviewDialogTypes";
import type { MotivationData } from "./ProductivityInterviewDialogTypes";
import { useTranslation } from '@/lib/i18n';

interface Step2Props {
  motivation: MotivationData;
  onChange: <K extends keyof MotivationData>(field: K, value: MotivationData[K]) => void;
}

export function Step2Motivation({ motivation, onChange }: Step2Props) {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">{t("bolim2Motivatsiya")}</h3>
        <Badge variant="outline" className="text-[9px]">{t("k4SavolOqimDaraja")}</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S1.</span> {t("buIshSizgaNimaAnglatadi")}
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder={t("buLavozimdaIshlashningNimaManosi")}
          value={motivation.q1_work_meaning}
          onChange={e => onChange("q1_work_meaning", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S2.</span> {t("idealIshMuhitiQandayBolishi")}
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder={t("muhitAtmosferaRahbarUslubi")}
          value={motivation.q2_ideal_env}
          onChange={e => onChange("q2_ideal_env", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S3.</span> {t("engYaxshiNatijangizniAyting")}
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder={t("ozingizMaqtanishingizMumkinBolganNatija")}
          value={motivation.q3_achievement}
          onChange={e => onChange("q3_achievement", e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">
          <span className="text-primary font-semibold">S4.</span> {t("k35YildanSongKim")}
        </Label>
        <Textarea
          rows={2}
          className="text-xs"
          placeholder={t("karyeraMaqsadiProfessionalRivojlanish")}
          value={motivation.q4_future_goal}
          onChange={e => onChange("q4_future_goal", e.target.value)}
        />
      </div>

      {/* Kiruvchi / Chiquvchi oqim */}
      <div className="border border-border/40 rounded-lg p-3 bg-muted/40">
        <Label className="text-xs mb-2 block font-medium">
          Nomzod oqim belgisi (rekruter baholaydi):
        </Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange("flow_direction", "inflow")}
            className={`flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-1.5 ${
              motivation.flow_direction === "inflow"
                ? "bg-green-600/20 border-green-500/60 text-green-300"
                : "border-border/40 text-muted-foreground hover:border-green-500/40"
            }`}
          >
            <span className="text-base">→</span>
            <div className="text-left">
              <div className="font-semibold">{t("kiruvchiOqim")}</div>
              <div className="text-[9px] opacity-70">{t("kompaniyagaKelmoqchi")}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onChange("flow_direction", "outflow")}
            className={`flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-1.5 ${
              motivation.flow_direction === "outflow"
                ? "bg-red-600/20 border-red-500/60 text-red-300"
                : "border-border/40 text-muted-foreground hover:border-red-500/40"
            }`}
          >
            <span className="text-base">←</span>
            <div className="text-left">
              <div className="font-semibold">{t("chiquvchiOqim")}</div>
              <div className="text-[9px] opacity-70">{t("hozirgiJoydanKetmoqchi")}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Motivatsiya darajasi 1-4 */}
      <div>
        <Label className="text-xs mb-2 block font-medium">
          Motivatsiya darajasi (rekruter baholaydi):
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Array.isArray(MOTIVATION_LEVELS) ? MOTIVATION_LEVELS : []).map(lvl => (
            <button
              key={lvl.level}
              type="button"
              onClick={() => onChange("motivation_level", lvl.level)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                motivation.motivation_level === lvl.level
                  ? lvl.color + " ring-1 ring-current"
                  : "border-border/40 text-muted-foreground hover:border-border/70"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{lvl.icon}</span>
                <span className="text-xs font-bold">{lvl.level}. {lvl.label}</span>
              </div>
              <p className="text-[9px] leading-snug opacity-80">{lvl.description}</p>
            </button>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground bg-muted/40 rounded p-2">
          <strong>{t("korsatma")}</strong> 4=Burch (eng yuqori), 3=E'tiqod, 2=Manfaat, 1=Pul (eng past)
        </div>
      </div>
    </div>
  );
}
