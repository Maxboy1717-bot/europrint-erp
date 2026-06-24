/**
 * @module QcDpmoCalculator
 * @description QC DPMO + Six Sigma kalkulyator. POST /api/qc/dpmo (stateless math — DB yozish yo'q).
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sigma, BarChart3, Calculator } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";

interface DpmoResult {
  dpmo: number;
  sigmaLevel: number;
  qualityLevel: string;
  cp?: number;
  cpk?: number;
  dpmoTable: { sigma: number; dpmo: number }[];
}

interface FormState {
  defects: string;
  opportunities: string;
  units: string;
  processMean: string;
  processSigma: string;
  usl: string;
  lsl: string;
}

const EMPTY: FormState = {
  defects: "", opportunities: "", units: "",
  processMean: "", processSigma: "", usl: "", lsl: "",
};

function sigmaVariant(sigma: number): "success" | "warning" | "danger" {
  if (sigma >= 5) return "success";
  if (sigma >= 4) return "warning";
  return "danger";
}

function numOpt(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

export default function QcDpmoCalculator() {
  const { t } = useTranslation("qc");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [result, setResult] = useState<DpmoResult | null>(null);

  const calcMutation = useMutation({
    mutationFn: (payload: Record<string, number>) =>
      apiRequest<DpmoResult>("POST", "/api/qc/dpmo", payload),
    onSuccess: (data) => setResult(data),
  });

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));
  }

  function handleCalc() {
    const defects      = numOpt(form.defects);
    const opportunities = numOpt(form.opportunities);
    const units        = numOpt(form.units);
    if (defects === undefined || opportunities === undefined || units === undefined) return;
    if (opportunities <= 0 || units <= 0) return;

    const payload: Record<string, number> = { defects, opportunities, units };
    const processMean  = numOpt(form.processMean);
    const processSigma = numOpt(form.processSigma);
    const usl          = numOpt(form.usl);
    const lsl          = numOpt(form.lsl);
    if (processMean  !== undefined) payload['processMean']  = processMean;
    if (processSigma !== undefined) payload['processSigma'] = processSigma;
    if (usl          !== undefined) payload['usl']          = usl;
    if (lsl          !== undefined) payload['lsl']          = lsl;

    calcMutation.mutate(payload);
  }

  const variant = result ? sigmaVariant(result.sigmaLevel) : undefined;

  return (
    <DedicatedPageShell
      title={t("dpmoCalc.title", "DPMO + Six Sigma Kalkulyator")}
      description={t("dpmoCalc.desc", "Nuqsonlar soni va imkoniyatlar asosida DPMO, sigma daraja va jarayon qobiliyati")}
    >
      {/* Input section */}
      <Section title={t("dpmoCalc.inputs", "Kirish Ma'lumotlar")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.defects", "Nuqsonlar soni")} *</Label>
            <Input
              type="number" min="0" placeholder="0"
              value={form.defects} onChange={set("defects")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.opportunities", "Imkoniyatlar soni")} *</Label>
            <Input
              type="number" min="1" placeholder="1"
              value={form.opportunities} onChange={set("opportunities")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.units", "Birliklar soni")} *</Label>
            <Input
              type="number" min="1" placeholder="100"
              value={form.units} onChange={set("units")}
            />
          </div>
        </div>

        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground mb-3">
          {t("dpmoCalc.optional", "Cp/Cpk hisoblash uchun ixtiyoriy (jarayon statistikasi)")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.mean", "Jarayon o'rtasi")}</Label>
            <Input type="number" placeholder="0" value={form.processMean} onChange={set("processMean")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.sigma", "Jarayon sigma (σ)")}</Label>
            <Input type="number" min="0.001" placeholder="1" value={form.processSigma} onChange={set("processSigma")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.usl", "Yuqori chegara (USL)")}</Label>
            <Input type="number" placeholder="" value={form.usl} onChange={set("usl")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("dpmoCalc.lsl", "Quyi chegara (LSL)")}</Label>
            <Input type="number" placeholder="" value={form.lsl} onChange={set("lsl")} />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleCalc}
            disabled={!form.defects || !form.opportunities || !form.units || calcMutation.isPending}
            className="bg-[var(--ep-primary)] hover:bg-[var(--ep-primary)]/90 text-white"
          >
            <Calculator className="h-4 w-4 mr-1.5" />
            {calcMutation.isPending ? t("dpmoCalc.calculating", "Hisoblanmoqda...") : t("dpmoCalc.calculate", "Hisoblash")}
          </Button>
          {result && (
            <Button variant="outline" onClick={() => { setResult(null); setForm(EMPTY); }}>
              {t("dpmoCalc.reset", "Tozalash")}
            </Button>
          )}
        </div>
      </Section>

      {/* Result section */}
      {result && (
        <>
          <Section title={t("dpmoCalc.results", "Natija")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label="DPMO"
                value={result.dpmo.toLocaleString("uz-UZ")}
                icon={<Sigma className="h-4 w-4" />}
                variant={variant}
              />
              <KpiCard
                label={t("dpmoCalc.sigmaLevel", "Sigma darajasi")}
                value={result.qualityLevel}
                icon={<BarChart3 className="h-4 w-4" />}
                variant={variant}
              />
              {result.cp !== undefined && (
                <KpiCard
                  label="Cp (jarayon qobiliyati)"
                  value={result.cp.toFixed(3)}
                  icon={<BarChart3 className="h-4 w-4" />}
                  variant={result.cp >= 1.33 ? "success" : result.cp >= 1 ? "warning" : "danger"}
                />
              )}
              {result.cpk !== undefined && (
                <KpiCard
                  label="Cpk (markazlangan)"
                  value={result.cpk.toFixed(3)}
                  icon={<BarChart3 className="h-4 w-4" />}
                  variant={result.cpk >= 1.33 ? "success" : result.cpk >= 1 ? "warning" : "danger"}
                />
              )}
            </div>

            <Card className="mt-4 bg-muted/30">
              <CardContent className="pt-4 text-center">
                <Badge
                  className={`text-base px-4 py-1.5 ${
                    variant === "success"
                      ? "bg-[var(--ep-green)]/10 text-[var(--ep-green)] border-[var(--ep-green)]/30"
                      : variant === "warning"
                      ? "bg-[var(--ep-yellow)]/10 text-[var(--ep-yellow)] border-[var(--ep-yellow)]/30"
                      : "bg-[var(--ep-red)]/10 text-[var(--ep-red)] border-[var(--ep-red)]/30"
                  }`}
                  variant="outline"
                >
                  {result.qualityLevel} · {result.dpmo.toLocaleString()} DPMO
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {variant === "success"
                    ? t("dpmoCalc.excellent", "Jahon darajasidagi sifat (6σ = 3.4 DPMO)")
                    : variant === "warning"
                    ? t("dpmoCalc.good", "Yaxshi sifat — yaxshilash mumkin")
                    : t("dpmoCalc.improve", "Jarayon yaxshilashni talab qiladi")}
                </p>
              </CardContent>
            </Card>
          </Section>

          {/* Sigma reference table */}
          <Section title={t("dpmoCalc.sigmaTable", "Six Sigma Jadval")}>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Sigma (σ)</th>
                    <th className="text-right p-3 font-medium">DPMO</th>
                    <th className="text-center p-3 font-medium">{t("dpmoCalc.status", "Holat")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(result.dpmoTable)].sort((a, b) => b.sigma - a.sigma).map(row => {
                    const isCurrent = row.sigma === Math.floor(result.sigmaLevel) ||
                      (result.sigmaLevel >= row.sigma && result.sigmaLevel < row.sigma + 1);
                    return (
                      <tr
                        key={row.sigma}
                        className={`border-b transition-colors ${isCurrent ? "bg-[var(--ep-primary)]/5 font-semibold" : ""}`}
                      >
                        <td className="p-3">{row.sigma}σ {isCurrent && "← joriy"}</td>
                        <td className="p-3 text-right font-mono">{row.dpmo.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              row.sigma >= 5
                                ? "text-[var(--ep-green)]"
                                : row.sigma >= 4
                                ? "text-[var(--ep-yellow)]"
                                : "text-[var(--ep-red)]"
                            }`}
                          >
                            {row.sigma >= 5 ? "A'lo" : row.sigma >= 4 ? "Qoniqarli" : "Yomon"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </DedicatedPageShell>
  );
}
