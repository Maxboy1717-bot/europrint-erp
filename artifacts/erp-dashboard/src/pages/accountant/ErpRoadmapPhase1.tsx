/**
 * @module ErpRoadmapPhase1
 * @description Phase 1 tab content for ErpRoadmapCard. Split out so the card
 *   shell stays under 300 lines.
 */

import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Database,
  Layers,
  Settings,
  TrendingUp,
} from "lucide-react";
import { EPStatusPill } from "@/components/ep";

interface Props {
  t: (key: string) => string;
}

export function ErpRoadmapPhase1({ t }: Props) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <EPStatusPill tone="info">{t("phase1")}</EPStatusPill>
        <h3 className="text-lg font-bold">{t("phase1Title")}</h3>
      </div>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="passport">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--ep-blue)]" />
              <span>{t("k11TizimPasporti")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-6 space-y-2 text-sm text-muted-foreground">
              <p>{t("aniqChiqar")}</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{t("totalLoc")}</li>
                <li>{t("fayllarSoni")}</li>
                <li>{t("frontendBackendDbRatio")}</li>
                <li>{t("ishlatilayotganTexnologiyalar")}</li>
                <li>{t("runtimedaNimalarBoladi")}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="frontend-backend">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--ep-blue)]" />
              <span>{t("k12FrontendBackendMosligi")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-6 space-y-3 text-sm">
              <p className="text-muted-foreground">{t("butunTizimBoyichaAniqla")}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="p-2 bg-red-500/10 rounded border border-red-500/30">
                  <p className="font-medium text-[var(--ep-red)]">{t("frontendBorBackendYoq")}</p>
                  <p className="text-xs text-muted-foreground">{t("k404DeadButton")}</p>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                  <p className="font-medium text-[var(--ep-yellow)]">{t("backendBorFrontendUlanmagan")}</p>
                  <p className="text-xs text-muted-foreground">{t("ishlatilmayotganApi")}</p>
                </div>
                <div className="p-2 bg-orange-500/10 rounded border border-orange-500/30">
                  <p className="font-medium text-[var(--ep-primary)]">{t("ikkalaTomondaBor")}</p>
                  <p className="text-xs text-muted-foreground">{t("contractMosEmas")}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-medium mb-1">{t("statusTurlari")}</p>
                <div className="flex flex-wrap gap-2">
                  <EPStatusPill tone="danger">{t("confirmedIssue")}</EPStatusPill>
                  <EPStatusPill tone="neutral">{t("expectedState")}</EPStatusPill>
                  <Badge variant="outline">{t("needsClarification")}</Badge>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ui-audit">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[var(--ep-blue)]" />
              <span>{t("k13UiButtonsAudit")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-6 space-y-2 text-sm text-muted-foreground">
              <p>{t("tekshiriladiganTugmalar")}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline">{t("Yaratish")}</Badge>
                <Badge variant="outline">{t("add")}</Badge>
                <Badge variant="outline">{t("Saqlash")}</Badge>
                <Badge variant="outline">{t("edit")}</Badge>
                <Badge variant="outline">{t("delete")}</Badge>
                <Badge variant="outline">{t("settings")}</Badge>
                <Badge variant="outline">{t("status28")}</Badge>
                <Badge variant="outline">{t("onclickHandlerlar")}</Badge>
              </div>
              <p className="mt-2">{t("aniqla")}</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{t("bosilgandaNetworkKetadimi")}</li>
                <li>{t("realDataYoziladimi")}</li>
                <li>{t("faqatUiHarakatimi")}</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="business-process">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--ep-blue)]" />
              <span>{t("k14BusinessProcessAnalysis")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pl-6 space-y-3 text-sm">
              <p className="text-muted-foreground font-medium">{t("modulEmasJarayonAsosidaTekshir")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="p-2 border rounded flex items-center gap-2">
                  <span className="text-[var(--ep-green)]">→</span>
                  <span>{t("sotuvInvoiceTolov")}</span>
                </div>
                <div className="p-2 border rounded flex items-center gap-2">
                  <span className="text-[var(--ep-green)]">→</span>
                  <span>{t("xaridQabulQarzdorlik")}</span>
                </div>
                <div className="p-2 border rounded flex items-center gap-2">
                  <span className="text-[var(--ep-green)]">→</span>
                  <span>{t("ishlabChiqarishMaterialSarfiOmbor")}</span>
                </div>
                <div className="p-2 border rounded flex items-center gap-2">
                  <span className="text-[var(--ep-green)]">→</span>
                  <span>{t("xarajatTasdiqlashMoliyagaTushish")}</span>
                </div>
              </div>
              <div className="mt-2 p-2 bg-muted rounded">
                <p className="font-medium">{t("aniqla")}</p>
                <ul className="list-disc pl-4">
                  <li>{t("qayerdaZanjirUzilgan")}</li>
                  <li>{t("qayerdaChetlabOtishMumkin")}</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
