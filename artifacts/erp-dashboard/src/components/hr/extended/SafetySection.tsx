/**
 * @module SafetySection
 * @description React UI component.
 */

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldAlert, AlertTriangle, HardHat, BookOpen, MapPin, Trash2, CheckCircle2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafetyIncident, PpeRecord, SafetyTraining, HazardZone, SafetySummary, DeptSafetySummary } from "./types";

const SIncidentSchema = z.object({
  userId:       z.string().optional(),
  incidentType: z.enum(["injury", "near_miss", "violation"]),
  severity:     z.enum(["minor", "major", "critical"]),
  incidentDate: z.string().min(1, "Sana majburiy"),
  description:  z.string().min(3, "Tavsif majburiy"),
  location:     z.string().optional(),
});
const STrainingSchema = z.object({
  userId:        z.string().optional(),
  trainingName:  z.string().min(1, "Trening nomi majburiy"),
  trainingType:  z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  expiryDate:    z.string().optional(),
  trainer:       z.string().optional(),
  status:        z.enum(["pending", "completed", "expired"]),
});
const SZoneSchema = z.object({
  zoneName:    z.string().min(1, "Zona nomi majburiy"),
  location:    z.string().min(1, "Joylashuv majburiy"),
  hazardType:  z.string().optional(),
  description: z.string().optional(),
  riskLevel:   z.enum(["low", "medium", "high", "critical"]),
});
const SPpeSchema = z.object({
  userId:     z.string().optional(),
  ppeType:    z.enum(["helmet", "boots", "gloves"]),
  status:     z.enum(["compliant", "non_compliant"]),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
});
type SIncidentData  = z.infer<typeof SIncidentSchema>;
type STrainingData  = z.infer<typeof STrainingSchema>;
type SZoneData      = z.infer<typeof SZoneSchema>;
type SPpeData       = z.infer<typeof SPpeSchema>;
import { UseMutationResult } from "@tanstack/react-query";

interface SafetySectionProps {
  safetySummary?: SafetySummary;
  deptSafetySummary: DeptSafetySummary[];
  safetyIncidents: SafetyIncident[];
  incidentsLoading: boolean;
  ppeRecords: PpeRecord[];
  ppeLoading: boolean;
  safetyTrainingsList: SafetyTraining[];
  trainingsLoading: boolean;
  hazardZonesList: HazardZone[];
  zonesLoading: boolean;
  createIncident: UseMutationResult<any, any, any>;
  createTraining: UseMutationResult<any, any, any>;
  createZone: UseMutationResult<any, any, any>;
  createPpe: UseMutationResult<any, any, any>;
  updateIncidentStatus: UseMutationResult<any, any, { id: number; status: string }>;
  deleteIncident: UseMutationResult<any, any, number>;
  deleteHazardZone: UseMutationResult<any, any, number>;
}

