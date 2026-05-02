import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield, AlertTriangle, CheckCircle, Plus, Loader2,
  ScanLine, Eye, Users, LogIn, LogOut, RefreshCw,
  HardHat, Flame, MapPin, ClipboardList, Bell, Activity,
  XCircle, ZapOff, Wind,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

interface AttendanceRecord {
  id: string; employeeName: string; type: string; timestamp: string;
  method: string; location: string; isAnomaly: boolean;
}

interface DailySummary {
  activeOnSite: number; totalEntries: number; totalExits: number; anomalyCount: number;
}

interface Visitor {
  id: string; fullName: string; company: string; purpose: string;
  hostEmployeeName: string; enteredAt: string; exitedAt: string | null;
  badgeNumber: string; status: string;
}

interface SecurityIncident {
  id: string; type: string; description: string; severity: string;
  location: string; reportedBy: string; status: string; createdAt: string;
}

interface PPECheck {
  id: string; employeeName: string; department: string; helmetOk: boolean;
  vestOk: boolean; glovesOk: boolean; bootsOk: boolean; createdAt: string; notes: string | null;
}


type FireSensor = { id: string; type: string; location: string; status: string; lastCheck: string };
type AccessZone = { id: string; name: string; accessLevel: string; activeCount: number; maxCapacity: number };

