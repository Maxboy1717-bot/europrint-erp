import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm, Controller } from "react-hook-form";
import { ShieldAlert, Plus, FileText, AlertTriangle, HardHat, BookOpen, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SafetyIncident {
  id: number;
  userId?: number;
  incidentType?: string;
  severity?: string;
  description?: string;
  incidentDate?: string;
  location?: string;
  status?: string;
}

interface SafetySummary {
  incidentsThisMonth?: number;
  ppeCompliancePercent?: number;
  expiringTrainings?: number;
  openIncidents?: number;
}

interface PpeRecord {
  id: number;
  userId?: number;
  ppeType?: string;
  status?: string;
  issuedDate?: string;
  expiryDate?: string;
}

interface SafetyTraining {
  id: number;
  userId?: number;
  trainingName?: string;
  status?: string;
  scheduledDate?: string;
  expiryDate?: string;
}

interface HazardZone {
  id: number;
  zoneName?: string;
  location?: string;
  hazardType?: string;
  riskLevel?: string;
  isActive?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  low: "text-green-600",
  medium: "text-orange-500",
  high: "text-red-600",
  critical: "text-red-800",
};

export default function HRSafety() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"incidents" | "ppe" | "trainings" | "zones">("incidents");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showIncident, setShowIncident] = useState(false);
  const [showPpe, setShowPpe] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showZone, setShowZone] = useState(false);

  const incidentForm = useForm({
    defaultValues: { userId: "", incidentType: "injury", severity: "minor", description: "", incidentDate: "", location: "" },
  });
  const ppeForm = useForm({
    defaultValues: { userId: "", ppeType: "helmet", status: "compliant", issuedDate: "", expiryDate: "" },
  });
  const trainingForm = useForm({
    defaultValues: { userId: "", trainingName: "", trainingType: "safety", scheduledDate: "", expiryDate: "", status: "pending" },
  });
  const zoneForm = useForm({
    defaultValues: { zoneName: "", location: "", hazardType: "", description: "", riskLevel: "medium" },
  });

  const { data: incidents = [], isLoading: loadingIncidents, refetch: refetchIncidents } = useQuery<SafetyIncident[]>({
    queryKey: ["/api/hr/safety/incidents"],
  });
  const { data: ppeRecords = [], isLoading: loadingPpe, refetch: refetchPpe } = useQuery<PpeRecord[]>({
    queryKey: ["/api/hr/safety/ppe-compliance"],
  });
  const { data: trainings = [], isLoading: loadingTrainings, refetch: refetchTrainings } = useQuery<SafetyTraining[]>({
    queryKey: ["/api/hr/safety/trainings"],
  });
  const { data: zones = [], isLoading: loadingZones } = useQuery<HazardZone[]>({
    queryKey: ["/api/hr/safety/hazard-zones"],
  });
  const { data: summary } = useQuery<SafetySummary>({
    queryKey: ["/api/hr/safety/summary"],
  });

  const createIncident = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/incidents", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/summary"] });
      setShowIncident(false);
      incidentForm.reset();
      toast({ title: "Xavfsizlik hodisasi qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createPpe = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/ppe-compliance", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/ppe-compliance"] });
      setShowPpe(false);
      ppeForm.reset();
      toast({ title: "PPE yozuvi qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createTraining = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/trainings", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/trainings"] });
      setShowTraining(false);
      trainingForm.reset();
      toast({ title: "Trening qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const createZone = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiRequest("POST", "/api/hr/safety/hazard-zones", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/hazard-zones"] });
      setShowZone(false);
      zoneForm.reset();
      toast({ title: "Xavfli zona qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const deleteIncident = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/hr/safety/incidents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/safety/incidents"] });
      toast({ title: "Hodisa o'chirildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-indigo-600" />
          <h1 className="font-semibold text-base">HR — Xavfsizlik va Sog'liqni Saqlash</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" data-testid="button-export-safety-pdf"
            onClick={() => fetch("/api/hr/safety/export/pdf", { credentials: "include" })
              .then(r => r.blob()).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "safety-report.pdf"; a.click();
                URL.revokeObjectURL(url);
              }).catch(() => toast({ title: "PDF yaratishda xatolik", variant: "destructive" }))}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />PDF Hisobot
          </Button>
          {subTab === "incidents" && (
            <Button size="sm" onClick={() => setShowIncident(true)} data-testid="button-add-incident">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Hodisa Qo'shish
            </Button>
          )}
          {subTab === "ppe" && (
            <Button size="sm" onClick={() => setShowPpe(true)} data-testid="button-add-ppe">
              <Plus className="h-3.5 w-3.5 mr-1.5" />PPE Qo'shish
            </Button>
          )}
          {subTab === "trainings" && (
            <Button size="sm" onClick={() => setShowTraining(true)} data-testid="button-add-training">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Trening Qo'shish
            </Button>
          )}
          {subTab === "zones" && (
            <Button size="sm" onClick={() => setShowZone(true)} data-testid="button-add-zone">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Zona Qo'shish
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: "Bu oydagi hodisalar", value: summary?.incidentsThisMonth ?? "—", color: "text-red-600", icon: AlertTriangle },
            { label: "PPE Compliance", value: summary?.ppeCompliancePercent !== undefined ? `${summary.ppeCompliancePercent}%` : "—", color: "text-green-600", icon: HardHat },
            { label: "Muddati tugayotgan treninglar", value: summary?.expiringTrainings ?? "—", color: "text-orange-600", icon: BookOpen },
            { label: "Ochiq hodisalar", value: summary?.openIncidents ?? "—", color: "text-blue-600", icon: ShieldAlert },
          ]).map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-start justify-between">
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
                <s.icon className={`h-5 w-5 ${s.color} mt-1`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "incidents" | "ppe" | "trainings" | "zones")}>
          <TabsList>
            <TabsTrigger value="incidents">Hodisalar</TabsTrigger>
            <TabsTrigger value="ppe">PPE</TabsTrigger>
            <TabsTrigger value="trainings">Treninglar</TabsTrigger>
            <TabsTrigger value="zones">Xavfli Zonalar</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tur</TableHead>
                      <TableHead>Jiddiylik</TableHead>
                      <TableHead>Tavsif</TableHead>
                      <TableHead>Joylashuv</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingIncidents ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : (incidents as SafetyIncident[]).length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Hodisalar yo'q</TableCell></TableRow>
                    ) : (incidents as SafetyIncident[]).map((inc) => (
                      <TableRow key={inc.id} data-testid={`row-safety-incident-${inc.id}`}>
                        <TableCell>{inc.incidentType || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={inc.severity === "critical" || inc.severity === "major" ? "destructive" : "secondary"}>
                            {inc.severity || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">{inc.description || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{inc.location || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {inc.incidentDate ? new Date(inc.incidentDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={inc.status === "closed" ? "default" : "outline"}>{inc.status || "open"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setConfirmDeleteId(inc.id)}
                            data-testid={`button-delete-incident-${inc.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ppe" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim ID</TableHead>
                      <TableHead>PPE Turi</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Berilgan sana</TableHead>
                      <TableHead>Muddati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPpe ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : (ppeRecords as PpeRecord[]).length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">PPE yozuvlari yo'q</TableCell></TableRow>
                    ) : (ppeRecords as PpeRecord[]).map((p) => (
                      <TableRow key={p.id} data-testid={`row-ppe-${p.id}`}>
                        <TableCell>{p.userId || "—"}</TableCell>
                        <TableCell>{p.ppeType || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "compliant" ? "default" : "destructive"}>
                            {p.status === "compliant" ? "Mos" : "Mos emas"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.issuedDate ? new Date(p.issuedDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim ID</TableHead>
                      <TableHead>Trening nomi</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Rejalashtirilgan</TableHead>
                      <TableHead>Muddati</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTrainings ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : (trainings as SafetyTraining[]).length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Treninglar yo'q</TableCell></TableRow>
                    ) : (trainings as SafetyTraining[]).map((t) => (
                      <TableRow key={t.id} data-testid={`row-training-${t.id}`}>
                        <TableCell>{t.userId || "—"}</TableCell>
                        <TableCell className="font-medium">{t.trainingName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={t.status === "completed" ? "default" : "outline"}>{t.status || "pending"}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.expiryDate ? new Date(t.expiryDate).toLocaleDateString("uz-UZ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zona nomi</TableHead>
                      <TableHead>Joylashuv</TableHead>
                      <TableHead>Xavf turi</TableHead>
                      <TableHead>Xavf darajasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingZones ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Yuklanmoqda...</TableCell></TableRow>
                    ) : (zones as HazardZone[]).filter((z) => z.isActive !== false).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Xavfli zonalar yo'q</TableCell></TableRow>
                    ) : (zones as HazardZone[]).filter((z) => z.isActive !== false).map((z) => (
                      <TableRow key={z.id} data-testid={`row-zone-${z.id}`}>
                        <TableCell className="font-medium">{z.zoneName || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{z.location || "—"}</TableCell>
                        <TableCell>{z.hazardType || "—"}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${RISK_COLORS[z.riskLevel || ""] || "text-muted-foreground"}`}>
                            {z.riskLevel || "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Incident Dialog */}
      <Dialog open={showIncident} onOpenChange={setShowIncident}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xavfsizlik Hodisasi Qayd Etish</DialogTitle></DialogHeader>
          <form onSubmit={incidentForm.handleSubmit((d) => createIncident.mutate(d))} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Xodim ID</Label>
                <Input {...incidentForm.register("userId")} type="number" />
              </div>
              <div>
                <Label>Joylashuv</Label>
                <Input {...incidentForm.register("location")} />
              </div>
            </div>
            <div>
              <Label>Hodisa turi</Label>
              <Controller control={incidentForm.control} name="incidentType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="injury">Shikast</SelectItem>
                    <SelectItem value="near_miss">Deyarli hodisa</SelectItem>
                    <SelectItem value="property_damage">Mulk zarari</SelectItem>
                    <SelectItem value="fire">Yong'in</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Input {...incidentForm.register("description")} />
            </div>
            <div>
              <Label>Sana</Label>
              <Input type="date" {...incidentForm.register("incidentDate")} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowIncident(false)}>Bekor</Button>
              <Button type="submit" disabled={createIncident.isPending}>Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PPE Dialog */}
      <Dialog open={showPpe} onOpenChange={setShowPpe}>
        <DialogContent>
          <DialogHeader><DialogTitle>PPE Yozuvi Qo'shish</DialogTitle></DialogHeader>
          <form onSubmit={ppeForm.handleSubmit((d) => createPpe.mutate(d))} className="space-y-3 py-2">
            <div>
              <Label>Xodim ID</Label>
              <Input {...ppeForm.register("userId")} type="number" />
            </div>
            <div>
              <Label>PPE Turi</Label>
              <Controller control={ppeForm.control} name="ppeType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="helmet">Kaska</SelectItem>
                    <SelectItem value="gloves">Qo'lqop</SelectItem>
                    <SelectItem value="vest">Jilet</SelectItem>
                    <SelectItem value="boots">Botinka</SelectItem>
                    <SelectItem value="glasses">Ko'zoynak</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Berilgan sana</Label><Input type="date" {...ppeForm.register("issuedDate")} /></div>
              <div><Label>Muddati</Label><Input type="date" {...ppeForm.register("expiryDate")} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowPpe(false)}>Bekor</Button>
              <Button type="submit" disabled={createPpe.isPending}>Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Training Dialog */}
      <Dialog open={showTraining} onOpenChange={setShowTraining}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xavfsizlik Trening Qo'shish</DialogTitle></DialogHeader>
          <form onSubmit={trainingForm.handleSubmit((d) => createTraining.mutate(d))} className="space-y-3 py-2">
            <div><Label>Xodim ID</Label><Input {...trainingForm.register("userId")} type="number" /></div>
            <div><Label>Trening nomi</Label><Input {...trainingForm.register("trainingName")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sana</Label><Input type="date" {...trainingForm.register("scheduledDate")} /></div>
              <div><Label>Muddati</Label><Input type="date" {...trainingForm.register("expiryDate")} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowTraining(false)}>Bekor</Button>
              <Button type="submit" disabled={createTraining.isPending}>Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Zone Dialog */}
      <Dialog open={showZone} onOpenChange={setShowZone}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xavfli Zona Qo'shish</DialogTitle></DialogHeader>
          <form onSubmit={zoneForm.handleSubmit((d) => createZone.mutate(d))} className="space-y-3 py-2">
            <div><Label>Zona nomi</Label><Input {...zoneForm.register("zoneName")} /></div>
            <div><Label>Joylashuv</Label><Input {...zoneForm.register("location")} /></div>
            <div><Label>Xavf turi</Label><Input {...zoneForm.register("hazardType")} /></div>
            <div>
              <Label>Xavf darajasi</Label>
              <Controller control={zoneForm.control} name="riskLevel" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Past</SelectItem>
                    <SelectItem value="medium">O'rta</SelectItem>
                    <SelectItem value="high">Yuqori</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowZone(false)}>Bekor</Button>
              <Button type="submit" disabled={createZone.isPending}>Saqlash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Hodisani o'chirish"
        description="Ushbu xavfsizlik hodisasini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteId !== null) deleteIncident.mutate(confirmDeleteId); }}
      />
    </div>
  );
}