export function SafetySection({
  safetySummary,
  deptSafetySummary,
  safetyIncidents,
  incidentsLoading,
  ppeRecords,
  ppeLoading,
  safetyTrainingsList,
  trainingsLoading,
  hazardZonesList,
  zonesLoading,
  createIncident,
  createTraining,
  createZone,
  createPpe,
  updateIncidentStatus,
  deleteIncident,
  deleteHazardZone,
}: SafetySectionProps) {
  const [safetySubTab, setSafetySubTab] = useState<"incidents" | "ppe" | "trainings" | "zones">("incidents");
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showPpeDialog, setShowPpeDialog] = useState(false);
  const [confirmDeleteIncidentId, setConfirmDeleteIncidentId] = useState<number | null>(null);
  const [confirmDeleteZoneId, setConfirmDeleteZoneId] = useState<number | null>(null);

  const incidentForm = useForm<SIncidentData>({
    resolver: zodResolver(SIncidentSchema),
    defaultValues: { userId: "", incidentType: "injury", severity: "minor", description: "", incidentDate: "", location: "" },
  });
  const trainingForm = useForm<STrainingData>({
    resolver: zodResolver(STrainingSchema),
    defaultValues: { userId: "", trainingName: "", trainingType: "safety", scheduledDate: "", completedDate: "", expiryDate: "", trainer: "", status: "pending" },
  });
  const zoneForm = useForm<SZoneData>({
    resolver: zodResolver(SZoneSchema),
    defaultValues: { zoneName: "", location: "", hazardType: "", description: "", riskLevel: "medium" },
  });
  const ppeForm = useForm<SPpeData>({
    resolver: zodResolver(SPpeSchema),
    defaultValues: { userId: "", ppeType: "helmet", status: "compliant", issuedDate: "", expiryDate: "" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mehnat Muhofazasi va Xavfsizlik Tehnika</h2>
        <div className="flex gap-2">
          {safetySubTab === "incidents" && <Button onClick={() => setShowIncidentDialog(true)} size="sm" data-testid="button-add-incident"><Plus className="h-4 w-4 mr-1" />Hodisa</Button>}
          {safetySubTab === "ppe" && <Button onClick={() => setShowPpeDialog(true)} size="sm" data-testid="button-add-ppe"><Plus className="h-4 w-4 mr-1" />PPE Yozuvi</Button>}
          {safetySubTab === "trainings" && <Button onClick={() => setShowTrainingDialog(true)} size="sm" data-testid="button-add-training"><Plus className="h-4 w-4 mr-1" />Trening</Button>}
          {safetySubTab === "zones" && <Button onClick={() => setShowZoneDialog(true)} size="sm" data-testid="button-add-zone"><Plus className="h-4 w-4 mr-1" />Xavfli Zona</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Bu oyda hodisalar", v: safetySummary?.incidentsThisMonth ?? "—", c: "text-[var(--ep-red)]", icon: AlertTriangle },
          { l: "PPE Compliance", v: safetySummary?.ppeCompliancePercent ? `${safetySummary.ppeCompliancePercent}%` : "—", c: "text-[var(--ep-green)]", icon: HardHat },
          { l: "Muddati o'tgan trening", v: safetySummary?.expiringTrainings ?? "—", c: "text-[var(--ep-primary)]", icon: BookOpen },
          { l: "Ochiq hodisalar", v: safetySummary?.openIncidents ?? "—", c: "text-[var(--ep-blue)]", icon: ShieldAlert },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </div>
            <s.icon className={`h-5 w-5 ${s.c} mt-1`} />
          </CardContent></Card>
        ))}
      </div>

      {deptSafetySummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Bo'limlar bo'yicha Xavfsizlik</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Bo'lim</TableHead><TableHead className="text-center">Jami hodisa</TableHead>
                <TableHead className="text-center">Ochiq</TableHead><TableHead className="text-center">Kritik</TableHead>
                <TableHead className="text-center">Bu oy</TableHead><TableHead className="text-center">PPE %</TableHead>
                <TableHead className="text-center">Treninglar</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(deptSafetySummary) ? deptSafetySummary : []).map((d) => (
                  <TableRow key={d.departmentId || d.departmentName} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{d.departmentName}</TableCell>
                    <TableCell className="text-center">{d.totalIncidents}</TableCell>
                    <TableCell className="text-center">{d.openIncidents > 0 ? <Badge variant="outline" className="text-[var(--ep-primary)]">{d.openIncidents}</Badge> : 0}</TableCell>
                    <TableCell className="text-center">{d.criticalIncidents > 0 ? <Badge variant="destructive">{d.criticalIncidents}</Badge> : 0}</TableCell>
                    <TableCell className="text-center">{d.thisMonthIncidents}</TableCell>
                    <TableCell className="text-center">{d.ppeCompliancePercent !== null ? <span className={d.ppeCompliancePercent >= 80 ? "text-[var(--ep-green)]" : "text-[var(--ep-red)]"}>{d.ppeCompliancePercent}%</span> : "—"}</TableCell>
                    <TableCell className="text-center">{d.expiringTrainings > 0 ? <Badge variant="secondary">{d.expiringTrainings}</Badge> : 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1 border-b border-border pb-0">
        {([
          { key: "incidents", label: "Hodisalar", icon: AlertTriangle },
          { key: "ppe", label: "PPE Compliance", icon: HardHat },
          { key: "trainings", label: "Treninglar", icon: BookOpen },
          { key: "zones", label: "Xavfli Zonalar", icon: MapPin },
        ]).map(t => (
          <button key={t.key} onClick={() => setSafetySubTab(t.key as typeof safetySubTab)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${safetySubTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {safetySubTab === "incidents" && (
        <Card><CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Xodim</TableHead><TableHead>Tur</TableHead><TableHead>Og'irlik</TableHead><TableHead>Sana</TableHead><TableHead>Joylashuv</TableHead><TableHead>Holat</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {incidentsLoading ? <TableRow><TableCell colSpan={7} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow> : (Array.isArray(safetyIncidents) ? safetyIncidents : []).map((inc) => (
                <TableRow key={inc.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{inc.userName || inc.userId}</TableCell>
                  <TableCell><Badge variant="outline">{inc.incidentType}</Badge></TableCell>
                  <TableCell><Badge variant={inc.severity === "critical" ? "destructive" : "secondary"}>{inc.severity}</Badge></TableCell>
                  <TableCell>{inc.incidentDate}</TableCell>
                  <TableCell>{inc.location || "—"}</TableCell>
                  <TableCell><Badge variant={inc.status === "closed" ? "default" : "outline"}>{inc.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {inc.status === "open" && <Button size="sm" variant="outline" onClick={() => updateIncidentStatus.mutate({ id: inc.id, status: "investigating" })}>Ko'rish</Button>}
                      {inc.status === "investigating" && <Button size="sm" variant="outline" onClick={() => updateIncidentStatus.mutate({ id: inc.id, status: "closed" })}>Yopish</Button>}
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteIncidentId(inc.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent></Card>
      )}

      {safetySubTab === "ppe" && (
        <Card><CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Xodim</TableHead><TableHead>PPE Turi</TableHead><TableHead>Mavjudligi</TableHead><TableHead>Tekshirilgan</TableHead><TableHead>Muddat</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ppeLoading ? <TableRow><TableCell colSpan={5} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow> : (Array.isArray(ppeRecords) ? ppeRecords : []).map((rec) => (
                <TableRow key={rec.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{rec.userName || rec.userId}</TableCell>
                  <TableCell>{rec.ppeType}</TableCell>
                  <TableCell>{rec.status === "compliant" ? <Badge><CheckCircle2 className="h-3 w-3 mr-1" />Mos</Badge> : <Badge variant="destructive">Mos emas</Badge>}</TableCell>
                  <TableCell>{rec.issuedDate}</TableCell>
                  <TableCell>{rec.expiryDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent></Card>
      )}

      {safetySubTab === "trainings" && (
        <Card><CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Xodim</TableHead><TableHead>Trening</TableHead><TableHead>Bajarildi</TableHead><TableHead>Muddat</TableHead><TableHead>Muallim</TableHead><TableHead>Holat</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {trainingsLoading ? <TableRow><TableCell colSpan={6} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow> : (Array.isArray(safetyTrainingsList) ? safetyTrainingsList : []).map((tr) => (
                <TableRow key={tr.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{tr.userName || tr.userId}</TableCell>
                  <TableCell>{tr.trainingName}</TableCell>
                  <TableCell>{tr.completedDate || "—"}</TableCell>
                  <TableCell>{tr.expiryDate || "—"}</TableCell>
                  <TableCell>{tr.trainer || "—"}</TableCell>
                  <TableCell><Badge variant={tr.status === "completed" ? "default" : "secondary"}>{tr.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent></Card>
      )}

      {safetySubTab === "zones" && (
        <Card><CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Zona nomi</TableHead><TableHead>Joylashuv</TableHead><TableHead>Xavf turi</TableHead><TableHead>Xavf darajasi</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {zonesLoading ? <TableRow><TableCell colSpan={5} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow> : (Array.isArray(hazardZonesList) ? hazardZonesList : []).map((zone) => (
                <TableRow key={zone.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{zone.zoneName}</TableCell>
                  <TableCell>{zone.location}</TableCell>
                  <TableCell>{zone.hazardType || zone.description}</TableCell>
                  <TableCell><Badge variant={zone.riskLevel === "critical" ? "destructive" : "secondary"}>{zone.riskLevel}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => setConfirmDeleteZoneId(zone.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent></Card>
      )}

      <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">Xavfsizlik Hodisasini Qayd Etish</DialogTitle></DialogHeader>
          <form onSubmit={incidentForm.handleSubmit(d => createIncident.mutate(d as Record<string, unknown>))} className="space-y-4">
            <div className="space-y-2"><Label>Xodim ID</Label><Input {...incidentForm.register("userId")} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tur</Label><Controller control={incidentForm.control} name="incidentType" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="injury">Jarohat</SelectItem><SelectItem value="near_miss">Deyarli hodisa</SelectItem><SelectItem value="violation">Qoidabuzarlik</SelectItem></SelectContent></Select>
              )} /></div>
              <div className="space-y-2"><Label>Og'irlik</Label><Controller control={incidentForm.control} name="severity" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minor">Kichik</SelectItem><SelectItem value="major">Jiddiy</SelectItem><SelectItem value="critical">Kritik</SelectItem></SelectContent></Select>
              )} /></div>
            </div>
            <div className="space-y-1">
          <Label>Sana</Label>
              <Input type="date" {...incidentForm.register("incidentDate")} />
              {incidentForm.formState.errors.incidentDate && <p className="text-xs text-destructive">{incidentForm.formState.errors.incidentDate.message}</p>}
            </div>
            <div className="space-y-1">
          <Label>Tavsif</Label>
              <Input {...incidentForm.register("description")} />
              {incidentForm.formState.errors.description && <p className="text-xs text-destructive">{incidentForm.formState.errors.description.message}</p>}
            </div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setShowIncidentDialog(false)}>Bekor</Button><Button type="submit">Saqlash</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPpeDialog} onOpenChange={setShowPpeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[18px] font-semibold">PPE Yozuvini Qo'shish</DialogTitle></DialogHeader>
          <form onSubmit={ppeForm.handleSubmit(d => createPpe.mutate(d as Record<string, unknown>))} className="space-y-4">
            <div className="space-y-2"><Label>Xodim ID</Label><Input {...ppeForm.register("userId")} /></div>
            <div className="space-y-2"><Label>PPE Turi</Label><Controller control={ppeForm.control} name="ppeType" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="helmet">Kask</SelectItem><SelectItem value="boots">Botinka</SelectItem><SelectItem value="gloves">Qo'lqop</SelectItem></SelectContent></Select>
            )} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Berilgan sana</Label><Input type="date" {...ppeForm.register("issuedDate")} /></div>
              <div className="space-y-2"><Label>Muddati</Label><Input type="date" {...ppeForm.register("expiryDate")} /></div>
            </div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setShowPpeDialog(false)}>Bekor</Button><Button type="submit">Saqlash</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmDeleteIncidentId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteIncidentId(null); }}
        title="Hodisani o'chirish"
        description="Ushbu xavfsizlik hodisasini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteIncidentId !== null) deleteIncident.mutate(confirmDeleteIncidentId); }}
      />
      <ConfirmDialog
        open={confirmDeleteZoneId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteZoneId(null); }}
        title="Xavfli hududni o'chirish"
        description="Ushbu xavfli hududni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteZoneId !== null) deleteHazardZone.mutate(confirmDeleteZoneId); }}
      />
    </div>
  );
}
