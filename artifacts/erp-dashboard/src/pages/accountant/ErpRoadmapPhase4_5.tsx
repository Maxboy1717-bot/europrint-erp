/**
 * @module ErpRoadmapPhase4_5
 * @description Phases 4 and 5 tab content for ErpRoadmapCard. Combined because
 *   each is small. Split out so the card shell stays under 300 lines.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EPStatusPill } from "@/components/ep";
import {
  AlertTriangle,
  CheckCircle,
  Database,
  DollarSign,
  FileText,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

interface Props {
  t: (key: string) => string;
}

export function ErpRoadmapPhase4({ t }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-purple-500">{t("phase4")}</Badge>
        <h3 className="text-lg font-bold">{t("ozbekistonUchunSapNearMoslashuv")}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-[var(--ep-purple)]" />
              <span className="font-medium">{t("tasdiqlashMatritsasi")}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("tasdiqlashMatritsasiKimNimaniTasdiqlashi")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-[var(--ep-purple)]" />
              <span className="font-medium">{t("accrualBuxgalteriya")}</span>
            </div>
            <p className="text-sm text-muted-foreground">Hisoblash usuli (minimal darajada)</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-[var(--ep-purple)]" />
              <span className="font-medium">{t("kopValyuta")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("uzsUsdEurQollabQuvvatlash")}</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-[var(--ep-purple)]" />
              <span className="font-medium">{t("auditorRejimi")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("faqatOqishRejimiBarchaLoglar")}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function ErpRoadmapPhase5({ t }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <EPStatusPill tone="success">{t("phase5")}</EPStatusPill>
        <h3 className="text-lg font-bold">{t("finalReportTitle")}</h3>
      </div>

      <Card className="bg-emerald-500/5 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-[var(--ep-green)] dark:text-emerald-400">
            ERP HISOBOTI AUDIT — SAP LIGHT → SAP NEAR (UZ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-[var(--ep-green)]" />
                <span className="font-medium">{t("tizimPasporti")}</span>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
                <span className="font-medium">{t("topilganMuammolar")}</span>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
                <span className="font-medium">{t("tuzatilganMuammolar")}</span>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-[var(--ep-purple)]" />
                <span className="font-medium">{t("uzAdaptation")}</span>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-[var(--ep-blue)]" />
                <span className="font-medium">{t("kpiNatijalari")}</span>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-[var(--ep-green)]" />
                <span className="font-medium">{t("keyingiQadamlar")}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <h3 className="font-bold text-[var(--ep-green)] dark:text-emerald-400 mb-2">
              {t("maqsadSapNearOzbekistonBozorining")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                <span>{t("k100AuditQamrovi")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                <span>{t("soliqKodeksigaMoslik")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                <span>{t("biznesJarayonlarUzluksiz")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
                <span>{t("ozbekistonBozoridaEngKuchliLokal")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
