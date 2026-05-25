/**
 * @module ErpRoadmapCard
 * @description Card shell for the ERP roadmap. Phase contents live in sibling
 *   files (ErpRoadmapPhase1..5) so each stays under 300 lines.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import {
  Target,
  Search,
  Wrench,
  Shield,
  FileCheck,
  AlertCircle,
  BookOpen,
  CheckCircle,
} from "lucide-react";

import { ErpRoadmapPhase1 } from "./ErpRoadmapPhase1";
import { ErpRoadmapPhase2 } from "./ErpRoadmapPhase2";
import { ErpRoadmapPhase3 } from "./ErpRoadmapPhase3";
import { ErpRoadmapPhase4, ErpRoadmapPhase5 } from "./ErpRoadmapPhase4_5";

export function ErpRoadmapCard() {
  const { t } = useTranslation("common");
  return (
    <Card className="border-emerald-500/30" data-testid="erp-roadmap-section">
      <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20">
        <CardTitle className="flex items-center gap-2 text-[var(--ep-green)] dark:text-emerald-400">
          <Target className="h-6 w-6" />
          EUROPRINT ERP — SAP LIGHT → SAP NEAR (UZ BOZORI)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {t("toliqTahlilTuzatishVaRivojlantirish")}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h3 className="font-bold text-[var(--ep-red)] dark:text-red-400 flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5" />
            UMUMIY QOIDALAR (BUZILMAYDI)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                <span>{t("avvalTahlilKeyinOzgartirish")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                <span>{t("tahlilsizHechQachonKodYozma")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                <span>{t("harBirMuammoDalilBilan")}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                <span>{t("harBirOzgarishBiznesJarayonga")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                <span>{t("auditTrailBilanYozilsin")}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[var(--ep-red)] mt-0.5 shrink-0" />
                <span>{t("ozbekistonQonunchiligiInobatgaOlinsin")}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="phase1" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-4">
            <TabsTrigger value="phase1" className="text-xs md:text-sm" data-testid="tab-phase1">
              <Search className="h-4 w-4 mr-1 hidden md:inline" />
              {t("k1Bosqich")}
            </TabsTrigger>
            <TabsTrigger value="phase2" className="text-xs md:text-sm" data-testid="tab-phase2">
              <FileCheck className="h-4 w-4 mr-1 hidden md:inline" />
              {t("k2Bosqich")}
            </TabsTrigger>
            <TabsTrigger value="phase3" className="text-xs md:text-sm" data-testid="tab-phase3">
              <Wrench className="h-4 w-4 mr-1 hidden md:inline" />
              {t("k3Bosqich")}
            </TabsTrigger>
            <TabsTrigger value="phase4" className="text-xs md:text-sm" data-testid="tab-phase4">
              <Shield className="h-4 w-4 mr-1 hidden md:inline" />
              {t("k4Bosqich")}
            </TabsTrigger>
            <TabsTrigger value="phase5" className="text-xs md:text-sm" data-testid="tab-phase5">
              <BookOpen className="h-4 w-4 mr-1 hidden md:inline" />
              {t("k5Bosqich")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phase1" className="space-y-4">
            <ErpRoadmapPhase1 t={t} />
          </TabsContent>
          <TabsContent value="phase2" className="space-y-4">
            <ErpRoadmapPhase2 t={t} />
          </TabsContent>
          <TabsContent value="phase3" className="space-y-4">
            <ErpRoadmapPhase3 t={t} />
          </TabsContent>
          <TabsContent value="phase4" className="space-y-4">
            <ErpRoadmapPhase4 t={t} />
          </TabsContent>
          <TabsContent value="phase5" className="space-y-4">
            <ErpRoadmapPhase5 t={t} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
