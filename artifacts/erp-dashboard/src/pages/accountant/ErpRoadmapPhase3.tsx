/**
 * @module ErpRoadmapPhase3
 * @description Phase 3 tab content for ErpRoadmapCard.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EPStatusPill } from "@/components/ep";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Lock,
} from "lucide-react";

interface Props {
  t: (key: string) => string;
}

export function ErpRoadmapPhase3({ t }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <EPStatusPill tone="success">{t("phase3")}</EPStatusPill>
        <h3 className="text-lg font-bold">{t("phase3Title")}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--ep-green)]" />
              {t("k31QatiyBiznesQoidalar")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5" />
              <span>{t("omborManfiyBolsaSotuvBloklansin")}</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5" />
              <span>{t("hujjatsizTolovBolmasin")}</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5" />
              <span>{t("ishlabChiqarishsizMaterialChiqmasin")}</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5" />
              <span>{t("budgetdanChiqsaXarajatOtmasin")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--ep-blue)]" />
              3.2 Audit trail (immutable)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-blue)] mt-0.5" />
              <span>{t("harBirMuhimObyektUchun")}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-blue)] mt-0.5" />
              <span>{t("deleteYoqFaqatReversal")}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-blue)] mt-0.5" />
              <span>{t("whoWhenFromTo")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--ep-purple)]" />
              {t("k33PeriodClose")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-purple)] mt-0.5" />
              <span>{t("monthYearClose")}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-purple)] mt-0.5" />
              <span>{t("yopilganDavrgaYozibBolmasin")}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-purple)] mt-0.5" />
              <span>{t("overrideFaqatMaxsusRolBilan")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--ep-primary)]" />
              3.4 SSOT (Single Source of Truth)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{t("Mahsulot")}</Badge>
              <Badge variant="outline">{t("unit")}</Badge>
              <Badge variant="outline">{t("price")}</Badge>
              <Badge variant="outline">{t("mijoz1")}</Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              {t("faqat1JoydaYaratiladiBoshqa")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--ep-red)]" />
            3.6 ERP Validator (ichki nazorat)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-2">{t("avtomatikAniqlansin")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-2 bg-red-500/10 rounded">{t("tolovBorInvoiceYoq")}</div>
            <div className="p-2 bg-red-500/10 rounded">{t("ishlabChiqarishBorTannarxYoq")}</div>
            <div className="p-2 bg-red-500/10 rounded">{t("omborHarakatiMantiqsiz")}</div>
          </div>
          <p className="text-muted-foreground mt-2">{t("alertVaLogBilan")}</p>
        </CardContent>
      </Card>
    </>
  );
}
