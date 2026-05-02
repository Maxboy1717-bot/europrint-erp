import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

export function ErpRoadmapCard() {
  return (
    <Card className="border-emerald-500/30" data-testid="erp-roadmap-section">
      <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/20">
        <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Target className="h-6 w-6" />
          EUROPRINT ERP — SAP LIGHT → SAP NEAR (UZ BOZORI)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          To'liq tahlil, tuzatish va rivojlantirish yo'l xaritasi
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5" />
            UMUMIY QOIDALAR (BUZILMAYDI)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Avval TAHLIL, keyin O'ZGARTIRISH</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Tahlilsiz hech qachon kod yozma</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Har bir muammo dalil bilan tasdiqlansin</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Har bir o'zgarish biznes jarayonga bog'langan bo'lsin</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>Audit trail bilan yozilsin</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span>O'zbekiston qonunchiligi inobatga olinsin</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="phase1" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="phase1" className="text-xs md:text-sm" data-testid="tab-phase1">
              <Search className="h-4 w-4 mr-1 hidden md:inline" />
              1-Bosqich
            </TabsTrigger>
            <TabsTrigger value="phase2" className="text-xs md:text-sm" data-testid="tab-phase2">
              <FileCheck className="h-4 w-4 mr-1 hidden md:inline" />
              2-Bosqich
            </TabsTrigger>
            <TabsTrigger value="phase3" className="text-xs md:text-sm" data-testid="tab-phase3">
              <Wrench className="h-4 w-4 mr-1 hidden md:inline" />
              3-Bosqich
            </TabsTrigger>
            <TabsTrigger value="phase4" className="text-xs md:text-sm" data-testid="tab-phase4">
              <Shield className="h-4 w-4 mr-1 hidden md:inline" />
              4-Bosqich
            </TabsTrigger>
            <TabsTrigger value="phase5" className="text-xs md:text-sm" data-testid="tab-phase5">
              <BookOpen className="h-4 w-4 mr-1 hidden md:inline" />
              5-Bosqich
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phase1" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-500">1-BOSQICH</Badge>
              <h3 className="text-lg font-bold">TO'LIQ TIZIM TAHLILI (O'zgartirish yo'q)</h3>
            </div>
            
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="passport">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    <span>1.1 Tizim pasporti</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 space-y-2 text-sm text-muted-foreground">
                    <p>Aniq chiqar:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Umumiy LOC (Lines of Code)</li>
                      <li>Fayllar soni</li>
                      <li>Frontend / Backend / DB nisbatlari</li>
                      <li>Ishlatilayotgan texnologiyalar</li>
                      <li>Runtime'da nimalar bo'ladi</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="frontend-backend">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span>1.2 Frontend ↔ Backend mosligi</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 space-y-3 text-sm">
                    <p className="text-muted-foreground">Butun tizim bo'yicha aniqla:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="p-2 bg-red-500/10 rounded border border-red-500/30">
                        <p className="font-medium text-red-600">Frontend bor → Backend yo'q</p>
                        <p className="text-xs text-muted-foreground">404, dead button</p>
                      </div>
                      <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                        <p className="font-medium text-yellow-600">Backend bor → Frontend ulanmagan</p>
                        <p className="text-xs text-muted-foreground">Ishlatilmayotgan API</p>
                      </div>
                      <div className="p-2 bg-orange-500/10 rounded border border-orange-500/30">
                        <p className="font-medium text-orange-600">Ikkala tomonda bor</p>
                        <p className="text-xs text-muted-foreground">Contract mos emas</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium mb-1">Status turlari:</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="destructive">CONFIRMED ISSUE</Badge>
                        <Badge variant="secondary">EXPECTED BEHAVIOR</Badge>
                        <Badge variant="outline">NEEDS CLARIFICATION</Badge>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ui-audit">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-500" />
                    <span>1.3 UI va tugmalar auditi</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 space-y-2 text-sm text-muted-foreground">
                    <p>Tekshiriladigan tugmalar:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">Create</Badge>
                      <Badge variant="outline">Add</Badge>
                      <Badge variant="outline">Save</Badge>
                      <Badge variant="outline">Edit</Badge>
                      <Badge variant="outline">Delete</Badge>
                      <Badge variant="outline">Settings</Badge>
                      <Badge variant="outline">Status</Badge>
                      <Badge variant="outline">onClick handlers</Badge>
                    </div>
                    <p className="mt-2">Aniqla:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Bosilganda network ketadimi</li>
                      <li>Real data yoziladimi</li>
                      <li>Faqat UI harakatimi</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="business-process">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>1.4 Biznes jarayonlar bo'yicha tahlil (MUHIM)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-6 space-y-3 text-sm">
                    <p className="text-muted-foreground font-medium">Modul emas, jarayon asosida tekshir:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="p-2 border rounded flex items-center gap-2">
                        <span className="text-emerald-500">→</span>
                        <span>Sotuv → Invoice → To'lov</span>
                      </div>
                      <div className="p-2 border rounded flex items-center gap-2">
                        <span className="text-emerald-500">→</span>
                        <span>Xarid → Qabul → Qarzdorlik</span>
                      </div>
                      <div className="p-2 border rounded flex items-center gap-2">
                        <span className="text-emerald-500">→</span>
                        <span>Ishlab chiqarish → Material sarfi → Ombor</span>
                      </div>
                      <div className="p-2 border rounded flex items-center gap-2">
                        <span className="text-emerald-500">→</span>
                        <span>Xarajat → Tasdiqlash → Moliyaga tushish</span>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-muted rounded">
                      <p className="font-medium">Aniqla:</p>
                      <ul className="list-disc pl-4">
                        <li>Qayerda zanjir uzilgan</li>
                        <li>Qayerda chetlab o'tish mumkin</li>
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
              <h3 className="text-lg font-bold">MUAMMOLAR RO'YXATI VA FIX-PLAN</h3>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-3">Faqat CONFIRMED ISSUE uchun har bir muammo bo'yicha yoz:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg bg-background">
                    <p className="font-bold text-primary mb-2">Issue ID</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Business process</p>
                      <p>• Problem description</p>
                      <p>• Impact</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg bg-background">
                    <p className="font-bold text-primary mb-2">TASK + SOLUTION</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Nima qilish kerak (aniq)</p>
                      <p>• Qaysi qatlamda (UI/API/DB/AUTH)</p>
                      <p>• Qanday yondashuv bilan</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-medium mb-2">PRIORITY:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <Badge className="bg-orange-500">High</Badge>
                  <Badge className="bg-yellow-500 text-on-surface">Medium</Badge>
                  <Badge variant="secondary">Low</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phase3" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-emerald-500">3-BOSQICH</Badge>
              <h3 className="text-lg font-bold">KODLAB TUZATISH (IMPLEMENTATION)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-emerald-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    3.1 Qat'iy biznes qoidalar
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Ombor manfiy bo'lsa → sotuv bloklansin</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Hujjatsiz to'lov bo'lmasin</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Ishlab chiqarishsiz material chiqmasin</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <span>Budgetdan chiqsa → xarajat o'tmasin</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    3.2 Audit trail (immutable)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Har bir muhim obyekt uchun</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Delete yo'q → faqat reversal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <span>Kim / qachon / nimadan nimaga</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    3.3 Period close
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span>Oy/yil yopilishi</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span>Yopilgan davrga yozib bo'lmasin</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span>Override — faqat maxsus rol bilan</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-500" />
                    3.4 SSOT (Single Source of Truth)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Mahsulot</Badge>
                    <Badge variant="outline">Birlik</Badge>
                    <Badge variant="outline">Narx</Badge>
                    <Badge variant="outline">Mijoz</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Faqat 1 joyda yaratiladi, boshqa joylar referens.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-red-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  3.6 ERP Validator (ichki nazorat)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="mb-2">Avtomatik aniqlansin:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2 bg-red-500/10 rounded">To'lov bor → invoice yo'q</div>
                  <div className="p-2 bg-red-500/10 rounded">Ishlab chiqarish bor → tannarx yo'q</div>
                  <div className="p-2 bg-red-500/10 rounded">Ombor harakati mantiqsiz</div>
                </div>
                <p className="text-muted-foreground mt-2">Alert va log bilan.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase4" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-purple-500">4-BOSQICH</Badge>
              <h3 className="text-lg font-bold">O'ZBEKISTON UCHUN SAP NEAR MOSLASHUV</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Approval Matrix</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tasdiqlash matritsasi - kim nimani tasdiqlashi mumkin
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Accrual Accounting</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hisoblash usuli (minimal darajada)
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Multi-currency</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    UZS + USD + EUR qo'llab-quvvatlash
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Auditor Mode</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Faqat o'qish rejimi, barcha loglar
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phase5" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-emerald-600">5-BOSQICH</Badge>
              <h3 className="text-lg font-bold">YAKUNIY HISOBOT</h3>
            </div>
            
            <Card className="bg-emerald-500/5 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-emerald-600 dark:text-emerald-400">
                  ERP HISOBOTI AUDIT — SAP LIGHT → SAP NEAR (UZ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Tizim pasporti</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Topilgan muammolar</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Tuzatilgan muammolar</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">UZ moslashuv</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">KPI natijalari</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Keyingi qadamlar</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    MAQSAD: SAP NEAR — O'zbekiston bozorining eng ishonchli ERP tizimi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span>100% audit qamrovi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span>Soliq kodeksiga moslik</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span>Biznes jarayonlar uzluksiz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span>O'zbekiston bozorida eng kuchli lokal ERP</span>
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