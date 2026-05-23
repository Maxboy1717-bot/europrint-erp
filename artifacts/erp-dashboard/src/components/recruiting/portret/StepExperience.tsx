/**
 * @module StepExperience
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PortretData } from "./types";
import { WORKER_TYPE_META } from "@/lib/workerType";
import type { WorkerType } from "@/lib/workerType";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';

interface StepExperienceProps {
  portret: PortretData;
  onChange: (field: keyof PortretData) => (val: string | number | boolean | string[]) => void;
}

export function StepExperience({ portret, onChange }: StepExperienceProps) {
  const { t } = useTranslation("common");
  const p = onChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-sm text-primary">{t("blokETajribaVaBilim")}</h3>
        <Badge variant="outline" className="text-[9px]">{t("k5TaSavol")}</Badge>
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k14QandayTurdagiOdamZarar")}</Label>
        <Textarea
          placeholder={t("masalanTartibsizMasuliyatsizAgressivOrganishni")}
          rows={2}
          value={portret.danger_candidate ?? ""}
          onChange={e => p("danger_candidate")(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 p-3 bg-muted/40 rounded-lg border border-border/40">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t("k15OldingiIshTajribasiMajburiymi")}</Label>
          <div className="flex gap-1">
            <Button
              variant={portret.experience_required ? "default" : "outline"}
              size="sm" className="h-7 text-xs"
              onClick={() => p("experience_required")(true)}
            >{tLabel("common.StepExperience.tsx.ha", "Ha")}</Button>
            <Button
              variant={!portret.experience_required ? "default" : "outline"}
              size="sm" className="h-7 text-xs"
              onClick={() => p("experience_required")(false)}
            >{t("no")}</Button>
          </div>
        </div>

        {portret.experience_required && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <Label className="text-[11px] mb-1 block">{t("qaysiSohadaVaNechaYil")}</Label>
            <Input
              placeholder={t("masalanFmcgSavdoSohasidaKamida")}
              value={portret.experience_field ?? ""}
              onChange={e => p("experience_field")(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k16HozirKandidatQayerdaIshlayotgan")}</Label>
        <Input
          placeholder={t("masalanRaqobatchiKompaniyalardaBankSohasida")}
          value={portret.current_employment ?? ""}
          onChange={e => p("current_employment")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k17MalumSohadaTajribaKerakmi")}</Label>
        <Input
          placeholder={t("masalanQurilishTibbiyotIt")}
          value={portret.industry_experience ?? ""}
          onChange={e => p("industry_experience")(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-xs mb-1 block">{t("k18KasbKoNikmalariDasturlarTillar")}</Label>
        <Textarea
          placeholder={t("masalanExcelVlookup1cInglizTili")}
          rows={2}
          value={portret.professional_skills ?? ""}
          onChange={e => p("professional_skills")(e.target.value)}
        />
      </div>

      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <Label className="text-xs mb-2 block text-primary font-semibold">{t("xodimTuriMaqsadli")}</Label>
        <div className="flex gap-2">
          <button
            onClick={() => p("target_worker_type")("FLAGMAN")}
            className={`flex-1 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
              portret.target_worker_type === "FLAGMAN"
                ? "bg-primary text-white border-primary"
                : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            🚀 FLAGMAN (Natija)
          </button>
          <button
            onClick={() => p("target_worker_type")("PROTSESSNIK")}
            className={`flex-1 py-2 px-3 rounded-md border text-xs font-medium transition-all ${
              portret.target_worker_type === "PROTSESSNIK"
                ? "bg-primary text-white border-primary"
                : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            ⚙️ PROTSESSNIK (Jarayon)
          </button>
        </div>
      </div>
    </div>
  );
}
