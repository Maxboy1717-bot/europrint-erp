import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, safeArray, selectArray } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import {
  Shield, HardHat, AlertTriangle, MapPin, Users, Star,
  Plus, UserCheck, RefreshCw, Siren, CheckCircle,
  type LucideIcon
} from "lucide-react";
import { ModuleSectionHeader } from "@/components/ModuleSectionHeader";

interface SecurityVisitor {
    id: number | string;
    name?: string;
    company?: string;
    purpose?: string;
    host?: string;
    hostEmployee?: string;
    entryTime?: string;
    exitTime?: string;
    status?: string;
    createdAt?: string;
  }
  interface AttendanceRecord {
    id: number | string;
    userId?: number | string;
    employeeName?: string;
    checkIn?: string;
    checkOut?: string;
    isLate?: boolean;
    status?: string;
  }

interface PPEStats { todayCount?: number; total?: number; last7Days?: number; topViolationType?: { type?: string } }
interface PPEViolationsResponse { violations?: Record<string, unknown>[] }

function PPEMonitoring() {
  const { data: statsData, isLoading: statsLoading } = useQuery<PPEStats>({
    queryKey: ["/api/security/ppe-stats"],
  });

  const { data: violationsData, isLoading: violationsLoading, refetch } = useQuery<PPEViolationsResponse>({
    queryKey: ["/api/security/ppe-violations"],
  });

  const violations = safeArray<Record<string, unknown>>(violationsData?.violations);

  const PPE_ZONES = [
    { zone: "Bosma sexi", required: ["Kask", "Ko'zoynaklar", "Quloqchin"], compliance: null },
    { zone: "Kimyo laboratoriya", required: ["Rezina qo'lqop", "Ko'zoynaklar", "Maska"], compliance: null },
    { zone: "Xom ashyo ombori", required: ["Kask", "Xavfsizlik botinkalar"], compliance: null },
    { zone: "Elektr xona", required: ["Izolyatsion qo'lqop", "Ko'zoynaklar"], compliance: null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">PPE (Shaxsiy Himoya Vositalari) Nazorati</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-ppe">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Yangilash
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {([
          { l: "Bugungi buzilish", v: statsLoading ? "..." : statsData?.todayCount ?? 0, c: (statsData?.todayCount ?? 0) > 0 ? "text-red-600" : "text-green-600" },
          { l: "Jami qayd etilgan", v: statsLoading ? "..." : statsData?.total ?? 0, c: "text-orange-600" },
          { l: "Oxirgi 7 kun", v: statsLoading ? "..." : statsData?.last7Days ?? 0, c: "text-yellow-600" },
          { l: "Eng ko'p buzilish", v: statsLoading ? "..." : (statsData?.topViolationType?.type === "no_helmet" ? "Shlem" : statsData?.topViolationType?.type === "no_vest" ? "Yelek" : statsData?.topViolationType?.type || "—"), c: "text-blue-600" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Zo'nalar bo'yicha PPE muvofiqlik</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(PPE_ZONES) ? PPE_ZONES : []).map((z, i) => (
              <div key={`k-${i}`} className="p-3 rounded-md bg-muted/50 space-y-2" data-testid={`row-ppe-${i}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{z.zone}</span>
                  {z.compliance !== null ? (
                    <Badge variant={z.compliance >= 95 ? "default" : z.compliance >= 80 ? "secondary" : "destructive"}>{z.compliance}%</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-on-surface-variant">Ma'lumot yo'q</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(z.required) ? z.required : []).map(r => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                </div>
                {z.compliance !== null && (
                  <div className="h-1.5 bg-muted rounded">
                    <div className={`h-1.5 rounded ${z.compliance >= 95 ? "bg-green-500" : z.compliance >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${z.compliance}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {violations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Kamera tomonidan aniqlangan PPE buzilishlari
          </CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vaqt</TableHead><TableHead>Kamera</TableHead>
                <TableHead>Xodim</TableHead><TableHead>Muammo</TableHead><TableHead>Ishonch</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(violations) ? violations : []).slice(0, 10).map((v: { id: number | string; timestamp?: string; cameraName?: string; cameraId?: string | number; employeeName?: string; label?: string; confidence?: number }) => (
                  <TableRow key={v.id} data-testid={`row-ppe-violation-${v.id}`}>
                    <TableCell className="text-xs">{v.timestamp ? new Date(v.timestamp).toLocaleString("uz-UZ") : "—"}</TableCell>
                    <TableCell className="text-sm">{v.cameraName || v.cameraId}</TableCell>
                    <TableCell className="text-sm">{v.employeeName || "—"}</TableCell>
                    <TableCell><Badge variant="destructive" className="text-xs">{v.label}</Badge></TableCell>
                    <TableCell className="text-sm">{Math.round((v.confidence || 0) * 100)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {violations.length === 0 && !violationsLoading && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>Hozircha kamera tomonidan PPE buzilishi aniqlanmagan</p>
            <p className="text-xs mt-1">Kamera AI tomonidan buzilishlar aniqlanganda bu yerda ko'rinadi</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const URL_TAB_MAP: Record<string, string> = {
  "/security/attendance": "attendance",
  "/security/zone-access": "zones",
  "/security/ppe": "ppe",
  "/security/hazmat": "hazmat",
  "/security/evacuation": "evacuation",
  "/security/visitors": "visitors",
  "/security/rating": "rating",
};

const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "zones": { title: "Kirish Nazorati", icon: MapPin },
  "visitors": { title: "Mehmonlar", icon: Users },
  "attendance": { title: "Davomat", icon: UserCheck },
  "ppe": { title: "PPE Nazorati", icon: HardHat },
  "hazmat": { title: "Xavfli Moddalar", icon: AlertTriangle },
  "evacuation": { title: "Evakuatsiya", icon: Siren },
  "rating": { title: "Xavfsizlik Reytingi", icon: Star },
};

export default function SecurityExtended() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState(URL_TAB_MAP[location] || "zones");

  useEffect(() => {
    const tab = URL_TAB_MAP[location];
    if (tab) setActiveTab(tab);
  }, [location]);
    const meta = tabMeta[activeTab] || tabMeta["zones"];

  const { toast } = useToast();
  const [showVisitorDialog, setShowVisitorDialog] = useState(false);

  const visitorForm = useForm({
    defaultValues: { name: "", company: "", host: "", purpose: "", phone: "" }
  });

  const { data: visitors = [], isLoading: visitorsLoading, refetch: refetchVisitors } = useQuery<SecurityVisitor[]>({
    queryKey: ["/api/security/visitors"],
    select: selectArray<SecurityVisitor>,
  });

  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/security/attendance-records"],
    select: selectArray<AttendanceRecord>,
  });

  const { data: dailySummary } = useQuery<{ present?: number; totalEntries?: number; denied?: number; mainEntries?: number; prodEntries?: number; storageEntries?: number; serverEntries?: number; labEntries?: number; officeEntries?: number; late?: number; absent?: number; onLeave?: number }>({
    queryKey: ["/api/security/daily-summary"]
  });

  const { data: violationsData } = useQuery<{ violations?: Record<string, unknown>[] }>({
    queryKey: ["/api/security/ppe-violations"]
  });
  const violations = safeArray<Record<string, unknown>>(violationsData?.violations);

  const registerVisitor = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/security/visitors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/visitors"] });
      setShowVisitorDialog(false);
      visitorForm.reset();
      toast({ title: "Mehmon ro'yxatdan o'tkazildi" });
    },
  });

  const activeVisitors = (Array.isArray(visitors) ? visitors : []).filter((v: SecurityVisitor) => !v.exitTime);
  const presentToday = Array.isArray(attendanceRecords)
    ? (Array.isArray(attendanceRecords) ? attendanceRecords : []).filter((r: AttendanceRecord) => r.status === "present").length
    : (dailySummary?.present ?? 0);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="border-b border-outline-variant px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Security <span className="font-bold text-primary">Kengaytirilgan</span>
          </h1>
          {activeVisitors.length > 0 && (
            <Badge className="ml-2 bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">
              {activeVisitors.length} mehmon ichkarida
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-outline-variant px-4 bg-surface-container-low">
          <TabsList className="bg-transparent h-12 gap-4">
            {Object.entries(tabMeta).map(([key, meta]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4 text-on-surface-variant font-medium transition-all"
              >
                <meta.icon className="h-4 w-4 mr-2" />
                {meta.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-surface">
          {/* Zone Access */}
          <TabsContent value="zones" className="mt-0 space-y-6 outline-none">
            <h2 className="text-xl font-bold text-on-surface">Kirish Zonalari Nazorati</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { l: "Bugun kirganlar", v: dailySummary?.totalEntries ?? attendanceRecords.length, c: "text-primary" },
                { l: "Hozir ichkarida", v: presentToday, c: "text-green-600" },
                { l: "Mehmonlar", v: activeVisitors.length, c: "text-amber-600" },
                { l: "Rad etilgan kirish", v: dailySummary?.denied ?? 0, c: "text-error" },
              ]).map(s => (
                <div key={s.l} className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.l}</p>
                  <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                { zone: "Asosiy kirish", level: "Hammaga", entries: dailySummary?.mainEntries ?? 152, status: "Faol", color: "text-green-600" },
                { zone: "Ishlab chiqarish sexi", level: "Ruxsatnomali", entries: dailySummary?.prodEntries ?? 45, status: "Faol", color: "text-green-600" },
                { zone: "Xom ashyo ombori", level: "Ombor xodimlari", entries: dailySummary?.storageEntries ?? 12, status: "Faol", color: "text-green-600" },
                { zone: "Server xona", level: "IT xodimlar", entries: dailySummary?.serverEntries ?? 3, status: "Faol", color: "text-green-600" },
                { zone: "Kimyo laboratoriya", level: "QC mutaxassislar", entries: dailySummary?.labEntries ?? 8, status: "Faol", color: "text-green-600" },
                { zone: "Menejerlar ofisi", level: "Ruxsat ro'yxati", entries: dailySummary?.officeEntries ?? 28, status: "Faol", color: "text-green-600" },
              ]).map((z, i) => (
                <Card key={`k-${i}`} data-testid={`card-zone-${i}`} className="bg-surface-container-lowest border-outline-variant shadow-none">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-on-surface">{z.zone}</div>
                      <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none">{z.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Ruxsat darajasi: {z.level}</span>
                      <span className={`font-bold ${z.color}`}>{z.entries} ta</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Visitors */}
          <TabsContent value="visitors" className="mt-0 space-y-6 outline-none">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Mehmonlar Jurnali</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchVisitors()} className="bg-surface-container text-on-surface hover:bg-surface-container-high border-none rounded-lg px-4 font-medium">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setShowVisitorDialog(true)} 
                  data-testid="button-add-visitor"
                  className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Mehmon Ro'yxatdan O'tkazish
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { l: "Bugun jami", v: visitors.length, c: "text-primary" },
                { l: "Hozir ichkarida", v: activeVisitors.length, c: "text-green-600" },
                { l: "Chiqib ketgan", v: visitors.length - activeVisitors.length, c: "text-on-surface-variant" },
              ]).map(s => (
                <div key={s.l} className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.l}</p>
                  <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-surface-container-lowest border-outline-variant shadow-none">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Ism</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tashkilot</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mezbon</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Maqsad</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kelish</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorsLoading ? (
                      <TableRow className="border-none hover:bg-transparent"><TableCell colSpan={6} className="text-center py-6 text-on-surface-variant">Yuklanmoqda...</TableCell></TableRow>
                    ) : visitors.length === 0 ? (
                      <TableRow className="border-none hover:bg-transparent"><TableCell colSpan={6} className="text-center py-8 text-on-surface-variant">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        Bugun mehmon yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(visitors) ? visitors : []).slice(0, 15).map((v: SecurityVisitor) => (
                      <TableRow key={v.id} data-testid={`row-visitor-${v.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                        <TableCell className="font-medium px-6 text-on-surface">{v.name}</TableCell>
                        <TableCell className="text-sm px-6 text-on-surface">{v.company || "—"}</TableCell>
                        <TableCell className="text-sm px-6 text-on-surface">{v.host || "—"}</TableCell>
                        <TableCell className="text-sm px-6 text-on-surface max-w-[150px] truncate">{v.purpose || "—"}</TableCell>
                        <TableCell className="text-xs px-6 text-on-surface-variant">
                          {v.entryTime ? new Date(v.entryTime).toLocaleTimeString("uz-UZ") : v.createdAt ? new Date(v.createdAt).toLocaleTimeString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="px-6">
                          <Badge className={v.exitTime ? "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                            {v.exitTime ? "Chiqdi" : "Ichkarida"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Dialog open={showVisitorDialog} onOpenChange={setShowVisitorDialog}>
              <DialogContent className="bg-surface-container-lowest border-outline-variant">
                <DialogHeader><DialogTitle className="text-on-surface">Mehmon Ro'yxatdan O'tkazish</DialogTitle></DialogHeader>
                <form onSubmit={visitorForm.handleSubmit(d => registerVisitor.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-on-surface">Ism Familiya</Label><Input {...visitorForm.register("name")} placeholder="To'liq ism" data-testid="input-visitor-name" className="bg-surface-container-low border-outline-variant" /></div>
                    <div className="space-y-2"><Label className="text-on-surface">Tashkilot</Label><Input {...visitorForm.register("company")} placeholder="Kompaniya nomi" className="bg-surface-container-low border-outline-variant" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-on-surface">Mezbon (xodim)</Label><Input {...visitorForm.register("host")} placeholder="Kim bilan uchrashuv" className="bg-surface-container-low border-outline-variant" /></div>
                    <div className="space-y-2"><Label className="text-on-surface">Telefon</Label><Input {...visitorForm.register("phone")} placeholder="+998..." className="bg-surface-container-low border-outline-variant" /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-on-surface">Tashrif maqsadi</Label><Input {...visitorForm.register("purpose")} placeholder="Uchrashuv, yetkazib berish..." className="bg-surface-container-low border-outline-variant" /></div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setShowVisitorDialog(false)} className="bg-surface-container text-on-surface hover:bg-surface-container-high border-none rounded-lg font-medium">Bekor</Button>
                    <Button type="submit" disabled={registerVisitor.isPending} className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-none">Ro'yxatdan O'tkazish</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance" className="mt-0 space-y-6 outline-none">
            <h2 className="text-xl font-bold text-on-surface">Xodimlar Davomati (Bugun)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {([
                { l: "Hozir ishda", v: dailySummary?.present ?? (Array.isArray(attendanceRecords) ? attendanceRecords.filter((r: AttendanceRecord) => r.checkIn && !r.checkOut).length : 0), c: "text-green-600" },
                { l: "Kechikkan", v: dailySummary?.late ?? (Array.isArray(attendanceRecords) ? attendanceRecords.filter((r: AttendanceRecord) => r.isLate).length : 0), c: "text-amber-600" },
                { l: "Yo'qolgan", v: dailySummary?.absent ?? 0, c: "text-error" },
                { l: "Ta'tilda", v: dailySummary?.onLeave ?? 0, c: "text-primary" },
              ]).map(s => (
                <div key={s.l} className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">{s.l}</p>
                  <p className={`text-4xl font-bold tracking-tight ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-surface-container-lowest border-outline-variant shadow-none">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Xodim</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kirish</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Chiqish</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Ishlagan vaqt</TableHead>
                      <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLoading ? (
                      <TableRow className="border-none hover:bg-transparent"><TableCell colSpan={5} className="text-center py-6 text-on-surface-variant">Yuklanmoqda...</TableCell></TableRow>
                    ) : !Array.isArray(attendanceRecords) || attendanceRecords.length === 0 ? (
                      <TableRow className="border-none hover:bg-transparent"><TableCell colSpan={5} className="text-center py-8 text-on-surface-variant">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30 text-green-600" />
                        Bugungi davomat ma'lumotlari yo'q
                      </TableCell></TableRow>
                    ) : (Array.isArray(attendanceRecords) ? attendanceRecords : []).slice(0, 15).map((r: AttendanceRecord, i: number) => {
                      const checkIn = r.checkIn ? new Date(r.checkIn) : null;
                      const checkOut = r.checkOut ? new Date(r.checkOut) : null;
                      const hours = checkIn && checkOut ? ((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(1) : null;
                      return (
                        <TableRow key={r.id ?? i} data-testid={`row-att-${r.id ?? i}`} className="border-none hover:bg-surface-container-low transition-colors">
                          <TableCell className="font-medium px-6 text-on-surface">{r.userId || r.employeeName || `#${r.id}`}</TableCell>
                          <TableCell className="text-sm px-6 text-on-surface">{checkIn ? checkIn.toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                          <TableCell className="text-sm px-6 text-on-surface">{checkOut ? checkOut.toLocaleTimeString("uz-UZ") : "—"}</TableCell>
                          <TableCell className="text-sm px-6 text-on-surface-variant">{hours ? `${hours} soat` : "Ishda"}</TableCell>
                          <TableCell className="px-6">
                            <Badge className={r.isLate ? "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                              {r.isLate ? "Kechikkan" : "O'z vaqtida"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PPE */}
          <TabsContent value="ppe" className="mt-0 outline-none">
            <PPEMonitoring />
          </TabsContent>

          {/* Hazmat */}
          <TabsContent value="hazmat" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Xavfli Moddalar Nazorati</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Kuzatilayotgan moddalar", v: "—", c: "text-orange-600" },
                { l: "Bugungi sarflov", v: "—", c: "text-green-600" },
                { l: "Muddati o'tayotgan", v: "—", c: "text-red-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Modda</TableHead><TableHead>CAS №</TableHead>
                    <TableHead>Xavf darajasi</TableHead><TableHead>Miqdori</TableHead><TableHead>Saqlash joyi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {([
                      { name: "UV Lak (izosiyanat)", cas: "101-68-8", level: "Yuqori", qty: "150 kg", loc: "Kimyo ombori-A" },
                      { name: "IPA Spirt (%99)", cas: "67-63-0", level: "O'rta", qty: "80 L", loc: "Kimyo ombori-B" },
                      { name: "CMYK Bo'yoq", cas: "Aralash", level: "Past", qty: "200 kg", loc: "Bosma sexi" },
                      { name: "Kontsentrat tozalagich", cas: "1310-73-2", level: "Yuqori", qty: "45 L", loc: "Kimyo ombori-A" },
                    ]).map((h, i) => (
                      <TableRow key={`k-${i}`} data-testid={`row-hazmat-${i}`}>
                        <TableCell className="font-medium text-sm">{h.name}</TableCell>
                        <TableCell className="font-mono text-xs">{h.cas}</TableCell>
                        <TableCell>
                          <Badge variant={h.level === "Yuqori" ? "destructive" : h.level === "O'rta" ? "secondary" : "outline"}>
                            {h.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{h.qty}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{h.loc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evacuation */}
          <TabsContent value="evacuation" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Evakuatsiya Protokoli</h2>
            <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-300">Oxirgi mashq: 15 mart 2026</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">Evakuatsiya vaqti: 4 daqiqa 12 soniya — Normaga muvofiq</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {([
                { l: "Evakuatsiya chiziqlari", v: "—", c: "text-primary" },
                { l: "Yig'ilish punktlari", v: "—", c: "text-green-600" },
                { l: "Yangilangan EYP", v: "—", c: "text-blue-600" },
                { l: "So'nggi mashq natijasi", v: "—", c: "text-green-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Mas'ul xodimlar</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-evacuation-empty">
                  Mas'ul xodimlar ro'yxati HR tizimida belgilanmagan
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rating */}
          <TabsContent value="rating" className="mt-0 space-y-4">
            <h2 className="text-lg font-semibold">Xavfsizlik Reytingi va KPI</h2>
            <div className="grid grid-cols-3 gap-4">
              {([
                { l: "Umumiy xavfsizlik bali", v: "—", c: "text-green-600" },
                { l: "Baxtsiz hodisasiz kunlar", v: "—", c: "text-primary" },
                { l: "Bu oy ogohlantirishlar", v: violations.length, c: "text-orange-600" },
              ]).map(s => (
                <Card key={s.l}><CardContent className="pt-4 pb-3">
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Bo'limlar bo'yicha xavfsizlik reytingi</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {([
                    { dept: "QC Laboratoriya", score: 98, incidents: 0 },
                    { dept: "Ofis bo'limi", score: 96, incidents: 0 },
                    { dept: "Tayyor mahsulot ombori", score: 91, incidents: 1 },
                    { dept: "Bosma sexi", score: 84, incidents: 2 },
                    { dept: "Xom ashyo ombori", score: 79, incidents: 3 },
                  ]).map((r, i) => (
                    <div key={`k-${i}`} className="space-y-1.5" data-testid={`row-rating-${i}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{r.dept}</span>
                        <div className="flex items-center gap-2">
                          {r.incidents > 0 && <Badge variant="destructive" className="text-xs">{r.incidents} hodisa</Badge>}
                          <span className={`font-bold ${r.score >= 90 ? "text-green-600" : r.score >= 80 ? "text-yellow-600" : "text-red-600"}`}>
                            {r.score}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded">
                        <div className={`h-2 rounded ${r.score >= 90 ? "bg-green-500" : r.score >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${r.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
