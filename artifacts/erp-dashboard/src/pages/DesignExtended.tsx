import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";
import {
  BrainCircuit, Boxes, BookMarked, Scale, Layers,
  Hammer, Calculator, Library, CheckCircle2, XCircle, Package, Palette
} from "lucide-react";

interface DesignOrder {
  id: number;
  status?: string;
  title?: string;
  client?: string;
  papkaNo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DesignTool {
  id: string;
  equipmentName: string;
  equipmentCode?: string;
  maintenanceType: string;
  status?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  location?: string;
}

interface DesignTemplate {
  id: string;
  templateNumber?: string;
  name: string;
  description?: string;
  brandName?: string;
  category?: string;
  usageCount?: number;
}

const routeTabMap: Record<string, string> = {
  "/design/ai-review": "ai",
  "/design/3d-mockup": "3d",
  "/design/brand-guidelines": "brand",
  "/design/comparison": "compare",
  "/design/templates": "templates",
  "/design/tools": "tools",
  "/design/costing": "costing",
  "/design/library": "library",
};

const tabMeta: Record<string, { title: string; icon: typeof BrainCircuit; description: string }> = {
  ai:        { title: "AI Tekshiruv",   icon: BrainCircuit, description: "Dizaynlarni AI yordamida avtomatik tekshirish" },
  "3d":      { title: "3D Mockup",      icon: Boxes,        description: "Quti va qadoqni 3D vizualizatsiya qilish" },
  brand:     { title: "Brend",          icon: BookMarked,   description: "Korporativ brend qoidalari va ranglar" },
  compare:   { title: "Taqqoslash",     icon: Scale,        description: "Dizayn variantlarini yonma-yon solishtirish" },
  templates: { title: "Qoliplar",       icon: Layers,       description: "Tayyor qoliplar va standart o'lchamlar" },
  tools:     { title: "Asboblar",       icon: Hammer,       description: "Bosma asboblar va plastinalar inventari" },
  costing:   { title: "Tannarx",        icon: Calculator,   description: "Dizayn xarajat kalkulyatori" },
  library:   { title: "Kutubxona",      icon: Library,      description: "Dizayn asset va fayllar kutubxonasi" },
};

const brandColors = [
  { name: "Asosiy rang", hex: "#1a4a8a", usage: "Logo, sarlavhalar, tugmalar" },
  { name: "Qo'shimcha", hex: "#f97316", usage: "Accent, highlight elementlar" },
  { name: "Fon", hex: "#f8fafc", usage: "Sahifa foni" },
  { name: "Matn", hex: "#0f172a", usage: "Asosiy matn" },
  { name: "Ikkilamchi matn", hex: "#64748b", usage: "Qo'shimcha matn" },
];

export default function DesignExtended() {
  const [location, setLocation] = useLocation();
  const defaultTab = routeTabMap[location] || "ai";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = routeTabMap[location];
    if (tab) setActiveTab(tab);
  }, [location]);

  const { data: designOrders = [] } = useQuery<DesignOrder[]>({ queryKey: ["/api/design/orders"] });
  const { data: toolsData = [] } = useQuery<DesignTool[]>({
    queryKey: ["/api/integration/mro/equipment"]
  });
  const { data: templatesData = [] } = useQuery<DesignTemplate[]>({
    queryKey: ["/api/design/templates"]
  });
  const pendingReview = (Array.isArray(designOrders) ? designOrders : []).filter((o: DesignOrder) => ["submitted", "in_review"].includes(o.status ?? ""));

  const costData = [
    { component: "Disayner ish haqi", hours: 4, rate: 50000, total: 200000 },
    { component: "Plita bosish", quantity: 4, unit: "dona", rate: 120000, total: 480000 },
    { component: "Material sarfi", quantity: 2, unit: "m²", rate: 15000, total: 30000 },
    { component: "Korrektura", quantity: 1, unit: "marta", rate: 50000, total: 50000 },
  ];
  const totalCost = (costData ?? []).reduce((s, c) => s + c.total, 0);

  const meta = tabMeta[activeTab] || tabMeta.ai;

  return (
    <div className="p-6 space-y-6">
      <ModuleSectionHeader
        moduleName="Dizayn"
        moduleColor="text-pink-600"
        sectionTitle={meta.title}
        sectionDescription={meta.description}
        icon={meta.icon}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="ai" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Tekshiruv kutilayotgan</p>
              <p className="text-2xl font-bold">{pendingReview.length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Bugun tasdiqlangan</p>
              <p className="text-2xl font-bold text-green-600">0</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Rad etilgan</p>
              <p className="text-2xl font-bold text-red-500">0</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">AI tekshiruv navbati</CardTitle></CardHeader>
            <CardContent>
              {pendingReview.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Barcha dizaynlar tekshirilgan</p>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>AI natija</TableHead>
                    <TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(pendingReview) ? pendingReview : []).map((o: DesignOrder) => (
                      <TableRow key={o.id}>
                        <TableCell>{o.title || o.papkaNo}</TableCell>
                        <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                        <TableCell><Badge variant="outline">Kutilmoqda</Badge></TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => setLocation(`/design/orders/${o.id}`)}>Tekshirish</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3d" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="w-5 h-5" />3D Quti Vizualizatsiya</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-64 gap-4 text-muted-foreground">
                <Package className="w-16 h-16 opacity-30" />
                <p className="text-sm">3D render uchun dizayn faylini yuklang</p>
                <Button variant="outline">Fayl yuklash (AI/PDF/DXF)</Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-md border">
                  <p className="font-medium mb-1">Standart o'lchamlar</p>
                  <p className="text-muted-foreground">F201: 300×200×150 mm</p>
                  <p className="text-muted-foreground">F302: 150×100×100 mm</p>
                </div>
                <div className="p-3 rounded-md border">
                  <p className="font-medium mb-1">So'nggi mockuplar</p>
                  <p className="text-muted-foreground text-sm italic">Hali mockup yaratilmagan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4 mt-0">
          <Card>
            <CardHeader><CardTitle className="text-base">Korporativ ranglar</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {(Array.isArray(brandColors) ? brandColors : []).map((c, i) => (
                  <div key={`k-${i}`} className="flex items-center gap-3 p-3 rounded-md border">
                    <div className="w-10 h-10 rounded-md border shrink-0" style={{ backgroundColor: c.hex }} />
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.hex}</p>
                      <p className="text-xs text-muted-foreground">{c.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Shriftlar</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 rounded-md border"><p className="text-xl font-bold">Inter Bold</p><p className="text-xs text-muted-foreground">Sarlavhalar uchun</p></div>
                <div className="p-3 rounded-md border"><p className="text-base">Inter Regular</p><p className="text-xs text-muted-foreground">Asosiy matn uchun</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Logo qoidalari</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(["Logoni kichraytirmang 32px dan past", "Fon bilan kontrast saqlang", "Logoni cho'zmang", "Rangli versiyadan foydalaning"]).map((rule, i) => (
                    <div key={`k-${i}`} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /><span>{rule}</span></div>
                  ))}
                  {(["To'q fonda oq versiyani ishlating", "Logoni aylantirmang"]).map((rule, i) => (
                    <div key={`k-${i}`} className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500 shrink-0" /><span className="text-muted-foreground">{rule}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compare" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" />Variantlarni solishtirish</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(["A varianti", "B varianti"]).map((v, i) => (
                  <div key={`k-${i}`} className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-48 gap-3 text-muted-foreground">
                    <Palette className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">{v}</p>
                    <Button variant="outline" size="sm">Yuklash</Button>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">Ikkala dizaynni yuklab, yonma-yon solishtirishingiz mumkin</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-base">Tayyor qoliplar</CardTitle></CardHeader>
            <CardContent>
              {templatesData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Shablonlar mavjud emas
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Shablon raqami</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Toifa</TableHead>
                    <TableHead>Brend</TableHead>
                    <TableHead className="text-right">Ishlatilgan</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(templatesData) ? templatesData : []).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">{t.templateNumber || "—"}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.category ? <Badge variant="outline">{t.category}</Badge> : "—"}</TableCell>
                        <TableCell className="text-sm">{t.brandName || "—"}</TableCell>
                        <TableCell className="text-right text-sm">{t.usageCount ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-base">Bosma asboblar inventari</CardTitle></CardHeader>
            <CardContent>
              {toolsData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Uskunalar ro'yxati bo'sh
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Asbob nomi</TableHead>
                    <TableHead>Tur</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>So'nggi TO</TableHead>
                    <TableHead>Keyingi TO</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(Array.isArray(toolsData) ? toolsData : []).map((t) => {
                      const statusMap: Record<string, string> = {
                        "scheduled": "Rejalashtirilgan",
                        "in_progress": "Jarayonda",
                        "completed": "Bajarilgan",
                        "overdue": "Kechikkan",
                        "cancelled": "Bekor qilingan",
                      };
                      const statusLabel = t.status ? (statusMap[t.status] || t.status) : "—";
                      const isOverdue = t.status === "overdue";

                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.equipmentName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{t.maintenanceType}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === "completed" ? "default" : t.status === "overdue" ? "destructive" : "secondary"}>{statusLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{t.lastMaintenanceDate || "—"}</TableCell>
                          <TableCell className="text-sm">
                            <span className={isOverdue ? "text-red-500" : ""}>{t.nextMaintenanceDate || "—"}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costing" className="space-y-4 mt-0">
          <Card>
            <CardHeader><CardTitle className="text-base">Dizayn xarajat kalkulyatori</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Komponent</TableHead>
                  <TableHead className="text-right">Birlik narxi</TableHead>
                  <TableHead className="text-right">Jami</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(Array.isArray(costData) ? costData : []).map((c, i) => (
                    <TableRow key={`k-${i}`}>
                      <TableCell>{c.component}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">{c.rate.toLocaleString()} so'm</TableCell>
                      <TableCell className="text-right font-medium">{c.total.toLocaleString()} so'm</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={2} className="font-bold">Jami dizayn tannarxi</TableCell>
                    <TableCell className="text-right font-bold text-primary">{totalCost.toLocaleString()} so'm</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">* Narxlar taxminiy. Haqiqiy narx buyurtma xususiyatlariga qarab farq qiladi.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-base">Dizayn asset kutubxonasi</CardTitle>
                <Button size="sm" variant="outline">Yangi asset qo'shish</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Brend kutubxonasi fayllari mavjud emas. Administrator tomonidan qo'shilishi kerak.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