export default function SecurityDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [visitorDialogOpen, setVisitorDialogOpen] = useState(false);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [ppeDialogOpen, setPpeDialogOpen] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ fullName: "", company: "", purpose: "", hostEmployeeName: "", badgeNumber: "" });
  const [incidentForm, setIncidentForm] = useState({ type: "unauthorized_access", description: "", severity: "medium", location: "", reportedBy: "" });
  const [ppeForm, setPpeForm] = useState({ employeeName: "", department: "", helmetOk: true, vestOk: true, glovesOk: true, bootsOk: true, notes: "" });

  const { data: records, isLoading: recordsLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/security/attendance-records"],
  });

  const { data: summary } = useQuery<DailySummary>({
    queryKey: ["/api/security/daily-summary"],
    refetchInterval: 60000,
  });

  const { data: visitors = [], isLoading: visitorsLoading, refetch: refetchVisitors } = useQuery<Visitor[]>({
    queryKey: ["/api/security/visitors"],
    queryFn: async () => {
      const res = await fetch("/api/security/visitors", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createVisitorMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/security/visitors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/visitors"] });
      setVisitorDialogOpen(false);
      setVisitorForm({ fullName: "", company: "", purpose: "", hostEmployeeName: "", badgeNumber: "" });
      toast({ title: "Tashrif qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const exitVisitorMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/security/visitors/${id}/exit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/visitors"] });
      toast({ title: "Chiqish qayd etildi" });
    },
  });

  const { data: incidents = [], refetch: refetchIncidents } = useQuery<SecurityIncident[]>({
    queryKey: ["/api/security/incidents"],
  });

  const createIncidentMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/security/incidents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/incidents"] });
      setIncidentDialogOpen(false);
      setIncidentForm({ type: "unauthorized_access", description: "", severity: "medium", location: "", reportedBy: "" });
      toast({ title: "Hodisa qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const { data: ppeChecks = [], refetch: refetchPpeChecks } = useQuery<PPECheck[]>({
    queryKey: ["/api/security/ppe-checks"],
  });

  const createPpeMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/security/ppe-checks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/ppe-checks"] });
      setPpeDialogOpen(false);
      setPpeForm({ employeeName: "", department: "", helmetOk: true, vestOk: true, glovesOk: true, bootsOk: true, notes: "" });
      toast({ title: "PPE tekshiruvi qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const { data: fireSensors = [] } = useQuery<FireSensor[]>({
    queryKey: ["/api/security/fire-sensors"],
    refetchInterval: 60_000,
  });

  const { data: accessZones = [] } = useQuery<AccessZone[]>({
    queryKey: ["/api/security/access-zones"],
    refetchInterval: 60_000,
  });

  const activeVisitors = (Array.isArray(visitors) ? visitors : []).filter(v => !v.exitedAt);
  const anomalyCount = records?.filter(r => r.isAnomaly).length ?? 0;
  const openIncidents = (Array.isArray(incidents) ? incidents : []).filter(i => i.status === "open").length;
  const failedPPECount = (Array.isArray(ppeChecks) ? ppeChecks : []).filter(p => !p.helmetOk || !p.vestOk || !p.glovesOk || !p.bootsOk).length;
  const warningAlerts = (Array.isArray(fireSensors) ? fireSensors : []).filter(a => a.status === "warning").length;

  function handleAddIncident() {
    if (!incidentForm.description || !incidentForm.location || !incidentForm.reportedBy) {
      toast({ title: "Barcha maydonlarni to'ldiring", variant: "destructive" });
      return;
    }
    createIncidentMutation.mutate({ ...incidentForm, status: "open" });
  }

  function handleAddPPE() {
    if (!ppeForm.employeeName || !ppeForm.department) {
      toast({ title: "Xodim ismi va bo'limni kiriting", variant: "destructive" });
      return;
    }
    createPpeMutation.mutate({ ...ppeForm });
  }

  const incidentTypeLabel: Record<string, string> = {
    unauthorized_access: "Ruxsatsiz kirish",
    ppe_violation: "PPE buzilishi",
    fire_alarm: "Yong'in signali",
    gas_leak: "Gaz sizishi",
    accident: "Baxtsiz hodisa",
    theft: "O'g'irlik",
    other: "Boshqa",
  };

  const severityVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    high: "destructive", medium: "default", low: "secondary",
  };

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          Xavfsizlik <span className="font-bold text-primary">Nazorati</span>
        </h1>
        <p className="text-on-surface-variant mt-2">Kirish nazorati · PPE · Hodisalar · Evakuatsiya · Signallar</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {([
          { label: "Ichkarida", value: summary?.activeOnSite ?? 0, icon: Users, color: "text-on-surface" },
          { label: "Tashrifchilar", value: activeVisitors.length, icon: Eye, color: "text-primary" },
          { label: "Ochiq hodisalar", value: openIncidents, icon: AlertTriangle, color: openIncidents > 0 ? "text-error" : "text-on-surface" },
          { label: "PPE xato", value: failedPPECount, icon: HardHat, color: failedPPECount > 0 ? "text-amber-600" : "text-on-surface" },
          { label: "Ogohlantirish", value: warningAlerts, icon: Bell, color: warningAlerts > 0 ? "text-amber-600" : "text-on-surface" },
        ]).map((s, i) => (
          <div key={`k-${i}`} className="bg-surface-container-lowest rounded-lg p-5" data-testid={`security-kpi-${i}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{s.label}</p>
            <p className={`text-4xl font-bold tracking-tight mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-container-low p-1 rounded-lg flex-wrap h-auto">
          <TabsTrigger value="overview" data-testid="tab-security-overview" className="data-[state=active]:bg-surface-container-lowest">Kirish Jurnali</TabsTrigger>
          <TabsTrigger value="visitors" data-testid="tab-security-visitors" className="data-[state=active]:bg-surface-container-lowest">Tashrifchilar</TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-security-incidents" className="data-[state=active]:bg-surface-container-lowest">Hodisalar</TabsTrigger>
          <TabsTrigger value="ppe" data-testid="tab-security-ppe" className="data-[state=active]:bg-surface-container-lowest">PPE</TabsTrigger>
          <TabsTrigger value="zones" data-testid="tab-security-zones" className="data-[state=active]:bg-surface-container-lowest">Zonalar</TabsTrigger>
          <TabsTrigger value="fire" data-testid="tab-security-fire" className="data-[state=active]:bg-surface-container-lowest">Signallar</TabsTrigger>
        </TabsList>

        {/* TAB 1: Kirish Jurnali */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <ScanLine className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Bugungi Kirish Jurnali</h2>
            </div>
            {recordsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !records?.length ? (
              <div className="text-center py-8 text-on-surface-variant">Bugun kirish jurnali yo'q</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Xodim</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Turi</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Vaqt</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Usul</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Joy</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(records) ? records : []).slice(0, 30).map(r => {
                    let rowClass = "border-none hover:bg-surface-container-low transition-colors";
                    if (r.isAnomaly) rowClass += " bg-red-50 border-l-4 border-error";
                    else if (r.type === "entry") rowClass += " bg-green-50 border-l-4 border-green-500";
                    else if (r.type === "exit") rowClass += " bg-surface-container-low border-l-4 border-outline-variant";

                    return (
                      <TableRow key={r.id} data-testid={`row-attendance-${r.id}`} className={rowClass}>
                        <TableCell className="font-medium px-6 text-on-surface">{r.employeeName}</TableCell>
                      <TableCell className="px-6">
                        <Badge className={r.type === "entry" ? "bg-primary-container text-on-primary-container rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" : "bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"}>
                          {r.type === "entry" ? <LogIn className="w-3 h-3 mr-1" /> : <LogOut className="w-3 h-3 mr-1" />}
                          {r.type === "entry" ? "Kirdi" : "Chiqdi"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm px-6 text-on-surface-variant">{new Date(r.timestamp).toLocaleTimeString("uz-UZ")}</TableCell>
                      <TableCell className="px-6">
                        <Badge variant="outline" className="text-xs border-outline-variant text-on-surface-variant rounded-full">{r.method === "rfid" ? "RFID" : r.method === "face" ? "Yuz" : r.method}</Badge>
                      </TableCell>
                      <TableCell className="text-sm px-6 text-on-surface-variant">{r.location || "Asosiy kirish"}</TableCell>
                      <TableCell className="px-6">
                        {r.isAnomaly ? (
                          <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"><AlertTriangle className="w-3 h-3 mr-1" />Anomaliya</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"><CheckCircle className="w-3 h-3 mr-1" />Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: Tashrifchilar */}
        <TabsContent value="visitors" className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Tashrifchilar
                </h2>
                <p className="text-sm text-on-surface-variant">Hozirda zavodda bo'lgan tashrifchilar</p>
              </div>
              <Button onClick={() => setVisitorDialogOpen(true)} data-testid="button-add-visitor">
                <Plus className="w-4 h-4 mr-2" />Yangi Tashrif
              </Button>
            </div>
            {visitorsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !visitors.length ? (
              <div className="text-center py-8 text-on-surface-variant">Tashrifchilar yo'q</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Ismi</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kompaniya</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Maqsad</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Mezboni</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kirdi</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
                    <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(visitors) ? visitors : []).map(v => (
                    <TableRow key={v.id} data-testid={`row-visitor-${v.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                      <TableCell className="font-medium px-6 text-on-surface">{v.fullName}</TableCell>
                      <TableCell className="px-6 text-on-surface">{v.company}</TableCell>
                      <TableCell className="px-6 text-on-surface">{v.purpose}</TableCell>
                      <TableCell className="px-6 text-on-surface">{v.hostEmployeeName}</TableCell>
                      <TableCell className="text-sm px-6 text-on-surface-variant">{new Date(v.enteredAt).toLocaleTimeString("uz-UZ")}</TableCell>
                      <TableCell className="px-6"><Badge variant={!v.exitedAt ? "default" : "secondary"}>{!v.exitedAt ? "Ichkarida" : "Chiqdi"}</Badge></TableCell>
                      <TableCell className="px-6">
                        {!v.exitedAt && (
                          <Button size="sm" variant="outline"
                            data-testid={`button-exit-visitor-${v.id}`}
                            onClick={() => exitVisitorMutation.mutate(v.id)}
                            disabled={exitVisitorMutation.isPending}>
                            <LogOut className="w-3 h-3 mr-1" />Chiqdi
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: Hodisalar */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Xavfsizlik Hodisalari
                </h2>
                <p className="text-sm text-on-surface-variant">Barcha qayd etilgan xavfsizlik hodisalari</p>
              </div>
              <Button onClick={() => setIncidentDialogOpen(true)} data-testid="button-add-incident">
                <Plus className="w-4 h-4 mr-2" />Hodisa Qayd Et
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Turi</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tavsif</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Joylasuv</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Darajasi</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Qayd etgan</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Vaqt</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(incidents) ? incidents : []).map(i => (
                  <TableRow key={i.id} data-testid={`row-incident-${i.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                    <TableCell className="px-6"><Badge variant="outline" className="border-outline-variant text-on-surface-variant">{incidentTypeLabel[i.type] || i.type}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate px-6 text-on-surface">{i.description}</TableCell>
                    <TableCell className="px-6 text-on-surface">{i.location}</TableCell>
                    <TableCell className="px-6"><Badge variant={severityVariant[i.severity] || "secondary"}>{i.severity === "high" ? "Yuqori" : i.severity === "medium" ? "O'rta" : "Past"}</Badge></TableCell>
                    <TableCell className="text-sm px-6 text-on-surface-variant">{i.reportedBy}</TableCell>
                    <TableCell className="text-sm px-6 text-on-surface-variant">{new Date(i.createdAt).toLocaleString("uz-UZ")}</TableCell>
                    <TableCell className="px-6">
                      <Badge variant={i.status === "open" ? "destructive" : "secondary"}>
                        {i.status === "open" ? "Ochiq" : "Yopilgan"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!incidents.length && <div className="text-center py-8 text-on-surface-variant">Hodisalar yo'q</div>}
          </div>
        </TabsContent>

        {/* TAB 4: PPE */}
        <TabsContent value="ppe" className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-primary" />
                  Shaxsiy Himoya Vositalari (PPE)
                </h2>
                <p className="text-sm text-on-surface-variant">Xodimlarning PPE tekshiruvi natijalari</p>
              </div>
              <Button onClick={() => setPpeDialogOpen(true)} data-testid="button-add-ppe">
                <Plus className="w-4 h-4 mr-2" />Tekshiruv Qo'shish
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-l-lg">Xodim</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Bo'lim</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Kask</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Vest</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Qo'lqop</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Botinka</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Vaqt</TableHead>
                  <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 rounded-r-lg">Izoh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(ppeChecks) ? ppeChecks : []).map(p => {
                  const allOk = p.helmetOk && p.vestOk && p.glovesOk && p.bootsOk;
                  return (
                    <TableRow key={p.id} data-testid={`row-ppe-${p.id}`} className="border-none hover:bg-surface-container-low transition-colors">
                      <TableCell className="font-medium px-6 text-on-surface">{p.employeeName}</TableCell>
                      <TableCell className="px-6 text-on-surface">{p.department}</TableCell>
                      <TableCell className="px-6">{p.helmetOk ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</TableCell>
                      <TableCell className="px-6">{p.vestOk ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</TableCell>
                      <TableCell className="px-6">{p.glovesOk ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</TableCell>
                      <TableCell className="px-6">{p.bootsOk ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</TableCell>
                      <TableCell className="text-sm px-6 text-on-surface-variant">{new Date(p.createdAt).toLocaleTimeString("uz-UZ")}</TableCell>
                      <TableCell className="px-6">
                        <Badge variant={allOk ? "secondary" : "destructive"} className="shadow-none">
                          {allOk ? "OK" : "Xato"}
                        </Badge>
                        {p.notes && <span className="text-xs text-on-surface-variant ml-1">{p.notes}</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {!ppeChecks.length && <div className="text-center py-8 text-on-surface-variant">PPE tekshiruvlari yo'q</div>}
          </div>
        </TabsContent>

        {/* TAB 5: Ruxsat Zonalari */}
        <TabsContent value="zones" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(accessZones) ? accessZones : []).map(z => {
              const occupancy = Math.round((z.activeCount / z.maxCapacity) * 100);
              const isFull = occupancy >= 90;
              return (
                <Card key={z.id} data-testid={`card-zone-${z.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{z.name}</p>
                        <p className="text-xs text-muted-foreground">Ruxsat darajasi: {z.accessLevel}</p>
                      </div>
                      <Badge variant={isFull ? "destructive" : z.activeCount > 0 ? "default" : "secondary"}>
                        <MapPin className="w-3 h-3 mr-1" />
                        {z.activeCount} kishi
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Band: {z.activeCount}/{z.maxCapacity}</span>
                        <span>{occupancy}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${isFull ? "bg-red-500" : occupancy > 60 ? "bg-orange-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 6: Yong'in/Gaz Signallari */}
        <TabsContent value="fire" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Yong'in va Gaz Monitoring
              </CardTitle>
              <CardDescription>Hamma sensor va signal qurilmalari holati</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Array.isArray(fireSensors) ? fireSensors : []).map(fa => (
                  <Card key={fa.id} data-testid={`card-fire-${fa.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {fa.type.includes("Gaz") ? <Wind className="w-5 h-5 text-blue-500" /> :
                           fa.type.includes("Yong") ? <Flame className="w-5 h-5 text-orange-500" /> :
                           fa.type.includes("Tutun") ? <ZapOff className="w-5 h-5 text-on-surface-variant" /> :
                           <Activity className="w-5 h-5 text-purple-500" />}
                          <div>
                            <p className="font-medium">{fa.type}</p>
                            <p className="text-xs text-muted-foreground">{fa.location}</p>
                          </div>
                        </div>
                        <Badge variant={fa.status === "normal" ? "secondary" : fa.status === "warning" ? "default" : "destructive"}>
                          {fa.status === "normal" ? "Normal" : fa.status === "warning" ? "Ogohlantirish" : "XAVF!"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Oxirgi tekshiruv: {new Date(fa.lastCheck).toLocaleTimeString("uz-UZ")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/30 rounded-md">
                <h3 className="font-medium mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4" />Evakuatsiya Protokoli</h3>
                <div className="space-y-2 text-sm">
                  {([
                    "1. Barcha ishlarni to'xtatib, mashinalar quvvatini o'chirilsin",
                    "2. Xodimlar evakuatsiya yo'llaridan chiqib ketishi kerak",
                    "3. Har bo'lim mas'uli xodimlar sonini tekshiradi",
                    "4. Yig'ilish nuqtasi: Zavod oldidagi park maydoni",
                    "5. Xavfsizlik xizmati va qo'riqchi kirish/chiqish nazorat qiladi",
                    "6. Tashrifchilar darhol chiqarilsin va nishonlari qaytarilsin",
                  ]).map((step, i) => (
                    <div key={`k-${i}`} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visitor Dialog */}
      <Dialog open={visitorDialogOpen} onOpenChange={setVisitorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi Tashrif</DialogTitle>
            <DialogDescription>Tashrifchini ro'yxatdan o'tkazing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">To'liq ismi *</label>
              <Input value={visitorForm.fullName} onChange={e => setVisitorForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Abdullayev Bobur" data-testid="input-visitor-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Kompaniya</label>
              <Input value={visitorForm.company} onChange={e => setVisitorForm(p => ({ ...p, company: e.target.value }))}
                placeholder="Kompaniya nomi" data-testid="input-visitor-company" />
            </div>
            <div>
              <label className="text-sm font-medium">Maqsad *</label>
              <Input value={visitorForm.purpose} onChange={e => setVisitorForm(p => ({ ...p, purpose: e.target.value }))}
                placeholder="Yig'ilish, auditorlik..." data-testid="input-visitor-purpose" />
            </div>
            <div>
              <label className="text-sm font-medium">Mezboni *</label>
              <Input value={visitorForm.hostEmployeeName} onChange={e => setVisitorForm(p => ({ ...p, hostEmployeeName: e.target.value }))}
                placeholder="Qaysi xodimga keldi" data-testid="input-visitor-host" />
            </div>
            <div>
              <label className="text-sm font-medium">Nishon raqami</label>
              <Input value={visitorForm.badgeNumber} onChange={e => setVisitorForm(p => ({ ...p, badgeNumber: e.target.value }))}
                placeholder="V-001" data-testid="input-visitor-badge" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitorDialogOpen(false)}>Bekor</Button>
            <Button
              disabled={createVisitorMutation.isPending || !visitorForm.fullName || !visitorForm.purpose || !visitorForm.hostEmployeeName}
              data-testid="button-submit-visitor"
              onClick={() => createVisitorMutation.mutate({ ...visitorForm, enteredAt: new Date().toISOString(), status: "inside" })}>
              {createVisitorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Qayd etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incident Dialog */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hodisa Qayd Etish</DialogTitle>
            <DialogDescription>Xavfsizlik hodisasini qayd eting</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Hodisa turi *</label>
              <Select value={incidentForm.type} onValueChange={v => setIncidentForm(p => ({ ...p, type: v }))}>
                <SelectTrigger data-testid="select-incident-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(incidentTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tavsif *</label>
              <Textarea value={incidentForm.description} onChange={e => setIncidentForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Hodisani batafsil tavsiflang" data-testid="input-incident-description" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Joylasuv *</label>
              <Input value={incidentForm.location} onChange={e => setIncidentForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Ombor, Sex-1..." data-testid="input-incident-location" />
            </div>
            <div>
              <label className="text-sm font-medium">Darajasi</label>
              <Select value={incidentForm.severity} onValueChange={v => setIncidentForm(p => ({ ...p, severity: v }))}>
                <SelectTrigger data-testid="select-incident-severity"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Yuqori</SelectItem>
                  <SelectItem value="medium">O'rta</SelectItem>
                  <SelectItem value="low">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Qayd etgan *</label>
              <Input value={incidentForm.reportedBy} onChange={e => setIncidentForm(p => ({ ...p, reportedBy: e.target.value }))}
                placeholder="Kim xabar berdi" data-testid="input-incident-reporter" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>Bekor</Button>
            <Button onClick={handleAddIncident} data-testid="button-submit-incident">Qayd etish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PPE Dialog */}
      <Dialog open={ppeDialogOpen} onOpenChange={setPpeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>PPE Tekshiruvi</DialogTitle>
            <DialogDescription>Xodim shaxsiy himoya vositalarini tekshiring</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Xodim ismi *</label>
              <Input value={ppeForm.employeeName} onChange={e => setPpeForm(p => ({ ...p, employeeName: e.target.value }))}
                placeholder="Ismi Familiyasi" data-testid="input-ppe-employee" />
            </div>
            <div>
              <label className="text-sm font-medium">Bo'lim *</label>
              <Input value={ppeForm.department} onChange={e => setPpeForm(p => ({ ...p, department: e.target.value }))}
                placeholder="Ishlab chiqarish, Ombor..." data-testid="input-ppe-department" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Kask", key: "helmetOk" as const },
                { label: "Xavfsizlik vesti", key: "vestOk" as const },
                { label: "Qo'lqop", key: "glovesOk" as const },
                { label: "Maxsus botinqa", key: "bootsOk" as const },
              ]).map(item => (
                <div key={item.key} className="flex items-center gap-2">
                  <input type="checkbox" id={item.key} checked={ppeForm[item.key]}
                    onChange={e => setPpeForm(p => ({ ...p, [item.key]: e.target.checked }))}
                    data-testid={`checkbox-ppe-${item.key}`} />
                  <label htmlFor={item.key} className="text-sm">{item.label}</label>
                </div>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium">Izoh</label>
              <Input value={ppeForm.notes} onChange={e => setPpeForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Muammo bo'lsa yozing" data-testid="input-ppe-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPpeDialogOpen(false)}>Bekor</Button>
            <Button onClick={handleAddPPE} data-testid="button-submit-ppe">Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
