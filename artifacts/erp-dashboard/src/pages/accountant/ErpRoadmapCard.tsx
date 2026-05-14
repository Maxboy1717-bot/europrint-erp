/**
 * @module ErpRoadmapCard
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from '@/lib/i18n';
import {
  Target,
  Search,
  Wrench,
  Shield,
  FileCheck,
  AlertCircle,
  BookOpen,
  Layers,
  Database,
  Settings,
  Users,
  Lock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  DollarSign,
} from "lucide-react";
import { EPStatusPill } from "@/components/ep";

export function ErpRoadmapCard() {
  const { t } = useTranslation('common');
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
            <div className="flex items-center gap-2 mb-4">
              <EPStatusPill tone="info">1-BOSQICH</EPStatusPill>
              <h3 className="text-lg font-bold">TO'LIQ TIZIM TAHLILI (O'zgartirish yo'q)</h3>
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
                      <li>Umumiy LOC (Lines of Code)</li>
                      <li>{t("fayllarSoni")}</li>
                      <li>Frontend / Backend / DB nisbatlari</li>
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
                        <p className="text-xs text-muted-foreground">{t('k404DeadButton')}</p>
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
                      <p className="font-medium mb-1">{t('statusTurlari')}</p>
                      <div className="flex flex-wrap gap-2">
                        <EPStatusPill tone="danger">TASDIQLANGAN MUAMMO</EPStatusPill>
                        <EPStatusPill tone="neutral">KUTILGAN HOLAT</EPStatusPill>
                        <Badge variant="outline">ANIQLASHTIRISH KERAK</Badge>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ui-audit">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[var(--ep-blue)]" />
                    <span>1.3 UI va tugmalar auditi</span>
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
                    <span>1.4 Biznes jarayonlar bo'yicha tahlil (MUHIM)</span>
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
          </TabsContent>

          <TabsContent value="phase2" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-orange-500">2-BOSQICH</Badge>
              <h3 className="text-lg font-bold">{t("muammolarRoyxatiVaFixPlan")}</h3>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-3">{t("faqatConfirmedIssueUchunHar")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg bg-background">
                    <p className="font-bold text-primary mb-2">{t("issueId")}</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{t("biznesJarayon")}</p>
                      <p>{t("muammoTavsifi")}</p>
                      <p>{t("tasiri")}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg bg-background">
                    <p className="font-bold text-primary mb-2">VAZIFA + YECHIM</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Nima qilish kerak (aniq)</p>
                      <p>• Qaysi qatlamda (UI/API/DB/AUTH)</p>
                      <p>{t("qandayYondashuvBilan")}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-medium mb-2">USTUVORLIK:</p>
                <div className="flex flex-wrap gap-2">
                  <EPStatusPill tone="danger">{t("kritik")}</EPStatusPill>
                  <Badge className="bg-orange-500">{t("high")}</Badge>
                  <EPStatusPill tone="warning">{t("medium")}</EPStatusPill>
                  <EPStatusPill tone="neutral">{t("low")}</EPStatusPill>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phase3" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <EPStatusPill tone="success">3-BOSQICH</EPStatusPill>
              <h3 className="text-lg font-bold">KODLAB TUZATISH (IMPLEMENTATION)</h3>
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
                    <span>Kim / qachon / nimadan nimaga</span>
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
                    <span>Oy/yil yopilishi</span>
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
          </TabsContent>

          <TabsContent value="phase4" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-purple-500">4-BOSQICH</Badge>
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
                  <p className="text-sm text-muted-foreground">
                    Hisoblash usuli (minimal darajada)
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-[var(--ep-purple)]" />
                    <span className="font-medium">{t("kopValyuta")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("uzsUsdEurQollabQuvvatlash")}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-[var(--ep-purple)]" />
                    <span className="font-medium">{t("auditorRejimi")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("faqatOqishRejimiBarchaLoglar")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phase5" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <EPStatusPill tone="success">5-BOSQICH</EPStatusPill>
              <h3 className="text-lg font-bold">YAKUNIY HISOBOT</h3>
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
                      <span className="font-medium">UZ moslashuv</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-[var(--ep-blue)]" />
                      <span className="font-medium">{t('kpiNatijalari')}</span>
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
                      <span>{t('k100AuditQamrovi')}</span>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}